import cv2
from ultralytics import YOLO 
from collections import Counter
import time

modelo = YOLO('bestv2.pt')

# Tabela oficial para a Entrega 2 (6 Itens)
TABELA_PRODUTOS = {
    "arroz": {"peso": 1.0, "valor": 5.50},
    "feijao": {"peso": 1.0, "valor": 8.50},
    "macarrao": {"peso": 0.5, "valor": 4.20},
    "acucar": {"peso": 1.0, "valor": 4.00},
    "cafe": {"peso": 0.5, "valor": 12.00},
    "oleo": {"peso": 0.9, "valor": 7.50}
}

camera = cv2.VideoCapture(0)
inicio_contagem = None
historico_total = Counter() 
peso_acumulado = 0.0
valor_acumulado = 0.0

while True:
    sucesso, frame = camera.read()
    if not sucesso: break
    
    resultados = modelo(frame, stream=True)
    itens_frame = []
    
    for resultado in resultados:
        frame_anotado = resultado.plot()
        classes_ids = resultado.boxes.cls.tolist()
        for cls_id in classes_ids:
            itens_frame.append(resultado.names[int(cls_id)].lower())

    contagem_atual = Counter(itens_frame)

    # --- LÓGICA DA BARRA ---
    largura_barra = 0
    cor_barra = (0, 255, 255)
    pronto_para_salvar = False

    if itens_frame:
        if inicio_contagem is None:
            inicio_contagem = time.time()
        tempo_passado = time.time() - inicio_contagem
        largura_barra = int(min(tempo_passado / 5.0, 1.0) * 200)
        if tempo_passado >= 5:
            cor_barra = (0, 255, 0)
            pronto_para_salvar = True
    else:
        inicio_contagem = None

    # --- INTERFACE VISUAL (PAINEL LATERAL) ---
    # Fundo lateral maior para caber todos os blocos
    overlay = frame_anotado.copy()
    cv2.rectangle(overlay, (10, 10), (300, 460), (0, 0, 0), -1)
    cv2.addWeighted(overlay, 0.7, frame_anotado, 0.3, 0, frame_anotado)

    # 1. Barra de Progresso
    cv2.rectangle(frame_anotado, (50, 30), (250, 40), (255, 255, 255), 1)
    if largura_barra > 0:
        cv2.rectangle(frame_anotado, (50, 30), (50 + largura_barra, 40), cor_barra, -1)

    # 2. BLOCO: NA RAMPA AGORA
    y_pos = 75
    cv2.putText(frame_anotado, "LIDO PELA CAMERA:", (30, y_pos), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 255, 255), 1)
    y_pos += 25
    for item, qtd in contagem_atual.items():
        cv2.putText(frame_anotado, f"- {item.capitalize()}: {qtd}un", (40, y_pos), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 255, 255), 1)
        y_pos += 20

    # 3. BLOCO: HISTÓRICO DE QUANTIDADE
    y_pos += 20
    cv2.line(frame_anotado, (30, y_pos), (270, y_pos), (100, 100, 100), 1)
    y_pos += 25
    cv2.putText(frame_anotado, "QUANTIDADE TOTAL SALVA:", (30, y_pos), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 165, 0), 1) # Laranja
    y_pos += 25
    for item, qtd in historico_total.items():
        cv2.putText(frame_anotado, f"{item.capitalize()}: {qtd} un", (40, y_pos), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (200, 200, 200), 1)
        y_pos += 20

    # 4. BLOCO: CUSTO E PESO (O que você pediu agora)
    y_pos += 20
    cv2.line(frame_anotado, (30, y_pos), (270, y_pos), (100, 100, 100), 1)
    y_pos += 30
    # Texto em destaque para Peso e Valor
    cv2.putText(frame_anotado, f"PESO TOTAL: {peso_acumulado:.2f} kg", (30, y_pos), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 255, 0), 2)
    y_pos += 30
    cv2.putText(frame_anotado, f"VALOR TOTAL: R$ {valor_acumulado:.2f}", (30, y_pos), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 255, 0), 2)

    # Rodapé de instrução
    if pronto_para_salvar:
        cv2.putText(frame_anotado, "PRONTO! APERTE [S]", (75, 450), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 255, 0), 1)

    cv2.imshow("Sistema de Triagem Integrado - Paschoal", frame_anotado)
    
    key = cv2.waitKey(1) & 0xFF
    if key == ord('s') and pronto_para_salvar:
        # Atualiza quantidades, peso e valor
        for item, qtd in contagem_atual.items():
            info = TABELA_PRODUTOS.get(item, {"peso": 0, "valor": 0})
            historico_total[item] += qtd
            peso_acumulado += info["peso"] * qtd
            valor_acumulado += info["valor"] * qtd
        
        print("Dados confirmados e salvos!")
        inicio_contagem = None # Reseta o timer para o próximo item
        
    elif key == ord('q'):
        break

camera.release()
cv2.destroyAllWindows()