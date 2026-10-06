import os
import glob
import logging
import asyncio
from typing import Optional, Dict, Any, List
from fastapi import HTTPException, status
import yt_dlp
from youtube_transcript_api import YouTubeTranscriptApi, YouTubeTranscriptApiException

from app.schemas.extraction import VideoURLScriptExtraction
from app.services.video_url.base_provider import BaseVideoURLProvider
from app.services.audio_extractor import get_ffmpeg_binary_path, convert_audio_to_pcm_array
from app.services.transcription_provider import (
    get_local_whisper_model,
    is_local_whisper_available,
    LANGUAGE_CONFIGS,
)
from app.services.speech_restoration import get_speech_restoration_provider
from app.services.language_processor import transliterate_telugu_text_to_tanglish
from app.schemas.captions import TranscriptSegment

logger = logging.getLogger(__name__)


class YouTubeVideoURLProvider(BaseVideoURLProvider):
    """Extraction provider for YouTube videos, Shorts, and embeds."""

    def can_handle(self, platform: str) -> bool:
        return platform.lower() == "youtube"

    async def extract_script(
        self,
        url: str,
        video_id: str,
        target_language: str,
        temp_dir: str,
    ) -> VideoURLScriptExtraction:
        # 1. Fetch metadata via yt-dlp flat extract
        metadata = await self._extract_metadata(url, video_id)

        # 2. Try fetching official / community / auto-generated transcript
        transcript_result = await self._try_fetch_transcript_api(video_id, target_language)
        if transcript_result:
            transcript_result["title"] = metadata.get("title") or transcript_result.get("title")
            transcript_result["creator_name"] = metadata.get("creator_name")
            transcript_result["description"] = metadata.get("description")
            transcript_result["duration_seconds"] = metadata.get("duration_seconds") or transcript_result.get("duration_seconds")
            return VideoURLScriptExtraction(**transcript_result)

        # 3. Fallback to audio extraction & local Whisper transcription
        logger.info(f"YouTube transcript API unavailable for {video_id}. Falling back to local Whisper audio transcription.")
        whisper_result = await self._transcribe_audio_fallback(url, video_id, target_language, temp_dir, metadata)
        return VideoURLScriptExtraction(**whisper_result)

    async def _extract_metadata(self, url: str, video_id: str) -> Dict[str, Any]:
        """Extract lightweight metadata without downloading media."""
        ydl_opts = {
            "quiet": True,
            "no_warnings": True,
            "skip_download": True,
            "extract_flat": True,
            "noplaylist": True,
        }

        def _get_info():
            try:
                with yt_dlp.YoutubeDL(ydl_opts) as ydl:
                    return ydl.extract_info(url, download=False)
            except Exception as e:
                logger.warning(f"yt-dlp metadata extraction failed for YouTube {video_id}: {e}")
                return None

        info = await asyncio.to_thread(_get_info)
        if not info:
            return {
                "title": f"YouTube Video ({video_id})",
                "creator_name": None,
                "description": None,
                "duration_seconds": None,
            }

        return {
            "title": info.get("title") or f"YouTube Video ({video_id})",
            "creator_name": info.get("uploader") or info.get("channel") or info.get("creator"),
            "description": info.get("description"),
            "duration_seconds": float(info.get("duration")) if info.get("duration") is not None else None,
        }

    async def _try_fetch_transcript_api(
        self, video_id: str, target_language: str
    ) -> Optional[Dict[str, Any]]:
        """Attempt to retrieve captions via youtube-transcript-api."""
        target_lang = target_language or "English"
        language_preference = self._resolve_language_preference(target_lang)

        def _fetch_api():
            try:
                ytt = YouTubeTranscriptApi()
                # 1. First try direct fetch with language preferences
                try:
                    fetched = ytt.fetch(video_id, languages=language_preference)
                    raw_data = fetched.to_raw_data() if hasattr(fetched, "to_raw_data") else list(fetched)
                    lang_code = getattr(fetched, "language_code", None)
                    is_generated = getattr(fetched, "is_generated", False)
                    return raw_data, lang_code, is_generated
                except Exception:
                    pass

                # 2. Try listing all available transcripts and picking the best match
                transcript_list = ytt.list(video_id)
                # Find matching transcript
                chosen_transcript = None
                for t in transcript_list:
                    if t.language_code in language_preference:
                        chosen_transcript = t
                        break

                if not chosen_transcript:
                    # Pick first available if none matched preference
                    transcripts = list(transcript_list)
                    if transcripts:
                        chosen_transcript = transcripts[0]

                if chosen_transcript:
                    fetched = chosen_transcript.fetch()
                    raw_data = fetched.to_raw_data() if hasattr(fetched, "to_raw_data") else list(fetched)
                    return raw_data, chosen_transcript.language_code, chosen_transcript.is_generated

                return None, None, False
            except Exception as e:
                logger.debug(f"youtube-transcript-api could not retrieve transcripts for {video_id}: {e}")
                return None, None, False

        raw_snippets, lang_code, is_generated = await asyncio.to_thread(_fetch_api)
        if not raw_snippets:
            return None

        segments: List[Dict[str, Any]] = []
        text_lines: List[str] = []

        for idx, snip in enumerate(raw_snippets):
            if isinstance(snip, dict):
                text = str(snip.get("text", "")).strip()
                start = round(float(snip.get("start", 0.0)), 2)
                duration = round(float(snip.get("duration", 0.0)), 2)
            else:
                text = str(getattr(snip, "text", "")).strip()
                start = round(float(getattr(snip, "start", 0.0)), 2)
                duration = round(float(getattr(snip, "duration", 0.0)), 2)

            if not text:
                continue

            end = round(start + duration, 2)
            # If target language is Tanglish, transliterate Telugu snippets
            if target_lang == "Tanglish" and (lang_code == "te" or any('\u0c00' <= ch <= '\u0c7f' for ch in text)):
                display_text = transliterate_telugu_text_to_tanglish(text)
            else:
                display_text = text

            text_lines.append(display_text)
            segments.append({
                "id": f"seg_{idx}",
                "start": start,
                "end": end,
                "text": display_text,
            })

        if not segments:
            return None

        total_duration = segments[-1]["end"] if segments else None
        transcript_text = "\n\n".join(text_lines)

        return {
            "source_url": f"https://www.youtube.com/watch?v={video_id}",
            "platform": "YouTube",
            "video_id": video_id,
            "title": f"YouTube Video ({video_id})",
            "duration_seconds": total_duration,
            "language": target_lang,
            "transcript": transcript_text,
            "segments": segments,
            "extraction_method": "public_caption" if is_generated else "official_transcript",
            "transcription_provider": "youtube_transcript_api",
            "confidence": 0.98 if not is_generated else 0.92,
            "source_type": "video_url",
            "warnings": [],
        }

    async def _transcribe_audio_fallback(
        self,
        url: str,
        video_id: str,
        target_language: str,
        temp_dir: str,
        metadata: Dict[str, Any],
    ) -> Dict[str, Any]:
        """Download audio stream via yt-dlp and transcribe using local Whisper."""
        ffmpeg_bin = get_ffmpeg_binary_path() or "/opt/anaconda3/bin/ffmpeg"
        out_template = os.path.join(temp_dir, f"{video_id}.%(ext)s")

        ydl_opts = {
            "format": "bestaudio/best",
            "outtmpl": out_template,
            "ffmpeg_location": ffmpeg_bin,
            "quiet": True,
            "no_warnings": True,
            "postprocessors": [
                {
                    "key": "FFmpegExtractAudio",
                    "preferredcodec": "mp3",
                    "preferredquality": "128",
                }
            ],
            "noplaylist": True,
        }

        def _download_audio():
            try:
                with yt_dlp.YoutubeDL(ydl_opts) as ydl:
                    ydl.download([url])
            except Exception as e:
                logger.error(f"yt-dlp audio download failed for {url}: {e}")
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Unable to access this video from the supplied URL. The video may be private, restricted, unavailable, or unsupported.",
                )

        await asyncio.to_thread(_download_audio)

        # Locate downloaded audio file
        audio_files = glob.glob(os.path.join(temp_dir, f"{video_id}.*"))
        if not audio_files:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Unable to access this video from the supplied URL. The video may be private, restricted, unavailable, or unsupported.",
            )

        audio_path = audio_files[0]
        try:
            with open(audio_path, "rb") as f:
                audio_bytes = f.read()

            audio_array = await convert_audio_to_pcm_array(audio_bytes, ffmpeg_bin=ffmpeg_bin)
            if len(audio_array) == 0:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="No audio track was detected in this video.",
                )

            # Transcribe with local faster-whisper
            target_lang = target_language or "English"
            whisper_lang = "te" if target_lang in ("Telugu", "Tanglish") else ("en" if target_lang == "English" else None)

            model = get_local_whisper_model()

            def _infer():
                segments_iter, info = model.transcribe(
                    audio_array,
                    language=whisper_lang,
                    word_timestamps=False,
                    vad_filter=True,
                )
                return list(segments_iter), info

            segments_raw, info = await asyncio.to_thread(_infer)

            # Build timed segments
            raw_segments: List[TranscriptSegment] = []
            for idx, s in enumerate(segments_raw):
                text_clean = s.text.strip()
                if not text_clean:
                    continue
                raw_segments.append(
                    TranscriptSegment(
                        id=f"seg_{idx}",
                        text=text_clean,
                        start_time=round(float(s.start), 2),
                        end_time=round(float(s.end), 2),
                        words=[],
                        speaker="Speaker 1",
                        confidence=0.95,
                    )
                )

            if not raw_segments:
                return {
                    "source_url": url,
                    "platform": "YouTube",
                    "video_id": video_id,
                    "title": metadata.get("title") or f"YouTube Video ({video_id})",
                    "creator_name": metadata.get("creator_name"),
                    "description": metadata.get("description"),
                    "duration_seconds": round(len(audio_array) / 16000.0, 2),
                    "language": target_lang,
                    "transcript": "[No spoken dialogue detected in video audio]",
                    "segments": [],
                    "extraction_method": "local_whisper",
                    "transcription_provider": "local_whisper",
                    "confidence": 0.5,
                    "source_type": "video_url",
                    "warnings": ["No spoken dialogue detected in audio."],
                }

            # Handle Telugu restoration & Tanglish transliteration
            extraction_method = "local_whisper"
            final_segments = raw_segments

            if target_lang == "Telugu":
                restorer = get_speech_restoration_provider()
                restored = await restorer.restore_telugu_speech(raw_segments)
                if restored.is_restored:
                    final_segments = restored.segments
                    extraction_method = "hybrid_restoration"

            elif target_lang == "Tanglish":
                # First restore Telugu if available, then transliterate
                restorer = get_speech_restoration_provider()
                restored = await restorer.restore_telugu_speech(raw_segments)
                source_segs = restored.segments if restored.is_restored else raw_segments
                final_segments = []
                for seg in source_segs:
                    final_segments.append(
                        TranscriptSegment(
                            id=seg.id,
                            text=transliterate_telugu_text_to_tanglish(seg.text),
                            start_time=seg.start_time,
                            end_time=seg.end_time,
                            words=[],
                            speaker=seg.speaker,
                            confidence=seg.confidence,
                        )
                    )
                extraction_method = "hybrid_restoration" if restored.is_restored else "local_whisper"

            segments_dict = [
                {
                    "id": s.id,
                    "start": s.start_time,
                    "end": s.end_time,
                    "text": s.text,
                }
                for s in final_segments
            ]
            transcript_text = "\n\n".join(s.text for s in final_segments)
            total_duration = final_segments[-1].end_time if final_segments else round(len(audio_array) / 16000.0, 2)

            return {
                "source_url": url,
                "platform": "YouTube",
                "video_id": video_id,
                "title": metadata.get("title") or f"YouTube Video ({video_id})",
                "creator_name": metadata.get("creator_name"),
                "description": metadata.get("description"),
                "duration_seconds": total_duration,
                "language": target_lang,
                "transcript": transcript_text,
                "segments": segments_dict,
                "extraction_method": extraction_method,
                "transcription_provider": "local_whisper",
                "confidence": 0.94,
                "source_type": "video_url",
                "warnings": [],
            }

        finally:
            # Ephemeral cleanup of downloaded audio file
            try:
                if os.path.exists(audio_path):
                    os.remove(audio_path)
            except Exception:
                pass

    def _resolve_language_preference(self, language: str) -> List[str]:
        """Maps target language to ordered YouTube caption language codes."""
        lang_lower = language.lower()
        if "telugu" in lang_lower:
            return ["te", "te-IN", "en", "en-US"]
        elif "tanglish" in lang_lower:
            return ["te", "te-IN", "en", "en-US"]
        elif "hindi" in lang_lower:
            return ["hi", "hi-IN", "en", "en-US"]
        else:
            return ["en", "en-US", "en-GB", "te", "hi"]
