// src/pages/AdminPainel.js
import React, { useState, useEffect, useMemo } from 'react';
import { auth } from '../firebaseConfig';
import { signOut } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import {
  collection, getDocs, query, where,
  addDoc, updateDoc, deleteDoc, doc, serverTimestamp,
} from 'firebase/firestore';
import { db } from '../firebaseConfig';

// ============================================================
// INJEÇÃO DE ESTILOS GLOBAIS E FONTES
// ============================================================
const injectGlobalStyles = () => {
  if (document.getElementById('admin-painel-styles')) return;
  const style = document.createElement('style');
  style.id = 'admin-painel-styles';
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
    .ap-nav-item {
      transition: background 0.2s, color 0.2s;
      cursor: pointer;
      user-select: none;
    }
    .ap-nav-item:hover { background: rgba(255,255,255,0.07) !important; }
    .ap-table-row { transition: background 0.15s; }
    .ap-table-row:hover { background: rgba(134,188,118,0.05) !important; }
    .ap-logout:hover { background: #b71c1c !important; }
    .ap-toggle:hover { background: #e8f5e9 !important; }

    .ap-filter-input {
      background: rgba(134,188,118,0.06) !important;
      border: 1px solid rgba(134,188,118,0.2) !important;
      color: #e8f5e4 !important;
      border-radius: 8px;
      padding: 9px 12px;
      font-size: 12px;
      font-family: "DM Sans", sans-serif;
      outline: none;
      transition: border-color 0.2s, background 0.2s;
      width: 100%;
      box-sizing: border-box;
      appearance: none;
      -webkit-appearance: none;
      color-scheme: dark;
      -webkit-text-fill-color: #e8f5e4;
    }
    .ap-filter-input:focus {
      border-color: rgba(134,188,118,0.5) !important;
      background: rgba(134,188,118,0.1) !important;
    }
    .ap-filter-input option { background: #192118 !important; color: #e8f5e4 !important; }
    select.ap-filter-input { background-color: #192118 !important; }
    .ap-filter-input[type="date"] { background-color: #192118 !important; color: #e8f5e4 !important; }
    .ap-filter-input[type="date"]::-webkit-calendar-picker-indicator {
      filter: invert(0.7) sepia(1) saturate(2) hue-rotate(80deg);
      cursor: pointer; opacity: 0.7;
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

    .ap-select-wrap { position: relative; }
    .ap-select-wrap::after {
      content: '▾'; position: absolute; right: 10px; top: 50%;
      transform: translateY(-50%); color: rgba(134,188,118,0.5);
      font-size: 11px; pointer-events: none;
    }

    .ap-modal-overlay {
      position: fixed; inset: 0; background: rgba(0,0,0,0.7);
      display: flex; align-items: center; justify-content: center;
      z-index: 1000; animation: fadeSlideUp 0.2s ease both;
    }
    .ap-modal {
      background: #192118; border: 1px solid rgba(134,188,118,0.2);
      border-radius: 16px; padding: 32px; width: 480px; max-width: 95vw;
      box-shadow: 0 24px 64px rgba(0,0,0,0.6);
    }
    .ap-input {
      background: rgba(134,188,118,0.06);
      border: 1px solid rgba(134,188,118,0.2);
      color: #e8f5e4; border-radius: 8px; padding: 10px 14px;
      font-size: 13px; font-family: "DM Sans", sans-serif;
      outline: none; width: 100%; box-sizing: border-box;
      transition: border-color 0.2s, background 0.2s;
      color-scheme: dark;
    }
    .ap-input:focus {
      border-color: rgba(134,188,118,0.5);
      background: rgba(134,188,118,0.1);
    }
    .ap-input::placeholder { color: rgba(138,171,128,0.4); }
    .ap-btn-primary {
      background: linear-gradient(135deg, #86bc76, #4db8a4);
      color: #0e1612; border: none; border-radius: 8px;
      padding: 10px 22px; font-size: 13px; font-weight: 700;
      font-family: "DM Sans", sans-serif; cursor: pointer;
      transition: opacity 0.2s, transform 0.15s;
    }
    .ap-btn-primary:hover { opacity: 0.88; transform: translateY(-1px); }
    .ap-btn-ghost {
      background: transparent; border: 1px solid rgba(134,188,118,0.2);
      color: #8aab80; border-radius: 8px; padding: 10px 18px;
      font-size: 13px; font-family: "DM Sans", sans-serif; cursor: pointer;
      transition: background 0.2s;
    }
    .ap-btn-ghost:hover { background: rgba(134,188,118,0.08); }
    .ap-btn-danger {
      background: rgba(232,114,114,0.12); border: 1px solid rgba(232,114,114,0.25);
      color: #e87272; border-radius: 8px; padding: 6px 14px;
      font-size: 11px; font-weight: 600; font-family: "DM Sans", sans-serif;
      cursor: pointer; transition: background 0.2s;
    }
    .ap-btn-danger:hover { background: rgba(232,114,114,0.25); }
    .ap-btn-edit {
      background: rgba(91,142,240,0.12); border: 1px solid rgba(91,142,240,0.25);
      color: #5b8ef0; border-radius: 8px; padding: 6px 14px;
      font-size: 11px; font-weight: 600; font-family: "DM Sans", sans-serif;
      cursor: pointer; transition: background 0.2s;
    }
    .ap-btn-edit:hover { background: rgba(91,142,240,0.25); }
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
// EXPLODE DOCUMENTOS DO FIRESTORE → REGISTROS NORMALIZADOS
// Câmera: campo "alimentos" (array) → um registro por item
// App:    campos raiz diretos
// ============================================================
const explodirDoc = (doc) => {
  const d = doc.data ? doc.data() : doc;
  const id = doc.id || doc._id || '';
  const ehCamera = Array.isArray(d.alimentos) && d.alimentos.length > 0;

  if (ehCamera) {
    return d.alimentos.map((item, idx) => ({
      id:           `${id}_${idx}`,
      alimento:     normalizarAlimento(item.nome || ''),
      quantidade:   (item.quantidade || 0) * (item.peso || 1),
      usuarioNome:  d.usuarioNome  || d.usuarioEmail || '–',
      usuarioEmail: d.usuarioEmail || '–',
      dataRegistro: d.dataRegistro || '',
      equipe:       d.equipe       || '',
      origem:       'camera',
    }));
  }

  // ✅ CORREÇÃO: ignora docs do App sem dados essenciais
  if (!d.alimento && !d.equipe) return [];

  return [{
    id,
    alimento:     normalizarAlimento(d.alimento || ''),
    quantidade:   d.quantidade || 0,
    usuarioNome:  d.usuarioNome  || d.usuarioEmail || '–',
    usuarioEmail: d.usuarioEmail || '–',
    dataRegistro: d.dataRegistro || '',
    equipe:       d.equipe       || '',
    origem:       'app',
  }];
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
// HELPER — verifica se um valor de cargo é admin
// ============================================================
const isCargoAdmin = (valor) => {
  if (!valor) return false;
  const v = String(valor).toLowerCase().trim();
  return ['admin', 'administrador', 'adm', 'administrator'].includes(v);
};

// ============================================================
// COMPONENTE PRINCIPAL
// ============================================================
const AdminPainel = () => {
  const [user, setUser]               = useState(null);
  const [loading, setLoading]         = useState(true);
  const [authError, setAuthError]     = useState('');
  const [sidebarAberta, setSidebarAberta] = useState(true);
  const [abaAtiva, setAbaAtiva]       = useState('visaogeral');

  // ── Dados (já normalizados/explodidos) ──
  const [todasDoacoes, setTodasDoacoes]   = useState([]);
  const [ranking, setRanking]             = useState([]);
  const [usuarios, setUsuarios]           = useState([]);
  const [metas, setMetas]                 = useState([]);
  const [equipes, setEquipes]             = useState([]);

  // ── Filtros (aba doações) ──
  const [filtroEquipe, setFiltroEquipe]         = useState('');
  const [filtroAlimento, setFiltroAlimento]     = useState('');
  const [filtroMembro, setFiltroMembro]         = useState('');
  const [filtroOrigem, setFiltroOrigem]         = useState('');
  const [filtroDataInicio, setFiltroDataInicio] = useState('');
  const [filtroDataFim, setFiltroDataFim]       = useState('');

  // ── Modal metas ──
  const [modalMeta, setModalMeta]         = useState(false);
  const [editandoMeta, setEditandoMeta]   = useState(null);
  const [formMeta, setFormMeta]           = useState({ equipe: '', alimento: '', quantidadeKg: '', dataLimite: '', status: 'em_aberto' });

  // ── Modal usuários ──
  const [modalUsuario, setModalUsuario]   = useState(false);
  const [editandoUser, setEditandoUser]   = useState(null);
  const [formUser, setFormUser]           = useState({ nome: '', email: '', equipe: '', cargo: 'aluno' });

  const [toast, setToast]     = useState(null);
  const navigate              = useNavigate();

  const alimentosLista = ['Arroz', 'Feijão', 'Óleo', 'Café', 'Macarrão', 'Açúcar'];

  // ── Verificação de cargo admin ──
  useEffect(() => {
    injectGlobalStyles();
    const userData = JSON.parse(localStorage.getItem('user'));
    if (!userData) { navigate('/'); return; }

    const verificarAdmin = async () => {
      try {
        const emailOriginal = userData.email || '';
        const emailLower    = emailOriginal.toLowerCase().trim();

        let snap = await getDocs(
          query(collection(db, 'users'), where('email', '==', emailOriginal))
        );

        if (snap.empty && emailLower !== emailOriginal) {
          snap = await getDocs(
            query(collection(db, 'users'), where('email', '==', emailLower))
          );
        }

        if (snap.empty) {
          const allUsers = await getDocs(collection(db, 'users'));
          const match = allUsers.docs.find(d => {
            const docEmail = (d.data().email || '').toLowerCase().trim();
            return docEmail === emailLower;
          });
          if (match) snap = { empty: false, docs: [match] };
        }

        if (snap.empty) {
          setAuthError('Usuário não encontrado no banco de dados.');
          setLoading(false);
          return;
        }

        const docData = snap.docs[0].data();
        const cargoValor =
          docData.cargo  || docData.role   || docData.tipo  ||
          docData.type   || docData.perfil || docData.nivel || '';

        if (!isCargoAdmin(cargoValor)) {
          setAuthError(`Acesso restrito. Cargo encontrado: "${cargoValor || 'nenhum'}". É necessário ser admin.`);
          setLoading(false);
          return;
        }

        const userCompleto = { ...userData, cargo: cargoValor, uid: snap.docs[0].id };
        localStorage.setItem('user', JSON.stringify(userCompleto));
        setUser(userCompleto);
        await carregarDados();
      } catch (err) {
        console.error('[AdminPainel] Erro ao verificar cargo:', err);
        setAuthError('Erro ao verificar permissões: ' + err.message);
        setLoading(false);
      }
    };

    verificarAdmin();
  }, []);

  // ============================================================
  // CARREGAR DADOS
  // ============================================================
  const carregarDados = async () => {
    setLoading(true);
    try {
      const doacoesSnap = await getDocs(collection(db, 'contagem'));
      const rawDocs = doacoesSnap.docs.flatMap(explodirDoc);
      setTodasDoacoes(rawDocs);

      const equipesMap = new Map();
      rawDocs.forEach(d => {
        const eq = d.equipe || '';
        if (!eq) return;
        equipesMap.set(eq, (equipesMap.get(eq) || 0) + (d.quantidade || 0));
      });
      const rankingList = Array.from(equipesMap.entries())
        .map(([nome, total]) => ({ nome, total }))
        .sort((a, b) => b.total - a.total);
      setRanking(rankingList);

      const equipesUnicas = [...new Set(rawDocs.map(d => d.equipe).filter(Boolean))];
      setEquipes(equipesUnicas.sort());

      const usersSnap = await getDocs(collection(db, 'users'));
      setUsuarios(usersSnap.docs.map(d => ({ id: d.id, ...d.data() })));

      const metasSnap = await getDocs(collection(db, 'metas'));
      setMetas(metasSnap.docs.map(d => ({ id: d.id, ...d.data() })));

    } catch (err) {
      console.error('[AdminPainel] Erro ao carregar dados:', err);
      showToast('Erro ao carregar dados.', 'error');
    }
    setLoading(false);
  };

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3200);
  };

  const handleLogout = async () => {
    await signOut(auth);
    localStorage.removeItem('user');
    navigate('/');
  };

  // ── Doações filtradas ──
  const doacoesFiltradas = useMemo(() => {
    return todasDoacoes.filter(d => {
      if (filtroEquipe   && d.equipe     !== filtroEquipe)   return false;
      if (filtroAlimento && d.alimento   !== filtroAlimento) return false;
      if (filtroMembro   && d.usuarioNome !== filtroMembro)  return false;
      if (filtroOrigem   && d.origem      !== filtroOrigem)  return false;
      if (filtroDataInicio || filtroDataFim) {
        const dt = d.dataRegistro ? parseData(d.dataRegistro) : null;
        if (!dt || dt.getTime() === 0) return false;
        if (filtroDataInicio && dt < new Date(filtroDataInicio)) return false;
        if (filtroDataFim) {
          const fim = new Date(filtroDataFim); fim.setHours(23,59,59,999);
          if (dt > fim) return false;
        }
      }
      return true;
    });
  }, [todasDoacoes, filtroEquipe, filtroAlimento, filtroMembro, filtroOrigem, filtroDataInicio, filtroDataFim]);

  const filtrosAtivos = filtroEquipe || filtroAlimento || filtroMembro || filtroOrigem || filtroDataInicio || filtroDataFim;
  const limparFiltros = () => {
    setFiltroEquipe(''); setFiltroAlimento(''); setFiltroMembro('');
    setFiltroOrigem(''); setFiltroDataInicio(''); setFiltroDataFim('');
  };

  const membrosNomes = useMemo(() => {
    return [...new Set(todasDoacoes.map(d => d.usuarioNome).filter(n => n && n !== '–'))].sort();
  }, [todasDoacoes]);

  // ── Stats gerais ──
  const totalGeral    = todasDoacoes.reduce((s, d) => s + (d.quantidade || 0), 0);
  const totalEquipes  = ranking.length;
  const totalUsuarios = usuarios.length;
  const totalMetas    = metas.length;
  const liderTotal    = ranking[0]?.total || 1;

  // ── Contagem geral por alimento ──
  const contagemGeral = useMemo(() => {
    const map = new Map();
    alimentosLista.forEach(a => map.set(a, 0));
    todasDoacoes.forEach(d => {
      if (map.has(d.alimento)) map.set(d.alimento, map.get(d.alimento) + (d.quantidade || 0));
    });
    return Array.from(map.entries())
      .map(([nome, total]) => ({ nome, total }))
      .filter(i => i.total > 0)
      .sort((a, b) => b.total - a.total);
  }, [todasDoacoes]);

  // ============================================================
  // CRUD — METAS
  // ============================================================
  const abrirModalMeta = (meta = null) => {
    if (meta) {
      setEditandoMeta(meta);
      setFormMeta({ equipe: meta.equipe || '', alimento: meta.alimento || '', quantidadeKg: meta.quantidadeKg || '', dataLimite: meta.dataLimite || '', status: meta.status || 'em_aberto' });
    } else {
      setEditandoMeta(null);
      setFormMeta({ equipe: '', alimento: '', quantidadeKg: '', dataLimite: '', status: 'em_aberto' });
    }
    setModalMeta(true);
  };

  const salvarMeta = async () => {
    if (!formMeta.equipe || !formMeta.alimento || !formMeta.quantidadeKg) {
      showToast('Preencha equipe, alimento e quantidade.', 'error'); return;
    }
    try {
      const payload = { ...formMeta, quantidadeKg: Number(formMeta.quantidadeKg), updatedAt: serverTimestamp() };
      if (editandoMeta) {
        await updateDoc(doc(db, 'metas', editandoMeta.id), payload);
        showToast('Meta atualizada com sucesso!');
      } else {
        await addDoc(collection(db, 'metas'), { ...payload, criadoEm: serverTimestamp() });
        showToast('Meta criada com sucesso!');
      }
      setModalMeta(false);
      await carregarDados();
    } catch (err) {
      console.error(err);
      showToast('Erro ao salvar meta.', 'error');
    }
  };

  const excluirMeta = async (id) => {
    if (!window.confirm('Excluir esta meta?')) return;
    try {
      await deleteDoc(doc(db, 'metas', id));
      showToast('Meta excluída.');
      await carregarDados();
    } catch (err) { showToast('Erro ao excluir meta.', 'error'); }
  };

  // ============================================================
  // CRUD — USUÁRIOS
  // ============================================================
  const abrirModalUsuario = (u = null) => {
    if (u) {
      setEditandoUser(u);
      setFormUser({ nome: u.nome || '', email: u.email || '', equipe: u.equipe || '', cargo: u.cargo || u.role || 'aluno' });
    } else {
      setEditandoUser(null);
      setFormUser({ nome: '', email: '', equipe: '', cargo: 'aluno' });
    }
    setModalUsuario(true);
  };

  const salvarUsuario = async () => {
    if (!formUser.nome || !formUser.email) { showToast('Preencha nome e email.', 'error'); return; }
    try {
      const payload = { nome: formUser.nome, email: formUser.email, equipe: formUser.equipe, cargo: formUser.cargo, updatedAt: serverTimestamp() };
      if (editandoUser) {
        await updateDoc(doc(db, 'users', editandoUser.id), payload);
        showToast('Usuário atualizado!');
      } else {
        await addDoc(collection(db, 'users'), { ...payload, criadoEm: serverTimestamp() });
        showToast('Usuário criado!');
      }
      setModalUsuario(false);
      await carregarDados();
    } catch (err) { showToast('Erro ao salvar usuário.', 'error'); }
  };

  const excluirUsuario = async (id) => {
    if (!window.confirm('Excluir este usuário?')) return;
    try {
      await deleteDoc(doc(db, 'users', id));
      showToast('Usuário excluído.');
      await carregarDados();
    } catch (err) { showToast('Erro ao excluir usuário.', 'error'); }
  };

  // ============================================================
  // RENDERS
  // ============================================================
  if (loading) return <LoadingScreen />;

  if (authError) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: T.bg, fontFamily: T.fontBody }}>
      <div style={{ textAlign: 'center', padding: 48, background: T.bgCard, borderRadius: T.radius, border: `1px solid ${T.roseDim}`, maxWidth: 440 }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>🔒</div>
        <h2 style={{ fontFamily: T.fontDisplay, color: T.textPrimary, margin: '0 0 12px' }}>Acesso negado</h2>
        <p style={{ color: T.textSecond, fontSize: 14, margin: '0 0 24px', lineHeight: 1.6 }}>{authError}</p>
        <button className="ap-btn-ghost" onClick={() => { localStorage.removeItem('user'); navigate('/'); }}>
          Voltar ao login
        </button>
      </div>
    </div>
  );

  const navItems = [
    { id: 'visaogeral', label: 'Visão Geral', icon: <IconDashboard /> },
    { id: 'doacoes',    label: 'Doações',      icon: <IconBox /> },
    { id: 'metas',      label: 'Metas',        icon: <IconTarget /> },
    { id: 'ranking',    label: 'Ranking',      icon: <IconTrophy /> },
    { id: 'usuarios',   label: 'Usuários',     icon: <IconUsers /> },
  ];

  const summaryCards = [
    { label: 'Total arrecadado',  value: `${fmt(totalGeral)} kg`, accent: T.green,    bg: T.greenDim },
    { label: 'Equipes ativas',    value: totalEquipes,             accent: T.sapphire, bg: T.sapphireDim },
    { label: 'Usuários',          value: totalUsuarios,            accent: T.amber,    bg: T.amberDim },
    { label: 'Metas cadastradas', value: totalMetas,               accent: T.teal,     bg: T.tealDim },
  ];

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: T.bg, fontFamily: T.fontBody, color: T.textPrimary }}>

      {/* ── TOAST ── */}
      {toast && (
        <div style={{
          position: 'fixed', bottom: 28, right: 28, zIndex: 2000,
          background: toast.type === 'error' ? T.roseDim : T.greenDim,
          border: `1px solid ${toast.type === 'error' ? T.rose : T.green}44`,
          color: toast.type === 'error' ? T.rose : T.green,
          borderRadius: T.radiusSm, padding: '12px 20px',
          fontSize: 13, fontWeight: 600,
          boxShadow: T.shadow, animation: 'fadeSlideUp 0.3s ease both',
        }}>
          {toast.type === 'error' ? '✕' : '✓'} {toast.msg}
        </div>
      )}

      {/* ── SIDEBAR ── */}
      <aside style={{
        width: sidebarAberta ? 248 : 72, minHeight: '100vh',
        background: T.bgPanel, borderRight: `1px solid ${T.border}`,
        display: 'flex', flexDirection: 'column',
        padding: '28px 14px 24px', gap: 8,
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
          fontSize: 11, fontWeight: 700, boxShadow: T.shadowSm,
          zIndex: 20, transition: 'background 0.2s',
        }}>
          {sidebarAberta ? '‹' : '›'}
        </button>

        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, paddingBottom: 24, borderBottom: `1px solid ${T.border}`, marginBottom: 8 }}>
          <div style={{
            width: 38, height: 38, borderRadius: 10,
            background: `linear-gradient(135deg, ${T.amber}, ${T.rose})`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 13, fontWeight: 700, color: '#0e1612', flexShrink: 0,
            boxShadow: `0 0 16px rgba(240,168,83,0.3)`,
          }}>AD</div>
          {sidebarAberta && (
            <div style={{ fontFamily: T.fontDisplay, fontSize: 14, color: T.textPrimary, lineHeight: 1, whiteSpace: 'nowrap' }}>
              Painel <span style={{ fontStyle: 'italic', color: T.amber }}>Admin</span>
            </div>
          )}
        </div>

        {/* Perfil */}
        <div style={{
          background: 'rgba(240,168,83,0.06)', borderRadius: T.radius,
          border: `1px solid rgba(240,168,83,0.12)`,
          padding: sidebarAberta ? '16px 14px' : '12px 0',
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
          marginBottom: 8,
        }}>
          <div style={{
            width: 44, height: 44, borderRadius: '50%',
            background: `linear-gradient(135deg, ${T.amber}, ${T.rose})`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 18, fontWeight: 700, color: '#0e1612',
            boxShadow: `0 0 20px rgba(240,168,83,0.3)`,
          }}>
            {user?.nome?.charAt(0).toUpperCase()}
          </div>
          {sidebarAberta && (
            <>
              <span style={{ fontWeight: 600, fontSize: 13, color: T.textPrimary, textAlign: 'center', lineHeight: 1.3 }}>{user?.nome}</span>
              <span style={{
                background: 'rgba(240,168,83,0.15)', color: T.amber,
                padding: '3px 10px', borderRadius: 20,
                fontSize: 10, fontWeight: 600, letterSpacing: '0.5px',
                border: `1px solid rgba(240,168,83,0.25)`,
              }}>ADMIN</span>
            </>
          )}
        </div>

        {/* Nav */}
        <nav style={{ display: 'flex', flexDirection: 'column', gap: 3, flex: 1 }}>
          {navItems.map(item => {
            const active = abaAtiva === item.id;
            return (
              <button key={item.id} className="ap-nav-item ap-sidebar-btn"
                onClick={() => setAbaAtiva(item.id)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: sidebarAberta ? '11px 14px' : '11px 0',
                  justifyContent: sidebarAberta ? 'flex-start' : 'center',
                  border: 'none', borderRadius: T.radiusSm, cursor: 'pointer',
                  background: active ? T.amberDim : 'transparent',
                  color: active ? T.amber : T.textSecond,
                  fontSize: 13, fontWeight: active ? 600 : 400,
                  width: '100%',
                  borderLeft: active ? `3px solid ${T.amber}` : '3px solid transparent',
                }}>
                <span style={{ flexShrink: 0, opacity: active ? 1 : 0.6 }}>{item.icon}</span>
                {sidebarAberta && <span>{item.label}</span>}
              </button>
            );
          })}
        </nav>

        {/* Logout */}
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
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: T.amber, animation: 'pulse-dot 2s ease infinite' }} />
            <span style={{ fontSize: 11, color: T.textSecond, fontWeight: 500, letterSpacing: '1px', textTransform: 'uppercase' }}>Painel do Administrador</span>
          </div>
          <h1 style={{ fontFamily: T.fontDisplay, fontSize: 34, fontWeight: 400, color: T.textPrimary, margin: 0, lineHeight: 1.1 }}>
            Olá, {user?.nome?.split(' ')[0]} <span style={{ fontStyle: 'italic', color: T.amber }}>⚡</span>
          </h1>
          <p style={{ margin: '6px 0 0', color: T.textSecond, fontSize: 14 }}>
            Gerencie todas as equipes e dados da campanha
          </p>
        </div>

        {/* Summary cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 32 }}>
          {summaryCards.map((card, i) => (
            <div key={i} className="ap-summary-card" style={{
              background: card.bg, border: `1px solid ${card.accent}22`,
              borderRadius: T.radius, padding: '20px 22px',
              position: 'relative', overflow: 'hidden',
            }}>
              <div style={{ position: 'absolute', top: -20, right: -20, width: 80, height: 80, borderRadius: '50%', background: `radial-gradient(circle, ${card.accent}18, transparent 70%)` }} />
              <div style={{ fontSize: 10, color: card.accent, fontWeight: 600, letterSpacing: '1px', textTransform: 'uppercase', marginBottom: 10 }}>{card.label}</div>
              <div style={{ fontSize: 28, fontFamily: T.fontDisplay, fontWeight: 400, color: T.textPrimary, lineHeight: 1 }}>{card.value}</div>
            </div>
          ))}
        </div>

        {/* ─────────── ABA: VISÃO GERAL ─────────── */}
        {abaAtiva === 'visaogeral' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>

              <Card title="Total por alimento (geral)" className="ap-card">
                {contagemGeral.length === 0
                  ? <EmptyState text="Nenhuma doação registrada." />
                  : contagemGeral.map(item => {
                      const maxVal = Math.max(...contagemGeral.map(c => c.total));
                      return (
                        <div key={item.nome} style={{ marginBottom: 18 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 7, fontSize: 13 }}>
                            <span style={{ color: T.textPrimary, fontWeight: 500 }}>{item.nome}</span>
                            <span style={{ color: T.green, fontWeight: 600 }}>{fmt(item.total)} kg</span>
                          </div>
                          <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: 6, height: 7, overflow: 'hidden' }}>
                            <div className="ap-bar-fill" style={{ width: `${(item.total / maxVal) * 100}%`, background: `linear-gradient(90deg, ${T.green}, ${T.teal})`, height: '100%', borderRadius: 6 }} />
                          </div>
                        </div>
                      );
                    })
                }
              </Card>

              <Card title="Top equipes" className="ap-card">
                {ranking.slice(0, 5).map((eq, idx) => {
                  const medals = ['🥇', '🥈', '🥉'];
                  const pct = liderTotal > 0 ? (eq.total / liderTotal) * 100 : 0;
                  return (
                    <div key={eq.nome} style={{ marginBottom: 14, padding: '10px 12px', borderRadius: T.radiusSm, background: idx === 0 ? T.amberDim : 'transparent', border: idx === 0 ? `1px solid ${T.amber}22` : '1px solid transparent' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: 13 }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span>{medals[idx] || `${idx + 1}º`}</span>
                          <span style={{ color: idx === 0 ? T.amber : T.textPrimary, fontWeight: idx === 0 ? 600 : 400 }}>{eq.nome}</span>
                        </span>
                        <span style={{ color: idx === 0 ? T.amber : T.textSecond, fontWeight: 600 }}>{fmt(eq.total)} kg</span>
                      </div>
                      <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: 4, height: 4, overflow: 'hidden' }}>
                        <div style={{ width: `${pct}%`, background: idx === 0 ? T.amber : T.sapphire, height: '100%', borderRadius: 4, opacity: 0.8 }} />
                      </div>
                    </div>
                  );
                })}
              </Card>
            </div>

            <Card title="Últimas 10 doações" className="ap-card">
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr>
                      {['Equipe', 'Alimento', 'Quantidade (kg)', 'Doador', 'Origem', 'Data'].map(h => (
                        <th key={h} style={thStyle}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {[...todasDoacoes]
                      // ✅ CORREÇÃO: usa parseData para ordenar corretamente
                      .sort((a, b) => parseData(b.dataRegistro) - parseData(a.dataRegistro))
                      .slice(0, 10)
                      .map(doc => (
                        <tr key={doc.id} className="ap-table-row">
                          <td style={td}><span style={{ background: T.amberDim, color: T.amber, padding: '2px 8px', borderRadius: 10, fontSize: 11, fontWeight: 600 }}>{doc.equipe}</span></td>
                          <td style={td}>{doc.alimento}</td>
                          <td style={td}><strong style={{ color: T.green }}>{fmt(doc.quantidade)} kg</strong></td>
                          <td style={td}>{doc.usuarioNome || '–'}</td>
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
                      ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>
        )}

        {/* ─────────── ABA: DOAÇÕES ─────────── */}
        {abaAtiva === 'doacoes' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

            <Card title="Filtros" className="ap-card">
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 14, alignItems: 'end' }}>
                <div>
                  <label style={labelStyle}>Equipe</label>
                  <div className="ap-select-wrap">
                    <select className="ap-filter-input" value={filtroEquipe} onChange={e => setFiltroEquipe(e.target.value)} style={{ backgroundColor: '#192118' }}>
                      <option value="">Todas</option>
                      {equipes.map(e => <option key={e} value={e}>{e}</option>)}
                    </select>
                  </div>
                </div>
                <div>
                  <label style={labelStyle}>Alimento</label>
                  <div className="ap-select-wrap">
                    <select className="ap-filter-input" value={filtroAlimento} onChange={e => setFiltroAlimento(e.target.value)} style={{ backgroundColor: '#192118' }}>
                      <option value="">Todos</option>
                      {alimentosLista.map(a => <option key={a} value={a}>{a}</option>)}
                    </select>
                  </div>
                </div>
                <div>
                  <label style={labelStyle}>Membro</label>
                  <div className="ap-select-wrap">
                    <select className="ap-filter-input" value={filtroMembro} onChange={e => setFiltroMembro(e.target.value)} style={{ backgroundColor: '#192118' }}>
                      <option value="">Todos</option>
                      {membrosNomes.map(n => <option key={n} value={n}>{n}</option>)}
                    </select>
                  </div>
                </div>
                <div>
                  <label style={labelStyle}>Origem</label>
                  <div className="ap-select-wrap">
                    <select className="ap-filter-input" value={filtroOrigem} onChange={e => setFiltroOrigem(e.target.value)} style={{ backgroundColor: '#192118' }}>
                      <option value="">Todas</option>
                      <option value="app">App</option>
                      <option value="camera">Câmera</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label style={labelStyle}>Data início</label>
                  <input type="date" className="ap-filter-input" value={filtroDataInicio} onChange={e => setFiltroDataInicio(e.target.value)} style={{ backgroundColor: '#192118' }} />
                </div>
                <div>
                  <label style={labelStyle}>Data fim</label>
                  <input type="date" className="ap-filter-input" value={filtroDataFim} onChange={e => setFiltroDataFim(e.target.value)} style={{ backgroundColor: '#192118' }} />
                </div>
              </div>
              {filtrosAtivos && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 14, flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 11, color: T.textMuted }}>Filtros ativos:</span>
                  {filtroEquipe     && <span className="ap-filter-chip" onClick={() => setFiltroEquipe('')}>{filtroEquipe} ×</span>}
                  {filtroAlimento   && <span className="ap-filter-chip" onClick={() => setFiltroAlimento('')}>{filtroAlimento} ×</span>}
                  {filtroMembro     && <span className="ap-filter-chip" onClick={() => setFiltroMembro('')}>{filtroMembro} ×</span>}
                  {filtroOrigem     && <span className="ap-filter-chip" onClick={() => setFiltroOrigem('')}>{filtroOrigem === 'camera' ? 'Câmera' : 'App'} ×</span>}
                  {filtroDataInicio && <span className="ap-filter-chip" onClick={() => setFiltroDataInicio('')}>De: {filtroDataInicio} ×</span>}
                  {filtroDataFim    && <span className="ap-filter-chip" onClick={() => setFiltroDataFim('')}>Até: {filtroDataFim} ×</span>}
                  <button onClick={limparFiltros} style={{ marginLeft: 'auto', background: 'transparent', border: `1px solid ${T.rose}44`, color: T.rose, borderRadius: 8, padding: '4px 12px', fontSize: 11, cursor: 'pointer', fontFamily: T.fontBody }}>
                    Limpar tudo
                  </button>
                  <span style={{ fontSize: 11, color: T.textMuted }}>
                    {doacoesFiltradas.length} registro(s) · {fmt(doacoesFiltradas.reduce((s,d) => s + (d.quantidade||0), 0))} kg
                  </span>
                </div>
              )}
            </Card>

            <Card title={filtrosAtivos ? `Registros filtrados (${doacoesFiltradas.length})` : `Todas as doações (${todasDoacoes.length})`} className="ap-card">
              {doacoesFiltradas.length === 0
                ? <EmptyState text="Nenhuma doação encontrada com estes filtros." />
                : (
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead>
                        <tr>{['Equipe', 'Alimento', 'Quantidade (kg)', 'Doador', 'Origem', 'Data'].map(h => <th key={h} style={thStyle}>{h}</th>)}</tr>
                      </thead>
                      <tbody>
                        {[...doacoesFiltradas]
                          // ✅ CORREÇÃO: usa parseData para ordenar corretamente
                          .sort((a, b) => parseData(b.dataRegistro) - parseData(a.dataRegistro))
                          .map(doc => (
                            <tr key={doc.id} className="ap-table-row">
                              <td style={td}><span style={{ background: T.amberDim, color: T.amber, padding: '2px 8px', borderRadius: 10, fontSize: 11, fontWeight: 600 }}>{doc.equipe}</span></td>
                              <td style={td}>{doc.alimento}</td>
                              <td style={td}><strong style={{ color: T.green }}>{fmt(doc.quantidade)} kg</strong></td>
                              <td style={td}>{doc.usuarioNome || '–'}</td>
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
                          ))}
                      </tbody>
                    </table>
                  </div>
                )}
            </Card>
          </div>
        )}

        {/* ─────────── ABA: METAS ─────────── */}
        {abaAtiva === 'metas' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button className="ap-btn-primary" onClick={() => abrirModalMeta()}>+ Nova meta</button>
            </div>

            <Card title="Todas as metas" className="ap-card">
              {metas.length === 0
                ? <EmptyState text="Nenhuma meta cadastrada." />
                : (
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead>
                        <tr>{['Equipe', 'Alimento', 'Meta (kg)', 'Arrecadado (kg)', 'Progresso', 'Status', 'Data Limite', 'Ações'].map(h => <th key={h} style={thStyle}>{h}</th>)}</tr>
                      </thead>
                      <tbody>
                        {metas.map(meta => {
                          const equipeTotal = todasDoacoes
                            .filter(d => d.equipe === meta.equipe && d.alimento === meta.alimento)
                            .reduce((s, d) => s + (d.quantidade || 0), 0);
                          const pct = meta.quantidadeKg > 0 ? (equipeTotal / meta.quantidadeKg) * 100 : 0;
                          const barColor = pct >= 100 ? T.green : pct >= 50 ? T.amber : T.rose;
                          const isOpen = meta.status === 'em_aberto';
                          return (
                            <tr key={meta.id} className="ap-table-row">
                              <td style={td}><span style={{ background: T.amberDim, color: T.amber, padding: '2px 8px', borderRadius: 10, fontSize: 11, fontWeight: 600 }}>{meta.equipe}</span></td>
                              <td style={td}><strong style={{ color: T.textPrimary }}>{meta.alimento}</strong></td>
                              <td style={td}>{fmt(meta.quantidadeKg)}</td>
                              <td style={td}>{fmt(equipeTotal)}</td>
                              <td style={td}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                  <div style={{ flex: 1, background: 'rgba(255,255,255,0.06)', borderRadius: 4, height: 6, overflow: 'hidden', minWidth: 80 }}>
                                    <div style={{ width: `${Math.min(pct, 100)}%`, background: barColor, height: '100%', borderRadius: 4 }} />
                                  </div>
                                  <span style={{ fontSize: 12, color: barColor, fontWeight: 700, flexShrink: 0 }}>{fmt(pct)}%</span>
                                </div>
                              </td>
                              <td style={td}>
                                <span style={{ padding: '4px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600, background: isOpen ? T.amberDim : T.greenDim, color: isOpen ? T.amber : T.green, border: `1px solid ${isOpen ? T.amber : T.green}33` }}>
                                  {isOpen ? 'Em aberto' : 'Encerrada'}
                                </span>
                              </td>
                              <td style={{ ...td, color: T.textSecond }}>{meta.dataLimite || '–'}</td>
                              <td style={td}>
                                <div style={{ display: 'flex', gap: 6 }}>
                                  <button className="ap-btn-edit" onClick={() => abrirModalMeta(meta)}>Editar</button>
                                  <button className="ap-btn-danger" onClick={() => excluirMeta(meta.id)}>Excluir</button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
            </Card>
          </div>
        )}

        {/* ─────────── ABA: RANKING ─────────── */}
        {abaAtiva === 'ranking' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <Card title="Ranking Geral das Equipes" className="ap-card">
              {ranking.length === 0
                ? <EmptyState text="Nenhuma doação registrada." />
                : (
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead>
                        <tr>{['Pos.', 'Equipe', 'Total (kg)', 'vs. Média'].map(h => <th key={h} style={thStyle}>{h}</th>)}</tr>
                      </thead>
                      <tbody>
                        {ranking.map((eq, idx) => {
                          const medals = ['🥇', '🥈', '🥉'];
                          const mediaGeral = ranking.length > 0
                            ? ranking.reduce((s, r) => s + r.total, 0) / ranking.length
                            : 0;
                          const diff = eq.total - mediaGeral;
                          return (
                            <tr key={eq.nome} className="ap-table-row">
                              <td style={td}><span style={{ fontFamily: T.fontDisplay, fontSize: 17, color: idx < 3 ? T.amber : T.textSecond }}>{medals[idx] || `${idx + 1}º`}</span></td>
                              <td style={td}><strong style={{ color: T.textPrimary }}>{eq.nome}</strong></td>
                              <td style={td}><strong style={{ color: T.green }}>{fmt(eq.total)} kg</strong></td>
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
                )}
            </Card>
          </div>
        )}

        {/* ─────────── ABA: USUÁRIOS ─────────── */}
        {abaAtiva === 'usuarios' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button className="ap-btn-primary" onClick={() => abrirModalUsuario()}>+ Novo usuário</button>
            </div>

            <Card title={`Usuários (${usuarios.length})`} className="ap-card">
              {usuarios.length === 0
                ? <EmptyState text="Nenhum usuário encontrado." />
                : (
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead>
                        <tr>{['#', 'Nome', 'Email', 'Equipe', 'Cargo', 'Ações'].map(h => <th key={h} style={thStyle}>{h}</th>)}</tr>
                      </thead>
                      <tbody>
                        {usuarios.map((u) => {
                          const cargo = (u.cargo || u.role || 'aluno').toLowerCase();
                          const isAdmin = isCargoAdmin(cargo);
                          return (
                            <tr key={u.id} className="ap-table-row">
                              <td style={td}>
                                <div style={{ width: 30, height: 30, borderRadius: '50%', background: isAdmin ? `linear-gradient(135deg, ${T.amber}, ${T.rose})` : `linear-gradient(135deg, ${T.green}, ${T.teal})`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: '#0e1612' }}>
                                  {u.nome?.charAt(0).toUpperCase()}
                                </div>
                              </td>
                              <td style={td}><strong style={{ color: T.textPrimary }}>{u.nome}</strong></td>
                              <td style={{ ...td, color: T.textMuted }}>{u.email}</td>
                              <td style={td}>{u.equipe || '–'}</td>
                              <td style={td}>
                                <span style={{ padding: '4px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600, background: isAdmin ? T.amberDim : T.greenDim, color: isAdmin ? T.amber : T.green, border: `1px solid ${isAdmin ? T.amber : T.green}33` }}>
                                  {isAdmin ? 'Admin' : 'Aluno'}
                                </span>
                              </td>
                              <td style={td}>
                                <div style={{ display: 'flex', gap: 6 }}>
                                  <button className="ap-btn-edit" onClick={() => abrirModalUsuario(u)}>Editar</button>
                                  <button className="ap-btn-danger" onClick={() => excluirUsuario(u.id)}>Excluir</button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
            </Card>
          </div>
        )}
      </main>

      {/* ─────────── MODAL METAS ─────────── */}
      {modalMeta && (
        <div className="ap-modal-overlay" onClick={e => e.target === e.currentTarget && setModalMeta(false)}>
          <div className="ap-modal">
            <h2 style={{ fontFamily: T.fontDisplay, fontSize: 22, color: T.textPrimary, margin: '0 0 24px' }}>
              {editandoMeta ? 'Editar meta' : 'Nova meta'}
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={labelStyle}>Equipe</label>
                <div className="ap-select-wrap">
                  <select className="ap-filter-input" value={formMeta.equipe} onChange={e => setFormMeta(p => ({ ...p, equipe: e.target.value }))} style={{ backgroundColor: '#192118' }}>
                    <option value="">Selecione…</option>
                    {equipes.map(e => <option key={e} value={e}>{e}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label style={labelStyle}>Alimento</label>
                <div className="ap-select-wrap">
                  <select className="ap-filter-input" value={formMeta.alimento} onChange={e => setFormMeta(p => ({ ...p, alimento: e.target.value }))} style={{ backgroundColor: '#192118' }}>
                    <option value="">Selecione…</option>
                    {alimentosLista.map(a => <option key={a} value={a}>{a}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label style={labelStyle}>Quantidade (kg)</label>
                <input type="number" className="ap-input" placeholder="Ex: 100" value={formMeta.quantidadeKg} onChange={e => setFormMeta(p => ({ ...p, quantidadeKg: e.target.value }))} min="0" />
              </div>
              <div>
                <label style={labelStyle}>Data limite</label>
                <input type="date" className="ap-input" value={formMeta.dataLimite} onChange={e => setFormMeta(p => ({ ...p, dataLimite: e.target.value }))} />
              </div>
              <div>
                <label style={labelStyle}>Status</label>
                <div className="ap-select-wrap">
                  <select className="ap-filter-input" value={formMeta.status} onChange={e => setFormMeta(p => ({ ...p, status: e.target.value }))} style={{ backgroundColor: '#192118' }}>
                    <option value="em_aberto">Em aberto</option>
                    <option value="encerrada">Encerrada</option>
                  </select>
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 10, marginTop: 24, justifyContent: 'flex-end' }}>
              <button className="ap-btn-ghost" onClick={() => setModalMeta(false)}>Cancelar</button>
              <button className="ap-btn-primary" onClick={salvarMeta}>
                {editandoMeta ? 'Salvar alterações' : 'Criar meta'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─────────── MODAL USUÁRIOS ─────────── */}
      {modalUsuario && (
        <div className="ap-modal-overlay" onClick={e => e.target === e.currentTarget && setModalUsuario(false)}>
          <div className="ap-modal">
            <h2 style={{ fontFamily: T.fontDisplay, fontSize: 22, color: T.textPrimary, margin: '0 0 24px' }}>
              {editandoUser ? 'Editar usuário' : 'Novo usuário'}
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={labelStyle}>Nome completo</label>
                <input className="ap-input" placeholder="Nome…" value={formUser.nome} onChange={e => setFormUser(p => ({ ...p, nome: e.target.value }))} />
              </div>
              <div>
                <label style={labelStyle}>Email</label>
                <input className="ap-input" placeholder="email@exemplo.com" value={formUser.email} onChange={e => setFormUser(p => ({ ...p, email: e.target.value }))} />
              </div>
              <div>
                <label style={labelStyle}>Equipe</label>
                <div className="ap-select-wrap">
                  <select className="ap-filter-input" value={formUser.equipe} onChange={e => setFormUser(p => ({ ...p, equipe: e.target.value }))} style={{ backgroundColor: '#192118' }}>
                    <option value="">Sem equipe</option>
                    {equipes.map(e => <option key={e} value={e}>{e}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label style={labelStyle}>Cargo</label>
                <div className="ap-select-wrap">
                  <select className="ap-filter-input" value={formUser.cargo} onChange={e => setFormUser(p => ({ ...p, cargo: e.target.value }))} style={{ backgroundColor: '#192118' }}>
                    <option value="aluno">Aluno</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 10, marginTop: 24, justifyContent: 'flex-end' }}>
              <button className="ap-btn-ghost" onClick={() => setModalUsuario(false)}>Cancelar</button>
              <button className="ap-btn-primary" onClick={salvarUsuario}>
                {editandoUser ? 'Salvar alterações' : 'Criar usuário'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

// ============================================================
// ESTILOS AUXILIARES
// ============================================================
const td = {
  padding: '13px 14px',
  borderBottom: '1px solid rgba(134,188,118,0.07)',
  fontSize: 13,
  color: '#8aab80',
};

const thStyle = {
  textAlign: 'left',
  padding: '10px 14px',
  borderBottom: '1px solid rgba(134,188,118,0.12)',
  fontSize: 11,
  fontWeight: 600,
  color: '#4d6647',
  textTransform: 'uppercase',
  letterSpacing: '0.5px',
};

const labelStyle = {
  display: 'block',
  fontSize: 10,
  fontWeight: 600,
  color: '#4d6647',
  textTransform: 'uppercase',
  letterSpacing: '0.5px',
  marginBottom: 6,
};

// ============================================================
// SUB-COMPONENTES
// ============================================================
const Card = ({ title, children, className = '' }) => (
  <div className={className} style={{
    background: '#192118',
    border: '1px solid rgba(134,188,118,0.12)',
    borderRadius: 14,
    padding: '24px 26px',
    boxShadow: '0 4px 24px rgba(0,0,0,0.3)',
  }}>
    <h2 style={{
      fontFamily: '"DM Serif Display", serif',
      fontSize: 17, fontWeight: 400,
      color: '#e8f5e4', margin: '0 0 22px',
      paddingBottom: 14,
      borderBottom: '1px solid rgba(134,188,118,0.1)',
      display: 'flex', alignItems: 'center', gap: 10,
    }}>
      <span style={{ display: 'block', width: 3, height: 18, background: 'linear-gradient(180deg, #f0a853, #e87272)', borderRadius: 2, flexShrink: 0 }} />
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
      <div style={{ width: 44, height: 44, border: '3px solid rgba(240,168,83,0.15)', borderTop: '3px solid #f0a853', borderRadius: '50%', animation: 'spin 0.9s linear infinite' }} />
      <p style={{ color: '#4d6647', fontSize: 13, margin: 0 }}>Verificando permissões…</p>
    </div>
  );
};

// ============================================================
// ÍCONES SVG INLINE
// ============================================================
const IconDashboard = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
    <rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
  </svg>
);
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
    <path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/>
    <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/>
    <path d="M18 2H6v7a6 6 0 0 0 12 0V2z"/>
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
const IconLogout = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
    <polyline points="16,17 21,12 16,7"/><line x1="21" y1="12" x2="9" y2="12"/>
  </svg>
);

export default AdminPainel;