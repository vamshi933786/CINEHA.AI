import re
from typing import List, Dict, Any, Tuple


def parse_script_text_to_segments(
    script_text: str,
    duration_seconds: int = 30,
) -> Tuple[str, str, List[Dict[str, Any]]]:
    """
    Parses normalized script text into structured screenplay segments,
    extracting the opening hook, closing CTA, and time-coded beats.
    This allows arbitrary normalized script text to interface seamlessly with
    the existing RetentionAnalyzerAgent without altering or duplicating retention scoring logic.
    """
    cleaned = script_text.strip()
    if not cleaned:
        return "", "", []

    # Check for structured beat tags like: [0:00 — 0:03] HOOK or [0:00 - 0:05]
    beat_pattern = re.compile(
        r"\[(\d+:\d+)\s*[—–-]\s*(\d+:\d+)\]\s*([A-Za-z0-9_\-\s]+)?",
        re.IGNORECASE,
    )

    matches = list(beat_pattern.finditer(cleaned))
    if len(matches) >= 2:
        # Structured screenplay format detected
        segments: List[Dict[str, Any]] = []
        for i, match in enumerate(matches):
            start_time = match.group(1).strip()
            end_time = match.group(2).strip()
            section_raw = (match.group(3) or "BEAT").strip().upper()
            start_pos = match.end()
            end_pos = matches[i + 1].start() if i + 1 < len(matches) else len(cleaned)
            content_chunk = cleaned[start_pos:end_pos].strip()

            # Parse sub-fields like Voiceover:, Visual:, B-Roll:, etc. if present
            vo_match = re.search(r"Voiceover:\s*\"?([^\n\r\"]+)\"?", content_chunk, re.IGNORECASE)
            vo = vo_match.group(1).strip() if vo_match else content_chunk.split("\n")[0].strip()

            vis_match = re.search(r"Visual:\s*([^\n\r]+)", content_chunk, re.IGNORECASE)
            vis = vis_match.group(1).strip() if vis_match else "Creator addressing camera directly."

            broll_match = re.search(r"B-Roll:\s*([^\n\r]+)", content_chunk, re.IGNORECASE)
            broll = broll_match.group(1).strip() if broll_match else ""

            ost_match = re.search(r"On-Screen Text:\s*([^\n\r]+)", content_chunk, re.IGNORECASE)
            ost = ost_match.group(1).strip() if ost_match else ""

            audio_match = re.search(r"Audio:\s*([^\n\r]+)", content_chunk, re.IGNORECASE)
            audio = audio_match.group(1).strip() if audio_match else ""

            segments.append({
                "id": f"seg_{i+1}",
                "start_time": start_time,
                "end_time": end_time,
                "section": section_raw,
                "voiceover": vo or content_chunk,
                "visual_direction": vis,
                "b_roll": broll,
                "on_screen_text": ost,
                "audio_direction": audio,
            })

        hook = segments[0]["voiceover"] if segments else ""
        cta = segments[-1]["voiceover"] if segments else ""
        return hook, cta, segments

    # Plain unstructured paragraphs or multi-line dialogue
    paragraphs = [p.strip() for p in cleaned.split("\n\n") if p.strip()]
    if not paragraphs:
        paragraphs = [line.strip() for line in cleaned.split("\n") if line.strip()]
    if not paragraphs:
        paragraphs = [cleaned]

    # Map paragraphs into 2 to 4 segments based on duration
    num_segments = min(max(len(paragraphs), 2), 4)
    total_dur = max(duration_seconds, 10)
    dur_per_seg = total_dur / num_segments

    def _format_time(sec: float) -> str:
        m = int(sec // 60)
        s = int(sec % 60)
        return f"{m}:{s:02d}"

    section_names = ["HOOK", "PROBLEM", "SOLUTION", "CTA"]
    if num_segments == 2:
        section_names = ["HOOK", "CTA"]
    elif num_segments == 3:
        section_names = ["HOOK", "CORE", "CTA"]

    segments = []
    # Distribute paragraphs among segments
    chunk_size = max(1, len(paragraphs) // num_segments)
    for i in range(num_segments):
        start_sec = i * dur_per_seg
        end_sec = total_dur if i == num_segments - 1 else (i + 1) * dur_per_seg
        start_t = _format_time(start_sec)
        end_t = _format_time(end_sec)

        # Slice paragraphs
        p_slice = paragraphs[i * chunk_size : (i + 1) * chunk_size] if i < num_segments - 1 else paragraphs[i * chunk_size :]
        vo_text = " ".join(p_slice) if p_slice else paragraphs[-1]

        sec_name = section_names[i] if i < len(section_names) else "BEAT"
        segments.append({
            "id": f"seg_{i+1}",
            "start_time": start_t,
            "end_time": end_t,
            "section": sec_name,
            "voiceover": vo_text,
            "visual_direction": "Dynamic camera movement with subject framed cleanly in portrait orientation.",
            "b_roll": "High-contrast visual cut reinforcing spoken dialogue.",
            "on_screen_text": vo_text[:40].upper() + "..." if len(vo_text) > 40 else vo_text.upper(),
            "audio_direction": "Upbeat short-form background track with vocal ducking.",
        })

    hook = segments[0]["voiceover"] if segments else ""
    cta = segments[-1]["voiceover"] if segments else ""
    return hook, cta, segments
