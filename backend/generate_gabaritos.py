import fitz  # PyMuPDF
import re
import os
import json

def parse_gabarito(pdf_path):
    """
    Parses a Revalida gabarito PDF and returns a dictionary of {question_number: answer}.
    Handles multiple layouts (vertical, horizontal, table-based).
    """
    try:
        doc = fitz.open(pdf_path)
    except Exception as e:
        print(f"Error opening {pdf_path}: {e}")
        return {}

    all_text = ""
    for page in doc:
        all_text += page.get_text()
    
    # Normalize some common characters
    all_text = all_text.replace("Questo", "Questão")
    
    answers = {}

    # Strategy 1: Look for "Number - Letter" or "Number Letter" pairs (Vertical/Table)
    # Matches: "1 - A", "2 B", "3 Anulada", "1 - N", "1 - X", "1 X", "1 -"
    # We include N, X, and various dashes as common markers for anulada
    matches = re.findall(r"(\d+)\s*(?:-|\s|:)\s*([A-E]|Anulada|N|X|[–—−\-̶])", all_text)
    
    if len(matches) >= 80:
        for num, ans in matches:
            num_int = int(num)
            if num_int > 120: continue 
            
            if ans in ["N", "X", "–", "—", "−", "-", "̶"]: ans = "Anulada"
            answers[num_int] = ans
        if len(answers) >= 80:
            return answers

    # Strategy 2: Tokenized sequence (Questão 1 2 3 ... Gabarito A B C ...)
    # This handles the 2023/2024 style tables and 2011 style lists
    tokens = all_text.split()
    i = 0
    while i < len(tokens):
        # Look for a block of question numbers
        token_clean = tokens[i].lower().strip(":").strip()
        is_num_start = token_clean in ["questão", "questao", "it"] or tokens[i].isdigit()
        
        if is_num_start:
            num_list = []
            if tokens[i].isdigit(): 
                # If it started with '1', include it
                num_list.append(int(tokens[i]))
            i += 1
            while i < len(tokens) and tokens[i].isdigit():
                num_list.append(int(tokens[i]))
                i += 1
            
            # Now look for the corresponding answers block
            # In some PDFs, letters follow numbers immediately.
            # In others, there's a "Gabarito" label.
            
            found_gabarito = False
            # Check the next few tokens for a label or letters
            j = i
            while j < min(i + 20, len(tokens)):
                if tokens[j].lower().startswith("gabarito") or tokens[j] == "GAB_PREL":
                    i = j + 1
                    found_gabarito = True
                    break
                j += 1
            
            # If we didn't find "Gabarito", but the next token is a valid answer,
            # we assume the answers follow the numbers.
            if not found_gabarito:
                # Check if i points to a valid answer token
                if i < len(tokens) and tokens[i] in ["A", "B", "C", "D", "E", "Anulada", "X", "N", "-"]:
                    pass # Keep i where it is
                else:
                    # Skip to next possible block
                    i += 1
                    continue

            for num in num_list:
                if i < len(tokens):
                    ans = tokens[i]
                    # Normalize anulada markers
                    if ans in ["-", "X", "N", "–", "—", "−", "̶"]: 
                        ans = "Anulada"
                    
                    if ans in ["A", "B", "C", "D", "E", "Anulada"]:
                        answers[num] = ans
                        i += 1
                    else:
                        # Try to skip non-answer tokens
                        continue
        else:
            i += 1
            
    # Strategy 3: Separated horizontal lines (Line of numbers followed by line of letters)
    # Common in 2011/2013
    lines = [l.strip() for l in all_text.splitlines() if l.strip()]
    for i, line in enumerate(lines):
        nums = re.findall(r"\b\d+\b", line)
        if len(nums) >= 10:
            # Look at the next few lines for a corresponding line of letters
            for offset in range(1, 4):
                if i + offset < len(lines):
                    potential_letters = re.findall(r"\b([A-E]|X|N|̶)\b|(-)", lines[i + offset])
                    letters = [l[0] if l[0] else l[1] for l in potential_letters]
                    
                    if len(letters) == len(nums):
                        for j, num in enumerate(nums):
                            n = int(num)
                            ans = letters[j]
                            if ans in ["X", "N", "-", "̶"]: ans = "Anulada"
                            if n <= 120:
                                answers[n] = ans
                        break # Found the letters for this number block

    return answers

def generate_all_gabaritos(answers_dir, output_file):
    all_data = {}
    
    # Sort files to process in a consistent order
    files = sorted([f for f in os.listdir(answers_dir) if f.endswith(".pdf")])
    
    for filename in files:
        # Extract exam ID from filename (e.g., 2022_1_GB... -> 2022_1)
        # Patterns: 2022_1, 2011, 2023_2
        match = re.match(r"(\d{4}(?:_\d)?).*", filename)
        if match:
            exam_id = match.group(1)
            pdf_path = os.path.join(answers_dir, filename)
            print(f"Processing {filename} (ID: {exam_id})...")
            
            ans = parse_gabarito(pdf_path)
            
            if ans:
                # Convert to string keys for JSON compatibility and sort by number
                sorted_ans = {str(k): ans[k] for k in sorted(ans.keys())}
                all_data[exam_id] = sorted_ans
                print(f"  Successfully extracted {len(ans)} answers.")
            else:
                # 2020 is a known image-based PDF
                if "2020" in exam_id:
                    print(f"  Warning: {filename} appears to be an image-based PDF. Text extraction failed.")
                else:
                    print(f"  Warning: No answers found for {filename}.")
    
    # Save to JSON
    with open(output_file, "w", encoding="utf-8") as f:
        # Add 2020 manual data if not already present or incomplete
        if "2020" not in all_data or len(all_data["2020"]) < 100:
            all_data["2020"] = {
                "1": "A", "2": "C", "3": "C", "4": "A", "5": "B", "6": "D", "7": "C", "8": "D", "9": "A", "10": "C",
                "11": "B", "12": "B", "13": "D", "14": "B", "15": "B", "16": "A", "17": "C", "18": "C", "19": "B", "20": "C",
                "21": "B", "22": "C", "23": "C", "24": "B", "25": "A", "26": "A", "27": "A", "28": "A", "29": "B", "30": "B",
                "31": "C", "32": "A", "33": "A", "34": "C", "35": "D", "36": "C", "37": "B", "38": "A", "39": "B", "40": "B",
                "41": "B", "42": "A", "43": "B", "44": "C", "45": "D", "46": "C", "47": "C", "48": "C", "49": "B", "50": "D",
                "51": "D", "52": "C", "53": "C", "54": "A", "55": "B", "56": "D", "57": "C", "58": "A", "59": "B", "60": "D",
                "61": "C", "62": "D", "63": "B", "64": "B", "65": "A", "66": "B", "67": "C", "68": "D", "69": "D", "70": "D",
                "71": "A", "72": "D", "73": "C", "74": "C", "75": "B", "76": "A", "77": "D", "78": "A", "79": "D", "80": "B",
                "81": "C", "82": "D", "83": "C", "84": "B", "85": "D", "86": "D", "87": "C", "88": "B", "89": "A", "90": "D",
                "91": "D", "92": "C", "93": "B", "94": "B", "95": "C", "96": "D", "97": "D", "98": "C", "99": "D", "100": "A"
            }
        
        # Add 2013 manual data if not already present or incomplete
        if "2013" not in all_data or len(all_data["2013"]) < 110:
            all_data["2013"] = {
                "1": "C", "2": "A", "3": "E", "4": "E", "5": "B", "6": "C", "7": "D", "8": "C", "9": "E", "10": "A",
                "11": "D", "12": "E", "13": "B", "14": "B", "15": "A", "16": "E", "17": "E", "18": "A", "19": "A", "20": "E",
                "21": "E", "22": "D", "23": "A", "24": "C", "25": "A", "26": "D", "27": "C", "28": "D", "29": "E", "30": "C",
                "31": "B", "32": "D", "33": "E", "34": "A", "35": "C", "36": "E", "37": "D", "38": "B", "39": "B", "40": "B",
                "41": "A", "42": "D", "43": "B", "44": "B", "45": "B", "46": "C", "47": "D", "48": "D", "49": "D", "50": "C",
                "51": "E", "52": "C", "53": "B", "54": "C", "55": "E", "56": "E", "57": "B", "58": "Anulada", "59": "Anulada", "60": "A",
                "61": "D", "62": "E", "63": "C", "64": "D", "65": "C", "66": "C", "67": "D", "68": "C", "69": "A", "70": "C",
                "71": "A", "72": "D", "73": "E", "74": "B", "75": "B", "76": "D", "77": "D", "78": "E", "79": "C", "80": "D",
                "81": "D", "82": "B", "83": "C", "84": "B", "85": "B", "86": "B", "87": "E", "88": "A", "89": "E", "90": "B",
                "91": "B", "92": "D", "93": "C", "94": "C", "95": "E", "96": "B", "97": "B", "98": "A", "99": "A", "100": "A",
                "101": "A", "102": "A", "103": "Anulada", "104": "D", "105": "A", "106": "D", "107": "Anulada", "108": "B", "109": "A", "110": "C"
            }

        # Add 2017 manual data if not already present or incomplete
        if "2017" not in all_data or len(all_data["2017"]) < 100:
            all_data["2017"] = {
                "1": "Anulada", "2": "B", "3": "C", "4": "B", "5": "A", "6": "B", "7": "B", "8": "D", "9": "C", "10": "A",
                "11": "C", "12": "D", "13": "A", "14": "C", "15": "C", "16": "B", "17": "B", "18": "D", "19": "C", "20": "C",
                "21": "B", "22": "B", "23": "B", "24": "A", "25": "B", "26": "D", "27": "B", "28": "A", "29": "B", "30": "C",
                "31": "C", "32": "D", "33": "D", "34": "A", "35": "Anulada", "36": "Anulada", "37": "D", "38": "B", "39": "B", "40": "B",
                "41": "Anulada", "42": "B", "43": "C", "44": "C", "45": "B", "46": "A", "47": "A", "48": "A", "49": "B", "50": "D",
                "51": "D", "52": "D", "53": "Anulada", "54": "D", "55": "D", "56": "D", "57": "D", "58": "B", "59": "D", "60": "C",
                "61": "D", "62": "C", "63": "C", "64": "Anulada", "65": "A", "66": "C", "67": "A", "68": "A", "69": "Anulada", "70": "C",
                "71": "C", "72": "Anulada", "73": "B", "74": "D", "75": "Anulada", "76": "Anulada", "77": "C", "78": "B", "79": "C", "80": "D",
                "81": "C", "82": "C", "83": "C", "84": "A", "85": "C", "86": "A", "87": "B", "88": "C", "89": "B", "90": "D",
                "91": "D", "92": "A", "93": "A", "94": "C", "95": "A", "96": "A", "97": "D", "98": "D", "99": "D", "100": "D"
            }
        
        json.dump(all_data, f, indent=2, ensure_ascii=False)
    
    print(f"\nDone! Gabaritos saved to {output_file}")

if __name__ == "__main__":
    ANSWERS_DIR = r"d:\Trabalhos\revalida-fase2\backend\exams\answers"
    OUTPUT_FILE = r"d:\Trabalhos\revalida-fase2\backend\gabaritos.json"
    
    generate_all_gabaritos(ANSWERS_DIR, OUTPUT_FILE)
