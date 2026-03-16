# Upload de evidências

from datetime import datetime, timedelta
from typing import Optional, List
from jose import JWTError, jwt
from passlib.context import CryptContext
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
import os
from dotenv import load_dotenv

from . import models, schemas
from .database import get_db

load_dotenv()

# ==================== CONFIGURAÇÕES ====================
SECRET_KEY = os.getenv("SECRET_KEY", "sua-chave-secreta-super-segura-aqui")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "30"))

# Contexto para hashing de senhas (bcrypt é o recomendado)
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Esquema OAuth2 para o token
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/usuarios/token")

# ==================== FUNÇÕES DE UTILIDADE ====================

def verificar_senha(senha_plana: str, senha_hash: str) -> bool:
    """Verifica se a senha plana corresponde ao hash"""
    return pwd_context.verify(senha_plana, senha_hash)

def gerar_hash_senha(senha: str) -> str:
    """Gera hash bcrypt de uma senha"""
    return pwd_context.hash(senha)

def autenticar_usuario(db: Session, email: str, senha: str):
    """
    Autentica um usuário pelo email e senha
    Retorna o usuário se autenticado, None caso contrário
    """
    usuario = db.query(models.Usuario).filter(
        models.Usuario.email == email,
        models.Usuario.ativo == True
    ).first()
    
    if not usuario:
        return None
    
    if not verificar_senha(senha, usuario.senha_hash):
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

# ==================== DEPENDÊNCIAS PARA PROTEÇÃO DE ROTAS ====================

async def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
):
    """
    Obtém o usuário atual a partir do token JWT
    Esta é uma dependência que pode ser usada em rotas protegidas
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Não foi possível validar as credenciais",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    try:
        # Decodificar o token
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        usuario_id: int = payload.get("sub")
        if usuario_id is None:
            raise credentials_exception
        
        # Verificar se o token tem as informações necessárias
        token_data = schemas.TokenData(id=usuario_id, email=payload.get("email"))
        
    except JWTError:
        raise credentials_exception
    
    # Buscar usuário no banco
    usuario = db.query(models.Usuario).filter(
        models.Usuario.id == token_data.id,
        models.Usuario.ativo == True
    ).first()
    
    if usuario is None:
        raise credentials_exception
    
    return usuario

async def get_current_active_user(
    current_user: models.Usuario = Depends(get_current_user)
):
    """Verifica se o usuário atual está ativo"""
    if not current_user.ativo:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Usuário inativo"
        )
    return current_user

# ==================== VERIFICADORES DE PERFIL ====================

def verificar_perfil(perfis_permitidos: List[schemas.PerfilUsuarioEnum]):
    """
    Fábrica de dependências que verifica se o usuário tem um dos perfis permitidos
    Uso: @router.get("/rota", dependencies=[Depends(verificar_perfil([PerfilUsuarioEnum.ADMIN]))])
    """
    async def perfil_checker(
        current_user: models.Usuario = Depends(get_current_active_user)
    ):
        if current_user.perfil not in perfis_permitidos:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Acesso negado. Perfil necessário: {[p.value for p in perfis_permitidos]}"
            )
        return current_user
    return perfil_checker

# Dependências específicas para cada perfil
verificar_admin = verificar_perfil([schemas.PerfilUsuarioEnum.ADMIN])
verificar_coordenacao = verificar_perfil([
    schemas.PerfilUsuarioEnum.ADMIN, 
    schemas.PerfilUsuarioEnum.COORDENACAO
])
verificar_operador = verificar_perfil([
    schemas.PerfilUsuarioEnum.ADMIN,
    schemas.PerfilUsuarioEnum.COORDENACAO,
    schemas.PerfilUsuarioEnum.OPERADOR
])

# ==================== FUNÇÕES PARA LOGS DE SEGURANÇA ====================

async def registrar_log_seguranca(
    db: Session,
    acao: str,
    usuario_id: Optional[int] = None,
    detalhes: Optional[str] = None,
    ip_origem: Optional[str] = None,
    nivel: str = "INFO"
):
    """Registra eventos de segurança no banco de dados"""
    log = models.LogSistema(
        timestamp=datetime.utcnow(),
        nivel=nivel,
        modulo="auth",
        acao=acao,
        usuario_id=usuario_id,
        detalhes=detalhes,
        ip_origem=ip_origem
    )
    db.add(log)
    db.commit()