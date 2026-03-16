from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import os
from pathlib import Path
from dotenv import load_dotenv

# Carrega variáveis de ambiente do arquivo .env
env_path = Path(__file__).parent.parent / '.env'
load_dotenv(dotenv_path=env_path)

# URL do banco de dados (configurável via .env)
DATABASE_URL = os.getenv(
    "DATABASE_URL", 
    "postgresql://le_admin:le_password@localhost:5432/le_contagem"
)

# Cria o engine do SQLAlchemy
engine = create_engine(DATABASE_URL)

# Cria a sessão local
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Base para os modelos declarativos
Base = declarative_base()

# Dependência para obter a sessão do banco
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# FUNÇÃO DE TESTE ADICIONADA AQUI!
def testar_conexao():
    """Função para testar se a conexão com o banco está funcionando"""
    print(f"📁 Arquivo .env usado: {env_path}")
    print(f"📄 .env existe? {env_path.exists()}")
    print(f"🔗 DATABASE_URL: {DATABASE_URL}")
    
    try:
        # Tenta conectar
        with engine.connect() as conn:
            print("✅ Conexão com banco de dados bem-sucedida!")
            return True
    except Exception as e:
        print(f"❌ Erro ao conectar: {e}")
        return False

# Se executar este arquivo diretamente, testa a conexão
if __name__ == "__main__":
    testar_conexao()