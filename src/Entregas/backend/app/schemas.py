# app/schemas.py (adicione estas classes se não existirem)
from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime
from enum import Enum

class PerfilUsuarioEnum(str, Enum):
    OPERADOR = "Operador"
    COORDENACAO = "Coordenação"
    ADMIN = "Admin"

class Token(BaseModel):
    access_token: str
    token_type: str

class LoginRequest(BaseModel):
    email: EmailStr
    senha: str

class UsuarioBase(BaseModel):
    nome: str
    email: EmailStr
    perfil: PerfilUsuarioEnum

class UsuarioCreate(UsuarioBase):
    senha: str

class Usuario(UsuarioBase):
    id: int
    ativo: bool
    created_at: datetime
    
    class Config:
        from_attributes = True