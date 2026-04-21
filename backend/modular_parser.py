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
    print(f"Lendo gabarito (Tabelas/Texto V22): {pdf_path}")
    q_map = {}
    try:
        doc = fitz.open(pdf_path)
        for page in doc:
            # Tenta via tabelas primeiro
            tabs = page.find_tables()
            if tabs.tables:
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
            
            # Se não encontrou via tabelas ou encontrou pouco, tenta via texto
            text = page.get_text()
            # Procura padrões de Questão (Número) seguido de Resposta (A-E ou Anulada)
            lines = [l.strip() for l in text.split('\n') if l.strip()]
            for i in range(len(lines) - 1):
                if lines[i].isdigit():
                    q_num = int(lines[i])
                    q_val = lines[i+1].upper()
                    if q_val in ['A', 'B', 'C', 'D', 'E', 'ANULADA', 'ANULADO']:
                        if 1 <= q_num <= 120:
                            q_map[q_num] = "Anulada" if "ANULAD" in q_val else q_val

        doc.close()
    except Exception as e:
        print(f"Erro ao extrair gabarito: {e}")
    print(f"Gabarito mapeado: {len(q_map)} questões encontradas.")
    return q_map

# --- Módulo 2: Limpeza e Normalização de Texto ---
# Mapeamento para consertar o encoding quebrado do Revalida 2022_1
MAP_2022_1 = {
    2: 'U', 3: 'm', 4: 'a', 5: ' ', 6: 'u', 7: 'l', 8: 'h', 9: 'e', 10: 'r',
    11: 'c', 12: 'o', 13: '5', 14: '1', 15: 'n', 16: 's', 17: 'd', 18: 'i', 19: ',',
    20: 't', 21: 'p', 22: 'b', 23: 'f', 24: 'j', 25: 'g', 26: 'v', 27: 'x', 28: 'ã',
    29: 'q', 31: '-', 32: ' ', 34: '.', 37: '8', 38: 'á', 39: 'ê', 40: '(', 41: 'ç', 
    42: 'v', 43: '+', 44: 'à', 45: 'í', 46: ')', 47: '/', 48: '0', 49: '3', 50: '7', 
    51: '9', 52: '2', 53: '4', 54: '6', 55: '8', 56: '.', 57: 'A', 58: ':', 60: 'ó', 
    61: 'O', 65: 'I', 70: 'ç', 73: 'I', 72: '0', 74: ' ', 35: 'Q', 36: 'á', 
    ord('!'): 'à', ord('ú'): '8', ord('Á'): 'á', ord('í'): 'ê', ord('ç'): ',',
    ord('0'): '4', ord(':'): '6', ord('J'): '9', ord('/'): '5', ord(';'): ',', 
    ord('<'): 'p', ord('='): '.', ord('>'): 'v', ord('?'): '?', ord('@'): '@',
    ord('F'): '.', ord('G'): ' ', ord('H'): '0', ord('I'): 'I', ord('K'): ' ',
}

def translate_if_needed(text, font_name, exam_id):
    if exam_id == "2022_1" and font_name == "TT3122o00":
        return "".join([MAP_2022_1.get(ord(c), c) for c in text])
    return text

def extract_text_with_translation(page, exam_id, clip=None):
    """Extrai texto de uma página aplicando a tradução de encoding se necessário."""
    blocks = page.get_text("dict", clip=clip)["blocks"]
    full_text = []
    for b in blocks:
        if "lines" in b:
            line_texts = []
            for l in b["lines"]:
                span_texts = []
                for s in l["spans"]:
                    txt = translate_if_needed(s["text"], s["font"], exam_id)
                    span_texts.append(txt)
                line_texts.append("".join(span_texts))
            full_text.append("\n".join(line_texts))
    return "\n\n".join(full_text)

def clean_text(text):
    if not text: return ""
    text = re.sub(r'\[\[PAGE_SEP_.*?\]\]', ' ', text)
    # Suporta tags simples [[IMAGE_ID_0]] e paginadas [[IMAGE_P12_ID_0]]
    text = re.sub(r'\[\[(IMAGE|TABLE)(_P\d+)?_ID_.*?\]\]', ' ', text)
    # Remover marcadores de layout que poluem o texto
    text = re.sub(r'(?i)ÁREA\s+LIVRE|AREA\s+LIVRE', ' ', text)
    text = re.sub(r'(?i)\d{4}\s+(PRIMEIRA|SEGUNDA)\s+EDI[ÇC]ÃO', ' ', text)
    text = re.sub(r'(?i)PRIMEIRA\s+EDI[ÇC]ÃO|SEGUNDA\s+EDI[ÇC]ÃO', ' ', text)
    text = re.sub(r'(?i)REVALIDA\s*\d{4}', ' ', text)
    text = re.sub(r'\s+', ' ', text)
    return text.strip()

# --- Módulo 3: Filtro de Imagens Decorativas ---
def is_ribbon(rect):
    w = rect.x1 - rect.x0
    h = rect.y1 - rect.y0
    if w < 20 or h < 20: return True
    return False

# --- Módulo 4: Motor de Reconstrução com Backward Scan V22 ---
def build_omni_stream_v22(doc, exam_id):
    omni_stream = ""
    tables_meta = []
    question_anchors = [] 
    quest_regex = re.compile(r'(?i)QUEST.*?\s+(\d+)')

    def get_translated_words(page, eid):
        # Se não for 2022_1, usa o padrão rápido
        if eid != "2022_1":
            return page.get_text("words")
        
        # Para 2022_1, precisamos do dict para ver as fontes
        dict_data = page.get_text("dict")
        words = []
        for b_idx, b in enumerate(dict_data["blocks"]):
            if "lines" in b:
                for l_idx, l in enumerate(b["lines"]):
                    for s_idx, s in enumerate(l["spans"]):
                        font = s["font"]
                        text = s["text"]
                        # Traduzir o texto do span
                        translated = translate_if_needed(text, font, eid)
                        parts = translated.split(" ")
                        for w_idx, p in enumerate(parts):
                            if p.strip():
                                words.append((s["bbox"][0], s["bbox"][1], s["bbox"][2], s["bbox"][3], p, b_idx, l_idx, w_idx))
        return words

    for p_idx in range(len(doc)):
        page = doc[p_idx]
        mid = page.rect.width / 2
        words = get_translated_words(page, exam_id)
        # --- Módulo de Detecção de Tabelas (Dual Strategy) ---
        def is_page_box(bbox, page):
            return (bbox[2] - bbox[0]) > 0.8 * page.rect.width and (bbox[3] - bbox[1]) > 0.8 * page.rect.height

        # --- Módulo de Detecção de Tabelas (Dual Strategy) ---
        tabs_def = page.find_tables(snap_tolerance=5)
        tabs_txt = page.find_tables(vertical_strategy="text", snap_tolerance=5)
        
        raw_configs = []
        # Primeiro, pegamos as tabelas da estratégia padrão (vetorial)
        for t in tabs_def.tables:
            if is_page_box(t.bbox, page): continue
            raw_configs.append({
                "bbox": list(t.bbox),
                "cols": len(t.header.names) if t.header.names else 0,
                "cells": t.cells,
                "strategy": "def"
            })
            
        # Depois, integramos a estratégia baseada em texto para completar tabelas cortadas
        for t in tabs_txt.tables:
            if is_page_box(t.bbox, page): continue
            t_bbox = list(t.bbox)
            is_duplicate = False
            for rc in raw_configs:
                # Verificar sobreposição significativa
                cb = rc["bbox"]
                overlap_x = min(cb[2], t_bbox[2]) - max(cb[0], t_bbox[0])
                overlap_y = min(cb[3], t_bbox[3]) - max(cb[1], t_bbox[1])
                
                if overlap_x > 50 and overlap_y > 0:
                    # Sincronizar coordenadas X (Union)
                    rc["bbox"][0] = min(rc["bbox"][0], t_bbox[0])
                    rc["bbox"][2] = max(rc["bbox"][2], t_bbox[2])
                    
                    # Expandir para baixo
                    if t_bbox[3] > cb[3]:
                        rc["bbox"][3] = t_bbox[3]
                    
                    # Expandir para cima APENAS se for uma pequena correção (snapping/imprecisão)
                    # Se for uma expansão grande (> 20px), ignorar (provavelmente capturou texto da questão acima)
                    gap_top = rc["bbox"][1] - t_bbox[1]
                    if 0 < gap_top < 20:
                        rc["bbox"][1] = t_bbox[1]
                    
                    # Atualizar células se a nova for maior/mais completa
                    if len(t.cells) > len(rc["cells"]):
                        rc["cells"] = t.cells
                        rc["cols"] = len(t.header.names) if t.header.names else rc["cols"]
                    
                    is_duplicate = True
                    break
            
            if not is_duplicate:
                raw_configs.append({
                    "bbox": t_bbox,
                    "cols": len(t.header.names) if t.header.names else 0,
                    "cells": t.cells,
                    "strategy": "txt"
                })

        # --- Módulo de Remoção de Tabelas Contidas (Prevenir Duplicatas) ---
        unique_configs = []
        if raw_configs:
            def get_area(b): return (b[2]-b[0]) * (b[3]-b[1])
            raw_configs.sort(key=lambda x: get_area(x["bbox"]), reverse=True)
            for rc in raw_configs:
                is_contained = False
                for uc in unique_configs:
                    cb, ub = rc["bbox"], uc["bbox"]
                    # Se rc está contida em uc (com margem de erro)
                    if cb[0] >= ub[0]-5 and cb[1] >= ub[1]-5 and cb[2] <= ub[2]+5 and cb[3] <= ub[3]+5:
                        is_contained = True
                        break
                if not is_contained:
                    unique_configs.append(rc)
            raw_configs = unique_configs

        # --- Módulo de Fusão de Tabelas (Prevenir Split) ---
        final_table_configs = []
        if raw_configs:
            raw_configs.sort(key=lambda x: x["bbox"][1])
            curr = raw_configs[0]
            for nxt in raw_configs[1:]:
                nb = nxt["bbox"]
                cb = curr["bbox"]
                gap = nb[1] - cb[3]
                overlap_x = min(cb[2], nb[2]) - max(cb[0], nb[0])
                gap_text = extract_text_with_translation(page, exam_id, clip=(min(cb[0], nb[0]), cb[3], max(cb[2], nb[2]), nb[1])).upper()
                # Se houver overlap ou gap pequeno, e não houver "QUESTÃO" no meio
                if -20 <= gap < 60 and overlap_x > 50 and "QUESTÃO" not in gap_text and "QUESTAO" not in gap_text:
                    curr["bbox"] = [min(cb[0], nb[0]), min(cb[1], nb[1]), max(cb[2], nb[2]), max(cb[3], nb[3])]
                    if len(nxt["cells"]) > len(curr["cells"]):
                        curr["cells"] = nxt["cells"]
                else:
                    final_table_configs.append(curr)
                    curr = nxt
            final_table_configs.append(curr)

        table_bboxes = []
        for t_idx, t_conf in enumerate(final_table_configs):
            bbox = t_conf["bbox"]
            cols = t_conf["cols"]
            rows = len(t_conf["cells"]) // cols if cols > 0 else 0
            
            # FILTRO: Ignorar boxes decorativos (Cabeçalho de Questão ou Área Livre)
            # EXCEÇÃO: Se for uma tabela de laboratório, não ignorar mesmo que contenha "QUESTÃO" (vazamento de OCR)
            lab_keywords = ["REFERÊNCIA", "REFERENCIA", "ANTICORPO", "ESCORE-Z", "Z-SCORE", "UI/ML", "MG/DL", "MMOL/L", "VALOR:", "HEMOGRAMA", "URINA"]
            inner_text = extract_text_with_translation(page, exam_id, clip=bbox).upper()
            is_lab_table = any(kw in inner_text for kw in lab_keywords)

            # Se contiver marcadores de layout, ignorar, a menos que seja uma tabela de lab pequena/média
            if ("QUESTÃO" in inner_text or "QUESTAO" in inner_text or "ÁREA LIVRE" in inner_text or "AREA LIVRE" in inner_text):
                # Se a tabela for muito grande (mais de 60% da página) ou não for lab, ignorar
                if (bbox[3] - bbox[1]) > 450 or not is_lab_table:
                    continue

            # FILTRO: Ignorar "tabelas" com células muito altas (geralmente parágrafos dentro de boxes)
            # Mesmo tabelas de laboratório não costumam ter células maiores que 150px
            max_cell_h = 0
            for cell in t_conf["cells"]:
                if cell: max_cell_h = max(max_cell_h, cell[3] - cell[1])
            
            if max_cell_h > 150:
                continue
            if max_cell_h > 40 and not is_lab_table:
                continue
            if max_cell_h > 500: # Limite absoluto redundante
                continue

            # FILTRO: Ignorar "tabelas" de célula única que contêm muito texto
            if cols == 1 and rows <= 1 and not is_lab_table:
                if len(inner_text.strip()) > 50:
                    continue
            
            # FILTRO: Ignorar tabelas que parecem ser apenas o layout de colunas da página
            # Layout boxes costumam ter 2 colunas e poucas linhas, cobrindo grande parte da largura
            if cols == 2 and rows <= 2 and (bbox[2] - bbox[0]) > 350:
                continue
            
            # FILTRO: Ignorar tabelas muito pequenas ou falsos positivos
            if (bbox[2] - bbox[0]) < 80 or (bbox[3] - bbox[1]) > 750:
                continue

            # Correção para o modo fallback: expandir x1 e podar y1
            if not doc[p_idx].find_tables(snap_tolerance=5).tables:
                p_words = words # Reutilizar words extraído no topo
                max_x1 = bbox[2]
                new_y1 = bbox[3]
                
                # Agrupar palavras por linha (Y aproximado) para análise de poda
                # IMPORTANTE: Filtrar palavras que pertencem ao mesmo lado (L/R) da tabela
                rows_dict = {}
                table_side = "L" if bbox[2] <= mid + 10 else "R"
                
                for w in p_words:
                    if (bbox[1] - 2 <= w[1] <= bbox[3] + 2):
                        word_side = "L" if w[2] <= mid + 10 else "R"
                        if word_side != table_side:
                            continue # Ignorar texto da outra coluna
                            
                        y_mid = (w[1] + w[3]) / 2
                        found_row = None
                        for r_y in rows_dict:
                            if abs(r_y - y_mid) < 5:
                                found_row = r_y
                                break
                        if found_row is None:
                            rows_dict[y_mid] = []
                            found_row = y_mid
                        rows_dict[found_row].append(w)
                
                # Analisar cada linha para encontrar o fim real da tabela
                sorted_y = sorted(rows_dict.keys())
                col_width = mid - 40 # Largura aproximada de uma coluna
                
                for r_y in sorted_y:
                    r_words = rows_dict[r_y]
                    r_x0 = min(w[0] for w in r_words)
                    r_x1 = max(w[2] for w in r_words)
                    r_width = r_x1 - r_x0
                    
                    # Se uma linha é muito larga ( > 90% da largura da COLUNA) 
                    # E estamos abaixo do meio da tabela original, pode ser o texto da questão
                    if r_width > col_width * 0.90 and r_y > (bbox[1] + bbox[3]) / 2:
                        new_y1 = r_y - 8
                        break
                    
                    # Atualizar x1 baseado nas palavras da tabela (antes do corte)
                    if r_y < new_y1 + 5:
                        for w in r_words:
                            word_side = "L" if w[2] <= mid + 10 else "R"
                            target_side = "L" if bbox[2] <= mid + 10 else "R"
                            if word_side == target_side:
                                max_x1 = max(max_x1, w[2])

                bbox = (bbox[0], bbox[1], max_x1, new_y1)

            # --- EXPANSÃO: Capturar linhas de observação (Obs:, Nota:, Fonte:) logo abaixo ---
            below_words = [w for w in words if (bbox[3] - 2 <= w[1] <= bbox[3] + 30) and (bbox[0] - 10 <= w[0] <= bbox[2] + 10)]
            table_side = "L" if bbox[2] <= mid + 10 else "R"
            if (bbox[2] - bbox[0]) > 350: table_side = "BOTH"
            
            if table_side != "BOTH":
                below_words = [w for w in below_words if ("L" if w[2] <= mid + 10 else "R") == table_side]
            
            below_text = " ".join([w[4] for w in sorted(below_words, key=lambda x: (x[1]//5, x[0]))]).strip()
            if re.search(r'(?i)^(OBS|NOTA|FONTE)[:\s]', below_text):
                new_y1 = max([w[3] for w in below_words]) + 5
                bbox = (bbox[0], bbox[1], bbox[2], new_y1)

            side = "L" if bbox[2] <= mid + 10 else "R"
            if (bbox[2] - bbox[0]) > 350: side = "BOTH"
            table_bboxes.append(bbox)
            tables_meta.append({"p_idx": p_idx, "bbox": bbox, "side": side, "t_idx": t_idx, "type": "TABLE"})
        
        # Capturar IMAGENS puras (não tabelas)
        imgs_list = page.get_images()
        for img_idx, img_info in enumerate(imgs_list):
            rcts = page.get_image_rects(img_info)
            if rcts:
                r = rcts[0]
                if is_ribbon(r): continue
                # Ignorar imagens no cabeçalho ou rodapé (geralmente logos e marcas d'água)
                if r.y1 < 80 or r.y0 > 800: continue
                img_side = "L" if r.x1 <= mid + 10 else ("R" if r.x0 >= mid - 10 else "BOTH")
                tables_meta.append({"p_idx": p_idx, "bbox": (r.x0, r.y0, r.x1, r.y1), "side": img_side, "t_idx": img_idx, "type": "IMAGE", "img_info": img_info})

        valid_words = [w for w in words if (30 <= w[1] <= 820)]
        
        for side in ["L", "R"]:
            omni_stream += f"\n[[PAGE_SEP_{p_idx}_{side}]]\n"
            
            # Objetos deste lado (BOTH só entram no pass L para evitar duplicidade)
            side_objects = [t for t in tables_meta if t["p_idx"] == p_idx and (t["side"] == side or (t["side"] == "BOTH" and side == "L"))]
            
            # Filtrar palavras do lado atual
            side_words = [w for w in valid_words if (w[0] < mid if side=="L" else w[0] >= mid)]
            
            lines = {}
            # Prunagem (ignorar palavras dentro de objetos)
            for w in side_words:
                is_inside = False
                is_anchor = "QUEST" in w[4].upper()
                if not is_anchor and w[4].isdigit():
                    for prev in side_words:
                        # Permitir que palavras do mesmo span (mesmo bbox) sejam âncoras
                        if ("QUEST" in prev[4].upper()) and abs(prev[1]-w[1]) < 10 and 0 <= (w[0]-prev[0]) < 100:
                            is_anchor = True
                            break
                if not is_anchor:
                    # Verificar contra TODOS os objetos da página para prunagem correta
                    all_objs = [t for t in tables_meta if t["p_idx"] == p_idx]
                    for obj in all_objs:
                        b = obj["bbox"]
                        if w[0] >= b[0]-2 and w[2] <= b[2]+2 and w[1] >= b[1]-2 and w[3] <= b[3]+2:
                            is_inside = True
                            break
                if is_inside: continue
                
                y_key = int(w[1] / 5.0) * 5.0
                lines.setdefault(y_key, []).append(w)
            
            # Adicionar objetos (tabelas/imagens) do lado atual
            for obj in side_objects:
                obj_y = obj["bbox"][1]
                obj_tag = f" [[{obj['type']}_P{p_idx}_ID_{obj['t_idx']}]] "
                lines.setdefault(obj_y, []).append((0, obj_y, 0, obj_y, obj_tag))
                
            for y in sorted(lines.keys()):
                line_content = lines[y]
                if len(line_content[0]) == 5:
                    line_text = line_content[0][4]
                else:
                    line_text = " ".join([w[4] for w in sorted(line_content, key=lambda x: x[0])])
                    
                omni_stream += line_text + "\n"
                m = quest_regex.search(line_text)
                if m:
                    num = int(m.group(1))
                    if 1 <= num <= 110:
                        question_anchors.append({"number": num, "p_idx": p_idx, "side": side, "y": y})
                
    return omni_stream, tables_meta, question_anchors

def extract_alternatives_backward(block):
    """Localiza a sequência A-B-C-D(E) de baixo para cima para evitar falsos positivos."""
    # Padrão: início de linha, opcionalmente '(', seguido de letra A-E, seguido de ')', '.', '-' ou espaço
    pattern = re.compile(r'(?m)^[\s\t]*\(?([A-E])[\)\.\-\t\s]')
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
    omni_stream, tables_meta, anchors = build_omni_stream_v22(doc, exam_id)
    
    # Corte de segurança: Ignorar o questionário de percepção ao final da prova
    # Esse texto aparece no final de quase todas as provas do Revalida/Inep
    cutoff_markers = ["questionário de percepção", "pergunta 1", "prezado(a) participante", "[[PAGE_SEP"]
    
    # Encontrar a ÚLTIMA âncora de questão para não cortar texto legítimo antes dela
    last_anchor_pos = 0
    if anchors:
        last_anchor_num = max(a['number'] for a in anchors)
        last_q_pattern = rf'(?mi)^[\s\t]*QUEST.*?\s+{last_anchor_num}'
        m_last = re.search(last_q_pattern, omni_stream)
        if m_last:
            last_anchor_pos = m_last.start()
        else:
            # Fallback se o regex falhar mas temos âncoras
            last_anchor_pos = 0
    
    earliest_cutoff = len(omni_stream)
    for marker in cutoff_markers:
        # Procurar APÓS a última âncora de questão
        pos = omni_stream.lower().find(marker.lower(), last_anchor_pos)
        if pos != -1 and pos < earliest_cutoff:
            # Se for separador de página, garantir que não estamos cortando a própria página da questão
            if marker == "[[PAGE_SEP":
                # Só cortar se for uma página nova (não a mesma da questão)
                # O Backward Scan já lida com o texto da própria página.
                # Mas para garantir, vamos pegar o próximo separador real.
                pass 
            earliest_cutoff = pos
            
    if earliest_cutoff < len(omni_stream):
        print(f"[{exam_id}] Cortando fluxo de texto na posição {earliest_cutoff} (marcador encontrado).")
        omni_stream = omni_stream[:earliest_cutoff]
    
    # Organizar questões (Backward Scan)
    anchors.sort(key=lambda x: x['number'])
    
    def get_q_bounds(q_num):
        curr = next((a for a in anchors if a['number'] == q_num), None)
        if not curr: return None
        nxt = next((a for a in anchors if a['number'] > q_num and a['p_idx'] == curr['p_idx'] and a['side'] == curr['side']), None)
        return {"p_idx": curr['p_idx'], "side": curr['side'], "y_start": curr['y'], "y_end": nxt['y'] if nxt else 815}

    # Regex consistente e rigoroso: Início de linha + QUEST + qualquer letra + espaço(s) + número
    q_pattern = r'(?mi)^[\s\t]*QUEST.*?\s+(\d+)'
    q_matches = list(re.finditer(q_pattern, omni_stream))
    unique_matches = []
    seen = set()
    for m in q_matches:
        num = int(m.group(1))
        if num not in seen and 1 <= num <= 110:
            unique_matches.append(m); seen.add(num)
    unique_matches.sort(key=lambda x: x.start())
    
    results = []
    image_dir = f"./exams/images/{exam_id}"
    os.makedirs(image_dir, exist_ok=True)

    for i, match in enumerate(unique_matches):
        num = int(match.group(1) or match.group(2))
        block = omni_stream[match.end() : (unique_matches[i+1].start() if i+1 < len(unique_matches) else len(omni_stream))]
        
        # --- NOVO: Extração Reversa de Alternativas ---
        f_seq = extract_alternatives_backward(block)
        
        prompt = clean_text(block)
        alts = {}
        if f_seq:
            prompt = clean_text(block[:f_seq[0].start()])
            alts = {f_seq[j].group(1): clean_text(block[f_seq[j].end() : (f_seq[j+1].start() if j+1 < len(f_seq) else len(block))]) for j in range(len(f_seq))}
            
        # Extrair imagens e tabelas baseadas nas tags presentes no bloco de texto da questão
        imgs = []
        # Extrair Tabelas e Imagens do bloco (considerando a página codificada no tag)
        # Formato: [[TABLE_P12_ID_0]] ou [[IMAGE_P13_ID_2]]
        table_tags = re.findall(r'\[\[TABLE_P(\d+)_ID_(\d+)\]\]', block)
        image_tags = re.findall(r'\[\[IMAGE_P(\d+)_ID_(\d+)\]\]', block)
        
        imgs = []
        for p_str, t_id in table_tags:
            tp_idx, t_id = int(p_str), int(t_id)
            t_meta = next((t for t in tables_meta if t["p_idx"] == tp_idx and t["t_idx"] == t_id and t["type"] == "TABLE"), None)
            if t_meta:
                fname = f"{exam_id}_table_q{num}_p{tp_idx}_t{t_id}.png"
                fpath = os.path.join(image_dir, fname)
                page_obj = doc[tp_idx]
                tr = fitz.Rect(t_meta["bbox"])
                padded_tr = fitz.Rect(tr.x0 - 10, tr.y0 - 5, tr.x1 + 10, tr.y1 + 5)
                page_obj.get_pixmap(matrix=fitz.Matrix(3,3), clip=padded_tr).save(fpath)
                imgs.append(f"exams/images/{exam_id}/{fname}")

        for p_str, i_id in image_tags:
            ip_idx, i_id = int(p_str), int(i_id)
            i_meta = next((t for t in tables_meta if t["p_idx"] == ip_idx and t["t_idx"] == i_id and t["type"] == "IMAGE"), None)
            if i_meta:
                fname = f"{exam_id}_q{num}_p{ip_idx}_img{i_id}.png"
                fpath = os.path.join(image_dir, fname)
                page_obj = doc[ip_idx]
                # O bbox da imagem pura está nos metadados
                r = fitz.Rect(i_meta["bbox"])
                padded_r = fitz.Rect(r.x0 - 5, r.y0 - 3, r.x1 + 5, r.y1 + 3)
                if not os.path.exists(fpath):
                    page_obj.get_pixmap(matrix=fitz.Matrix(3,3), clip=padded_r).save(fpath)
                # Filtro de tamanho para evitar capturar pequenos ícones/lixo
                if os.path.exists(fpath) and os.path.getsize(fpath) > 3000:
                    imgs.append(f"exams/images/{exam_id}/{fname}")

        results.append({
            "exam_id": exam_id, "number": num, "text": prompt,
            "alternatives": alts, "correct_answer": answers.get(num) or "Anulada",
            "theme": get_theme(num), "images": list(set(imgs))
        })

    with open(f"./exams/jsons/{exam_id}.json", "w", encoding="utf-8") as f:
        json.dump(results, f, ensure_ascii=False, indent=2)
    doc.close()
    print(f"Sucesso V22.0: {len(results)} questes exportadas com Backward Scan.")
    return results

if __name__ == "__main__":
    import sys
    
    if len(sys.argv) < 2:
        print("Uso: python -m modular_parser <ID_DA_PROVA> (ex: 2024_1)")
        sys.exit(1)
        
    eid = sys.argv[1]
    
    # Tentar encontrar os arquivos automaticamente
    pdf_patterns = [
        f"./exams/pdfs/{eid}_PV_objetiva_regular.pdf",
        f"./exams/pdfs/{eid}_PV_objetiva.pdf",
        f"./exams/pdfs/{eid}.pdf"
    ]
    ans_patterns = [
        f"./exams/answers/{eid}_GB_objetiva_definitivo.pdf",
        f"./exams/answers/{eid}_GB_objetiva.pdf",
        f"./exams/answers/{eid}_GB.pdf"
    ]
    
    pdf_path = next((p for p in pdf_patterns if os.path.exists(p)), None)
    ans_path = next((p for p in ans_patterns if os.path.exists(p)), None)
    
    if not pdf_path:
        print(f"Erro: PDF da prova {eid} não encontrado em ./exams/pdfs/")
        sys.exit(1)
    if not ans_path:
        print(f"Erro: Gabarito da prova {eid} não encontrado em ./exams/answers/")
        sys.exit(1)
        
    print(f"--- Processando Prova: {eid} ---")
    print(f"PDF: {pdf_path}")
    print(f"Gabarito: {ans_path}")
    
    process_exam_modular(pdf_path, ans_path, eid)
