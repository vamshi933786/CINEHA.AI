from abc import ABC, abstractmethod
import math
import logging
import asyncio
import threading
import httpx
from typing import Optional, List, Dict, Any
from fastapi import HTTPException, status
from app.core.config import settings
from app.schemas.captions import (
    TranscriptionResult,
    TranscriptSegment,
    TranscriptWord,
)
from app.services.audio_extractor import (
    extract_audio_from_video,
    convert_audio_to_pcm_array,
    NoAudioTrackError,
    FFmpegNotFoundError,
    AudioExtractionError,
)

logger = logging.getLogger(__name__)


# Supported language taxonomy & scripts
LANGUAGE_CONFIGS: Dict[str, Dict[str, Any]] = {
    "English": {
        "code": "en",
        "script": "Latin",
        "is_transliteration": False,
        "description": "Standard English speech recognition",
        "whisper_lang": "en",
    },
    "Telugu": {
        "code": "te",
        "script": "Telugu",
        "is_transliteration": False,
        "description": "Native Telugu script speech recognition",
        "whisper_lang": "te",
    },
    "Hindi": {
        "code": "hi",
        "script": "Devanagari",
        "is_transliteration": False,
        "description": "Native Devanagari Hindi speech recognition",
        "whisper_lang": "hi",
    },
    "Tanglish": {
        "code": "te-Latn",
        "script": "Latin",
        "is_transliteration": True,
        "description": "Telugu spoken audio transcribed phonetically into Roman/Latin characters",
        # Spoken audio is Telugu; transliteration to Latin characters is preserved for downstream processing
        "whisper_lang": "te",
    },
}


class BaseTranscriptionProvider(ABC):
    """Abstract interface defining the speech-to-text / video transcription provider boundary."""

    @abstractmethod
    async def transcribe(
        self,
        video_bytes: bytes,
        filename: Optional[str] = None,
        language: str = "English",
        duration_seconds: Optional[float] = None,
    ) -> TranscriptionResult:
        """
        Transcribe audio track from video bytes into normalized timed segments.
        Must return TranscriptionResult with truthful provider metadata.
        """
        pass


class MockDevelopmentTranscriptionProvider(BaseTranscriptionProvider):
    """
    Deterministic Development Transcription Provider.
    Produces high-fidelity timed segments and micro word-level timestamps
    tailored to the requested language.
    Strictly marked as development/mock so users are never misled into thinking
    real speech-to-text AI is running without configured cloud credentials.
    """

    MOCK_SPEECH_DATA: Dict[str, List[Dict[str, Any]]] = {
        "English": [
            {
                "id": "seg_0",
                "start": 0.0,
                "end": 3.4,
                "speaker": "Speaker 1",
                "text": "Stop shooting at 60fps! Here is the 1-second camera setting that makes mobile footage look like cinema.",
            },
            {
                "id": "seg_1",
                "start": 3.6,
                "end": 7.2,
                "speaker": "Speaker 1",
                "text": "60fps creates that harsh, unnatural soap-opera effect with zero organic motion blur.",
            },
            {
                "id": "seg_2",
                "start": 7.4,
                "end": 11.5,
                "speaker": "Speaker 1",
                "text": "Switch your camera to 24fps and lock your shutter speed to 1/48th of a second.",
            },
            {
                "id": "seg_3",
                "start": 11.8,
                "end": 15.6,
                "speaker": "Speaker 1",
                "text": "Add a subtle directional key light and watch your frame look like an authentic cinematic movie.",
            },
            {
                "id": "seg_4",
                "start": 15.8,
                "end": 18.5,
                "speaker": "Speaker 1",
                "text": "Save this secret setting right now before your next shoot!",
            },
        ],
        "Telugu": [
            {
                "id": "seg_0",
                "start": 0.0,
                "end": 3.8,
                "speaker": "Speaker 1",
                "text": "మీరు 60fps లో వీడియోస్ షూట్ చేయడం ఆపేయండి! మొబైల్ వీడియోలు సినిమాటిక్ గా రావాలంటే ఈ ఒక్క సెట్టింగ్ మార్చండి.",
            },
            {
                "id": "seg_1",
                "start": 4.0,
                "end": 7.6,
                "speaker": "Speaker 1",
                "text": "60fps వల్ల మోషన్ బ్లర్ పోయి వీడియో ఆర్టిఫిషియల్ గా మరియు ఓవర్-షార్ప్ గా కనిపిస్తుంది.",
            },
            {
                "id": "seg_2",
                "start": 7.8,
                "end": 11.4,
                "speaker": "Speaker 1",
                "text": "24fps కి మారి 180 డిగ్రీల షట్టర్ రూల్ ని ఖచ్చితంగా ఫాలో అవ్వండి.",
            },
            {
                "id": "seg_3",
                "start": 11.6,
                "end": 15.8,
                "speaker": "Speaker 1",
                "text": "బ్యాక్‌గ్రౌండ్ లో సాఫ్ట్ డిఫ్యూజ్డ్ లైట్ పెడితే మీ వీడియోకి రియల్ సినిమాటిక్ డెప్త్ వస్తుంది.",
            },
            {
                "id": "seg_4",
                "start": 16.0,
                "end": 19.0,
                "speaker": "Speaker 1",
                "text": "మీ నెక్స్ట్ వీడియో షూట్ కోసం ఈ ఇంపార్టెంట్ టిప్ ని ఇప్పుడే సేవ్ చేసుకోండి!",
            },
        ],
        "Hindi": [
            {
                "id": "seg_0",
                "start": 0.0,
                "end": 3.6,
                "speaker": "Speaker 1",
                "text": "60fps पर वीडियो शूट करना बंद करो! अगर अपने फ़ोन से सिनेमा जैसा लुक चाहते हो तो यह सेटिंग बदलो।",
            },
            {
                "id": "seg_1",
                "start": 3.8,
                "end": 7.5,
                "speaker": "Speaker 1",
                "text": "60fps की वजह से नेचुरल मोशन ब्लर ख़त्म हो जाता है और वीडियो बिल्कुल अननेचुरल लगता है।",
            },
            {
                "id": "seg_2",
                "start": 7.7,
                "end": 11.6,
                "speaker": "Speaker 1",
                "text": "अपने कैमरे को 24fps पर सेट करो और 180 डिग्री शटर रूल लॉक करो।",
            },
            {
                "id": "seg_3",
                "start": 11.9,
                "end": 15.8,
                "speaker": "Speaker 1",
                "text": "एक सॉफ्ट डायरेक्शनल की-लाइट जोड़ो और आपका फ्रेम तुरंत हाई-एंड मूवी जैसा दिखेगा।",
            },
            {
                "id": "seg_4",
                "start": 16.0,
                "end": 18.8,
                "speaker": "Speaker 1",
                "text": "अपने अगले शूट के लिए इस सीक्रेट ट्यूटोरियल को अभी सेव कर लो!",
            },
        ],
        "Tanglish": [
            {
                "id": "seg_0",
                "start": 0.0,
                "end": 3.6,
                "speaker": "Speaker 1",
                "text": "Stop shooting at 60fps! Phone footage lo cinematic feel kavali ante ee 1-second setting ni marchandi.",
            },
            {
                "id": "seg_1",
                "start": 3.8,
                "end": 7.4,
                "speaker": "Speaker 1",
                "text": "60fps valla artificial soap-opera look vastundi, natural motion blur motham potundi.",
            },
            {
                "id": "seg_2",
                "start": 7.6,
                "end": 11.5,
                "speaker": "Speaker 1",
                "text": "Switch to 24fps and 180 degree shutter angle rule ni follow avvandi.",
            },
            {
                "id": "seg_3",
                "start": 11.7,
                "end": 15.6,
                "speaker": "Speaker 1",
                "text": "Background lo soft directional lighting add chesthe mee video authentic cinema laaga untundi.",
            },
            {
                "id": "seg_4",
                "start": 15.8,
                "end": 18.6,
                "speaker": "Speaker 1",
                "text": "Mee next video shoot kosam ee secret tip ni ippude save cheskondi!",
            },
        ],
    }

    async def transcribe(
        self,
        video_bytes: bytes,
        filename: Optional[str] = None,
        language: str = "English",
        duration_seconds: Optional[float] = None,
    ) -> TranscriptionResult:
        lang_config = LANGUAGE_CONFIGS.get(
            language,
            {
                "code": "en",
                "script": "Latin",
                "is_transliteration": False,
                "description": f"Custom language ({language})",
            },
        )

        raw_segments = self.MOCK_SPEECH_DATA.get(language, self.MOCK_SPEECH_DATA["English"])

        segments: List[TranscriptSegment] = []
        full_text_parts: List[str] = []

        for seg_data in raw_segments:
            seg_text = seg_data["text"]
            full_text_parts.append(seg_text)
            seg_start = seg_data["start"]
            seg_end = seg_data["end"]
            words_in_seg = seg_text.split()
            word_count = len(words_in_seg)

            # Generate realistic word-level timestamps within segment span for dev testing
            words: List[TranscriptWord] = []
            if word_count > 0:
                duration_span = max(0.5, seg_end - seg_start)
                time_per_word = duration_span / word_count
                for idx, w in enumerate(words_in_seg):
                    w_start = round(seg_start + (idx * time_per_word), 3)
                    w_end = round(w_start + (time_per_word * 0.9), 3)
                    words.append(
                        TranscriptWord(
                            text=w,
                            start_time=w_start,
                            end_time=w_end,
                            confidence=0.94,
                        )
                    )

            segments.append(
                TranscriptSegment(
                    id=seg_data["id"],
                    text=seg_text,
                    start_time=seg_start,
                    end_time=seg_end,
                    words=words,
                    speaker=seg_data.get("speaker", "Speaker 1"),
                    confidence=0.92,
                )
            )

        total_duration = segments[-1].end_time if segments else 0.0

        return TranscriptionResult(
            language=language,
            language_code=lang_config["code"],
            is_transliteration=lang_config["is_transliteration"],
            script_type=lang_config["script"],
            segments=segments,
            full_text="\n\n".join(full_text_parts),
            duration_seconds=total_duration,
            provider_name="heuristic_dev_transcription",
            is_production_provider=False,
            confidence=0.91,
            metadata={
                "video_filename": filename or "unknown",
                "video_size_bytes": len(video_bytes),
                "is_simulated": True,
                "word_timings_available": True,
                "note": (
                    "Development Transcription Mode — production speech-to-text provider is not configured. "
                    "Transcription is simulated based on cinematic screenplay heuristics."
                ),
            },
        )


class OpenAIWhisperTranscriptionProvider(BaseTranscriptionProvider):
    """
    Concrete Production Audio Transcription Provider using OpenAI Whisper API.
    1. Extracts speech-optimized audio from the uploaded video via ffmpeg.
    2. Transmits audio to Whisper API with requested timestamp granularities (segment & word).
    3. Maps provider output into normalized CINEHA TranscriptionResult.
    4. Guarantees temporary-file cleanup on success, API failure, and exceptions.
    """

    def __init__(
        self,
        api_key: Optional[str] = None,
        model: Optional[str] = None,
        api_url: Optional[str] = None,
    ):
        self.api_key = api_key or settings.WHISPER_API_KEY or settings.OPENAI_API_KEY
        self.model = model or settings.WHISPER_MODEL or "whisper-1"
        self.api_url = api_url or settings.WHISPER_API_URL or "https://api.openai.com/v1/audio/transcriptions"
        self.provider_name = "openai_whisper"
        self.is_production_provider = True

    def is_configured(self) -> bool:
        """Check whether valid API credentials exist."""
        return bool(self.api_key and len(self.api_key.strip()) > 0)

    async def transcribe(
        self,
        video_bytes: bytes,
        filename: Optional[str] = None,
        language: str = "English",
        duration_seconds: Optional[float] = None,
    ) -> TranscriptionResult:
        # 1. Enforce credential check — never fake production transcription
        if not self.is_configured():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=(
                    "Production speech recognition is not configured. Production transcription is not configured. "
                    "Please set OPENAI_API_KEY or WHISPER_API_KEY in apps/api/.env to enable speech-to-text."
                ),
            )

        # 2. Extract speech audio stream from video using local ffmpeg
        clean_filename = filename or "uploaded_video.mp4"
        try:
            audio_result = await extract_audio_from_video(video_bytes, filename=clean_filename)
        except NoAudioTrackError as e:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
        except FFmpegNotFoundError as e:
            raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail=str(e))
        except AudioExtractionError as e:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

        # 3. Determine underlying spoken language
        # For Telugu and Tanglish: spoken audio is Telugu ('te')
        # For English: leave whisper_lang as None to allow Whisper auto-detection of spoken speech
        whisper_lang = None
        if language in ("Telugu", "Tanglish"):
            whisper_lang = "te"
        elif language == "Hindi":
            whisper_lang = "hi"
        # If language == "English": do NOT pass language to allow Whisper auto-detection

        # 4. Construct multipart request payload for Whisper
        headers = {
            "Authorization": f"Bearer {self.api_key}",
        }
        files = {
            "file": ("extracted_audio.mp3", audio_result.audio_bytes, "audio/mpeg"),
        }
        # In httpx, repeated form keys use list values inside a mapping for AsyncClient compatibility
        data: Dict[str, Any] = {
            "model": self.model,
            "response_format": "verbose_json",
            "timestamp_granularities[]": ["word", "segment"],
        }
        if whisper_lang:
            data["language"] = whisper_lang

        # 5. Execute HTTP request to production Whisper API
        try:
            async with httpx.AsyncClient(timeout=120.0) as client:
                response = await client.post(
                    self.api_url,
                    headers=headers,
                    files=files,
                    data=data,
                )
        except httpx.TimeoutException:
            raise HTTPException(
                status_code=status.HTTP_504_GATEWAY_TIMEOUT,
                detail="Production transcription timed out. The audio may be too long or the provider is experiencing high latency.",
            )
        except httpx.RequestError as e:
            logger.error(f"Failed to connect to Whisper API: {e}")
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail="Failed to connect to production transcription provider. Please check network connectivity.",
            )

        # 6. Structured error handling for provider responses
        if response.status_code == 401:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Production transcription authentication failed. Please check the Whisper/OpenAI API key configuration.",
            )
        elif response.status_code == 429:
            error_detail = "Production transcription rate limit exceeded. Please wait a moment and try again."
            try:
                err_json = response.json()
                if isinstance(err_json, dict) and "error" in err_json and "message" in err_json["error"]:
                    error_detail = f"Production transcription rate limit / quota error: {err_json['error']['message']}"
            except Exception:
                pass
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail=error_detail,
            )
        elif response.status_code != 200:
            error_msg = f"Production transcription provider returned error (status {response.status_code})."
            try:
                err_json = response.json()
                if isinstance(err_json, dict) and "error" in err_json and "message" in err_json["error"]:
                    error_msg = f"Transcription provider error: {err_json['error']['message']}"
            except Exception:
                pass
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail=error_msg,
            )

        # 7. Parse and validate JSON response
        try:
            resp_data = response.json()
        except Exception as e:
            logger.error(f"Failed to parse Whisper JSON response: {e}")
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail="Malformed response returned by transcription provider.",
            )

        raw_text = resp_data.get("text", "").strip()
        raw_segments = resp_data.get("segments", [])
        raw_words = resp_data.get("words", [])

        # 8. Extract word timestamps if provided by Whisper
        all_words: List[TranscriptWord] = []
        for w in raw_words:
            w_text = w.get("word", "").strip()
            if w_text:
                all_words.append(
                    TranscriptWord(
                        text=w_text,
                        start_time=round(float(w.get("start", 0.0)), 3),
                        end_time=round(float(w.get("end", 0.0)), 3),
                    )
                )

        # 9. Extract and normalize segments
        segments: List[TranscriptSegment] = []
        for idx, s in enumerate(raw_segments):
            s_start = round(float(s.get("start", 0.0)), 3)
            s_end = round(float(s.get("end", 0.0)), 3)
            s_text = s.get("text", "").strip()

            # Check if segment has word timings directly from provider
            seg_words: List[TranscriptWord] = []
            if "words" in s and isinstance(s["words"], list) and len(s["words"]) > 0:
                for sw in s["words"]:
                    sw_text = sw.get("word", "").strip()
                    if sw_text:
                        seg_words.append(
                            TranscriptWord(
                                text=sw_text,
                                start_time=round(float(sw.get("start", s_start)), 3),
                                end_time=round(float(sw.get("end", s_end)), 3),
                            )
                        )
            elif all_words:
                # Match words belonging to this segment's timing window
                seg_words = [
                    w
                    for w in all_words
                    if (w.start_time >= s_start - 0.05 and w.end_time <= s_end + 0.05)
                ]

            # Approximate confidence from average logprob if available
            confidence = None
            avg_logprob = s.get("avg_logprob")
            if avg_logprob is not None:
                try:
                    confidence = round(max(0.0, min(1.0, math.exp(float(avg_logprob)))), 2)
                except Exception:
                    confidence = None

            segments.append(
                TranscriptSegment(
                    id=f"seg_{idx}",
                    text=s_text,
                    start_time=s_start,
                    end_time=s_end,
                    words=seg_words,
                    speaker=s.get("speaker"),
                    confidence=confidence or 0.95,
                )
            )

        # Fallback if raw text exists but no segments were returned
        if not segments and raw_text:
            duration = float(resp_data.get("duration", 0.0))
            segments.append(
                TranscriptSegment(
                    id="seg_0",
                    text=raw_text,
                    start_time=0.0,
                    end_time=duration,
                    words=all_words,
                    confidence=0.95,
                )
            )

        total_duration = segments[-1].end_time if segments else float(resp_data.get("duration", 0.0))
        # Genuine word timings available ONLY if non-empty word timings were actually returned
        word_timings_available = any(len(s.words) > 0 for s in segments)

        # Determine actual spoken language detected by Whisper
        resp_lang = str(resp_data.get("language", "")).lower()
        if "telugu" in resp_lang or resp_lang == "te":
            detected_language = "Telugu"
            lang_code = "te"
            script_type = "Telugu"
        elif "hindi" in resp_lang or resp_lang == "hi":
            detected_language = "Hindi"
            lang_code = "hi"
            script_type = "Devanagari"
        elif "english" in resp_lang or resp_lang == "en":
            detected_language = "English"
            lang_code = "en"
            script_type = "Latin"
        else:
            lang_cfg = LANGUAGE_CONFIGS.get(language, LANGUAGE_CONFIGS["English"])
            detected_language = language if language != "Tanglish" else "Telugu"
            lang_code = lang_cfg.get("code", "en")
            script_type = lang_cfg.get("script", "Latin")

        # When Tanglish is selected, the raw speech transcription is native Telugu script
        result_lang = "Telugu" if language == "Tanglish" else detected_language
        result_code = "te" if language == "Tanglish" else lang_code
        result_script = "Telugu" if language == "Tanglish" else script_type

        metadata: Dict[str, Any] = {
            "video_filename": clean_filename,
            "provider_model": self.model,
            "word_timings_available": word_timings_available,
            "detected_speech_language": detected_language,
            "extracted_audio_format": audio_result.audio_format,
            "extracted_audio_size_bytes": audio_result.file_size_bytes,
        }

        # Explicit metadata for Tanglish
        if language == "Tanglish":
            metadata["underlying_speech_language"] = "te"
            metadata["transliteration_note"] = (
                "Transcription performed using source speech language (Telugu). "
                "Transliteration into Romanized/Latin script is deferred to downstream processing."
            )

        return TranscriptionResult(
            language=result_lang,
            language_code=result_code,
            is_transliteration=False,
            script_type=result_script,
            segments=segments,
            full_text=raw_text or "\n\n".join(s.text for s in segments),
            duration_seconds=total_duration,
            provider_name=self.provider_name,
            is_production_provider=True,
            confidence=0.95,
            metadata=metadata,
        )


_LOCAL_WHISPER_MODELS: Dict[str, Any] = {}
_LOCAL_MODEL_LOCK = threading.Lock()


def is_local_whisper_available() -> bool:
    """Return True if faster-whisper runtime and numpy are available on this system."""
    try:
        import faster_whisper
        import numpy
        return True
    except ImportError:
        return False


def get_local_whisper_model(model_size: Optional[str] = None):
    """
    Thread-safe model loader and singleton cache for faster-whisper.
    Loads model once per model_size and reuses across requests to avoid reload overhead.
    """
    selected_size = model_size or getattr(settings, "LOCAL_WHISPER_MODEL", "base") or "base"
    if selected_size in _LOCAL_WHISPER_MODELS:
        return _LOCAL_WHISPER_MODELS[selected_size]

    with _LOCAL_MODEL_LOCK:
        if selected_size in _LOCAL_WHISPER_MODELS:
            return _LOCAL_WHISPER_MODELS[selected_size]

        from faster_whisper import WhisperModel

        logger.info(f"Loading local faster-whisper model '{selected_size}' on CPU (int8)...")
        model = WhisperModel(selected_size, device="cpu", compute_type="int8")
        _LOCAL_WHISPER_MODELS[selected_size] = model
        logger.info(f"Local faster-whisper model '{selected_size}' loaded successfully.")
        return model


class LocalWhisperTranscriptionProvider(BaseTranscriptionProvider):
    """
    Free on-device Speech-to-Text Provider powered by faster-whisper (CTranslate2).
    1. Extracts speech audio from video container via FFmpeg.
    2. Converts audio into 16kHz float32 mono PCM numpy array (bypassing PyAV bug).
    3. Executes local faster-whisper inference with word_timestamps=True.
    4. Produces truthful segment and word-level timestamps without network calls or API costs.
    5. Disallows fake/mock fallback — guarantees real speech transcription on actual uploaded media.
    """

    def __init__(self, model_size: Optional[str] = None):
        self.model_size = model_size or getattr(settings, "LOCAL_WHISPER_MODEL", "base") or "base"
        self.provider_name = "local_whisper"
        self.is_production_provider = True

    def is_available(self) -> bool:
        """Check whether local faster-whisper is available for inference."""
        return is_local_whisper_available()

    async def transcribe(
        self,
        video_bytes: bytes,
        filename: Optional[str] = None,
        language: str = "English",
        duration_seconds: Optional[float] = None,
    ) -> TranscriptionResult:
        # 1. Enforce local runtime availability
        if not self.is_available():
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail=(
                    "Local Whisper speech recognition runtime is not available. "
                    "Please ensure 'faster-whisper' and 'ctranslate2' are installed in the backend environment."
                ),
            )

        # 2. Extract speech audio stream from video using local ffmpeg
        clean_filename = filename or "uploaded_video.mp4"
        try:
            audio_result = await extract_audio_from_video(video_bytes, filename=clean_filename)
        except NoAudioTrackError as e:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
        except FFmpegNotFoundError as e:
            raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail=str(e))
        except AudioExtractionError as e:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

        # 3. Decode audio bytes into 16kHz float32 mono PCM array (pure FFmpeg pipe)
        try:
            audio_array = await convert_audio_to_pcm_array(audio_result.audio_bytes)
        except FFmpegNotFoundError as e:
            raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail=str(e))
        except AudioExtractionError as e:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

        if len(audio_array) == 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No audio track was detected in this video.",
            )

        # 4. Determine spoken language code
        whisper_lang = None
        if language in ("Telugu", "Tanglish"):
            whisper_lang = "te"
        elif language == "Hindi":
            whisper_lang = "hi"
        elif language == "English":
            whisper_lang = "en"

        # 5. Run inference inside worker thread (non-blocking for FastAPI event loop)
        try:
            model = get_local_whisper_model(self.model_size)

            def _infer():
                segments_iter, info = model.transcribe(
                    audio_array,
                    language=whisper_lang,
                    word_timestamps=True,
                    vad_filter=True,
                    vad_parameters=dict(min_silence_duration_ms=500),
                )
                return list(segments_iter), info

            segments_raw, info = await asyncio.to_thread(_infer)
        except Exception as e:
            logger.error(f"Local Whisper inference failed: {e}", exc_info=True)
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Local Whisper speech transcription failed: {str(e)}",
            )

        # 6. Parse and normalize segments & word-level timestamps
        segments: List[TranscriptSegment] = []
        full_text_parts: List[str] = []

        for idx, s in enumerate(segments_raw):
            s_text = s.text.strip()
            if not s_text:
                continue
            full_text_parts.append(s_text)
            s_start = round(float(s.start), 3)
            s_end = round(float(s.end), 3)

            seg_words: List[TranscriptWord] = []
            if s.words:
                for w in s.words:
                    w_text = w.word.strip()
                    if w_text:
                        w_prob = getattr(w, "probability", None)
                        seg_words.append(
                            TranscriptWord(
                                text=w_text,
                                start_time=round(float(w.start), 3),
                                end_time=round(float(w.end), 3),
                                confidence=round(float(w_prob), 2) if w_prob is not None else 0.95,
                            )
                        )

            confidence = None
            if hasattr(s, "avg_logprob") and s.avg_logprob is not None:
                try:
                    confidence = round(max(0.0, min(1.0, math.exp(float(s.avg_logprob)))), 2)
                except Exception:
                    confidence = None

            segments.append(
                TranscriptSegment(
                    id=f"seg_{idx}",
                    text=s_text,
                    start_time=s_start,
                    end_time=s_end,
                    words=seg_words,
                    speaker="Speaker 1",
                    confidence=confidence or 0.95,
                )
            )

        total_duration = (
            segments[-1].end_time
            if segments
            else round(float(getattr(info, "duration", 0.0) or (len(audio_array) / 16000.0)), 3)
        )
        word_timings_available = any(len(s.words) > 0 for s in segments)

        # 7. Determine language & script
        resp_lang = str(getattr(info, "language", "") or whisper_lang or "").lower()
        if "telugu" in resp_lang or resp_lang == "te":
            detected_language = "Telugu"
            lang_code = "te"
            script_type = "Telugu"
        elif "hindi" in resp_lang or resp_lang == "hi":
            detected_language = "Hindi"
            lang_code = "hi"
            script_type = "Devanagari"
        elif "english" in resp_lang or resp_lang == "en":
            detected_language = "English"
            lang_code = "en"
            script_type = "Latin"
        else:
            lang_cfg = LANGUAGE_CONFIGS.get(language, LANGUAGE_CONFIGS["English"])
            detected_language = language if language != "Tanglish" else "Telugu"
            lang_code = lang_cfg.get("code", "en")
            script_type = lang_cfg.get("script", "Latin")

        result_lang = "Telugu" if language == "Tanglish" else detected_language
        result_code = "te" if language == "Tanglish" else lang_code
        result_script = "Telugu" if language == "Tanglish" else script_type

        metadata: Dict[str, Any] = {
            "video_filename": clean_filename,
            "provider_model": f"faster_whisper_{self.model_size}",
            "word_timings_available": word_timings_available,
            "detected_speech_language": detected_language,
            "extracted_audio_format": audio_result.audio_format,
            "extracted_audio_size_bytes": audio_result.file_size_bytes,
            "is_local_inference": True,
        }

        if language == "Tanglish":
            metadata["underlying_speech_language"] = "te"
            metadata["transliteration_note"] = (
                "Transcription performed using source speech language (Telugu). "
                "Transliteration into Romanized/Latin script is deferred to downstream processing."
            )

        return TranscriptionResult(
            language=result_lang,
            language_code=result_code,
            is_transliteration=False,
            script_type=result_script,
            segments=segments,
            full_text="\n\n".join(full_text_parts),
            duration_seconds=total_duration,
            provider_name=self.provider_name,
            is_production_provider=True,
            confidence=0.95,
            metadata=metadata,
        )


class ProductionTranscriptionProviderStub(BaseTranscriptionProvider):
    """
    Production Transcription Provider Stub adapter for backward compatibility.
    Directs to OpenAIWhisperTranscriptionProvider when configured.
    Raises HTTPException if credentials are not configured — never silently falls back to mock.
    """

    def __init__(self):
        self._whisper = OpenAIWhisperTranscriptionProvider()

    async def transcribe(
        self,
        video_bytes: bytes,
        filename: Optional[str] = None,
        language: str = "English",
        duration_seconds: Optional[float] = None,
    ) -> TranscriptionResult:
        if not self._whisper.is_configured():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=(
                    "Production speech recognition is not configured. Production transcription is not configured. "
                    "Please set OPENAI_API_KEY or WHISPER_API_KEY in apps/api/.env to enable speech-to-text."
                ),
            )
        return await self._whisper.transcribe(
            video_bytes=video_bytes,
            filename=filename,
            language=language,
            duration_seconds=duration_seconds,
        )


def is_production_transcription_configured() -> bool:
    """Check if production transcription credentials (Whisper/OpenAI) are present."""
    provider = OpenAIWhisperTranscriptionProvider()
    return provider.is_configured()


def get_transcription_provider(provider_type: Optional[str] = None) -> BaseTranscriptionProvider:
    """
    Factory function to retrieve the configured transcription provider.
    Supports:
    - 'local_whisper' / 'local': Free local faster-whisper STT running on device.
    - 'production' / 'openai': Cloud OpenAI Whisper STT API (requires OPENAI_API_KEY).
    - 'mock' / 'development': Strictly reserved for automated unit tests.
    Raises HTTPException if requested provider is unavailable or unconfigured.
    """
    target = (provider_type or settings.TRANSCRIPTION_PROVIDER or "local_whisper").lower().strip()

    if target in ("mock", "development"):
        return MockDevelopmentTranscriptionProvider()

    if target in ("local_whisper", "local", "faster_whisper", "faster-whisper"):
        provider = LocalWhisperTranscriptionProvider()
        if not provider.is_available():
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail=(
                    "Local Whisper speech recognition runtime is not available. "
                    "Please ensure 'faster-whisper' and 'ctranslate2' are installed in the backend environment."
                ),
            )
        return provider

    if target in ("production", "openai", "whisper", "openai_whisper"):
        provider = OpenAIWhisperTranscriptionProvider()
        if not provider.is_configured():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=(
                    "Production speech recognition is not configured. Production transcription is not configured. "
                    "Please set OPENAI_API_KEY or WHISPER_API_KEY in apps/api/.env to enable speech-to-text."
                ),
            )
        return provider

    # Default fallback: prefer local whisper if available, else OpenAI whisper if configured
    if is_local_whisper_available():
        return LocalWhisperTranscriptionProvider()

    provider = OpenAIWhisperTranscriptionProvider()
    if provider.is_configured():
        return provider

    raise HTTPException(
        status_code=status.HTTP_400_BAD_REQUEST,
        detail=f"Unknown or unconfigured transcription provider '{target}'.",
    )

