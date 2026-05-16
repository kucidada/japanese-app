#!/usr/bin/env python3
"""
Add Chinese translations (cn) to kanji example data.
Reads existing kanji JSON, translates English `meaning` to Chinese,
and writes back with `cn` field while keeping `meaning` as `en`.
"""

import json
import os
import sys
import time

from googletrans import Translator

KANJI_DIR = "src/data/kanji"
LEVELS = ["n5", "n4", "n3", "n2", "n1"]

translator = Translator()


def translate_batch(texts: list[str]) -> list[str]:
    """Translate a batch of English texts to Chinese."""
    results = []
    for text in texts:
        if not text.strip():
            results.append("")
            continue
        try:
            r = translator.translate(text, dest="zh-cn")
            results.append(r.text)
        except Exception as e:
            print(f"  Error translating '{text}': {e}")
            results.append(text)
        time.sleep(0.05)  # rate limiting
    return results


def main():
    for level in LEVELS:
        path = os.path.join(KANJI_DIR, f"{level}.json")
        if not os.path.exists(path):
            print(f"  Skipping {level}: file not found")
            continue

        data = json.load(open(path, encoding="utf-8"))

        total_examples = sum(len(k["examples"]) for k in data)
        existing_cn = sum(
            1 for k in data for ex in k["examples"] if "cn" in ex and ex["cn"]
        )
        print(f"{level}: {total_examples} examples ({existing_cn} already have cn)")

        to_translate = []
        to_translate_idx = []

        for ki, k in enumerate(data):
            for ei, ex in enumerate(k["examples"]):
                if "cn" not in ex or not ex["cn"]:
                    to_translate.append(ex["meaning"])
                    to_translate_idx.append((ki, ei))

        if not to_translate:
            print(f"  All done, nothing to translate.")
            continue

        print(f"  Translating {len(to_translate)} examples...")
        translations = translate_batch(to_translate)

        for (ki, ei), cn_text in zip(to_translate_idx, translations):
            data[ki]["examples"][ei]["cn"] = cn_text

        # Write back
        json.dump(data, open(path, "w", encoding="utf-8"), ensure_ascii=False, indent=2)
        print(f"  ✓ Saved {level}.json")

    print("\nDone!")


if __name__ == "__main__":
    main()
