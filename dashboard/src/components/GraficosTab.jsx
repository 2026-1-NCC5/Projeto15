// src/components/GraficosTab.jsx
//
// Dependência: npm install chart.js react-chartjs-2
//
// Uso no AlunoPainel.js:
//   import GraficosTab from '../components/GraficosTab';
//   ...
//   {abaAtiva === 'graficos' && (
//     <GraficosTab contagem={contagem} metas={metas} minhaEquipe={minhaEquipe} ranking={ranking} />
//   )}

import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Bar, Doughnut } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Tooltip,
  Legend,
  Filler
);

const T = {
  bgCard:      '#192118',
  border:      'rgba(134,188,118,0.12)',
  green:       '#86bc76',
  teal:        '#4db8a4',
  amber:       '#f0a853',
  rose:        '#e87272',
  sapphire:    '#5b8ef0',
  textPrimary: '#e8f5e4',
  textSecond:  '#8aab80',
  textMuted:   '#4d6647',
  fontDisplay: '"DM Serif Display", serif',
  fontBody:    '"DM Sans", sans-serif',
  radius:      '14px',
};

const PIE_COLORS = ['#86bc76', '#4db8a4', '#f0a853', '#5b8ef0', '#d4537e', '#888780'];

const TOOLTIP = {
  backgroundColor: '#1e2a20',
  titleColor: '#e8f5e4',
  bodyColor: '#8aab80',
  borderColor: 'rgba(134,188,118,0.12)',
  borderWidth: 1,
};

// ── Card ──────────────────────────────────────────────────
function GraficoCard({ title, children }) {
  return (
    <div style={{
      background: T.bgCard,
      border: `1px solid ${T.border}`,
      borderRadius: T.radius,
      padding: '22px 24px',
    }}>
      <h3 style={{
        fontFamily: T.fontDisplay,
        fontSize: 16,
        fontWeight: 400,
        color: T.textPrimary,
        margin: '0 0 18px',
        paddingBottom: 12,
        borderBottom: `1px solid ${T.border}`,
        display: 'flex',
        alignItems: 'center',
        gap: 10,
      }}>
        <span style={{
          display: 'block', width: 3, height: 16,
          background: `linear-gradient(180deg, ${T.green}, ${T.teal})`,
          borderRadius: 2, flexShrink: 0,
        }} />
        {title}
      </h3>
      {children}
    </div>
  );
}

// ── Legenda customizada ───────────────────────────────────
function GraficoLegenda({ items }) {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginBottom: 14 }}>
      {items.map(({ color, label }) => (
        <span key={label} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: T.textSecond }}>
          <span style={{ width: 10, height: 10, borderRadius: 2, background: color, flexShrink: 0 }} />
          {label}
        </span>
      ))}
    </div>
  );
}

// ══════════════════════════════════════════════════════════
// COMPONENTE PRINCIPAL
// ══════════════════════════════════════════════════════════
export default function GraficosTab({ contagem = [], metas = [], minhaEquipe = '', ranking = [] }) {

  const alimentoLabels = contagem.map(c => c.nome);
  const alimentoQtd    = contagem.map(c => c.total);
  const totalArrecadado = alimentoQtd.reduce((a, b) => a + b, 0);

  // ── Barras: doações por alimento ─────────────────────────
  const barAlimentosData = {
    labels: alimentoLabels,
    datasets: [{
      label: 'kg',
      data: alimentoQtd,
      backgroundColor: `${T.green}99`,
      borderColor: T.green,
      borderWidth: 1,
      borderRadius: 4,
    }],
  };

  const barAlimentosOpts = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: { ...TOOLTIP, callbacks: { label: ctx => ` ${ctx.parsed.y} kg` } },
    },
    scales: {
      x: {
        ticks: { color: T.textMuted, font: { family: T.fontBody, size: 12 } },
        grid: { display: false },
        border: { color: 'transparent' },
      },
      y: {
        ticks: { color: T.textMuted, font: { family: T.fontBody, size: 11 } },
        grid: { color: 'rgba(255,255,255,0.05)' },
        border: { color: 'transparent' },
      },
    },
  };

  // ── Doughnut: distribuição ────────────────────────────────
  const doughnutData = {
    labels: alimentoLabels,
    datasets: [{
      data: alimentoQtd,
      backgroundColor: PIE_COLORS.slice(0, alimentoLabels.length),
      borderColor: T.bgCard,
      borderWidth: 2,
      hoverOffset: 6,
    }],
  };

  const doughnutOpts = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '62%',
    plugins: {
      legend: { display: false },
      tooltip: {
        ...TOOLTIP,
        callbacks: {
          label: ctx => {
            const total = ctx.dataset.data.reduce((a, b) => a + b, 0);
            const pct = total > 0 ? Math.round((ctx.parsed / total) * 100) : 0;
            return ` ${ctx.label} — ${ctx.parsed} kg (${pct}%)`;
          },
        },
      },
    },
  };

  // ── Barras horizontais: metas ────────────────────────────
  const metaLabels  = metas.map(m => m.alimento);
  const metaPct     = metas.map(m => {
    const atual = contagem.find(c => c.nome === m.alimento)?.total || 0;
    return m.quantidadeKg > 0 ? Math.min(Math.round((atual / m.quantidadeKg) * 100), 100) : 0;
  });
  const metaBarColors = metaPct.map(p => p >= 80 ? T.green : p >= 50 ? T.amber : T.rose);

  const barMetasData = {
    labels: metaLabels,
    datasets: [{
      label: '%',
      data: metaPct,
      backgroundColor: metaBarColors.map(c => c + 'aa'),
      borderColor: metaBarColors,
      borderWidth: 1,
      borderRadius: 4,
    }],
  };

  const barMetasOpts = {
    responsive: true,
    maintainAspectRatio: false,
    indexAxis: 'y',
    plugins: {
      legend: { display: false },
      tooltip: { ...TOOLTIP, callbacks: { label: ctx => ` ${ctx.parsed.x}% da meta` } },
    },
    scales: {
      x: {
        min: 0,
        max: 100,
        ticks: {
          color: T.textMuted,
          font: { family: T.fontBody, size: 11 },
          callback: v => `${v}%`,
        },
        grid: { color: 'rgba(255,255,255,0.05)' },
        border: { color: 'transparent' },
      },
      y: {
        ticks: { color: T.textSecond, font: { family: T.fontBody, size: 12 } },
        grid: { display: false },
        border: { color: 'transparent' },
      },
    },
  };

  // ── Barras: ranking top 5 ────────────────────────────────
  const top5           = ranking.slice(0, 5);
  const rankingLabels  = top5.map(r => r.nome);
  const rankingQtd     = top5.map(r => r.total);
  const rankingBgColors = top5.map(r => r.nome === minhaEquipe ? `${T.green}99` : `${T.sapphire}66`);
  const rankingBdColors = top5.map(r => r.nome === minhaEquipe ? T.green : T.sapphire);

  const barRankingData = {
    labels: rankingLabels,
    datasets: [{
      label: 'kg',
      data: rankingQtd,
      backgroundColor: rankingBgColors,
      borderColor: rankingBdColors,
      borderWidth: 1,
      borderRadius: 4,
    }],
  };

  const barRankingOpts = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: { ...TOOLTIP, callbacks: { label: ctx => ` ${ctx.parsed.y} kg` } },
    },
    scales: {
      x: {
        ticks: { color: T.textMuted, font: { family: T.fontBody, size: 12 } },
        grid: { display: false },
        border: { color: 'transparent' },
      },
      y: {
        ticks: { color: T.textMuted, font: { family: T.fontBody, size: 11 } },
        grid: { color: 'rgba(255,255,255,0.05)' },
        border: { color: 'transparent' },
      },
    },
  };

  // ── Render ───────────────────────────────────────────────
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, fontFamily: T.fontBody }}>

      {/* Linha 1: barras + doughnut */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>

        <GraficoCard title="Doações por alimento">
          <GraficoLegenda items={[{ color: T.green, label: 'Quantidade arrecadada (kg)' }]} />
          <div style={{ position: 'relative', height: 220 }}>
            <Bar data={barAlimentosData} options={barAlimentosOpts} />
          </div>
        </GraficoCard>

        <GraficoCard title="Distribuição por alimento">
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginBottom: 14 }}>
            {alimentoLabels.map((nome, i) => {
              const pct = totalArrecadado > 0
                ? Math.round((alimentoQtd[i] / totalArrecadado) * 100)
                : 0;
              return (
                <span key={nome} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: T.textSecond }}>
                  <span style={{ width: 10, height: 10, borderRadius: 2, background: PIE_COLORS[i], flexShrink: 0 }} />
                  {nome} <strong style={{ color: T.textPrimary }}>{pct}%</strong>
                </span>
              );
            })}
          </div>
          <div style={{ position: 'relative', height: 200 }}>
            <Doughnut data={doughnutData} options={doughnutOpts} />
          </div>
        </GraficoCard>

      </div>

      {/* Linha 2: progresso das metas */}
      {metas.length > 0 && (
        <GraficoCard title="Progresso das metas">
          <GraficoLegenda items={[
            { color: T.green, label: '≥ 80% — no caminho' },
            { color: T.amber, label: '50–79% — em andamento' },
            { color: T.rose,  label: '< 50% — atenção' },
          ]} />
          <div style={{ position: 'relative', height: Math.max(140, metas.length * 44 + 40) }}>
            <Bar data={barMetasData} options={barMetasOpts} />
          </div>
        </GraficoCard>
      )}

      {/* Linha 3: ranking top 5 */}
      {ranking.length > 0 && (
        <GraficoCard title="Ranking — top 3 equipes">
          <GraficoLegenda items={[
            { color: T.green,    label: 'Sua equipe' },
            { color: T.sapphire, label: 'Outras equipes' },
          ]} />
          <div style={{ position: 'relative', height: 200 }}>
            <Bar data={barRankingData} options={barRankingOpts} />
          </div>
        </GraficoCard>
      )}

    </div>
  );
}