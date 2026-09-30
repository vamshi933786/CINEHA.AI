"""Caption Cue Generator Service.

Converts normalized TranscriptSegment collections into display-ready, synchronized
CaptionCue objects using deterministic layout and timing rules without LLMs.
"""
from typing import List, Optional, Tuple, Dict, Any
from app.schemas.captions import (
    TranscriptSegment,
    TranscriptWord,
    CaptionCue,
    CaptionCueWord,
    CaptionCueSettings,
    CaptionCueGenerationRequest,
    CaptionCueGenerationResult,
)


def break_text_into_lines(
    text: str,
    max_characters_per_line: int = 36,
    max_lines: int = 2,
) -> List[str]:
    """Break text into readable visual lines respecting word boundaries and Unicode.

    Balances lines when max_lines is 2 to prevent orphan words on the second line.
    Preserves multi-lingual Unicode (English, Telugu, Hindi, Tanglish).
    """
    cleaned = " ".join(text.strip().split())
    if not cleaned:
        return []

    words = cleaned.split(" ")
    if not words:
        return []

    # If fits on a single line
    if len(cleaned) <= max_characters_per_line or max_lines <= 1:
        return [cleaned]

    # For 2 lines, attempt balanced splitting
    if max_lines == 2:
        best_split_idx = -1
        best_score = float("inf")

        for i in range(1, len(words)):
            line1 = " ".join(words[:i])
            line2 = " ".join(words[i:])

            len1 = len(line1)
            len2 = len(line2)

            # Penalty for overflowing max_characters_per_line
            overflow_penalty = 0
            if len1 > max_characters_per_line:
                overflow_penalty += (len1 - max_characters_per_line) * 50
            if len2 > max_characters_per_line:
                overflow_penalty += (len2 - max_characters_per_line) * 50

            # Difference in length (prefer balanced lines)
            diff_penalty = abs(len1 - len2)

            # Orphan penalty: if line 2 is a single very short word
            orphan_penalty = 0
            if len(words[i:]) == 1 and len(words[i]) <= 3:
                orphan_penalty = 30

            # Punctuation bonus for splitting after punctuation
            punct_bonus = 0
            if line1.rstrip().endswith((",", ";", ":", ".", "!", "?", "।", "॥")):
                punct_bonus = -15

            total_penalty = overflow_penalty + diff_penalty + orphan_penalty + punct_bonus

            if total_penalty < best_score:
                best_score = total_penalty
                best_split_idx = i

        if best_split_idx != -1:
            line1 = " ".join(words[:best_split_idx])
            line2 = " ".join(words[best_split_idx:])
            return [line1, line2]

    # Fallback for > 2 lines: greedy wrap respecting word boundaries
    lines: List[str] = []
    current_line_words: List[str] = []
    current_line_len = 0

    for word in words:
        word_len = len(word)
        needed_len = word_len if not current_line_words else current_line_len + 1 + word_len

        if needed_len <= max_characters_per_line or not current_line_words:
            current_line_words.append(word)
            current_line_len = needed_len
        else:
            if len(lines) < max_lines - 1:
                lines.append(" ".join(current_line_words))
                current_line_words = [word]
                current_line_len = word_len
            else:
                # Last allowed line, accumulate remaining words
                current_line_words.append(word)
                current_line_len += 1 + word_len

    if current_line_words:
        lines.append(" ".join(current_line_words))

    return lines


def has_valid_word_timings(segments: List[TranscriptSegment]) -> bool:
    """Inspect whether segments contain non-empty, valid word-level timestamps."""
    has_words = False
    for seg in segments:
        if seg.words and len(seg.words) > 0:
            for w in seg.words:
                if w.end_time > w.start_time:
                    has_words = True
                else:
                    return False
        else:
            return False
    return has_words


def generate_cues_from_word_timings(
    segments: List[TranscriptSegment],
    language: str,
    language_code: str,
    settings: CaptionCueSettings,
) -> Tuple[List[CaptionCue], List[str]]:
    """Segment words into timed caption cues based on word boundaries, cadence, and limits."""
    cues: List[CaptionCue] = []
    warnings: List[str] = []
    cue_idx = 0

    max_chars_total = settings.max_characters_per_line * settings.max_lines

    for seg in segments:
        if not seg.words:
            continue

        current_words: List[TranscriptWord] = []
        seg_id = seg.id

        def flush_cue(words_to_flush: List[TranscriptWord]):
            nonlocal cue_idx
            if not words_to_flush:
                return

            text = " ".join(w.text for w in words_to_flush).strip()
            start_t = words_to_flush[0].start_time
            end_t = words_to_flush[-1].end_time

            # Enforce minimum duration
            if end_t - start_t < settings.minimum_cue_duration:
                end_t = round(start_t + settings.minimum_cue_duration, 3)

            duration = round(max(0.05, end_t - start_t), 3)
            lines = break_text_into_lines(
                text=text,
                max_characters_per_line=settings.max_characters_per_line,
                max_lines=settings.max_lines,
            )

            cue_words = [
                CaptionCueWord(
                    text=w.text,
                    start_time=w.start_time,
                    end_time=w.end_time,
                    confidence=w.confidence,
                )
                for w in words_to_flush
            ]

            cue = CaptionCue(
                id=f"cue_{cue_idx}",
                text=text,
                start_time=start_t,
                end_time=end_t,
                duration=duration,
                language=language,
                language_code=language_code,
                lines=lines,
                source_segment_ids=[seg_id],
                segment_id=seg_id,
                words=cue_words,
                manually_edited=False,
                metadata={
                    "timing_granularity": "word",
                    "word_count": len(words_to_flush),
                    "char_count": len(text),
                },
            )
            cues.append(cue)
            cue_idx += 1

        for i, word in enumerate(seg.words):
            if not current_words:
                current_words.append(word)
                continue

            prev_word = current_words[-1]
            gap = word.start_time - prev_word.end_time
            accumulated_text = " ".join(w.text for w in current_words) + " " + word.text
            accumulated_duration = word.end_time - current_words[0].start_time

            should_split = False

            # 1. Speech pause gap
            if gap >= settings.gap_threshold:
                should_split = True
            # 2. Maximum duration exceeded
            elif accumulated_duration > settings.maximum_cue_duration:
                should_split = True
            # 3. Reached preferred words count and prev word ended with punctuation
            elif len(current_words) >= settings.preferred_words_per_cue:
                if prev_word.text.endswith((",", ";", ":", ".", "!", "?", "।", "॥")):
                    should_split = True
                elif len(current_words) >= settings.preferred_words_per_cue + 3:
                    should_split = True
            # 4. Exceeds total character capacity for max_lines
            elif len(accumulated_text) > max_chars_total:
                should_split = True

            if should_split:
                flush_cue(current_words)
                current_words = [word]
            else:
                current_words.append(word)

        if current_words:
            flush_cue(current_words)

    return cues, warnings


def generate_cues_from_segment_timings(
    segments: List[TranscriptSegment],
    language: str,
    language_code: str,
    settings: CaptionCueSettings,
) -> Tuple[List[CaptionCue], List[str]]:
    """Generate caption cues directly from segment start/end boundaries without fabricating word timings."""
    cues: List[CaptionCue] = []
    warnings: List[str] = []

    for i, seg in enumerate(segments):
        start_t = seg.start_time
        end_t = seg.end_time

        # Validate non-zero duration and minimum duration
        if end_t <= start_t:
            end_t = round(start_t + settings.minimum_cue_duration, 3)
            warnings.append(
                f"Segment '{seg.id}' had non-positive duration; adjusted end_time to {end_t}s."
            )
        elif (end_t - start_t) < settings.minimum_cue_duration:
            end_t = round(start_t + settings.minimum_cue_duration, 3)

        duration = round(max(0.05, end_t - start_t), 3)
        lines = break_text_into_lines(
            text=seg.text,
            max_characters_per_line=settings.max_characters_per_line,
            max_lines=settings.max_lines,
        )

        cue = CaptionCue(
            id=f"cue_{i}",
            text=seg.text.strip(),
            start_time=start_t,
            end_time=end_t,
            duration=duration,
            language=language,
            language_code=language_code,
            lines=lines,
            source_segment_ids=[seg.id],
            segment_id=seg.id,
            words=[],  # Strictly empty: NO fabricated word timestamps!
            manually_edited=False,
            metadata={
                "timing_granularity": "segment",
                "word_count": len(seg.text.split()),
                "char_count": len(seg.text),
            },
        )
        cues.append(cue)

    return cues, warnings


def sanitize_cues(
    cues: List[CaptionCue],
    minimum_cue_duration: float = 0.8,
) -> List[CaptionCue]:
    """Ensure cues are monotonically ordered, non-overlapping, and have positive durations."""
    if not cues:
        return []

    # Sort strictly by start_time
    sorted_cues = sorted(cues, key=lambda c: (c.start_time, c.end_time))

    for i in range(len(sorted_cues)):
        cue = sorted_cues[i]

        # Prevent zero or negative or sub-minimum duration
        if cue.end_time <= cue.start_time or (cue.end_time - cue.start_time) < minimum_cue_duration:
            cue.end_time = round(cue.start_time + minimum_cue_duration, 3)
            cue.duration = round(cue.end_time - cue.start_time, 3)

        # Prevent overlapping with next cue
        if i < len(sorted_cues) - 1:
            next_cue = sorted_cues[i + 1]
            if cue.end_time > next_cue.start_time:
                # If cue start is before next cue start, clamp cue end
                if cue.start_time < next_cue.start_time:
                    cue.end_time = next_cue.start_time
                    cue.duration = round(max(0.05, cue.end_time - cue.start_time), 3)

    return sorted_cues


class CaptionCueGeneratorService:
    """Service orchestrating deterministic caption cue generation."""

    @staticmethod
    def generate_cues(request: CaptionCueGenerationRequest) -> CaptionCueGenerationResult:
        """Process active transcript segments and generate synchronized caption cues."""
        settings = request.settings or CaptionCueSettings()

        # Validate settings constraints
        if settings.minimum_cue_duration > settings.maximum_cue_duration:
            settings.minimum_cue_duration = min(settings.minimum_cue_duration, settings.maximum_cue_duration)

        if not request.segments:
            return CaptionCueGenerationResult(
                cues=[],
                cue_count=0,
                total_caption_duration=0.0,
                timing_granularity="segment",
                settings_used=settings,
                caption_source_type=request.caption_source_type,
                warnings=["No transcript segments provided."],
                metadata={"status": "empty_input"},
            )

        lang_code = request.language_code or ("te-Latn" if request.is_transliteration else "en")

        has_words = has_valid_word_timings(request.segments)

        if has_words:
            raw_cues, warnings = generate_cues_from_word_timings(
                segments=request.segments,
                language=request.language,
                language_code=lang_code,
                settings=settings,
            )
            granularity = "word"
        else:
            raw_cues, warnings = generate_cues_from_segment_timings(
                segments=request.segments,
                language=request.language,
                language_code=lang_code,
                settings=settings,
            )
            granularity = "segment"
            if request.caption_source_type in ("translated", "transliterated"):
                warnings.append(
                    f"Word timings unavailable for {request.caption_source_type} transcript; using frame-accurate segment boundaries."
                )

        sanitized_cues = sanitize_cues(raw_cues, minimum_cue_duration=settings.minimum_cue_duration)

        total_duration = round(sum(c.duration for c in sanitized_cues), 3)

        return CaptionCueGenerationResult(
            cues=sanitized_cues,
            cue_count=len(sanitized_cues),
            total_caption_duration=total_duration,
            timing_granularity=granularity,
            settings_used=settings,
            caption_source_type=request.caption_source_type,
            warnings=warnings,
            metadata={
                "language": request.language,
                "language_code": lang_code,
                "is_transliteration": request.is_transliteration,
                "script_type": request.script_type,
                "source_segments_count": len(request.segments),
            },
        )
