import json
import os

def apply_themes():
    # Caminhos
    classified_file = 'questoes_classificadas.json'
    jsons_dir = 'exams/jsons'
    
    if not os.path.exists(classified_file):
        print(f"Erro: Arquivo {classified_file} não encontrado.")
        return

    # 1. Carregar as classificações
    print(f"Carregando {classified_file}...")
    with open(classified_file, 'r', encoding='utf-8') as f:
        classified_data = json.load(f)
    
    # 2. Organizar por prova e número para busca rápida
    # Estrutura: { "2011": { 1: "Cirurgia Geral", 2: "Pediatria", ... }, ... }
    themes_map = {}
    for entry in classified_data:
        exam = entry.get('exam')
        number = entry.get('number')
        theme = entry.get('theme')
        
        if exam not in themes_map:
            themes_map[exam] = {}
        themes_map[exam][number] = theme

    # 3. Processar cada arquivo de prova
    files = [f for f in os.listdir(jsons_dir) if f.endswith('.json')]
    
    total_updated = 0
    for filename in files:
        file_path = os.path.join(jsons_dir, filename)
        exam_id = filename.replace('.json', '')
        
        if exam_id not in themes_map:
            print(f"Aviso: Prova {exam_id} não encontrada no mapa de temas.")
            continue
            
        print(f"Processando {filename}...")
        with open(file_path, 'r', encoding='utf-8') as f:
            exam_data = json.load(f)
            
        updated_in_file = 0
        for question in exam_data:
            num = question.get('number')
            if num in themes_map[exam_id]:
                question['theme'] = themes_map[exam_id][num]
                updated_in_file += 1
                total_updated += 1
        
        # Salvar o arquivo atualizado
        with open(file_path, 'w', encoding='utf-8') as f:
            json.dump(exam_data, f, indent=2, ensure_ascii=False)
            
        print(f"  -> {updated_in_file} temas atualizados em {filename}")

    print(f"\nConcluído! Total de {total_updated} questões atualizadas.")

if __name__ == "__main__":
    apply_themes()
