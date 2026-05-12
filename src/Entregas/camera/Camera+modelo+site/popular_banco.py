"""
popular_banco.py
Insere N registros aleatórios na coleção 'contagem' do Firestore.
Uso: py popular_banco.py
"""

import firebase_admin
from firebase_admin import credentials, firestore
import random
import os
from datetime import datetime, timedelta

# ── Credenciais ──────────────────────────────────────────────────────────────
_BASE_DIR = os.path.dirname(os.path.abspath(__file__))
_KEY_FILE  = os.path.join(_BASE_DIR, "serviceAccountKey.json")
cred = credentials.Certificate(_KEY_FILE)
firebase_admin.initialize_app(cred)
db = firestore.client()
# ────────────────────────────────────────────────────────────────────────────

# ── Dados fictícios ──────────────────────────────────────────────────────────
ALIMENTOS = [
    {"nome": "arroz",    "peso": 1.0, "valor": 5.50},
    {"nome": "feijao",   "peso": 1.0, "valor": 8.50},
    {"nome": "macarrao", "peso": 0.5, "valor": 4.20},
    {"nome": "acucar",   "peso": 1.0, "valor": 4.00},
    {"nome": "cafe",     "peso": 0.5, "valor": 12.00},
    {"nome": "oleo",     "peso": 0.9, "valor": 7.50},
]

EQUIPES = [
    {"nome": "Equipe 1", "id": "equipe_1"},
    {"nome": "Equipe 2", "id": "equipe_2"},
    {"nome": "Equipe 3", "id": "equipe_3"},
]

USUARIOS = [
    {"nome": "Gabriel",  "email": "gabriel@empresa.com",  "uid": "uid_gabriel"},
    {"nome": "Maciel",   "email": "maciel@empresa.com",   "uid": "uid_maciel"},
    {"nome": "Thiago",   "email": "thiago@empresa.com",   "uid": "uid_thiago"},
    {"nome": "Rafaela",  "email": "rafaela@empresa.com",  "uid": "uid_rafaela"},
]

# ── Configurações ─────────────────────────────────────────────────────────────
TOTAL_REGISTROS = 50        # quantidade de documentos a inserir
DIAS_PASSADOS   = 30        # gera datas dos últimos N dias
BATCH_SIZE      = 20        # quantos por vez (limite do Firestore é 500)

# ─────────────────────────────────────────────────────────────────────────────

def gerar_registro():
    """Gera um documento aleatório no formato da coleção 'contagem'."""
    equipe  = random.choice(EQUIPES)
    usuario = random.choice(USUARIOS)

    # Entre 1 e 4 itens por registro
    qtd_tipos = random.randint(1, 4)
    alimentos_escolhidos = random.sample(ALIMENTOS, min(qtd_tipos, len(ALIMENTOS)))

    alimentos  = []
    peso_total = 0.0
    valor_total = 0.0
    itens_txt  = []

    for alim in alimentos_escolhidos:
        qtd       = random.randint(1, 5)
        confianca = round(random.uniform(50.0, 99.0), 1)
        peso_item  = alim["peso"]  * qtd
        valor_item = alim["valor"] * qtd

        peso_total  += peso_item
        valor_total += valor_item
        itens_txt.append(f"{qtd}x {alim['nome'].upper()}")

        alimentos.append({
            "nome":       alim["nome"],
            "quantidade": qtd,
            "confianca":  confianca,
            "peso":       round(peso_item, 2),
            "valor":      round(valor_item, 2),
        })

    # Data aleatória nos últimos N dias
    dias_atras  = random.randint(0, DIAS_PASSADOS)
    horas       = random.randint(6, 22)
    minutos     = random.randint(0, 59)
    data_reg    = datetime.now() - timedelta(days=dias_atras, hours=0) 
    data_reg    = data_reg.replace(hour=horas, minute=minutos, second=random.randint(0,59))

    return {
        "usuarioNome":  usuario["nome"],
        "usuarioUid":   usuario["uid"],
        "usuarioEmail": usuario["email"],
        "equipe":       equipe["nome"],
        "equipeId":     equipe["id"],
        "dataRegistro": data_reg.strftime("%d/%m/%Y %H:%M:%S"),
        "itensTxt":     ", ".join(itens_txt),
        "pesoTotal":    round(peso_total, 2),
        "valorTotal":   round(valor_total, 2),
        "alimentos":    alimentos,
    }


def popular():
    print(f"Inserindo {TOTAL_REGISTROS} registros na coleção 'contagem'...")
    inseridos = 0

    while inseridos < TOTAL_REGISTROS:
        batch = db.batch()
        lote  = min(BATCH_SIZE, TOTAL_REGISTROS - inseridos)

        for _ in range(lote):
            ref = db.collection("contagem").document()
            batch.set(ref, gerar_registro())

        batch.commit()
        inseridos += lote
        print(f"  ✓ {inseridos}/{TOTAL_REGISTROS} inseridos")

    print(f"\nConcluído! {TOTAL_REGISTROS} documentos adicionados à coleção 'contagem'.")


if __name__ == "__main__":
    popular()
