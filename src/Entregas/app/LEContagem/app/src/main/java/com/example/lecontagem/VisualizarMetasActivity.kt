package com.example.lecontagem

import android.graphics.Color
import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.ImageButton
import android.widget.ProgressBar
import android.widget.TextView
import androidx.appcompat.app.AppCompatActivity
import androidx.recyclerview.widget.LinearLayoutManager
import androidx.recyclerview.widget.RecyclerView
import com.google.firebase.auth.FirebaseAuth
import com.google.firebase.firestore.FirebaseFirestore
import com.google.firebase.firestore.ListenerRegistration

class VisualizarMetasActivity : AppCompatActivity() {

    private lateinit var rvMetas: RecyclerView
    private lateinit var txtEquipeNome: TextView
    private lateinit var btnVoltar: ImageButton
    private val db = FirebaseFirestore.getInstance()
    private val auth = FirebaseAuth.getInstance()

    private val listaExibicao = mutableListOf<MetaProgresso>()
    private lateinit var adapter: MetasAdapter

    private var listenerMetas: ListenerRegistration? = null
    private var listenerContagens: ListenerRegistration? = null

    // Modelo de dados para a lista
    data class MetaProgresso(
        val alimento: String,
        var meta: Double = 0.0,
        var atual: Double = 0.0,
        var data: String = ""
    )

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.visualizar_metas)

        // Inicialização de UI
        rvMetas = findViewById(R.id.rvMetas)
        txtEquipeNome = findViewById(R.id.txtEquipeNome)
        btnVoltar = findViewById(R.id.btnVoltarMetas)

        rvMetas.layoutManager = LinearLayoutManager(this)
        adapter = MetasAdapter(listaExibicao)
        rvMetas.adapter = adapter

        btnVoltar.setOnClickListener { finish() }

        iniciarFluxoReativo()
    }

    private fun iniciarFluxoReativo() {
        val uid = auth.currentUser?.uid ?: return

        // Busca a equipe do usuário para filtrar os dados
        db.collection("users").document(uid).get().addOnSuccessListener { userDoc ->
            val equipe = userDoc.getString("equipe") ?: ""
            txtEquipeNome.text = "Equipe: $equipe"

            if (equipe.isNotEmpty()) {
                configurarEscutaTempoReal(equipe)
            }
        }
    }

    private fun configurarEscutaTempoReal(equipe: String) {
        listenerMetas?.remove()
        listenerContagens?.remove()

        // 1. Monitora a coleção 'metas' (campo: quantidadeKg)
        listenerMetas = db.collection("metas")
            .whereEqualTo("equipe", equipe)
            .addSnapshotListener { snapshotMetas, erroMeta ->
                if (erroMeta != null) return@addSnapshotListener
                val docsMetas = snapshotMetas?.documents ?: return@addSnapshotListener

                val mapaDados = mutableMapOf<String, MetaProgresso>()

                for (doc in docsMetas) {
                    val alim = doc.getString("alimento") ?: ""
                    // Correção baseada no seu Firestore: quantidadeKg
                    val qtdMeta = doc.getDouble("quantidadeKg") ?: 0.0
                    val prazo = doc.getString("dataLimite") ?: ""

                    if (mapaDados.containsKey(alim)) {
                        mapaDados[alim]?.meta = (mapaDados[alim]?.meta ?: 0.0) + qtdMeta
                    } else {
                        mapaDados[alim] = MetaProgresso(alim, qtdMeta, 0.0, prazo)
                    }
                }

                // 2. Monitora a coleção 'contagem' (campo: quantidade)
                listenerContagens = db.collection("contagem")
                    .whereEqualTo("equipe", equipe)
                    .addSnapshotListener { snapshotCont, erroCont ->
                        if (erroCont != null) return@addSnapshotListener
                        val docsCont = snapshotCont?.documents ?: return@addSnapshotListener

                        // Resetamos o valor 'atual' para recalcular a soma real
                        mapaDados.values.forEach { it.atual = 0.0 }

                        for (docC in docsCont) {
                            val alimC = docC.getString("alimento") ?: ""
                            // Correção baseada no seu Firestore: quantidade
                            val qtdCont = docC.getDouble("quantidade") ?: 0.0

                            if (mapaDados.containsKey(alimC)) {
                                mapaDados[alimC]?.atual = (mapaDados[alimC]?.atual ?: 0.0) + qtdCont
                            }
                        }

                        // 3. Atualiza a lista da interface
                        listaExibicao.clear()
                        listaExibicao.addAll(mapaDados.values)
                        adapter.notifyDataSetChanged()
                    }
            }
    }

    override fun onDestroy() {
        super.onDestroy()
        listenerMetas?.remove()
        listenerContagens?.remove()
    }

    // --- ADAPTER INTERNO ---
    class MetasAdapter(private val metas: List<MetaProgresso>) :
        RecyclerView.Adapter<MetasAdapter.ViewHolder>() {

        class ViewHolder(v: View) : RecyclerView.ViewHolder(v) {
            val nome: TextView = v.findViewById(R.id.txtAlimentoMeta)
            val detalhes: TextView = v.findViewById(R.id.txtDetalhesMeta)
            val circular: ProgressBar = v.findViewById(R.id.progressCircular)
            val porc: TextView = v.findViewById(R.id.txtPorcentagem)
        }

        override fun onCreateViewHolder(parent: ViewGroup, viewType: Int) =
            ViewHolder(LayoutInflater.from(parent.context).inflate(R.layout.item_meta, parent, false))

        override fun onBindViewHolder(h: ViewHolder, p: Int) {
            val m = metas[p]

            // Cálculo: (Realizado / Meta) * 100
            val porcentagem = if (m.meta > 0) ((m.atual / m.meta) * 100).toInt() else 0

            h.nome.text = m.alimento

            // Texto: "X kg de Y kg"
            h.detalhes.text = String.format("%.2fkg de %.2fkg\nPrazo: %s", m.atual, m.meta, m.data)

            // Barra de Progresso
            h.circular.progress = if (porcentagem > 100) 100 else porcentagem
            h.porc.text = "$porcentagem%"

            // Cor Visual: Verde se atingiu a meta, Laranja se estiver pendente
            if (porcentagem >= 100) {
                h.porc.setTextColor(Color.parseColor("#1B5E20"))
            } else {
                h.porc.setTextColor(Color.parseColor("#E65100"))
            }
        }

        override fun getItemCount() = metas.size
    }
}