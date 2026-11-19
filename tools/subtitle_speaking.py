"""Writes timed English subtitles with a Chinese translation for every speaking sample recording.

For each <name>.mp3 in the folder it writes <name>.subtitles.json next to it:
    {"segments": [{"start": 0.0, "end": 3.2, "text": "...", "zh": "..."}]}
The backend serves these at /api/content/speaking-prompts/{key}/subtitles.

Speech recognition: faster-whisper (Whisper, runs locally; the model is downloaded once).
Translation: DeepSeek chat API with DEEPSEEK_API_KEY (skipped with --no-translate).
Recordings that already have translated subtitles are skipped, and ones whose translation failed
only get translated again, so the tool can be stopped and run again at any time.

Run it with Docker from the repository root (PowerShell or bash):
    docker run --rm -it -v "${PWD}:/work" -v fsi-whisper-cache:/root/.cache -w /work \
      --env-file .env python:3.12-slim \
      sh -c "pip install -q 'faster-whisper>=1.1,<2' && python tools/subtitle_speaking.py"

Options: --dir <folder> (default content-dev/ielts/speaking-audio), --model <whisper model>
(default small.en), --limit <n> (only the first n recordings), --force (redo existing),
--no-translate.
"""

import argparse
import json
import os
import sys
import time
import urllib.error
import urllib.request
from pathlib import Path

DEEPSEEK_URL = "https://api.deepseek.com/chat/completions"
TRANSLATE_PROMPT = (
    "You translate subtitles of an IELTS speaking sample answer into natural, fluent Simplified "
    "Chinese for Chinese learners of English. Translate each line separately and keep the meaning "
    "of the whole answer in mind. Reply with JSON only: {\"zh\": [one translation per line, same "
    "order, same number of lines]}."
)


def subtitles_path(audio: Path) -> Path:
    return audio.with_name(audio.stem + ".subtitles.json")


def question_of(audio: Path) -> str:
    """File names look like '<question>__<hash>.mp3'."""
    return audio.stem.rsplit("__", 1)[0].replace("_", " ").strip()


def transcribe(model, audio: Path) -> list[dict]:
    segments, _ = model.transcribe(str(audio), language="en", beam_size=5, vad_filter=True)
    lines = []
    for segment in segments:
        text = segment.text.strip()
        if text:
            lines.append({"start": round(segment.start, 2), "end": round(segment.end, 2), "text": text})
    return lines


def translate(lines: list[dict], question: str, key: str) -> list[str] | None:
    """One Chinese line per English line, or None when DeepSeek fails twice."""
    payload = {
        "model": "deepseek-chat",
        "response_format": {"type": "json_object"},
        "temperature": 0.2,
        "messages": [
            {"role": "system", "content": TRANSLATE_PROMPT},
            {
                "role": "user",
                "content": json.dumps(
                    {"question": question, "lines": [line["text"] for line in lines]},
                    ensure_ascii=False,
                ),
            },
        ],
    }
    request = urllib.request.Request(
        DEEPSEEK_URL,
        data=json.dumps(payload).encode("utf-8"),
        headers={"Authorization": f"Bearer {key}", "Content-Type": "application/json"},
    )
    for attempt in range(2):
        try:
            with urllib.request.urlopen(request, timeout=90) as response:
                body = json.load(response)
            zh = json.loads(body["choices"][0]["message"]["content"]).get("zh")
            if isinstance(zh, list) and len(zh) == len(lines) and all(isinstance(z, str) for z in zh):
                return [z.strip() for z in zh]
            print(f"    translation had {len(zh) if isinstance(zh, list) else 'no'} lines, expected {len(lines)}")
        except (urllib.error.URLError, KeyError, ValueError, TimeoutError) as error:
            print(f"    translation failed ({error})")
        time.sleep(2 * (attempt + 1))
    return None


def existing(audio: Path) -> list[dict] | None:
    path = subtitles_path(audio)
    if not path.exists():
        return None
    return json.loads(path.read_text(encoding="utf-8")).get("segments") or None


def needs_work(audio: Path, translating: bool) -> bool:
    lines = existing(audio)
    return lines is None or (translating and any(not line.get("zh") for line in lines))


def write(path: Path, lines: list[dict]) -> None:
    temporary = path.with_suffix(".tmp")
    temporary.write_text(json.dumps({"segments": lines}, ensure_ascii=False, indent=1), encoding="utf-8")
    temporary.replace(path)


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__.split("\n\n")[0])
    parser.add_argument("--dir", default="content-dev/ielts/speaking-audio")
    parser.add_argument("--model", default="small.en")
    parser.add_argument("--limit", type=int, default=0)
    parser.add_argument("--force", action="store_true")
    parser.add_argument("--no-translate", action="store_true")
    args = parser.parse_args()

    folder = Path(args.dir)
    recordings = sorted(folder.glob("*.mp3"))
    translating = not args.no_translate
    todo = [audio for audio in recordings if args.force or needs_work(audio, translating)]
    if args.limit > 0:
        todo = todo[: args.limit]
    key = os.environ.get("DEEPSEEK_API_KEY", "").strip()
    if translating and not key:
        print("DEEPSEEK_API_KEY is not set: pass --env-file .env, or use --no-translate.")
        return 2
    print(f"{len(recordings)} recordings, {len(todo)} to do (Whisper model {args.model}).")
    if not todo:
        return 0

    from faster_whisper import WhisperModel  # imported late: installed inside the container

    model = None
    failed = 0
    for number, audio in enumerate(todo, start=1):
        started = time.time()
        lines = None if args.force else existing(audio)
        if lines is None:
            if model is None:
                model = WhisperModel(args.model, device="cpu", compute_type="int8")
            lines = transcribe(model, audio)
        if not lines:
            print(f"[{number}/{len(todo)}] {audio.name}: no speech found, skipped")
            failed += 1
            continue
        if translating:
            zh = translate(lines, question_of(audio), key)
            if zh is None:
                failed += 1
            else:
                for line, translation in zip(lines, zh):
                    line["zh"] = translation
        write(subtitles_path(audio), lines)
        print(f"[{number}/{len(todo)}] {audio.name}: {len(lines)} lines in {time.time() - started:.0f}s")
    print(f"Done. {failed} recording(s) without full subtitles; run the same command again to retry them.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
