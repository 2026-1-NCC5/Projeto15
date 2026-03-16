# app/auth.py (versão simplificada)
from datetime import datetime, timedelta
from typing import Optional
from jose import JWTError, jwt
from passlib.context import CryptContext
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
import os
from dotenv import load_dotenv
from . import models, schemas
from .database import get_db

load_dotenv()

# ==================== CONFIGURAÇÕES ====================
SECRET_KEY = os.getenv("SECRET_KEY", "sua-chave-secreta-super-segura-aqui")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", 30))

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/usuarios/token")

# ==================== FUNÇÕES ====================

def verificar_senha(senha_plana: str, senha_hash: str) -> bool:
    """Verifica se a senha plana corresponde ao hash"""
    return pwd_context.verify(senha_plana, senha_hash)

def gerar_hash_senha(senha: str) -> str:
    """Gera hash bcrypt de uma senha"""
    return pwd_context.hash(senha)

def autenticar_usuario(db: Session, email: str, senha: str):
    """Autentica um usuário pelo email e senha"""
    usuario = db.query(models.Usuario).filter(
        models.Usuario.email == email,
        models.Usuario.ativo == True
    ).first()
    
    if not usuario:
        return None
    
    # Converter Column para string
    senha_hash_str = str(usuario.senha_hash)
    
    if not verificar_senha(senha, senha_hash_str):
        return None
    
    return usuario

def criar_token_acesso(data: dict, expires_delta: Optional[timedelta] = None):
    """Cria um token JWT com tempo de expiração"""
    to_encode = data.copy()
    
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    
    return encoded_jwt

async def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
) -> models.Usuario:
    """
    Obtém o usuário atual a partir do token JWT
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Não foi possível validar as credenciais",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    try:
        # Decodificar o token
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        
        # CORREÇÃO: Extrair o sub do payload com verificação de tipo
        sub_value = payload.get("sub")
        
        # Verificar se é None ou não é string
        if sub_value is None:
            raise credentials_exception
        
        # Converter para string (caso seja int ou outro tipo)
        usuario_id_str = str(sub_value)
        
        # Converter para int (já que o ID é int no banco)
        try:
            usuario_id = int(usuario_id_str)
        except ValueError:
            raise credentials_exception
        
        # Buscar usuário no banco
        usuario = db.query(models.Usuario).filter(
            models.Usuario.id == usuario_id,
            models.Usuario.ativo == True
        ).first()
        
        if usuario is None:
            raise credentials_exception
        
        return usuario
        
    except JWTError:
        raise credentials_exception
    
async def get_current_active_user(current_user = Depends(get_current_user)):
    """Verifica se o usuário atual está ativo"""
    # Converter Column para bool
    if not bool(current_user.ativo):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Usuário inativo"
        )
    return current_user

def verificar_perfil(perfis_permitidos: list):
    """Fábrica de dependências que verifica se o usuário tem um dos perfis permitidos"""
    async def perfil_checker(current_user = Depends(get_current_active_user)):
        if current_user.perfil not in perfis_permitidos:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Acesso negado. Perfil necessário: {[p.value for p in perfis_permitidos]}"
            )
        return current_user
    return perfil_checker

# Dependências específicas
verificar_admin = verificar_perfil([schemas.PerfilUsuarioEnum.ADMIN])
verificar_coordenacao = verificar_perfil([schemas.PerfilUsuarioEnum.ADMIN, schemas.PerfilUsuarioEnum.COORDENACAO])
verificar_operador = verificar_perfil([schemas.PerfilUsuarioEnum.ADMIN, schemas.PerfilUsuarioEnum.COORDENACAO, schemas.PerfilUsuarioEnum.OPERADOR])