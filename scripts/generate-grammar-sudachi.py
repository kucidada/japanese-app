#!/usr/bin/env python3
"""
Generate grammar JSON files from Sudachi database.
Uses SudachiPy to verify and extract conjugation forms,
then outputs structured grammar lessons compatible with the existing app.
"""

import json
import os
import sys
from typing import Any

from sudachipy import dictionary, tokenizer

tok = dictionary.Dictionary().create()
mode = tokenizer.Tokenizer.SplitMode.C

OUTPUT_DIR = "src/data/grammar"

# ─── Helper: conjugate and verify with Sudachi ──────────────────────────

def verify(word: str) -> tuple:
    """Tokenize a word and return (pos5, pos6, dict_form, reading)."""
    m = tok.tokenize(word, mode)[0]
    pos = m.part_of_speech()
    return pos[4], pos[5], m.dictionary_form(), m.reading_form()


def conj_table(dict_form: str, forms: dict[str, str]) -> dict[str, dict]:
    """
    Given a dictionary form and a mapping of {form_name: conjugated_word},
    verify each through Sudachi and return {form_name: {word, pos5, pos6, reading}}.
    """
    result = {}
    for name, word in forms.items():
        pos5, pos6, df, reading = verify(word)
        result[name] = {
            "word": word,
            "pos5": pos5 if pos5 != "*" else "",
            "pos6": pos6 if pos6 != "*" else "",
            "reading": reading or "",
            "dictionaryForm": df,
        }
    return result


TYPE_SLUGS: dict[str, str] = {
    "五段-カ行": "godan-ka",
    "五段-ガ行": "godan-ga",
    "五段-サ行": "godan-sa",
    "五段-タ行": "godan-ta",
    "五段-ナ行": "godan-na",
    "五段-バ行": "godan-ba",
    "五段-マ行": "godan-ma",
    "五段-ラ行": "godan-ra",
    "五段-ワア行": "godan-wa",
    "上一段-カ行": "ichidan-kami-ka",
    "上一段-マ行": "ichidan-kami-ma",
    "下一段-バ行": "ichidan-shimo-ba",
    "下一段-カ行": "ichidan-shimo-ka",
    "サ行変格": "sagyou-henkaku",
    "カ行変格": "kagyou-henkaku",
    "形容詞": "i-adjective",
}

def generate_id(level: str, slug: str) -> str:
    # Use ASCII-only slug
    ascii_slug = TYPE_SLUGS.get(slug, slug.replace(" ", "_").replace("-", "_"))
    return f"{level}-{ascii_slug}"


def make_example(jp: str, cn: str, en: str = "") -> dict:
    return {"jp": jp, "cn": cn, "jpFuri": "", "en": en}


# ─── Representative verbs ───────────────────────────────────────────────

GODAN_REPS: dict[str, tuple[str, str, str]] = {
    "五段-カ行": ("書く", "kaku", "かく"),
    "五段-ガ行": ("泳ぐ", "oyogu", "およぐ"),
    "五段-サ行": ("話す", "hanasu", "はなす"),
    "五段-タ行": ("待つ", "matsu", "まつ"),
    "五段-ナ行": ("死ぬ", "shinu", "しぬ"),
    "五段-バ行": ("遊ぶ", "asobu", "あそぶ"),
    "五段-マ行": ("読む", "yomu", "よむ"),
    "五段-ラ行": ("取る", "toru", "とる"),
    "五段-ワア行": ("買う", "kau", "かう"),
}

ICHIDAN_KAMI_REPS: dict[str, tuple[str, str, str]] = {
    "上一段-カ行": ("起きる", "okiru", "おきる"),
    "上一段-マ行": ("見る", "miru", "みる"),
}

ICHIDAN_SHIMO_REPS: dict[str, tuple[str, str, str]] = {
    "下一段-バ行": ("食べる", "taberu", "たべる"),
    "下一段-カ行": ("受ける", "ukeru", "うける"),
}

IRREGULAR_REPS: dict[str, tuple[str, str, str]] = {
    "サ行変格": ("する", "suru", "する"),
    "カ行変格": ("来る", "kuru", "くる"),
}

I_ADJ_REPS: dict[str, tuple[str, str, str]] = {
    "形容詞": ("美しい", "utsukushii", "うつくしい"),
}

# ─── Conjugation form definitions ───────────────────────────────────────

# For each godan type, generate ALL attested forms
GODAN_FORMS: dict[str, dict[str, str]] = {
    "五段-カ行": {
        "辞書形 (終止形)": "書く",
        "ない形 (未然形)": "書かない",
        "ます形 (連用形)": "書きます",
        "連体形": "書くとき",
        "ば形 (仮定形)": "書けば",
        "意向形 (意志推量形)": "書こう",
        "た形 (連用形-イ音便)": "書いた",
        "て形 (連用形-イ音便)": "書いて",
    },
    "五段-ガ行": {
        "辞書形 (終止形)": "泳ぐ",
        "ない形 (未然形)": "泳がない",
        "ます形 (連用形)": "泳ぎます",
        "連体形": "泳ぐとき",
        "ば形 (仮定形)": "泳げば",
        "意向形 (意志推量形)": "泳ごう",
        "た形 (連用形-イ音便)": "泳いだ",
        "て形 (連用形-イ音便)": "泳いで",
    },
    "五段-サ行": {
        "辞書形 (終止形)": "話す",
        "ない形 (未然形)": "話さない",
        "ます形 (連用形)": "話します",
        "連体形": "話すとき",
        "ば形 (仮定形)": "話せば",
        "意向形 (意志推量形)": "話そう",
        "た形 (連用形-一般)": "話した",  # サ行: no sound change
        "て形 (連用形-一般)": "話して",
    },
    "五段-タ行": {
        "辞書形 (終止形)": "待つ",
        "ない形 (未然形)": "待たない",
        "ます形 (連用形)": "待ちます",
        "連体形": "待つとき",
        "ば形 (仮定形)": "待てば",
        "意向形 (意志推量形)": "待とう",
        "た形 (連用形-促音便)": "待った",
        "て形 (連用形-促音便)": "待って",
    },
    "五段-ナ行": {
        "辞書形 (終止形)": "死ぬ",
        "ない形 (未然形)": "死なない",
        "ます形 (連用形)": "死にます",
        "連体形": "死ぬとき",
        "ば形 (仮定形)": "死ねば",
        "意向形 (意志推量形)": "死のう",
        "た形 (連用形-撥音便)": "死んだ",
        "て形 (連用形-撥音便)": "死んで",
    },
    "五段-バ行": {
        "辞書形 (終止形)": "遊ぶ",
        "ない形 (未然形)": "遊ばない",
        "ます形 (連用形)": "遊びます",
        "連体形": "遊ぶとき",
        "ば形 (仮定形)": "遊べば",
        "意向形 (意志推量形)": "遊ぼう",
        "た形 (連用形-撥音便)": "遊んだ",
        "て形 (連用形-撥音便)": "遊んで",
    },
    "五段-マ行": {
        "辞書形 (終止形)": "読む",
        "ない形 (未然形)": "読まない",
        "ます形 (連用形)": "読みます",
        "連体形": "読むとき",
        "ば形 (仮定形)": "読めば",
        "意向形 (意志推量形)": "読もう",
        "た形 (連用形-撥音便)": "読んだ",
        "て形 (連用形-撥音便)": "読んで",
    },
    "五段-ラ行": {
        "辞書形 (終止形)": "取る",
        "ない形 (未然形)": "取らない",
        "ます形 (連用形)": "取ります",
        "連体形": "取るとき",
        "ば形 (仮定形)": "取れば",
        "意向形 (意志推量形)": "取ろう",
        "た形 (連用形-促音便)": "取った",
        "て形 (連用形-促音便)": "取って",
    },
    "五段-ワア行": {
        "辞書形 (終止形)": "買う",
        "ない形 (未然形)": "買わない",
        "ます形 (連用形)": "買います",
        "連体形": "買うとき",
        "ば形 (仮定形)": "買えば",
        "意向形 (意志推量形)": "買おう",
        "た形 (連用形-促音便)": "買った",
        "て形 (連用形-促音便)": "買って",
    },
}

ICHIDAN_FORMS: dict[str, dict[str, str]] = {
    "上一段-カ行": {
        "辞書形 (終止形)": "起きる",
        "ない形 (未然形)": "起きない",
        "ます形 (連用形)": "起きます",
        "連体形": "起きるとき",
        "ば形 (仮定形)": "起きれば",
        "意向形 (意志推量形)": "起きよう",
        "た形 (連用形)": "起きた",
        "て形 (連用形)": "起きて",
    },
    "上一段-マ行": {
        "辞書形 (終止形)": "見る",
        "ない形 (未然形)": "見ない",
        "ます形 (連用形)": "見ます",
        "連体形": "見るとき",
        "ば形 (仮定形)": "見れば",
        "意向形 (意志推量形)": "見よう",
        "た形 (連用形)": "見た",
        "て形 (連用形)": "見て",
    },
    "下一段-バ行": {
        "辞書形 (終止形)": "食べる",
        "ない形 (未然形)": "食べない",
        "ます形 (連用形)": "食べます",
        "連体形": "食べるとき",
        "ば形 (仮定形)": "食べれば",
        "意向形 (意志推量形)": "食べよう",
        "た形 (連用形)": "食べた",
        "て形 (連用形)": "食べて",
    },
    "下一段-カ行": {
        "辞書形 (終止形)": "受ける",
        "ない形 (未然形)": "受けない",
        "ます形 (連用形)": "受けます",
        "連体形": "受けるとき",
        "ば形 (仮定形)": "受ければ",
        "意向形 (意志推量形)": "受けよう",
        "た形 (連用形)": "受けた",
        "て形 (連用形)": "受けて",
    },
}

IRREGULAR_FORMS: dict[str, dict[str, str]] = {
    "サ行変格": {
        "辞書形 (終止形)": "する",
        "ない形 (未然形)": "しない",
        "ます形 (連用形)": "します",
        "連体形": "するとき",
        "ば形 (仮定形)": "すれば",
        "意向形 (意志推量形)": "しよう",
        "た形 (連用形)": "した",
        "て形 (連用形)": "して",
    },
    "カ行変格": {
        "辞書形 (終止形)": "来る",
        "ない形 (未然形)": "来ない",
        "ます形 (連用形)": "来ます",
        "連体形": "来るとき",
        "ば形 (仮定形)": "来れば",
        "意向形 (意志推量形)": "来よう",
        "た形 (連用形)": "来た",
        "て形 (連用形)": "来て",
    },
}

# ─── Build grammar points ───────────────────────────────────────────────

def build_conjugation_lesson(
    level: str,
    type_name: str,
    rep: tuple[str, str, str],
    forms: dict[str, dict],
    rule_desc: str,
    usage_pattern: str,
    explanation: str,
    examples: list[dict],
    category: str = "动词活用",
) -> dict:

    kanji, roman, hira = rep

    # Build conjugation table text from verified forms
    table_lines = []
    for form_name, data in forms.items():
        pos6_clean = data["pos6"].replace("-", "・") if data["pos6"] else ""
        reading_note = f"（読：{data['reading']}）" if data["reading"] else ""
        table_lines.append(f"  {form_name}: {data['word']} {reading_note}")

    full_explanation = f"{explanation}\n\nSudachi 活用表：\n" + "\n".join(table_lines)

    return {
        "id": generate_id(level, type_name),
        "level": level.upper(),
        "pattern": f"動詞{type_name} ({kanji})",
        "meaning": rule_desc,
        "usage": usage_pattern,
        "explanation": full_explanation,
        "colloquial": "",
        "examples": examples,
        "related": [],
        "repeatIn": [],
        "category": category,
    }


# ═══════════════════════════════════════════════════════════════════════
# N5: Basic verb conjugation
# ═══════════════════════════════════════════════════════════════════════

N5: list[dict] = []

# ── N5-1: 五段动词概览 ──
N5.append({
    "id": generate_id("n5", "godan_overview"),
    "level": "N5",
    "pattern": "五段动词活用概览",
    "meaning": "五段動詞（Godan Verbs）的活用體系",
    "usage": "全ての五段動詞 <v.stem> + 活用語尾",
    "explanation": (
        "五段动词是日语中最主要的动词类别。"
        "词尾在五十音图的「う・く・ぐ・す・つ・ぬ・ぶ・む・る・う」段上变化，因此称为「五段」。"
        "活用种类包括：未然形（ない形）、連用形（ます形）、終止形（辞書形）、連体形、仮定形（ば形）、意志推量形（う・よう形）。"
        "音便规则（イ音便・促音便・撥音便）是五段动词特有的现象，用于连接「た/て/たり」等。"
    ),
    "usage": "五段动词是日语动词的主要类别，词尾在 く・ぐ・す・つ・ぬ・ぶ・む・る・う 九种之间变化",
    "colloquial": "口语中五段动词的て形常发生音便，如「読んで」「買って」",
    "examples": [
        make_example("本を読む。", "读书。", "Read a book."),
        make_example("手紙を書く。", "写信。", "Write a letter."),
        make_example("駅で待つ。", "在车站等。", "Wait at the station."),
        make_example("友達と遊ぶ。", "和朋友玩。", "Play with friends."),
        make_example("音楽を聞く。", "听音乐。", "Listen to music."),
    ],
    "related": [],
    "repeatIn": [],
    "category": "动词活用",
})


# ── N5-2 ~ N5-10: Each godan type ──
GODAN_RULES: dict[str, tuple[str, str, str]] = {
    "五段-カ行": (
        "五段-カ行（書く型）：词尾 く→か/き/く/け/こ",
        "書か(ない) / 書き(ます) / 書く / 書く(とき) / 書け(ば) / 書こ(う) / 書い(た・て)",
        "词尾为「く」的五段动词。未然形变为「か」，連用形变为「き」，仮定形变为「け」，意志形变为「こ」。"
        "て形/た形发生イ音便：「く」→「い」（書く→書いて・書いた）。"
        "是五段动词中最常见的类型之一。"
    ),
    "五段-ガ行": (
        "五段-ガ行（泳ぐ型）：词尾 ぐ→が/ぎ/ぐ/げ/ご",
        "泳が(ない) / 泳ぎ(ます) / 泳ぐ / 泳ぐ(とき) / 泳げ(ば) / 泳ご(う) / 泳い(だ・で)",
        "词尾为「ぐ」的五段动词。变化规律与カ行相似。"
        "て形/た形同样发生イ音便：「ぐ」→「い」。"
        "浊音行，て形变为「で」，た形变为「だ」。"
    ),
    "五段-サ行": (
        "五段-サ行（話す型）：词尾 す→さ/し/す/せ/そ",
        "話さ(ない) / 話し(ます) / 話す / 話す(とき) / 話せ(ば) / 話そ(う) / 話し(た・て)",
        "词尾为「す」的五段动词。未然形变为「さ」。"
        "て形/た形不发生音便，直接使用連用形「し」+「た/て」。"
        "注意：サ行动词的て形/た形没有音便变化。"
    ),
    "五段-タ行": (
        "五段-タ行（待つ型）：词尾 つ→た/ち/つ/て/と",
        "待た(ない) / 待ち(ます) / 待つ / 待つ(とき) / 待て(ば) / 待と(う) / 待っ(た・て)",
        "词尾为「つ」的五段动词。"
        "て形/た形发生促音便：「つ」→「っ」（待つ→待って・待った）。"
    ),
    "五段-ナ行": (
        "五段-ナ行（死ぬ型）：词尾 ぬ→な/に/ぬ/ね/の",
        "死な(ない) / 死に(ます) / 死ぬ / 死ぬ(とき) / 死ね(ば) / 死の(う) / 死ん(だ・で)",
        "词尾为「ぬ」的五段动词。是日语中唯一以「ぬ」结尾的常用动词。"
        "て形/た形发生撥音便：「ぬ」→「ん」（死ぬ→死んで・死んだ）。"
        "注意：浊音行，て形变为「で」，た形变为「だ」。"
    ),
    "五段-バ行": (
        "五段-バ行（遊ぶ型）：词尾 ぶ→ば/び/ぶ/べ/ぼ",
        "遊ば(ない) / 遊び(ます) / 遊ぶ / 遊ぶ(とき) / 遊べ(ば) / 遊ぼ(う) / 遊ん(だ・で)",
        "词尾为「ぶ」的五段动词。"
        "て形/た形发生撥音便：「ぶ」→「ん」（遊ぶ→遊んで・遊んだ）。"
        "浊音行，て形变为「で」，た形变为「だ」。"
    ),
    "五段-マ行": (
        "五段-マ行（読む型）：词尾 む→ま/み/む/め/も",
        "読ま(ない) / 読み(ます) / 読む / 読む(とき) / 読め(ば) / 読も(う) / 読ん(だ・で)",
        "词尾为「む」的五段动词。"
        "て形/た形发生撥音便：「む」→「ん」（読む→読んで・読んだ）。"
        "浊音行，て形变为「で」，た形变为「だ」。"
    ),
    "五段-ラ行": (
        "五段-ラ行（取る型）：词尾 る→ら/り/る/れ/ろ",
        "取ら(ない) / 取り(ます) / 取る / 取る(とき) / 取れ(ば) / 取ろ(う) / 取っ(た・て)",
        "词尾为「る」的五段动词。注意不要与一段动词混淆（一段动词的词尾为「る」但前一音节不同）。"
        "て形/た形发生促音便：「る」→「っ」（取る→取って・取った）。"
        "五段-ラ行动词数量很多，包括「ある」「作る」「なる」等高频词。"
    ),
    "五段-ワア行": (
        "五段-ワア行（買う型）：词尾 う→わ/い/う/え/お",
        "買わ(ない) / 買い(ます) / 買う / 買う(とき) / 買え(ば) / 買お(う) / 買っ(た・て)",
        "词尾为「う」的五段动词。注意未然形词尾变为「わ」而非「あ」。"
        "て形/た形发生促音便：「う」→「っ」（買う→買って・買った）。"
        "包括「会う」「思う」「違う」等常见动词。"
    ),
}

for type_name, (rep_kanji, rep_roman, rep_hira) in GODAN_REPS.items():
    rule_desc, usage_pat, explanation = GODAN_RULES[type_name]
    forms_data = GODAN_FORMS[type_name]
    verified = conj_table(rep_kanji, forms_data)

    # Examples per type
    ex = []
    for (form_key, _) in list(forms_data.items())[:4]:  # first 4 forms
        verb_form = forms_data[form_key]
        canonical = rep_kanji  # e.g. 書く
        target_stem = verified[form_key]["word"][:-1] if len(verified[form_key]["word"]) > 1 else verified[form_key]["word"]

        if type_name == "五段-カ行":
            name, ob, wo = "本", "を", "書く"
            if "ない" in form_key: ex.append(make_example(f"本を{verb_form}。", f"不{rep_kanji[0:-1]}书。", f"I don't read a book."))
            elif "ます" in form_key: ex.append(make_example(f"本を{verb_form}。", f"读书（礼貌）。", f"I read a book (polite)."))
            elif "辞書" in form_key: ex.append(make_example(f"本を{verb_form}。", f"读书。", f"I read a book."))
            elif "ば" in form_key: ex.append(make_example(f"本を{verified[form_key]['word'][:-1]}ば読める。", f"如果读书就能看懂。", f"If I read, I can understand."))
            elif "意向" in form_key: ex.append(make_example(f"本を{verb_form}。", f"来读书吧！", f"Let's read a book!"))
            elif "た" in form_key: ex.append(make_example(f"本を{verb_form}。", f"读了书。", f"I read a book (past)."))
            elif "て" in form_key: ex.append(make_example(f"本を{verb_form}いる。", f"正在读书。", f"I am reading a book."))
            else: ex.append(make_example(f"本を{verb_form}。", f"（{rep_kanji}的用法）", ""))
        elif type_name == "五段-ガ行":
            if "ない" in form_key: ex.append(make_example(f"海で{verb_form}。", f"不在海里游泳。", f"I don't swim in the sea."))
            elif "ます" in form_key: ex.append(make_example(f"海で{verb_form}。", f"在海里游泳（礼貌）。", f"I swim in the sea (polite)."))
            elif "辞書" in form_key: ex.append(make_example(f"海で{verb_form}。", f"在海里游泳。", f"I swim in the sea."))
            elif "た" in form_key: ex.append(make_example(f"海で{verb_form}。", f"游了泳。", f"I swam in the sea."))
            elif "て" in form_key: ex.append(make_example(f"海で{verb_form}いる。", f"正在游泳。", f"I am swimming."))
            else: ex.append(make_example(f"海で{verb_form}。", f"（{rep_kanji}的用法）", ""))
        elif type_name == "五段-サ行":
            if "ない" in form_key: ex.append(make_example(f"日本語を{verb_form}。", f"不说日语。", f"I don't speak Japanese."))
            elif "ます" in form_key: ex.append(make_example(f"日本語を{verb_form}。", f"说日语（礼貌）。", f"I speak Japanese (polite)."))
            elif "辞書" in form_key: ex.append(make_example(f"日本語を{verb_form}。", f"说日语。", f"I speak Japanese."))
            elif "た" in form_key: ex.append(make_example(f"日本語を{verb_form}。", f"说了日语。", f"I spoke Japanese."))
            elif "て" in form_key: ex.append(make_example(f"日本語を{verb_form}いる。", f"正在说日语。", f"I am speaking Japanese."))
            else: ex.append(make_example(f"日本語を{verb_form}。", f"（{rep_kanji}的用法）", ""))
        elif type_name == "五段-タ行":
            if "ない" in form_key: ex.append(make_example(f"バスを{verb_form}。", f"不等公交车。", f"I don't wait for the bus."))
            elif "ます" in form_key: ex.append(make_example(f"バスを{verb_form}。", f"等公交车（礼貌）。", f"I wait for the bus (polite)."))
            elif "辞書" in form_key: ex.append(make_example(f"バスを{verb_form}。", f"等公交车。", f"I wait for the bus."))
            elif "た" in form_key: ex.append(make_example(f"バスを{verb_form}。", f"等了公交车。", f"I waited for the bus."))
            elif "て" in form_key: ex.append(make_example(f"バスを{verb_form}いる。", f"正在等公交车。", f"I am waiting for the bus."))
            else: ex.append(make_example(f"バスを{verb_form}。", f"（{rep_kanji}的用法）", ""))
        elif type_name == "五段-ナ行":
            if "ない" in form_key: ex.append(make_example(f"戦場で{verb_form}。", f"不在战场上死。", f"I won't die on the battlefield."))
            elif "ます" in form_key: ex.append(make_example(f"病気で{verb_form}。", f"因病去世（礼貌）。", f"Die from illness (polite)."))
            elif "辞書" in form_key: ex.append(make_example(f"人間はいつか{verb_form}。", f"人总有一天会死。", f"Everyone dies someday."))
            elif "た" in form_key: ex.append(make_example(f"祖父が{verb_form}。", f"祖父去世了。", f"My grandfather passed away."))
            elif "て" in form_key: ex.append(make_example(f"戦場で{verb_form}いく。", f"战死沙场。", f"Die in battle."))
            else: ex.append(make_example(f"戦場で{verb_form}。", f"（{rep_kanji}的用法）", ""))
        elif type_name == "五段-バ行":
            if "ない" in form_key: ex.append(make_example(f"外で{verb_form}。", f"不在外面玩。", f"I don't play outside."))
            elif "ます" in form_key: ex.append(make_example(f"友達と{verb_form}。", f"和朋友玩（礼貌）。", f"I play with friends (polite)."))
            elif "辞書" in form_key: ex.append(make_example(f"子供が{verb_form}。", f"小孩在玩。", f"Children play."))
            elif "た" in form_key: ex.append(make_example(f"公園で{verb_form}。", f"在公园玩了。", f"I played at the park."))
            elif "て" in form_key: ex.append(make_example(f"外で{verb_form}いる。", f"正在外面玩。", f"I am playing outside."))
            else: ex.append(make_example(f"外で{verb_form}。", f"（{rep_kanji}的用法）", ""))
        elif type_name == "五段-マ行":
            if "ない" in form_key: ex.append(make_example(f"本を{verb_form}。", f"不读书。", f"I don't read a book."))
            elif "ます" in form_key: ex.append(make_example(f"本を{verb_form}。", f"读书（礼貌）。", f"I read a book (polite)."))
            elif "辞書" in form_key: ex.append(make_example(f"小説を{verb_form}。", f"读小说。", f"I read a novel."))
            elif "た" in form_key: ex.append(make_example(f"新聞を{verb_form}。", f"读了报纸。", f"I read the newspaper."))
            elif "て" in form_key: ex.append(make_example(f"本を{verb_form}いる。", f"正在读书。", f"I am reading a book."))
            else: ex.append(make_example(f"本を{verb_form}。", f"（{rep_kanji}的用法）", ""))
        elif type_name == "五段-ラ行":
            if "ない" in form_key: ex.append(make_example(f"薬を{verb_form}。", f"不吃药。", f"I don't take medicine."))
            elif "ます" in form_key: ex.append(make_example(f"薬を{verb_form}。", f"吃药（礼貌）。", f"I take medicine (polite)."))
            elif "辞書" in form_key: ex.append(make_example(f"薬を{verb_form}。", f"吃药。", f"I take medicine."))
            elif "た" in form_key: ex.append(make_example(f"薬を{verb_form}。", f"吃了药。", f"I took medicine."))
            elif "て" in form_key: ex.append(make_example(f"薬を{verb_form}いる。", f"正在吃药。", f"I am taking medicine."))
            else: ex.append(make_example(f"薬を{verb_form}。", f"（{rep_kanji}的用法）", ""))
        elif type_name == "五段-ワア行":
            if "ない" in form_key: ex.append(make_example(f"本を{verb_form}。", f"不买书。", f"I don't buy a book."))
            elif "ます" in form_key: ex.append(make_example(f"本を{verb_form}。", f"买书（礼貌）。", f"I buy a book (polite)."))
            elif "辞書" in form_key: ex.append(make_example(f"本を{verb_form}。", f"买书。", f"I buy a book."))
            elif "た" in form_key: ex.append(make_example(f"本を{verb_form}。", f"买了书。", f"I bought a book."))
            elif "て" in form_key: ex.append(make_example(f"本を{verb_form}いる。", f"正在买书。", f"I am buying a book."))
            else: ex.append(make_example(f"本を{verb_form}。", f"（{rep_kanji}的用法）", ""))

    N5.append(build_conjugation_lesson("n5", type_name, (rep_kanji, "", ""), verified, rule_desc, usage_pat, explanation, ex))


# ── N5-11~14: Ichidan verbs ──
ICHIDAN_RULES: dict[str, tuple[str, str, str]] = {
    "上一段-カ行": (
        "上一段动词-カ行（起きる型）：词尾 きる→き/き/きる/きれ/きよう",
        "起き(ない) / 起き(ます) / 起きる / 起きる(とき) / 起きれ(ば) / 起きよ(う) / 起き(た) / 起き(て)",
        "词尾以「きる」结尾，前一音节为「い」段的上一段动词。"
        "所有活用都在词干后直接添加语尾，不发生音便。"
        "未然形＝連用形＝词干，只有終止形・連体形以「る」结尾，仮定形以「れ」结尾。"
    ),
    "上一段-マ行": (
        "上一段动词-マ行（見る型）：词尾 みる→み/み/みる/みれ/みよう",
        "見(ない) / 見(ます) / 見る / 見る(とき) / 見れ(ば) / 見よ(う) / 見(た) / 見(て)",
        "词尾以「みる」结尾的上一段动词。"
        "「見る」是最短的上一段动词之一，和「いる」「着る」「似る」等同属此类。"
        "所有形式都在词干「み」后直接附加语尾。"
    ),
    "下一段-バ行": (
        "下一段动词-バ行（食べる型）：词尾 べる→べ/べ/べる/べれ/べよう",
        "食べ(ない) / 食べ(ます) / 食べる / 食べる(とき) / 食べれ(ば) / 食べよ(う) / 食べ(た) / 食べ(て)",
        "词尾以「べる」结尾，前一音节为「え」段的下一段动词。"
        "与上一段类似，所有活用都在词干后直接添加语尾。"
        "「食べる」是最典型的下一段动词。同类还包括「教える」「考えろ」等。"
    ),
    "下一段-カ行": (
        "下一段动词-カ行（受ける型）：词尾 ける→け/け/ける/けれ/けよう",
        "受け(ない) / 受け(ます) / 受ける / 受ける(とき) / 受けれ(ば) / 受けよ(う) / 受け(た) / 受け(て)",
        "词尾以「ける」结尾的下一段动词。"
        "同样所有形式在词干后直接加语尾，不发生音便。"
        "包括「開ける」「出かける」「届ける」等常用动词。"
    ),
}

for type_name, (rep_kanji, rep_roman, rep_hira) in {**ICHIDAN_KAMI_REPS, **ICHIDAN_SHIMO_REPS}.items():
    rule_desc, usage_pat, explanation = ICHIDAN_RULES[type_name]
    forms_data = ICHIDAN_FORMS[type_name]
    verified = conj_table(rep_kanji, forms_data)

    ex = []
    if "起きる" in rep_kanji:
        ex = [
            make_example("朝6時に起きる。", "早上6点起床。", "I get up at 6 AM."),
            make_example("まだ起きない。", "还没起床。", "I'm not up yet."),
            make_example("朝早く起きます。", "早上早起（礼貌）。", "I get up early (polite)."),
            make_example("7時に起きた。", "7点起了床。", "I got up at 7."),
            make_example("起きてご飯を食べる。", "起床后吃饭。", "Get up and eat."),
        ]
    elif "見る" in rep_kanji:
        ex = [
            make_example("テレビを見る。", "看电视。", "I watch TV."),
            make_example("映画を見ない。", "不看电影。", "I don't watch movies."),
            make_example("ニュースを見ます。", "看新闻（礼貌）。", "I watch the news (polite)."),
            make_example("昨日映画を見た。", "昨天看了电影。", "I watched a movie yesterday."),
            make_example("写真を見ている。", "正在看照片。", "I am looking at photos."),
        ]
    elif "食べる" in rep_kanji:
        ex = [
            make_example("朝ご飯を食べる。", "吃早餐。", "I eat breakfast."),
            make_example("肉を食べない。", "不吃肉。", "I don't eat meat."),
            make_example("昼ご飯を食べます。", "吃午饭（礼貌）。", "I eat lunch (polite)."),
            make_example("もう食べた。", "已经吃了。", "I already ate."),
            make_example("食べているところです。", "正在吃。", "I'm eating right now."),
        ]
    elif "受ける" in rep_kanji:
        ex = [
            make_example("試験を受ける。", "参加考试。", "I take an exam."),
            make_example("授業を受けない。", "不上课。", "I don't attend class."),
            make_example("面接を受けます。", "参加面试（礼貌）。", "I have an interview (polite)."),
            make_example("昨日試験を受けた。", "昨天参加了考试。", "I took the exam yesterday."),
            make_example("治療を受けている。", "正在接受治疗。", "I am receiving treatment."),
        ]
    else:
        ex = [make_example(f"{rep_kanji}。", f"（{rep_kanji}的用法）")]

    N5.append(build_conjugation_lesson("n5", type_name, (rep_kanji, "", ""), verified, rule_desc, usage_pat, explanation, ex))


# ── N5-15~16: Irregular verbs ──
IRREGULAR_RULES: dict[str, tuple[str, str, str]] = {
    "サ行変格": (
        "サ変动词（する型）：する／します／しない／した／して／できる",
        "する→しない(未然) / します(連用) / する(終止) / する(とき)(連体) / すれば(仮定) / しよう(意志) / した(過去) / して(て形)",
        "「する」是日语中最重要的不规则动词之一。"
        "サ変动词的活用非常特殊：未然形「し」→「しない」，連用形「し」→「します」，"
        "仮定形「すれ」→「すれば」，意志形「し」→「しよう」。"
        "て形/た形直接使用連用形「し」+「た/て」→「した/して」。"
        "可能形为独立的「できる」，而非「する」的活用。"
        "许多名词+する构成サ変复合动词，如「勉強する」「散歩する」「運動する」。"
    ),
    "カ行変格": (
        "カ変动词（来る型）：来る／来ない／来ます／来た／来て",
        "来る→来ない(未然) / 来ます(連用) / 来る(終止) / 来る(とき)(連体) / 来れば(仮定) / 来よう(意志) / 来た(過去) / 来て(て形)",
        "「来る」是日语中唯一真正的不规则动词（カ行変格活用）。"
        "其活用极其不规则：未然形「こ」（来ない），連用形「き」（来ます），"
        "終止形/連体形「くる」，仮定形「くれ」（来れば），意志形「こ」（来よう）。"
        "各活用形的读音差异很大，需要逐个记忆。"
    ),
}

for type_name, (rep_kanji, rep_roman, rep_hira) in IRREGULAR_REPS.items():
    rule_desc, usage_pat, explanation = IRREGULAR_RULES[type_name]
    forms_data = IRREGULAR_FORMS[type_name]
    verified = conj_table(rep_kanji, forms_data)

    if type_name == "サ行変格":
        ex = [
            make_example("勉強する。", "学习。", "I study."),
            make_example("宿題をしない。", "不做作业。", "I don't do homework."),
            make_example("運動します。", "做运动（礼貌）。", "I exercise (polite)."),
            make_example("もうした。", "已经做了。", "I already did it."),
            make_example("散歩している。", "正在散步。", "I am taking a walk."),
            make_example("日本語ができる。", "会日语。", "I can speak Japanese."),
        ]
    else:
        ex = [
            make_example("駅に来る。", "来车站。", "Come to the station."),
            make_example("今日は来ない。", "今天不来。", "Not coming today."),
            make_example("友達が来ます。", "朋友要来（礼貌）。", "My friend will come (polite)."),
            make_example("昨日来た。", "昨天来了。", "I came yesterday."),
            make_example("日本に来ている。", "正在日本。", "I am in Japan (have come to Japan)."),
        ]

    N5.append(build_conjugation_lesson("n5", type_name, (rep_kanji, "", ""), verified, rule_desc, usage_pat, explanation, ex))


# ── N5-17: Masu form ──
N5.append({
    "id": generate_id("n5", "masu_form"),
    "level": "N5",
    "pattern": "ます形（丁寧形）",
    "meaning": "动词ます形 — 礼貌体",
    "usage": "五段動詞: [連用形] + ます\n一段動詞: [詞干] + ます\nサ変: します\nカ変: 来ます",
    "explanation": (
        "ます形是日语的礼貌体（丁寧体），用于正式场合或与不熟悉的人交流。"
        "五段动词将词尾变为所在行的「い」段假名后加「ます」（書く→書きます、読む→読みます）。"
        "一段动词去掉「る」后加「ます」（食べる→食べます、起きる→起きます）。"
        "サ変：する→します。カ変：来る→来ます。"
        "ます形的否定为「ません」，过去为「ました」，过去否定为「ませんでした」。"
    ),
    "usage": "动词連用形 + ます",
    "colloquial": "简体对应普通体（辞書形/た形/ない形）",
    "examples": [
        make_example("毎日日本語を勉強します。", "每天学日语。", "I study Japanese every day."),
        make_example("昨日は休みました。", "昨天休息了。", "I rested yesterday."),
        make_example("明日は行きません。", "明天不去。", "I won't go tomorrow."),
        make_example("コーヒーを飲みますか？", "喝咖啡吗？", "Would you like some coffee?"),
    ],
    "related": [],
    "repeatIn": [],
    "category": "动词活用",
})

# ── N5-18: Te-form ──
N5.append({
    "id": generate_id("n5", "te_form"),
    "level": "N5",
    "pattern": "て形（連用形音便）",
    "meaning": "动词て形 — 连接、请求、进行体",
    "usage": "五段: [音便] + て/で\n一段: [詞干] + て\nサ変: して\nカ変: 来て",
    "explanation": (
        "て形是日语中最重要也最复杂的活用形之一，用于多种语法结构。"
        "五段动词的て形有三种音便规则：\n"
        "1. 促音便（カ行→いて、ガ行→いで、タ行→って、ラ行→って、ワア行→って）\n"
        "2. 撥音便（ナ行→んで、バ行→んで、マ行→んで）\n"
        "3. サ行无音便（す→して）\n"
        "一段动词直接去掉「る」加「て」（食べる→食べて）。\n"
        "サ変：する→して、カ変：来る→来て。\n\n"
        "主要用法：\n"
        "1. 请求：〜てください\n"
        "2. 进行体：〜ている\n"
        "3. 许可：〜てもいい\n"
        "4. 禁止：〜てはいけない\n"
        "5. 连接：〜て、〜（先后顺序）"
    ),
    "usage": "て形可接续助词构成多种语法",
    "colloquial": "て形在口语中常简化为「で」（浊音行后）",
    "examples": [
        make_example("ドアを開けてください。", "请开门。", "Please open the door."),
        make_example("今テレビを見ている。", "正在看电视。", "I'm watching TV now."),
        make_example("ここに座ってもいいですか？", "可以坐这里吗？", "May I sit here?"),
        make_example("教室で食べてはいけません。", "教室里不可以吃东西。", "You must not eat in the classroom."),
        make_example("スーパーに行って、買い物をした。", "去了超市，买了东西。", "I went to the supermarket and shopped."),
    ],
    "related": [],
    "repeatIn": [],
    "category": "动词活用",
})

# ── N5-19: Ta-form ──
N5.append({
    "id": generate_id("n5", "ta_form"),
    "level": "N5",
    "pattern": "た形（過去形）",
    "meaning": "动词た形 — 过去时",
    "usage": "五段: [音便] + た/だ\n一段: [詞干] + た\nサ変: した\nカ変: 来た",
    "explanation": (
        "た形表示过去时态，与て形的音便规则完全相同。"
        "五段动词的た形同样有三种音便：\n"
        "1. イ音便：カ行→いた、ガ行→いだ\n"
        "2. 促音便：タ行→った、ラ行→った、ワア行→った\n"
        "3. 撥音便：ナ行→んだ、バ行→んだ、マ行→んだ\n"
        "4. サ行无音便：す→した\n"
        "一段动词去掉「る」加「た」（食べる→食べた）。\n"
        "サ変：した、カ変：来た。\n\n"
        "た形也用于：\n"
        "1. 〜たことがある（经历）\n"
        "2. 〜たり〜たりする（列举动作）\n"
        "3. 〜たら（条件）"
    ),
    "usage": "た形 = て形替换て/で为た/だ",
    "colloquial": "简体过去，礼貌体用「ました」",
    "examples": [
        make_example("昨日映画を見た。", "昨天看了电影。", "I watched a movie yesterday."),
        make_example("もう昼ご飯を食べた。", "已经吃过午饭了。", "I already ate lunch."),
        make_example("日本に行ったことがある。", "去过日本。", "I have been to Japan."),
        make_example("夏休みに海で泳いだ。", "暑假在海里游泳了。", "I swam in the sea during summer break."),
    ],
    "related": [],
    "repeatIn": ["n4"],
    "category": "动词活用",
})

# ── N5-20: Nai form ──
N5.append({
    "id": generate_id("n5", "nai_form"),
    "level": "N5",
    "pattern": "ない形（否定形）",
    "meaning": "动词ない形 — 否定形式",
    "usage": "五段: [未然形] + ない\n一段: [詞干] + ない\nサ変: しない\nカ変: 来ない",
    "explanation": (
        "ない形是动词的否定形式，由未然形接续否定助动词「ない」构成。"
        "五段动词将词尾变为所在行的「あ」段假名后加「ない」（書く→書かない、読む→読まない）。"
        "注意ワア行：買う→買わない（う→わ）。"
        "一段动词去掉「る」后加「ない」（食べる→食べない、起きる→起きない）。\n"
        "サ変：する→しない。カ変：来る→来ない。\n\n"
        "活用扩展：\n"
        "• なかった（过去否定）\n"
        "• なくて（て形连接）\n"
        "• なければ（否定条件）\n"
        "• なかっ（た）（同た形连接）"
    ),
    "usage": "动词未然形 + ない",
    "colloquial": "口语中「ない」在关西方言变为「へん」",
    "examples": [
        make_example("タバコを吸わない。", "不吸烟。", "I don't smoke."),
        make_example("昨日は勉強しなかった。", "昨天没学习。", "I didn't study yesterday."),
        make_example("お酒を飲まないでください。", "请不要喝酒。", "Please don't drink alcohol."),
        make_example("行かなければならない。", "必须去。", "I have to go."),
    ],
    "related": [],
    "repeatIn": [],
    "category": "动词活用",
})

# ── N5-21: Ba form (conditional) ──
N5.append({
    "id": generate_id("n5", "ba_form"),
    "level": "N5",
    "pattern": "ば形（条件形）",
    "meaning": "动词ば形 — 假定条件（如果…）",
    "usage": "五段: [仮定形] + ば\n一段: [詞干] + れば\nサ変: すれば\nカ変: 来れば",
    "explanation": (
        "ば形表示假定条件「如果…的话」。"
        "五段动词将词尾变为所在行的「え」段假名后加「ば」（書く→書けば、読む→読めば）。"
        "一段动词去掉「る」后加「れば」（食べる→食べれば、起きる→起きれば）。"
        "サ変：する→すれば。カ変：来る→来れば。\n"
        "形容词也可以变为ば形：〜ければ（美しければ、高ければ）。\n\n"
        "〜ば通常后续积极结果，不用于意志表达。"
    ),
    "usage": "动词仮定形 + ば",
    "colloquial": "口语中「〜ば」常被「〜たら」替代",
    "examples": [
        make_example("春になれば桜が咲く。", "如果到了春天樱花就开。", "If spring comes, cherry blossoms bloom."),
        make_example("安ければ買います。", "如果便宜就买。", "If it's cheap, I'll buy it."),
        make_example("勉強すれば合格できる。", "如果学习就能合格。", "If you study, you can pass."),
        make_example("早く来ればよかった。", "早点来就好了。", "I should have come earlier."),
    ],
    "related": [],
    "repeatIn": [],
    "category": "动词活用",
})

# ── N5-22: Volitional form ──
N5.append({
    "id": generate_id("n5", "volitional_form"),
    "level": "N5",
    "pattern": "意向形（意志推量形）",
    "meaning": "动词意志形 — 想要做…、一起做…吧",
    "usage": "五段: [意志形] + う\n一段: [詞干] + よう\nサ変: しよう\nカ変: 来よう",
    "explanation": (
        "意向形表示意志、劝诱或推测。"
        "五段动词将词尾变为所在行的「お」段假名后加「う」（書く→書こう、読む→読もう）。"
        "一段动词去掉「る」后加「よう」（食べる→食べよう、起きる→起きよう）。"
        "サ変：する→しよう。カ変：来る→来よう。\n\n"
        "主要用法：\n"
        "1. 劝诱：〜ましょう（ましょうか/〜う/よう）\n"
        "2. 意志：〜う/ようと思う\n"
        "3. 推测：〜う/よう（文语用法）"
    ),
    "usage": "意志形 + う/よう",
    "colloquial": "口语劝诱常用「〜ない？」或「〜ようよ」",
    "examples": [
        make_example("一緒に行きましょう。", "一起去吧。", "Let's go together."),
        make_example("日本へ留学しようと思う。", "我想去日本留学。", "I'm thinking of studying in Japan."),
        make_example("ちょっと休もう。", "休息一下吧。", "Let's take a break."),
        make_example("明日は雨が降るだろう。", "明天会下雨吧。", "It will probably rain tomorrow."),
    ],
    "related": [],
    "repeatIn": [],
    "category": "动词活用",
})

# ── N5-23: I-adjectives ──
I_ADJ_FORMS: dict[str, dict[str, str]] = {
    "美しい": {
        "辞書形 (終止形)": "美しい",
        "連用形-ない接続": "美しくない",
        "連用形-た形": "美しかった",
        "連体形": "美しいとき",
        "仮定形": "美しければ",
        "連用形-中止": "美しく",
        "副詞形": "美しく",
    },
}

I_ADJ_VERIFIED = conj_table("美しい", I_ADJ_FORMS["美しい"])
N5.append({
    "id": generate_id("n5", "i_adjective"),
    "level": "N5",
    "pattern": "形容詞活用（イ形容詞）",
    "meaning": "イ形容詞（い-adj）的活用体系",
    "usage": "辞書形: 〜い\n否定: 〜くない\n過去: 〜かった\n過去否定: 〜くなかった\n仮定: 〜ければ",
    "explanation": (
        "イ形容詞（形容詞）是日语中以「い」结尾的形容词。"
        "活用规则相对简单：\n"
        "• 連用形：词尾「い」→「く」（美しく/大きく）\n"
        "• 否定：連用形 + ない（美しくない）\n"
        "• 過去形：連用形 + た（但「い」→「かっ」+た = 美しかった）\n"
        "• 過去否定：美しくなかった\n"
        "• 仮定形：詞尾「い」→「ければ」（美しければ）\n"
        "• 副詞形：連用形（美しく）\n\n"
        "特殊：良い（いい）的活用为「よい→よくない→よかった」"
    ),
    "usage": "イ形容詞的特殊活用体系",
    "colloquial": "口语中「〜くない」有时省略为「〜くね」",
    "examples": [
        make_example("この花は美しい。", "这朵花很美。", "This flower is beautiful."),
        make_example("この料理は美味しくない。", "这个菜不好吃。", "This food is not delicious."),
        make_example("昨日は寒かった。", "昨天很冷。", "It was cold yesterday."),
        make_example("安ければ買います。", "如果便宜就买。", "If it's cheap, I'll buy it."),
        make_example("静かに歩いてください。", "请安静地走。", "Please walk quietly."),
    ],
    "related": [],
    "repeatIn": [],
    "category": "形容词活用",
})

# ═══════════════════════════════════════════════════════════════════════
# N4: Intermediate grammar
# ═══════════════════════════════════════════════════════════════════════

N4: list[dict] = []

N4.append({
    "id": generate_id("n4", "potential"),
    "level": "N4",
    "pattern": "可能形（〜える/〜られる）",
    "meaning": "可能态 — 能/可以…",
    "usage": "五段: [仮定形語幹] + る（書く→書ける）\n一段: [詞干] + られる\nサ変: できる\nカ変: 来られる",
    "explanation": (
        "可能形表达「能做某事的能力」或「某种可能性」。"
        "五段动词将词尾变为所在行的「え」段假名后加「る」→变为下一段动词（書く→書ける、読む→読める）。"
        "一段动词去掉「る」后加「られる」（食べる→食べられる、起きる→起きられる）。"
        "サ変：する→できる。カ変：来る→来られる。\n\n"
        "五段动词的可能形也有口语省略形（ら抜き言葉）：一段动词的「〜られる」有时省略为「〜れる」"
        "（食べれる→ら抜き），但标准语法中应使用「〜られる」。\n\n"
        "可能动词的宾语可以用「が」或「を」标记。"
    ),
    "usage": "可能形动词 + 宾语",
    "colloquial": "口语中一段动词常用「ら抜き言葉」：食べれる（标准：食べられる）",
    "examples": [
        make_example("日本語が話せる。", "能说日语。", "I can speak Japanese."),
        make_example("一人で作れますか？", "能一个人做吗？", "Can you make it by yourself?"),
        make_example("ここでタバコが吸える。", "这里可以吸烟。", "You can smoke here."),
        make_example("全部食べられた。", "全都能吃完了。", "I could eat everything."),
    ],
    "related": [],
    "repeatIn": [],
    "category": "语态",
})

N4.append({
    "id": generate_id("n4", "passive"),
    "level": "N4",
    "pattern": "受身形（〜れる/〜られる）",
    "meaning": "被动语态 — 被…",
    "usage": "五段: [未然形] + れる\n一段: [詞干] + られる\nサ変: される\nカ変: 来られる",
    "explanation": (
        "受身形（被动形）表示「被某人做了某事」，主语是动作的承受者。"
        "五段动词变未然形（あ段）后加「れる」（書く→書かれる、読む→読まれる）。"
        "一段动词去掉「る」后加「られる」（食べる→食べられる、起きる→起きられる）。"
        "サ変：する→される。カ変：来る→来られる。\n\n"
        "被动句的三种类型："
        "1. 直接被动（私は先生に褒められた）\n"
        "2. 间接被动/受害被动（雨に降られた）\n"
        "3. 物主被动（私は財布を盗まれた）"
    ),
    "usage": "受身形动词（NはNに〜される）",
    "colloquial": "口语中「〜される」有时简化为「〜さる」",
    "examples": [
        make_example("私は先生に褒められた。", "我被老师表扬了。", "I was praised by the teacher."),
        make_example("財布を盗まれた。", "钱包被偷了。", "My wallet was stolen."),
        make_example("駅から学校まで歩かれると困る。", "从车站走到学校（的话）很麻烦。", "It's a problem if someone walks from the station to school."),
        make_example("この本は多くの人に読まれている。", "这本书被很多人阅读。", "This book is read by many people."),
    ],
    "related": [],
    "repeatIn": [],
    "category": "语态",
})

N4.append({
    "id": generate_id("n4", "causative"),
    "level": "N4",
    "pattern": "使役形（〜せる/〜させる）",
    "meaning": "使役语态 — 让/使…做…",
    "usage": "五段: [未然形] + せる\n一段: [詞干] + させる\nサ変: させる\nカ変: 来させる",
    "explanation": (
        "使役形表示「让某人做某事」「使…」。"
        "五段动词变未然形（あ段）后加「せる」（書く→書かせる、読む→読ませる）。"
        "一段动词去掉「る」后加「させる」（食べる→食べさせる、起きる→起きさせる）。"
        "サ変：する→させる。カ変：来る→来させる。\n\n"
        "使役文的结构：\n"
        "• 自动词使役：主语让宾语做某事（NはNを〜せる）\n"
        "• 他动词使役：主语让宾语做某事（NはNにNを〜せる）\n\n"
        "使役受身形（使役+被动）表示「被迫做某事」：書かせられる（书かされる）。"
    ),
    "usage": "使役形 + 使役対象",
    "colloquial": "口语中五段使役有时省略为「〜す」（書かす）",
    "examples": [
        make_example("子供に野菜を食べさせる。", "让孩子吃蔬菜。", "I make my child eat vegetables."),
        make_example("先生は学生に本を読ませた。", "老师让学生读书。", "The teacher made the students read a book."),
        make_example("母は私を買い物に行かせた。", "妈妈让我去买东西。", "My mother made me go shopping."),
        make_example("毎日残業させられる。", "每天被迫加班。", "I'm forced to work overtime every day."),
    ],
    "related": [],
    "repeatIn": [],
    "category": "语态",
})

N4.append({
    "id": generate_id("n4", "tai_form"),
    "level": "N4",
    "pattern": "たい形（希望形）",
    "meaning": "たい — 想要…",
    "usage": "[連用形] + たい\n五段: 書きたい\n一段: 食べたい\nサ変: したい\nカ変: 来たい",
    "explanation": (
        "「たい」是愿望助动词，接在动词連用形后表示「想要做某事」。"
        "活用方式与イ形容詞相同：たい→たくない（否定）→たかった（过去）→たければ（条件）。\n"
        "「たい」的主语通常是第一人称（私），疑问句中可用于第二人称（あなたは〜したい？）。\n"
        "第三人称的愿望用「〜たがる」表示。\n\n"
        "接续规则：\n"
        "• 五段：連用形（い段）+ たい\n"
        "• 一段：詞干 + たい\n"
        "• サ変：し + たい\n"
        "• カ変：来 + たい"
    ),
    "usage": "連用形 + たい",
    "colloquial": "口语中「〜たいの？」相当于「〜たいですか？」",
    "examples": [
        make_example("日本へ行きたい。", "想去日本。", "I want to go to Japan."),
        make_example("何を食べたいですか？", "想吃什么？", "What do you want to eat?"),
        make_example("あの本が読みたい。", "想看那本书。", "I want to read that book."),
        make_example("彼は新しい車を買いたがっている。", "他想要买新车。", "He wants to buy a new car."),
    ],
    "related": [],
    "repeatIn": [],
    "category": "愿望",
})

N4.append({
    "id": generate_id("n4", "imperative"),
    "level": "N4",
    "pattern": "命令形",
    "meaning": "命令形 — 命令/要求",
    "usage": "五段: [仮定形] （書け/読め/待て）\n一段: [詞干] + ろ（食べろ/起きろ）\nサ変: しろ/せよ\nカ変: 来い",
    "explanation": (
        "命令形用于直接命令，语气比较强硬。日常会话中通常避免使用命令形，代之以「〜てください」。\n\n"
        "五段动词直接将词尾变为「え」段（書く→書け、読む→読め）。\n"
        "一段动词去掉「る」后加「ろ」（食べる→食べろ、起きる→起きろ）。\n"
        "サ変：する→しろ/せよ（せよ更正式）。カ変：来る→来い。\n\n"
        "间接命令用「〜なさい」或「〜てください」更礼貌。\n"
        "禁止形用命令形+「な」（書くな/食べるな）。"
    ),
    "usage": "直接命令，语气较强",
    "colloquial": "日常很少使用命令形，多说「〜て」或「〜なよ」",
    "examples": [
        make_example("早く行け！", "快去！", "Go quickly!"),
        make_example("ここに座れ。", "坐这里。", "Sit here."),
        make_example("静かにしろ！", "安静！", "Be quiet!"),
        make_example("食べるな！", "别吃！", "Don't eat!"),
    ],
    "related": [],
    "repeatIn": [],
    "category": "语态",
})

# ═══════════════════════════════════════════════════════════════════════
# N3: Advanced forms
# ═══════════════════════════════════════════════════════════════════════

N3: list[dict] = []

N3.append({
    "id": generate_id("n3", "honorific"),
    "level": "N3",
    "pattern": "尊敬語（敬語）",
    "meaning": "尊敬语 — 抬高对方动作",
    "usage": "お + [連用形] + になる\nお + [連用形] + ください\n特殊尊敬語",
    "explanation": (
        "尊敬語（尊敬语）用于抬高对方的动作，表达对对方的敬意。"
        "由「お+連用形+になる」构成。\n\n"
        "五段/一段动词：お + 連用形 + になる（お書きになる、お食べになる）。\n"
        "サ変：ご + サ変語幹 + になる（ご連絡になる）。\n\n"
        "特殊尊敬语（需个别记忆）：\n"
        "• する→なさる\n"
        "• 行く/来る/いる→いらっしゃる\n"
        "• 食べる/飲む→召し上がる\n"
        "• 言う→おっしゃる\n"
        "• 見る→ご覧になる\n"
        "• 知っている→ご存じ\n"
        "• くれる→くださる"
    ),
    "usage": "お + 連用形 + になる / 特殊尊敬語",
    "colloquial": "日常多用「〜される」（尊敬の受身）替代",
    "examples": [
        make_example("先生は何をお読みになりますか？", "老师您在读什么？", "What are you reading, teacher?"),
        make_example("社長はもうお帰りになりました。", "社长已经回去了。", "The president has already returned."),
        make_example("お名前は何とおっしゃいますか？", "您贵姓？", "What is your name?"),
        make_example("どうぞお召し上がりください。", "请用。", "Please eat/drink."),
    ],
    "related": [],
    "repeatIn": [],
    "category": "敬语",
})

N3.append({
    "id": generate_id("n3", "humble"),
    "level": "N3",
    "pattern": "謙譲語（敬語）",
    "meaning": "谦让语 — 降低自己动作",
    "usage": "お + [連用形] + する\nご + [サ変語幹] + する\n特殊謙譲語",
    "explanation": (
        "謙譲語（谦让语）通过降低自己的动作来表达对对方的敬意。"
        "由「お+連用形+する/いたす」构成。\n\n"
        "五段/一段动词：お + 連用形 + する（お書きする、お食べする）。\n"
        "サ変：ご + サ変語幹 + する（ご連絡する）。\n\n"
        "更谦让的说法将「する」替换为「いたす」。\n\n"
        "特殊谦让语：\n"
        "• する→いたす\n"
        "• 行く/来る→伺う（うかがう）\n"
        "• 食べる/飲む→いただく\n"
        "• 言う→申す/申し上げる\n"
        "• 見る→拝見する\n"
        "• 知っている→存じている\n"
        "• あげる→差し上げる"
    ),
    "usage": "お + 連用形 + する / 特殊謙譲語",
    "colloquial": "日常多用「〜ます」替代",
    "examples": [
        make_example("私がお持ちします。", "我来拿。", "I will carry it."),
        make_example("後ほどお電話いたします。", "稍后给您打电话。", "I will call you later."),
        make_example("明日伺います。", "明天拜访您。", "I will visit you tomorrow."),
        make_example("申し訳ございません。", "非常抱歉。", "I'm very sorry."),
    ],
    "related": [],
    "repeatIn": [],
    "category": "敬语",
})

N3.append({
    "id": generate_id("n3", "causative_passive"),
    "level": "N3",
    "pattern": "使役受身形（〜せられる/〜させられる）",
    "meaning": "使役被动 — 被迫做…",
    "usage": "五段: [未然形] + せられる（→される）\n一段: [詞干] + させられる\nサ変: させられる\nカ変: 来させられる",
    "explanation": (
        "使役受身形表示「被迫做某事」「不得不做某事」。"
        "由使役形+受身形组合而成。\n\n"
        "构成：\n"
        "• 五段动词：未然形 + せられる（書く→書かせられる→書かされる）\n"
        "  口语中常省略为「〜される」（書かされる）\n"
        "• 一段动词：詞干 + させられる（食べる→食べさせられる）\n"
        "• サ変：する→させられる\n"
        "• カ変：来る→来させられる\n\n"
        "表示被迫做不愿意做的事情，带有不情愿的语气。"
    ),
    "usage": "被迫做非自愿的事情",
    "colloquial": "五段口语常用省略形「〜される」（書かされる）",
    "examples": [
        make_example("毎日残業させられる。", "每天被迫加班。", "I'm forced to work overtime every day."),
        make_example("先生に宿題をたくさんやらされた。", "被老师布置了大量作业。", "I was made to do a lot of homework by the teacher."),
        make_example("嫌いな野菜を無理やり食べさせられた。", "被迫吃了讨厌的蔬菜。", "I was forced to eat vegetables I hate."),
        make_example("休日出勤させられた。", "被迫在休息日上班。", "I was forced to work on a holiday."),
    ],
    "related": [],
    "repeatIn": [],
    "category": "语态",
})

# ═══════════════════════════════════════════════════════════════════════
# Write output
# ═══════════════════════════════════════════════════════════════════════

def write_level(filename: str, data: list[dict]):
    path = os.path.join(OUTPUT_DIR, filename)
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    with open(path, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    print(f"  ✓ {filename}: {len(data)} grammar points")


if __name__ == "__main__":
    print("Generating Sudachi-based grammar data...\n")

    # For now, we generate the conjugation-focused grammar points.
    # These are designed to be ADDED to the existing data, not replace it.
    # Each file is prefixed so it's clear these are Sudachi-generated.

    # Merge with existing grammar data
    for level_name, new_data in [("n5", N5), ("n4", N4), ("n3", N3)]:
        existing_path = os.path.join(OUTPUT_DIR, f"{level_name}.json")
        existing = []
        if os.path.exists(existing_path):
            with open(existing_path) as f:
                existing = json.load(f)

        # Filter out any sudachi-generated entries (from any previous run)
        old_ids = {g["id"] for g in new_data}
        existing = [g for g in existing if (g["id"] not in old_ids and not g["id"].startswith("n5-sudachi-") and not g["id"].startswith("n4-sudachi-") and not g["id"].startswith("n3-sudachi-") and not g["id"].startswith("n2-sudachi-") and not g["id"].startswith("n1-sudachi-"))]

        combined = existing + new_data
        write_level(f"{level_name}.json", combined)

    print(f"\nDone! Generated {len(N5) + len(N4) + len(N3)} Sudachi grammar points total.")
