import cv2
import numpy as np
from ultralytics import YOLO 
from collections import Counter
import time
from flask import Flask, Response, jsonify
from flask_cors import CORS
import threading
import os

app = Flask(__name__)
CORS(app)

# Configurações de Hardware e IA
MODELO_PATH = 'bestv2.pt'
WIDTH, HEIGHT = 640, 480 

# Estado Global - Iniciado com valores zerados
camera_ativa = False
telemetria = {"itens_txt": "Vazio", "peso": 0.0, "valor": 0.0, "progresso": 0, "pronto": False}
frame_atual = None
lock = threading.Lock()

TABELA_PRODUTOS = {
    "arroz": {"peso": 1.0, "valor": 5.50},
    "feijao": {"peso": 1.0, "valor": 8.50},
    "macarrao": {"peso": 0.5, "valor": 4.20},
    "acucar": {"peso": 1.0, "valor": 4.00},
    "cafe": {"peso": 0.5, "valor": 12.00},
    "oleo": {"peso": 0.9, "valor": 7.50}
}

def carregar_calibracao():
    if os.path.exists("calibracao.txt"):
        try:
            return np.loadtxt("calibracao.txt").astype(np.int32)
        except: return None
    return None

PONTOS_RAMPA = carregar_calibracao()

def motor_de_visao():
    global telemetria, frame_atual, camera_ativa
    cap = None
    modelo = None
    inicio_timer = None

    while True:
        if camera_ativa:
            if modelo is None: modelo = YOLO(MODELO_PATH)
            if cap is None or not cap.isOpened():
                cap = cv2.VideoCapture(0, cv2.CAP_DSHOW)
                cap.set(cv2.CAP_PROP_FRAME_WIDTH, WIDTH)
                cap.set(cv2.CAP_PROP_FRAME_HEIGHT, HEIGHT)
                cap.set(cv2.CAP_PROP_BUFFERSIZE, 1)

            sucesso, frame = cap.read()
            if not sucesso: continue

            # ROI Poligonal (O Calibrador)
            if PONTOS_RAMPA is not None:
                mask = np.zeros((HEIGHT, WIDTH), dtype=np.uint8)
                cv2.fillPoly(mask, [PONTOS_RAMPA], 255)
                frame_ia = cv2.bitwise_and(frame, frame, mask=mask)
                cv2.polylines(frame, [PONTOS_RAMPA], True, (0, 255, 255), 2)
            else:
                frame_ia = frame

            results = modelo(frame_ia, stream=True, conf=0.5, verbose=False)
            itens_frame = []
            
            img_render = frame.copy()
            for r in results:
                img_render = r.plot(img=img_render)
                for box in r.boxes:
                    itens_frame.append(r.names[int(box.cls[0])].lower())

            contagem = Counter(itens_frame)
            
            # ATUALIZAÇÃO DA TELEMETRIA - BLOCO TEMPO REAL
            with lock:
                if itens_frame:
                    if inicio_timer is None: inicio_timer = time.time()
                    decorrido = time.time() - inicio_timer
                    
                    # Cálculo de valores
                    p = sum(TABELA_PRODUTOS.get(i, {"peso": 0})["peso"] for i in itens_frame)
                    v = sum(TABELA_PRODUTOS.get(i, {"valor": 0})["valor"] for i in itens_frame)
                    
                    telemetria.update({
                        "progresso": min(int((decorrido / 5.0) * 100), 100),
                        "pronto": decorrido >= 5,
                        "itens_txt": ", ".join([f"{q}x {i.upper()}" for i, q in contagem.items()]),
                        "peso": round(p, 2),
                        "valor": round(v, 2)
                    })
                else:
                    inicio_timer = None
                    telemetria = {"itens_txt": "Vazio", "peso": 0.0, "valor": 0.0, "progresso": 0, "pronto": False}
                
                _, buffer = cv2.imencode('.jpg', img_render, [cv2.IMWRITE_JPEG_QUALITY, 80])
                frame_atual = buffer.tobytes()
        else:
            if cap is not None:
                cap.release()
                cap = None
            frame_atual = None
            time.sleep(0.5)

threading.Thread(target=motor_de_visao, daemon=True).start()

@app.route('/toggle_camera', methods=['POST'])
def toggle_camera():
    global camera_ativa
    camera_ativa = not camera_ativa
    return jsonify({"status": "ativa" if camera_ativa else "desativada"})

@app.route('/video_feed')
def video_feed():
    def streaming():
        while camera_ativa:
            if frame_atual:
                yield (b'--frame\r\n' b'Content-Type: image/jpeg\r\n\r\n' + frame_atual + b'\r\n')
            time.sleep(0.04)
    return Response(streaming(), mimetype='multipart/x-mixed-replace; boundary=frame')

@app.route('/stats')
def stats():
    with lock:
        # Retorna sempre o estado atual para o Front-end atualizar os blocos
        return jsonify(telemetria)

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, threaded=True)