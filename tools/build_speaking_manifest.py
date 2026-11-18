"""Builds content-dev/ielts/speaking-questions.json from the speaking audio folder.

Usage: python3 build_speaking_manifest.py <content-dev/ielts dir>

The audio files are sample answers of unknown origin, so the item is licensed dev-only.
Question text comes from the file names (cleaned up); the IELTS part is inferred:
"Describe ..." is Part 2, personal questions are Part 1, general/opinion questions Part 3.
"""

import json
import re
import subprocess
import sys
import uuid
from pathlib import Path

NAMESPACE = uuid.UUID("6f0e2d1c-6a4b-4c1f-9a8e-2f5b7c3d9e10")

TYPOS = {
    "unlukcy": "unlucky",
    "compputer": "computer",
    " iin ": " in ",
    "remmber": "remember",
    "adveretisement": "advertisement",
    "toschool": "to school",
    "didn`t": "didn't",
    "live along or": "live alone or",
    "have you live there": "have you lived there",
    "any people live in": "any people who live in",
    "job connect to": "job connected to",
    "in the house or apartment": "in a house or an apartment",
}

SECOND_QUESTION = re.compile(r"(\w) (Do you|Is that|Why did|Why)\b")
PERSONAL = re.compile(r"\b(you|your)\b", re.IGNORECASE)
OPINION = re.compile(r"^(Do you think|Should|Why do|Why are|Why can|Why is|How can|How has)", re.IGNORECASE)


def clean(stem: str) -> str:
    text = stem.split("__")[0].replace(" (2)", "").strip()
    if text.startswith("ls "):
        text = "Is " + text[3:]
    for wrong, right in TYPOS.items():
        text = text.replace(wrong, right)
    text = SECOND_QUESTION.sub(r"\1? \2", text)
    if text.startswith("Some people") and not text.endswith("."):
        text += "."
    if not text.startswith("Describe") and not text.endswith(("?", ".")):
        text += "?"
    return text


def part_of(question: str) -> int:
    if question.startswith("Describe"):
        return 2
    if OPINION.match(question) or not PERSONAL.search(question):
        return 3
    return 1


def seconds(path: Path) -> float:
    out = subprocess.run(
        ["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", str(path)],
        capture_output=True,
        text=True,
        check=True,
    )
    return round(float(out.stdout.strip()), 1)


def main(root: Path) -> None:
    audio_dir = root / "speaking-audio"
    prompts = []
    seen = set()
    for path in sorted(audio_dir.glob("*.mp3")):
        question = clean(path.stem)
        if question in seen:
            continue
        seen.add(question)
        prompts.append(
            {
                "cue": question,
                "part": part_of(question),
                "audio": f"{root.name}/speaking-audio/{path.name}",
                "seconds": seconds(path),
            }
        )
    prompts.sort(key=lambda p: (p["part"], p["cue"]))
    item = {
        "id": str(uuid.uuid5(NAMESPACE, "ielts-speaking-samples")),
        "track": "ielts",
        "title": "IELTS speaking questions with sample answers (dev-only)",
        "level": "band 6.5",
        "source": {"note": "audio provided by the owner; origin and licence not yet confirmed"},
        "license": {"kind": "dev-only"},
        "drills": [
            {
                "type": "speaking",
                "instruction": "Answer the question aloud, then compare with the sample answer.",
                "items": prompts,
            }
        ],
    }
    out = root / "speaking-questions.json"
    out.write_text(json.dumps(item, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    parts = {n: sum(1 for p in prompts if p["part"] == n) for n in (1, 2, 3)}
    print(f"{len(prompts)} prompts written to {out} (by part: {parts})")


if __name__ == "__main__":
    main(Path(sys.argv[1]))
