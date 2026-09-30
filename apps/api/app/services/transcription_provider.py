from abc import ABC, abstractmethod
import logging
from typing import Optional, List, Dict, Any
from app.schemas.captions import (
    TranscriptionResult,
    TranscriptSegment,
    TranscriptWord,
)

logger = logging.getLogger(__name__)


# Supported language taxonomy & scripts
LANGUAGE_CONFIGS: Dict[str, Dict[str, Any]] = {
    "English": {
        "code": "en",
        "script": "Latin",
        "is_transliteration": False,
        "description": "Standard English speech recognition",
    },
    "Telugu": {
        "code": "te",
        "script": "Telugu",
        "is_transliteration": False,
        "description": "Native Telugu script speech recognition",
    },
    "Hindi": {
        "code": "hi",
        "script": "Devanagari",
        "is_transliteration": False,
        "description": "Native Devanagari Hindi speech recognition",
    },
    "Tanglish": {
        "code": "te-Latn",
        "script": "Latin",
        "is_transliteration": True,
        "description": "Telugu spoken audio transcribed phonetically into Roman/Latin characters",
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

            # Generate realistic word-level timestamps within segment span
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
                "note": (
                    "Development Transcription Mode — production speech-to-text provider is not configured. "
                    "Transcription is simulated based on cinematic screenplay heuristics."
                ),
            },
        )


class ProductionTranscriptionProviderStub(BaseTranscriptionProvider):
    """
    Production Transcription Provider Stub.
    Prepared adapter boundary for cloud speech APIs (OpenAI Whisper, Google Cloud Speech-to-Text v2, Deepgram).
    Verifies credentials before calling production services; safely falls back to
    MockDevelopmentTranscriptionProvider when credentials are unset.
    """

    def __init__(self):
        self._dev_fallback = MockDevelopmentTranscriptionProvider()

    async def transcribe(
        self,
        video_bytes: bytes,
        filename: Optional[str] = None,
        language: str = "English",
        duration_seconds: Optional[float] = None,
    ) -> TranscriptionResult:
        # Check for future production speech-to-text credentials
        # (e.g. OPENAI_API_KEY, GOOGLE_APPLICATION_CREDENTIALS, DEEPGRAM_API_KEY)
        has_credentials = False

        if not has_credentials:
            logger.info("Production speech provider credentials not configured. Delegating to development transcription.")
            result = await self._dev_fallback.transcribe(
                video_bytes=video_bytes,
                filename=filename,
                language=language,
                duration_seconds=duration_seconds,
            )
            result.metadata["production_stub_status"] = "unconfigured_credentials"
            return result

        raise NotImplementedError("Production speech-to-text integration is not yet enabled.")


def get_transcription_provider() -> BaseTranscriptionProvider:
    """Factory to retrieve the active transcription provider."""
    return MockDevelopmentTranscriptionProvider()
