import React, { useState, useEffect } from 'react';
import { auth, db } from '../firebaseConfig';
import { 
  signInWithEmailAndPassword, 
  sendPasswordResetEmail,
  createUserWithEmailAndPassword,
  updateProfile
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';

// ── Injeção de estilos e fontes ──
const injectStyles = () => {
  if (document.getElementById('login-styles')) return;
  const style = document.createElement('style');
  style.id = 'login-styles';
  style.textContent = `
    @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Sans:wght@300;400;500;600&display=swap');

    @keyframes loginFadeUp {
      from { opacity: 0; transform: translateY(24px); }
      to   { opacity: 1; transform: translateY(0); }
    }
    @keyframes loginPulse {
      0%, 100% { opacity: 1; transform: scale(1); }
      50%       { opacity: 0.6; transform: scale(0.95); }
    }
    @keyframes orb1 {
      0%, 100% { transform: translate(0, 0) scale(1); }
      33%       { transform: translate(40px, -30px) scale(1.1); }
      66%       { transform: translate(-20px, 20px) scale(0.95); }
    }
    @keyframes orb2 {
      0%, 100% { transform: translate(0, 0) scale(1); }
      33%       { transform: translate(-30px, 40px) scale(0.9); }
      66%       { transform: translate(20px, -20px) scale(1.05); }
    }
    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    * { box-sizing: border-box; margin: 0; padding: 0; }

    .ln-root {
      min-height: 100vh;
      background: #0e1612;
      display: flex;
      align-items: center;
      justify-content: center;
      font-family: "DM Sans", sans-serif;
      padding: 24px;
      position: relative;
      overflow: hidden;
    }

    /* Animated background orbs */
    .ln-orb {
      position: absolute;
      border-radius: 50%;
      filter: blur(80px);
      pointer-events: none;
      z-index: 0;
    }
    .ln-orb-1 {
      width: 480px; height: 480px;
      background: radial-gradient(circle, rgba(134,188,118,0.07), transparent 70%);
      top: -120px; left: -120px;
      animation: orb1 14s ease-in-out infinite;
    }
    .ln-orb-2 {
      width: 400px; height: 400px;
      background: radial-gradient(circle, rgba(77,184,164,0.05), transparent 70%);
      bottom: -80px; right: -80px;
      animation: orb2 18s ease-in-out infinite;
    }
    .ln-orb-3 {
      width: 300px; height: 300px;
      background: radial-gradient(circle, rgba(240,168,83,0.04), transparent 70%);
      top: 40%; left: 60%;
      animation: orb1 22s ease-in-out infinite reverse;
    }

    /* Card */
    .ln-card {
      position: relative; z-index: 1;
      width: 100%; max-width: 420px;
      background: #141f18;
      border: 1px solid rgba(134,188,118,0.14);
      border-radius: 24px;
      padding: 44px 40px;
      box-shadow: 0 32px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(134,188,118,0.06);
      animation: loginFadeUp 0.5s ease both;
    }

    /* Logo mark */
    .ln-logo {
      display: flex; align-items: center; gap: 12px;
      margin-bottom: 36px;
    }
    .ln-logo-icon {
      width: 42px; height: 42px; border-radius: 12px;
      background: linear-gradient(135deg, #86bc76, #4db8a4);
      display: flex; align-items: center; justify-content: center;
      font-family: "DM Serif Display", serif;
      font-size: 18px; color: #0e1612; font-weight: 400;
      box-shadow: 0 0 24px rgba(134,188,118,0.25);
      flex-shrink: 0;
    }
    .ln-logo-text {
      font-family: "DM Serif Display", serif;
      font-size: 16px; color: #e8f5e4; line-height: 1.2;
    }
    .ln-logo-text em {
      font-style: italic; color: #86bc76;
    }

    /* Heading */
    .ln-heading {
      font-family: "DM Serif Display", serif;
      font-size: 28px; font-weight: 400;
      color: #e8f5e4; margin-bottom: 6px; line-height: 1.15;
    }
    .ln-subheading {
      font-size: 13px; color: #4d6647;
      margin-bottom: 32px; font-weight: 400;
    }

    /* Divider */
    .ln-divider {
      width: 100%; height: 1px;
      background: rgba(134,188,118,0.1);
      margin: 28px 0;
    }

    /* Label */
    .ln-label {
      display: block;
      font-size: 10px; font-weight: 600;
      color: #4d6647; text-transform: uppercase;
      letter-spacing: 0.8px; margin-bottom: 7px;
    }

    /* Input */
    .ln-field { margin-bottom: 18px; }
    .ln-input {
      width: 100%;
      padding: 11px 16px;
      background: rgba(134,188,118,0.05);
      border: 1px solid rgba(134,188,118,0.18);
      border-radius: 10px;
      color: #e8f5e4;
      font-size: 13px;
      font-family: "DM Sans", sans-serif;
      outline: none;
      transition: border-color 0.2s, background 0.2s;
      color-scheme: dark;
      appearance: none; -webkit-appearance: none;
    }
    .ln-input:focus {
      border-color: rgba(134,188,118,0.45);
      background: rgba(134,188,118,0.09);
    }
    .ln-input::placeholder { color: rgba(138,171,128,0.35); }
    .ln-input option { background: #141f18; color: #e8f5e4; }

    /* Select wrapper */
    .ln-select-wrap { position: relative; }
    .ln-select-wrap::after {
      content: '▾'; position: absolute;
      right: 14px; top: 50%; transform: translateY(-50%);
      color: rgba(134,188,118,0.4); font-size: 11px; pointer-events: none;
    }

    /* Primary button */
    .ln-btn {
      width: 100%; padding: 12px;
      background: linear-gradient(135deg, #86bc76, #4db8a4);
      color: #0e1612; border: none; border-radius: 10px;
      font-size: 13px; font-weight: 700;
      font-family: "DM Sans", sans-serif;
      cursor: pointer; margin-top: 8px;
      transition: opacity 0.2s, transform 0.15s;
      letter-spacing: 0.3px;
    }
    .ln-btn:hover:not(:disabled) { opacity: 0.88; transform: translateY(-1px); }
    .ln-btn:disabled { opacity: 0.5; cursor: not-allowed; }

    /* Ghost button */
    .ln-btn-ghost {
      width: 100%; padding: 11px;
      background: transparent;
      border: 1px solid rgba(134,188,118,0.18);
      color: #8aab80; border-radius: 10px;
      font-size: 13px; font-family: "DM Sans", sans-serif;
      cursor: pointer; margin-top: 10px;
      transition: background 0.2s;
    }
    .ln-btn-ghost:hover { background: rgba(134,188,118,0.07); }

    /* Link buttons row */
    .ln-links {
      display: flex; align-items: center;
      justify-content: center; gap: 8px;
      margin-top: 24px; padding-top: 20px;
      border-top: 1px solid rgba(134,188,118,0.08);
    }
    .ln-link {
      background: none; border: none;
      color: #8aab80; cursor: pointer;
      font-size: 12px; font-family: "DM Sans", sans-serif;
      padding: 6px 10px; border-radius: 6px;
      transition: color 0.2s, background 0.2s;
    }
    .ln-link:hover { color: #86bc76; background: rgba(134,188,118,0.07); }
    .ln-link-sep { color: rgba(134,188,118,0.2); font-size: 12px; }

    /* Alert messages */
    .ln-alert {
      padding: 12px 16px; border-radius: 10px;
      font-size: 12px; font-weight: 500;
      margin-bottom: 20px; line-height: 1.5;
    }
    .ln-alert-error {
      background: rgba(232,114,114,0.1);
      border: 1px solid rgba(232,114,114,0.25);
      color: #e87272;
    }
    .ln-alert-success {
      background: rgba(134,188,118,0.1);
      border: 1px solid rgba(134,188,118,0.25);
      color: #86bc76;
    }

    /* Spinner */
    .ln-spinner {
      width: 16px; height: 16px;
      border: 2px solid rgba(14,22,18,0.3);
      border-top-color: #0e1612;
      border-radius: 50%;
      animation: spin 0.7s linear infinite;
      display: inline-block; vertical-align: middle;
      margin-right: 8px;
    }

    /* Pulse dot */
    .ln-dot {
      width: 6px; height: 6px; border-radius: 50%;
      background: #86bc76; display: inline-block;
      margin-right: 8px; vertical-align: middle;
      animation: loginPulse 2s ease infinite;
    }
  `;
  document.head.appendChild(style);
};

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [showCreateAccount, setShowCreateAccount] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [newAccount, setNewAccount] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    name: '',
    role: 'aluno',
    equipe: ''
  });
  const [message, setMessage] = useState({ text: '', type: '' });
  const navigate = useNavigate();

  useEffect(() => { injectStyles(); }, []);

  const resetToLogin = () => {
    setLoading(false);
    setMessage({ text: '', type: '' });
    setShowResetPassword(false);
    setShowCreateAccount(false);
    setEmail('');
    setPassword('');
    setResetEmail('');
    setNewAccount({ email: '', password: '', confirmPassword: '', name: '', role: 'aluno', equipe: '' });
  };

  const normalizarCargo = (cargo) => {
    if (!cargo) return 'aluno';
    const cargoLower = cargo.toLowerCase();
    if (cargoLower === 'admin' || cargoLower === 'administrador') return 'administrador';
    return 'aluno';
  };

  // LOGIN
  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ text: '', type: '' });
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      const userDoc = await getDoc(doc(db, "users", user.uid));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        const cargoNormalizado = normalizarCargo(userData.cargo);
        localStorage.setItem('user', JSON.stringify({
          uid: user.uid,
          email: user.email,
          nome: userData.nome,
          cargo: cargoNormalizado,
          equipe: userData.equipe || ''
        }));
        setLoading(false);
        if (cargoNormalizado === 'administrador') {
          navigate('/admin');
        } else {
          navigate('/aluno');
        }
      } else {
        setLoading(false);
        setMessage({ text: "Usuário não encontrado no banco de dados.", type: 'error' });
      }
    } catch (error) {
      setLoading(false);
      let errorMsg = "";
      if (error.code === 'auth/invalid-credential') errorMsg = "Email ou senha inválidos";
      else if (error.code === 'auth/user-not-found') errorMsg = "Usuário não encontrado";
      else if (error.code === 'auth/wrong-password') errorMsg = "Senha incorreta";
      else errorMsg = error.message;
      setMessage({ text: errorMsg, type: 'error' });
    }
  };

  // RECUPERAR SENHA
  const handleResetPassword = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ text: '', type: '' });
    try {
      await sendPasswordResetEmail(auth, resetEmail);
      setLoading(false);
      setMessage({ text: "Email de recuperação enviado! Verifique sua caixa de entrada.", type: 'success' });
      setTimeout(() => { resetToLogin(); }, 3000);
    } catch (error) {
      setLoading(false);
      setMessage({ text: "Erro: " + error.message, type: 'error' });
    }
  };

  // CRIAR CONTA
  const handleCreateAccount = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ text: '', type: '' });
    if (newAccount.password !== newAccount.confirmPassword) {
      setMessage({ text: "As senhas não coincidem", type: 'error' });
      setLoading(false); return;
    }
    if (newAccount.password.length < 6) {
      setMessage({ text: "A senha deve ter pelo menos 6 caracteres", type: 'error' });
      setLoading(false); return;
    }
    if (newAccount.role === 'aluno' && !newAccount.equipe) {
      setMessage({ text: "Selecione sua equipe", type: 'error' });
      setLoading(false); return;
    }
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, newAccount.email, newAccount.password);
      const user = userCredential.user;
      await updateProfile(user, { displayName: newAccount.name });
      const cargoParaSalvar = newAccount.role === 'administrador' ? 'Admin' : 'aluno';
      await setDoc(doc(db, "users", user.uid), {
        cargo: cargoParaSalvar,
        email: newAccount.email,
        equipe: newAccount.role === 'aluno' ? newAccount.equipe : '',
        nome: newAccount.name,
        uid: user.uid,
        createdAt: new Date().toISOString()
      });
      setLoading(false);
      setMessage({ text: "Conta criada com sucesso! Agora faça login.", type: 'success' });
      setTimeout(() => { resetToLogin(); }, 2000);
    } catch (error) {
      setLoading(false);
      let errorMsg = "";
      if (error.code === 'auth/email-already-in-use') errorMsg = "Este email já está em uso";
      else if (error.code === 'auth/invalid-email') errorMsg = "Email inválido";
      else if (error.code === 'auth/weak-password') errorMsg = "Senha muito fraca. Use pelo menos 6 caracteres";
      else if (error.code === 'permission-denied') errorMsg = "Erro de permissão. Contate o administrador.";
      else errorMsg = error.message;
      setMessage({ text: errorMsg, type: 'error' });
    }
  };

  // ── TELA: RECUPERAR SENHA ──
  if (showResetPassword) {
    return (
      <div className="ln-root">
        <div className="ln-orb ln-orb-1" /><div className="ln-orb ln-orb-2" /><div className="ln-orb ln-orb-3" />
        <div className="ln-card">
          <div className="ln-logo">
            <div className="ln-logo-icon">✉</div>
            <div className="ln-logo-text">Recuperar <em>senha</em></div>
          </div>

          <h1 className="ln-heading">Esqueceu a senha?</h1>
          <p className="ln-subheading">Enviaremos um link de redefinição para seu email.</p>

          {message.text && (
            <div className={`ln-alert ${message.type === 'success' ? 'ln-alert-success' : 'ln-alert-error'}`}>
              {message.type === 'success' ? '✓ ' : '✕ '}{message.text}
            </div>
          )}

          <form onSubmit={handleResetPassword}>
            <div className="ln-field">
              <label className="ln-label">Email</label>
              <input
                type="email" className="ln-input"
                placeholder="seu@email.com"
                value={resetEmail}
                onChange={e => setResetEmail(e.target.value)}
                required
              />
            </div>
            <button type="submit" className="ln-btn" disabled={loading}>
              {loading ? <><span className="ln-spinner" />Enviando…</> : 'Enviar link de recuperação'}
            </button>
            <button type="button" className="ln-btn-ghost" onClick={resetToLogin}>Voltar ao login</button>
          </form>
        </div>
      </div>
    );
  }

  // ── TELA: CRIAR CONTA ──
  if (showCreateAccount) {
    return (
      <div className="ln-root">
        <div className="ln-orb ln-orb-1" /><div className="ln-orb ln-orb-2" /><div className="ln-orb ln-orb-3" />
        <div className="ln-card">
          <h1 className="ln-heading">Criar conta</h1>
          <p className="ln-subheading">Preencha os dados abaixo para se registrar.</p>

          {message.text && (
            <div className={`ln-alert ${message.type === 'success' ? 'ln-alert-success' : 'ln-alert-error'}`}>
              {message.type === 'success' ? '✓ ' : '✕ '}{message.text}
            </div>
          )}

          <form onSubmit={handleCreateAccount}>
            <div className="ln-field">
              <label className="ln-label">Nome completo</label>
              <input
                type="text" className="ln-input" placeholder="Seu nome"
                value={newAccount.name}
                onChange={e => setNewAccount({ ...newAccount, name: e.target.value })}
                required
              />
            </div>
            <div className="ln-field">
              <label className="ln-label">Email</label>
              <input
                type="email" className="ln-input" placeholder="seu@email.com"
                value={newAccount.email}
                onChange={e => setNewAccount({ ...newAccount, email: e.target.value })}
                required
              />
            </div>
            <div className="ln-field">
              <label className="ln-label">Senha</label>
              <input
                type="password" className="ln-input" placeholder="Mínimo 6 caracteres"
                value={newAccount.password}
                onChange={e => setNewAccount({ ...newAccount, password: e.target.value })}
                required
              />
            </div>
            <div className="ln-field">
              <label className="ln-label">Confirmar senha</label>
              <input
                type="password" className="ln-input" placeholder="Repita a senha"
                value={newAccount.confirmPassword}
                onChange={e => setNewAccount({ ...newAccount, confirmPassword: e.target.value })}
                required
              />
            </div>
            <div className="ln-field">
              <label className="ln-label">Perfil</label>
              <div className="ln-select-wrap">
                <select
                  className="ln-input"
                  value={newAccount.role}
                  onChange={e => setNewAccount({ ...newAccount, role: e.target.value, equipe: '' })}
                >
                  <option value="aluno">Aluno</option>
                  <option value="administrador">Administrador</option>
                </select>
              </div>
            </div>
            {newAccount.role === 'aluno' && (
              <div className="ln-field">
                <label className="ln-label">Equipe</label>
                <div className="ln-select-wrap">
                  <select
                    className="ln-input"
                    value={newAccount.equipe}
                    onChange={e => setNewAccount({ ...newAccount, equipe: e.target.value })}
                    required
                  >
                    <option value="">Selecione sua equipe</option>
                    <option value="Equipe 1">Equipe 1</option>
                    <option value="Equipe 2">Equipe 2</option>
                    <option value="Equipe 3">Equipe 3</option>
                  </select>
                </div>
              </div>
            )}
            <button type="submit" className="ln-btn" disabled={loading}>
              {loading ? <><span className="ln-spinner" />Criando conta…</> : 'Criar conta'}
            </button>
            <button type="button" className="ln-btn-ghost" onClick={resetToLogin}>Voltar ao login</button>
          </form>
        </div>
      </div>
    );
  }

  // ── TELA: LOGIN ──
  return (
    <div className="ln-root">
      <div className="ln-orb ln-orb-1" /><div className="ln-orb ln-orb-2" /><div className="ln-orb ln-orb-3" />
      <div className="ln-card">


        {/* Heading */}
        <h1 className="ln-heading">Bem-vindo(a)!</h1>
        <p className="ln-subheading">
          <span className="ln-dot" />
          Acesse sua conta para continuar
        </p>

        {message.text && (
          <div className={`ln-alert ${message.type === 'success' ? 'ln-alert-success' : 'ln-alert-error'}`}>
            {message.type === 'success' ? '✓ ' : '✕ '}{message.text}
          </div>
        )}

        <form onSubmit={handleLogin}>
          <div className="ln-field">
            <label className="ln-label">Email</label>
            <input
              type="email" className="ln-input" placeholder="seu@email.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="ln-field">
            <label className="ln-label">Senha</label>
            <input
              type="password" className="ln-input" placeholder="••••••••"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
            />
          </div>

          <button type="submit" className="ln-btn" disabled={loading}>
            {loading ? <><span className="ln-spinner" />Entrando…</> : 'Entrar'}
          </button>
        </form>

        <div className="ln-links">
          <button
            type="button" className="ln-link"
            onClick={() => { setShowResetPassword(true); setMessage({ text: '', type: '' }); }}
          >
            Esqueci minha senha
          </button>
          <span className="ln-link-sep">·</span>
          <button
            type="button" className="ln-link"
            onClick={() => { setShowCreateAccount(true); setMessage({ text: '', type: '' }); }}
          >
            Criar conta
          </button>
        </div>
      </div>
    </div>
  );
};

export default Login;