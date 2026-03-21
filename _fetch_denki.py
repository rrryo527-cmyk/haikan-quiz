#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
第二種電気工事士 過去問取得スクリプト
18個のURLからHTMLを取得し、問題データをJSONに変換する
"""

import urllib.request
import re
import json
import time
import html
import os

# 作業ディレクトリ
WORK_DIR = os.path.dirname(os.path.abspath(__file__))

# URL一覧とタグのマッピング
URL_MAP = [
    ("https://masassiah.web.fc2.com/contents/01kouji2/t2025s.html", "R7下期"),
    ("https://masassiah.web.fc2.com/contents/01kouji2/t2025k.html", "R7上期"),
    ("https://masassiah.web.fc2.com/contents/01kouji2/t2024s.html", "R6下期"),
    ("https://masassiah.web.fc2.com/contents/01kouji2/t2024k.html", "R6上期"),
    ("https://masassiah.web.fc2.com/contents/01kouji2/t2023s_pm.html", "R5下期午後"),
    ("https://masassiah.web.fc2.com/contents/01kouji2/t2023s_am.html", "R5下期午前"),
    ("https://masassiah.web.fc2.com/contents/01kouji2/t2023k_pm.html", "R5上期午後"),
    ("https://masassiah.web.fc2.com/contents/01kouji2/t2023k_am.html", "R5上期午前"),
    ("https://masassiah.web.fc2.com/contents/01kouji2/t2022s_pm.html", "R4下期午後"),
    ("https://masassiah.web.fc2.com/contents/01kouji2/t2022s_am.html", "R4下期午前"),
    ("https://masassiah.web.fc2.com/contents/01kouji2/t2022k_pm.html", "R4上期午後"),
    ("https://masassiah.web.fc2.com/contents/01kouji2/t2022k_am.html", "R4上期午前"),
    ("https://masassiah.web.fc2.com/contents/01kouji2/t2021s_pm.html", "R3下期午後"),
    ("https://masassiah.web.fc2.com/contents/01kouji2/t2021s_am.html", "R3下期午前"),
    ("https://masassiah.web.fc2.com/contents/01kouji2/t2021k_pm.html", "R3上期午後"),
    ("https://masassiah.web.fc2.com/contents/01kouji2/t2021k_am.html", "R3上期午前"),
    ("https://masassiah.web.fc2.com/contents/01kouji2/t2020s_pm.html", "R2下期午後"),
    ("https://masassiah.web.fc2.com/contents/01kouji2/t2020s_am.html", "R2下期午前"),
]

BASE_URL = "https://masassiah.web.fc2.com/contents/01kouji2/"


def clean_html(text):
    """HTMLタグを除去し、HTMLエンティティをデコードする"""
    # <strong>タグの中身は保持
    # imgタグは除去（別途処理）
    # その他のタグを除去
    text = re.sub(r'<br\s*/?>', '\n', text)
    text = re.sub(r'<img[^>]*>', '', text)
    text = re.sub(r'<figure[^>]*>.*?</figure>', '', text, flags=re.DOTALL)
    text = re.sub(r'<[^>]+>', '', text)
    # HTMLエンティティのデコード
    text = html.unescape(text)
    # MathJax記法を整理
    text = text.replace('$', '')
    # 連続空白を整理
    text = re.sub(r'[ \t]+', ' ', text)
    text = re.sub(r'\n\s*\n', '\n', text)
    text = text.strip()
    return text


def extract_question_text(ques_div):
    """問題文のdivからテキストを抽出（選択肢は除く）"""
    # ans_choicesの前までを取得
    parts = re.split(r'<ol\s+class="ans_choices">', ques_div, maxsplit=1)
    if parts:
        q_text = parts[0]
    else:
        q_text = ques_div
    return clean_html(q_text)


def extract_choices(ques_div):
    """選択肢を抽出"""
    choices = []
    # ラベル内のテキストを取得
    choice_matches = re.findall(
        r'<label>.*?/>\s*(.*?)</label>',
        ques_div,
        re.DOTALL
    )
    for cm in choice_matches:
        choice_text = clean_html(cm)
        # 先頭の「イ．」「ロ．」「ハ．」「ニ．」を除去
        choice_text = re.sub(r'^[イロハニ][．.]\s*', '', choice_text)
        choices.append(choice_text)
    return choices


def extract_images_from_ques(ques_div, page_url):
    """問題文中の画像URLを抽出"""
    images = []
    img_matches = re.findall(r'<img\s+[^>]*src="([^"]+)"[^>]*>', ques_div)
    for img_src in img_matches:
        if img_src.startswith('./'):
            img_url = BASE_URL + img_src[2:]
        elif img_src.startswith('http'):
            img_url = img_src
        else:
            img_url = BASE_URL + img_src
        images.append(img_url)
    return images


def extract_explanation(expo_div):
    """解説divからテキストを抽出"""
    # 【答え】の行を除去（正解は別途answersから取得）
    text = re.sub(r'<p>【答え】.*?</p>', '', expo_div, flags=re.DOTALL)
    # q_result spanを除去
    text = re.sub(r'<h4>.*?</h4>', '', text, flags=re.DOTALL)
    # page_tagリンクを除去
    text = re.sub(r'<div><a[^>]*class="page_tag"[^>]*>.*?</a></div>', '', text, flags=re.DOTALL)
    return clean_html(text)


def extract_images_from_expo(expo_div):
    """解説中の画像URLを抽出"""
    images = []
    img_matches = re.findall(r'<img\s+[^>]*src="([^"]+)"[^>]*>', expo_div)
    for img_src in img_matches:
        if img_src.startswith('./'):
            img_url = BASE_URL + img_src[2:]
        elif img_src.startswith('http'):
            img_url = img_src
        else:
            img_url = BASE_URL + img_src
        images.append(img_url)
    return images


def parse_answers(html_content):
    """JavaScriptのanswersオブジェクトから正解を抽出"""
    answers = {}
    match = re.search(r'const\s+answers\s*=\s*\{([^}]+)\}', html_content)
    if match:
        ans_text = match.group(1)
        pairs = re.findall(r'(q\d+)\s*:\s*(\d+)', ans_text)
        for key, val in pairs:
            answers[key] = int(val)
    return answers


def parse_page(url, tag):
    """1ページ分のHTMLを解析して問題リストを返す"""
    req = urllib.request.Request(url, headers={
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    })
    with urllib.request.urlopen(req, timeout=30) as resp:
        html_content = resp.read().decode('utf-8')

    # 正解を取得
    answers = parse_answers(html_content)

    questions = []

    # 各問題セクションを抽出 (no01 ~ no30)
    for i in range(1, 31):
        qnum = f"{i:02d}"
        q_key = f"q{qnum}"
        section_id = f"no{qnum}"

        # セクション範囲を特定
        section_start = html_content.find(f'id="{section_id}"')
        if section_start < 0:
            continue

        # 次のセクションまたはページ末尾
        next_section = f'id="no{i+1:02d}"'
        section_end = html_content.find(next_section, section_start)
        if section_end < 0:
            # 最後の問題の場合、answersスクリプトまで
            section_end = html_content.find('const answers', section_start)
            if section_end < 0:
                section_end = len(html_content)

        section = html_content[section_start:section_end]

        # 問題文div
        ques_match = re.search(
            r'<div\s+class="ques">(.*?)</div>\s*(?:<div\s+class="a_botton"|$)',
            section,
            re.DOTALL
        )
        if not ques_match:
            # フォールバック: class="ques"の次の</div>まで
            ques_start = section.find('class="ques">')
            if ques_start >= 0:
                ques_start += len('class="ques">')
                # ans_choicesの</ol>の後の</div>を探す
                ol_end = section.find('</ol>', ques_start)
                if ol_end >= 0:
                    div_end = section.find('</div>', ol_end)
                    if div_end >= 0:
                        ques_div = section[ques_start:div_end]
                    else:
                        ques_div = section[ques_start:ques_start+2000]
                else:
                    ques_div = section[ques_start:ques_start+2000]
            else:
                continue
        else:
            ques_div = ques_match.group(1)

        # 問題文を抽出
        q_text = extract_question_text(ques_div)

        # 選択肢を抽出
        choices = extract_choices(ques_div)

        # 問題文中の画像
        q_images = extract_images_from_ques(ques_div, url)

        # 解説div
        expo_id = f"ex_{q_key}"
        expo_match = re.search(
            f'id="{expo_id}">(.*?)(?:</div>\\s*</section>|</div>\\s*<section)',
            section,
            re.DOTALL
        )
        explanation = ""
        expo_images = []
        if expo_match:
            expo_div = expo_match.group(1)
            explanation = extract_explanation(expo_div)
            expo_images = extract_images_from_expo(expo_div)
        else:
            # フォールバック: expo_idからセクション末尾まで
            expo_start = section.find(f'id="{expo_id}">')
            if expo_start >= 0:
                expo_start += len(f'id="{expo_id}">')
                expo_div = section[expo_start:]
                explanation = extract_explanation(expo_div)
                expo_images = extract_images_from_expo(expo_div)

        # 正解 (1-based → 0-based)
        correct_answer = answers.get(q_key, 0)
        answer_0based = correct_answer - 1 if correct_answer > 0 else 0

        # タグを付与した問題文
        tagged_q = f"【{tag} 電工2種 問{i}】{q_text}"

        # 問題データを構築
        question_data = {
            "q": tagged_q,
            "o": choices if choices else ["イ", "ロ", "ハ", "ニ"],
            "a": answer_0based,
            "genre": 11,
            "d": 2,
            "ex": explanation,
        }

        # 画像がある場合のみimgフィールドを追加
        # 問題文の画像を優先
        all_images = q_images + expo_images
        if q_images:
            question_data["img"] = q_images[0]
        elif expo_images:
            question_data["img"] = expo_images[0]

        questions.append(question_data)

    return questions


def main():
    all_questions = []
    errors = []
    total_with_images = 0
    summary_lines = []

    for idx, (url, tag) in enumerate(URL_MAP):
        print(f"[{idx+1}/{len(URL_MAP)}] Fetching: {tag} ({url})")
        try:
            questions = parse_page(url, tag)
            all_questions.extend(questions)
            img_count = sum(1 for q in questions if "img" in q)
            total_with_images += img_count
            line = f"  OK: {tag} - {len(questions)} questions, {img_count} with images"
            print(line)
            summary_lines.append(line)
        except Exception as e:
            err_msg = f"  ERROR: {tag} - {str(e)}"
            print(err_msg)
            errors.append(err_msg)
            summary_lines.append(err_msg)

        # サーバー負荷対策
        if idx < len(URL_MAP) - 1:
            time.sleep(1)

    # JSON保存
    output_path = os.path.join(WORK_DIR, "_denki_questions.json")
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(all_questions, f, ensure_ascii=False, indent=2)

    # サマリー
    summary = []
    summary.append("=" * 50)
    summary.append("第二種電気工事士 過去問取得結果サマリー")
    summary.append("=" * 50)
    summary.append(f"取得URL数: {len(URL_MAP)}")
    summary.append(f"取得問題数: {len(all_questions)}")
    summary.append(f"画像付き問題数: {total_with_images}")
    summary.append(f"エラー数: {len(errors)}")
    summary.append("")
    summary.append("--- 各URL詳細 ---")
    summary.extend(summary_lines)
    if errors:
        summary.append("")
        summary.append("--- エラー詳細 ---")
        summary.extend(errors)
    summary.append("")
    summary.append(f"出力ファイル: {output_path}")

    summary_text = "\n".join(summary)
    print()
    print(summary_text)

    summary_path = os.path.join(WORK_DIR, "_denki_summary.txt")
    with open(summary_path, 'w', encoding='utf-8') as f:
        f.write(summary_text)

    print(f"\nSaved: {output_path}")
    print(f"Saved: {summary_path}")


if __name__ == "__main__":
    main()
