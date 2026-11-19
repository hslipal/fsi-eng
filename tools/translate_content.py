"""Fills in missing Chinese translations of pattern drills in content files, with DeepSeek.

For substitution, transformation, response and expansion drills it adds, where missing:
  drill "modelTranslation"  - the model sentence
  item  "translation"       - the first answer
  item  "cueTranslation"    - the cue, for transformation and response drills (cues are sentences)
Existing translations are kept, so the tool can run again after content is added. Translations
of reviewed content (content/) are content changes: review them like any other edit.

Run it with Docker from the repository root (PowerShell or bash):
    docker run --rm -it -v "${PWD}:/work" -w /work --env-file .env python:3.12-slim \
      python tools/translate_content.py content-dev/business content-dev/ielts

Arguments: files or folders (folders: their *.json files). Default: content-dev/*/ and
content/_drafts/*/.
"""

import json
import os
import sys
import time
import urllib.error
import urllib.request
from pathlib import Path

DEEPSEEK_URL = "https://api.deepseek.com/chat/completions"
PATTERN_TYPES = {"substitution", "transformation", "response", "expansion"}
SENTENCE_CUES = {"transformation", "response"}
PROMPT = (
    "Translate English sentences from an English-learning course into natural Simplified Chinese "
    "for Chinese learners. Keep numbers, names and anything in brackets such as '(although)' as "
    "they are. Reply with JSON only: {\"zh\": [one translation per sentence, same order, same "
    "number]}."
)


def files_from(arguments: list[str]) -> list[Path]:
    targets = arguments or ["content-dev", "content/_drafts"]
    found: list[Path] = []
    for target in map(Path, targets):
        if target.is_file():
            found.append(target)
        elif target.is_dir():
            found.extend(sorted(target.glob("*.json")) + sorted(target.glob("*/*.json")))
    return [path for path in found if not path.name.endswith(".subtitles.json")]


def missing(drill: dict) -> list[tuple[dict, str, str]]:
    """(object, field, English) for every translation the drill lacks."""
    wanted = []
    if drill.get("model") and not drill.get("modelTranslation"):
        wanted.append((drill, "modelTranslation", drill["model"]))
    for item in drill.get("items") or []:
        if item.get("answers") and not item.get("translation"):
            wanted.append((item, "translation", item["answers"][0]))
        if drill["type"] in SENTENCE_CUES and item.get("cue") and not item.get("cueTranslation"):
            wanted.append((item, "cueTranslation", item["cue"]))
    return wanted


def translate(sentences: list[str], key: str) -> list[str] | None:
    payload = {
        "model": "deepseek-chat",
        "response_format": {"type": "json_object"},
        "temperature": 0.2,
        "messages": [
            {"role": "system", "content": PROMPT},
            {"role": "user", "content": json.dumps({"sentences": sentences}, ensure_ascii=False)},
        ],
    }
    request = urllib.request.Request(
        DEEPSEEK_URL,
        data=json.dumps(payload).encode("utf-8"),
        headers={"Authorization": f"Bearer {key}", "Content-Type": "application/json"},
    )
    for attempt in range(2):
        try:
            with urllib.request.urlopen(request, timeout=120) as response:
                body = json.load(response)
            zh = json.loads(body["choices"][0]["message"]["content"]).get("zh")
            if isinstance(zh, list) and len(zh) == len(sentences) and all(isinstance(z, str) for z in zh):
                return [z.strip() for z in zh]
            print(f"    got {len(zh) if isinstance(zh, list) else 'no'} translations, expected {len(sentences)}")
        except (urllib.error.URLError, KeyError, ValueError, TimeoutError) as error:
            print(f"    translation failed ({error})")
        time.sleep(2 * (attempt + 1))
    return None


def main() -> int:
    key = os.environ.get("DEEPSEEK_API_KEY", "").strip()
    if not key:
        print("DEEPSEEK_API_KEY is not set: pass --env-file .env.")
        return 2
    files = files_from(sys.argv[1:])
    failed = 0
    for path in files:
        content = json.loads(path.read_text(encoding="utf-8"))
        drills = [d for d in content.get("drills") or [] if d.get("type") in PATTERN_TYPES]
        added = 0
        for drill in drills:
            wanted = missing(drill)
            if not wanted:
                continue
            zh = translate([english for _, _, english in wanted], key)
            if zh is None:
                failed += 1
                continue
            for (target, field, _), translation in zip(wanted, zh):
                target[field] = translation
            added += len(wanted)
        if added:
            path.write_text(json.dumps(content, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
            print(f"{path}: {added} translation(s) added")
    print(f"Done. {failed} drill(s) could not be translated; run again to retry them.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
