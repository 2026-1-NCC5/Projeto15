import cv2
import numpy as np
from ultralytics import YOLO 
from collections import Counter
import time

# --- CONFIGURAÇÕES ---
MODELO_PATH = 'bestv2.pt'
TABELA_PRODUTOS = {
    "arroz": {"peso": 1.0, "valor": 5.50},
    "feijao": {"peso": 1.0, "valor": 8.50},
    "macarrao": {"peso": 0.5, "valor": 4.20},
    "acucar": {"peso": 1.0, "valor": 4.00},
    "cafe": {"peso": 0.5, "valor": 12.00},
    "oleo": {"peso": 0.9, "valor": 7.50}
}

# Paleta de Cores Profissional
C_BG = (20, 20, 20)      # Fundo Escuro
C_ACCENT = (0, 165, 255) # Laranja Logística
C_TEXT = (240, 240, 240) # Branco Suave
C_SUCCESS = (0, 210, 0)  # Verde Confirmado

def desenhar_footer(frame, contagem_atual, historico, peso, valor, progresso, pronto):
    h, w, _ = frame.shape
    h_footer = 120  # Altura da barra inferior
    
    # 1. Base do Footer (Retângulo no Rodapé)
    # Criamos um frame preto para o rodapé e colamos no original
    footer_bg = np.zeros((h_footer, w, 3), dtype=np.uint8)
    cv2.rectangle(footer_bg, (0, 0), (w, h_footer), C_BG, -1)
    
    # 2. Barra de Progresso (Linha fina no topo do footer)
    if progresso > 0:
        w_prog = int(w * (progresso / 100))
        cor_b = C_SUCCESS if pronto else C_ACCENT
        cv2.rectangle(footer_bg, (0, 0), (w_prog, 4), cor_b, -1)

    # 3. Coluna 1: Status da Rampa (Esquerda)
    cv2.putText(footer_bg, "RAMPA ATUAL", (20, 30), 0, 0.4, C_ACCENT, 1, cv2.LINE_AA)
    y_r = 55
    if not contagem_atual:
        cv2.putText(footer_bg, "Vazio", (20, y_r), 0, 0.5, (100, 100, 100), 1, cv2.LINE_AA)
    else:
        txt_rampa = ", ".join([f"{q}x {i.upper()}" for i, q in contagem_atual.items()])
        cv2.putText(footer_bg, txt_rampa[:50], (20, y_r), 0, 0.5, C_TEXT, 1, cv2.LINE_AA)

    # 4. Coluna 2: Acumulado (Meio)
    cv2.putText(footer_bg, "INVENTARIO TOTAL", (w // 3, 30), 0, 0.4, C_ACCENT, 1, cv2.LINE_AA)
    txt_hist = " | ".join([f"{i[0:3].upper()}: {q}" for i, q in historico.items()])
    cv2.putText(footer_bg, txt_hist if txt_hist else "---", (w // 3, 55), 0, 0.45, (180, 180, 180), 1, cv2.LINE_AA)

    # 5. Coluna 3: Métricas Financeiras (Direita)
    cv2.putText(footer_bg, "METRICAS DE CARGA", (2 * w // 3, 30), 0, 0.4, C_ACCENT, 1, cv2.LINE_AA)
    cv2.putText(footer_bg, f"PESO: {peso:.2f} KG", (2 * w // 3, 60), 0, 0.6, C_TEXT, 2, cv2.LINE_AA)
    cv2.putText(footer_bg, f"VALOR: R$ {valor:.2f}", (2 * w // 3, 95), 0, 0.6, C_SUCCESS, 2, cv2.LINE_AA)

    # 6. Botão de Ação (Aparece sobre o vídeo quando pronto)
    if pronto:
        cv2.rectangle(frame, (w - 180, h - h_footer - 60), (w - 20, h - h_footer - 20), C_SUCCESS, -1)
        cv2.putText(frame, "SALVAR [S]", (w - 155, h - h_footer - 33), 0, 0.6, (0, 0, 0), 2, cv2.LINE_AA)

    # Une o vídeo com o rodapé
    return np.vstack((frame, footer_bg))

# --- LOOP PRINCIPAL ---
modelo = YOLO(MODELO_PATH)
camera = cv2.VideoCapture(0)
historico_total = Counter() 
inicio_timer = None
peso_total, valor_total = 0.0, 0.0

while True:
    sucesso, frame = camera.read()
    if not sucesso: break
    
    # Processa YOLO
    resultados = modelo(frame, stream=True)
    itens_atuais = []
    for r in resultados:
        frame = r.plot()
        for cls_id in r.boxes.cls.tolist():
            itens_atuais.append(r.names[int(cls_id)].lower())
    
    contagem_frame = Counter(itens_atuais)

    # Lógica do Temporizador
    percentual, pronto = 0, False
    if itens_atuais:
        if inicio_timer is None: inicio_timer = time.time()
        decorrido = time.time() - inicio_timer
        percentual = min(int((decorrido / 5.0) * 100), 100)
        pronto = decorrido >= 5
    else:
        inicio_timer = None

    # Monta a tela final com o Footer Horizontal
    tela_final = desenhar_footer(frame, contagem_frame, historico_total, peso_total, valor_total, percentual, pronto)

    cv2.imshow("Triagem Logistica FECAP - Professional", tela_final)
    
    key = cv2.waitKey(1) & 0xFF
    if key == ord('s') and pronto:
        for item, qtd in contagem_frame.items():
            info = TABELA_PRODUTOS.get(item, {"peso": 0, "valor": 0})
            historico_total[item] += qtd
            peso_total += info["peso"] * qtd
            valor_total += info["valor"] * qtd
        inicio_timer = None
    elif key == ord('q'):
        break

camera.release()
cv2.destroyAllWindows()
