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
import com.google.firebase.firestore.FirebaseFirestore
import com.google.firebase.firestore.ListenerRegistration

class HistoricoActivity : AppCompatActivity() {

    private val db = FirebaseFirestore.getInstance()
    private lateinit var barChart: BarChart
    private lateinit var rvEquipes: RecyclerView
    private lateinit var spinnerAlimento: Spinner
    private lateinit var txtPercentual: TextView
    private lateinit var txtKilos: TextView
    private lateinit var progressGlobal: ProgressBar

    // Listeners para fechar quando a activity for destruída (evita vazamento de memória)
    private var listenerMetas: ListenerRegistration? = null
    private var listenerContagem: ListenerRegistration? = null

    data class Performance(val equipe: String, var meta: Float = 0f, var real: Float = 0f)

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_historico)

        val toolbar = findViewById<MaterialToolbar>(R.id.toolbarHistorico)
        toolbar.setNavigationOnClickListener { finish() }

        barChart = findViewById(R.id.barChartEquipes)
        rvEquipes = findViewById(R.id.rvEquipesDetalhe)
        spinnerAlimento = findViewById(R.id.spinnerAlimentoFiltro)
        txtPercentual = findViewById(R.id.txtResumoPercentual)
        txtKilos = findViewById(R.id.txtKilosTotais)
        progressGlobal = findViewById(R.id.progressGlobal)

        rvEquipes.layoutManager = LinearLayoutManager(this)

        setupSpinner()
    }

    private fun setupSpinner() {
        val listaAlimentos = listOf("Café", "Arroz", "Feijão", "Açúcar", "Óleo", "Macarrão")
        spinnerAlimento.adapter = ArrayAdapter(this, android.R.layout.simple_spinner_dropdown_item, listaAlimentos)

        spinnerAlimento.onItemSelectedListener = object : AdapterView.OnItemSelectedListener {
            override fun onItemSelected(p0: AdapterView<*>?, p1: View?, p2: Int, p3: Long) {
                // Sempre que mudar o alimento, reiniciamos os ouvintes em tempo real
                ouvirDadosEmTempoReal(listaAlimentos[p2])
            }
            override fun onNothingSelected(p0: AdapterView<*>?) {}
        }
    }

    private fun ouvirDadosEmTempoReal(alimento: String) {
        // Remove ouvintes anteriores para não sobrepor dados de alimentos diferentes
        listenerMetas?.remove()
        listenerContagem?.remove()

        val performanceMap = mutableMapOf(
            "Equipe 1" to Performance("Equipe 1"),
            "Equipe 2" to Performance("Equipe 2"),
            "Equipe 3" to Performance("Equipe 3")
        )

        // SnapshotListener nas Metas
        listenerMetas = db.collection("metas").whereEqualTo("alimento", alimento)
            .addSnapshotListener { snapshotMetas, e ->
                if (e != null || snapshotMetas == null) return@addSnapshotListener

                // Reset das metas antes de somar
                performanceMap.values.forEach { it.meta = 0f }

                for (doc in snapshotMetas) {
                    val eq = doc.getString("equipe")?.trim() ?: ""
                    val v = doc.getDouble("quantidadeKg")?.toFloat() ?: 0f
                    if (performanceMap.containsKey(eq)) {
                        performanceMap[eq]?.meta = v
                    }
                }

                // SnapshotListener nas Contagens (Aninhado para garantir sincronia)
                listenerContagem = db.collection("contagem").whereEqualTo("alimento", alimento)
                    .addSnapshotListener { snapshotCont, e2 ->
                        if (e2 != null || snapshotCont == null) return@addSnapshotListener

                        // Reset do realizado antes de somar
                        performanceMap.values.forEach { it.real = 0f }

                        for (doc in snapshotCont) {
                            val eq = doc.getString("equipe")?.trim() ?: ""
                            val v = doc.getDouble("quantidade")?.toFloat() ?: 0f
                            // AQUI resolve o problema da Equipe 3:
                            // Verificamos se o nome bate exatamente com a chave do mapa
                            if (performanceMap.containsKey(eq)) {
                                performanceMap[eq]?.real += v
                            }
                        }

                        val listaFinal = performanceMap.values.toList()
                        atualizarInterface(listaFinal)
                    }
            }
    }

    private fun atualizarInterface(dados: List<Performance>) {
        // Atualiza Gráfico
        atualizarGrafico(dados)

        // Atualiza Lista Detalhada
        rvEquipes.adapter = EquipeAdapter(dados)

        // Atualiza Resumo Global (Barra de baixo)
        var totalMeta = 0f
        var totalReal = 0f
        dados.forEach {
            totalMeta += it.meta
            totalReal += it.real
        }

        val percentual = if (totalMeta > 0) (totalReal / totalMeta) * 100 else 0f
        txtPercentual.text = "Atingimento: ${String.format("%.1f", percentual)}%"
        txtKilos.text = "${totalReal.toInt()} / ${totalMeta.toInt()} kg"
        progressGlobal.progress = percentual.toInt()
    }

    private fun atualizarGrafico(dados: List<Performance>) {
        val eMeta = ArrayList<BarEntry>()
        val eReal = ArrayList<BarEntry>()
        val labels = ArrayList<String>()

        dados.forEachIndexed { i, p ->
            eMeta.add(BarEntry(i.toFloat(), p.meta))
            eReal.add(BarEntry(i.toFloat(), p.real))
            labels.add(p.equipe)
        }

        val sMeta = BarDataSet(eMeta, "Meta").apply { color = Color.parseColor("#BDBDBD") }
        val sReal = BarDataSet(eReal, "Realizado").apply { color = Color.parseColor("#2E7D32") }

        val data = BarData(sMeta, sReal).apply {
            barWidth = 0.3f
            setValueTextSize(10f)
        }

        barChart.data = data
        barChart.xAxis.apply {
            valueFormatter = IndexAxisValueFormatter(labels)
            position = XAxis.XAxisPosition.BOTTOM
            setCenterAxisLabels(true)
            granularity = 1f
            axisMinimum = -0.5f // Ajuste para centralizar as barras
            axisMaximum = dados.size - 0.5f
        }

        barChart.groupBars(-0.5f, 0.3f, 0.05f) // Espaçamento entre colunas
        barChart.description.isEnabled = false
        barChart.setFitBars(true)
        barChart.invalidate() // Atualiza o desenho
    }

    override fun onDestroy() {
        super.onDestroy()
        listenerMetas?.remove()
        listenerContagem?.remove()
    }

    inner class EquipeAdapter(val lista: List<Performance>) : RecyclerView.Adapter<EquipeAdapter.VH>() {
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
            h.tNome.text = item.equipe
            h.tVal.text = "${item.real}kg de ${item.meta}kg"
            h.tPerc.text = "$pct%"
            h.prog.progress = if (pct > 100) 100 else pct

            // Cor da barra individual (Verde se atingiu, Vermelho se está longe)
            val cor = if (pct >= 100) "#2E7D32" else if (pct >= 50) "#FBC02D" else "#C62828"
            h.prog.progressTintList = android.content.res.ColorStateList.valueOf(Color.parseColor(cor))
        }
        override fun getItemCount() = lista.size
    }
}