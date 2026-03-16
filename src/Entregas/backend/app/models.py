# Modelos SQLAlchemy
from sqlalchemy import Column, Integer, String, DateTime, Float, ForeignKey, Enum, Boolean
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
from datetime import datetime
import enum

Base = declarative_base()

class CategoriaAlimento(str, enum.Enum):
    ARROZ = "Arroz"
    FEIJAO = "Feijão"
    OUTROS = "Outros"

class PerfilUsuario(str, enum.Enum):
    OPERADOR = "Operador"
    COORDENACAO = "Coordenação"
    ADMIN = "Admin"

class Usuario(Base):
    __tablename__ = "usuarios"
    
    id = Column(Integer, primary_key=True, index=True)
    nome = Column(String, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    senha_hash = Column(String, nullable=False)
    perfil = Column(Enum(PerfilUsuario), default=PerfilUsuario.OPERADOR)
    ativo = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

class Equipe(Base):
    __tablename__ = "equipes"
    
    id = Column(Integer, primary_key=True, index=True)
    nome = Column(String, unique=True, nullable=False)
    descricao = Column(String)
    ativa = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relacionamentos
    contagens = relationship("Contagem", back_populates="equipe")

class Contagem(Base):
    __tablename__ = "contagens"
    
    id = Column(Integer, primary_key=True, index=True)
    equipe_id = Column(Integer, ForeignKey("equipes.id"), nullable=False)
    categoria = Column(Enum(CategoriaAlimento), nullable=False)
    confianca = Column(Float, nullable=False)  # Score do modelo IA
    timestamp = Column(DateTime, default=datetime.utcnow, nullable=False)
    evidencia_url = Column(String)  # URL da imagem no bucket
    sessao_id = Column(String, index=True)  # Para agrupar contagens por sessão
    
    # Relacionamentos
    equipe = relationship("Equipe", back_populates="contagens")