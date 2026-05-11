import React, { useState, useEffect, useRef } from 'react';
import { Camera, Database, Save, Activity, Trash2, ClipboardList, Maximize2 } from 'lucide-react';

function App() {
  const [isStreaming, setIsStreaming] = useState(false);
  const [data, setData] = useState({ itens_txt: "Vazio", peso: 0, valor: 0, pronto: false, progresso: 0 });
  const [historico, setHistorico] = useState([]);
  
  // --- NOVOS ESTADOS PARA O ACUMULADO MANUAL ---
  const [pesoAcumulado, setPesoAcumulado] = useState(0);
  const [valorAcumulado, setValorAcumulado] = useState(0);
  
  const timerRef = useRef(null);

  const toggleHardware = async () => {
    try {
      const res = await fetch('http://localhost:5000/toggle_camera', { method: 'POST' });
      const status = await res.json();
      setIsStreaming(status.status === 'ativa');
    } catch (err) { console.error("Erro na conexão"); }
  };

  useEffect(() => {
    if (isStreaming) {
      timerRef.current = setInterval(() => {
        fetch('http://localhost:5000/stats')
          .then(res => res.json())
          .then(d => setData(d))
          .catch(() => {});
      }, 400);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
      setData({ itens_txt: "Vazio", peso: 0, valor: 0, pronto: false, progresso: 0 });
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [isStreaming]);

  // --- FUNÇÃO DE SOMA (AO SALVAR) ---
  const salvarLote = () => {
    if (!data.pronto || data.peso <= 0) return;

    const valorAtualPeso = Number(data.peso);
    const valorAtualDinheiro = Number(data.valor);

    const novoRegistro = {
      id: `reg-${Date.now()}`,
      hora: new Date().toLocaleTimeString(),
      itens: data.itens_txt,
      peso: valorAtualPeso,
      valor: valorAtualDinheiro
    };

    // 1. Adiciona na lista visual
    setHistorico(prev => [novoRegistro, ...prev]);

    // 2. SOMA MANUALMENTE NO ACUMULADO
    setPesoAcumulado(prev => prev + valorAtualPeso);
    setValorAcumulado(prev => prev + valorAtualDinheiro);
  };

  // --- FUNÇÃO DE SUBTRAÇÃO (AO EXCLUIR) ---
  const removerRegistro = (registro) => {
    // 1. Remove da lista visual
    setHistorico(prev => prev.filter(item => item.id !== registro.id));

    // 2. SUBTRAI MANUALMENTE DO ACUMULADO
    setPesoAcumulado(prev => Math.max(0, prev - Number(registro.peso)));
    setValorAcumulado(prev => Math.max(0, prev - Number(registro.valor)));
  };

  return (
    <div className="min-h-screen bg-[#0d0f14] text-slate-300 font-sans p-8">
      <header className="max-w-7xl mx-auto flex justify-between items-center mb-10 border-b border-white/5 pb-6">
        <div className="flex items-center gap-4">
          <Activity size={32} className="text-orange-500" />
          <h1 className="text-2xl font-black text-white uppercase">Scanner Rampa 01</h1>
        </div>
        <div className={`px-6 py-2 rounded-full border-2 text-[10px] font-bold ${isStreaming ? 'border-green-500 text-green-500' : 'border-red-500 text-red-500'}`}>
          {isStreaming ? '• ONLINE' : '• STANDBY'}
        </div>
      </header>

      <div className="max-w-7xl mx-auto grid grid-cols-12 gap-8">
        
        {/* PAINEL DE ACUMULADOS */}
        <div className="col-span-12 lg:col-span-3 space-y-6">
          <div className="bg-[#161b22] p-6 rounded-[2rem] border border-white/5 shadow-2xl">
            <p className="text-[10px] font-black text-slate-500 mb-6 uppercase tracking-widest">
              <Database size={14} className="inline mr-2 text-orange-500"/> Acumulado Salvo
            </p>
            <div className="space-y-4">
              <div className="bg-black/40 p-5 rounded-2xl border border-white/5">
                <span className="text-[10px] block text-slate-500 mb-1 uppercase font-bold">Peso Total Geral</span>
                <span className="text-4xl font-black text-white">
                  {pesoAcumulado.toFixed(2)} <small className="text-lg opacity-40">kg</small>
                </span>
              </div>
              <div className="bg-green-500/5 p-5 rounded-2xl border border-green-500/10">
                <span className="text-[10px] block text-green-500 mb-1 uppercase font-bold">Valor Total Bruto</span>
                <span className="text-4xl font-black text-green-500">
                  <small className="text-lg">R$</small> {valorAcumulado.toFixed(2)}
                </span>
              </div>
            </div>
          </div>
          
          <div className="bg-orange-600/5 p-6 rounded-[2rem] border border-orange-600/20">
             <p className="text-[10px] font-black text-orange-600 mb-2 uppercase italic">Leitura Atual:</p>
             <p className="text-xs font-mono text-white h-12 uppercase font-bold">{data.itens_txt}</p>
             <div className="mt-4 h-2 bg-black rounded-full overflow-hidden">
                <div className="h-full bg-orange-600 transition-all duration-500" style={{ width: `${data.progresso}%` }}></div>
             </div>
          </div>
        </div>

        {/* FEED E BOTÃO */}
        <div className="col-span-12 lg:col-span-6 space-y-6">
          <div className="aspect-video bg-black rounded-[3rem] border-[14px] border-[#161b22] overflow-hidden flex items-center justify-center shadow-2xl">
            {isStreaming ? (
              <img src={`http://localhost:5000/video_feed?t=${Date.now()}`} alt="Feed" className="w-full h-full object-contain" />
            ) : (
              <div className="text-center opacity-10">
                <Maximize2 size={80} />
                <p className="mt-4 font-black text-xs uppercase">Hardware Desconectado</p>
              </div>
            )}
          </div>
          
          <div className="flex gap-4">
            <button onClick={toggleHardware} className="flex-1 py-6 bg-white text-black rounded-3xl font-black text-xs uppercase">
              {isStreaming ? "DESLIGAR" : "LIGAR"}
            </button>
            <button 
              onClick={salvarLote} 
              disabled={!data.pronto || data.peso <= 0} 
              className="flex-1 py-6 bg-orange-600 text-white rounded-3xl font-black text-xs uppercase disabled:opacity-20 shadow-lg shadow-orange-600/30"
            >
              <Save size={18} className="inline mr-2"/> REGISTRO DE SALVAR
            </button>
          </div>
        </div>

        {/* HISTÓRICO */}
        <div className="col-span-12 lg:col-span-3">
          <div className="bg-[#161b22] h-[580px] rounded-[2rem] border border-white/5 p-6 flex flex-col shadow-2xl">
            <h3 className="text-xs font-black text-white mb-6 border-b border-white/5 pb-4 uppercase">
              <ClipboardList size={16} className="inline mr-2 text-orange-500"/> Logs de Produção
            </h3>
            <div className="flex-1 overflow-y-auto space-y-4 pr-2 custom-scrollbar">
              {historico.map((log) => (
                <div key={log.id} className="bg-black/30 p-4 rounded-2xl border border-white/5 border-l-4 border-l-orange-600">
                  <div className="flex justify-between text-[9px] text-orange-500/70 mb-2 font-mono font-bold">
                    <span>{log.hora}</span>
                    <button onClick={() => removerRegistro(log)} className="hover:text-red-500">
                      <Trash2 size={12}/>
                    </button>
                  </div>
                  <p className="text-white font-black text-[10px] uppercase mb-1">{log.itens}</p>
                  <div className="flex justify-between border-t border-white/5 pt-2 text-[10px] font-bold">
                    <span className="text-slate-400">{log.peso.toFixed(2)} KG</span>
                    <span className="text-green-500">R$ {log.valor.toFixed(2)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

export default App;