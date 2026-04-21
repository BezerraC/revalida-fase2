import os
import re
import json
import httpx
from bs4 import BeautifulSoup
from urllib.parse import urljoin

# Configuration
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
IMAGES_DIR = os.path.join(BASE_DIR, "exams", "images")
JSONS_DIR = os.path.join(BASE_DIR, "exams", "jsons")

# Ensure directories exist
os.makedirs(IMAGES_DIR, exist_ok=True)
os.makedirs(JSONS_DIR, exist_ok=True)

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
}

def get_exam_id(url):
    if "27" in url: return "2017"
    if "29" in url: return "2024_2"
    return "unknown"

def download_image(url, folder, filename):
    try:
        os.makedirs(folder, exist_ok=True)
        filepath = os.path.join(folder, filename)
        if os.path.exists(filepath):
            return True
            
        with httpx.Client(headers=HEADERS, follow_redirects=True) as client:
            resp = client.get(url)
            if resp.status_code == 200:
                with open(filepath, "wb") as f:
                    f.write(resp.content)
                return True
    except Exception as e:
        print(f"Error downloading {url}: {e}")
    return False

def clean_text(text):
    if not text: return ""
    # Remove multiple newlines and leading/trailing whitespace
    text = re.sub(r'\n+', '\n', text)
    return text.strip()

def scrape_medsimulados(url):
    exam_id = get_exam_id(url)
    print(f"\n--- Scraping MedSimulados Exam: {exam_id} ---")
    
    try:
        with httpx.Client(headers=HEADERS, timeout=30.0, follow_redirects=True) as client:
            response = client.get(url)
            response.raise_for_status()
            html = response.text
    except Exception as e:
        print(f"Failed to fetch URL {url}: {e}")
        return

    soup = BeautifulSoup(html, "html.parser")
    question_blocks = soup.find_all("div", class_="mb-4")
    
    results = []
    
    for block in question_blocks:
        title_tag = block.find("h2", class_="h4")
        if not title_tag or "Questão" not in title_tag.text:
            continue
            
        q_num_match = re.search(r"Questão\s*(\d+)", title_tag.text)
        if not q_num_match:
            continue
        q_num = int(q_num_match.group(1))
        
        content_div = block.select_one(".trix-content")
        if not content_div:
            continue
            
        # Extract images from content_div
        images = []
        attachments = content_div.find_all("action-text-attachment")
        for i, attach in enumerate(attachments):
            img_tag = attach.find("img")
            if img_tag and img_tag.get("src"):
                img_url = img_tag["src"]
                img_filename = f"med_{exam_id}_q{q_num}_img{i}.png"
                target_folder = os.path.join(IMAGES_DIR, f"medsimulados_{exam_id}")
                
                if download_image(img_url, target_folder, img_filename):
                    images.append(f"exams/images/medsimulados_{exam_id}/{img_filename}")

        # Alternatives and Text Extraction (Alternatives are siblings of content_div)
        alternatives = {}
        prompt_text = clean_text(content_div.get_text())
        
        # Look for <p> tags starting with <strong>a)</strong>, <strong>b)</strong> etc.
        # These are usually after content_div in the block
        all_paragraphs = block.find_all("p")
        for p in all_paragraphs:
            p_text = clean_text(p.get_text())
            # Match "a)" at the very start
            match = re.match(r"^([a-e])\)\s*(.*)", p_text, re.IGNORECASE | re.DOTALL)
            if match:
                letter = match.group(1).upper()
                content = match.group(2).strip()
                alternatives[letter] = content
            elif "Resposta correta:" in p_text:
                continue # Skip the answer para
            # Note: We don't want to append other <p> to alternatives here unless we are sure

        # Correct Answer
        ans_tag = block.find("small")
        correct_ans = ""
        if ans_tag and "Resposta correta:" in ans_tag.text:
            ans_match = re.search(r"Resposta correta:\s*([a-e])", ans_tag.text, re.IGNORECASE)
            if ans_match:
                correct_ans = ans_match.group(1).upper()

        results.append({
            "exam_id": exam_id,
            "number": q_num,
            "text": prompt_text,
            "alternatives": alternatives,
            "correct_answer": correct_ans,
            "theme": "",
            "images": images
        })
        print(f"Scraped Q{q_num} (Images: {len(images)}, Alts: {len(alternatives)})")

    output_path = os.path.join(JSONS_DIR, f"{exam_id}.json")
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(results, f, indent=2, ensure_ascii=False)
    print(f"\nSaved {len(results)} questions for {exam_id} to {output_path}")

if __name__ == "__main__":
    import sys
    urls = [
        "https://www.medsimulados.com/provas/27", # 2017
        "https://www.medsimulados.com/provas/29"  # 2024_2
    ]
    for url in urls:
        scrape_medsimulados(url)
