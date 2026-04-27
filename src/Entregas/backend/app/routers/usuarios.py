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


# ================================= TESTE DE ATUALIZAÇÃO PARA IMPLEMENTAÇÃO DE UPDATE E DELETE PARA USUÁRIO ==================================================

@router.put("/usuarios/{usuario_id}", response_model=schemas.Usuario)
async def atualizar_usuario(
    usuario_id: int,
    usuario_data: schemas.UsuarioUpdate,
    db: Session = Depends(get_db),
    current_user: models.Usuario = Depends(auth.get_current_active_user)
):
    """
    Atualiza dados de um usuário.
    
    Regras de acesso:
    - ADMIN pode atualizar qualquer usuário
    - Usuário comum só pode atualizar a si mesmo
    """
    # Buscar usuário no banco
    usuario = db.query(models.Usuario).filter(models.Usuario.id == usuario_id).first()
    
    if not usuario:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Usuário não encontrado"
        )
    
    # Verificar permissão
    if current_user.id != usuario_id and current_user.perfil != models.PerfilUsuario.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Você não tem permissão para atualizar este usuário"
        )
    
    # Atualizar campos permitidos
    if usuario_data.nome is not None:
        usuario.nome = usuario_data.nome
    
    if usuario_data.email is not None:
        # Verificar se novo email já não está em uso
        email_existente = db.query(models.Usuario).filter(
            models.Usuario.email == usuario_data.email,
            models.Usuario.id != usuario_id
        ).first()
        
        if email_existente:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email já está em uso por outro usuário"
            )
        usuario.email = usuario_data.email
    
    if usuario_data.senha is not None:
        # Atualizar senha (só o próprio usuário ou admin)
        if current_user.id != usuario_id and current_user.perfil != models.PerfilUsuario.ADMIN:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Você não tem permissão para alterar a senha deste usuário"
            )
        usuario.senha_hash = auth.gerar_hash_senha(usuario_data.senha)
    
    if usuario_data.perfil is not None:
        # Apenas ADMIN pode alterar perfil
        if current_user.perfil != models.PerfilUsuario.ADMIN:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Apenas administradores podem alterar o perfil de usuários"
            )
        usuario.perfil = usuario_data.perfil
    
    if usuario_data.ativo is not None:
        # Apenas ADMIN pode ativar/desativar usuários
        if current_user.perfil != models.PerfilUsuario.ADMIN:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Apenas administradores podem ativar/desativar usuários"
            )
        usuario.ativo = usuario_data.ativo
    
    # Salvar alterações
    db.commit()
    db.refresh(usuario)
    
    return usuario


@router.delete("/usuarios/{usuario_id}", status_code=status.HTTP_204_NO_CONTENT)
async def deletar_usuario(
    usuario_id: int,
    db: Session = Depends(get_db),
    admin: models.Usuario = Depends(auth.verificar_admin)
):
    """
    Remove um usuário do sistema (soft delete - apenas desativa)
    Apenas ADMIN pode deletar usuários.
    """
    # Buscar usuário
    usuario = db.query(models.Usuario).filter(models.Usuario.id == usuario_id).first()
    
    if not usuario:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Usuário não encontrado"
        )
    
    # Impedir que admin se delete
    if usuario_id == admin.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Você não pode deletar seu próprio usuário"
        )
    
    # SOFT DELETE: apenas desativa o usuário
    try:
        usuario.ativo = False
        db.commit()
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro ao desativar usuário: {str(e)}"
        )
    
    return None  # 204 No Content


@router.patch("/usuarios/{usuario_id}/status", response_model=schemas.Usuario)
async def alternar_status_usuario(
    usuario_id: int,
    ativo: bool,
    db: Session = Depends(get_db),
    admin: models.Usuario = Depends(auth.verificar_admin)
):
    """
    Ativa ou desativa um usuário (apenas ADMIN).
    Alternativa ao delete completo.
    """
    usuario = db.query(models.Usuario).filter(models.Usuario.id == usuario_id).first()
    
    if not usuario:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Usuário não encontrado"
        )
    
    usuario.ativo = ativo
    db.commit()
    db.refresh(usuario)
    
    return usuario