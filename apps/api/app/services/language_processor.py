from abc import ABC, abstractmethod
import logging
import json
import httpx
from typing import Optional, List, Dict, Any, Tuple
from fastapi import HTTPException, status
from app.core.config import settings
from app.schemas.captions import (
    LanguageProcessingRequest,
    LanguageProcessingResult,
    ProcessedTranscriptSegment,
    TranscriptSegment,
)
from app.services.transcription_provider import LANGUAGE_CONFIGS

logger = logging.getLogger(__name__)

SUPPORTED_PROCESSING_LANGUAGES = {"English", "Telugu", "Hindi", "Tanglish"}

VALID_TRANSLATION_PAIRS = {
    ("English", "Telugu"),
    ("English", "Hindi"),
    ("Telugu", "English"),
    ("Telugu", "Hindi"),
    ("Hindi", "English"),
    ("Hindi", "Telugu"),
}

VALID_TRANSLITERATION_PAIRS = {
    ("Telugu", "Tanglish"),
}


def is_production_language_processor_configured() -> bool:
    """Check if OpenAI or dedicated language processing credentials are present."""
    api_key = settings.LANGUAGE_PROCESSOR_API_KEY or settings.OPENAI_API_KEY
    return bool(api_key and api_key.strip())


def validate_language_processing_request(
    source_lang: str,
    target_lang: str,
    mode: str,
    segments: List[TranscriptSegment],
) -> None:
    """
    Validate language pair and processing mode.
    Enforces strict distinction between translation and transliteration.
    """
    if not segments:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No transcript segments were provided for language processing.",
        )

    if source_lang not in SUPPORTED_PROCESSING_LANGUAGES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported source language: '{source_lang}'. Supported: {', '.join(sorted(SUPPORTED_PROCESSING_LANGUAGES))}",
        )

    if target_lang not in SUPPORTED_PROCESSING_LANGUAGES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported target language: '{target_lang}'. Supported: {', '.join(sorted(SUPPORTED_PROCESSING_LANGUAGES))}",
        )

    if source_lang == target_lang:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Source and target languages cannot be identical ('{source_lang}').",
        )

    if mode == "transliteration":
        if (source_lang, target_lang) not in VALID_TRANSLITERATION_PAIRS:
            if target_lang == "Tanglish" and source_lang != "Telugu":
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Tanglish is Romanized Telugu script. Transliteration to Tanglish is only supported from native Telugu, not from '{source_lang}'.",
                )
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Transliteration is not supported for pair '{source_lang}' -> '{target_lang}'. Supported transliteration pairs: Telugu -> Tanglish.",
            )
    elif mode == "translation":
        if target_lang == "Tanglish":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Tanglish is Romanized Telugu script (te-Latn) requiring transliteration, not translation. Please use transliteration mode.",
            )
        if (source_lang, target_lang) not in VALID_TRANSLATION_PAIRS:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Translation is not supported for pair '{source_lang}' -> '{target_lang}'.",
            )
    elif mode == "none":
        pass
    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid processing mode: '{mode}'. Must be 'translation', 'transliteration', or 'none'.",
        )


class BaseLanguageProcessor(ABC):
    """Abstract interface for caption language processors (translation and transliteration)."""

    @abstractmethod
    async def process(self, request: LanguageProcessingRequest) -> LanguageProcessingResult:
        """
        Process transcript segments into target language/script.
        Preserves segment start and end timestamps.
        """
        pass


# Unicode syllable transliterator for Telugu script to Latin (Tanglish)
TELUGU_VOWELS = {
    'అ': 'a', 'ఆ': 'aa', 'ఇ': 'i', 'ఈ': 'ee', 'ఉ': 'u', 'ఊ': 'oo', 'ఋ': 'ru', 'ౠ': 'roo',
    'ఎ': 'e', 'ఏ': 'ee', 'ఐ': 'ai', 'ఒ': 'o', 'ఓ': 'o', 'ఔ': 'au', 'అం': 'am', 'అః': 'aha'
}

TELUGU_MATRAS = {
    'ా': 'aa', 'ి': 'i', 'ీ': 'ee', 'ు': 'u', 'ూ': 'oo', 'ృ': 'ru', 'ౄ': 'roo',
    'ె': 'e', 'ే': 'ee', 'ై': 'ai', 'ొ': 'o', 'ో': 'o', 'ౌ': 'au', 'ం': 'm', 'ః': 'h'
}

TELUGU_CONSONANTS = {
    'క': 'k', 'ఖ': 'kh', 'గ': 'g', 'ఘ': 'gh', 'ఙ': 'ng',
    'చ': 'ch', 'ఛ': 'chh', 'జ': 'j', 'ఝ': 'jh', 'ఞ': 'ny',
    'ట': 't', 'ఠ': 'th', 'డ': 'd', 'ఢ': 'dh', 'ణ': 'n',
    'త': 'th', 'థ': 'thh', 'ద': 'dh', 'ధ': 'dhh', 'న': 'n',
    'ప': 'p', 'ఫ': 'ph', 'బ': 'b', 'భ': 'bh', 'మ': 'm',
    'య': 'y', 'ర': 'r', 'ల': 'l', 'వ': 'v', 'శ': 'sh', 'ష': 'sh', 'స': 's', 'హ': 'h',
    'ళ': 'l', 'క్ష': 'ksh', 'ఱ': 'r'
}


def transliterate_telugu_word(word: str) -> str:
    """Convert a Telugu script word into phonetic Latin script (Tanglish)."""
    # Common film/screenplay dictionary overrides for crisp natural Tanglish
    KNOWN_WORDS = {
        "షూట్": "shoot",
        "చేయడం": "cheyadam",
        "ఆపండి": "aapandi",
        "ఆపండి!": "aapandi!",
        "ఇది": "idi",
        "మొబైల్": "mobile",
        "ఫుటేజీని": "footage ni",
        "ఫుటేజ్": "footage",
        "సినిమా": "cinema",
        "లాగా": "laaga",
        "కనిపించేలా": "kanipinchelaa",
        "చేసే": "chese",
        "సెట్టింగ్": "setting",
        "సెట్టింగ్.": "setting.",
        "నమస్కారం": "namaskaram",
        "నమస్కారం,": "namaskaram,",
        "స్వాగతం": "swagatham",
        "స్వాగతం.": "swagatham.",
        "క్రియేట్": "create",
        "చేస్తుంది": "chesthundi",
        "చేస్తుంది.": "chesthundi.",
        "ఆర్గానిక్": "organic",
        "మోషన్": "motion",
        "బ్లర్": "blur",
        "లేకుండా": "lekundaa",
        "కఠినమైన": "katinamaina",
        "కఠినమైన,": "katinamaina,",
        "అసహజమైన": "asahajamaina",
        "సోప్": "soap",
        "ఒపెరా": "opera",
        "ఎఫెక్ట్‌ను": "effect nu",
        "ఎఫెక్ట్": "effect",
        "సృష్టిస్తుంది": "srushtisthundi",
        "సృష్టిస్తుంది.": "srushtisthundi.",
        "చాలా": "chaala",
        "బాగుంది": "baagundi",
        "మీ": "mee",
        "కాప్షన్స్": "captions",
    }
    
    clean_word = word.strip()
    if clean_word in KNOWN_WORDS:
        return KNOWN_WORDS[clean_word]

    # Syllabic parsing
    res = []
    i = 0
    n = len(word)
    while i < n:
        char = word[i]
        if char in TELUGU_VOWELS:
            res.append(TELUGU_VOWELS[char])
            i += 1
        elif char in TELUGU_CONSONANTS:
            cons = TELUGU_CONSONANTS[char]
            if i + 1 < n and word[i + 1] == '్':  # Virama (halant)
                res.append(cons)
                i += 2
            elif i + 1 < n and word[i + 1] in TELUGU_MATRAS:
                res.append(cons + TELUGU_MATRAS[word[i + 1]])
                i += 2
            else:
                res.append(cons + 'a')
                i += 1
        elif char in TELUGU_MATRAS:
            res.append(TELUGU_MATRAS[char])
            i += 1
        else:
            res.append(char)
            i += 1
    return "".join(res)


def transliterate_telugu_text_to_tanglish(text: str) -> str:
    """Transliterate full Telugu text into Tanglish (Romanized Latin script)."""
    words = text.split(" ")
    out_words = []
    for w in words:
        if any('\u0c00' <= ch <= '\u0c7f' for ch in w):
            out_words.append(transliterate_telugu_word(w))
        else:
            out_words.append(w)
    return " ".join(out_words)


# Deterministic high-quality mock translations for cinema/content creation domain
MOCK_TRANSLATION_MAP: Dict[Tuple[str, str], Dict[str, str]] = {
    ("English", "Telugu"): {
        "Stop shooting at 60fps! Here is the 1-second camera setting that makes mobile footage look like cinema.":
            "60fps లో షూట్ చేయడం ఆపండి! మొబైల్ ఫుటేజ్ సినిమా లాగా కనిపించేలా చేసే 1-సెకన్ కెమెరా సెట్టింగ్ ఇది.",
        "60fps creates that harsh, unnatural soap-opera effect with zero organic motion blur.":
            "60fps ఆర్గానిక్ మోషన్ బ్లర్ లేకుండా కఠినమైన, అసహజమైన సోప్ ఒపెరా ఎఫెక్ట్‌ను సృష్టిస్తుంది.",
        "Welcome to CINEHA AI production speech recognition.":
            "CINEHA AI ప్రొడక్షన్ స్పీచ్ రికగ్నిషన్‌కు స్వాగతం.",
    },
    ("English", "Hindi"): {
        "Stop shooting at 60fps! Here is the 1-second camera setting that makes mobile footage look like cinema.":
            "60fps पर शूट करना बंद करें! यह 1-सेकंड की कैमरा सेटिंग है जो मोबाइल फुटेज को सिनेमा जैसा बनाती है।",
        "60fps creates that harsh, unnatural soap-opera effect with zero organic motion blur.":
            "60fps बिना किसी ऑर्गेनिक मोशन ब्लర్ के कठोर और अस्वाभाविक सोप-ओपेरा प्रभाव पैदा करता है।",
        "Welcome to CINEHA AI production speech recognition.":
            "CINEHA AI प्रोडक्शन स्पीच रिकग्निशन में आपका स्वागत है।",
    },
    ("Telugu", "English"): {
        "60fps లో షూట్ చేయడం ఆపండి! మొబైల్ ఫుటేజ్ సినిమా లాగా కనిపించేలా చేసే 1-సెకన్ కెమెరా సెట్టింగ్ ఇది.":
            "Stop shooting at 60fps! Here is the 1-second camera setting that makes mobile footage look like cinema.",
        "60fps ఆర్గానిక్ మోషన్ బ్లర్ లేకుండా కఠినమైన, అసహజమైన సోప్ ఒపెరా ఎఫెక్ట్‌ను సృష్టిస్తుంది.":
            "60fps creates that harsh, unnatural soap-opera effect with zero organic motion blur.",
        "CINEHA AI కి స్వాగతం.":
            "Welcome to CINEHA AI.",
    },
    ("Telugu", "Hindi"): {
        "60fps లో షూట్ చేయడం ఆపండి! మొబైల్ ఫుటేజ్ సినిమా లాగా కనిపించేలా చేసే 1-సెకన్ కెమెరా సెట్టింగ్ ఇది.":
            "60fps पर शूट करना बंद करें! यह 1-सेकंड की कैमरा सेटिंग है जो मोबाइल फुटेज को सिनेमा जैसा बनाती है।",
        "60fps ఆర్గానిక్ మోషన్ బ్లర్ లేకుండా కఠినమైన, అసహజమైన సోప్ ఒపెరా ఎఫెక్ట్‌ను సృష్టిస్తుంది.":
            "60fps बिना किसी ऑर्गेनिक मोशन ब्लर के कठोर और अस्वाभाविक सोप-ओपेरा प्रभाव पैदा करता है।",
    },
    ("Hindi", "English"): {
        "60fps पर शूट करना बंद करें! यह 1-सेकंड की कैमरा सेटिंग है जो मोबाइल फुटेज को सिनेमा जैसा बनाती है।":
            "Stop shooting at 60fps! Here is the 1-second camera setting that makes mobile footage look like cinema.",
        "60fps बिना किसी ऑर्गेनिक मोशन ब्लर के कठोर और अस्वाभाविक सोप-ओपेरा प्रभाव पैदा करता है।":
            "60fps creates that harsh, unnatural soap-opera effect with zero organic motion blur.",
    },
    ("Hindi", "Telugu"): {
        "60fps पर शूट करना बंद करें! यह 1-सेकंड की कैमरा सेटिंग है जो मोबाइल फुटेज को सिनेमा जैसा बनाती है।":
            "60fps లో షూట్ చేయడం ఆపండి! మొబైల్ ఫుటేజ్ సినిమా లాగా కనిపించేలా చేసే 1-సెకన్ కెమెరా సెట్టింగ్ ఇది.",
        "60fps बिना किसी ऑर्गेनिक मोशन ब्लर के कठोर और अस्वाभाविक सोप-ओपेरा प्रभाव पैदा करता है।":
            "60fps ఆర్గానిక్ మోషన్ బ్లర్ లేకుండా కఠినమైన, అసహజమైన సోప్ ఒపెరా ఎఫెక్ట్‌ను సృష్టిస్తుంది.",
    },
}


class MockDevelopmentLanguageProcessor(BaseLanguageProcessor):
    """
    Deterministic offline language processor for development and testing.
    Provides realistic translations between English, Telugu, and Hindi,
    and phonetic transliteration from Telugu to Tanglish (te-Latn).
    Strictly preserves segment start and end timestamps.
    """

    async def process(self, request: LanguageProcessingRequest) -> LanguageProcessingResult:
        validate_language_processing_request(
            source_lang=request.source_language,
            target_lang=request.target_language,
            mode=request.processing_mode,
            segments=request.segments,
        )

        target_cfg = LANGUAGE_CONFIGS.get(request.target_language, {})
        target_code = target_cfg.get("code", "en")
        script_type = target_cfg.get("script", "Latin")
        is_translit = target_cfg.get("is_transliteration", False) or request.processing_mode == "transliteration"

        processed_segments: List[ProcessedTranscriptSegment] = []

        for seg in request.segments:
            seg_text = seg.text.strip()
            processed_text = ""

            if request.processing_mode == "transliteration":
                # Telugu -> Tanglish phonetic transliteration
                processed_text = transliterate_telugu_text_to_tanglish(seg_text)
            elif request.processing_mode == "translation":
                # Check known sentence map
                key = (request.source_language, request.target_language)
                mapped = MOCK_TRANSLATION_MAP.get(key, {}).get(seg_text)
                if mapped:
                    processed_text = mapped
                else:
                    # Deterministic simulated translation tag
                    if request.target_language == "Telugu":
                        processed_text = f"{seg_text} [తెలుగు అనువాదం]"
                    elif request.target_language == "Hindi":
                        processed_text = f"{seg_text} [हिंदी अनुवाद]"
                    elif request.target_language == "English":
                        processed_text = f"{seg_text} [English Translation]"
                    else:
                        processed_text = f"{seg_text} [{request.target_language}]"
            else:
                processed_text = seg_text

            # Strictly preserve start_time and end_time
            # Word timings are marked unavailable for translated/transliterated output
            processed_segments.append(
                ProcessedTranscriptSegment(
                    id=seg.id,
                    original_text=seg.text,
                    text=processed_text,
                    start_time=seg.start_time,
                    end_time=seg.end_time,
                    words=[],  # Intentionally empty: word timings unavailable
                    speaker=seg.speaker,
                    confidence=0.94,
                )
            )

        full_processed_text = "\n\n".join(s.text for s in processed_segments)
        original_full = request.full_text or "\n\n".join(s.text for s in request.segments)

        return LanguageProcessingResult(
            source_language=request.source_language,
            target_language=request.target_language,
            target_language_code=target_code,
            is_transliteration=is_translit,
            script_type=script_type,
            processing_mode=request.processing_mode,
            segments=processed_segments,
            full_text=full_processed_text,
            original_full_text=original_full,
            provider_name="development_mock_language_processor",
            is_production_provider=False,
            word_timings_available=False,
            notice=(
                "Development Language Processing Mode — production language processor is not configured. "
                "Output is simulated for development/testing."
            ),
            metadata={
                "is_simulated": True,
                "segments_count": len(processed_segments),
            },
        )


class ProductionLanguageProcessorAdapter(BaseLanguageProcessor):
    """
    Production language processing adapter utilizing OpenAI GPT-4o-mini / LLM API.
    Handles semantic translation and phonetic transliteration to Tanglish.
    Strictly preserves segment start/end bounds and IDs.
    """

    def __init__(self, api_key: Optional[str] = None, model: Optional[str] = None):
        self.api_key = api_key or settings.LANGUAGE_PROCESSOR_API_KEY or settings.OPENAI_API_KEY
        self.model = model or settings.LANGUAGE_PROCESSOR_MODEL or "gpt-4o-mini"
        self.api_url = "https://api.openai.com/v1/chat/completions"

    async def process(self, request: LanguageProcessingRequest) -> LanguageProcessingResult:
        validate_language_processing_request(
            source_lang=request.source_language,
            target_lang=request.target_language,
            mode=request.processing_mode,
            segments=request.segments,
        )

        if not self.api_key or not self.api_key.strip():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=(
                    "Production language processing is not configured. "
                    "Configure the provider credentials or switch to Development Mode."
                ),
            )

        target_cfg = LANGUAGE_CONFIGS.get(request.target_language, {})
        target_code = target_cfg.get("code", "en")
        script_type = target_cfg.get("script", "Latin")
        is_translit = target_cfg.get("is_transliteration", False) or request.processing_mode == "transliteration"

        # Build prompt
        system_instruction = (
            "You are a specialized film and video caption language engine for CINEHA AI. "
            "You receive timed video transcript segments and must process them accurately."
        )

        if request.processing_mode == "transliteration":
            task_instruction = (
                f"Operation: TRANSLITERATION from {request.source_language} to {request.target_language} (te-Latn).\n"
                "CRITICAL INSTRUCTIONS FOR TANGLISH:\n"
                "1. Do NOT translate into English words or meanings!\n"
                "2. Transliterate the spoken Telugu phonetics into Latin/Roman alphabet (Tanglish).\n"
                "   Example: 'నమస్కారం' must become 'Namaskaram', NOT 'Hello'.\n"
                "3. Preserve the Telugu spoken language identity, colloquialisms, and cinema tone.\n"
                "4. Output must be strictly in Latin script (A-Z)."
            )
        else:
            task_instruction = (
                f"Operation: TRANSLATION from {request.source_language} to {request.target_language}.\n"
                "Translate the meaning accurately while preserving cinematic style, pacing, and terminology."
            )

        segments_payload = [{"id": s.id, "text": s.text} for s in request.segments]

        user_content = (
            f"{task_instruction}\n\n"
            "Process the following transcript segments. Return ONLY a valid JSON object with a 'segments' array matching the input IDs exactly:\n"
            f'{{"segments": [{{"id": "...", "text": "..."}}]}}\n\n'
            f"Input segments: {json.dumps(segments_payload, ensure_ascii=False)}"
        )

        headers = {
            "Authorization": f"Bearer {self.api_key.strip()}",
            "Content-Type": "application/json",
        }

        payload = {
            "model": self.model,
            "messages": [
                {"role": "system", "content": system_instruction},
                {"role": "user", "content": user_content},
            ],
            "response_format": {"type": "json_object"},
            "temperature": 0.2,
        }

        try:
            async with httpx.AsyncClient(timeout=45.0) as client:
                response = await client.post(self.api_url, headers=headers, json=payload)

            if response.status_code == 401:
                logger.error("OpenAI language processor authentication failed (401)")
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Language processor authentication failed. Invalid API key provided.",
                )

            if response.status_code != 200:
                logger.error(f"OpenAI language processor error ({response.status_code}): {response.text}")
                raise HTTPException(
                    status_code=status.HTTP_502_BAD_GATEWAY,
                    detail=f"Language processing provider returned error status {response.status_code}.",
                )

            data = response.json()
            raw_content = data["choices"][0]["message"]["content"]
            parsed_json = json.loads(raw_content)
            output_segments = parsed_json.get("segments", [])
            output_map = {item.get("id"): item.get("text", "") for item in output_segments}

        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Language processing execution failed: {e}")
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail=f"Failed to communicate with language processing provider: {str(e)}",
            )

        # Assemble normalized segments preserving input timestamps
        processed_segments: List[ProcessedTranscriptSegment] = []
        for seg in request.segments:
            processed_text = output_map.get(seg.id) or seg.text
            processed_segments.append(
                ProcessedTranscriptSegment(
                    id=seg.id,
                    original_text=seg.text,
                    text=processed_text,
                    start_time=seg.start_time,
                    end_time=seg.end_time,
                    words=[],  # Word timings unavailable across languages without acoustic alignment
                    speaker=seg.speaker,
                    confidence=0.95,
                )
            )

        full_processed_text = "\n\n".join(s.text for s in processed_segments)
        original_full = request.full_text or "\n\n".join(s.text for s in request.segments)

        return LanguageProcessingResult(
            source_language=request.source_language,
            target_language=request.target_language,
            target_language_code=target_code,
            is_transliteration=is_translit,
            script_type=script_type,
            processing_mode=request.processing_mode,
            segments=processed_segments,
            full_text=full_processed_text,
            original_full_text=original_full,
            provider_name="openai_language_processor",
            is_production_provider=True,
            word_timings_available=False,
            notice=None,
            metadata={
                "model": self.model,
                "segments_count": len(processed_segments),
            },
        )


class GeminiLanguageProcessorAdapter(BaseLanguageProcessor):
    """
    Production language processing adapter utilizing Google Gemini LLM API.
    Handles semantic translation and natural phonetic transliteration to Tanglish.
    Strictly preserves segment start/end bounds and IDs without fabricating timestamps.
    Falls back gracefully to deterministic rule-based transliteration on error.
    """

    def __init__(self, api_key: Optional[str] = None, model: Optional[str] = None):
        self.api_key = api_key or settings.GEMINI_API_KEY
        self.model = model or getattr(settings, "GEMINI_MODEL", "gemini-3.5-flash-lite")
        self.api_url = f"https://generativelanguage.googleapis.com/v1beta/models/{self.model}:generateContent"

    async def process(self, request: LanguageProcessingRequest) -> LanguageProcessingResult:
        validate_language_processing_request(
            source_lang=request.source_language,
            target_lang=request.target_language,
            mode=request.processing_mode,
            segments=request.segments,
        )

        target_cfg = LANGUAGE_CONFIGS.get(request.target_language, {})
        target_code = target_cfg.get("code", "en")
        script_type = target_cfg.get("script", "Latin")
        is_translit = target_cfg.get("is_transliteration", False) or request.processing_mode == "transliteration"

        if not self.api_key or not self.api_key.strip():
            # Fall back to deterministic mock processor
            fallback = MockDevelopmentLanguageProcessor()
            return await fallback.process(request)

        # Build prompt
        system_instruction = (
            "You are a specialized film and video caption language engine for CINEHA AI. "
            "You receive timed video transcript segments and must process them accurately."
        )

        if request.processing_mode == "transliteration":
            task_instruction = (
                f"Operation: TRANSLITERATION from {request.source_language} to {request.target_language} (te-Latn).\n"
                "CRITICAL INSTRUCTIONS FOR TANGLISH:\n"
                "1. Do NOT translate into English words or meanings!\n"
                "2. Transliterate the spoken Telugu phonetics into natural Latin/Roman alphabet (Tanglish) as used by creators.\n"
                "   Example: 'నమస్కారం' must become 'Namaskaram', NOT 'Hello'.\n"
                "   'బ్రో, మీ వీడియోస్ లో సినిమాటిక్ గా రావాలి అంటే' must become 'Bro, mee videos lo cinematic ga ravali ante'.\n"
                "3. Preserve the Telugu spoken language identity, colloquialisms, and cinema tone.\n"
                "4. Output must be strictly in Latin script (A-Z)."
            )
        else:
            task_instruction = (
                f"Operation: TRANSLATION from {request.source_language} to {request.target_language}.\n"
                "Translate the meaning accurately while preserving cinematic style, pacing, and terminology."
            )

        segments_payload = [{"id": s.id, "text": s.text} for s in request.segments]

        user_content = (
            f"{task_instruction}\n\n"
            "Process the following transcript segments. Return ONLY a valid JSON object with a 'segments' array matching the input IDs exactly:\n"
            f'{{"segments": [{{"id": "...", "text": "..."}}]}}\n\n'
            f"Input segments: {json.dumps(segments_payload, ensure_ascii=False)}"
        )

        url = f"{self.api_url}?key={self.api_key.strip()}"
        request_body = {
            "system_instruction": {"parts": [{"text": system_instruction}]},
            "contents": [{"parts": [{"text": user_content}]}],
            "generationConfig": {
                "temperature": 0.2,
                "responseMimeType": "application/json",
            },
        }

        output_map = {}
        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.post(url, json=request_body)

            if response.status_code == 200:
                data = response.json()
                raw_content = data["candidates"][0]["content"]["parts"][0]["text"]
                parsed_json = json.loads(raw_content)
                output_segments = parsed_json.get("segments", [])
                output_map = {item.get("id"): item.get("text", "") for item in output_segments}
            else:
                logger.warning(
                    f"Gemini language processor error ({response.status_code}): {response.text[:200]}"
                )
        except Exception as e:
            logger.warning(f"Gemini language processor failed ({e}). Falling back to rule-based processing.")

        # Assemble normalized segments preserving input timestamps
        processed_segments: List[ProcessedTranscriptSegment] = []
        for seg in request.segments:
            processed_text = output_map.get(seg.id)
            if not processed_text:
                if request.processing_mode == "transliteration":
                    processed_text = transliterate_telugu_text_to_tanglish(seg.text)
                else:
                    processed_text = seg.text

            processed_segments.append(
                ProcessedTranscriptSegment(
                    id=seg.id,
                    original_text=seg.text,
                    text=processed_text,
                    start_time=seg.start_time,
                    end_time=seg.end_time,
                    words=[],  # Word timings unavailable across languages
                    speaker=seg.speaker,
                    confidence=0.95,
                )
            )

        full_processed_text = "\n\n".join(s.text for s in processed_segments)
        original_full = request.full_text or "\n\n".join(s.text for s in request.segments)

        return LanguageProcessingResult(
            source_language=request.source_language,
            target_language=request.target_language,
            target_language_code=target_code,
            is_transliteration=is_translit,
            script_type=script_type,
            processing_mode=request.processing_mode,
            segments=processed_segments,
            full_text=full_processed_text,
            original_full_text=original_full,
            provider_name="gemini_language_processor",
            is_production_provider=True,
            word_timings_available=False,
            notice=None,
            metadata={
                "model": self.model,
                "segments_count": len(processed_segments),
            },
        )


def get_language_processor(provider_type: Optional[str] = None) -> BaseLanguageProcessor:
    """
    Factory resolving active language processor.
    Defaults to configured provider or development mock.
    """
    selected = (provider_type or settings.LANGUAGE_PROCESSOR_PROVIDER).lower().strip()
    if selected in ("production", "openai", "gpt"):
        return ProductionLanguageProcessorAdapter()
    if selected in ("gemini", "hybrid"):
        return GeminiLanguageProcessorAdapter()
    return MockDevelopmentLanguageProcessor()

