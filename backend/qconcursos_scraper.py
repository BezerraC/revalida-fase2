import asyncio
import json
import os
import re
import httpx
from playwright.async_api import async_playwright

# Configuration
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
IMAGES_DIR = os.path.join(BASE_DIR, "exams", "images")
JSONS_DIR = os.path.join(BASE_DIR, "exams", "jsons")
GABARITOS_FILE = os.path.join(BASE_DIR, "gabaritos.json")

# Ensure directories exist
os.makedirs(IMAGES_DIR, exist_ok=True)
os.makedirs(JSONS_DIR, exist_ok=True)

# List of URLs to scrape
URLS = [
    "https://www.qconcursos.com/questoes-de-concursos/provas/inep-2011-inep-exame-nacional-de-revalidacao-2011-1/questoes",
    "https://www.qconcursos.com/questoes-de-concursos/provas/inep-2012-inep-exame-nacional-de-revalidacao-2012-1/questoes",
    "https://www.qconcursos.com/questoes-de-concursos/provas/inep-2013-inep-exame-nacional-de-revalidacao-2013-1/questoes",
    "https://www.qconcursos.com/questoes-de-concursos/provas/inep-2014-inep-exame-nacional-de-revalidacao-2014-1/questoes",
    "https://www.qconcursos.com/questoes-de-concursos/provas/inep-2015-inep-exame-nacional-de-revalidacao-2015-1/questoes",
    "https://www.qconcursos.com/questoes-de-concursos/provas/inep-2016-inep-exame-nacional-de-revalidacao-2016-1/questoes",
    "https://www.qconcursos.com/questoes-de-concursos/provas/inep-2020-inep-exame-nacional-de-revalidacao-2020-1/questoes",
    "https://www.qconcursos.com/questoes-de-concursos/provas/inep-2021-inep-exame-nacional-de-revalidacao-2021-1/questoes",
    "https://www.qconcursos.com/questoes-de-concursos/provas/inep-2022-inep-exame-nacional-de-revalidacao-2022-1/questoes",
    "https://www.qconcursos.com/questoes-de-concursos/provas/inep-2022-inep-exame-nacional-de-revalidacao-2022-2/questoes",
    "https://www.qconcursos.com/questoes-de-concursos/provas/inep-2023-inep-exame-nacional-de-revalidacao-2023-1/questoes",
    "https://www.qconcursos.com/questoes-de-concursos/provas/inep-2023-inep-exame-nacional-de-revalidacao-2023-2/questoes",
    "https://www.qconcursos.com/questoes-de-concursos/provas/inep-2024-inep-exame-nacional-de-revalidacao-2024-1/questoes",
    "https://www.qconcursos.com/questoes-de-concursos/provas/inep-2025-inep-exame-nacional-de-revalidacao-2025-1/questoes",
    "https://www.qconcursos.com/questoes-de-concursos/provas/inep-2025-inep-exame-nacional-de-revalidacao-2025-2/questoes",
]

def get_exam_id_from_url(url):
    match = re.search(r"(\d{4})-(\d)", url)
    if match:
        year = match.group(1)
        period = match.group(2)
        return f"{year}_{period}"
    return "unknown"

async def download_image(url, path):
    try:
        async with httpx.AsyncClient() as client:
            resp = await client.get(url)
            if resp.status_code == 200:
                with open(path, "wb") as f:
                    f.write(resp.content)
                return True
    except Exception as e:
        print(f"Error downloading image {url}: {e}")
    return False

async def scrape_exam(browser, url, gabarito):
    exam_id = get_exam_id_from_url(url)
    # Check if we should use YYYY instead of YYYY_1 if the gabarito only has YYYY
    if exam_id.endswith("_1") and exam_id not in gabarito:
        year = exam_id.split("_")[0]
        if year in gabarito:
            exam_id = year

    print(f"\n--- Scraping Exam: {exam_id} ---")
    context = await browser.new_context(
        user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    )
    page = await context.new_page()
    page.set_default_timeout(60000)
    
    questions = []
    current_url = url
    
    while current_url:
        print(f"Navigating to {current_url}...")
        try:
            await page.goto(current_url, wait_until="load")
            await page.wait_for_selector(".q-question-item", timeout=30000)
        except Exception as e:
            print(f"Navigation error: {e}")
            break
        
        # Get all question containers
        question_elements = await page.query_selector_all(".q-question-item")
        
        for q_el in question_elements:
            try:
                # Question Number
                num_text = await q_el.eval_on_selector(".q-index", "el => el.innerText")
                number_match = re.search(r"\d+", num_text)
                if not number_match:
                    continue
                number = int(number_match.group())
                
                # Question Text
                body_el = await q_el.query_selector(".q-question-body")
                # We want ONLY the text of the body, excluding the alternatives part if it's nested
                # A good way is to get innerText and then split at "Alternativas"
                full_text = await body_el.inner_text()
                text = full_text.split("Alternativas")[0].strip()
                
                # Images
                img_elements = await body_el.query_selector_all("img")
                images = []
                for i, img in enumerate(img_elements):
                    src = await img.get_attribute("src")
                    if src and src.startswith("http"):
                        img_filename = f"{number}_{i}.png"
                        img_path = os.path.join(IMAGES_DIR, exam_id, img_filename)
                        os.makedirs(os.path.dirname(img_path), exist_ok=True)
                        if await download_image(src, img_path):
                            images.append(f"exams/images/{exam_id}/{img_filename}")
                
                # Alternatives
                alternatives = {}
                options_els = await q_el.query_selector_all(".q-radio-button")
                for opt in options_els:
                    label_el = await opt.query_selector(".q-option-item")
                    if not label_el: 
                        # Fallback to old selector just in case
                        label_el = await opt.query_selector(".q-option-label")
                    
                    if not label_el: continue
                    label = await label_el.inner_text()
                    
                    content_el = await opt.query_selector(".js-alternative-content")
                    content = await content_el.inner_text() if content_el else ""
                    
                    alternatives[label.strip().upper()] = content.strip()
                
                # Correct Answer (from Gabarito)
                correct_answer = str(gabarito.get(exam_id, {}).get(str(number), ""))
                
                questions.append({
                    "exam_id": exam_id,
                    "number": number,
                    "text": text,
                    "alternatives": alternatives,
                    "correct_answer": correct_answer,
                    "theme": "",
                    "images": images
                })
                print(f"Scraped Q{number}")
                
            except Exception as e:
                print(f"Error scraping a question: {e}")
        
        # Check for next page
        next_button = await page.query_selector(".q-next")
        if next_button:
            # Check if it's disabled or has href
            is_disabled = await next_button.get_attribute("disabled")
            if is_disabled:
                current_url = None
            else:
                next_href = await next_button.get_attribute("href")
                if next_href:
                    current_url = "https://www.qconcursos.com" + next_href if next_href.startswith("/") else next_href
                else:
                    current_url = None
        else:
            current_url = None
            
    await context.close()
    
    # Save JSON
    output_path = os.path.join(JSONS_DIR, f"{exam_id}.json")
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(questions, f, indent=2, ensure_ascii=False)
    print(f"Saved {len(questions)} questions to {output_path}")

async def main():
    # Load Gabaritos
    if not os.path.exists(GABARITOS_FILE):
        print("Error: gabaritos.json not found. Run parse_gabaritos.py first.")
        return
        
    with open(GABARITOS_FILE, "r") as f:
        gabarito_data = json.load(f)
    
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        
        for url in URLS:
            try:
                await scrape_exam(browser, url, gabarito_data)
            except Exception as e:
                print(f"Failed to scrape {url}: {e}")
                
        await browser.close()

if __name__ == "__main__":
    asyncio.run(main())
