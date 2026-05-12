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

# ── Caminho do arquivo de credenciais ─────────────────────────────────────
# Coloque o arquivo .json na mesma pasta do camera.py (mais simples no Windows)
# e use os.path para montar o caminho sem precisar de barras invertidas.
_BASE_DIR = os.path.dirname(os.path.abspath(__file__))
_KEY_FILE  = os.path.join(_BASE_DIR, "serviceAccountKey.json")

# Se quiser usar caminho absoluto no Windows, use r"" (raw string):
# _KEY_FILE = r"C:\Users\SeuUsuario\...\serviceAccountKey.json"

cred = credentials.Certificate(_KEY_FILE)
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
    try:
        payload       = request.get_json(force=True) or {}
        equipe_nome   = payload.get("equipe_nome",   "")
        equipe_id     = payload.get("equipe_id",     "")
        usuario_uid   = payload.get("usuario_uid",   "")
        usuario_nome  = payload.get("usuario_nome",  "")
        usuario_email = payload.get("usuario_email", "")

        with lock:
            snap = dict(telemetria)

        print(f"[SALVAR] payload recebido: equipe={equipe_nome}, usuario={usuario_nome}")
        print(f"[SALVAR] telemetria: peso={snap.get('peso')}, itens={snap.get('itens_txt')}")

        if not snap.get("itens_detalhados") and snap.get("peso", 0) <= 0:
            print("[SALVAR] ERRO: nenhum item detectado na telemetria")
            return jsonify({"erro": "Nenhum item detectado"}), 400

        agora = datetime.now()
        itens = snap.get("itens_detalhados", [])
        
        documento = {
            "usuarioNome":  usuario_nome,
            "usuarioUid":   usuario_uid,
            "usuarioEmail": usuario_email,
            "equipe":       equipe_nome,
            "equipeId":     equipe_id,
            "dataRegistro": agora.strftime("%d/%m/%Y %H:%M:%S"),
            "itensTxt":     snap.get("itens_txt", ""),
            "pesoTotal":    float(snap.get("peso", 0)),
            "valorTotal":   float(snap.get("valor", 0)),
            "alimentos":    itens,
        }

        # Firestore cria a colecao automaticamente se nao existir
        ref = db.collection("contagem").document()
        ref.set(documento)

        print(f"[SALVAR] OK — doc_id={ref.id}")
        return jsonify({"sucesso": True, "doc_id": ref.id})

    except Exception as e:
        print(f"[SALVAR] EXCECAO: {e}")
        import traceback; traceback.print_exc()
        return jsonify({"erro": str(e)}), 500


@app.route('/teste_firebase', methods=['GET'])
def teste_firebase():
    """Chame este endpoint no navegador para testar se o Firestore esta funcionando.
    URL: http://localhost:5000/teste_firebase
    """
    try:
        ref = db.collection("contagem").document()
        ref.set({
            "teste": True,
            "mensagem": "Conexao Firebase OK",
            "horario": datetime.now().strftime("%d/%m/%Y %H:%M:%S"),
        })
        print(f"[TESTE] Firebase OK — doc_id={ref.id}")
        return jsonify({"ok": True, "doc_id": ref.id, "mensagem": "Documento criado com sucesso!"})
    except Exception as e:
        print(f"[TESTE] Firebase FALHOU: {e}")
        import traceback; traceback.print_exc()
        return jsonify({"ok": False, "erro": str(e)}), 500


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, threaded=True)