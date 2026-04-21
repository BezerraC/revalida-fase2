import json
import os
import sys

def sync_year(year):
    gabaritos_path = "gabaritos.json"
    exam_json_path = os.path.join("exams", "jsons", f"{year}.json")

    if not os.path.exists(gabaritos_path):
        print(f"Erro: {gabaritos_path} não encontrado.")
        return

    if not os.path.exists(exam_json_path):
        print(f"Erro: Arquivo da prova {exam_json_path} não encontrado.")
        return

    # Carregar gabaritos
    with open(gabaritos_path, "r", encoding="utf-8") as f:
        gabaritos_data = json.load(f)

    if year not in gabaritos_data:
        print(f"Erro: Ano {year} não encontrado no gabaritos.json.")
        return

    year_gabarito = gabaritos_data[year]

    # Carregar JSON da prova
    with open(exam_json_path, "r", encoding="utf-8") as f:
        exam_questions = json.load(f)

    # Atualizar as respostas
    updated_count = 0
    total_found = 0
    for q in exam_questions:
        num_str = str(q["number"])
        if num_str in year_gabarito:
            total_found += 1
            new_ans = year_gabarito[num_str]
            if q["correct_answer"] != new_ans:
                q["correct_answer"] = new_ans
                updated_count += 1

    # Salvar de volta
    with open(exam_json_path, "w", encoding="utf-8") as f:
        json.dump(exam_questions, f, indent=2, ensure_ascii=False)

    print(f"Sincronização Concluída para {year}:")
    print(f"  - Questões processadas: {len(exam_questions)}")
    print(f"  - Respostas encontradas no gabarito: {total_found}")
    print(f"  - Respostas alteradas: {updated_count}")
    print(f"Arquivo salvo em: {exam_json_path}")

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Uso: python sync_gabaritos.py <ano> ou python sync_gabaritos.py all")
    elif sys.argv[1] == "all":
        with open("gabaritos.json", "r", encoding="utf-8") as f:
            data = json.load(f)
        for year in data.keys():
            sync_year(year)
    else:
        sync_year(sys.argv[1])
