import React, { useState, useEffect, useRef } from 'react';
import {
  Database, Save, Activity, Trash2, ClipboardList,
  Maximize2, Users, LogOut, Eye, EyeOff, AlertCircle,
  Settings, Wifi, WifiOff, Camera,
} from 'lucide-react';

// ── Firebase ────────────────────────────────────────────────────────────────
import { initializeApp, getApps }             from 'firebase/app';
import { getAuth, signInWithEmailAndPassword,
         signOut, onAuthStateChanged }        from 'firebase/auth';
import { getFirestore, collection,
         query, where, getDocs }              from 'firebase/firestore';

const firebaseConfig = {
  apiKey:            "AIzaSyDBLkJUFcmwnixj32jCr-ZW1uUG7uBXvb8",
  authDomain:        "lecontagem-1d7e2.firebaseapp.com",
  projectId:         "lecontagem-1d7e2",
  storageBucket:     "lecontagem-1d7e2.firebasestorage.app",
  messagingSenderId: "730486633380",
  appId:             "1:730486633380:web:5309eaed143c8759b68731",
  measurementId: "G-MBBLVL0TX9"
};

const FIREBASE_CONFIGURADO =
  firebaseConfig.apiKey    !== "SUA_API_KEY" &&
  firebaseConfig.projectId !== "SEU_PROJETO_ID";

let auth = null;
let db   = null;

if (FIREBASE_CONFIGURADO) {
  try {
    const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
    auth = getAuth(app);
    db   = getFirestore(app);
  } catch (e) { console.error('Firebase init error:', e); }
}
// ────────────────────────────────────────────────────────────────────────────

// ── Estilos globais injetados ───────────────────────────────────────────────
const GLOBAL_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@400;600;700;800;900&family=JetBrains+Mono:wght@400;500;700&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  :root {
    --bg:        #07090d;
    --surface:   #0d1117;
    --elevated:  #131a23;
    --border:    rgba(255,255,255,0.06);
    --border-hi: rgba(255,255,255,0.12);
    --orange:    #f97316;
    --orange-dim: rgba(249,115,22,0.15);
    --green:     #22c55e;
    --green-dim: rgba(34,197,94,0.08);
    --red:       #ef4444;
    --amber:     #fbbf24;
    --text:      #c8d0d8;
    --muted:     #3d4f63;
    --font-head: 'Barlow Condensed', sans-serif;
    --font-mono: 'JetBrains Mono', monospace;
  }

  body { background: var(--bg); color: var(--text); font-family: var(--font-mono); }

  /* dot grid background */
  .dot-grid {
    background-image: radial-gradient(circle, rgba(255,255,255,0.06) 1px, transparent 1px);
    background-size: 24px 24px;
  }

  /* corner bracket decoration */
  .bracket::before, .bracket::after {
    content: '';
    position: absolute;
    width: 14px; height: 14px;
    border-color: var(--orange);
    border-style: solid;
    opacity: 0.5;
  }
  .bracket::before { top: -1px; left: -1px; border-width: 2px 0 0 2px; }
  .bracket::after  { bottom: -1px; right: -1px; border-width: 0 2px 2px 0; }

  /* pulsing dot */
  @keyframes pulse-dot {
    0%, 100% { opacity: 1; transform: scale(1); }
    50%       { opacity: 0.4; transform: scale(0.7); }
  }
  .pulse-dot { animation: pulse-dot 1.4s ease-in-out infinite; }

  /* scan line sweep */
  @keyframes scan {
    0%   { transform: translateY(-100%); opacity: 0; }
    10%  { opacity: 0.6; }
    90%  { opacity: 0.6; }
    100% { transform: translateY(100vh); opacity: 0; }
  }
  .scan-line {
    position: absolute; inset-x: 0; height: 2px;
    background: linear-gradient(90deg, transparent, var(--orange), transparent);
    animation: scan 3s linear infinite;
    pointer-events: none;
  }

  /* fade-in stagger */
  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(12px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  .fade-up { animation: fadeUp 0.4s ease both; }
  .fade-up-1 { animation-delay: 0.05s; }
  .fade-up-2 { animation-delay: 0.10s; }
  .fade-up-3 { animation-delay: 0.15s; }
  .fade-up-4 { animation-delay: 0.20s; }

  /* number glow */
  .num-glow { text-shadow: 0 0 20px rgba(249,115,22,0.35); }
  .num-glow-green { text-shadow: 0 0 20px rgba(34,197,94,0.35); }

  /* scrollbar */
  .thin-scroll::-webkit-scrollbar { width: 3px; }
  .thin-scroll::-webkit-scrollbar-track { background: transparent; }
  .thin-scroll::-webkit-scrollbar-thumb { background: var(--muted); border-radius: 2px; }

  /* button hover lift */
  .btn-lift { transition: transform 0.12s, box-shadow 0.12s; }
  .btn-lift:not(:disabled):hover { transform: translateY(-1px); }
  .btn-lift:not(:disabled):active { transform: translateY(0); }

  /* input focus glow */
  .input-field:focus { border-color: var(--orange) !important; box-shadow: 0 0 0 3px rgba(249,115,22,0.12); outline: none; }
`;

function GlobalStyles() {
  useEffect(() => {
    const el = document.createElement('style');
    el.textContent = GLOBAL_CSS;
    document.head.appendChild(el);
    return () => document.head.removeChild(el);
  }, []);
  return null;
}

// ── Helpers UI ──────────────────────────────────────────────────────────────
const Label = ({ children, color = 'var(--muted)' }) => (
  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', color }}>
    {children}
  </span>
);

const Divider = () => (
  <div style={{ height: 1, background: 'var(--border)', margin: '0 0 0 0' }} />
);

// Corner-bracketed card
const Card = ({ children, style, className = '' }) => (
  <div className={`bracket ${className}`} style={{
    position: 'relative', background: 'var(--surface)',
    border: '1px solid var(--border)', ...style,
  }}>
    {children}
  </div>
);


// ══════════════════════════════════════════════════════════════════════════════
// TELA: FIREBASE NÃO CONFIGURADO
// ══════════════════════════════════════════════════════════════════════════════
function TelaConfiguracao() {
  return (
    <>
      <GlobalStyles />
      <div className="dot-grid" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <Card style={{ padding: '2rem', maxWidth: 420, width: '100%', borderColor: 'rgba(249,115,22,0.3)' }}>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 20 }}>
            <Settings size={18} color="var(--orange)" />
            <Label color="var(--orange)">Configuração necessária</Label>
          </div>
          <p style={{ fontFamily: 'var(--font-head)', fontSize: 22, fontWeight: 800, color: '#fff', textTransform: 'uppercase', marginBottom: 8 }}>
            Firebase não configurado
          </p>
          <p style={{ fontSize: 12, color: 'var(--muted)', lineHeight: 1.7 }}>
            Preencha o objeto <code style={{ color: 'var(--orange)' }}>firebaseConfig</code> no topo do <code style={{ color: 'var(--orange)' }}>App.js</code> com os dados do seu projeto.
          </p>
        </Card>
      </div>
    </>
  );
}


// ══════════════════════════════════════════════════════════════════════════════
// TELA DE LOGIN
// ══════════════════════════════════════════════════════════════════════════════
function TelaLogin({ onLogin }) {
  const [email,        setEmail]   = useState('');
  const [senha,        setSenha]   = useState('');
  const [mostrarSenha, setMostrar] = useState(false);
  const [carregando,   setCarreg]  = useState(false);
  const [erro,         setErro]    = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!email.trim() || !senha.trim()) return;
    setErro(''); setCarreg(true);
    try {
      const cred = await signInWithEmailAndPassword(auth, email.trim(), senha);
      const uid  = cred.user.uid;
      const q    = query(collection(db, 'users'), where('uid', '==', uid));
      const snap = await getDocs(q);
      if (snap.empty) { await signOut(auth); setErro('Usuário não encontrado.'); return; }
      const u = { id: snap.docs[0].id, ...snap.docs[0].data() };
      if (!u.equipe || !u.equipe.trim()) {
        await signOut(auth);
        setErro('Acesso negado: nenhuma equipe atribuída. Contate o administrador.');
        return;
      }
      onLogin(u);
    } catch (err) {
      const msgs = {
        'auth/user-not-found': 'E-mail não cadastrado.',
        'auth/wrong-password': 'Senha incorreta.',
        'auth/invalid-email': 'E-mail inválido.',
        'auth/too-many-requests': 'Muitas tentativas. Aguarde.',
        'auth/invalid-credential': 'E-mail ou senha incorretos.',
        'auth/network-request-failed': 'Sem conexão.',
      };
      setErro(msgs[err.code] || err.message);
    } finally { setCarreg(false); }
  };

  return (
    <>
      <GlobalStyles />
      <div className="dot-grid" style={{
        minHeight: '100vh', display: 'flex', position: 'relative', overflow: 'hidden',
      }}>
        {/* Scan line */}
        <div className="scan-line" />

        {/* Left panel — branding */}
        <div style={{
          flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end',
          padding: '3rem', borderRight: '1px solid var(--border)',
        }}>
          <div style={{ maxWidth: 340 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24 }}>
              <Activity size={20} color="var(--orange)" />
              <Label color="var(--orange)">Sistema de controle</Label>
            </div>
            <h1 style={{
              fontFamily: 'var(--font-head)', fontSize: 64, fontWeight: 900,
              color: '#fff', textTransform: 'uppercase', lineHeight: 0.95,
              letterSpacing: '-0.01em', marginBottom: 20,
            }}>
              SCANNER<br />
              <span style={{ color: 'var(--orange)' }}>RAMPA</span><br />
              01
            </h1>
            <Divider />
            <p style={{ fontSize: 11, color: 'var(--muted)', lineHeight: 1.8, marginTop: 16 }}>
              Detecção de alimentos por visão computacional.<br />
              Rastreamento em tempo real com YOLO + Firebase.
            </p>
          </div>
        </div>

        {/* Right panel — form */}
        <div style={{
          width: 420, display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '3rem',
        }}>
          <div className="fade-up" style={{ width: '100%' }}>
            <Label color="var(--muted)">Autenticação</Label>
            <h2 style={{
              fontFamily: 'var(--font-head)', fontSize: 32, fontWeight: 900,
              color: '#fff', textTransform: 'uppercase', marginTop: 6, marginBottom: 28,
            }}>
              Acesso ao sistema
            </h2>

            {erro && (
              <div style={{
                display: 'flex', gap: 8, alignItems: 'flex-start',
                background: 'rgba(239,68,68,0.07)', border: '1px solid rgba(239,68,68,0.2)',
                borderRadius: 8, padding: '10px 12px', marginBottom: 16,
                fontSize: 11, color: '#ef4444', lineHeight: 1.5,
              }}>
                <AlertCircle size={13} style={{ flexShrink: 0, marginTop: 1 }} />
                {erro}
              </div>
            )}

            <form onSubmit={handleLogin} autoComplete="on">
              {/* E-mail */}
              <div style={{ marginBottom: 14 }}>
                <Label>E-mail</Label>
                <input
                  type="email" value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="operador@empresa.com"
                  autoComplete="email"
                  className="input-field"
                  style={{
                    display: 'block', width: '100%', marginTop: 6,
                    background: 'var(--elevated)', border: '1px solid var(--border-hi)',
                    borderRadius: 8, padding: '11px 14px', color: '#fff',
                    fontSize: 13, fontFamily: 'var(--font-mono)', transition: 'border-color 0.15s, box-shadow 0.15s',
                  }}
                  required
                />
              </div>

              {/* Senha */}
              <div style={{ marginBottom: 24, position: 'relative' }}>
                <Label>Senha</Label>
                <div style={{ position: 'relative', marginTop: 6 }}>
                  <input
                    type={mostrarSenha ? 'text' : 'password'}
                    value={senha} onChange={e => setSenha(e.target.value)}
                    placeholder="••••••••"
                    autoComplete="current-password"
                    className="input-field"
                    style={{
                      display: 'block', width: '100%',
                      background: 'var(--elevated)', border: '1px solid var(--border-hi)',
                      borderRadius: 8, padding: '11px 40px 11px 14px',
                      color: '#fff', fontSize: 13, fontFamily: 'var(--font-mono)',
                      transition: 'border-color 0.15s, box-shadow 0.15s',
                    }}
                    required
                  />
                  <button type="button"
                    onClick={() => setMostrar(v => !v)}
                    style={{
                      position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                      background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)', padding: 0,
                    }}>
                    {mostrarSenha ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              <button type="submit" disabled={carregando} className="btn-lift"
                style={{
                  width: '100%', padding: '13px', borderRadius: 8, border: 'none',
                  background: carregando ? 'rgba(249,115,22,0.4)' : 'var(--orange)',
                  color: '#fff', fontFamily: 'var(--font-head)', fontWeight: 800,
                  fontSize: 15, textTransform: 'uppercase', letterSpacing: '0.1em',
                  cursor: carregando ? 'not-allowed' : 'pointer',
                  boxShadow: carregando ? 'none' : '0 4px 20px rgba(249,115,22,0.3)',
                }}>
                {carregando ? 'Verificando…' : 'Entrar'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </>
  );
}


// ══════════════════════════════════════════════════════════════════════════════
// APP PRINCIPAL
// ══════════════════════════════════════════════════════════════════════════════
function App() {
  const [authState,      setAuthState]      = useState('checking');
  const [usuario,        setUsuario]        = useState(null);
  const [isStreaming,    setIsStreaming]     = useState(null);
  const [data,           setData]           = useState({ itens_txt: 'Vazio', peso: 0, valor: 0, itens_detalhados: [] });
  const [historico,      setHistorico]      = useState([]);
  const [pesoAcumulado,  setPesoAcumulado]  = useState(0);
  const [valorAcumulado, setValorAcumulado] = useState(0);
  const [salvando,       setSalvando]       = useState(false);
  const timerRef = useRef(null);

  // ── Auth listener ────────────────────────────────────────────────────────
  useEffect(() => {
    if (!auth || !db) { setAuthState('unauthenticated'); return; }
    const unsub = onAuthStateChanged(auth, async (fbUser) => {
      if (!fbUser) { setAuthState('unauthenticated'); setUsuario(null); return; }
      try {
        const q = query(collection(db, 'users'), where('uid', '==', fbUser.uid));
        const snap = await getDocs(q);
        if (!snap.empty) {
          const u = { id: snap.docs[0].id, ...snap.docs[0].data() };
          if (u.equipe?.trim()) { setUsuario(u); setAuthState('authenticated'); }
          else { await signOut(auth); setAuthState('unauthenticated'); }
        } else { await signOut(auth); setAuthState('unauthenticated'); }
      } catch { setAuthState('unauthenticated'); }
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    if (authState !== 'authenticated') return;
    fetch('http://localhost:5000/status').then(r => r.json()).then(s => setIsStreaming(s.camera_ativa)).catch(() => setIsStreaming(false));
  }, [authState]);

  useEffect(() => {
    if (isStreaming === null) return;
    if (isStreaming) {
      timerRef.current = setInterval(() => {
        fetch('http://localhost:5000/stats').then(r => r.json()).then(d => setData(d)).catch(() => {});
      }, 400);
    } else {
      clearInterval(timerRef.current);
      setData({ itens_txt: 'Vazio', peso: 0, valor: 0, itens_detalhados: [] });
    }
    return () => clearInterval(timerRef.current);
  }, [isStreaming]);

  const handleLogout = async () => {
    if (auth) await signOut(auth);
    setUsuario(null); setAuthState('unauthenticated'); setIsStreaming(null);
    setHistorico([]); setPesoAcumulado(0); setValorAcumulado(0);
  };

  const toggleHardware = async () => {
    try {
      const res = await fetch('http://localhost:5000/toggle_camera', { method: 'POST' });
      const json = await res.json();
      setIsStreaming(json.camera_ativa);
    } catch { console.error('Backend offline'); }
  };

  const salvarLote = async () => {
    if (data.peso <= 0 || salvando || !usuario) return;
    setSalvando(true);
    try {
      const res = await fetch('http://localhost:5000/salvar_lote', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ equipe_id: usuario.id, equipe_nome: usuario.equipe, usuario_uid: usuario.uid, usuario_nome: usuario.nome }),
      });
      const json = await res.json();
      if (json.sucesso) {
        const reg = { id: json.doc_id, hora: new Date().toLocaleTimeString(), itens: data.itens_txt, peso: Number(data.peso), valor: Number(data.valor), alimentos: data.itens_detalhados || [] };
        setHistorico(p => [reg, ...p]);
        setPesoAcumulado(p => p + Number(data.peso));
        setValorAcumulado(p => p + Number(data.valor));
      }
    } catch (e) { console.error(e); }
    finally { setSalvando(false); }
  };

  const removerRegistro = (reg) => {
    setHistorico(p => p.filter(i => i.id !== reg.id));
    setPesoAcumulado(p => Math.max(0, p - Number(reg.peso)));
    setValorAcumulado(p => Math.max(0, p - Number(reg.valor)));
  };

  // ── Guards ────────────────────────────────────────────────────────────────
  if (!FIREBASE_CONFIGURADO) return <TelaConfiguracao />;

  if (authState === 'checking') return (
    <>
      <GlobalStyles />
      <div className="dot-grid" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <Activity size={28} color="var(--orange)" style={{ opacity: 0.4 }} />
          <p style={{ fontSize: 10, color: 'var(--muted)', marginTop: 12, fontFamily: 'var(--font-mono)', letterSpacing: '0.15em' }}>
            VERIFICANDO SESSÃO…
          </p>
        </div>
      </div>
    </>
  );

  if (authState !== 'authenticated' || !usuario) {
    return <TelaLogin onLogin={(u) => { setUsuario(u); setAuthState('authenticated'); }} />;
  }

  // ── Status config ─────────────────────────────────────────────────────────
  const statusColor = isStreaming === null ? 'var(--amber)' : isStreaming ? 'var(--green)' : 'var(--red)';
  const statusLabel = isStreaming === null ? 'CONECTANDO' : isStreaming ? 'ONLINE' : 'STANDBY';

  // ── Dashboard ─────────────────────────────────────────────────────────────
  return (
    <>
      <GlobalStyles />
      <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', flexDirection: 'column' }}>

        {/* ── TOP BAR ──────────────────────────────────────────────────── */}
        <header style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '0 28px', height: 56,
          borderBottom: '1px solid var(--border)',
          background: 'var(--surface)',
          position: 'sticky', top: 0, zIndex: 50,
        }}>
          {/* Left: brand */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 28, height: 28, background: 'var(--orange)', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Activity size={15} color="#fff" />
            </div>
            <span style={{ fontFamily: 'var(--font-head)', fontWeight: 900, fontSize: 16, color: '#fff', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Scanner Rampa 01
            </span>
            <div style={{ width: 1, height: 20, background: 'var(--border)', margin: '0 4px' }} />
            {/* Equipe badge */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: 6,
              background: 'var(--orange-dim)', border: '1px solid rgba(249,115,22,0.25)',
              borderRadius: 6, padding: '3px 10px',
            }}>
              <Users size={11} color="var(--orange)" />
              <span style={{ fontFamily: 'var(--font-head)', fontWeight: 700, fontSize: 12, color: 'var(--orange)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                {usuario.equipe}
              </span>
            </div>
            <span style={{ fontSize: 10, color: 'var(--muted)', fontFamily: 'var(--font-mono)' }}>
              {usuario.nome}
            </span>
          </div>

          {/* Right: status + logout */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            {/* Status pill */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 7, background: 'var(--elevated)', border: `1px solid ${statusColor}30`, borderRadius: 20, padding: '5px 12px' }}>
              <span className="pulse-dot" style={{ width: 7, height: 7, borderRadius: '50%', background: statusColor, display: 'block' }} />
              <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: 10, color: statusColor, letterSpacing: '0.12em' }}>
                {statusLabel}
              </span>
            </div>
            <div style={{ width: 1, height: 20, background: 'var(--border)' }} />
            <button onClick={handleLogout} className="btn-lift"
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                background: 'none', border: '1px solid var(--border)', borderRadius: 6,
                padding: '5px 12px', cursor: 'pointer',
                fontFamily: 'var(--font-mono)', fontSize: 10, fontWeight: 700,
                color: 'var(--muted)', letterSpacing: '0.1em', textTransform: 'uppercase',
                transition: 'border-color 0.15s, color 0.15s',
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--red)'; e.currentTarget.style.color = 'var(--red)'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--muted)'; }}
            >
              <LogOut size={11} /> Sair
            </button>
          </div>
        </header>

        {/* ── MAIN GRID ────────────────────────────────────────────────── */}
        <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '280px 1fr 260px', gap: 0, height: 'calc(100vh - 56px)' }}>

          {/* ── LEFT PANEL ────────────────────────────────────────── */}
          <aside style={{ borderRight: '1px solid var(--border)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

            {/* Panel header */}
            <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 8 }}>
              <Database size={13} color="var(--orange)" />
              <Label color="var(--orange)">Acumulado da sessão</Label>
            </div>

            {/* Equipe indicator */}
            <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)', background: 'var(--elevated)' }}>
              <Label>Equipe vinculada</Label>
              <p style={{ fontFamily: 'var(--font-head)', fontWeight: 900, fontSize: 20, color: '#fff', textTransform: 'uppercase', marginTop: 4, letterSpacing: '0.02em' }}>
                {usuario.equipe}
              </p>
            </div>

            {/* Metrics */}
            <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* Peso */}
              <div className="fade-up fade-up-1" style={{ background: 'var(--elevated)', border: '1px solid var(--border)', borderRadius: 10, padding: '16px 18px' }}>
                <Label>Peso total</Label>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginTop: 6 }}>
                  <span className="num-glow" style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: 36, color: '#fff', letterSpacing: '-0.02em' }}>
                    {pesoAcumulado.toFixed(2)}
                  </span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color: 'var(--muted)' }}>kg</span>
                </div>
              </div>

              {/* Valor */}
              <div className="fade-up fade-up-2" style={{ background: 'rgba(34,197,94,0.04)', border: '1px solid rgba(34,197,94,0.12)', borderRadius: 10, padding: '16px 18px' }}>
                <Label color="var(--green)">Valor bruto</Label>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginTop: 6 }}>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color: 'var(--green)', opacity: 0.7 }}>R$</span>
                  <span className="num-glow-green" style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: 36, color: 'var(--green)', letterSpacing: '-0.02em' }}>
                    {valorAcumulado.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>

            <Divider />

            {/* Leitura atual */}
            <div style={{ padding: 20, flex: 1, display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                <Camera size={12} color="var(--orange)" />
                <Label color="var(--orange)">Leitura atual</Label>
              </div>
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
                {data.itens_detalhados && data.itens_detalhados.length > 0 ? (
                  data.itens_detalhados.map((item, i) => (
                    <div key={i} style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      background: 'var(--elevated)', border: '1px solid var(--border)',
                      borderRadius: 8, padding: '8px 12px',
                    }}>
                      <span style={{ fontFamily: 'var(--font-head)', fontWeight: 700, fontSize: 14, color: '#fff', textTransform: 'uppercase' }}>
                        {item.quantidade}× {item.nome}
                      </span>
                      <div style={{
                        background: 'rgba(249,115,22,0.12)', border: '1px solid rgba(249,115,22,0.2)',
                        borderRadius: 4, padding: '2px 7px',
                        fontFamily: 'var(--font-mono)', fontSize: 10, fontWeight: 700, color: 'var(--orange)',
                      }}>
                        {item.confianca}%
                      </div>
                    </div>
                  ))
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, opacity: 0.35, marginTop: 4 }}>
                    <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--muted)' }} />
                    <span style={{ fontSize: 11, color: 'var(--muted)', fontFamily: 'var(--font-mono)' }}>aguardando itens…</span>
                  </div>
                )}
              </div>
            </div>
          </aside>

          {/* ── CENTER: VIDEO + CONTROLS ──────────────────────────── */}
          <main style={{ display: 'flex', flexDirection: 'column', padding: 24, gap: 16, background: 'var(--bg)' }}>

            {/* Video feed */}
            <div className="fade-up" style={{
              flex: 1, position: 'relative', background: '#000',
              borderRadius: 14, overflow: 'hidden',
              border: '1px solid var(--border)',
              boxShadow: isStreaming ? '0 0 40px rgba(249,115,22,0.08)' : 'none',
            }}>
              {/* Corner decorators */}
              {['top-left', 'top-right', 'bottom-left', 'bottom-right'].map(pos => {
                const [v, h] = pos.split('-');
                return (
                  <div key={pos} style={{
                    position: 'absolute', zIndex: 10,
                    [v]: 12, [h]: 12,
                    width: 18, height: 18,
                    borderColor: isStreaming ? 'var(--orange)' : 'var(--muted)',
                    borderStyle: 'solid', borderWidth: 0, opacity: 0.7,
                    ...(v === 'top'    && h === 'left'  ? { borderTopWidth: 2, borderLeftWidth: 2 }   : {}),
                    ...(v === 'top'    && h === 'right' ? { borderTopWidth: 2, borderRightWidth: 2 }  : {}),
                    ...(v === 'bottom' && h === 'left'  ? { borderBottomWidth: 2, borderLeftWidth: 2 } : {}),
                    ...(v === 'bottom' && h === 'right' ? { borderBottomWidth: 2, borderRightWidth: 2 } : {}),
                  }} />
                );
              })}

              {/* Status label overlay */}
              <div style={{
                position: 'absolute', top: 14, left: '50%', transform: 'translateX(-50%)',
                zIndex: 10, display: 'flex', alignItems: 'center', gap: 6,
                background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(6px)',
                border: `1px solid ${statusColor}30`, borderRadius: 20, padding: '4px 12px',
              }}>
                <span className="pulse-dot" style={{ width: 6, height: 6, borderRadius: '50%', background: statusColor }} />
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, fontWeight: 700, color: statusColor, letterSpacing: '0.15em' }}>
                  {statusLabel}
                </span>
              </div>

              {isStreaming ? (
                <img
                  src={`http://localhost:5000/video_feed?t=${Date.now()}`}
                  alt="Feed"
                  style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block' }}
                />
              ) : (
                <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12, opacity: 0.15 }}>
                  <Maximize2 size={52} color="#fff" />
                  <span style={{ fontFamily: 'var(--font-head)', fontWeight: 700, fontSize: 13, color: '#fff', textTransform: 'uppercase', letterSpacing: '0.15em' }}>
                    {isStreaming === null ? 'Conectando…' : 'Hardware desconectado'}
                  </span>
                </div>
              )}
            </div>

            {/* Controls row */}
            <div className="fade-up fade-up-3" style={{ display: 'flex', gap: 12, height: 60 }}>
              {/* Toggle button */}
              <button
                onClick={toggleHardware}
                disabled={isStreaming === null}
                className="btn-lift"
                style={{
                  flex: 1, borderRadius: 10, border: isStreaming ? '1px solid rgba(239,68,68,0.3)' : '1px solid rgba(249,115,22,0.3)',
                  background: isStreaming ? 'rgba(239,68,68,0.08)' : 'rgba(249,115,22,0.08)',
                  color: isStreaming ? 'var(--red)' : 'var(--orange)',
                  fontFamily: 'var(--font-head)', fontWeight: 800, fontSize: 14,
                  textTransform: 'uppercase', letterSpacing: '0.1em', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  opacity: isStreaming === null ? 0.4 : 1,
                  transition: 'background 0.15s, border-color 0.15s',
                }}>
                {isStreaming ? <WifiOff size={16} /> : <Wifi size={16} />}
                {isStreaming === null ? 'AGUARDE…' : isStreaming ? 'DESLIGAR CÂMERA' : 'LIGAR CÂMERA'}
              </button>

              {/* Save button */}
              <button
                onClick={salvarLote}
                disabled={data.peso <= 0 || salvando}
                className="btn-lift"
                style={{
                  flex: 1, borderRadius: 10, border: 'none',
                  background: data.peso > 0 && !salvando ? 'var(--orange)' : 'var(--elevated)',
                  color: data.peso > 0 && !salvando ? '#fff' : 'var(--muted)',
                  fontFamily: 'var(--font-head)', fontWeight: 800, fontSize: 14,
                  textTransform: 'uppercase', letterSpacing: '0.1em', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  boxShadow: data.peso > 0 && !salvando ? '0 4px 20px rgba(249,115,22,0.3)' : 'none',
                  transition: 'background 0.15s, box-shadow 0.15s, color 0.15s',
                }}>
                <Save size={16} />
                {salvando ? 'SALVANDO…' : 'SALVAR REGISTRO'}
              </button>
            </div>
          </main>

          {/* ── RIGHT PANEL: LOG ──────────────────────────────────── */}
          <aside style={{ borderLeft: '1px solid var(--border)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <ClipboardList size={13} color="var(--orange)" />
                <Label color="var(--orange)">Logs de produção</Label>
              </div>
              {historico.length > 0 && (
                <div style={{ background: 'var(--elevated)', borderRadius: 10, padding: '2px 8px', fontFamily: 'var(--font-mono)', fontSize: 10, fontWeight: 700, color: 'var(--muted)' }}>
                  {historico.length}
                </div>
              )}
            </div>

            <div className="thin-scroll" style={{ flex: 1, overflowY: 'auto', padding: '12px 12px' }}>
              {historico.length === 0 ? (
                <div style={{ textAlign: 'center', marginTop: 40, opacity: 0.3 }}>
                  <ClipboardList size={24} color="var(--muted)" />
                  <p style={{ fontSize: 10, color: 'var(--muted)', marginTop: 8, fontFamily: 'var(--font-mono)', lineHeight: 1.6 }}>
                    Nenhum registro<br />nesta sessão
                  </p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {historico.map((log, idx) => (
                    <div key={log.id} className="fade-up" style={{
                      background: 'var(--elevated)', border: '1px solid var(--border)',
                      borderLeft: '3px solid var(--orange)', borderRadius: 8, padding: '10px 12px',
                      animationDelay: `${idx * 0.04}s`,
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--muted)', fontWeight: 500 }}>
                          {log.hora}
                        </span>
                        <button onClick={() => removerRegistro(log)}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)', padding: 0, display: 'flex', alignItems: 'center', transition: 'color 0.1s' }}
                          onMouseEnter={e => e.currentTarget.style.color = 'var(--red)'}
                          onMouseLeave={e => e.currentTarget.style.color = 'var(--muted)'}
                        >
                          <Trash2 size={11} />
                        </button>
                      </div>

                      <p style={{ fontFamily: 'var(--font-head)', fontWeight: 800, fontSize: 13, color: '#fff', textTransform: 'uppercase', marginBottom: 4 }}>
                        {log.itens}
                      </p>

                      {log.alimentos?.length > 0 && (
                        <div style={{ marginBottom: 6, display: 'flex', flexDirection: 'column', gap: 2 }}>
                          {log.alimentos.map((al, i) => (
                            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10 }}>
                              <span style={{ color: 'var(--muted)', fontFamily: 'var(--font-mono)' }}>{al.nome}</span>
                              <span style={{ color: 'rgba(249,115,22,0.6)', fontFamily: 'var(--font-mono)', fontWeight: 700 }}>{al.confianca}%</span>
                            </div>
                          ))}
                        </div>
                      )}

                      <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--border)', paddingTop: 6, marginTop: 2 }}>
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 700, color: 'var(--muted)' }}>
                          {log.peso.toFixed(2)} kg
                        </span>
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 700, color: 'var(--green)' }}>
                          R$ {log.valor.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </aside>

        </div>
      </div>
    </>
  );
}

export default App;