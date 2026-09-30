"""Unit and integration tests for Caption Cue Generator and API endpoint."""
import pytest
from httpx import AsyncClient, ASGITransport
from app.main import app
from app.schemas.captions import (
    TranscriptSegment,
    TranscriptWord,
    CaptionCue,
    CaptionCueWord,
    CaptionCueSettings,
    CaptionCueGenerationRequest,
    CaptionCueGenerationResult,
)
from app.services.caption_cue_generator import (
    CaptionCueGeneratorService,
    break_text_into_lines,
    has_valid_word_timings,
    sanitize_cues,
)


# 1. Caption cue contract test
def test_caption_cue_contract():
    cue = CaptionCue(
        id="cue_0",
        text="The quick brown fox jumps over the lazy dog",
        start_time=0.5,
        end_time=3.0,
        duration=2.5,
        language="English",
        language_code="en",
        lines=["The quick brown fox", "jumps over the lazy dog"],
        source_segment_ids=["seg_0"],
        words=[
            CaptionCueWord(text="The", start_time=0.5, end_time=0.8),
            CaptionCueWord(text="quick", start_time=0.8, end_time=1.2),
        ],
        manually_edited=False,
        metadata={"custom": "val"},
    )
    assert cue.id == "cue_0"
    assert cue.duration == 2.5
    assert len(cue.lines) == 2
    assert cue.words is not None
    assert len(cue.words) == 2
    assert cue.manually_edited is False


# 2. Generation from word-timed transcript
def test_generate_cues_from_word_timed_transcript():
    words = [
        TranscriptWord(text="Cinema", start_time=0.0, end_time=0.5),
        TranscriptWord(text="is", start_time=0.5, end_time=0.7),
        TranscriptWord(text="a", start_time=0.7, end_time=0.9),
        TranscriptWord(text="visual", start_time=0.9, end_time=1.4),
        TranscriptWord(text="medium,", start_time=1.4, end_time=2.0),
        TranscriptWord(text="capturing", start_time=2.0, end_time=2.6),
        TranscriptWord(text="raw", start_time=2.6, end_time=2.9),
        TranscriptWord(text="human", start_time=2.9, end_time=3.3),
        TranscriptWord(text="emotion.", start_time=3.3, end_time=4.0),
    ]
    seg = TranscriptSegment(
        id="seg_0",
        text="Cinema is a visual medium, capturing raw human emotion.",
        start_time=0.0,
        end_time=4.0,
        words=words,
    )

    req = CaptionCueGenerationRequest(
        segments=[seg],
        language="English",
        language_code="en",
        settings=CaptionCueSettings(preferred_words_per_cue=5),
    )
    res = CaptionCueGeneratorService.generate_cues(req)

    assert res.timing_granularity == "word"
    assert res.cue_count >= 1
    # Check that word timings are present in cues
    first_cue = res.cues[0]
    assert len(first_cue.words) > 0
    assert first_cue.words[0].text == "Cinema"
    assert first_cue.words[0].start_time == 0.0


# 3. Generation from segment-only transcript
def test_generate_cues_from_segment_only_transcript():
    segments = [
        TranscriptSegment(
            id="seg_0",
            text="First spoken segment without word timings.",
            start_time=1.0,
            end_time=3.5,
            words=[],
        ),
        TranscriptSegment(
            id="seg_1",
            text="Second spoken segment immediately following.",
            start_time=3.6,
            end_time=6.0,
            words=[],
        ),
    ]
    req = CaptionCueGenerationRequest(
        segments=segments,
        language="English",
        language_code="en",
    )
    res = CaptionCueGeneratorService.generate_cues(req)

    assert res.timing_granularity == "segment"
    assert res.cue_count == 2
    assert res.cues[0].start_time == 1.0
    assert res.cues[0].end_time == 3.5
    assert res.cues[0].duration == 2.5
    assert res.cues[0].words == []  # No fabricated word timestamps!
    assert res.cues[1].start_time == 3.6


# 4. Generation from translated transcript
def test_generate_cues_translated_transcript():
    segments = [
        TranscriptSegment(
            id="seg_0",
            text="సినిమా మానవ భావోద్వేగాల అద్భుత దృశ్య రూపం.",
            start_time=0.0,
            end_time=3.8,
            words=[],
        )
    ]
    req = CaptionCueGenerationRequest(
        segments=segments,
        language="Telugu",
        language_code="te",
        caption_source_type="translated",
    )
    res = CaptionCueGeneratorService.generate_cues(req)

    assert res.caption_source_type == "translated"
    assert res.timing_granularity == "segment"
    assert res.cues[0].text == "సినిమా మానవ భావోద్వేగాల అద్భుత దృశ్య రూపం."
    assert res.cues[0].start_time == 0.0
    assert res.cues[0].end_time == 3.8
    assert res.cues[0].words == []


# 5. Generation from Tanglish transliterated transcript
def test_generate_cues_tanglish_transcript():
    segments = [
        TranscriptSegment(
            id="seg_0",
            text="Cinema manava bhavodveegala adbhuta drusya roopam.",
            start_time=0.5,
            end_time=4.2,
            words=[],
        )
    ]
    req = CaptionCueGenerationRequest(
        segments=segments,
        language="Tanglish",
        language_code="te-Latn",
        is_transliteration=True,
        caption_source_type="transliterated",
    )
    res = CaptionCueGeneratorService.generate_cues(req)

    assert res.caption_source_type == "transliterated"
    assert res.cues[0].language_code == "te-Latn"
    assert res.cues[0].start_time == 0.5
    assert res.cues[0].end_time == 4.2
    assert res.cues[0].words == []


# 6. Telugu Unicode line breaking
def test_telugu_unicode_line_breaking():
    telugu_text = "సినిమా మానవ భావోద్వేగాలను అద్భుతంగా చిత్రీకరించే గొప్ప కళా రూపం"
    lines = break_text_into_lines(telugu_text, max_characters_per_line=30, max_lines=2)
    assert len(lines) <= 2
    # Ensure words are not split in half corrupting Unicode
    for line in lines:
        assert not line.startswith(" ") and not line.endswith(" ")
        assert len(line) > 0
    # Rejoined text contains same words
    assert " ".join(lines) == telugu_text


# 7. Hindi Unicode line breaking
def test_hindi_unicode_line_breaking():
    hindi_text = "सिनेमा मानवीय भावनाओं को पर्दे पर जीवंत करने का एक अद्वितीय माध्यम है।"
    lines = break_text_into_lines(hindi_text, max_characters_per_line=35, max_lines=2)
    assert len(lines) <= 2
    assert " ".join(lines) == hindi_text


# 8. Line breaking balanced split (avoid single orphan word on line 2)
def test_line_breaking_balanced_split():
    text = "In the heart of Hyderabad a visionary creator was born"
    lines = break_text_into_lines(text, max_characters_per_line=32, max_lines=2)
    assert len(lines) == 2
    # Ensure line 2 is not just a single orphan word like "born"
    assert len(lines[1].split()) > 1


# 9. Max lines handling (text exceeding 2 lines wraps or accumulates gracefully)
def test_max_lines_handling():
    long_text = "One two three four five six seven eight nine ten eleven twelve thirteen fourteen fifteen sixteen seventeen eighteen"
    lines = break_text_into_lines(long_text, max_characters_per_line=25, max_lines=2)
    assert len(lines) == 2
    # Verify no text is lost
    assert " ".join(lines) == long_text


# 10. Minimum duration enforcement
def test_minimum_duration_enforcement():
    seg = TranscriptSegment(
        id="seg_0",
        text="Quick flash",
        start_time=1.0,
        end_time=1.2,  # Only 0.2s
        words=[],
    )
    req = CaptionCueGenerationRequest(
        segments=[seg],
        settings=CaptionCueSettings(minimum_cue_duration=0.8),
    )
    res = CaptionCueGeneratorService.generate_cues(req)
    assert res.cues[0].duration >= 0.8
    assert res.cues[0].end_time >= 1.8


# 11. Maximum duration splitting with words
def test_maximum_duration_splitting_with_words():
    # Long speech lasting 8 seconds
    words = [
        TranscriptWord(text=f"Word{i}", start_time=float(i), end_time=float(i + 1))
        for i in range(8)
    ]
    seg = TranscriptSegment(
        id="seg_long",
        text=" ".join(w.text for w in words),
        start_time=0.0,
        end_time=8.0,
        words=words,
    )
    req = CaptionCueGenerationRequest(
        segments=[seg],
        settings=CaptionCueSettings(maximum_cue_duration=3.0, preferred_words_per_cue=3),
    )
    res = CaptionCueGeneratorService.generate_cues(req)
    assert res.cue_count > 1
    for cue in res.cues:
        assert cue.duration <= 4.0


# 12. Gaps between spoken segments create cue breaks
def test_speech_gaps_break_cues():
    words = [
        TranscriptWord(text="Before", start_time=1.0, end_time=1.5),
        TranscriptWord(text="pause", start_time=1.5, end_time=2.0),
        # Gap of 1.5 seconds (2.0 to 3.5)
        TranscriptWord(text="After", start_time=3.5, end_time=4.0),
        TranscriptWord(text="pause", start_time=4.0, end_time=4.5),
    ]
    seg = TranscriptSegment(
        id="seg_gap",
        text="Before pause After pause",
        start_time=1.0,
        end_time=4.5,
        words=words,
    )
    req = CaptionCueGenerationRequest(
        segments=[seg],
        settings=CaptionCueSettings(gap_threshold=0.5),
    )
    res = CaptionCueGeneratorService.generate_cues(req)
    assert res.cue_count == 2
    assert res.cues[0].text == "Before pause"
    assert res.cues[1].text == "After pause"


# 13. No zero-duration cues
def test_no_zero_duration_cues():
    seg = TranscriptSegment(
        id="seg_zero",
        text="Zero duration boundary",
        start_time=2.0,
        end_time=2.0,  # Zero duration
        words=[],
    )
    req = CaptionCueGenerationRequest(
        segments=[seg],
        settings=CaptionCueSettings(minimum_cue_duration=0.8),
    )
    res = CaptionCueGeneratorService.generate_cues(req)
    assert res.cues[0].duration > 0.0
    assert res.cues[0].end_time > res.cues[0].start_time


# 14. Monotonic ordering and sanitization
def test_cues_monotonic_ordering():
    cue1 = CaptionCue(
        id="c1",
        text="First",
        start_time=2.0,
        end_time=3.5,
        duration=1.5,
        lines=["First"],
        source_segment_ids=["s1"],
    )
    cue2 = CaptionCue(
        id="c2",
        text="Second overlap",
        start_time=3.0,  # Overlaps with c1
        end_time=5.0,
        duration=2.0,
        lines=["Second overlap"],
        source_segment_ids=["s2"],
    )
    sanitized = sanitize_cues([cue2, cue1])
    assert sanitized[0].id == "c1"
    assert sanitized[1].id == "c2"
    # c1 end_time should be clamped to c2 start_time
    assert sanitized[0].end_time <= sanitized[1].start_time


# 15. No fabricated word timings when absent
def test_no_fabricated_word_timings_when_absent():
    seg = TranscriptSegment(
        id="seg_plain",
        text="Plain text segment without word breakdown",
        start_time=0.0,
        end_time=3.0,
        words=[],
    )
    req = CaptionCueGenerationRequest(segments=[seg])
    res = CaptionCueGeneratorService.generate_cues(req)
    assert res.cues[0].words == []


# 16. Custom settings applied
def test_custom_settings_applied():
    seg = TranscriptSegment(
        id="seg_0",
        text="A very specific customized subtitle line for shortform vertical videos",
        start_time=0.0,
        end_time=4.0,
        words=[],
    )
    custom_settings = CaptionCueSettings(
        max_characters_per_line=20,
        max_lines=3,
        minimum_cue_duration=1.2,
        maximum_cue_duration=5.0,
        preferred_words_per_cue=4,
    )
    req = CaptionCueGenerationRequest(segments=[seg], settings=custom_settings)
    res = CaptionCueGeneratorService.generate_cues(req)
    assert res.settings_used.max_characters_per_line == 20
    assert res.settings_used.max_lines == 3
    assert len(res.cues[0].lines) <= 3


# 17. Invalid settings handling (auto-corrected safely)
def test_invalid_settings_auto_corrected():
    seg = TranscriptSegment(
        id="seg_0",
        text="Testing auto correction of settings",
        start_time=0.0,
        end_time=2.0,
        words=[],
    )
    # min_duration > max_duration
    inverted_settings = CaptionCueSettings(
        minimum_cue_duration=5.0,
        maximum_cue_duration=2.0,
    )
    req = CaptionCueGenerationRequest(segments=[seg], settings=inverted_settings)
    res = CaptionCueGeneratorService.generate_cues(req)
    assert res.settings_used.minimum_cue_duration <= res.settings_used.maximum_cue_duration


# 18. Empty transcript handling
def test_empty_transcript_handling():
    req = CaptionCueGenerationRequest(segments=[])
    res = CaptionCueGeneratorService.generate_cues(req)
    assert res.cue_count == 0
    assert res.cues == []
    assert res.total_caption_duration == 0.0


# 19. HTTP API Endpoint integration test
@pytest.mark.asyncio
async def test_api_generate_caption_cues():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        payload = {
            "segments": [
                {
                    "id": "seg_0",
                    "text": "Every great story begins with a spark.",
                    "start_time": 0.0,
                    "end_time": 2.5,
                    "words": [
                        {"text": "Every", "start_time": 0.0, "end_time": 0.4},
                        {"text": "great", "start_time": 0.4, "end_time": 0.8},
                        {"text": "story", "start_time": 0.8, "end_time": 1.3},
                        {"text": "begins", "start_time": 1.3, "end_time": 1.8},
                        {"text": "with", "start_time": 1.8, "end_time": 2.0},
                        {"text": "a", "start_time": 2.0, "end_time": 2.1},
                        {"text": "spark.", "start_time": 2.1, "end_time": 2.5},
                    ],
                }
            ],
            "language": "English",
            "language_code": "en",
            "caption_source_type": "original",
            "settings": {
                "max_characters_per_line": 36,
                "max_lines": 2,
            },
        }

        response = await ac.post("/api/v1/captions/generate-cues", json=payload)
        assert response.status_code == 200
        data = response.json()
        assert "result" in data
        result = data["result"]
        assert result["cue_count"] >= 1
        assert len(result["cues"]) >= 1
        first_cue = result["cues"][0]
        assert first_cue["id"] == "cue_0"
        assert first_cue["start_time"] == 0.0
        assert first_cue["end_time"] > 0.0
        assert "lines" in first_cue
        assert first_cue["manually_edited"] is False
