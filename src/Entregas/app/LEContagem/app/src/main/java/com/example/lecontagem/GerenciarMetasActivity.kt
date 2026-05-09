package com.example.lecontagem

import android.os.Bundle
import android.widget.*
import androidx.appcompat.app.AppCompatActivity
import com.google.firebase.auth.FirebaseAuth
import com.google.firebase.firestore.FieldValue
import com.google.firebase.firestore.FirebaseFirestore

class GerenciarMetasActivity : AppCompatActivity() {

    private lateinit var spinnerEquipe: Spinner
    private lateinit var spinnerAlimento: Spinner
    private lateinit var edtQuantidade: EditText
    private lateinit var edtDataLimite: EditText
    private lateinit var btnSalvarMeta: Button
    private lateinit var btnVoltar: Button

    private lateinit var db: FirebaseFirestore
    private lateinit var auth: FirebaseAuth

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_gerenciar_metas)

        // Inicialização do Firebase
        db = FirebaseFirestore.getInstance()
        auth = FirebaseAuth.getInstance()

        // Mapeamento dos componentes do XML
        spinnerEquipe = findViewById(R.id.spinnerEquipe)
        spinnerAlimento = findViewById(R.id.spinnerAlimento)
        edtQuantidade = findViewById(R.id.edtQuantidade)
        edtDataLimite = findViewById(R.id.edtDataLimite)
        btnSalvarMeta = findViewById(R.id.btnSalvarMeta)
        btnVoltar = findViewById(R.id.btnVoltar)

        // Configurações iniciais
        configurarSpinnerAlimentos()
        carregarEquipesDinamicamente()

        // Clique para salvar
        btnSalvarMeta.setOnClickListener {
            salvarMeta()
        }

        // Clique para voltar
        btnVoltar.setOnClickListener {
            finish()
        }
    }

    private fun configurarSpinnerAlimentos() {
        // Lista atualizada com Café
        val alimentos = arrayOf(
            "Selecione o Alimento",
            "Arroz",
            "Feijão",
            "Macarrão",
            "Açúcar",
            "Óleo",
            "Café",
            "Outros"
        )

        val adapter = ArrayAdapter(this, android.R.layout.simple_spinner_dropdown_item, alimentos)
        spinnerAlimento.adapter = adapter
    }

    private fun carregarEquipesDinamicamente() {
        // Lista base
        val listaEquipes = mutableListOf("Selecione a Equipe", "Equipe 1", "Equipe 2", "Equipe 3")

        db.collection("equipes").get().addOnSuccessListener { docs ->
            for (doc in docs) {
                val nome = doc.getString("nome")
                // Evita duplicados caso as equipes padrão já estejam no banco
                if (nome != null && !listaEquipes.contains(nome)) {
                    listaEquipes.add(nome)
                }
            }
            val adapter = ArrayAdapter(this, android.R.layout.simple_spinner_dropdown_item, listaEquipes)
            spinnerEquipe.adapter = adapter
        }.addOnFailureListener {
            Toast.makeText(this, "Erro ao carregar equipes extras", Toast.LENGTH_SHORT).show()
        }
    }

    private fun salvarMeta() {
        val equipe = spinnerEquipe.selectedItem.toString()
        val alimento = spinnerAlimento.selectedItem.toString()
        val quantidadeStr = edtQuantidade.text.toString().trim()
        val data = edtDataLimite.text.toString().trim()

        // 1. Obter o usuário logado (Admin)
        val user = auth.currentUser
        if (user == null) {
            Toast.makeText(this, "Erro: Usuário não autenticado!", Toast.LENGTH_SHORT).show()
            return
        }

        // 2. Validações de campos
        if (spinnerEquipe.selectedItemPosition == 0) {
            Toast.makeText(this, "Por favor, selecione uma equipe!", Toast.LENGTH_SHORT).show()
            return
        }

        if (spinnerAlimento.selectedItemPosition == 0) {
            Toast.makeText(this, "Por favor, selecione um alimento!", Toast.LENGTH_SHORT).show()
            return
        }

        if (quantidadeStr.isEmpty() || data.isEmpty()) {
            Toast.makeText(this, "Preencha a quantidade e a data limite!", Toast.LENGTH_SHORT).show()
            return
        }

        val quantidade = quantidadeStr.toIntOrNull() ?: 0

        // 3. Montagem do objeto para o Firestore
        val meta = hashMapOf(
            "equipe" to equipe,
            "alimento" to alimento,
            "quantidadeKg" to quantidade,
            "dataLimite" to data,
            "status" to "em_aberto",
            "criadoPorNome" to (user.displayName ?: "Administrador"),
            "criadoPorEmail" to (user.email ?: "Email não disponível"),
            "criadoPorUid" to user.uid,
            "criadoEm" to FieldValue.serverTimestamp()
        )

        // 4. Gravação no Banco de Dados
        db.collection("metas")
            .add(meta)
            .addOnSuccessListener {
                Toast.makeText(this, "🎯 Meta de $alimento para $equipe salva!", Toast.LENGTH_LONG).show()
                limparCampos()
            }
            .addOnFailureListener { e ->
                Toast.makeText(this, "Erro ao salvar meta: ${e.message}", Toast.LENGTH_SHORT).show()
            }
    }

    private fun limparCampos() {
        edtQuantidade.text.clear()
        edtDataLimite.text.clear()
        spinnerEquipe.setSelection(0)
        spinnerAlimento.setSelection(0)
    }
}