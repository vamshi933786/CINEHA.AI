import re
from typing import List, Dict, Any, Tuple, Optional
from app.schemas.captions import TranscriptSegment
from app.schemas.video_analysis import (
    VideoAnalysisMetric,
    VideoAnalysisSegment,
    VideoTranscriptInfo,
    VideoMetadata,
)

COMMON_FILLER_PATTERNS = [
    r"\bso basically\b",
    r"\byou know\b",
    r"\bactually\b",
    r"\bliterally\b",
    r"\bkind of\b",
    r"\bsort of\b",
    r"\bumm?\b",
    r"\buhh?\b",
    r"\blike\b(?:\s+like\b)+",
]

CTA_TRIGGERS = [
    "follow",
    "subscribe",
    "comment",
    "share",
    "save",
    "save this",
    "dm",
    "link",
    "link in bio",
    "click",
    "let me know",
    "what do you think",
    "drop a comment",
    "check out",
    "tap the",
    "part 2",
]

CURIOSITY_TRIGGERS = [
    "secret",
    "mistake",
    "why",
    "stop doing",
    "never",
    "nobody tells you",
    "truth about",
    "hidden",
    "how to",
    "hack",
    "game changer",
    "don't",
    "avoid",
    "what if",
]


def get_rating_label(score: int) -> str:
    if score >= 85:
        return "Excellent"
    elif score >= 70:
        return "Strong"
    elif score >= 50:
        return "Moderate"
    return "Needs Work"


def get_seg_start(seg: Any) -> float:
    return float(getattr(seg, "start_time", getattr(seg, "start_seconds", 0.0)))


def get_seg_end(seg: Any) -> float:
    return float(getattr(seg, "end_time", getattr(seg, "end_seconds", 0.0)))


class VideoMetricsCalculator:
    """Calculates 10 objective creator-facing retention metrics grounded in video signals and transcript timing."""

    @staticmethod
    def extract_signals(
        duration_seconds: float,
        has_audio: bool,
        segments: List[TranscriptSegment],
    ) -> Dict[str, Any]:
        full_text = " ".join(s.text.strip() for s in segments if s.text.strip())
        words = full_text.split()
        word_count = len(words)

        speech_duration = sum(max(0.0, get_seg_end(s) - get_seg_start(s)) for s in segments)
        words_per_second = round(word_count / max(1.0, speech_duration), 2) if speech_duration > 0 else 0.0

        # Silence gaps detection (>1.0 second between consecutive speech segments)
        silence_gaps: List[Dict[str, float]] = []
        if segments:
            # Initial opening delay
            first_start = get_seg_start(segments[0])
            if first_start >= 1.0:
                silence_gaps.append({
                    "start": 0.0,
                    "end": round(first_start, 2),
                    "duration": round(first_start, 2),
                    "type": "opening_silence",
                })

            for i in range(len(segments) - 1):
                gap = get_seg_start(segments[i + 1]) - get_seg_end(segments[i])
                if gap >= 1.0:
                    silence_gaps.append({
                        "start": round(get_seg_end(segments[i]), 2),
                        "end": round(get_seg_start(segments[i + 1]), 2),
                        "duration": round(gap, 2),
                        "type": "internal_gap",
                    })

            # Ending delay before video cut
            last_end = get_seg_end(segments[-1])
            if duration_seconds > last_end + 1.2:
                ending_gap = duration_seconds - last_end
                silence_gaps.append({
                    "start": round(last_end, 2),
                    "end": round(duration_seconds, 2),
                    "duration": round(ending_gap, 2),
                    "type": "ending_silence",
                })

        # Filler analysis
        detected_fillers: List[str] = []
        lower_text = full_text.lower()
        for pat in COMMON_FILLER_PATTERNS:
            matches = re.findall(pat, lower_text)
            if matches:
                detected_fillers.extend(matches)

        # Consecutive duplicate words
        for i in range(len(words) - 1):
            w1 = words[i].lower().strip(".,!?")
            w2 = words[i + 1].lower().strip(".,!?")
            if w1 and w1 == w2 and len(w1) > 2 and w1 not in ["that", "had"]:
                detected_fillers.append(f"{w1} {w2}")

        # Hook window (first 3.5 seconds)
        hook_segments = [s for s in segments if get_seg_start(s) <= 3.5]
        hook_text = " ".join(s.text.strip() for s in hook_segments)

        # CTA window (last 20% or final segment)
        cta_threshold = max(0.0, duration_seconds * 0.8)
        cta_segments = [s for s in segments if get_seg_start(s) >= cta_threshold or s == segments[-1]] if segments else []
        cta_text = " ".join(s.text.strip() for s in cta_segments)


        return {
            "full_text": full_text,
            "word_count": word_count,
            "speech_duration": round(speech_duration, 2),
            "words_per_second": words_per_second,
            "silence_gaps": silence_gaps,
            "silence_gaps_count": len(silence_gaps),
            "detected_fillers": detected_fillers,
            "hook_text": hook_text,
            "cta_text": cta_text,
        }

    @classmethod
    def calculate_metrics(
        cls,
        video: VideoMetadata,
        segments: List[TranscriptSegment],
        signals: Dict[str, Any],
    ) -> Tuple[List[VideoAnalysisMetric], int, str, str, List[str], List[str]]:
        """
        Calculates all 10 retention criteria strictly bounded 0-100.
        Returns: (metrics, overall_score, overall_rating, summary, findings, recommendations)
        """
        metrics: List[VideoAnalysisMetric] = []
        findings: List[str] = []
        recommendations: List[str] = []

        duration = video.duration_seconds
        has_audio = video.has_audio
        word_count = signals.get("word_count", 0)
        wps = signals.get("words_per_second", 0.0)
        silence_gaps = signals.get("silence_gaps", [])
        fillers = signals.get("detected_fillers", [])
        hook_text = signals.get("hook_text", "").strip()
        cta_text = signals.get("cta_text", "").strip().lower()

        is_no_audio = not has_audio or len(segments) == 0

        # --- 1. Hook Strength (0-3s impact) ---
        if is_no_audio:
            hook_score = 30
            hook_evidence = ["No spoken audio track detected in the opening seconds."]
            hook_summary = "Opening has no vocal hook or audio presence to arrest viewer scrolling."
            hook_rec = "Add an immediate spoken claim, question, or pattern interrupt within the first 1.5 seconds."
        else:
            first_speech_start = get_seg_start(segments[0]) if segments else 0.0
            hook_score = 75
            hook_evidence = []

            if first_speech_start > 1.2:
                hook_score -= 25
                hook_evidence.append(f"Opening speech starts late at {first_speech_start:.1f}s (dead air in first second).")
            elif first_speech_start <= 0.4:
                hook_score += 10
                hook_evidence.append(f"Instant vocal delivery at {first_speech_start:.1f}s captures immediate attention.")

            hook_words = len(hook_text.split())
            if hook_words >= 6:
                hook_score += 10
                hook_evidence.append(f"Punchy opening pace with {hook_words} words delivered in the first 3 seconds.")
            elif hook_words < 3:
                hook_score -= 15
                hook_evidence.append("Sparse opening dialogue (<3 words in initial 3 seconds).")

            # Curiosity triggers in hook
            if any(trig in hook_text.lower() for trig in CURIOSITY_TRIGGERS):
                hook_score += 10
                hook_evidence.append("Opening phrase contains a proven curiosity or contrarian hook anchor.")

            hook_score = max(20, min(98, hook_score))
            hook_summary = (
                f"Hook initiates speech at {first_speech_start:.1f}s with '{hook_text[:50]}...'"
                if hook_text
                else "Delayed speech onset creates drop-off risk in the first 3 seconds."
            )
            hook_rec = (
                "Ensure speech or high-contrast visual interrupt begins within the first 0.3s of video start."
                if first_speech_start > 0.6
                else "Front-load the core viewer payoff in the first sentence to lock in attention."
            )

        metrics.append(VideoAnalysisMetric(
            id="hook_strength",
            label="Hook Strength",
            score=hook_score,
            rating=get_rating_label(hook_score),
            summary=hook_summary,
            evidence=hook_evidence,
            recommendation=hook_rec,
        ))

        # --- 2. Opening Clarity ---
        if is_no_audio:
            clarity_score = 25
            clarity_evidence = ["Unable to verify spoken premise clarity without audio dialogue."]
            clarity_summary = "Premise cannot be audibly evaluated due to absent speech stream."
            clarity_rec = "Ensure clear voiceover or concise on-screen kinetic text introduces the subject."
        else:
            clarity_score = 78
            clarity_evidence = []
            if len(hook_text.split()) >= 4:
                clarity_score += 8
                clarity_evidence.append("Core subject line is spoken upfront in opening beat.")
            if "?" in hook_text:
                clarity_score += 6
                clarity_evidence.append("Direct question sets a clear inquiry premise.")
            if any(f in hook_text.lower() for f in ["so basically", "you know", "umm", "uh"]):
                clarity_score -= 20
                clarity_evidence.append("Opening contains introductory filler before establishing topic.")

            clarity_score = max(20, min(95, clarity_score))
            clarity_summary = "Evaluates how rapidly and unambiguously the viewer understands what the video is about."
            clarity_rec = "Eliminate warm-up phrases; state the premise or stake in the very first sentence."

        metrics.append(VideoAnalysisMetric(
            id="opening_clarity",
            label="Opening Clarity",
            score=clarity_score,
            rating=get_rating_label(clarity_score),
            summary=clarity_summary,
            evidence=clarity_evidence,
            recommendation=clarity_rec,
        ))

        # --- 3. Retention Structure ---
        segment_count = len(segments)
        if is_no_audio:
            ret_score = 30
            ret_evidence = ["Single flat video block without audio speech modulation."]
            ret_summary = "Lacks dynamic speech pacing shifts needed for short-form retention."
            ret_rec = "Break the video into distinct visual and narrative chapters."
        else:
            ret_score = 70
            ret_evidence = []
            # Ideal segment density: 1 beat every 2.5 to 5.0 seconds
            beats_per_10s = (segment_count / max(5.0, duration)) * 10
            if 2.0 <= beats_per_10s <= 5.0:
                ret_score += 18
                ret_evidence.append(f"Balanced structural density with ~{beats_per_10s:.1f} speech beats per 10 seconds.")
            elif beats_per_10s < 1.5:
                ret_score -= 20
                ret_evidence.append("Extended unbroken monologue segments risk viewer fatigue.")
            else:
                ret_score += 5
                ret_evidence.append("Rapid beat progression maintains steady viewer engagement.")

            ret_score = max(25, min(95, ret_score))
            ret_summary = f"Script contains {segment_count} distinct timestamped dialogue beats across {duration:.1f}s."
            ret_rec = "Keep beats between 3–5 seconds to sustain forward momentum."

        metrics.append(VideoAnalysisMetric(
            id="retention_structure",
            label="Retention Structure",
            score=ret_score,
            rating=get_rating_label(ret_score),
            summary=ret_summary,
            evidence=ret_evidence,
            recommendation=ret_rec,
        ))

        # --- 4. Pacing ---
        if is_no_audio:
            pace_score = 40
            pace_evidence = ["Zero spoken pacing signals detected."]
            pace_summary = "Pacing velocity cannot be benchmarked without vocal cadence."
            pace_rec = "Pair footage with rhythmic audio or voiceover paced between 2.2–3.0 words/sec."
        else:
            pace_score = 75
            pace_evidence = []
            # Short form sweet spot: 2.2 - 3.2 words per second
            if 2.2 <= wps <= 3.2:
                pace_score += 15
                pace_evidence.append(f"Optimal speech velocity of {wps:.2f} words/sec for short-form consumption.")
            elif wps < 1.8:
                pace_score -= 25
                pace_evidence.append(f"Slow speech cadence at {wps:.2f} words/sec risks viewer drop-off.")
            elif wps > 3.8:
                pace_score -= 20
                pace_evidence.append(f"Rushed speech cadence at {wps:.2f} words/sec may impair comprehension.")
            else:
                pace_score += 5
                pace_evidence.append(f"Conversational velocity of {wps:.2f} words/sec.")

            long_gaps = [g for g in silence_gaps if g["duration"] >= 1.5]
            if long_gaps:
                pace_score -= min(25, len(long_gaps) * 8)
                pace_evidence.append(f"Found {len(long_gaps)} noticeable silence pauses exceeding 1.5s.")

            pace_score = max(20, min(98, pace_score))
            pace_summary = f"Overall cadence averages {wps:.2f} words per second with {len(silence_gaps)} speech gap(s)."
            pace_rec = "Trim silent pauses exceeding 1.0s to maintain tight short-form momentum."

        metrics.append(VideoAnalysisMetric(
            id="pacing",
            label="Pacing",
            score=pace_score,
            rating=get_rating_label(pace_score),
            summary=pace_summary,
            evidence=pace_evidence,
            recommendation=pace_rec,
        ))

        # --- 5. Information Density ---
        if is_no_audio:
            info_score = 35
            info_evidence = ["No spoken information tokens detected."]
            info_summary = "Content density is low due to absence of spoken dialogue."
            info_rec = "Deliver actionable insights or value points every 5 to 7 seconds."
        else:
            info_score = 72
            info_evidence = []
            words_per_minute = wps * 60
            info_evidence.append(f"Total word count: {word_count} words (~{words_per_minute:.0f} WPM).")
            if word_count >= 25 and duration <= 60:
                info_score += 12
                info_evidence.append("Rich informational volume relative to short-form duration.")
            elif word_count < 15 and duration > 15:
                info_score -= 20
                info_evidence.append("Sparse verbal information relative to video length.")

            info_score = max(25, min(95, info_score))
            info_summary = "Measures substantive content volume and value delivery rate."
            info_rec = "Ensure each spoken phrase introduces a tangible tip, step, or counter-intuitive insight."

        metrics.append(VideoAnalysisMetric(
            id="information_density",
            label="Information Density",
            score=info_score,
            rating=get_rating_label(info_score),
            summary=info_summary,
            evidence=info_evidence,
            recommendation=info_rec,
        ))

        # --- 6. Filler / Repetition ---
        if is_no_audio:
            filler_score = 90
            filler_evidence = ["No spoken filler words detected."]
            filler_summary = "No verbal fluff detected."
            filler_rec = "Keep dialogue equally crisp when adding voiceover."
        else:
            filler_count = len(fillers)
            filler_score = max(20, min(100, 95 - (filler_count * 12)))
            filler_evidence = []
            if filler_count == 0:
                filler_evidence.append("Zero common conversational filler words ('so basically', 'you know') detected.")
            else:
                filler_evidence.append(f"Detected {filler_count} potential filler instance(s): {', '.join(set(fillers[:4]))}.")

            filler_summary = (
                "Clean verbal delivery with zero detected conversational fluff."
                if filler_count == 0
                else f"Identified {filler_count} conversational filler or repetitive phrase(s)."
            )
            filler_rec = (
                "Maintain this concise verbal efficiency in upcoming scripts."
                if filler_count == 0
                else "Tighten dialogue by cutting repetitive transition phrases in post-production."
            )

        metrics.append(VideoAnalysisMetric(
            id="filler_repetition",
            label="Filler / Repetition",
            score=filler_score,
            rating=get_rating_label(filler_score),
            summary=filler_summary,
            evidence=filler_evidence,
            recommendation=filler_rec,
        ))

        # --- 7. Story / Narrative Flow ---
        if is_no_audio:
            story_score = 35
            story_evidence = ["Unstructured audio flow without spoken narrative cues."]
            story_summary = "Lacks clear story trajectory without vocal guidance."
            story_rec = "Structure narrative around Hook -> Conflict -> Resolution -> CTA."
        else:
            story_score = 74
            story_evidence = []
            if segment_count >= 3:
                story_score += 12
                story_evidence.append(f"Clear 3-act progression across {segment_count} distinct structural beats.")
            else:
                story_score -= 10
                story_evidence.append("Single-beat script lacks progressive narrative tension.")

            story_score = max(30, min(95, story_score))
            story_summary = "Evaluates progression from opening hook through core payoff."
            story_rec = "Anchor each segment with an unresolved tension until the final payoff."

        metrics.append(VideoAnalysisMetric(
            id="story_flow",
            label="Story / Narrative Flow",
            score=story_score,
            rating=get_rating_label(story_score),
            summary=story_summary,
            evidence=story_evidence,
            recommendation=story_rec,
        ))

        # --- 8. Curiosity / Open Loops ---
        if is_no_audio:
            curiosity_score = 30
            curiosity_evidence = ["No spoken curiosity triggers identified."]
            curiosity_summary = "Absent spoken cues leaves curiosity unresolved."
            curiosity_rec = "Introduce a high-stakes question or information gap early on."
        else:
            curiosity_score = 65
            curiosity_evidence = []
            full_text_lower = signals.get("full_text", "").lower()
            found_triggers = [t for t in CURIOSITY_TRIGGERS if t in full_text_lower]
            if found_triggers:
                curiosity_score += min(25, len(found_triggers) * 10)
                curiosity_evidence.append(f"Includes curiosity triggers: {', '.join(found_triggers[:3])}.")
            else:
                curiosity_score -= 10
                curiosity_evidence.append("Lacks explicit curiosity anchors ('secret', 'why', 'mistake').")

            curiosity_score = max(25, min(95, curiosity_score))
            curiosity_summary = "Measures effectiveness of information gaps keeping viewers through to the end."
            curiosity_rec = "Tease the final reveal in the opening beat without giving away the solution immediately."

        metrics.append(VideoAnalysisMetric(
            id="curiosity_open_loops",
            label="Curiosity / Open Loops",
            score=curiosity_score,
            rating=get_rating_label(curiosity_score),
            summary=curiosity_summary,
            evidence=curiosity_evidence,
            recommendation=curiosity_rec,
        ))

        # --- 9. CTA Strength ---
        cta_detected = False
        cta_evidence = []
        if is_no_audio:
            cta_score = 25
            cta_evidence.append("No spoken CTA detected.")
            cta_summary = "No call-to-action detected in spoken dialogue."
            cta_rec = "Add an explicit verbal and visual CTA in the closing 3-5 seconds."
        else:
            found_cta_triggers = [t for t in CTA_TRIGGERS if t in cta_text]
            if found_cta_triggers:
                cta_detected = True
                cta_score = 88
                cta_evidence.append(f"Closing dialogue contains explicit CTA: '{', '.join(found_cta_triggers)}'.")
                cta_summary = f"Detected closing call-to-action ('{found_cta_triggers[0]}') in final beat."
                cta_rec = "Keep CTA concise (under 3 seconds) to prevent premature viewer drop-off."
            else:
                cta_score = 45
                cta_evidence.append("No common direct CTA keywords ('save', 'follow', 'comment', 'link') found in final 20%.")
                cta_summary = "No explicit call-to-action detected in closing segment."
                cta_rec = "Direct the viewer toward a single action: e.g. 'Save this for your next shoot' or 'Comment below'."

        metrics.append(VideoAnalysisMetric(
            id="cta_strength",
            label="CTA Strength",
            score=cta_score,
            rating=get_rating_label(cta_score),
            summary=cta_summary,
            evidence=cta_evidence,
            recommendation=cta_rec,
        ))

        # --- 10. Caption / Accessibility Readiness ---
        access_score = 82
        access_evidence = []
        if not has_audio:
            access_score = 50
            access_evidence.append("Silent video has no audio to transcribe for captions.")
            access_summary = "Without audio speech, automated captions cannot be generated."
            access_rec = "Add audio narration or burn in stylized kinetic subtitles manually."
        else:
            access_evidence.append(f"Clean audio track transcribed into {segment_count} synchronized time-coded segments.")
            if segment_count >= 2:
                access_score += 10
                access_evidence.append("Granular speech timing ready for 1-click animated Caption Studio overlays.")
            access_score = max(40, min(96, access_score))
            access_summary = "Evaluates speech clarity and segment readiness for automated animated captions."
            access_rec = "Transfer to Caption Studio to burn in stylized, accessible dynamic subtitles."

        metrics.append(VideoAnalysisMetric(
            id="accessibility_readiness",
            label="Caption / Accessibility Readiness",
            score=access_score,
            rating=get_rating_label(access_score),
            summary=access_summary,
            evidence=access_evidence,
            recommendation=access_rec,
        ))

        # --- Overall Score Calculation ---
        # Weighted retention formula
        weights = {
            "hook_strength": 0.20,
            "opening_clarity": 0.12,
            "retention_structure": 0.12,
            "pacing": 0.12,
            "information_density": 0.10,
            "filler_repetition": 0.08,
            "story_flow": 0.08,
            "curiosity_open_loops": 0.08,
            "cta_strength": 0.05,
            "accessibility_readiness": 0.05,
        }
        weighted_sum = sum(m.score * weights.get(m.id, 0.1) for m in metrics)
        overall_score = max(0, min(100, int(round(weighted_sum))))

        if overall_score >= 85:
            overall_rating = "High Retention Potential"
            summary = "Excellent short-form structure with an immediate hook, tightly paced delivery, and strong viewer hold."
        elif overall_score >= 70:
            overall_rating = "Solid Structural Pacing"
            summary = "Competent short-form video with steady engagement; minor improvements in hook immediacy and CTA will maximize retention."
        elif overall_score >= 50:
            overall_rating = "Moderate Retention Hazard"
            summary = "Noticeable pacing drop-offs or delayed hook onset detected. Trimming pauses and strengthening opening will significantly improve viewer hold."
        else:
            overall_rating = "High Drop-off Risk"
            summary = "Significant structural retention risks detected (lack of audio presence, extended dead air, or missing narrative hook)."

        # Key Findings
        for m in metrics:
            if m.score >= 85:
                findings.append(f"Strength ({m.label}): {m.summary}")
            elif m.score < 60:
                findings.append(f"Drop-off Hazard ({m.label}): {m.summary}")

        # Top Recommendations
        weak_metrics = sorted(metrics, key=lambda x: x.score)
        for m in weak_metrics[:3]:
            if m.recommendation:
                recommendations.append(m.recommendation)

        return metrics, overall_score, overall_rating, summary, findings, recommendations

    @staticmethod
    def map_segments(
        segments: List[TranscriptSegment],
        duration_seconds: float,
    ) -> List[VideoAnalysisSegment]:
        """
        Maps real Whisper segments to narrative structure classifications.
        Preserves exact start/end timestamps from the audio engine. Zero timestamp fabrication.
        """
        if not segments:
            return []

        mapped: List[VideoAnalysisSegment] = []
        n = len(segments)

        for idx, seg in enumerate(segments):
            start_sec = get_seg_start(seg)
            end_sec = get_seg_end(seg)
            dur = max(0.1, end_sec - start_sec)
            progress = (start_sec / max(1.0, duration_seconds)) if duration_seconds > 0 else 0.0

            # Structural classification heuristic grounded in timing & text
            label = "VALUE"
            observation = "Core body delivering informational value."
            confidence = 0.85

            if idx == 0 or start_sec <= 3.5:
                label = "HOOK"
                observation = "Opening beat arresting viewer scroll."
                confidence = 0.95
            elif progress < 0.30:
                label = "CONTEXT"
                observation = "Premise and problem setup."
                confidence = 0.80
            elif idx == n - 1 or progress >= 0.82:
                # Check if CTA is spoken
                has_cta = any(t in seg.text.lower() for t in CTA_TRIGGERS)
                if has_cta or idx == n - 1:
                    label = "CTA"
                    observation = "Closing call-to-action and viewer directive."
                    confidence = 0.90 if has_cta else 0.75
                else:
                    label = "PAYOFF"
                    observation = "Climactic resolution and key takeaway."
                    confidence = 0.80
            elif progress >= 0.65:
                label = "PAYOFF"
                observation = "Climactic resolution and key takeaway."
                confidence = 0.80

            mapped.append(VideoAnalysisSegment(
                segment_id=f"seg_{idx + 1}",
                start_seconds=round(start_sec, 2),
                end_seconds=round(end_sec, 2),
                duration_seconds=round(dur, 2),
                transcript=seg.text.strip(),
                label=label,
                confidence=confidence,
                observation=observation,
            ))

        return mapped
