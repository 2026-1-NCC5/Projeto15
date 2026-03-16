 # Ponto de entrada da API

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .routers import equipes, contagens, usuarios, relatorios
from .database import engine, Base

# Criar tabelas no banco
Base.metadata.create_all(bind=engine)

app = FastAPI(title="Lideranças Empáticas API", version="1.0.0")

# Configuração CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Em produção, especificar origens
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Rotas
app.include_router(usuarios.router, prefix="/api/usuarios", tags=["Usuários"])
#app.include_router(equipes.router, prefix="/api/equipes", tags=["Equipes"])
#app.include_router(contagens.router, prefix="/api/contagens", tags=["Contagens"])
#app.include_router(relatorios.router, prefix="/api/relatorios", tags=["Relatórios"])


@app.get("/")
async def root():
    return {"message": "API Lideranças Empáticas", "status": "online"}

@app.get("/health")
async def health_check():
    return {"status": "healthy"}