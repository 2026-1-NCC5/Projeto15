import cv2
import numpy as np
from ultralytics import YOLO
from collections import defaultdict
import time
from flask import Flask, Response, jsonify, request
from flask_cors import CORS
import threading
import os
from datetime import datetime

# ── Inicialização antecipada do modelo (evita delay no primeiro frame) ──────
# O modelo é carregado em background antes de qualquer requisição do frontend.
# Isso garante que, quando o botão LIGAR for clicado, a câmera já esteja pronta.

# ── Firebase Admin SDK ──────────────────────────────────────────────────────
import firebase_admin
from firebase_admin import credentials, firestore

# SUBSTITUA pelo caminho do seu arquivo de credenciais do Firebase
# Baixe em: Firebase Console → Configurações → Contas de serviço → Gerar nova chave privada

_dir = os.path.dirname(os.path.abspath(__file__))
cred = credentials.Certificate(os.path.join(_dir, r"C:\Users\21010656\Documents\GitHub\Projeto15\src\Entregas\camera\Camera+modelo+site\lecontagem-1d7e2-firebase-adminsdk-fbsvc-ab3167baae.json"))
firebase_admin.initialize_app(cred)
db = firestore.client()
# ────────────────────────────────────────────────────────────────────────────

app = Flask(__name__)
CORS(app)

# ── Configurações de Hardware e IA ─────────────────────────────────────────
MODELO_PATH = 'bestv2.pt'
WIDTH, HEIGHT = 640, 480

# ── Estado Global ──────────────────────────────────────────────────────────
# camera_ativa começa True: assim que o script roda, a câmera já está ligada.
# O botão do frontend apenas alterna esse flag — não precisa de passo separado.
camera_ativa = True
telemetria = {
    "itens_txt": "Vazio",
    "peso": 0.0,
    "valor": 0.0,
    "pronto": False,          # True assim que qualquer item for detectado
    "itens_detalhados": [],
}
frame_atual = None
lock = threading.Lock()

TABELA_PRODUTOS = {
    "arroz":    {"peso": 1.0, "valor": 5.50},
    "feijao":   {"peso": 1.0, "valor": 8.50},
    "macarrao": {"peso": 0.5, "valor": 4.20},
    "acucar":   {"peso": 1.0, "valor": 4.00},
    "cafe":     {"peso": 0.5, "valor": 12.00},
    "oleo":     {"peso": 0.9, "valor": 7.50},
}


def carregar_calibracao():
    if os.path.exists("calibracao.txt"):
        try:
            return np.loadtxt("calibracao.txt").astype(np.int32)
        except Exception:
            return None
    return None


PONTOS_RAMPA = carregar_calibracao()


# ── Motor de Visão ─────────────────────────────────────────────────────────
def motor_de_visao():
    global telemetria, frame_atual, camera_ativa
    cap = None
    modelo = None

    while True:
        if camera_ativa:
            if modelo is None:
                modelo = YOLO(MODELO_PATH)
            if cap is None or not cap.isOpened():
                cap = cv2.VideoCapture(0, cv2.CAP_DSHOW)
                cap.set(cv2.CAP_PROP_FRAME_WIDTH, WIDTH)
                cap.set(cv2.CAP_PROP_FRAME_HEIGHT, HEIGHT)
                cap.set(cv2.CAP_PROP_BUFFERSIZE, 1)

            sucesso, frame = cap.read()
            if not sucesso:
                continue

            # ROI Poligonal
            if PONTOS_RAMPA is not None:
                mask = np.zeros((HEIGHT, WIDTH), dtype=np.uint8)
                cv2.fillPoly(mask, [PONTOS_RAMPA], 255)
                frame_ia = cv2.bitwise_and(frame, frame, mask=mask)
                cv2.polylines(frame, [PONTOS_RAMPA], True, (0, 255, 255), 2)
            else:
                frame_ia = frame

            results = modelo(frame_ia, stream=True, conf=0.5, verbose=False)

            deteccoes_frame: list[dict] = []
            img_render = frame.copy()

            for r in results:
                img_render = r.plot(img=img_render)
                for box in r.boxes:
                    nome = r.names[int(box.cls[0])].lower()
                    confianca = float(box.conf[0])
                    deteccoes_frame.append({"nome": nome, "confianca": confianca})

            # Agrupa por produto → média de confiança
            agrupado: dict[str, dict] = defaultdict(lambda: {"quantidade": 0, "soma_conf": 0.0})
            for det in deteccoes_frame:
                agrupado[det["nome"]]["quantidade"] += 1
                agrupado[det["nome"]]["soma_conf"] += det["confianca"]

            with lock:
                if deteccoes_frame:
                    itens_detalhados = []
                    peso_total = 0.0
                    valor_total = 0.0
                    partes_txt = []

                    for nome, dados in agrupado.items():
                        qtd = dados["quantidade"]
                        conf_media = dados["soma_conf"] / qtd
                        prod = TABELA_PRODUTOS.get(nome, {"peso": 0, "valor": 0})
                        peso_item = prod["peso"] * qtd
                        valor_item = prod["valor"] * qtd

                        peso_total += peso_item
                        valor_total += valor_item
                        partes_txt.append(f"{qtd}x {nome.upper()}")

                        itens_detalhados.append({
                            "nome": nome,
                            "quantidade": qtd,
                            "confianca": round(conf_media * 100, 1),
                            "peso": round(peso_item, 2),
                            "valor": round(valor_item, 2),
                        })

                    telemetria.update({
                        # pronto = True imediatamente ao detectar qualquer item
                        "pronto": True,
                        "itens_txt": ", ".join(partes_txt),
                        "peso": round(peso_total, 2),
                        "valor": round(valor_total, 2),
                        "itens_detalhados": itens_detalhados,
                    })
                else:
                    telemetria = {
                        "itens_txt": "Vazio",
                        "peso": 0.0,
                        "valor": 0.0,
                        "pronto": False,
                        "itens_detalhados": [],
                    }

                _, buffer = cv2.imencode('.jpg', img_render, [cv2.IMWRITE_JPEG_QUALITY, 80])
                frame_atual = buffer.tobytes()

        else:
            if cap is not None:
                cap.release()
                cap = None
            frame_atual = None
            time.sleep(0.5)


threading.Thread(target=motor_de_visao, daemon=True).start()


# ── Rotas Flask ────────────────────────────────────────────────────────────
@app.route('/status')
def status():
    """Frontend consulta ao montar para saber se câmera já está ativa."""
    return jsonify({"camera_ativa": camera_ativa})


@app.route('/toggle_camera', methods=['POST'])
def toggle_camera():
    global camera_ativa
    camera_ativa = not camera_ativa
    return jsonify({"camera_ativa": camera_ativa})


@app.route('/video_feed')
def video_feed():
    def streaming():
        while camera_ativa:
            if frame_atual:
                yield (
                    b'--frame\r\n'
                    b'Content-Type: image/jpeg\r\n\r\n'
                    + frame_atual
                    + b'\r\n'
                )
            time.sleep(0.04)
    return Response(streaming(), mimetype='multipart/x-mixed-replace; boundary=frame')


@app.route('/stats')
def stats():
    with lock:
        return jsonify(telemetria)


@app.route('/salvar_lote', methods=['POST'])
def salvar_lote():
    """
    Recebe do front-end: { equipe_id, equipe_nome }
    Combina com a telemetria atual e persiste na coleção 'camera' do Firestore.
    Chaves primárias lógicas: equipe_id  +  id do documento (gerado pelo Firestore).
    """
    payload = request.get_json(force=True)
    equipe_id    = payload.get("equipe_id",    "")
    equipe_nome  = payload.get("equipe_nome",  "")
    usuario_uid  = payload.get("usuario_uid",  "")
    usuario_nome = payload.get("usuario_nome", "")

    with lock:
        snap = dict(telemetria)   # cópia segura

    if snap.get("peso", 0) <= 0:
        return jsonify({"erro": "Nenhum item para salvar"}), 400

    documento = {
        # ── Equipe (campo equipe do documento users) ───
        "equipe": equipe_nome,          # ex: "Equipe 2"
        "equipe_usuario_id": equipe_id, # doc ID em users
        # ── Usuário que realizou o registro ───────────
        "usuario": {
            "uid":  usuario_uid,
            "nome": usuario_nome,
        },
        # ── Dados da leitura ───────────────────────────
        "horario":     datetime.now().isoformat(timespec="seconds"),
        "itens_txt":   snap["itens_txt"],
        "peso_total":  snap["peso"],
        "valor_total": snap["valor"],
        # ── Detalhamento por produto ───────────────────
        "alimentos":   snap["itens_detalhados"],
    }

    # Salva e obtém referência com ID automático
    ref = db.collection("camera").document()
    ref.set(documento)

    return jsonify({"sucesso": True, "doc_id": ref.id})


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, threaded=True)