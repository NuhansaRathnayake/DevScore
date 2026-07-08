"""
ScriptFusion CV Parser v2.

Rebuilt after v1 (spaCy PhraseMatcher) was found to silently miss
symbol-heavy skills. Root cause, confirmed directly:

    >>> import spacy; nlp = spacy.blank("en")
    >>> [t.text for t in nlp.make_doc("I know c++ and c#")]
    ['I', 'know', 'c++', 'and', 'c', '#']
    >>> [t.text for t in nlp.make_doc("c#")]
    ['c', '#']

"c#" tokenizes differently depending on what's next to it, so a
PhraseMatcher pattern built from make_doc("c#") does NOT reliably match
"c#" inside real resume text. Same failure class hits C++, .NET, Node.js,
CI/CD - anything with punctuation. That's a correctness bug, not a tuning
problem, so v2 drops PhraseMatcher entirely.

v2 approach: two complementary passes over the raw resume text -

1. DICTIONARY SCAN (whole document): plain regex substring search per
   skill alias, case-insensitive, with manual word-boundary checks that
   work correctly around punctuation (Python's \\b does NOT reliably
   bound "c++" or "c#" either, since \\b is defined by \\w and +/# aren't
   word characters - so boundaries are checked manually here: character
   before/after the match must not be alphanumeric).

2. SKILLS SECTION SCAN: finds an explicit "Skills" / "Technical Skills" /
   "Programming Languages" / etc. header (see SKILLS_SECTION_HEADERS in
   skills_dictionary.py), isolates the text block until the next section
   header, and splits it on common list delimiters (commas, bullets,
   pipes, newlines, semicolons). Every token in that block is reported -
   even ones NOT in the dictionary - tagged as "uncategorized" so nothing
   a candidate explicitly listed as a skill gets silently dropped. This
   is what makes the parser catch "any keyword about skill... [the CV]
   lists" per the brief, not just whatever we thought to add ahead of time.

KNOWN LIMITATION: section-boundary detection (which lines belong to the
skills section) works on the RAW LINE ORDER pdfplumber returns. For
multi-column resume layouts, pdfplumber's extract_text() does not always
reconstruct reading order correctly - it can interleave text from
side-by-side columns onto the same or adjacent lines. When that happens,
the skills-section extractor may pick up a few stray words from a
neighbouring column (reported as harmless "uncategorized" noise, capped
at MAX_SKILLS_SECTION_LINES below so it can't run away indefinitely).
The whole-document dictionary_scan() is NOT affected by this - it just
scans raw text regardless of line structure, so real skills are still
detected correctly either way. Fixing section detection properly for
multi-column layouts would need position-aware extraction (pdfplumber
word bounding boxes, clustered by column) rather than extract_text()'s
flat string - worth doing if your team's resumes are commonly multi-column,
but out of scope for this pass.
"""

import re
from pathlib import Path

import pdfplumber

try:
    import pytesseract
    _OCR_AVAILABLE = True
except ImportError:
    _OCR_AVAILABLE = False

from skills_dictionary import (
    SKILL_DICTIONARY,
    build_alias_lookup,
    SKILLS_SECTION_HEADERS,
    OTHER_SECTION_HEADERS,
)

_ALIAS_LOOKUP = build_alias_lookup()  # {alias_lower: canonical_name}, longest first

# Pre-compile one regex per alias with manual, punctuation-safe boundaries.
_ALIAS_PATTERNS = []
for alias, canonical in _ALIAS_LOOKUP.items():
    escaped = re.escape(alias)
    pattern = re.compile(
        r"(?<![A-Za-z0-9])" + escaped + r"(?![A-Za-z0-9])",
        re.IGNORECASE,
    )
    _ALIAS_PATTERNS.append((pattern, canonical))

_LIST_DELIMITERS = re.compile(r"[,•‣◦⁃\|;\n]+")  # NOTE: deliberately no "/" - see module docstring


def extract_text_from_pdf(pdf_path: str) -> str:
    """
    Extracts text via pdfplumber. Falls back to OCR (pytesseract) per page
    when a page has zero extractable characters - this happens for
    resumes exported as a flattened image (e.g. some Canva/Figma exports
    embed the whole page as one image with no real text layer at all).
    Confirmed against a real collected resume that would otherwise have
    been silently skipped entirely (0 chars, 1 embedded image, no error -
    parse_resume() would just report "no_extractable_text" and move on).
    """
    text_parts = []
    with pdfplumber.open(pdf_path) as pdf:
        for page in pdf.pages:
            page_text = page.extract_text()
            if page_text and page_text.strip():
                text_parts.append(page_text)
            elif _OCR_AVAILABLE:
                try:
                    image = page.to_image(resolution=250).original
                    ocr_text = pytesseract.image_to_string(image)
                    if ocr_text.strip():
                        text_parts.append(ocr_text)
                except Exception:
                    # OCR is a best-effort fallback - if it fails (missing
                    # tesseract binary, corrupt image, etc.) we still want
                    # the rest of the document's real text, not a crash.
                    pass
    return "\n".join(text_parts)


def clean_text(text: str) -> str:
    text = re.sub(r"[ \t]+", " ", text)
    text = re.sub(r"\n{2,}", "\n", text)
    return text.strip()


def dictionary_scan(text: str) -> set:
    """Whole-document regex scan against the skill dictionary."""
    found = set()
    for pattern, canonical in _ALIAS_PATTERNS:
        if pattern.search(text):
            found.add(canonical)
    return found


# Skills sections are lists, not prose - if we haven't hit a recognized
# "next section" header within this many lines, we're almost certainly
# past the real skills list and into mis-ordered text from a multi-column
# PDF layout (pdfplumber's extract_text() doesn't reconstruct column
# order reliably - see module docstring "Known limitation" below).
# Capping this bounds the damage instead of an unbounded capture.
MAX_SKILLS_SECTION_LINES = 8


def find_skills_section(text: str) -> str:
    """
    Returns the raw text block following a skills-section header, up to
    the next recognized section header, MAX_SKILLS_SECTION_LINES (see
    above), or end of document - whichever comes first. Returns "" if no
    skills header is found.
    """
    lines = text.split("\n")
    lower_lines = [l.strip().lower() for l in lines]

    start_idx = None
    for i, line in enumerate(lower_lines):
        # Header lines are typically short (a label), not full sentences.
        if len(line) <= 40 and any(line == h or line.startswith(h) for h in SKILLS_SECTION_HEADERS):
            start_idx = i + 1
            break

    if start_idx is None:
        return ""

    hard_cap = min(len(lines), start_idx + MAX_SKILLS_SECTION_LINES)
    end_idx = hard_cap
    for j in range(start_idx, hard_cap):
        candidate = lower_lines[j]
        if len(candidate) <= 40 and any(candidate == h or candidate.startswith(h) for h in OTHER_SECTION_HEADERS):
            end_idx = j
            break

    return "\n".join(lines[start_idx:end_idx]).strip()


def section_scan(text: str) -> dict:
    """
    Extracts a candidate's explicit Skills section as a list of raw
    tokens, each tagged with whichever canonical skill it matches (or
    "uncategorized" if the dictionary doesn't recognize it yet).
    Returns {"raw_block": str, "tokens": [{"text": ..., "canonical": ... or None}]}
    """
    block = find_skills_section(text)
    if not block:
        return {"raw_block": "", "tokens": []}

    raw_tokens = [t.strip() for t in _LIST_DELIMITERS.split(block) if t.strip()]
    tokens = []
    for tok in raw_tokens:
        canonical = _ALIAS_LOOKUP.get(tok.lower())
        if canonical is None:
            # try a fuzzy pass: does this token CONTAIN a known alias?
            # (handles lines like "Python (3 years)" or "React - Advanced")
            for pattern, c in _ALIAS_PATTERNS:
                if pattern.search(tok):
                    canonical = c
                    break
        tokens.append({"text": tok, "canonical": canonical})
    return {"raw_block": block, "tokens": tokens}


def extract_claimed_skills(text: str) -> dict:
    """
    Combines the dictionary scan (whole document) with the skills-section
    scan (explicit list, including unrecognized terms) into one result:

        {
          "by_category": {"language": ["Python", ...], ...},
          "uncategorized": ["SomeToolNotInDictionary", ...],
          "source_detail": {"Python": ["dictionary_scan", "skills_section"], ...}
        }
    """
    dict_hits = dictionary_scan(text)
    section = section_scan(text)

    source_detail = {skill: {"dictionary_scan"} for skill in dict_hits}
    uncategorized = []

    for tok in section["tokens"]:
        if tok["canonical"]:
            source_detail.setdefault(tok["canonical"], set()).add("skills_section")
        else:
            # A real, candidate-listed skill our dictionary doesn't know yet.
            # Reported, not dropped - add it to skills_dictionary.py once
            # you've seen it appear for real.
            uncategorized.append(tok["text"])

    by_category = {}
    for skill in source_detail:
        category = SKILL_DICTIONARY[skill]["category"]
        by_category.setdefault(category, []).append(skill)
    for category in by_category:
        by_category[category] = sorted(set(by_category[category]))

    return {
        "by_category": by_category,
        "uncategorized": sorted(set(uncategorized)),
        "source_detail": {k: sorted(v) for k, v in source_detail.items()},
        "skills_section_found": bool(section["raw_block"]),
    }


def parse_resume(pdf_path: str) -> dict:
    path = Path(pdf_path)
    if not path.exists():
        return {"status": "failed", "reason": "file_not_found", "skills": {},
                "uncategorized_terms_found": [], "skills_section_found": False}

    try:
        raw_text = extract_text_from_pdf(str(path))
    except Exception as e:
        # A malformed/corrupt PDF should not crash a batch run over many
        # candidates - report it and move on (mirrors the SRS's own
        # "display extraction status" requirement, FR32).
        return {"status": "failed", "reason": f"pdf_parse_error: {e}", "skills": {},
                "uncategorized_terms_found": [], "skills_section_found": False}

    if not raw_text.strip():
        return {"status": "failed", "reason": "no_extractable_text_even_with_ocr", "skills": {},
                "uncategorized_terms_found": [], "skills_section_found": False}

    cleaned = clean_text(raw_text)
    result = extract_claimed_skills(cleaned)
    flat_count = sum(len(v) for v in result["by_category"].values())

    return {
        "status": "success" if flat_count > 0 else "success_no_skills_found",
        "skill_count": flat_count,
        "skills": result["by_category"],
        "uncategorized_terms_found": result["uncategorized"],
        "source_detail": result["source_detail"],
        "skills_section_found": result["skills_section_found"],
        "raw_text_preview": cleaned[:300],
    }


if __name__ == "__main__":
    import sys
    import json

    result = parse_resume(sys.argv[1])
    print(json.dumps(result, indent=2))
