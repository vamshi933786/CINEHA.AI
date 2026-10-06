import re
from typing import Optional

TELUGU_UNICODE_PATTERN = re.compile(r"[\u0C00-\u0C7F]")

# Common Latin-script Tanglish vocabulary and functional markers
TANGLISH_KEYWORDS = {
    # Pronouns & address
    "meeru", "nenu", "manaki", "memu", "vaallu", "veellu", "atanu", "aame",
    "naaku", "meeku", "maaku", "vaallaki", "veellaki", "manaku",
    # Verbs and imperatives
    "chudandi", "cheyandi", "cheyyandi", "aapeyandi", "pettandi", "marchandi",
    "chupinchandi", "chesina", "chestharu", "chesthe", "chestunnaru", "cheyyali",
    "cheppandi", "ivvandi", "teeyandi", "pettukondi", "chesukondi", "chusthe",
    "chustunnaru", "chesanu", "telusukunte", "vellandi", "randi",
    # Auxiliaries & condition
    "unna", "unnaru", "undi", "unde", "undali", "ledu", "leka", "kuda", "kooda",
    # Interrogatives & connectors
    "gurinchi", "enduku", "ela", "evaru", "emi", "chala", "mandi", "mariyu",
    "kani", "kaani", "ayithe", "aithe", "ippude", "appudu", "eppudu",
    # Demonstratives & numbers
    "okka", "oka", "ikkada", "akkada", "veredi", "idi", "adi", "ivi", "avi", "ee", "aa",
    "inka", "malli", "entha", "antha", "chivariki",
    # Common Telugu creator vocabulary
    "tappu", "tappulu", "rahasyam", "nijam", "matrame", "prashna", "vishayam",
}


def normalize_language_contract(lang: Optional[str]) -> str:
    """
    Normalizes any language string to canonical 'English', 'Telugu', or 'Tanglish'.
    Preserves case-insensitive compatibility.
    """
    if not lang:
        return "English"
    cleaned = str(lang).strip().lower()
    if "tanglish" in cleaned or "tenglish" in cleaned or "te-latn" in cleaned:
        return "Tanglish"
    elif "telugu" in cleaned or cleaned == "te" or "తెలుగు" in cleaned:
        return "Telugu"
    elif "english" in cleaned or cleaned == "en":
        return "English"
    return lang.strip().capitalize()


def detect_script_language(text: Optional[str]) -> str:
    """
    Deterministically detects whether text is Telugu Unicode, Tanglish (Latin script), or English.
    Returns: 'Telugu', 'Tanglish', or 'English'.
    """
    if not text or not text.strip():
        return "English"

    # 1. Telugu Unicode characters indicate native Telugu script
    if TELUGU_UNICODE_PATTERN.search(text):
        return "Telugu"

    # 2. Latin-script text: tokenize words
    words = re.findall(r"\b[a-zA-Z']+\b", text.lower())
    if not words:
        return "English"

    direct_hits = sum(1 for w in words if w in TANGLISH_KEYWORDS)
    # Suffix markers (e.g., "videolo", "secondslo", "creatorsthoni", "shootgurinchi")
    suffix_hits = sum(
        1 for w in words
        if len(w) > 4 and (
            w.endswith("lone") or
            w.endswith("lona") or
            w.endswith("tho") or
            w.endswith("gurinchi") or
            w.endswith("kante")
        )
    )
    total_hits = direct_hits + suffix_hits

    # Single hit on very short text (<= 7 words) or >= 2 hits anywhere
    if total_hits >= 2 or (len(words) <= 7 and total_hits >= 1):
        return "Tanglish"

    return "English"


def resolve_script_language(
    explicit_lang: Optional[str] = None,
    script_text: Optional[str] = None,
    creator_profile_lang: Optional[str] = None,
) -> str:
    """
    Resolves the script language adhering to the contract:
    Explicit script language > Creator Profile language preference > Safe fallback detection
    Does not let Creator Profile silently override an explicit language.
    Does not silently assume English if Telugu Unicode or strong Tanglish is detected.
    """
    # 1. Check explicit language if specified
    if explicit_lang and explicit_lang.strip():
        norm = normalize_language_contract(explicit_lang)
        # Guard: If user explicitly left "English" as default, but text clearly has Telugu Unicode,
        # prioritize the actual Telugu script data
        if norm == "English" and script_text and TELUGU_UNICODE_PATTERN.search(script_text):
            return "Telugu"
        return norm

    # 2. Creator Profile preference if script language is not provided
    if creator_profile_lang and creator_profile_lang.strip():
        norm_profile = normalize_language_contract(creator_profile_lang)
        if norm_profile in ("Telugu", "Tanglish"):
            # Verify if text is completely contradictory (e.g. text is explicitly Telugu Unicode but profile is Tanglish)
            if script_text and TELUGU_UNICODE_PATTERN.search(script_text):
                return "Telugu"
            return norm_profile
        return norm_profile

    # 3. Safe fallback detection from script text
    if script_text and script_text.strip():
        return detect_script_language(script_text)

    return "English"
