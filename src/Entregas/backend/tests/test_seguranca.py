# tests/test_seguranca.py
import requests
import time

BASE_URL = "http://localhost:8000"
EMAIL_TESTE = f"teste_{int(time.time())}@seguranca.com"  

def limpar_usuario_teste(token_admin):
    """Remove usuário de teste se já existir (incluindo inativos)"""
    try:
        print("   Tentando deletar usuário teste@seguranca.com...")
        
        lista = requests.get(
            f"{BASE_URL}/api/usuarios/usuarios",
            headers={"Authorization": f"Bearer {token_admin}"},
            timeout=5
        )
        
        if lista.status_code == 200:
            for usuario in lista.json():
                if usuario["email"] == "teste@seguranca.com":
                    # Tenta deletar mesmo se estiver inativo
                    resp = requests.delete(
                        f"{BASE_URL}/api/usuarios/usuarios/{usuario['id']}",
                        headers={"Authorization": f"Bearer {token_admin}"},
                        timeout=5
                    )
                    if resp.status_code == 204:
                        print(f" Usuário {usuario['id']} deletado com sucesso!")
                    else:
                        print(f" Falha ao deletar: {resp.status_code} - {resp.text}")
                    return True
            print("Usuário não encontrado para deletar")
            return True
        else:
            print(f" Erro ao listar: {lista.status_code}")
            return False
    except Exception as e:
        print(f" Erro na limpeza: {e}")
        return False

print("=" * 60)
print("TESTES DE SEGURANCA DO BACKEND")
print("=" * 60)

# ============================================================
# TESTE 1: Sem token deve dar 401
# ============================================================
print("\n[TESTE 1] Acessando endpoint sem token...")
try:
    resposta = requests.get(f"{BASE_URL}/api/usuarios/usuarios", timeout=5)
    if resposta.status_code == 401:
        print(" PASSED: Retornou 401 Unauthorized")
    else:
        print(f" FAILED: Esperado 401, recebido {resposta.status_code}")
except Exception as e:
    print(f" ERRO: {e}")

# ============================================================
# TESTE 2: Login como admin
# ============================================================
print("\n[TESTE 2] Login como admin...")
token_admin = None
try:
    login_admin = requests.post(
        f"{BASE_URL}/api/usuarios/login",
        json={"email": "admin@le.com", "senha": "admin123"},
        timeout=5
    )
    
    if login_admin.status_code == 200:
        token_admin = login_admin.json()["access_token"]
        print(" Login admin OK!")
    else:
        print(f" Login admin falhou: {login_admin.status_code}")
except Exception as e:
    print(f" ERRO: {e}")

# ============================================================
# TESTE 2.5: Limpar usuário de teste existente
# ============================================================
if token_admin:
    print("\n[TESTE 2.5] Limpando usuário de teste existente...")
    limpar_usuario_teste(token_admin)
    print(" Limpeza concluída!")

# ============================================================
# TESTE 3: Criar usuário comum
# ============================================================
print("\n[TESTE 3] Criando usuário comum...")
usuario_id = None
if token_admin:
    try:
        criar = requests.post(
            f"{BASE_URL}/api/usuarios/usuarios",
            headers={"Authorization": f"Bearer {token_admin}"},
            json={
                "nome": "Usuario Teste",
                "email": "teste@seguranca.com",
                "senha": "123456",
                "perfil": "Operador"
            },
            timeout=5
        )
        
        if criar.status_code in [200, 201]:
            usuario_id = criar.json()["id"]
            print(f" Usuário criado! ID: {usuario_id}")
        else:
            print(f" Falhou: {criar.status_code} - {criar.text}")
    except Exception as e:
        print(f" ERRO: {e}")

# ============================================================
# TESTE 4: Login como usuário comum
# ============================================================
print("\n[TESTE 4] Login como usuário comum...")
token_comum = None
if usuario_id:
    try:
        login_comum = requests.post(
            f"{BASE_URL}/api/usuarios/login",
            json={"email": "teste@seguranca.com", "senha": "123456"},
            timeout=5
        )
        
        if login_comum.status_code == 200:
            token_comum = login_comum.json()["access_token"]
            print(" Login comum OK!")
        else:
            print(f" Login comum falhou: {login_comum.status_code}")
    except Exception as e:
        print(f" ERRO: {e}")

# ============================================================
# TESTE 5: Usuário comum tentando atualizar ADMIN (deve dar 403)
# ============================================================
print("\n[TESTE 5] Usuário comum tentando atualizar admin...")
if token_comum:
    try:
        atualizar = requests.put(
            f"{BASE_URL}/api/usuarios/usuarios/1",
            headers={"Authorization": f"Bearer {token_comum}"},
            json={"nome": "Tentando Hackear"},
            timeout=5
        )
        
        if atualizar.status_code == 403:
            print(" PASSED: Retornou 403 Forbidden")
        else:
            print(f" FAILED: Esperado 403, recebido {atualizar.status_code}")
    except Exception as e:
        print(f" ERRO: {e}")

# ============================================================
# TESTE 6: Usuário comum tentando deletar outro (deve dar 403)
# ============================================================
print("\n[TESTE 6] Usuário comum tentando deletar outro...")
if token_comum and usuario_id:
    try:
        deletar = requests.delete(
            f"{BASE_URL}/api/usuarios/usuarios/{usuario_id}",
            headers={"Authorization": f"Bearer {token_comum}"},
            timeout=5
        )
        
        if deletar.status_code == 403:
            print(" PASSED: Retornou 403 Forbidden")
        else:
            print(f" FAILED: Esperado 403, recebido {deletar.status_code}")
    except Exception as e:
        print(f" ERRO: {e}")

# ============================================================
# TESTE 7: Admin tentando deletar a si mesmo (deve dar 400)
# ============================================================
print("\n[TESTE 7] Admin tentando deletar a si mesmo...")
if token_admin:
    try:
        deletar_admin = requests.delete(
            f"{BASE_URL}/api/usuarios/usuarios/1",
            headers={"Authorization": f"Bearer {token_admin}"},
            timeout=5
        )
        
        if deletar_admin.status_code == 400:
            print(" PASSED: Retornou 400 Bad Request")
        else:
            print(f" FAILED: Esperado 400, recebido {deletar_admin.status_code}")
    except Exception as e:
        print(f" ERRO: {e}")

# ============================================================
# TESTE 8: Admin deletando usuário comum (deve dar 204)
# ============================================================
print("\n[TESTE 8] Admin deletando usuário comum...")
if token_admin and usuario_id:
    try:
        deletar_comum = requests.delete(
            f"{BASE_URL}/api/usuarios/usuarios/{usuario_id}",
            headers={"Authorization": f"Bearer {token_admin}"},
            timeout=5
        )
        
        if deletar_comum.status_code == 204:
            print(" PASSED: Retornou 204 No Content")
        else:
            print(f" FAILED: Esperado 204, recebido {deletar_comum.status_code}")
    except Exception as e:
        print(f" ERRO: {e}")

# ============================================================
# TESTE 9: Verificar se usuário foi deletado
# ============================================================
print("\n[TESTE 9] Verificando se usuário foi desativado...")
if token_admin:
    try:
        lista = requests.get(
            f"{BASE_URL}/api/usuarios/usuarios",
            headers={"Authorization": f"Bearer {token_admin}"},
            timeout=5
        )
        
        if lista.status_code == 200:
            usuarios = lista.json()
            # Verifica se o usuário está com ativo = false
            usuario_encontrado = None
            for u in usuarios:
                if u["email"] == EMAIL_TESTE:
                    usuario_encontrado = u
                    break
            
            if not usuario_encontrado:
                print(" PASSED: Usuário removido do sistema!")
            elif not usuario_encontrado["ativo"]:
                print(" PASSED: Usuário desativado com sucesso!")
            else:
                print(f" FAILED: Usuário ainda está ativo!")
        else:
            print(f" Erro ao listar: {lista.status_code}")
    except Exception as e:
        print(f" ERRO: {e}")


print("\n" + "=" * 60)
print("TESTES CONCLUÍDOS!")
print("=" * 60)