#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
birukan_questions.json のOCRエラーを修正するスクリプト
- _tmp_ocr_errors.json の個別修正を適用
- 一般的な置換ルールも適用
"""

import json
import re
import copy

INPUT_FILE = "birukan_questions.json"
ERRORS_FILE = "_tmp_ocr_errors.json"
OUTPUT_FILE = "birukan_questions_fixed.json"

def get_field_value(question, field):
    """fieldの文字列からquestionオブジェクト内の該当値を取得"""
    if field == "q":
        return question["q"]
    elif field == "ex":
        return question.get("ex", "")
    elif field.startswith("o["):
        idx = int(field[2:-1])
        if idx < len(question["o"]):
            return question["o"][idx]
    return None

def set_field_value(question, field, value):
    """fieldの文字列を使ってquestionオブジェクト内の該当値を設定"""
    if field == "q":
        question["q"] = value
    elif field == "ex":
        question["ex"] = value
    elif field.startswith("o["):
        idx = int(field[2:-1])
        if idx < len(question["o"]):
            question["o"][idx] = value

def apply_general_replacements(text):
    """一般的なOCR置換ルールを適用"""
    replacements = [
        ("術生", "衛生"),
        ("建架", "建築"),
        ("建簗", "建築"),
        ("建策", "建築"),
        ("建槃", "建築"),
        ("建榮", "建築"),
        ("建兜", "建築"),
        ("建第", "建築"),
        ("換気最", "換気量"),
        ("以ド", "以下"),
        ("風）J", "風力"),
        ("圧）J", "圧力"),
        ("不滴当", "不適当"),
        ("不遮当", "不適当"),
        ("不遥当", "不適当"),
        ("不進当", "不適当"),
        ("不道当", "不適当"),
        ("t.", "㎡"),
    ]
    count = 0
    details = []
    for old, new in replacements:
        if old in text:
            occurrences = text.count(old)
            count += occurrences
            details.append(f"  「{old}」→「{new}」({occurrences}件)")
            text = text.replace(old, new)
    return text, count, details

def main():
    # ファイル読み込み
    with open(INPUT_FILE, "r", encoding="utf-8") as f:
        questions = json.load(f)

    with open(ERRORS_FILE, "r", encoding="utf-8") as f:
        errors = json.load(f)

    # ディープコピーして修正
    fixed = copy.deepcopy(questions)

    # === 1. 個別エラー修正 ===
    individual_applied = 0
    individual_skipped = 0

    for err in errors:
        idx = err["idx"]
        field = err["field"]
        original = err["original"]
        suggested = err["suggested"]

        if idx >= len(fixed):
            individual_skipped += 1
            continue

        current_value = get_field_value(fixed[idx], field)
        if current_value is None:
            individual_skipped += 1
            continue

        if original in current_value:
            new_value = current_value.replace(original, suggested)
            set_field_value(fixed[idx], field, new_value)
            individual_applied += 1
        else:
            individual_skipped += 1

    # === 2. 一般的な置換ルール ===
    general_count = 0
    general_details = []

    for i, q in enumerate(fixed):
        # 問題文
        new_text, cnt, details = apply_general_replacements(q["q"])
        if cnt > 0:
            fixed[i]["q"] = new_text
            general_count += cnt
            general_details.extend(details)

        # 選択肢
        for j, opt in enumerate(q["o"]):
            new_text, cnt, details = apply_general_replacements(opt)
            if cnt > 0:
                fixed[i]["o"][j] = new_text
                general_count += cnt
                general_details.extend(details)

        # 解説
        if q.get("ex"):
            new_text, cnt, details = apply_general_replacements(q["ex"])
            if cnt > 0:
                fixed[i]["ex"] = new_text
                general_count += cnt
                general_details.extend(details)

    # === 3. 結果保存 ===
    with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
        json.dump(fixed, f, ensure_ascii=False, indent=2)

    # === 4. サマリー表示 ===
    print("=" * 60)
    print("OCRエラー修正 サマリー")
    print("=" * 60)
    print(f"入力ファイル: {INPUT_FILE} ({len(questions)}問)")
    print(f"エラー定義: {ERRORS_FILE} ({len(errors)}件)")
    print(f"出力ファイル: {OUTPUT_FILE}")
    print()
    print("--- 個別エラー修正 ---")
    print(f"  適用: {individual_applied}件")
    print(f"  スキップ: {individual_skipped}件 (該当箇所なし/修正済み)")
    print()
    print("--- 一般的な置換ルール ---")
    print(f"  適用: {general_count}件")
    if general_details:
        # 重複をまとめてカウント
        from collections import Counter
        detail_counter = Counter(general_details)
        for detail, count in detail_counter.most_common():
            if count > 1:
                print(f"  {detail.strip()} x{count}")
            else:
                print(f"  {detail.strip()}")
    print()
    print(f"合計修正: {individual_applied + general_count}件")
    print("=" * 60)

if __name__ == "__main__":
    main()
