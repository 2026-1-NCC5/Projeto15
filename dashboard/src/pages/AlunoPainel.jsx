// src/pages/AlunoPainel.js
import React, { useState, useEffect } from 'react';
import { auth } from '../firebaseConfig';
import { signOut } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../firebaseConfig';

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

    .ap-sidebar-btn {
      transition: background 0.2s, color 0.2s, transform 0.15s;
    }
    .ap-sidebar-btn:hover {
      transform: translateX(3px);
    }
    .ap-card {
      animation: fadeSlideUp 0.45s ease both;
    }
    .ap-card:nth-child(1) { animation-delay: 0.05s; }
    .ap-card:nth-child(2) { animation-delay: 0.12s; }
    .ap-card:nth-child(3) { animation-delay: 0.19s; }
    .ap-card:nth-child(4) { animation-delay: 0.26s; }

    .ap-summary-card {
      animation: fadeSlideUp 0.5s ease both;
    }
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
    .ap-nav-item:hover {
      background: rgba(255,255,255,0.07) !important;
    }

    .ap-table-row {
      transition: background 0.15s;
    }
    .ap-table-row:hover {
      background: rgba(134,188,118,0.05) !important;
    }

    .ap-logout:hover {
      background: #b71c1c !important;
    }

    .ap-toggle:hover {
      background: #e8f5e9 !important;
    }
  `;
  document.head.appendChild(style);
};

// ============================================================
// TOKENS DE DESIGN
// ============================================================
const T = {
  // Cores
  bg:          '#0e1612',
  bgPanel:     '#141f18',
  bgCard:      '#192118',
  bgCardHover: '#1e2a20',
  border:      'rgba(134,188,118,0.12)',
  borderLight: 'rgba(134,188,118,0.22)',

  green:       '#86bc76',
  greenDim:    'rgba(134,188,118,0.15)',
  greenGlow:   'rgba(134,188,118,0.08)',
  greenDeep:   '#2e5e20',

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
  const [user, setUser] = useState(null);
  const [minhaEquipe, setMinhaEquipe] = useState('');
  const [loading, setLoading] = useState(true);
  const [contagem, setContagem] = useState([]);
  const [ranking, setRanking] = useState([]);
  const [metas, setMetas] = useState([]);
  const [totalArrecadado, setTotalArrecadado] = useState(0);
  const [sidebarAberta, setSidebarAberta] = useState(true);
  const [abaAtiva, setAbaAtiva] = useState('doacoes');
  const navigate = useNavigate();

  const alimentosLista = ['Arroz', 'Feijão', 'Óleo', 'Café', 'Macarrão', 'Açúcar'];

  useEffect(() => {
    injectGlobalStyles();
    const userData = JSON.parse(localStorage.getItem('user'));
    setUser(userData);
    setMinhaEquipe(userData.equipe);
    if (userData.equipe) carregarDados(userData.equipe);
  }, []);

  const carregarDados = async (equipe) => {
    setLoading(true);
    try {
      const contagemQuery = query(collection(db, 'contagem'), where('equipe', '==', equipe));
      const contagemSnapshot = await getDocs(contagemQuery);
      const alimentosMap = new Map();
      alimentosLista.forEach(a => alimentosMap.set(a, 0));
      contagemSnapshot.docs.forEach(doc => {
        const d = doc.data();
        if (alimentosMap.has(d.alimento)) alimentosMap.set(d.alimento, alimentosMap.get(d.alimento) + (d.quantidade || 0));
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
        const d = doc.data();
        equipesMap.set(d.equipe, (equipesMap.get(d.equipe) || 0) + (d.quantidade || 0));
      });
      setRanking(Array.from(equipesMap.entries()).map(([nome, total]) => ({ nome, total })).sort((a, b) => b.total - a.total));

      const metasQuery = query(collection(db, 'metas'), where('equipe', '==', equipe));
      const metasSnapshot = await getDocs(metasQuery);
      setMetas(metasSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
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

  const posicaoRanking = ranking.findIndex(r => r.nome === minhaEquipe) + 1;
  const mediaPorAlimento = contagem.length > 0 ? (totalArrecadado / contagem.length).toFixed(0) : 0;

  if (loading) return <LoadingScreen />;

  const navItems = [
    { id: 'doacoes',  label: 'Doações',  icon: <IconBox /> },
    // { id: 'graficos', label: 'Gráficos', icon: <IconChart /> },
    { id: 'metas',    label: 'Metas',    icon: <IconTarget /> },
    { id: 'ranking',  label: 'Ranking',  icon: <IconTrophy /> },
  ];

  const summaryCards = [
    { label: 'Total arrecadado', value: `${totalArrecadado} kg`, accent: T.green,    bg: T.greenDim },
    { label: 'Posição no ranking', value: `${posicaoRanking || '–'}º lugar`, accent: T.sapphire, bg: T.sapphireDim },
    { label: 'Metas cadastradas', value: metas.length,           accent: T.amber,    bg: T.amberDim },
    { label: 'Média por alimento', value: `${mediaPorAlimento} kg`, accent: T.teal,  bg: T.tealDim },
  ];

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: T.bg, fontFamily: T.fontBody, color: T.textPrimary }}>

      {/* ── SIDEBAR ── */}
      <aside style={{
        width: sidebarAberta ? 248 : 72,
        minHeight: '100vh',
        background: T.bgPanel,
        borderRight: `1px solid ${T.border}`,
        display: 'flex',
        flexDirection: 'column',
        padding: '28px 14px 24px',
        gap: 8,
        transition: 'width 0.3s cubic-bezier(0.4,0,0.2,1)',
        position: 'relative',
        zIndex: 10,
        flexShrink: 0,
        boxShadow: '4px 0 32px rgba(0,0,0,0.3)',
      }}>

        {/* Toggle */}
        <button
          className="ap-toggle"
          onClick={() => setSidebarAberta(!sidebarAberta)}
          style={{
            position: 'absolute', right: -14, top: 32,
            width: 28, height: 28, borderRadius: '50%',
            background: T.bgCard, border: `1px solid ${T.borderLight}`,
            color: T.green, cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 11, fontWeight: 700, boxShadow: T.shadowSm,
            zIndex: 20, transition: 'background 0.2s',
          }}
        >
          {sidebarAberta ? '‹' : '›'}
        </button>

        {/* Logo */}
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

        {/* Avatar */}
        <div style={{
          background: T.greenGlow, borderRadius: T.radius,
          border: `1px solid ${T.border}`,
          padding: sidebarAberta ? '16px 14px' : '12px 0',
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
          marginBottom: 8,
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
                background: T.greenDim, color: T.green,
                padding: '3px 10px', borderRadius: 20,
                fontSize: 10, fontWeight: 600, letterSpacing: '0.5px',
                border: `1px solid rgba(134,188,118,0.25)`,
              }}>{minhaEquipe}</span>
            </>
          )}
        </div>

        {/* Nav */}
        <nav style={{ display: 'flex', flexDirection: 'column', gap: 3, flex: 1 }}>
          {navItems.map(item => {
            const active = abaAtiva === item.id;
            return (
              <button
                key={item.id}
                className="ap-nav-item ap-sidebar-btn"
                onClick={() => setAbaAtiva(item.id)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: sidebarAberta ? '11px 14px' : '11px 0',
                  justifyContent: sidebarAberta ? 'flex-start' : 'center',
                  border: 'none', borderRadius: T.radiusSm, cursor: 'pointer',
                  background: active ? T.greenDim : 'transparent',
                  color: active ? T.green : T.textSecond,
                  fontSize: 13, fontWeight: active ? 600 : 400,
                  width: '100%',
                  borderLeft: active ? `3px solid ${T.green}` : '3px solid transparent',
                }}
              >
                <span style={{ flexShrink: 0, opacity: active ? 1 : 0.6 }}>{item.icon}</span>
                {sidebarAberta && <span>{item.label}</span>}
              </button>
            );
          })}
        </nav>

        {/* Logout */}
        <button
          className="ap-logout"
          onClick={handleLogout}
          style={{
            display: 'flex', alignItems: 'center', justifyContent: sidebarAberta ? 'flex-start' : 'center',
            gap: 10, padding: sidebarAberta ? '11px 14px' : '11px 0',
            background: 'rgba(232,114,114,0.1)', border: '1px solid rgba(232,114,114,0.2)',
            borderRadius: T.radiusSm, color: T.rose, cursor: 'pointer',
            fontSize: 13, fontWeight: 500, width: '100%',
            transition: 'background 0.2s',
          }}
        >
          <IconLogout />
          {sidebarAberta && <span>Sair</span>}
        </button>
      </aside>

      {/* ── MAIN CONTENT ── */}
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

        {/* Summary Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 32 }}>
          {summaryCards.map((card, i) => (
            <div key={i} className="ap-summary-card" style={{
              background: card.bg,
              border: `1px solid ${card.accent}22`,
              borderRadius: T.radius,
              padding: '20px 22px',
              position: 'relative',
              overflow: 'hidden',
            }}>
              <div style={{
                position: 'absolute', top: -20, right: -20,
                width: 80, height: 80, borderRadius: '50%',
                background: `radial-gradient(circle, ${card.accent}18, transparent 70%)`,
              }} />
              <div style={{ fontSize: 10, color: card.accent, fontWeight: 600, letterSpacing: '1px', textTransform: 'uppercase', marginBottom: 10 }}>
                {card.label}
              </div>
              <div style={{ fontSize: 28, fontFamily: T.fontDisplay, fontWeight: 400, color: T.textPrimary, lineHeight: 1 }}>
                {card.value}
              </div>
            </div>
          ))}
        </div>

        {/* ── ABA DOAÇÕES ── */}
        {abaAtiva === 'doacoes' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            {/* Doações por alimento */}
            <Card title="Doações por alimento" className="ap-card">
              {contagem.length === 0
                ? <EmptyState text="Nenhuma doação registrada ainda." />
                : contagem.map(item => {
                    const pct = (item.total / Math.max(...contagem.map(c => c.total))) * 100;
                    return (
                      <div key={item.nome} style={{ marginBottom: 18 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 7, fontSize: 13 }}>
                          <span style={{ color: T.textPrimary, fontWeight: 500 }}>{item.nome}</span>
                          <span style={{ color: T.green, fontWeight: 600 }}>{item.total} kg</span>
                        </div>
                        <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: 6, height: 7, overflow: 'hidden' }}>
                          <div className="ap-bar-fill" style={{ width: `${pct}%`, background: `linear-gradient(90deg, ${T.green}, ${T.teal})`, height: '100%', borderRadius: 6 }} />
                        </div>
                      </div>
                    );
                  })
              }
            </Card>

            {/* Progresso das metas */}
            <Card title="Progresso das metas" className="ap-card">
              {metas.length === 0
                ? <EmptyState text="Nenhuma meta cadastrada." />
                : metas.map(meta => {
                    const atual = contagem.find(c => c.nome === meta.alimento)?.total || 0;
                    const pct = meta.quantidadeKg > 0 ? (atual / meta.quantidadeKg) * 100 : 0;
                    const pctClamp = Math.min(pct, 100);
                    const barColor = pct >= 100 ? T.green : pct >= 50 ? T.amber : T.rose;
                    return (
                      <div key={meta.id} style={{ marginBottom: 22 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 7, fontSize: 13 }}>
                          <span style={{ color: T.textPrimary, fontWeight: 500 }}>{meta.alimento}</span>
                          <span style={{ color: barColor, fontWeight: 700 }}>{pct.toFixed(0)}%</span>
                        </div>
                        <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: 6, height: 6, overflow: 'hidden', marginBottom: 5 }}>
                          <div className="ap-bar-fill" style={{ width: `${pctClamp}%`, background: barColor, height: '100%', borderRadius: 6 }} />
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: T.textMuted }}>
                          <span>{atual} kg arrecadados</span>
                          <span>Meta: {meta.quantidadeKg} kg</span>
                        </div>
                      </div>
                    );
                  })
              }
            </Card>

            {/* Últimas doações - full width */}
            <div style={{ gridColumn: 'span 2' }}>
              <Card title="Últimas doações" className="ap-card">
                <UltimasDoacoes equipe={minhaEquipe} />
              </Card>
            </div>
          </div>
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
                        const atual = contagem.find(c => c.nome === meta.alimento)?.total || 0;
                        const pct = meta.quantidadeKg > 0 ? (atual / meta.quantidadeKg) * 100 : 0;
                        const isOpen = meta.status === 'em_aberto';
                        return (
                          <tr key={meta.id} className="ap-table-row">
                            <td style={td}><strong style={{ color: T.textPrimary }}>{meta.alimento}</strong></td>
                            <td style={td}>{meta.quantidadeKg}</td>
                            <td style={td}>{atual}</td>
                            <td style={td}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                <div style={{ flex: 1, background: 'rgba(255,255,255,0.06)', borderRadius: 4, height: 6, overflow: 'hidden', minWidth: 80 }}>
                                  <div style={{ width: `${Math.min(pct, 100)}%`, background: `linear-gradient(90deg, ${T.green}, ${T.teal})`, height: '100%', borderRadius: 4 }} />
                                </div>
                                <span style={{ fontSize: 12, color: T.textSecond, flexShrink: 0 }}>{pct.toFixed(0)}%</span>
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
          <Card title="Ranking Geral" className="ap-card">
            {ranking.length === 0
              ? <EmptyState text="Nenhuma doação registrada." />
              : (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr>
                        {['Pos.', 'Equipe', 'Total (kg)'].map(h => (
                          <th key={h} style={{ textAlign: 'left', padding: '10px 14px', borderBottom: `1px solid ${T.border}`, fontSize: 11, fontWeight: 600, color: T.textMuted, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {ranking.map((equipe, idx) => {
                        const isMe = equipe.nome === minhaEquipe;
                        const medals = ['🥇', '🥈', '🥉'];
                        return (
                          <tr key={equipe.nome} className="ap-table-row" style={{ background: isMe ? T.greenDim : 'transparent' }}>
                            <td style={td}>
                              <span style={{ fontFamily: T.fontDisplay, fontSize: 17, color: idx < 3 ? T.amber : T.textSecond }}>
                                {medals[idx] || `${idx + 1}º`}
                              </span>
                            </td>
                            <td style={td}>
                              <span style={{ color: isMe ? T.green : T.textPrimary, fontWeight: isMe ? 600 : 400 }}>
                                {equipe.nome}
                              </span>
                              {isMe && <span style={{ marginLeft: 8, fontSize: 10, background: T.greenDim, color: T.green, padding: '2px 8px', borderRadius: 12, border: `1px solid ${T.green}33`, fontWeight: 600 }}>você</span>}
                            </td>
                            <td style={td}>
                              <strong style={{ color: isMe ? T.green : T.textPrimary }}>{equipe.total} kg</strong>
                            </td>
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
      </main>
    </div>
  );
};

// ── Estilo de célula de tabela ──
const td = {
  padding: '13px 14px',
  borderBottom: '1px solid rgba(134,188,118,0.07)',
  fontSize: 13,
  color: '#8aab80',
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
      fontSize: 17,
      fontWeight: 400,
      color: '#e8f5e4',
      margin: '0 0 22px',
      paddingBottom: 14,
      borderBottom: '1px solid rgba(134,188,118,0.1)',
      display: 'flex',
      alignItems: 'center',
      gap: 10,
    }}>
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

const UltimasDoacoes = ({ equipe }) => {
  const [doacoes, setDoacoes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const q = query(collection(db, 'contagem'), where('equipe', '==', equipe));
        const snap = await getDocs(q);
        const lista = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        lista.sort((a, b) => new Date(b.dataRegistro) - new Date(a.dataRegistro));
        setDoacoes(lista.slice(0, 10));
      } catch (e) { console.error(e); }
      setLoading(false);
    })();
  }, [equipe]);

  if (loading) return <p style={{ color: '#4d6647', textAlign: 'center', padding: 32, fontSize: 13 }}>Carregando…</p>;
  if (doacoes.length === 0) return <EmptyState text="Nenhuma doação registrada." />;

  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            {['Alimento', 'Quantidade (kg)', 'Doador', 'Data'].map(h => (
              <th key={h} style={{ textAlign: 'left', padding: '10px 14px', borderBottom: '1px solid rgba(134,188,118,0.12)', fontSize: 11, fontWeight: 600, color: '#4d6647', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {doacoes.map(doc => (
            <tr key={doc.id} className="ap-table-row">
              <td style={td}>{doc.alimento}</td>
              <td style={td}><strong style={{ color: '#86bc76' }}>{doc.quantidade} kg</strong></td>
              <td style={td}>{doc.usuarioNome || '–'}</td>
              <td style={{ ...td, color: '#4d6647' }}>{doc.dataRegistro}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

// ============================================================
// ÍCONES SVG INLINE
// ============================================================
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
const IconLogout = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
    <polyline points="16,17 21,12 16,7"/><line x1="21" y1="12" x2="9" y2="12"/>
  </svg>
);

export default AlunoPainel;