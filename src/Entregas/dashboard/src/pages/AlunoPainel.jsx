// src/pages/AlunoPainel.js
import React, { useState, useEffect, useMemo } from 'react';
import { auth } from '../firebaseConfig';
import { signOut } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import GraficosTab from '../components/GraficosTab';

// ============================================================
// INJEÇÃO DE ESTILOS GLOBAIS E FONTES
// ============================================================
const injectGlobalStyles = () => {
  if (document.getElementById('aluno-painel-styles')) return;
  const style = document.createElement('style');
  style.id = 'aluno-painel-styles';
  style.textContent = `
    @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Sans:wght@300;400;500;600&display=swap');

    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
    @keyframes fadeSlideUp {
      from { opacity: 0; transform: translateY(18px); }
      to   { opacity: 1; transform: translateY(0); }
    }
    @keyframes barGrow {
      from { width: 0%; }
    }
    @keyframes pulse-dot {
      0%, 100% { opacity: 1; }
      50%       { opacity: 0.4; }
    }

    .ap-sidebar-btn { transition: background 0.2s, color 0.2s, transform 0.15s; }
    .ap-sidebar-btn:hover { transform: translateX(3px); }
    .ap-card { animation: fadeSlideUp 0.45s ease both; }
    .ap-card:nth-child(1) { animation-delay: 0.05s; }
    .ap-card:nth-child(2) { animation-delay: 0.12s; }
    .ap-card:nth-child(3) { animation-delay: 0.19s; }
    .ap-card:nth-child(4) { animation-delay: 0.26s; }
    .ap-summary-card { animation: fadeSlideUp 0.5s ease both; }
    .ap-summary-card:nth-child(1) { animation-delay: 0.08s; }
    .ap-summary-card:nth-child(2) { animation-delay: 0.16s; }
    .ap-summary-card:nth-child(3) { animation-delay: 0.24s; }
    .ap-summary-card:nth-child(4) { animation-delay: 0.32s; }
    .ap-bar-fill {
      animation: barGrow 0.8s cubic-bezier(0.4,0,0.2,1) both;
      animation-delay: 0.4s;
    }
    .ap-nav-item { transition: background 0.2s, color 0.2s; cursor: pointer; user-select: none; }
    .ap-nav-item:hover { background: rgba(255,255,255,0.07) !important; }
    .ap-table-row { transition: background 0.15s; }
    .ap-table-row:hover { background: rgba(134,188,118,0.05) !important; }
    .ap-logout:hover { background: #b71c1c !important; }
    .ap-toggle:hover { background: #e8f5e9 !important; }

    .ap-filter-input {
      background: rgba(134,188,118,0.06) !important;
      border: 1px solid rgba(134,188,118,0.2) !important;
      color: #e8f5e4 !important;
      border-radius: 8px; padding: 9px 12px; font-size: 12px;
      font-family: "DM Sans", sans-serif; outline: none;
      transition: border-color 0.2s, background 0.2s;
      width: 100%; box-sizing: border-box;
      appearance: none; -webkit-appearance: none;
      color-scheme: dark; -webkit-text-fill-color: #e8f5e4;
    }
    .ap-filter-input:focus {
      border-color: rgba(134,188,118,0.5) !important;
      background: rgba(134,188,118,0.1) !important;
    }
    .ap-filter-input option { background: #192118 !important; color: #e8f5e4 !important; }
    select.ap-filter-input { background-color: #192118 !important; }
    .ap-filter-input[type="date"] { background-color: #192118 !important; color: #e8f5e4 !important; }
    .ap-filter-input[type="date"]::-webkit-calendar-picker-indicator {
      filter: invert(0.7) sepia(1) saturate(2) hue-rotate(80deg); cursor: pointer; opacity: 0.7;
    }
    .ap-filter-input[type="number"] { background-color: #192118 !important; }
    .ap-filter-input[type="number"]::-webkit-inner-spin-button,
    .ap-filter-input[type="number"]::-webkit-outer-spin-button { opacity: 0.4; filter: invert(1); }
    .ap-filter-input::placeholder { color: rgba(138,171,128,0.45); }

    .ap-filter-chip {
      display: inline-flex; align-items: center; gap: 5px;
      padding: 4px 10px; border-radius: 20px; font-size: 11px; font-weight: 600;
      background: rgba(134,188,118,0.15); color: #86bc76;
      border: 1px solid rgba(134,188,118,0.25); cursor: pointer; transition: background 0.2s;
    }
    .ap-filter-chip:hover { background: rgba(134,188,118,0.25); }
    .ap-member-row:hover { background: rgba(134,188,118,0.05) !important; }
    .ap-select-wrap { position: relative; }
    .ap-select-wrap::after {
      content: '▾'; position: absolute; right: 10px; top: 50%;
      transform: translateY(-50%); color: rgba(134,188,118,0.5);
      font-size: 11px; pointer-events: none;
    }
  `;
  document.head.appendChild(style);
};

// ============================================================
// UTILITÁRIO DE FORMATAÇÃO NUMÉRICA
// ============================================================
const fmt = (n) => {
  if (n === null || n === undefined || isNaN(n)) return '0';
  const num = Number(n);
  return Number.isInteger(num) ? String(num) : num.toFixed(2);
};

// ============================================================
// PARSE DE DATA — suporta "DD/MM/YYYY HH:mm:ss", "DD/MM/YYYY" e ISO
// ✅ CORREÇÃO: new Date("DD/MM/YYYY") retorna Invalid Date no JS
// ============================================================
const parseData = (str) => {
  if (!str) return new Date(0);
  // Formato câmera/app: "DD/MM/YYYY HH:mm:ss" ou "DD/MM/YYYY"
  if (/^\d{2}\/\d{2}\/\d{4}/.test(str)) {
    const [datePart, timePart = '00:00:00'] = str.split(' ');
    const [dia, mes, ano] = datePart.split('/');
    return new Date(`${ano}-${mes}-${dia}T${timePart}`);
  }
  // Fallback para ISO ou outros formatos
  const d = new Date(str);
  return isNaN(d) ? new Date(0) : d;
};

// ============================================================
// NORMALIZAÇÃO DE ALIMENTOS
// ============================================================
const normalizarAlimento = (valor = '') => {
  const mapa = {
    'arroz':    'Arroz',
    'feijao':   'Feijão',
    'feijão':   'Feijão',
    'oleo':     'Óleo',
    'óleo':     'Óleo',
    'cafe':     'Café',
    'café':     'Café',
    'macarrao': 'Macarrão',
    'macarrão': 'Macarrão',
    'acucar':   'Açúcar',
    'açúcar':   'Açúcar',
  };
  const chave = valor.toLowerCase().trim();
  return mapa[chave] || valor;
};

// ============================================================
// TOKENS DE DESIGN
// ============================================================
const T = {
  bg:          '#0e1612',
  bgPanel:     '#141f18',
  bgCard:      '#192118',
  bgCardHover: '#1e2a20',
  border:      'rgba(134,188,118,0.12)',
  borderLight: 'rgba(134,188,118,0.22)',
  green:       '#86bc76',
  greenDim:    'rgba(134,188,118,0.15)',
  greenGlow:   'rgba(134,188,118,0.08)',
  teal:        '#4db8a4',
  tealDim:     'rgba(77,184,164,0.15)',
  amber:       '#f0a853',
  amberDim:    'rgba(240,168,83,0.15)',
  rose:        '#e87272',
  roseDim:     'rgba(232,114,114,0.15)',
  sapphire:    '#5b8ef0',
  sapphireDim: 'rgba(91,142,240,0.15)',
  textPrimary: '#e8f5e4',
  textSecond:  '#8aab80',
  textMuted:   '#4d6647',
  shadow:      '0 4px 24px rgba(0,0,0,0.45)',
  shadowSm:    '0 2px 8px rgba(0,0,0,0.3)',
  radius:      '14px',
  radiusSm:    '8px',
  fontDisplay: '"DM Serif Display", serif',
  fontBody:    '"DM Sans", sans-serif',
};

// ============================================================
// COMPONENTE PRINCIPAL
// ============================================================
const AlunoPainel = () => {
  const [user, setUser]                       = useState(null);
  const [minhaEquipe, setMinhaEquipe]         = useState('');
  const [loading, setLoading]                 = useState(true);
  const [todasDoacoes, setTodasDoacoes]       = useState([]);
  const [contagem, setContagem]               = useState([]);
  const [ranking, setRanking]                 = useState([]);
  const [metas, setMetas]                     = useState([]);
  const [totalArrecadado, setTotalArrecadado] = useState(0);
  const [sidebarAberta, setSidebarAberta]     = useState(true);
  const [abaAtiva, setAbaAtiva]               = useState('doacoes');
  const [membros, setMembros]                 = useState([]);

  const [filtroAlimento,   setFiltroAlimento]   = useState('');
  const [filtroMembro,     setFiltroMembro]     = useState('');
  const [filtroDataInicio, setFiltroDataInicio] = useState('');
  const [filtroDataFim,    setFiltroDataFim]    = useState('');
  const [filtroQtdMin,     setFiltroQtdMin]     = useState('');
  const [filtroOrigem,     setFiltroOrigem]     = useState('');

  const navigate = useNavigate();
  const alimentosLista = ['Arroz', 'Feijão', 'Óleo', 'Café', 'Macarrão', 'Açúcar'];

  useEffect(() => {
    injectGlobalStyles();
    const userData = JSON.parse(localStorage.getItem('user'));
    setUser(userData);
    setMinhaEquipe(userData.equipe);
    if (userData.equipe) carregarDados(userData.equipe);
  }, []);

  // ============================================================
  // CARREGAR DADOS
  // ============================================================
  const carregarDados = async (equipe) => {
    setLoading(true);
    try {
      const contagemQuery    = query(collection(db, 'contagem'), where('equipe', '==', equipe));
      const contagemSnapshot = await getDocs(contagemQuery);

      const rawDocs = [];

      contagemSnapshot.docs.forEach(doc => {
        const d        = doc.data();
        const ehCamera = Array.isArray(d.alimentos) && d.alimentos.length > 0;

        if (ehCamera) {
          d.alimentos.forEach((item, idx) => {
            rawDocs.push({
              id:           `${doc.id}_${idx}`,
              alimento:     normalizarAlimento(item.nome || ''),
              quantidade:   (item.quantidade || 0) * (item.peso || 1),
              usuarioNome:  d.usuarioNome  || d.usuarioEmail || '–',
              usuarioEmail: d.usuarioEmail || '–',
              dataRegistro: d.dataRegistro || '',
              equipe:       d.equipe       || '',
              origem:       'camera',
            });
          });
        } else {
          // ✅ CORREÇÃO: ignora docs do App sem dados essenciais
          if (!d.alimento && !d.equipe) return;

          rawDocs.push({
            id:           doc.id,
            ...d,
            alimento:     normalizarAlimento(d.alimento || ''),
            quantidade:   d.quantidade || 0,
            usuarioNome:  d.usuarioNome  || d.usuarioEmail || '–',
            usuarioEmail: d.usuarioEmail || '–',
            origem:       'app',
          });
        }
      });
      setTodasDoacoes(rawDocs);

      const alimentosMap = new Map();
      alimentosLista.forEach(a => alimentosMap.set(a, 0));
      rawDocs.forEach(d => {
        if (alimentosMap.has(d.alimento))
          alimentosMap.set(d.alimento, alimentosMap.get(d.alimento) + (d.quantidade || 0));
      });
      const contagemList = Array.from(alimentosMap.entries())
        .map(([nome, total]) => ({ nome, total }))
        .filter(i => i.total > 0)
        .sort((a, b) => b.total - a.total);
      setContagem(contagemList);
      setTotalArrecadado(contagemList.reduce((s, i) => s + i.total, 0));

      const todasContagens = await getDocs(collection(db, 'contagem'));
      const equipesMap = new Map();
      todasContagens.docs.forEach(doc => {
        const d  = doc.data();
        const eq = d.equipe || '';
        if (!eq) return;

        if (Array.isArray(d.alimentos) && d.alimentos.length > 0) {
          const total = d.alimentos.reduce((s, item) =>
            s + (item.quantidade || 0) * (item.peso || 1), 0);
          equipesMap.set(eq, (equipesMap.get(eq) || 0) + total);
        } else {
          equipesMap.set(eq, (equipesMap.get(eq) || 0) + (d.quantidade || 0));
        }
      });
      setRanking(
        Array.from(equipesMap.entries())
          .map(([nome, total]) => ({ nome, total }))
          .sort((a, b) => b.total - a.total)
      );

      const metasSnapshot = await getDocs(query(collection(db, 'metas'), where('equipe', '==', equipe)));
      setMetas(metasSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));

      let membrosData = [];
      try {
        const usersSnapshot = await getDocs(query(collection(db, 'users'), where('equipe', '==', equipe)));
        membrosData = usersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        if (membrosData.length === 0) {
          const allUsers    = await getDocs(collection(db, 'users'));
          const equipeLower = equipe.trim().toLowerCase();
          membrosData = allUsers.docs
            .map(doc => ({ id: doc.id, ...doc.data() }))
            .filter(u => (u.equipe || '').trim().toLowerCase() === equipeLower);
        }
      } catch (err) {
        console.error('Erro ao buscar membros:', err);
      }

      const membrosComTotal = membrosData.map(m => ({
        ...m,
        totalDoado: rawDocs
          .filter(d =>
            (d.usuarioNome  && m.nome  && d.usuarioNome.trim()  === m.nome.trim()) ||
            (d.usuarioUid   && m.uid   && d.usuarioUid          === m.uid) ||
            (d.usuarioEmail && m.email && d.usuarioEmail        === m.email)
          )
          .reduce((acc, d) => acc + (d.quantidade || 0), 0),
      })).sort((a, b) => b.totalDoado - a.totalDoado);
      setMembros(membrosComTotal);

    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      alert('Erro ao carregar dados');
    }
    setLoading(false);
  };

  const handleLogout = async () => {
    await signOut(auth);
    localStorage.removeItem('user');
    navigate('/');
  };

  // ── Filtragem ──────────────────────────────────────────────
  const doacoesFiltradas = useMemo(() => {
    return todasDoacoes.filter(d => {
      if (filtroAlimento && d.alimento !== filtroAlimento) return false;
      if (filtroMembro   && d.usuarioNome !== filtroMembro) return false;
      if (filtroOrigem   && d.origem !== filtroOrigem) return false;
      if (filtroQtdMin   && (d.quantidade || 0) < Number(filtroQtdMin)) return false;
      if (filtroDataInicio || filtroDataFim) {
        // ✅ CORREÇÃO: usa parseData em vez de new Date() direto
        const dataDoc = d.dataRegistro ? parseData(d.dataRegistro) : null;
        if (!dataDoc || dataDoc.getTime() === 0) return false;
        if (filtroDataInicio && dataDoc < new Date(filtroDataInicio)) return false;
        if (filtroDataFim) {
          const fim = new Date(filtroDataFim);
          fim.setHours(23, 59, 59, 999);
          if (dataDoc > fim) return false;
        }
      }
      return true;
    });
  }, [todasDoacoes, filtroAlimento, filtroMembro, filtroOrigem, filtroQtdMin, filtroDataInicio, filtroDataFim]);

  const contagemFiltrada = useMemo(() => {
    const alimentosMap = new Map();
    alimentosLista.forEach(a => alimentosMap.set(a, 0));
    doacoesFiltradas.forEach(d => {
      if (alimentosMap.has(d.alimento))
        alimentosMap.set(d.alimento, alimentosMap.get(d.alimento) + (d.quantidade || 0));
    });
    return Array.from(alimentosMap.entries())
      .map(([nome, total]) => ({ nome, total }))
      .filter(i => i.total > 0)
      .sort((a, b) => b.total - a.total);
  }, [doacoesFiltradas]);

  const filtrosAtivos    = filtroAlimento || filtroMembro || filtroQtdMin || filtroDataInicio || filtroDataFim || filtroOrigem;
  const contagemExibida  = filtrosAtivos ? contagemFiltrada : contagem;
  const totalFiltrado    = doacoesFiltradas.reduce((s, d) => s + (d.quantidade || 0), 0);

  const membrosNomes = useMemo(() => {
    const a = membros.map(m => m.nome).filter(Boolean);
    const b = [...new Set(todasDoacoes.map(d => d.usuarioNome).filter(n => n && n !== '–'))];
    return [...new Set([...a, ...b])].sort();
  }, [membros, todasDoacoes]);

  const limparFiltros = () => {
    setFiltroAlimento(''); setFiltroMembro(''); setFiltroDataInicio('');
    setFiltroDataFim(''); setFiltroQtdMin(''); setFiltroOrigem('');
  };

  const posicaoRanking   = ranking.findIndex(r => r.nome === minhaEquipe) + 1;
  const mediaPorAlimento = contagem.length > 0 ? fmt(totalArrecadado / contagem.length) : 0;

  if (loading) return <LoadingScreen />;

  const navItems = [
    { id: 'doacoes',  label: 'Doações',  icon: <IconBox /> },
    { id: 'graficos', label: 'Gráficos', icon: <IconChart /> },
    { id: 'metas',    label: 'Metas',    icon: <IconTarget /> },
    { id: 'ranking',  label: 'Ranking',  icon: <IconTrophy /> },
    { id: 'equipe',   label: 'Equipe',   icon: <IconUsers /> },
  ];

  const summaryCards = [
    { label: 'Total arrecadado',   value: `${fmt(totalArrecadado)} kg`,      accent: T.green,    bg: T.greenDim },
    { label: 'Posição no ranking', value: `${posicaoRanking || '–'}º lugar`, accent: T.sapphire, bg: T.sapphireDim },
    { label: 'Metas cadastradas',  value: metas.length,                       accent: T.amber,    bg: T.amberDim },
    { label: 'Média por alimento', value: `${mediaPorAlimento} kg`,           accent: T.teal,     bg: T.tealDim },
  ];

  const outrasEquipes = ranking.filter(r => r.nome !== minhaEquipe);
  const mediaOutras   = outrasEquipes.length > 0
    ? outrasEquipes.reduce((s, r) => s + r.total, 0) / outrasEquipes.length : 0;
  const minhaTotal    = ranking.find(r => r.nome === minhaEquipe)?.total || 0;
  const liderTotal    = ranking[0]?.total || 1;
  const topDoador     = membros.find(m => m.totalDoado > 0);
  const rankingCount  = ranking.length;
  const rankingTitle  = rankingCount <= 3
    ? `Top ${rankingCount} equipe${rankingCount !== 1 ? 's' : ''}`
    : `Top ${Math.min(rankingCount, 5)} equipes`;

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: T.bg, fontFamily: T.fontBody, color: T.textPrimary }}>

      {/* ── SIDEBAR ── */}
      <aside style={{
        width: sidebarAberta ? 248 : 72, minHeight: '100vh',
        background: T.bgPanel, borderRight: `1px solid ${T.border}`,
        display: 'flex', flexDirection: 'column', padding: '28px 14px 24px', gap: 8,
        transition: 'width 0.3s cubic-bezier(0.4,0,0.2,1)',
        position: 'relative', zIndex: 10, flexShrink: 0,
        boxShadow: '4px 0 32px rgba(0,0,0,0.3)',
      }}>
        <button className="ap-toggle" onClick={() => setSidebarAberta(!sidebarAberta)} style={{
          position: 'absolute', right: -14, top: 32,
          width: 28, height: 28, borderRadius: '50%',
          background: T.bgCard, border: `1px solid ${T.borderLight}`,
          color: T.green, cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 11, fontWeight: 700, boxShadow: T.shadowSm, zIndex: 20,
        }}>
          {sidebarAberta ? '‹' : '›'}
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, paddingBottom: 24, borderBottom: `1px solid ${T.border}`, marginBottom: 8 }}>
          <div style={{
            width: 38, height: 38, borderRadius: 10,
            background: `linear-gradient(135deg, ${T.green}, ${T.teal})`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 13, fontWeight: 700, color: '#0e1612', flexShrink: 0,
            boxShadow: `0 0 16px ${T.greenDim}`,
          }}>LE</div>
          {sidebarAberta && (
            <div style={{ fontFamily: T.fontDisplay, fontSize: 14, color: T.textPrimary, lineHeight: 1, whiteSpace: 'nowrap' }}>
              Lideranças <span style={{ fontStyle: 'italic', color: T.textSecond }}>Empáticas</span>
            </div>
          )}
        </div>

        <div style={{
          background: T.greenGlow, borderRadius: T.radius, border: `1px solid ${T.border}`,
          padding: sidebarAberta ? '16px 14px' : '12px 0',
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, marginBottom: 8,
        }}>
          <div style={{
            width: 44, height: 44, borderRadius: '50%',
            background: `linear-gradient(135deg, ${T.green}, ${T.teal})`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 18, fontWeight: 700, color: '#0e1612',
            boxShadow: `0 0 20px rgba(134,188,118,0.3)`,
          }}>
            {user?.nome?.charAt(0).toUpperCase()}
          </div>
          {sidebarAberta && (
            <>
              <span style={{ fontWeight: 600, fontSize: 13, color: T.textPrimary, textAlign: 'center', lineHeight: 1.3 }}>{user?.nome}</span>
              <span style={{
                background: T.greenDim, color: T.green, padding: '3px 10px', borderRadius: 20,
                fontSize: 10, fontWeight: 600, letterSpacing: '0.5px', border: `1px solid rgba(134,188,118,0.25)`,
              }}>{minhaEquipe}</span>
            </>
          )}
        </div>

        <nav style={{ display: 'flex', flexDirection: 'column', gap: 3, flex: 1 }}>
          {navItems.map(item => {
            const active = abaAtiva === item.id;
            return (
              <button key={item.id} className="ap-nav-item ap-sidebar-btn" onClick={() => setAbaAtiva(item.id)} style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: sidebarAberta ? '11px 14px' : '11px 0',
                justifyContent: sidebarAberta ? 'flex-start' : 'center',
                border: 'none', borderRadius: T.radiusSm, cursor: 'pointer',
                background: active ? T.greenDim : 'transparent',
                color: active ? T.green : T.textSecond,
                fontSize: 13, fontWeight: active ? 600 : 400, width: '100%',
                borderLeft: active ? `3px solid ${T.green}` : '3px solid transparent',
              }}>
                <span style={{ flexShrink: 0, opacity: active ? 1 : 0.6 }}>{item.icon}</span>
                {sidebarAberta && <span>{item.label}</span>}
              </button>
            );
          })}
        </nav>

        <button className="ap-logout" onClick={handleLogout} style={{
          display: 'flex', alignItems: 'center', justifyContent: sidebarAberta ? 'flex-start' : 'center',
          gap: 10, padding: sidebarAberta ? '11px 14px' : '11px 0',
          background: 'rgba(232,114,114,0.1)', border: '1px solid rgba(232,114,114,0.2)',
          borderRadius: T.radiusSm, color: T.rose, cursor: 'pointer',
          fontSize: 13, fontWeight: 500, width: '100%', transition: 'background 0.2s',
        }}>
          <IconLogout />
          {sidebarAberta && <span>Sair</span>}
        </button>
      </aside>

      {/* ── MAIN ── */}
      <main style={{ flex: 1, padding: '36px 40px', overflowY: 'auto', minWidth: 0 }}>

        {/* Header */}
        <div style={{ marginBottom: 36, animation: 'fadeSlideUp 0.4s ease both' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: T.green, animation: 'pulse-dot 2s ease infinite' }} />
            <span style={{ fontSize: 11, color: T.textSecond, fontWeight: 500, letterSpacing: '1px', textTransform: 'uppercase' }}>Painel do Aluno</span>
          </div>
          <h1 style={{ fontFamily: T.fontDisplay, fontSize: 34, fontWeight: 400, color: T.textPrimary, margin: 0, lineHeight: 1.1 }}>
            Olá, {user?.nome?.split(' ')[0]} <span style={{ fontStyle: 'italic', color: T.green }}>👋</span>
          </h1>
          <p style={{ margin: '6px 0 0', color: T.textSecond, fontSize: 14 }}>
            Acompanhe o desempenho da <strong style={{ color: T.green }}>{minhaEquipe}</strong>
          </p>
        </div>

        {/* Summary cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 32 }}>
          {summaryCards.map((card, i) => (
            <div key={i} className="ap-summary-card" style={{
              background: card.bg, border: `1px solid ${card.accent}22`,
              borderRadius: T.radius, padding: '20px 22px', position: 'relative', overflow: 'hidden',
            }}>
              <div style={{ position: 'absolute', top: -20, right: -20, width: 80, height: 80, borderRadius: '50%', background: `radial-gradient(circle, ${card.accent}18, transparent 70%)` }} />
              <div style={{ fontSize: 10, color: card.accent, fontWeight: 600, letterSpacing: '1px', textTransform: 'uppercase', marginBottom: 10 }}>{card.label}</div>
              <div style={{ fontSize: 28, fontFamily: T.fontDisplay, fontWeight: 400, color: T.textPrimary, lineHeight: 1 }}>{card.value}</div>
            </div>
          ))}
        </div>

        {/* ── ABA DOAÇÕES ── */}
        {abaAtiva === 'doacoes' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

            <Card title="Filtros" className="ap-card">
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 14, alignItems: 'end' }}>
                <div>
                  <label style={labelStyle}>Alimento</label>
                  <div className="ap-select-wrap">
                    <select className="ap-filter-input" value={filtroAlimento} onChange={e => setFiltroAlimento(e.target.value)} style={{ backgroundColor: '#192118', color: '#e8f5e4' }}>
                      <option value="">Todos</option>
                      {alimentosLista.map(a => <option key={a} value={a}>{a}</option>)}
                    </select>
                  </div>
                </div>
                <div>
                  <label style={labelStyle}>Membro</label>
                  <div className="ap-select-wrap">
                    <select className="ap-filter-input" value={filtroMembro} onChange={e => setFiltroMembro(e.target.value)} style={{ backgroundColor: '#192118', color: '#e8f5e4' }}>
                      <option value="">Todos</option>
                      {membrosNomes.map(n => <option key={n} value={n}>{n}</option>)}
                    </select>
                  </div>
                </div>
                <div>
                  <label style={labelStyle}>Origem</label>
                  <div className="ap-select-wrap">
                    <select className="ap-filter-input" value={filtroOrigem} onChange={e => setFiltroOrigem(e.target.value)} style={{ backgroundColor: '#192118', color: '#e8f5e4' }}>
                      <option value="">Todas</option>
                      <option value="app">App</option>
                      <option value="camera">Câmera</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label style={labelStyle}>Data início</label>
                  <input type="date" className="ap-filter-input" value={filtroDataInicio} onChange={e => setFiltroDataInicio(e.target.value)} style={{ backgroundColor: '#192118', color: '#e8f5e4' }} />
                </div>
                <div>
                  <label style={labelStyle}>Data fim</label>
                  <input type="date" className="ap-filter-input" value={filtroDataFim} onChange={e => setFiltroDataFim(e.target.value)} style={{ backgroundColor: '#192118', color: '#e8f5e4' }} />
                </div>
                <div>
                  <label style={labelStyle}>Qtd. mínima (kg)</label>
                  <input type="number" className="ap-filter-input" placeholder="Ex: 5" value={filtroQtdMin} onChange={e => setFiltroQtdMin(e.target.value)} min="0" style={{ backgroundColor: '#192118', color: '#e8f5e4' }} />
                </div>
              </div>

              {filtrosAtivos && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 14, flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 11, color: T.textMuted }}>Filtros ativos:</span>
                  {filtroAlimento   && <span className="ap-filter-chip" onClick={() => setFiltroAlimento('')}>{filtroAlimento} ×</span>}
                  {filtroMembro     && <span className="ap-filter-chip" onClick={() => setFiltroMembro('')}>{filtroMembro} ×</span>}
                  {filtroOrigem     && <span className="ap-filter-chip" onClick={() => setFiltroOrigem('')}>{filtroOrigem === 'camera' ? 'Câmera' : 'App'} ×</span>}
                  {filtroDataInicio && <span className="ap-filter-chip" onClick={() => setFiltroDataInicio('')}>De: {filtroDataInicio} ×</span>}
                  {filtroDataFim    && <span className="ap-filter-chip" onClick={() => setFiltroDataFim('')}>Até: {filtroDataFim} ×</span>}
                  {filtroQtdMin     && <span className="ap-filter-chip" onClick={() => setFiltroQtdMin('')}>Min: {filtroQtdMin}kg ×</span>}
                  <button onClick={limparFiltros} style={{
                    marginLeft: 'auto', background: 'transparent', border: `1px solid ${T.rose}44`,
                    color: T.rose, borderRadius: 8, padding: '4px 12px', fontSize: 11,
                    cursor: 'pointer', fontFamily: T.fontBody,
                  }}>Limpar tudo</button>
                  <span style={{ fontSize: 11, color: T.textMuted }}>{doacoesFiltradas.length} registro(s) · {fmt(totalFiltrado)} kg</span>
                </div>
              )}
            </Card>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
              <Card title={filtrosAtivos ? 'Doações por alimento (filtrado)' : 'Doações por alimento'} className="ap-card">
                {contagemExibida.length === 0
                  ? <EmptyState text="Nenhuma doação encontrada com estes filtros." />
                  : contagemExibida.map(item => {
                      const pct = (item.total / Math.max(...contagemExibida.map(c => c.total))) * 100;
                      return (
                        <div key={item.nome} style={{ marginBottom: 18 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 7, fontSize: 13 }}>
                            <span style={{ color: T.textPrimary, fontWeight: 500 }}>{item.nome}</span>
                            <span style={{ color: T.green, fontWeight: 600 }}>{fmt(item.total)} kg</span>
                          </div>
                          <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: 6, height: 7, overflow: 'hidden' }}>
                            <div className="ap-bar-fill" style={{ width: `${pct}%`, background: `linear-gradient(90deg, ${T.green}, ${T.teal})`, height: '100%', borderRadius: 6 }} />
                          </div>
                        </div>
                      );
                    })
                }
              </Card>

              <Card title={filtroAlimento ? `Progresso das metas (${filtroAlimento})` : 'Progresso das metas'} className="ap-card">
                {metas.length === 0
                  ? <EmptyState text="Nenhuma meta cadastrada." />
                  : metas.filter(meta => !filtroAlimento || meta.alimento === filtroAlimento).map(meta => {
                      const atual    = contagem.find(c => c.nome === meta.alimento)?.total || 0;
                      const pct      = meta.quantidadeKg > 0 ? (atual / meta.quantidadeKg) * 100 : 0;
                      const pctClamp = Math.min(pct, 100);
                      const barColor = pct >= 100 ? T.green : pct >= 50 ? T.amber : T.rose;
                      return (
                        <div key={meta.id} style={{ marginBottom: 22 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 7, fontSize: 13 }}>
                            <span style={{ color: T.textPrimary, fontWeight: 500 }}>{meta.alimento}</span>
                            <span style={{ color: barColor, fontWeight: 700 }}>{fmt(pct)}%</span>
                          </div>
                          <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: 6, height: 6, overflow: 'hidden', marginBottom: 5 }}>
                            <div className="ap-bar-fill" style={{ width: `${pctClamp}%`, background: barColor, height: '100%', borderRadius: 6 }} />
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: T.textMuted }}>
                            <span>{fmt(atual)} kg arrecadados</span>
                            <span>Meta: {fmt(meta.quantidadeKg)} kg</span>
                          </div>
                        </div>
                      );
                    })
                }
              </Card>

              <div style={{ gridColumn: 'span 2' }}>
                <Card title={filtrosAtivos ? `Registros filtrados (${doacoesFiltradas.length})` : 'Últimas doações'} className="ap-card">
                  {doacoesFiltradas.length === 0
                    ? <EmptyState text="Nenhuma doação encontrada com estes filtros." />
                    : (
                      <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                          <thead>
                            <tr>
                              {['Alimento', 'Quantidade (kg)', 'Doador', 'Email', 'Origem', 'Data'].map(h => (
                                <th key={h} style={{ textAlign: 'left', padding: '10px 14px', borderBottom: `1px solid ${T.border}`, fontSize: 11, fontWeight: 600, color: T.textMuted, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{h}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {[...doacoesFiltradas]
                              // ✅ CORREÇÃO: usa parseData para ordenar corretamente datas no formato DD/MM/YYYY
                              .sort((a, b) => parseData(b.dataRegistro) - parseData(a.dataRegistro))
                              .slice(0, filtrosAtivos ? undefined : 10)
                              .map(doc => (
                                <tr key={doc.id} className="ap-table-row">
                                  <td style={td}>{doc.alimento || '–'}</td>
                                  <td style={td}><strong style={{ color: T.green }}>{fmt(doc.quantidade)} kg</strong></td>
                                  <td style={td}>{doc.usuarioNome || '–'}</td>
                                  <td style={{ ...td, color: T.textMuted, fontSize: 11 }}>{doc.usuarioEmail || '–'}</td>
                                  <td style={td}>
                                    <span style={{
                                      fontSize: 10, fontWeight: 600, padding: '3px 8px', borderRadius: 20,
                                      background: doc.origem === 'camera' ? T.sapphireDim : T.greenDim,
                                      color: doc.origem === 'camera' ? T.sapphire : T.green,
                                      border: `1px solid ${doc.origem === 'camera' ? T.sapphire : T.green}33`,
                                    }}>
                                      {doc.origem === 'camera' ? 'Câmera' : 'App'}
                                    </span>
                                  </td>
                                  <td style={{ ...td, color: T.textMuted }}>{doc.dataRegistro}</td>
                                </tr>
                              ))
                            }
                          </tbody>
                        </table>
                      </div>
                    )
                  }
                </Card>
              </div>
            </div>
          </div>
        )}

        {/* ── ABA GRÁFICOS ── */}
        {abaAtiva === 'graficos' && (
          <GraficosTab contagem={contagem} metas={metas} minhaEquipe={minhaEquipe} ranking={ranking} />
        )}

        {/* ── ABA METAS ── */}
        {abaAtiva === 'metas' && (
          <Card title={`Metas da ${minhaEquipe}`} className="ap-card">
            {metas.length === 0
              ? <EmptyState text="Nenhuma meta cadastrada." />
              : (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr>
                        {['Alimento', 'Meta (kg)', 'Arrecadado (kg)', 'Progresso', 'Status', 'Data Limite'].map(h => (
                          <th key={h} style={{ textAlign: 'left', padding: '10px 14px', borderBottom: `1px solid ${T.border}`, fontSize: 11, fontWeight: 600, color: T.textMuted, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {metas.map(meta => {
                        const atual  = contagem.find(c => c.nome === meta.alimento)?.total || 0;
                        const pct    = meta.quantidadeKg > 0 ? (atual / meta.quantidadeKg) * 100 : 0;
                        const isOpen = meta.status === 'em_aberto';
                        return (
                          <tr key={meta.id} className="ap-table-row">
                            <td style={td}><strong style={{ color: T.textPrimary }}>{meta.alimento}</strong></td>
                            <td style={td}>{fmt(meta.quantidadeKg)}</td>
                            <td style={td}>{fmt(atual)}</td>
                            <td style={td}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                <div style={{ flex: 1, background: 'rgba(255,255,255,0.06)', borderRadius: 4, height: 6, overflow: 'hidden', minWidth: 80 }}>
                                  <div style={{ width: `${Math.min(pct, 100)}%`, background: `linear-gradient(90deg, ${T.green}, ${T.teal})`, height: '100%', borderRadius: 4 }} />
                                </div>
                                <span style={{ fontSize: 12, color: T.textSecond, flexShrink: 0 }}>{fmt(pct)}%</span>
                              </div>
                            </td>
                            <td style={td}>
                              <span style={{
                                padding: '4px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600,
                                background: isOpen ? T.amberDim : T.greenDim,
                                color: isOpen ? T.amber : T.green,
                                border: `1px solid ${isOpen ? T.amber : T.green}33`,
                              }}>
                                {isOpen ? 'Em aberto' : 'Encerrada'}
                              </span>
                            </td>
                            <td style={{ ...td, color: T.textSecond }}>{meta.dataLimite || '–'}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )
            }
          </Card>
        )}

        {/* ── ABA RANKING ── */}
        {abaAtiva === 'ranking' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
              <Card title="Comparativo com outras equipes" className="ap-card">
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  {[
                    { label: `${minhaEquipe} (você)`, val: minhaTotal, color: T.green, bar: `linear-gradient(90deg, ${T.green}, ${T.teal})` },
                    { label: 'Média das outras equipes', val: mediaOutras, color: T.textSecond, bar: T.sapphire },
                    ...(ranking[0] && ranking[0].nome !== minhaEquipe ? [{ label: `🥇 ${ranking[0].nome} (líder)`, val: ranking[0].total, color: T.amber, bar: T.amber }] : []),
                  ].map(({ label, val, color, bar }) => (
                    <div key={label}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: 13 }}>
                        <span style={{ color }}>{label}</span>
                        <span style={{ color, fontWeight: 600 }}>{fmt(val)} kg</span>
                      </div>
                      <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: 6, height: 8, overflow: 'hidden' }}>
                        <div style={{ width: `${liderTotal > 0 ? (val / liderTotal) * 100 : 0}%`, background: bar, height: '100%', borderRadius: 6, opacity: color === T.textSecond ? 0.7 : 1 }} />
                      </div>
                    </div>
                  ))}
                  <div style={{ padding: '12px 16px', background: minhaTotal >= mediaOutras ? T.greenDim : T.roseDim, borderRadius: T.radiusSm, border: `1px solid ${minhaTotal >= mediaOutras ? T.green : T.rose}33` }}>
                    <span style={{ fontSize: 12, color: minhaTotal >= mediaOutras ? T.green : T.rose }}>
                      {minhaTotal >= mediaOutras
                        ? `✓ Sua equipe está ${fmt(minhaTotal - mediaOutras)} kg acima da média!`
                        : `Faltam ${fmt(mediaOutras - minhaTotal)} kg para atingir a média.`}
                    </span>
                    {ranking[0]?.total > minhaTotal && (
                      <div style={{ fontSize: 11, color: T.textMuted, marginTop: 4 }}>
                        Para liderar: faltam {fmt(ranking[0].total - minhaTotal)} kg
                      </div>
                    )}
                  </div>
                </div>
              </Card>

              <Card title={rankingTitle} className="ap-card">
                {ranking.slice(0, 5).map((equipe, idx) => {
                  const isMe   = equipe.nome === minhaEquipe;
                  const medals = ['🥇', '🥈', '🥉'];
                  const pct    = liderTotal > 0 ? (equipe.total / liderTotal) * 100 : 0;
                  return (
                    <div key={equipe.nome} style={{ marginBottom: 14, padding: '10px 12px', borderRadius: T.radiusSm, background: isMe ? T.greenDim : 'transparent', border: isMe ? `1px solid ${T.green}22` : '1px solid transparent' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: 13 }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span>{medals[idx] || `${idx + 1}º`}</span>
                          <span style={{ color: isMe ? T.green : T.textPrimary, fontWeight: isMe ? 600 : 400 }}>{equipe.nome}</span>
                          {isMe && <span style={{ fontSize: 10, background: T.greenDim, color: T.green, padding: '1px 7px', borderRadius: 10, border: `1px solid ${T.green}33` }}>você</span>}
                        </span>
                        <span style={{ color: isMe ? T.green : T.textSecond, fontWeight: 600 }}>{fmt(equipe.total)} kg</span>
                      </div>
                      <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: 4, height: 4, overflow: 'hidden' }}>
                        <div style={{ width: `${pct}%`, background: isMe ? `linear-gradient(90deg, ${T.green}, ${T.teal})` : T.sapphire, height: '100%', borderRadius: 4, opacity: isMe ? 1 : 0.5 }} />
                      </div>
                    </div>
                  );
                })}
              </Card>
            </div>

            <Card title="Ranking Geral" className="ap-card">
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr>
                      {['Pos.', 'Equipe', 'Total (kg)', 'vs. Média'].map(h => (
                        <th key={h} style={{ textAlign: 'left', padding: '10px 14px', borderBottom: `1px solid ${T.border}`, fontSize: 11, fontWeight: 600, color: T.textMuted, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {ranking.map((equipe, idx) => {
                      const isMe       = equipe.nome === minhaEquipe;
                      const medals     = ['🥇', '🥈', '🥉'];
                      const mediaGeral = ranking.length > 0
                        ? ranking.reduce((s, r) => s + r.total, 0) / ranking.length
                        : 0;
                      const diff = equipe.total - mediaGeral;
                      return (
                        <tr key={equipe.nome} className="ap-table-row" style={{ background: isMe ? T.greenDim : 'transparent' }}>
                          <td style={td}><span style={{ fontFamily: T.fontDisplay, fontSize: 17, color: idx < 3 ? T.amber : T.textSecond }}>{medals[idx] || `${idx + 1}º`}</span></td>
                          <td style={td}>
                            <span style={{ color: isMe ? T.green : T.textPrimary, fontWeight: isMe ? 600 : 400 }}>{equipe.nome}</span>
                            {isMe && <span style={{ marginLeft: 8, fontSize: 10, background: T.greenDim, color: T.green, padding: '2px 8px', borderRadius: 12, border: `1px solid ${T.green}33`, fontWeight: 600 }}>você</span>}
                          </td>
                          <td style={td}><strong style={{ color: isMe ? T.green : T.textPrimary }}>{fmt(equipe.total)} kg</strong></td>
                          <td style={td}>
                            <span style={{ fontSize: 12, color: diff >= 0 ? T.green : T.rose, fontWeight: 600 }}>
                              {diff >= 0 ? '+' : ''}{fmt(diff)} kg
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>
        )}

        {/* ── ABA EQUIPE ── */}
        {abaAtiva === 'equipe' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
              <div style={{ background: T.greenDim, border: `1px solid ${T.green}22`, borderRadius: T.radius, padding: '20px 22px' }}>
                <div style={{ fontSize: 10, color: T.green, fontWeight: 600, letterSpacing: '1px', textTransform: 'uppercase', marginBottom: 8 }}>Membros ativos</div>
                <div style={{ fontSize: 32, fontFamily: T.fontDisplay, color: T.textPrimary }}>{membros.length}</div>
              </div>
              <div style={{ background: T.tealDim, border: `1px solid ${T.teal}22`, borderRadius: T.radius, padding: '20px 22px' }}>
                <div style={{ fontSize: 10, color: T.teal, fontWeight: 600, letterSpacing: '1px', textTransform: 'uppercase', marginBottom: 8 }}>Top doador</div>
                {topDoador
                  ? <><div style={{ fontSize: 20, fontFamily: T.fontDisplay, color: T.textPrimary }}>{topDoador.nome?.split(' ')[0]}</div><div style={{ fontSize: 12, color: T.teal, marginTop: 4 }}>{fmt(topDoador.totalDoado)} kg</div></>
                  : <div style={{ fontSize: 14, color: T.textMuted, marginTop: 4 }}>Nenhuma doação ainda</div>
                }
              </div>
              <div style={{ background: T.amberDim, border: `1px solid ${T.amber}22`, borderRadius: T.radius, padding: '20px 22px' }}>
                <div style={{ fontSize: 10, color: T.amber, fontWeight: 600, letterSpacing: '1px', textTransform: 'uppercase', marginBottom: 8 }}>Média por membro</div>
                <div style={{ fontSize: 32, fontFamily: T.fontDisplay, color: T.textPrimary }}>{membros.length > 0 ? fmt(totalArrecadado / membros.length) : 0} kg</div>
              </div>
            </div>

            <Card title={`Membros da ${minhaEquipe}`} className="ap-card">
              {membros.length === 0
                ? <EmptyState text="Nenhum membro encontrado." />
                : (() => {
                    const totalMembros = membros.reduce((s, m) => s + m.totalDoado, 0);
                    const naoAtribuido = totalArrecadado - totalMembros;
                    return (
                      <>
                        <div style={{ overflowX: 'auto' }}>
                          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                              <tr>
                                {['#', 'Nome', 'Email', 'Total doado (kg)'].map(h => (
                                  <th key={h} style={{ textAlign: 'left', padding: '10px 14px', borderBottom: `1px solid ${T.border}`, fontSize: 11, fontWeight: 600, color: T.textMuted, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{h}</th>
                                ))}
                              </tr>
                            </thead>
                            <tbody>
                              {membros.map((membro, idx) => {
                                const isMe  = membro.email === user?.email;
                                const isTop = idx === 0 && membro.totalDoado > 0;
                                return (
                                  <tr key={membro.id} className="ap-member-row" style={{ background: isMe ? T.greenDim : 'transparent', transition: 'background 0.15s' }}>
                                    <td style={td}>
                                      <div style={{ width: 30, height: 30, borderRadius: '50%', background: isTop ? `linear-gradient(135deg, ${T.amber}, #f5d07a)` : `linear-gradient(135deg, ${T.green}, ${T.teal})`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: '#0e1612' }}>
                                        {membro.nome?.charAt(0).toUpperCase()}
                                      </div>
                                    </td>
                                    <td style={td}>
                                      <span style={{ color: isMe ? T.green : T.textPrimary, fontWeight: isMe ? 600 : 400 }}>{membro.nome}</span>
                                      {isMe && <span style={{ marginLeft: 8, fontSize: 10, background: T.greenDim, color: T.green, padding: '2px 8px', borderRadius: 10, border: `1px solid ${T.green}33` }}>você</span>}
                                      {isTop && !isMe && <span style={{ marginLeft: 8, fontSize: 10, background: T.amberDim, color: T.amber, padding: '2px 8px', borderRadius: 10, border: `1px solid ${T.amber}33` }}>top 1</span>}
                                    </td>
                                    <td style={{ ...td, color: T.textMuted }}>{membro.email}</td>
                                    <td style={td}><strong style={{ color: membro.totalDoado > 0 ? T.green : T.textMuted }}>{fmt(membro.totalDoado)} kg</strong></td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>

                        {naoAtribuido > 0.01 && (
                          <div style={{
                            marginTop: 16, padding: '10px 14px',
                            background: T.amberDim, border: `1px solid ${T.amber}33`,
                            borderRadius: T.radiusSm, fontSize: 12, color: T.amber,
                          }}>
                            Devido a testes iniciais, <strong>{fmt(naoAtribuido)} kg</strong> registrados no sistema permanecem sem atribuição a membros cadastrados.
                          </div>
                        )}
                      </>
                    );
                  })()
              }
            </Card>
          </div>
        )}
      </main>
    </div>
  );
};

// ── Estilos auxiliares ──────────────────────────────────────
const td = {
  padding: '13px 14px',
  borderBottom: '1px solid rgba(134,188,118,0.07)',
  fontSize: 13,
  color: '#8aab80',
};
const labelStyle = {
  display: 'block', fontSize: 10, fontWeight: 600, color: '#4d6647',
  textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 6,
};

// ============================================================
// SUB-COMPONENTES
// ============================================================
const Card = ({ title, children, className = '' }) => (
  <div className={className} style={{ background: '#192118', border: '1px solid rgba(134,188,118,0.12)', borderRadius: 14, padding: '24px 26px', boxShadow: '0 4px 24px rgba(0,0,0,0.3)' }}>
    <h2 style={{ fontFamily: '"DM Serif Display", serif', fontSize: 17, fontWeight: 400, color: '#e8f5e4', margin: '0 0 22px', paddingBottom: 14, borderBottom: '1px solid rgba(134,188,118,0.1)', display: 'flex', alignItems: 'center', gap: 10 }}>
      <span style={{ display: 'block', width: 3, height: 18, background: 'linear-gradient(180deg, #86bc76, #4db8a4)', borderRadius: 2, flexShrink: 0 }} />
      {title}
    </h2>
    {children}
  </div>
);

const EmptyState = ({ text }) => (
  <div style={{ textAlign: 'center', padding: '48px 20px', color: '#4d6647', fontSize: 13 }}>
    <div style={{ fontSize: 32, marginBottom: 12, opacity: 0.5 }}>🌿</div>
    {text}
  </div>
);

const LoadingScreen = () => {
  useEffect(() => { injectGlobalStyles(); }, []);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#0e1612', gap: 16, fontFamily: '"DM Sans", sans-serif' }}>
      <div style={{ width: 44, height: 44, border: '3px solid rgba(134,188,118,0.15)', borderTop: '3px solid #86bc76', borderRadius: '50%', animation: 'spin 0.9s linear infinite' }} />
      <p style={{ color: '#4d6647', fontSize: 13, margin: 0 }}>Carregando dados…</p>
    </div>
  );
};

// ── Ícones ──────────────────────────────────────────────────
const IconBox = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
  </svg>
);
const IconTarget = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/>
  </svg>
);
const IconTrophy = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/>
    <path d="M4 22h16"/>
    <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/>
    <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/>
    <path d="M18 2H6v7a6 6 0 0 0 12 0V2z"/>
  </svg>
);
const IconLogout = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
    <polyline points="16,17 21,12 16,7"/><line x1="21" y1="12" x2="9" y2="12"/>
  </svg>
);
const IconChart = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="20" x2="18" y2="10"/>
    <line x1="12" y1="20" x2="12" y2="4"/>
    <line x1="6" y1="20" x2="6" y2="14"/>
    <line x1="2" y1="20" x2="22" y2="20"/>
  </svg>
);
const IconUsers = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
    <circle cx="9" cy="7" r="4"/>
    <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
    <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
  </svg>
);

export default AlunoPainel;