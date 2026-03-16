# app/routers/usuarios.py
from fastapi import APIRouter, Depends, HTTPException, status, Request
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from datetime import timedelta
from typing import List

from .. import models, schemas, auth
from ..database import get_db

router = APIRouter()

@router.post("/token", response_model=schemas.Token)
async def login_for_access_token(
    request: Request,
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db)
):
    """Endpoint para obter token JWT (padrão OAuth2)"""
    # Autenticar usuário
    usuario = auth.autenticar_usuario(db, form_data.username, form_data.password)
    
    if not usuario:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email ou senha incorretos",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Criar token de acesso
    access_token_expires = timedelta(minutes=auth.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = auth.criar_token_acesso(
        data={"sub": str(usuario.id), "email": usuario.email, "perfil": usuario.perfil.value},
        expires_delta=access_token_expires
    )
    
    return {"access_token": access_token, "token_type": "bearer"}

@router.post("/login", response_model=schemas.Token)
async def login(
    request: Request,
    login_data: schemas.LoginRequest,
    db: Session = Depends(get_db)
):
    """Endpoint alternativo de login usando JSON"""
    usuario = auth.autenticar_usuario(db, login_data.email, login_data.senha)
    
    if not usuario:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email ou senha incorretos"
        )
    
    access_token = auth.criar_token_acesso(
        data={"sub": str(usuario.id), "email": usuario.email, "perfil": usuario.perfil.value}
    )
    
    return {"access_token": access_token, "token_type": "bearer"}

@router.post("/usuarios", response_model=schemas.Usuario)
async def criar_usuario(
    request: Request,
    usuario: schemas.UsuarioCreate,
    db: Session = Depends(get_db),
    admin: models.Usuario = Depends(auth.verificar_admin)  # Só admin pode criar usuários
):
    """Criar novo usuário (apenas ADMIN)"""
    # Verificar se email já existe
    usuario_existente = db.query(models.Usuario).filter(
        models.Usuario.email == usuario.email
    ).first()
    
    if usuario_existente:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email já cadastrado"
        )
    
    # Criar novo usuário
    novo_usuario = models.Usuario(
        nome=usuario.nome,
        email=usuario.email,
        senha_hash=auth.gerar_hash_senha(usuario.senha),
        perfil=usuario.perfil,
        ativo=True
    )
    
    db.add(novo_usuario)
    db.commit()
    db.refresh(novo_usuario)
    
    return novo_usuario

@router.get("/usuarios/me", response_model=schemas.Usuario)
async def ler_usuario_atual(
    current_user: models.Usuario = Depends(auth.get_current_active_user)
):
    """Retorna informações do usuário atual"""
    return current_user

@router.get("/usuarios", response_model=List[schemas.Usuario])
async def listar_usuarios(
    db: Session = Depends(get_db),
    skip: int = 0,
    limit: int = 100,
    admin: models.Usuario = Depends(auth.verificar_admin)
):
    """Listar todos os usuários (apenas ADMIN)"""
    usuarios = db.query(models.Usuario).offset(skip).limit(limit).all()
    return usuarios