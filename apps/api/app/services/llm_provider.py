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

    async def generate_script(
        self,
        topic: str,
        platform: str,
        language: str,
        duration_seconds: int,
        tone: str,
        hook: Optional[str] = None,
        cta: Optional[str] = None,
        creator_name: Optional[str] = None,
        niche: Optional[str] = None,
        audience: Optional[str] = None,
        context: Optional[str] = None,
    ) -> Dict[str, Any]:
        raise NotImplementedError

    async def analyze_script_retention(
        self,
        title: str,
        topic: str,
        platform: str,
        language: str,
        duration_seconds: int,
        hook: str,
        segments: List[Dict[str, Any]],
        cta: str,
        niche: Optional[str] = None,
        target_audience: Optional[str] = None,
    ) -> Dict[str, Any]:
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

    async def generate_script(
        self,
        topic: str,
        platform: str,
        language: str,
        duration_seconds: int,
        tone: str,
        hook: Optional[str] = None,
        cta: Optional[str] = None,
        creator_name: Optional[str] = None,
        niche: Optional[str] = None,
        audience: Optional[str] = None,
        context: Optional[str] = None,
    ) -> Dict[str, Any]:
        lang_lower = language.lower()
        if "telugu" in lang_lower:
            lang_key = "te"
        elif "tanglish" in lang_lower or "tenglish" in lang_lower:
            lang_key = "tanglish"
        else:
            lang_key = "en"

        cleaned_topic = topic.strip().rstrip(".")
        resolved_niche = niche or "cinematography"
        resolved_name = creator_name or "Creator"

        # Resolve hook
        if hook and hook.strip():
            final_hook = hook.strip()
        else:
            if lang_key == "te":
                final_hook = f"మీరు మీ {cleaned_topic} విషయంలో ఈ తప్పు చేస్తున్నారా? దీని వల్ల మీ క్వాలిటీ తగ్గిపోతుంది."
            elif lang_key == "tanglish":
                final_hook = f"Meeru mee {cleaned_topic} lo ee common mistake chestunnara? Idi mee footage ni flat ga chestundi."
            else:
                final_hook = f"You are probably making this mistake with {cleaned_topic}—and it is quietly ruining your video quality."

        # Resolve CTA
        if cta and cta.strip():
            final_cta = cta.strip()
        else:
            if lang_key == "te":
                final_cta = f"మరిన్ని {resolved_niche} సీక్రెట్స్ కోసం ఇప్పుడే ఫాలో అవ్వండి."
            elif lang_key == "tanglish":
                final_cta = f"More creative {resolved_niche} tips kosam pakka follow avvandi."
            else:
                final_cta = f"Follow for more {resolved_niche} secrets you won't find anywhere else."

        title = f"{cleaned_topic.title()} — {duration_seconds}s {platform} Masterclass"

        segments = self._build_heuristic_segments(
            cleaned_topic=cleaned_topic,
            platform=platform,
            lang_key=lang_key,
            duration=duration_seconds,
            tone=tone,
            hook=final_hook,
            cta=final_cta,
            niche=resolved_niche,
            creator_name=resolved_name,
            context=context,
        )

        return {
            "title": title,
            "hook": final_hook,
            "segments": segments,
            "cta": final_cta,
            "provider_used": "heuristic_mock",
        }

    def _build_heuristic_segments(
        self,
        cleaned_topic: str,
        platform: str,
        lang_key: str,
        duration: int,
        tone: str,
        hook: str,
        cta: str,
        niche: str,
        creator_name: str,
        context: Optional[str] = None,
    ) -> List[Dict[str, Any]]:
        ctx_note = f" (Context: {context.strip()})" if context and context.strip() else ""

        if duration <= 15:
            if lang_key == "te":
                prob_vo = f"చాలామంది {cleaned_topic} షూట్ చేసేటప్పుడు బేసిక్ సెట్టింగ్స్ మర్చిపోతారు.{ctx_note}"
                sol_vo = "ఇలా చేయండి: లైట్‌ని 45 డిగ్రీల వద్ద పెట్టి, ఎక్స్‌పోజర్ లాక్ చేసి షూట్ చేయండి. డిఫరెన్స్ చూడండి!"
            elif lang_key == "tanglish":
                prob_vo = f"Chala mandi {cleaned_topic} lo basic settings ignore chestaru, anduke footage flat ga untundi.{ctx_note}"
                sol_vo = "Instead idi try cheyandi: Light ni 45 degree angle lo petti exposure lock cheyandi. Instant cinematic look!"
            else:
                prob_vo = f"Most creators rush their {cleaned_topic} setup without checking exposure, getting muddy shots.{ctx_note}"
                sol_vo = "Instead, angle your key light at 45 degrees, lock your exposure, and shoot with backlighting."

            return [
                {
                    "id": "seg_1",
                    "start_time": "0:00",
                    "end_time": "0:03",
                    "section": "HOOK",
                    "voiceover": hook,
                    "visual_direction": f"Tight cinematic close-up of creator holding {cleaned_topic} gear, direct eye contact with lens.",
                    "b_roll": f"Fast cutaway to ruined take demonstrating {cleaned_topic} error.",
                    "on_screen_text": f"STOP DOING THIS WITH {cleaned_topic.upper()} ❌",
                    "audio_direction": "Sharp impact hit sound effect, cut all background ambience.",
                },
                {
                    "id": "seg_2",
                    "start_time": "0:03",
                    "end_time": "0:07",
                    "section": "PROBLEM",
                    "voiceover": prob_vo,
                    "visual_direction": "Over-the-shoulder handheld shot of smartphone camera UI revealing underexposed preview.",
                    "b_roll": "High grain, flat contrast clip showing the bad result.",
                    "on_screen_text": "THE MISTAKE YOU ARE MAKING",
                    "audio_direction": "Muffled bass rumble, tension riser.",
                },
                {
                    "id": "seg_3",
                    "start_time": "0:07",
                    "end_time": "0:12",
                    "section": "SOLUTION",
                    "voiceover": sol_vo,
                    "visual_direction": "Side profile camera movement panning across creator turning on warm key light.",
                    "b_roll": "Split screen: Bad raw sample on left vs glowing cinematic result on right.",
                    "on_screen_text": "THE 3-SECOND FIX 🔥",
                    "audio_direction": "Satisfying whoosh transition into clean upbeat lo-fi groove.",
                },
                {
                    "id": "seg_4",
                    "start_time": "0:12",
                    "end_time": "0:15",
                    "section": "CTA",
                    "voiceover": cta,
                    "visual_direction": "Creator smiles into camera, pointing down towards the follow/subscribe graphic.",
                    "b_roll": "Clean branded animated sticker overlay with handle.",
                    "on_screen_text": "TAP FOLLOW FOR MORE",
                    "audio_direction": "Crisp bell chime with musical tail fade.",
                },
            ]

        elif duration <= 30:
            if lang_key == "te":
                prob_vo = f"మీరు ఖరీదైన కెమెరా కొన్నా కూడా మీ వీడియోలు ఆశించిన స్థాయిలో రావడం లేదా? సమస్య గేర్ కాదు, మీ లైటింగ్ మరియు యాంగిల్.{ctx_note}"
                sol_vo = "ఈ మూడు స్టెప్స్ ఫాలో అవ్వండి: 1. మీ సబ్జెక్ట్‌ని వాల్ నుండి దూరం జరపండి. 2. సాఫ్ట్ కీ లైట్‌ని సైడ్ నుండి వేయండి. 3. బ్యాక్‌గ్రౌండ్‌లో చిన్న ప్రాక్టికల్ లైట్ ఆన్ చేయండి. చూడండి సినిమాటిక్ డెప్త్ ఎలా వచ్చిందో!"
            elif lang_key == "tanglish":
                prob_vo = f"Expensive camera unna kuda video cinematic ga ravatleda? Real problem gear kadu, mee lighting & composition.{ctx_note}"
                sol_vo = "Ee 3 golden steps gurthupettukondi: First, subject ni wall nunchi 3 feet move cheyandi. Second, key light at 45 degrees. Third, background lo warm accent light. Look at that depth!"
            else:
                prob_vo = f"You don't need an expensive camera to get movie-quality footage. The real reason your shots look amateur is improper contrast and lighting.{ctx_note}"
                sol_vo = "Here is the pro formula: Step one, separate your subject at least 3 feet from the wall. Step two, diffuse your key light at 45 degrees. Step three, add a warm practical lamp behind you for depth."

            return [
                {
                    "id": "seg_1",
                    "start_time": "0:00",
                    "end_time": "0:03",
                    "section": "HOOK",
                    "voiceover": hook,
                    "visual_direction": f"Dramatic crash zoom onto creator addressing camera, holding {cleaned_topic} prop.",
                    "b_roll": f"Microsecond flash cut of professional vs beginner {cleaned_topic} shot.",
                    "on_screen_text": f"THE TRUTH ABOUT {cleaned_topic.upper()}",
                    "audio_direction": "Heavy cinematic boom / sub-drop.",
                },
                {
                    "id": "seg_2",
                    "start_time": "0:03",
                    "end_time": "0:10",
                    "section": "PROBLEM",
                    "voiceover": prob_vo,
                    "visual_direction": "Slow dolly out showing a messy studio setup with confusing lighting.",
                    "b_roll": "Side-by-side b-roll of harsh direct overhead light vs controlled diffusion.",
                    "on_screen_text": "STOP BLAMING YOUR GEAR 🚫",
                    "audio_direction": "Muted low-pass filtered audio building subtle tension.",
                },
                {
                    "id": "seg_3",
                    "start_time": "0:10",
                    "end_time": "0:25",
                    "section": "SOLUTION",
                    "voiceover": sol_vo,
                    "visual_direction": "Dynamic whip pan demonstrating each step physically in the frame with arrows and lighting cues.",
                    "b_roll": "Stunning slow motion b-roll of glowing rim lighting and rich shadows.",
                    "on_screen_text": "THE 3-STEP FORMULA 🎬",
                    "audio_direction": "High-energy rhythmic beat kicks in with synths.",
                },
                {
                    "id": "seg_4",
                    "start_time": "0:25",
                    "end_time": "0:30",
                    "section": "CTA",
                    "voiceover": cta,
                    "visual_direction": "Creator steps into center frame, smiling, presenting social handle card.",
                    "b_roll": "Animated end-screen call to action with save & share badges.",
                    "on_screen_text": "SAVE THIS FOR YOUR NEXT SHOOT 📌",
                    "audio_direction": "Punchy hit, music resolves on tonic chord.",
                },
            ]

        elif duration <= 45:
            if lang_key == "te":
                prob_vo = f"చాలామంది క్రియేటర్స్ చేసే అతిపెద్ద తప్పు ఏంటంటే, సబ్జెక్ట్ మీద మాత్రమే దృష్టి పెట్టి బ్యాక్‌గ్రౌండ్‌ని వదిలేస్తారు.{ctx_note}"
                break_vo = f"దీన్ని సరిదిద్దడానికి మూడు రూల్స్: ముందుగా మీ వైట్ బ్యాలెన్స్ లాక్ చేయండి, కలర్ టెంపరేచర్ స్థిరీకరించండి, మరియు {tone} స్టైల్ కోసం షాడోస్ కాంట్రాస్ట్‌ని పెంచండి."
            elif lang_key == "tanglish":
                prob_vo = f"Chala mandi creators chese biggest mistake: Subject paina matrame focus chesi environment lighting neglect chestaru.{ctx_note}"
                break_vo = f"Fix cheyadaniki 3 pro rules: First, white balance lock cheyandi. Second, manual focus use cheyandi. Third, {tone} vibe kosam negative fill add cheyandi. Instant cinematic feel!"
            else:
                prob_vo = f"The number one error creators make is neglecting background separation and relying purely on automatic camera settings.{ctx_note}"
                break_vo = f"Here is the deep-dive fix: First, lock your white balance and shutter angle. Second, introduce negative fill on the shadow side to create dimensional contrast for that authentic {tone} look."

            return [
                {
                    "id": "seg_1",
                    "start_time": "0:00",
                    "end_time": "0:04",
                    "section": "HOOK",
                    "voiceover": hook,
                    "visual_direction": f"High angle establishing cut zooming swiftly toward creator with {cleaned_topic}.",
                    "b_roll": "Rapid before/after match cut showing visual difference.",
                    "on_screen_text": f"DO NOT IGNORE THIS IN {cleaned_topic.upper()}",
                    "audio_direction": "Fast cinematic riser dropping into punchy groove.",
                },
                {
                    "id": "seg_2",
                    "start_time": "0:04",
                    "end_time": "0:15",
                    "section": "THE PROBLEM",
                    "voiceover": prob_vo,
                    "visual_direction": "Handheld jitter demonstration highlighting common amateur mistakes.",
                    "b_roll": "Close-up of monitor showing harsh glare and lost dynamic range.",
                    "on_screen_text": "WHY MOST VIDEOS LOOK CHEAP 📉",
                    "audio_direction": "Subtle bass throb, tense undertone.",
                },
                {
                    "id": "seg_3",
                    "start_time": "0:15",
                    "end_time": "0:35",
                    "section": "CORE BREAKDOWN",
                    "voiceover": break_vo,
                    "visual_direction": "Smooth motorized slider shot gliding across the studio set showing the corrected lighting arrangement.",
                    "b_roll": "Macro footage of camera lens settings and lighting fixtures in action.",
                    "on_screen_text": "PRO MASTERCLASS BREAKDOWN 💡",
                    "audio_direction": "Energetic electronic beat swells with rhythmic hi-hats.",
                },
                {
                    "id": "seg_4",
                    "start_time": "0:35",
                    "end_time": "0:45",
                    "section": "CTA & RECAP",
                    "voiceover": cta,
                    "visual_direction": "Creator turns toward camera, smiling, gesturing to subscribe/follow prompt on screen.",
                    "b_roll": "Clean lower third with profile handle and notification bell animation.",
                    "on_screen_text": "FOLLOW & SHARE WITH A CREATOR",
                    "audio_direction": "Bright melodic chime and smooth musical outro.",
                },
            ]

        elif duration <= 60:
            if lang_key == "te":
                prob_vo = f"చాలామంది క్రియేటర్స్ {cleaned_topic} లో బేసిక్స్ పట్టించుకోకుండా వ్యూస్ రావాలని ఆశిస్తారు. అసలు కారణం ఇక్కడ ఉంది.{ctx_note}"
                step_vo = "స్టెప్ 1: లైటింగ్ సెటప్ మార్చండి. స్టెప్ 2: మైక్ ప్లేస్‌మెంట్ సరిచేయండి. ఆడియో క్లారిటీ వీడియో క్వాలిటీ కంటే ముఖ్యం."
                tip_vo = "ప్రో సీక్రెట్: మీ వీడియోలోని మొదటి 3 సెకన్లలో కనీసం రెండు విజువల్ కట్స్ ఉండేలా చూసుకోండి. ఇది రిటెన్షన్‌ని 40% పెంచుతుంది."
            elif lang_key == "tanglish":
                prob_vo = f"Chala mandi {cleaned_topic} lo basic fundamentals skip chesi expensive gear meeda blame vestaru.{ctx_note}"
                step_vo = "Step 1: Proper key light placement at 45 degrees. Step 2: Clear audio—audio is 60% of video retention."
                tip_vo = "Secret DP hack: First 3 seconds lo 2 camera angle shifts ivvandi. Idi viewer attention ni screen ki lock chestundi."
            else:
                prob_vo = f"Most creators obsess over viral hooks but lose 70% of viewers in the first 10 seconds because the production value collapses.{ctx_note}"
                step_vo = "Step 1: Craft directional depth with key and rim lighting. Step 2: Prioritize pristine audio—bad audio destroys watch time faster than bad video."
                tip_vo = "Pro insider hack: Always include a micro-movement or visual pattern interrupt every 4 seconds to keep average percentage viewed above 80%."

            return [
                {
                    "id": "seg_1",
                    "start_time": "0:00",
                    "end_time": "0:05",
                    "section": "HOOK",
                    "voiceover": hook,
                    "visual_direction": f"Punchy push-in camera move on creator holding {cleaned_topic} equipment.",
                    "b_roll": "Split second teaser of gorgeous final result footage.",
                    "on_screen_text": f"THE 60-SECOND {cleaned_topic.upper()} BLUEPRINT",
                    "audio_direction": "High impact orchestral boom into steady pulse.",
                },
                {
                    "id": "seg_2",
                    "start_time": "0:05",
                    "end_time": "0:18",
                    "section": "THE HIDDEN MISTAKE",
                    "voiceover": prob_vo,
                    "visual_direction": "Creator walks across the studio floor explaining with relatable hand gestures.",
                    "b_roll": "Clips of ruined takes, out-of-focus subjects, and muddy shadows.",
                    "on_screen_text": "WHERE 70% OF CREATORS FAIL ⚠️",
                    "audio_direction": "Low ambient pulse with heartbeat sound effect.",
                },
                {
                    "id": "seg_3",
                    "start_time": "0:18",
                    "end_time": "0:38",
                    "section": "STEP-BY-STEP SOLUTION",
                    "voiceover": step_vo,
                    "visual_direction": "Multi-angle dynamic cuts showing step 1 and step 2 execution with animated highlight boxes.",
                    "b_roll": "Ultra-crisp 4K macro footage of microphone diaphragm and diffused lighting softbox.",
                    "on_screen_text": "THE 2-STEP FIX (LIGHT + AUDIO) 🎥",
                    "audio_direction": "Upbeat synth wave track elevates energy.",
                },
                {
                    "id": "seg_4",
                    "start_time": "0:38",
                    "end_time": "0:52",
                    "section": "PRO SECRET TECHNIQUE",
                    "voiceover": tip_vo,
                    "visual_direction": "Creator leans in close to the lens in a conspiratorial whisper framing.",
                    "b_roll": "Rapid montage of pattern interrupts, text pop-ins, and sound effects working in harmony.",
                    "on_screen_text": "SECRET RETENTION MULTIPLIER ⚡️",
                    "audio_direction": "Vinyl scratch followed by rhythmic drop.",
                },
                {
                    "id": "seg_5",
                    "start_time": "0:52",
                    "end_time": "1:00",
                    "section": "CTA",
                    "voiceover": cta,
                    "visual_direction": "Creator pulls back to medium shot, smiling, delivering confident call to action.",
                    "b_roll": "End card with creator handle and next episode teaser graphic.",
                    "on_screen_text": "SAVE & FOLLOW FOR PART 2",
                    "audio_direction": "Triumphant musical swell, clean fade out.",
                },
            ]

        else:
            # 90s: 6 comprehensive segments
            if lang_key == "te":
                prob_vo = f"వీడియో ప్రొడక్షన్‌లో {cleaned_topic} గురించి చాలా అపోహలు ఉన్నాయి. చాలామంది బడ్జెట్ ఎక్కువ ఉండాలని అనుకుంటారు.{ctx_note}"
                frame_vo = "నిజమైన ఫ్రేమ్‌వర్క్: కంపోజిషన్, లైటింగ్, మరియు స్టోరీటెల్లింగ్. ఈ మూడు కలిస్తే మొబైల్ వీడియో కూడా హాలీవుడ్ లెవెల్‌లో ఉంటుంది."
                demo_vo = "ఇక్కడ ప్రాక్టికల్‌గా చూపిస్తున్నాను: బ్యాక్‌గ్రౌండ్ నుండి దూరం ఉండండి, కాంట్రాస్ట్ రేషియో సరిచేయండి, మరియు 24fps సినిమాటిక్ షట్టర్ రూల్ వాడండి."
                trans_vo = "ఫైనల్ రిజల్ట్ చూడండి: నార్మల్ ఫోన్ వీడియో నుండి సినిమాటిక్ మాస్టర్‌పీస్‌గా ఎలా మారిపోయిందో!"
            elif lang_key == "tanglish":
                prob_vo = f"{cleaned_topic} gurinchi chala myths unnay industry lo. Creators anukuntaru lakhs of rupees setup undali ani.{ctx_note}"
                frame_vo = "Real framework 3 pillars: Composition, lighting contrast, and intentional movement. Phone unna cinema level teeyochu."
                demo_vo = "Practical demo chudandi: Subject distance, 45 degree key light with soft diffusion, and 180-degree shutter rule."
                trans_vo = "Final transformation chudandi: Mundu flat ga unna footage ipudu rich, deep cinematic frame ga marindi!"
            else:
                prob_vo = f"There are so many misconceptions around {cleaned_topic}. Beginners think they need high-end cinema lenses before they can produce stunning work.{ctx_note}"
                frame_vo = "The real professional framework rests on three pillars: Intentional composition, directional contrast, and deliberate motion blur."
                demo_vo = "Here is the exact setup: Separate your subject from the set, position your key light through heavy diffusion, and lock manual shutter at 1/50s."
                trans_vo = "Look at the side-by-side transformation: What began as flat mobile footage is now rich, moody, and undeniably cinematic."

            return [
                {
                    "id": "seg_1",
                    "start_time": "0:00",
                    "end_time": "0:06",
                    "section": "HOOK",
                    "voiceover": hook,
                    "visual_direction": f"Cinematic dolly-in shot revealing creator on film set with {cleaned_topic} gear.",
                    "b_roll": "Flash forward 2-second teaser of the breathtaking finished shot.",
                    "on_screen_text": f"THE DEFINITIVE {cleaned_topic.upper()} GUIDE",
                    "audio_direction": "Deep dramatic cinema bass drop.",
                },
                {
                    "id": "seg_2",
                    "start_time": "0:06",
                    "end_time": "0:20",
                    "section": "CONTEXT & MYTHS",
                    "voiceover": prob_vo,
                    "visual_direction": "Creator walks through studio set, gesturing at camera and lighting stands.",
                    "b_roll": "Fast cuts of overly expensive cinema gear with big price tags crossed out.",
                    "on_screen_text": "THE BIGGEST LIE IN CREATION 🚫",
                    "audio_direction": "Ticking clock effect under subtle string melody.",
                },
                {
                    "id": "seg_3",
                    "start_time": "0:20",
                    "end_time": "0:45",
                    "section": "THE 3-PILLAR FRAMEWORK",
                    "voiceover": frame_vo,
                    "visual_direction": "Dynamic 3D-style on-screen diagrams demonstrating lighting ratios and rule of thirds grid.",
                    "b_roll": "Overhead studio plan graphic highlighting angle of light.",
                    "on_screen_text": "THE 3-PILLAR MASTER FORMULA 📐",
                    "audio_direction": "Clean electronic beat builds with ambient pads.",
                },
                {
                    "id": "seg_4",
                    "start_time": "0:45",
                    "end_time": "1:10",
                    "section": "REAL-WORLD DEMO",
                    "voiceover": demo_vo,
                    "visual_direction": "Over-the-shoulder and side profile dual angle showing camera dials turning and lights powering on.",
                    "b_roll": "Macro footage of camera shutter speed dial set to 1/50s.",
                    "on_screen_text": "STEP-BY-STEP LIVE DEMO 🎥",
                    "audio_direction": "Driving bassline and snare groove.",
                },
                {
                    "id": "seg_5",
                    "start_time": "1:10",
                    "end_time": "1:22",
                    "section": "TRANSFORMATION & RESULTS",
                    "voiceover": trans_vo,
                    "visual_direction": "Fullscreen cinematic before-and-after slider wipe revealing rich golden-hour grade.",
                    "b_roll": "Slow motion 60fps B-roll beauty shots with floating dust particles in back light.",
                    "on_screen_text": "BEFORE VS AFTER RESULTS ✨",
                    "audio_direction": "Uplifting crescendo with soaring synth lead.",
                },
                {
                    "id": "seg_6",
                    "start_time": "1:22",
                    "end_time": "1:30",
                    "section": "CTA & WRAP-UP",
                    "voiceover": cta,
                    "visual_direction": "Creator faces camera with confidence, inviting viewer to comment their biggest hurdle.",
                    "b_roll": "End card with social handle, subscribe icon, and save reminder.",
                    "on_screen_text": "FOLLOW & COMMENT 'CINEMA' FOR PRESETS",
                    "audio_direction": "Warm musical resolve with gentle fade.",
                },
            ]

    async def analyze_script_retention(
        self,
        title: str,
        topic: str,
        platform: str,
        language: str,
        duration_seconds: int,
        hook: str,
        segments: List[Dict[str, Any]],
        cta: str,
        niche: Optional[str] = None,
        target_audience: Optional[str] = None,
    ) -> Dict[str, Any]:
        def _to_sec(val: Any) -> float:
            try:
                parts = str(val).strip().split(":")
                if len(parts) == 2:
                    return float(parts[0]) * 60 + float(parts[1])
                elif len(parts) == 3:
                    return float(parts[0]) * 3600 + float(parts[1]) * 60 + float(parts[2])
                return float(val)
            except Exception:
                return 0.0

        total_words = 0
        detected_fillers: List[str] = []
        filler_candidates = [
            "basically", "actually", "literally", "honestly", "you know",
            "kind of", "sort of", "in this video", "hey guys", "like and subscribe",
            "without further ado", "as you can see", "so yeah", "just want to"
        ]

        segment_stats = []
        for idx, seg in enumerate(segments):
            vo = seg.get("voiceover", "")
            words = vo.split()
            seg_word_count = len(words)
            total_words += seg_word_count

            vo_lower = vo.lower()
            for fc in filler_candidates:
                if fc in vo_lower and fc not in detected_fillers:
                    detected_fillers.append(fc)

            s_sec = _to_sec(seg.get("start_time", "0:00"))
            e_sec = _to_sec(seg.get("end_time", "0:03"))
            seg_dur = max(e_sec - s_sec, 1.0)
            wps = round(seg_word_count / seg_dur, 2)
            segment_stats.append({
                "idx": idx,
                "id": seg.get("id", f"seg_{idx+1}"),
                "time_range": f"{seg.get('start_time', '0:00')}–{seg.get('end_time', '0:03')}",
                "section": seg.get("section", "BEAT"),
                "words": seg_word_count,
                "dur": seg_dur,
                "wps": wps,
                "has_visual": bool(seg.get("visual_direction")),
                "has_text": bool(seg.get("on_screen_text")),
                "has_broll": bool(seg.get("b_roll")),
                "has_audio": bool(seg.get("audio_direction")),
            })

        overall_wps = round(total_words / max(duration_seconds, 1), 2)
        if overall_wps > 3.6:
            pacing_assessment = f"Fast pacing ({overall_wps} wps) — rapid delivery requiring viewer focus"
        elif overall_wps < 1.8:
            pacing_assessment = f"Slow pacing ({overall_wps} wps) — risks viewer boredom"
        else:
            pacing_assessment = f"Optimal pacing ({overall_wps} wps) — matches native short-form cadence"

        hook_dur = segment_stats[0]["dur"] if segment_stats else 3.0
        cta_dur = segment_stats[-1]["dur"] if segment_stats else 3.0

        # 1. Hook Clarity
        hook_word_count = len(hook.split())
        if 5 <= hook_word_count <= 18:
            hook_clarity_score = 92
            hook_clarity_rating = "Excellent"
            hook_clarity_expl = f"Opening hook is concise ({hook_word_count} words) and establishes instant contextual clarity within 2 seconds."
        elif hook_word_count > 24:
            hook_clarity_score = 68
            hook_clarity_rating = "Needs Improvement"
            hook_clarity_expl = f"Opening hook ({hook_word_count} words) is too wordy for the 0–3s retention window; consider trimming auxiliary words."
        else:
            hook_clarity_score = 78
            hook_clarity_rating = "Good"
            hook_clarity_expl = f"Opening hook has reasonable clarity ({hook_word_count} words) but could communicate the core subject faster."

        # 2. Hook Strength
        power_triggers = ["mistake", "ruin", "secret", "never", "why", "truth", "stop", "wrong", "hack", "trick", "fail", "instead", "don't", "nobody", "kill", "setting", "flaw", "shocking", "save", "తప్పు", "రహస్యం"]
        hook_lower = hook.lower()
        trigger_matches = [pt for pt in power_triggers if pt in hook_lower]
        if len(trigger_matches) >= 2 or "?" in hook or "stop" in hook_lower:
            hook_strength_score = 94
            hook_strength_rating = "Exceptional"
            hook_strength_expl = f"High psychological friction with scroll-stopping triggers ({', '.join(trigger_matches[:3]) or 'urgency cue'})."
        elif len(trigger_matches) == 1:
            hook_strength_score = 84
            hook_strength_rating = "Good"
            hook_strength_expl = f"Effective opening hook with recognized psychological trigger ('{trigger_matches[0]}')."
        else:
            hook_strength_score = 72
            hook_strength_rating = "Moderate"
            hook_strength_expl = "Opening hook states the premise but lacks an urgent curiosity trigger or contrarian hook angle."

        # 3. Story / Pacing Progression
        sections_found = [s["section"].upper() for s in segment_stats]
        has_hook = any("HOOK" in s for s in sections_found)
        has_problem = any("PROBLEM" in s or "MISTAKE" in s or "CONTEXT" in s for s in sections_found)
        has_solution = any("SOLUTION" in s or "BREAKDOWN" in s or "DEMO" in s for s in sections_found)
        has_cta = any("CTA" in s or "RECAP" in s for s in sections_found)
        narrative_pillars = sum([has_hook, has_problem, has_solution, has_cta])

        if narrative_pillars >= 3 and 1.8 <= overall_wps <= 3.6:
            pacing_score = 90
            pacing_rating = "Excellent"
            pacing_expl = f"Well-orchestrated {len(segments)}-beat narrative progression transitioning cleanly from hook to revelation without dead time."
        else:
            pacing_score = 74
            pacing_rating = "Good"
            pacing_expl = "Narrative moves forward reasonably, though the transition between problem exploration and resolution could be tighter."

        # 4. Information Density
        visual_beats = sum(1 for s in segment_stats if s["has_visual"] and s["has_text"])
        density_ratio = visual_beats / max(len(segment_stats), 1)
        if density_ratio >= 0.7:
            info_density_score = 91
            info_density_rating = "High Value"
            info_density_expl = f"Strong multi-sensory density: {round(density_ratio * 100)}% of screenplay beats pair voiceover with explicit visual choreography and graphic overlays."
        else:
            info_density_score = 76
            info_density_rating = "Moderate"
            info_density_expl = "Audio dialogue carries the load; adding more lower-third graphic text cues will elevate information retention."

        # 5. Filler / Repetition
        if len(detected_fillers) == 0:
            filler_score = 96
            filler_rating = "Lean & Direct"
            filler_expl = "Zero conversational filler phrases detected. Every beat advances the core message without padding."
        elif len(detected_fillers) == 1:
            filler_score = 80
            filler_rating = "Acceptable"
            filler_expl = f"Minimal fluff detected ('{detected_fillers[0]}'); removing it will tighten the spoken cadence."
        else:
            filler_score = 64
            filler_rating = "Needs Trimming"
            filler_expl = f"Detected conversational filler phrases ({', '.join(detected_fillers)}) that dilute viewer retention velocity."

        # 6. Segment Timing
        timing_issues = []
        if hook_dur > 4.5:
            timing_issues.append("Hook duration exceeds 4.5s")
        if cta_dur > 7.0:
            timing_issues.append("CTA duration exceeds 7.0s")
        for s in segment_stats:
            if s["wps"] > 4.0:
                timing_issues.append(f"Beat {s['section']} ({s['wps']} wps) is overstuffed")

        if len(timing_issues) == 0:
            timing_score = 92
            timing_rating = "Optimal"
            timing_expl = f"All {len(segments)} beats conform to standard short-form time boundaries (hook {hook_dur}s, CTA {cta_dur}s)."
        else:
            timing_score = 73
            timing_rating = "Suboptimal"
            timing_expl = f"Timing imbalances detected: {', '.join(timing_issues[:2])}."

        # 7. Curiosity / Open Loops
        curiosity_markers = ["secret", "mistake", "truth", "this", "instead", "why", "step", "formula", "pro tip", "hack", "setting", "what happens", "here is"]
        script_text_lower = (hook + " " + " ".join(s.get("voiceover", "") for s in segments)).lower()
        found_curiosity = [cm for cm in curiosity_markers if cm in script_text_lower]
        if len(found_curiosity) >= 2:
            curiosity_score = 92
            curiosity_rating = "High Curiosity"
            curiosity_expl = "Strong psychological open loop established in the first 5 seconds, delaying gratification until the key reveal."
        elif len(found_curiosity) == 1:
            curiosity_score = 82
            curiosity_rating = "Good"
            curiosity_expl = "Opens an interest gap, though teasing the exact payoff earlier will boost watch time to the end."
        else:
            curiosity_score = 70
            curiosity_rating = "Linear"
            curiosity_expl = "Narrative is relatively linear; inject an explicit open loop or unanswered question in beat 1."

        # 8. CTA Strength
        cta_lower = cta.lower()
        cta_actions = ["follow", "save", "comment", "share", "link", "profile", "part 2", "subscribe", "dm", "ఫాలో"]
        cta_matches = [ca for ca in cta_actions if ca in cta_lower]
        if len(cta_matches) == 1:
            cta_score = 93
            cta_rating = "Sharp & Focused"
            cta_expl = f"Single, unambiguous conversion call to action ('{cta_matches[0]}') that eliminates decision fatigue."
        elif len(cta_matches) > 1:
            cta_score = 77
            cta_rating = "Divided Focus"
            cta_expl = "CTA requests multiple actions (e.g. follow AND save); recommend focusing on a single high-priority conversion goal."
        else:
            cta_score = 70
            cta_rating = "Passive"
            cta_expl = "Call to action is passive or polite; use an active conversion command like 'Save this for your next shoot'."

        # 9. Overall Retention Potential
        overall_score = round(
            0.20 * hook_clarity_score +
            0.20 * hook_strength_score +
            0.15 * pacing_score +
            0.15 * curiosity_score +
            0.10 * info_density_score +
            0.10 * timing_score +
            0.05 * filler_score +
            0.05 * cta_score
        )
        if overall_score >= 88:
            overall_rating = "Exceptional Retention Potential"
            retention_expl = "Script demonstrates elite short-form architecture: high-velocity hook, balanced pacing, tight beats, and focused CTA."
        elif overall_score >= 78:
            overall_rating = "Strong Retention Potential"
            retention_expl = "Solid short-form structure with good retention probability; minor optimizations will push it into top quartile performance."
        else:
            overall_rating = "Moderate Retention — Optimization Recommended"
            retention_expl = "Foundational premise is solid, but pacing velocity and hook sharpness should be refined to prevent early drop-off."

        weak_points = []
        if hook_clarity_score < 80:
            weak_points.append(f"Opening hook ({hook_word_count} words) exceeds optimal 0–3s cognitive load.")
        if hook_strength_score < 80:
            weak_points.append("Hook lacks a high-stakes psychological trigger (curiosity gap or loss aversion).")
        if overall_wps > 3.5:
            weak_points.append(f"Spoken pacing ({overall_wps} words/sec) is unusually fast, risking viewer comprehension drop-off.")
        elif overall_wps < 2.0:
            weak_points.append(f"Spoken pacing ({overall_wps} words/sec) is relaxed, risking scroll-away during early beats.")
        if detected_fillers:
            weak_points.append(f"Conversational padding detected: '{', '.join(detected_fillers)}'.")
        if cta_score < 80:
            weak_points.append("CTA lacks a decisive single-action conversion command.")
        if not weak_points:
            weak_points.append("Minor: Visual framing could include more rapid pattern interrupts every 3.5 seconds.")

        recommendations = []
        if hook_clarity_score < 85:
            recommendations.append("Trim opening hook to under 14 words to ensure viewer grasps the premise before the 3-second mark.")
        if hook_strength_score < 85:
            recommendations.append("Inject a contrarian angle or direct consequence in beat 1 (e.g. 'Stop doing this...').")
        if detected_fillers:
            recommendations.append("Eliminate all detected filler words to elevate spoken energy and velocity.")
        if density_ratio < 0.8:
            recommendations.append("Add punchy uppercase on-screen text punchlines to reinforce spoken takeaways visually.")
        if cta_score < 85:
            recommendations.append("Replace passive CTA with a single high-intent command like 'Save this for your next video shoot'.")
        if len(recommendations) < 3:
            recommendations.append("Utilize dynamic B-roll cutaways on every key revelation to restart the viewer attention clock.")
            recommendations.append("Align sound design hits with on-screen text appearances for multi-sensory reinforcement.")

        segment_observations = []
        for s in segment_stats:
            risk = "low"
            obs = f"Spoken pace is {s['wps']} wps ({s['words']} words in {s['dur']}s)."
            sug = None
            if s["wps"] > 3.8:
                risk = "high" if "HOOK" in s["section"] else "medium"
                obs += " Pacing is fast; syllables may blur in fast playback."
                sug = "Shorten spoken dialogue by 2–3 words."
            elif s["wps"] < 1.7:
                risk = "medium"
                obs += " Pacing is slow; energy dips here."
                sug = "Tighten delivery or add visual B-roll movement."
            elif not s["has_text"]:
                risk = "medium"
                obs += " No on-screen graphic overlay defined for this beat."
                sug = "Add a 2–3 word bold lower third text cue."
            else:
                obs += " Well-balanced sensory mix of voiceover and visual direction."

            segment_observations.append({
                "segment_id": s["id"],
                "time_range": s["time_range"],
                "section": s["section"],
                "observation": obs,
                "retention_risk": risk,
                "suggestion": sug,
            })

        return {
            "title": title,
            "overall_score": overall_score,
            "overall_rating": overall_rating,
            "hook_clarity": {
                "score": hook_clarity_score,
                "rating": hook_clarity_rating,
                "explanation": hook_clarity_expl,
            },
            "hook_strength": {
                "score": hook_strength_score,
                "rating": hook_strength_rating,
                "explanation": hook_strength_expl,
            },
            "pacing_progression": {
                "score": pacing_score,
                "rating": pacing_rating,
                "explanation": pacing_expl,
            },
            "information_density": {
                "score": info_density_score,
                "rating": info_density_rating,
                "explanation": info_density_expl,
            },
            "filler_repetition": {
                "score": filler_score,
                "rating": filler_rating,
                "explanation": filler_expl,
            },
            "segment_timing": {
                "score": timing_score,
                "rating": timing_rating,
                "explanation": timing_expl,
            },
            "curiosity_open_loops": {
                "score": curiosity_score,
                "rating": curiosity_rating,
                "explanation": curiosity_expl,
            },
            "cta_strength": {
                "score": cta_score,
                "rating": cta_rating,
                "explanation": cta_expl,
            },
            "overall_retention_potential": {
                "score": overall_score,
                "rating": overall_rating,
                "explanation": retention_expl,
            },
            "weak_points": weak_points,
            "recommendations": recommendations,
            "segment_observations": segment_observations,
            "metrics": {
                "total_word_count": total_words,
                "words_per_second": overall_wps,
                "pacing_assessment": pacing_assessment,
                "detected_filler_words": detected_fillers,
                "hook_duration_seconds": hook_dur,
                "cta_duration_seconds": cta_dur,
            },
            "provider_used": "heuristic_mock",
        }

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

    async def generate_script(
        self,
        topic: str,
        platform: str,
        language: str,
        duration_seconds: int,
        tone: str,
        hook: Optional[str] = None,
        cta: Optional[str] = None,
        creator_name: Optional[str] = None,
        niche: Optional[str] = None,
        audience: Optional[str] = None,
        context: Optional[str] = None,
    ) -> Dict[str, Any]:
        if not self.api_key:
            return await self.mock_fallback.generate_script(
                topic, platform, language, duration_seconds, tone, hook, cta, creator_name, niche, audience, context
            )

        try:
            url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={self.api_key}"
            prompt = (
                f"You are a master short-form screenplay writer for {platform}.\n"
                f"Topic: {topic}\n"
                f"Target duration: {duration_seconds} seconds\n"
                f"Language: {language}\n"
                f"Tone: {tone}\n"
                f"Niche: {niche or 'Creator'}\n"
                f"Creator Name: {creator_name or 'Creator'}\n"
                f"Target Audience: {audience or 'Creators'}\n"
                f"Hook requirement: {hook if hook else 'Generate an ultra high-retention hook'}\n"
                f"CTA requirement: {cta if cta else 'Generate an actionable CTA'}\n"
                f"Context: {context or 'None'}\n\n"
                f"Write a time-coded short-form screenplay matching {duration_seconds} seconds.\n"
                f"Return ONLY valid JSON with this exact structure:\n"
                f'{{\n'
                f'  "title": "Title of script",\n'
                f'  "hook": "Full hook text",\n'
                f'  "cta": "Full CTA text",\n'
                f'  "segments": [\n'
                f'    {{\n'
                f'      "id": "seg_1",\n'
                f'      "start_time": "0:00",\n'
                f'      "end_time": "0:03",\n'
                f'      "section": "HOOK",\n'
                f'      "voiceover": "Dialogue line",\n'
                f'      "visual_direction": "Visual framing instruction",\n'
                f'      "b_roll": "B-roll suggestion",\n'
                f'      "on_screen_text": "UPPERCASE ON SCREEN TEXT",\n'
                f'      "audio_direction": "Audio / sound cue"\n'
                f'    }}\n'
                f'  ]\n'
                f'}}\n'
            )
            async with httpx.AsyncClient(timeout=20.0) as client:
                res = await client.post(
                    url,
                    json={"contents": [{"parts": [{"text": prompt}]}]},
                    headers={"Content-Type": "application/json"}
                )
                if res.status_code == 200:
                    data = res.json()
                    raw_text = data["candidates"][0]["content"]["parts"][0]["text"]
                    start = raw_text.find("{")
                    end = raw_text.rfind("}") + 1
                    if start != -1 and end != -1:
                        parsed = json.loads(raw_text[start:end])
                        if "segments" in parsed and isinstance(parsed["segments"], list) and len(parsed["segments"]) > 0:
                            return {
                                "title": parsed.get("title", f"{topic.title()} Screenplay"),
                                "hook": parsed.get("hook", hook or "Watch this"),
                                "segments": parsed["segments"],
                                "cta": parsed.get("cta", cta or "Follow for more"),
                                "provider_used": "gemini",
                            }
        except Exception:
            pass

        return await self.mock_fallback.generate_script(
            topic, platform, language, duration_seconds, tone, hook, cta, creator_name, niche, audience, context
        )

    async def analyze_script_retention(
        self,
        title: str,
        topic: str,
        platform: str,
        language: str,
        duration_seconds: int,
        hook: str,
        segments: List[Dict[str, Any]],
        cta: str,
        niche: Optional[str] = None,
        target_audience: Optional[str] = None,
    ) -> Dict[str, Any]:
        if not self.api_key:
            return await self.mock_fallback.analyze_script_retention(
                title, topic, platform, language, duration_seconds, hook, segments, cta, niche, target_audience
            )

        try:
            url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={self.api_key}"
            segments_summary = "\n".join(
                f"[{s.get('start_time')}–{s.get('end_time')}] {s.get('section')}: \"{s.get('voiceover')}\" (Visual: {s.get('visual_direction')}, Text: {s.get('on_screen_text')})"
                for s in segments
            )
            prompt = (
                f"You are an expert short-form video retention analyst for {platform}.\n"
                f"Analyze this screenplay across 9 retention criteria:\n"
                f"Title: {title}\nTopic: {topic}\nLanguage: {language}\nDuration: {duration_seconds}s\n"
                f"Hook: {hook}\nCTA: {cta}\nBeats:\n{segments_summary}\n\n"
                f"Return ONLY valid JSON matching this schema:\n"
                f'{{\n'
                f'  "title": "{title}",\n'
                f'  "overall_score": 88,\n'
                f'  "overall_rating": "Strong Retention Potential",\n'
                f'  "hook_clarity": {{"score": 90, "rating": "Excellent", "explanation": "..."}},\n'
                f'  "hook_strength": {{"score": 92, "rating": "Exceptional", "explanation": "..."}},\n'
                f'  "pacing_progression": {{"score": 88, "rating": "Good", "explanation": "..."}},\n'
                f'  "information_density": {{"score": 86, "rating": "Good", "explanation": "..."}},\n'
                f'  "filler_repetition": {{"score": 94, "rating": "Lean", "explanation": "..."}},\n'
                f'  "segment_timing": {{"score": 90, "rating": "Optimal", "explanation": "..."}},\n'
                f'  "curiosity_open_loops": {{"score": 89, "rating": "High Curiosity", "explanation": "..."}},\n'
                f'  "cta_strength": {{"score": 92, "rating": "Focused", "explanation": "..."}},\n'
                f'  "overall_retention_potential": {{"score": 88, "rating": "Strong", "explanation": "..."}},\n'
                f'  "weak_points": ["..."],\n'
                f'  "recommendations": ["..."],\n'
                f'  "segment_observations": [\n'
                f'    {{"segment_id": "seg_1", "time_range": "0:00–0:03", "section": "HOOK", "observation": "...", "retention_risk": "low", "suggestion": null}}\n'
                f'  ],\n'
                f'  "metrics": {{\n'
                f'    "total_word_count": 80,\n'
                f'    "words_per_second": 2.7,\n'
                f'    "pacing_assessment": "Optimal (2.5-3.5 wps)",\n'
                f'    "detected_filler_words": [],\n'
                f'    "hook_duration_seconds": 3.0,\n'
                f'    "cta_duration_seconds": 5.0\n'
                f'  }}\n'
                f'}}\n'
            )
            async with httpx.AsyncClient(timeout=20.0) as client:
                res = await client.post(
                    url,
                    json={"contents": [{"parts": [{"text": prompt}]}]},
                    headers={"Content-Type": "application/json"}
                )
                if res.status_code == 200:
                    data = res.json()
                    raw_text = data["candidates"][0]["content"]["parts"][0]["text"]
                    start = raw_text.find("{")
                    end = raw_text.rfind("}") + 1
                    if start != -1 and end != -1:
                        parsed = json.loads(raw_text[start:end])
                        if "overall_score" in parsed and "hook_clarity" in parsed:
                            parsed["provider_used"] = "gemini"
                            return parsed
        except Exception:
            pass

        return await self.mock_fallback.analyze_script_retention(
            title, topic, platform, language, duration_seconds, hook, segments, cta, niche, target_audience
        )

def get_llm_provider() -> BaseLLMProvider:
    if settings.AI_PROVIDER == "gemini" and settings.GEMINI_API_KEY:
        return GeminiLLMProvider(api_key=settings.GEMINI_API_KEY)
    return OfflineHeuristicMockProvider()

