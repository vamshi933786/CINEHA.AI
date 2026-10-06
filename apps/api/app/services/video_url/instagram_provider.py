import os
import glob
import logging
import asyncio
from typing import Optional, Dict, Any, List
from fastapi import HTTPException, status
import yt_dlp

from app.schemas.extraction import VideoURLScriptExtraction
from app.services.video_url.base_provider import BaseVideoURLProvider
from app.services.audio_extractor import get_ffmpeg_binary_path, convert_audio_to_pcm_array
from app.services.transcription_provider import (
    get_local_whisper_model,
    is_local_whisper_available,
)
from app.services.speech_restoration import get_speech_restoration_provider
from app.services.language_processor import transliterate_telugu_text_to_tanglish
from app.schemas.captions import TranscriptSegment

logger = logging.getLogger(__name__)


class InstagramVideoURLProvider(BaseVideoURLProvider):
    """Extraction provider for Instagram Reels, Posts, and Videos."""

    def can_handle(self, platform: str) -> bool:
        return platform.lower() == "instagram"

    async def extract_script(
        self,
        url: str,
        video_id: str,
        target_language: str,
        temp_dir: str,
    ) -> VideoURLScriptExtraction:
        ffmpeg_bin = get_ffmpeg_binary_path() or "/opt/anaconda3/bin/ffmpeg"
        out_template = os.path.join(temp_dir, f"insta_{video_id}.%(ext)s")

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

        # 1. Download audio and extract metadata via yt-dlp
        def _download_and_extract():
            try:
                with yt_dlp.YoutubeDL(ydl_opts) as ydl:
                    info = ydl.extract_info(url, download=True)
                    return info
            except Exception as e:
                logger.error(f"yt-dlp failed to access Instagram URL {url}: {e}")
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Unable to access this video from the supplied URL. The video may be private, restricted, unavailable, or unsupported.",
                )

        info = await asyncio.to_thread(_download_and_extract)

        # 2. Locate extracted audio file in temp_dir
        audio_files = glob.glob(os.path.join(temp_dir, f"insta_{video_id}.*"))
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

            # 3. Transcribe using local Whisper
            target_lang = target_language or "English"
            whisper_lang = "te" if target_lang in ("Telugu", "Tanglish") else ("en" if target_lang == "English" else None)

            model = get_local_whisper_model()

            def _infer():
                segments_iter, infer_info = model.transcribe(
                    audio_array,
                    language=whisper_lang,
                    word_timestamps=False,
                    vad_filter=True,
                )
                return list(segments_iter), infer_info

            segments_raw, infer_info = await asyncio.to_thread(_infer)

            # 4. Parse segments
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

            # Metadata extraction
            title = info.get("title") or (f"Instagram Reel (@{info.get('uploader')})" if info.get("uploader") else f"Instagram Reel ({video_id})")
            creator_name = info.get("uploader") or info.get("channel") or info.get("creator")
            description = info.get("description")
            duration = float(info.get("duration")) if info.get("duration") is not None else round(len(audio_array) / 16000.0, 2)

            if not raw_segments:
                return VideoURLScriptExtraction(
                    source_url=url,
                    platform="Instagram",
                    video_id=video_id,
                    title=title,
                    creator_name=creator_name,
                    description=description,
                    duration_seconds=duration,
                    language=target_lang,
                    transcript="[No spoken dialogue detected in video audio]",
                    segments=[],
                    extraction_method="local_whisper",
                    transcription_provider="local_whisper",
                    confidence=0.5,
                    source_type="video_url",
                    warnings=["No spoken dialogue detected in audio."],
                )

            # 5. Language processing: Telugu restoration & Tanglish transliteration
            extraction_method = "local_whisper"
            final_segments = raw_segments

            if target_lang == "Telugu":
                restorer = get_speech_restoration_provider()
                restored = await restorer.restore_telugu_speech(raw_segments)
                if restored.is_restored:
                    final_segments = restored.segments
                    extraction_method = "hybrid_restoration"

            elif target_lang == "Tanglish":
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
            total_duration = final_segments[-1].end_time if final_segments else duration

            return VideoURLScriptExtraction(
                source_url=url,
                platform="Instagram",
                video_id=video_id,
                title=title,
                creator_name=creator_name,
                description=description,
                duration_seconds=total_duration,
                language=target_lang,
                transcript=transcript_text,
                segments=segments_dict,
                extraction_method=extraction_method,
                transcription_provider="local_whisper",
                confidence=0.94,
                source_type="video_url",
                warnings=[],
            )

        finally:
            # Ephemeral cleanup of extracted audio file
            try:
                if os.path.exists(audio_path):
                    os.remove(audio_path)
            except Exception:
                pass
