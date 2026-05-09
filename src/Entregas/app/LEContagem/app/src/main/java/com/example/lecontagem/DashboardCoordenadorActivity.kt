package com.example.lecontagem

import android.graphics.Color
import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.*
import androidx.appcompat.app.AppCompatActivity
import androidx.recyclerview.widget.LinearLayoutManager
import androidx.recyclerview.widget.RecyclerView
import com.github.mikephil.charting.charts.BarChart
import com.github.mikephil.charting.components.XAxis
import com.github.mikephil.charting.data.*
import com.github.mikephil.charting.formatter.IndexAxisValueFormatter
import com.google.android.material.appbar.MaterialToolbar
import com.google.firebase.auth.FirebaseAuth
import com.google.firebase.firestore.FirebaseFirestore
import com.google.firebase.firestore.ListenerRegistration

class DashboardCoordenadorActivity : AppCompatActivity() {

    private val db = FirebaseFirestore.getInstance()
    private val auth = FirebaseAuth.getInstance()

    private lateinit var barChart: BarChart
    private lateinit var rvAlimentos: RecyclerView
    private lateinit var txtPercentual: TextView
    private lateinit var txtKilos: TextView
    private lateinit var progressGlobal: ProgressBar
    private lateinit var toolbar: MaterialToolbar

    private var listenerMetas: ListenerRegistration? = null
    private var listenerContagem: ListenerRegistration? = null

    data class ProducaoAlimento(val nome: String, var meta: Float = 0f, var real: Float = 0f)

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.dashboardcoordenador)

        // Inicialização dos componentes
        toolbar = findViewById(R.id.toolbarDashCoordenador)
        barChart = findViewById(R.id.barChartEquipeUnica)
        rvAlimentos = findViewById(R.id.rvDetalheAlimentos)
        txtPercentual = findViewById(R.id.txtPercentualEquipe)
        txtKilos = findViewById(R.id.txtKilosEquipe)
        progressGlobal = findViewById(R.id.progressGlobalEquipe)

        toolbar.setNavigationOnClickListener { finish() }
        rvAlimentos.layoutManager = LinearLayoutManager(this)

        carregarDadosCoordenador()
    }

    private fun carregarDadosCoordenador() {
        val uid = auth.currentUser?.uid ?: return

        // Busca a equipe do usuário logado
        db.collection("users").document(uid).get().addOnSuccessListener { userDoc ->
            val minhaEquipe = userDoc.getString("equipe") ?: "Indefinida"

            // TITULO DINÂMICO AQUI
            toolbar.title = "Desempenho $minhaEquipe"

            // Inicia os ouvintes em tempo real
            ouvirProducaoEmTempoReal(minhaEquipe)
        }
    }

    private fun ouvirProducaoEmTempoReal(equipe: String) {
        listenerMetas?.remove()
        listenerContagem?.remove()

        val mapaAlimentos = mutableMapOf<String, ProducaoAlimento>()

        // Ouvinte de Metas
        listenerMetas = db.collection("metas").whereEqualTo("equipe", equipe)
            .addSnapshotListener { snapMetas, _ ->
                if (snapMetas == null) return@addSnapshotListener

                mapaAlimentos.clear()
                for (doc in snapMetas) {
                    val nome = doc.getString("alimento") ?: "Outros"
                    val metaVal = doc.getDouble("quantidadeKg")?.toFloat() ?: 0f
                    mapaAlimentos[nome] = ProducaoAlimento(nome, meta = metaVal)
                }

                // Ouvinte de Contagens (Aninhado)
                listenerContagem = db.collection("contagem").whereEqualTo("equipe", equipe)
                    .addSnapshotListener { snapCont, _ ->
                        if (snapCont == null) return@addSnapshotListener

                        // Reset do real antes de somar
                        mapaAlimentos.values.forEach { it.real = 0f }

                        for (doc in snapCont) {
                            val nome = doc.getString("alimento") ?: ""
                            val qtd = doc.getDouble("quantidade")?.toFloat() ?: 0f
                            if (mapaAlimentos.containsKey(nome)) {
                                mapaAlimentos[nome]?.real += qtd
                            }
                        }

                        atualizarGraficoEInterface(mapaAlimentos.values.toList())
                    }
            }
    }

    private fun atualizarGraficoEInterface(dados: List<ProducaoAlimento>) {
        val entriesMeta = ArrayList<BarEntry>()
        val entriesReal = ArrayList<BarEntry>()
        val labels = ArrayList<String>()

        var totalMeta = 0f
        var totalReal = 0f

        dados.forEachIndexed { i, p ->
            entriesMeta.add(BarEntry(i.toFloat(), p.meta))
            entriesReal.add(BarEntry(i.toFloat(), p.real))
            labels.add(p.nome)
            totalMeta += p.meta
            totalReal += p.real
        }

        // Configuração do BarChart
        val setMeta = BarDataSet(entriesMeta, "Meta").apply { color = Color.parseColor("#BDBDBD") }
        val setReal = BarDataSet(entriesReal, "Realizado").apply { color = Color.parseColor("#2E7D32") }

        barChart.data = BarData(setMeta, setReal).apply {
            barWidth = 0.35f
            setValueTextSize(10f)
        }

        barChart.xAxis.apply {
            valueFormatter = IndexAxisValueFormatter(labels)
            position = XAxis.XAxisPosition.BOTTOM
            setCenterAxisLabels(true)
            granularity = 1f
            axisMinimum = -0.5f
            axisMaximum = dados.size - 0.5f
        }

        barChart.groupBars(-0.5f, 0.2f, 0.05f)
        barChart.description.isEnabled = false
        barChart.animateY(800)
        barChart.invalidate()

        // Atualiza Lista e Barra de Resumo
        rvAlimentos.adapter = AlimentoAdapter(dados)

        val pctTotal = if (totalMeta > 0) (totalReal / totalMeta * 100) else 0f
        txtPercentual.text = "Atingimento: ${String.format("%.1f", pctTotal)}%"
        txtKilos.text = "${totalReal.toInt()} / ${totalMeta.toInt()} kg totais"
        progressGlobal.progress = pctTotal.toInt()
    }

    override fun onDestroy() {
        super.onDestroy()
        listenerMetas?.remove()
        listenerContagem?.remove()
    }

    // Adapter Interno para os itens detalhados
    inner class AlimentoAdapter(val lista: List<ProducaoAlimento>) : RecyclerView.Adapter<AlimentoAdapter.VH>() {
        inner class VH(v: View) : RecyclerView.ViewHolder(v) {
            val tNome = v.findViewById<TextView>(R.id.detalheEquipeNome)
            val tVal = v.findViewById<TextView>(R.id.detalheValores)
            val tPerc = v.findViewById<TextView>(R.id.detalhePercentual)
            val prog = v.findViewById<ProgressBar>(R.id.detalheProgress)
        }
        override fun onCreateViewHolder(p: ViewGroup, t: Int) = VH(
            LayoutInflater.from(p.context).inflate(R.layout.item_equipe_detalhe, p, false)
        )
        override fun onBindViewHolder(h: VH, p: Int) {
            val item = lista[p]
            val pct = if (item.meta > 0) (item.real / item.meta * 100).toInt() else 0
            h.tNome.text = item.nome
            h.tVal.text = "${item.real}kg de ${item.meta}kg"
            h.tPerc.text = "$pct%"
            h.prog.progress = if (pct > 100) 100 else pct

            val cor = if (pct >= 100) "#1B5E20" else if (pct >= 50) "#F9A825" else "#C62828"
            h.prog.progressTintList = android.content.res.ColorStateList.valueOf(Color.parseColor(cor))
        }
        override fun getItemCount() = lista.size
    }
}