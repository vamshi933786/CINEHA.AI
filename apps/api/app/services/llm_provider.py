import json
import uuid
import httpx
from typing import List, Optional, Dict, Any
from app.core.config import settings
from app.schemas.hook import HookItem, VALID_TAXONOMIES

class BaseLLMProvider:
    async def generate_hooks(
        self,
        topic: str,
        niche: str,
        platform: str,
        language: str,
        tones: List[str],
        goals: List[str],
        audience: str,
        categories: List[str],
        count: int,
        context: Optional[str] = "",
    ) -> List[HookItem]:
        raise NotImplementedError

class OfflineHeuristicMockProvider(BaseLLMProvider):
    """
    Offline Heuristic AI Provider.
    Produces high-retention, domain-specific hooks tailored to the creator's
    persona, language, niche, and selected taxonomies without requiring external API tokens.
    """

    TAXONOMY_TEMPLATES = {
        "Curiosity": {
            "en": "You've been using your {topic} wrong this entire time—here is the secret industry pros don't share.",
            "te": "Meeru {topic} gurinchi ee secret telusukunte mee videos next level ki veltayi.",
            "tanglish": "Meeru mee {topic} ni wrong way lo use chestunnaru—industry secret idi.",
            "visual": "Extreme close-up of {topic} in action, followed by a rapid whip-pan to creator addressing camera.",
            "delivery": "Intrigued, conspiratorial, urgent tone with brisk pacing.",
            "intent": "Opens a high-stakes information gap that compels viewer to stay for the revelation.",
        },
        "Contrarian": {
            "en": "Stop buying expensive gear for {topic}. Here is why that ₹50,000 setup is actually holding you back.",
            "te": "Expensive gear konadam aapeyandi! {topic} tho ela cinematic shots teeyalo chudandi.",
            "tanglish": "Stop buying expensive equipment for {topic}! Bedside light tho kuda idi achieve cheyochu.",
            "visual": "Creator waves off camera dismissively while showing a budget setup producing a stunning shot.",
            "delivery": "Assertive, contrarian, confident and direct.",
            "intent": "Disrupts conventional wisdom, generating cognitive dissonance that stops the scroll.",
        },
        "Problem-Solution": {
            "en": "Struggling to get smooth results with {topic}? Fix it in under 5 seconds with this simple physical adjustment.",
            "te": "Mee {topic} tho shaky footage vastunda? Ee 5-second trick tho clear cheyandi.",
            "tanglish": "Mee {topic} shaky ga untunda? Just ee one simple adjustment tho fix cheskondi.",
            "visual": "Split-screen comparison showing shaky attempt on left vs butter-smooth result on right.",
            "delivery": "Empathetic, clear, solution-oriented cadence.",
            "intent": "Immediately validates a recognized creator frustration and promises immediate relief.",
        },
        "Storytelling": {
            "en": "Last week on a commercial shoot, our main {topic} failed—and what we did next changed how I shoot forever.",
            "te": "Monna shoot lo ma {topic} fail aipoindi, kani memu chesina pani natho eppatiki marchipoledu.",
            "tanglish": "Last week commercial shoot lo ma {topic} fail aindi—appudu memu chesina smart move chudandi.",
            "visual": "Behind-the-scenes handheld footage on location, stepping into dramatic studio lighting.",
            "delivery": "Engaging narrative pace, intimate eye contact with lens.",
            "intent": "Leverages narrative transportation to hook emotional investment in the outcome.",
        },
        "Question": {
            "en": "Are you still doing {topic} the old way, or have you tried this modern cinematic workflow?",
            "te": "Meeru inka patha paddhathi lo {topic} chestunnara? Ee modern trick try chesara?",
            "tanglish": "Meeru inka old way lo {topic} chestunnara? Ee quick workflow me kosame.",
            "visual": "Creator points directly at camera lens, holding up {topic} equipment as a visual anchor.",
            "delivery": "Direct, conversational, thought-provoking pause.",
            "intent": "Forces viewer to mentally answer, creating interactive engagement in the opening second.",
        },
        "Bold Statement": {
            "en": "This is the single most overlooked {topic} technique that separates amateurs from professional filmmakers.",
            "te": "Ee okka {topic} technique amateurs ni professionals nunchi divide chestundi.",
            "tanglish": "This is the #1 {topic} technique that literally separates beginner creators from pro DPs.",
            "visual": "Dramatic low-angle shot, rapid cinematic slow-motion B-roll cutaway.",
            "delivery": "Authoritative, serious, deliberate pacing.",
            "intent": "Positions the upcoming lesson as essential high-value expertise.",
        },
        "List / Number": {
            "en": "3 essential {topic} rules you must follow before you press record on your next video.",
            "te": "Mee next video shoot chese mundu ee 3 {topic} rules pakka follow avvandi.",
            "tanglish": "3 golden {topic} rules meeru next video shoot chese mundu telusukovali.",
            "visual": "Three fingers flash onto screen in sync with snappy sound effect text animation.",
            "delivery": "Structured, energetic, fast-paced cadence.",
            "intent": "Numbered items set clear, bite-sized expectations for easy viewer retention.",
        },
        "Fear / Mistake": {
            "en": "The #1 fatal mistake creators make with {topic} that is quietly killing your video retention.",
            "te": "Chala mandi {topic} lo chese pedda mistake idi—dani valla views aagipotayi.",
            "tanglish": "The #1 mistake creators {topic} lo chestaru—idi mee retention ni silent ga kill chestundi.",
            "visual": "Dramatic red tint pulse on camera screen showing a ruined take or bad framing.",
            "delivery": "Warning tone, urgent, protective guidance.",
            "intent": "Triggers loss aversion, motivating viewer to avoid a costly creative error.",
        },
        "Transformation": {
            "en": "Watch what happens when you adjust this single {topic} setting—from flat and boring to cinematic in 3 seconds.",
            "te": "Ee okka {topic} setting marchandi—flat footage instant ga cinematic ga maripotundi.",
            "tanglish": "Ee single {topic} setting change cheste, flat phone video instant ga cinematic ga maripotundi.",
            "visual": "Raw flat color profile footage instantly grade-swapped to rich contrast and deep highlights.",
            "delivery": "Excited, dynamic, demonstrative tone.",
            "intent": "Demonstrates tangible proof of visual transformation within the first 3 seconds.",
        },
    }

    async def generate_hooks(
        self,
        topic: str,
        niche: str,
        platform: str,
        language: str,
        tones: List[str],
        goals: List[str],
        audience: str,
        categories: List[str],
        count: int,
        context: Optional[str] = "",
    ) -> List[HookItem]:
        hooks: List[HookItem] = []
        target_categories = categories or VALID_TAXONOMIES

        lang_key = "en"
        lang_lower = language.lower()
        if "telugu" in lang_lower:
            lang_key = "te"
        elif "tanglish" in lang_lower or "tenglish" in lang_lower:
            lang_key = "tanglish"

        # Determine primary tone
        tone_str = ", ".join(tones[:2]) if tones else "Dynamic"

        index = 0
        while len(hooks) < count:
            cat = target_categories[index % len(target_categories)]
            template_data = self.TAXONOMY_TEMPLATES.get(
                cat, self.TAXONOMY_TEMPLATES["Curiosity"]
            )
            template_text = template_data.get(lang_key, template_data["en"])

            # Clean topic representation
            cleaned_topic = topic.strip().rstrip(".")
            hook_text = template_text.format(topic=cleaned_topic)

            # If looping past original count, introduce slight variation
            loop_round = len(hooks) // len(target_categories)
            if loop_round > 0:
                if lang_key == "en":
                    hook_text = f"Part {loop_round + 1}: {hook_text}"
                elif lang_key == "te":
                    hook_text = f"Gurthu pettukondi: {hook_text}"
                else:
                    hook_text = f"Quick tip: {hook_text}"

            visual = template_data["visual"].format(topic=cleaned_topic)
            delivery = f"{template_data['delivery']} ({tone_str})"
            intent = template_data["intent"]

            hooks.append(
                HookItem(
                    id=f"hook_{uuid.uuid4().hex[:8]}",
                    hook_text=hook_text,
                    category=cat,
                    language=language,
                    platform=platform,
                    delivery_style=delivery,
                    visual_framing=visual,
                    retention_intent=intent,
                )
            )
            index += 1

        return hooks

class GeminiLLMProvider(BaseLLMProvider):
    """
    Google Gemini AI Provider integration.
    Falls back gracefully to OfflineHeuristicMockProvider if API call fails or key is missing.
    """
    def __init__(self, api_key: str):
        self.api_key = api_key
        self.mock_fallback = OfflineHeuristicMockProvider()

    async def generate_hooks(
        self,
        topic: str,
        niche: str,
        platform: str,
        language: str,
        tones: List[str],
        goals: List[str],
        audience: str,
        categories: List[str],
        count: int,
        context: Optional[str] = "",
    ) -> List[HookItem]:
        if not self.api_key:
            return await self.mock_fallback.generate_hooks(
                topic, niche, platform, language, tones, goals, audience, categories, count, context
            )

        # Call Gemini REST endpoint
        try:
            url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={self.api_key}"
            prompt = (
                f"You are an expert short-form video hook scriptwriter. Generate exactly {count} opening hooks for {platform}.\n"
                f"Topic: {topic}\n"
                f"Niche: {niche}\n"
                f"Target Audience: {audience}\n"
                f"Language: {language}\n"
                f"Tones: {', '.join(tones)}\n"
                f"Taxonomies to use: {', '.join(categories or VALID_TAXONOMIES)}\n"
                f"Context: {context}\n\n"
                f"Return ONLY a JSON array of objects with keys: hook_text, category, delivery_style, visual_framing, retention_intent."
            )
            async with httpx.AsyncClient(timeout=15.0) as client:
                res = await client.post(
                    url,
                    json={"contents": [{"parts": [{"text": prompt}]}]},
                    headers={"Content-Type": "application/json"}
                )
                if res.status_code == 200:
                    data = res.json()
                    raw_text = data["candidates"][0]["content"]["parts"][0]["text"]
                    # Extract JSON array
                    start = raw_text.find("[")
                    end = raw_text.rfind("]") + 1
                    if start != -1 and end != -1:
                        items = json.loads(raw_text[start:end])
                        result_hooks: List[HookItem] = []
                        for it in items[:count]:
                            result_hooks.append(
                                HookItem(
                                    id=f"hook_{uuid.uuid4().hex[:8]}",
                                    hook_text=it.get("hook_text", topic),
                                    category=it.get("category", "Curiosity"),
                                    language=language,
                                    platform=platform,
                                    delivery_style=it.get("delivery_style", "Conversational"),
                                    visual_framing=it.get("visual_framing", "Close-up cut to camera"),
                                    retention_intent=it.get("retention_intent", "Captures viewer attention"),
                                )
                            )
                        if result_hooks:
                            return result_hooks
        except Exception:
            pass  # Fall back to heuristic mock

        return await self.mock_fallback.generate_hooks(
            topic, niche, platform, language, tones, goals, audience, categories, count, context
        )

def get_llm_provider() -> BaseLLMProvider:
    if settings.AI_PROVIDER == "gemini" and settings.GEMINI_API_KEY:
        return GeminiLLMProvider(api_key=settings.GEMINI_API_KEY)
    return OfflineHeuristicMockProvider()
