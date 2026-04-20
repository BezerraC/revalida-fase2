import fitz
import re
import os
import json
import certifi
from collections import Counter

# --- Configurações de Temas ---
def get_theme(number):
    if 1 <= number <= 22: return "Clínica Médica"
    if 23 <= number <= 44: return "Cirurgia Geral"
    if 45 <= number <= 66: return "Pediatria"
    if 67 <= number <= 88: return "Ginecologia e Obstetrícia"
    if 89 <= number <= 110: return "Medicina Preventiva e Social"
    return "Geral"

# --- Módulo 1: Extração de Gabarito via Tabelas ---
def extract_answer_key(pdf_path):
    print(f"Lendo gabarito (Tabelas V22): {pdf_path}")
    q_map = {}
    try:
        doc = fitz.open(pdf_path)
        for page in doc:
            tabs = page.find_tables()
            for tab in tabs.tables:
                data = tab.extract()
                last_quest_row = []
                for row in data:
                    if not row: continue
                    clean_row = [str(c).strip() if c is not None else "" for c in row]
                    if not any(clean_row): continue
                    header = clean_row[0].lower()
                    if 'quest' in header:
                        last_quest_row = clean_row[1:]
                    elif 'gaba' in header:
                        gaba_row = clean_row[1:]
                        for q, g in zip(last_quest_row, gaba_row):
                            if q and q.isdigit():
                                num = int(q)
                                val = g.strip().upper()
                                if val in ['-', 'X', '*', 'ANULADA', 'ANULADO']:
                                    q_map[num] = "Anulada"
                                elif val in ['A', 'B', 'C', 'D', 'E']:
                                    q_map[num] = val
        doc.close()
    except Exception as e:
        print(f"Erro ao extrair gabarito: {e}")
    print(f"Gabarito mapeado: {len(q_map)} questões encontradas.")
    return q_map

# --- Módulo 2: Limpeza e Normalização de Texto ---
def clean_text(text):
    if not text: return ""
    text = re.sub(r'\[\[PAGE_SEP_.*?\]\]', ' ', text)
    text = re.sub(r'\s+', ' ', text)
    return text.strip()

# --- Módulo 3: Filtro de Imagens Decorativas ---
def is_ribbon(rect):
    w = rect.x1 - rect.x0
    h = rect.y1 - rect.y0
    if h <= 0: return True
    ratio = w / h
    if ratio > 2.2: return True
    if w < 30 or h < 30: return True
    return False

# --- Módulo 4: Motor de Reconstrução com Backward Scan V22 ---
def build_omni_stream_v22(doc):
    omni_stream = ""
    tables_meta = []
    question_anchors = [] 
    quest_regex = re.compile(r'(?i)QUEST[^\d\n]*?(\d+)\b')
    
    for p_idx in range(len(doc)):
        page = doc[p_idx]
        mid = page.rect.width / 2
        page_tabs = page.find_tables()
        table_bboxes = [tab.bbox for tab in page_tabs.tables]
        
        for t_idx, tab in enumerate(page_tabs.tables):
            bbox = tab.bbox
            side = "L" if bbox[2] <= mid + 10 else "R"
            if (bbox[2] - bbox[0]) > 350: side = "BOTH"
            tables_meta.append({"p_idx": p_idx, "bbox": bbox, "side": side, "t_idx": t_idx})

        words = page.get_text("words")
        valid_words = []
        for w in words:
            if not (60 <= w[1] <= 815): continue
            w_center = ((w[0]+w[2])/2, (w[1]+w[3])/2)
            if any(b[0]<=w_center[0]<=b[2] and b[1]<=w_center[1]<=b[3] for b in table_bboxes): continue
            valid_words.append(w)

        for side in ["L", "R"]:
            side_words = [w for w in valid_words if (w[0] < mid if side=="L" else w[0] >= mid)]
            if not side_words: continue
            omni_stream += f"\n[[PAGE_SEP_{p_idx}_{side}]]\n"
            lines = {}
            for w in side_words:
                y_key = int(w[1] / 2.5) * 2.5
                lines.setdefault(y_key, []).append(w)
            for y in sorted(lines.keys()):
                line_text = " ".join([w[4] for w in sorted(lines[y], key=lambda x: x[0])])
                omni_stream += line_text + "\n"
                m = quest_regex.search(line_text)
                if m:
                    num = int(m.group(1))
                    if 1 <= num <= 110:
                        question_anchors.append({"number": num, "p_idx": p_idx, "side": side, "y": y})
                
    return omni_stream, tables_meta, question_anchors

def extract_alternatives_backward(block):
    """Localiza a sequência A-B-C-D(E) de baixo para cima para evitar falsos positivos."""
    # Procura todos os possíveis marcadores de início de linha A, B, C, D, E
    # Padrão: início de linha (ou logo após quebra), seguido de letra e separador
    pattern = re.compile(r'(?m)^[\s\t]*([A-E])[\s\)\.\-\t]')
    matches = list(pattern.finditer(block))
    if not matches: return []

    # Heurística: as alternativas reais são o ÚLTIMO conjunto de A, B, C, D(E) que aparecem em ordem
    # Vamos encontrar o último 'D' ou 'E' e subir
    for label_count in [5, 4]:
        labels = ['A', 'B', 'C', 'D', 'E'][:label_count]
        # Tenta encontrar a sequência mais ao final do bloco
        candidate = []
        last_found_idx = len(matches) - 1
        for lbl in reversed(labels):
            found = False
            for i in range(last_found_idx, -1, -1):
                if matches[i].group(1).upper() == lbl:
                    candidate.insert(0, matches[i])
                    last_found_idx = i - 1
                    found = True
                    break
            if not found:
                candidate = []
                break
        if candidate and len(candidate) == label_count:
            return candidate
    return []

def process_exam_modular(exam_pdf_path, answers_pdf_path, exam_id):
    print(f"\n=== Iniciando Omni-Parser V22.0 (Backward Scan) para {exam_id} ===")
    answers = extract_answer_key(answers_pdf_path)
    doc = fitz.open(exam_pdf_path)
    omni_stream, tables_meta, anchors = build_omni_stream_v22(doc)
    anchors.sort(key=lambda x: x['number'])
    
    def get_q_bounds(q_num):
        curr = next((a for a in anchors if a['number'] == q_num), None)
        if not curr: return None
        nxt = next((a for a in anchors if a['number'] > q_num and a['p_idx'] == curr['p_idx'] and a['side'] == curr['side']), None)
        return {"p_idx": curr['p_idx'], "side": curr['side'], "y_start": curr['y'], "y_end": nxt['y'] if nxt else 815}

    q_matches = list(re.finditer(r'(?mi)^[\s\t]*QUEST[^\d\n]*?(\d+)\b|^[\s\t]*(\d+)\s+QUEST[^\d\n]*', omni_stream))
    unique_matches = []
    seen = set()
    for m in q_matches:
        num = int(m.group(1) or m.group(2))
        if num not in seen and 1 <= num <= 110:
            unique_matches.append(m); seen.add(num)
    unique_matches.sort(key=lambda x: x.start())
    
    results = []
    image_dir = "backend/exams/images"
    os.makedirs(image_dir, exist_ok=True)

    for i, match in enumerate(unique_matches):
        num = int(match.group(1) or match.group(2))
        block = omni_stream[match.end() : (unique_matches[i+1].start() if i+1 < len(unique_matches) else len(omni_stream))]
        
        # --- NOVO: Extração Reversa de Alternativas ---
        f_seq = extract_alternatives_backward(block)
        
        if f_seq:
            prompt = clean_text(block[:f_seq[0].start()])
            alts = {f_seq[j].group(1): clean_text(block[f_seq[j].end() : (f_seq[j+1].start() if j+1 < len(f_seq) else len(block))]) for j in range(len(f_seq))}
            
            q_box = get_q_bounds(num)
            imgs = []
            if q_box:
                p_idx, side, y_s, y_e = q_box["p_idx"], q_box["side"], q_box["y_start"], q_box["y_end"]
                page_obj = doc[p_idx]; mid = page_obj.rect.width / 2

                for img_info in page_obj.get_images():
                    rcts = page_obj.get_image_rects(img_info)
                    if rcts:
                        r = rcts[0]
                        if is_ribbon(r): continue
                        img_side = side if (r.x1 - r.x0) > 350 else ("L" if r.x1 <= mid + 10 else "R")
                        if img_side == side and (y_s - 10 <= r.y0 <= y_e + 10 or y_s - 10 <= r.y1 <= y_e + 10):
                            fname = f"{exam_id}_q{num}_p{p_idx}_{img_info[0]}.png"
                            fpath = os.path.join(image_dir, fname)
                            if not os.path.exists(fpath): page_obj.get_pixmap(matrix=fitz.Matrix(2,2), clip=r).save(fpath)
                            if os.path.exists(fpath) and os.path.getsize(fpath) > 5000: imgs.append(f"exams/images/{fname}")

                for t_meta in [t for t in tables_meta if t["p_idx"] == p_idx]:
                    if (t_meta["side"] == side or t_meta["side"] == "BOTH") and (y_s - 10 <= t_meta["bbox"][1] <= y_e + 10 or y_s - 10 <= t_meta["bbox"][3] <= y_e + 10):
                        fname = f"{exam_id}_table_q{num}_p{p_idx}_t{t_meta['t_idx']}.png"
                        fpath = os.path.join(image_dir, fname)
                        if not os.path.exists(fpath): page_obj.get_pixmap(matrix=fitz.Matrix(2,2), clip=t_meta["bbox"]).save(fpath)
                        imgs.append(f"exams/images/{fname}")

            results.append({
                "exam_id": exam_id, "number": num, "text": prompt,
                "alternatives": alts, "correct_answer": answers.get(num),
                "theme": get_theme(num), "images": list(set(imgs))
            })

    with open(f"backend/exams/jsons/{exam_id}.json", "w", encoding="utf-8") as f:
        json.dump(results, f, ensure_ascii=False, indent=2)
    doc.close()
    print(f"Sucesso V22.0: {len(results)} questes exportadas com Backward Scan.")
    return results

if __name__ == "__main__":
    import sys
    eid = sys.argv[1] if len(sys.argv) > 1 else "2025_1"
    pdf, ans = f"backend/exams/pdfs/{eid}_PV_objetiva_regular.pdf", f"backend/exams/answers/{eid}_GB_objetiva_definitivo.pdf"
    process_exam_modular(pdf, ans, eid)
