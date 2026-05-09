package com.example.lecontagem

import android.os.Bundle
import android.widget.*
import androidx.appcompat.app.AppCompatActivity
import com.google.firebase.auth.FirebaseAuth
import com.google.firebase.firestore.FirebaseFirestore
import java.text.SimpleDateFormat
import java.util.*

class ContagemActivity : AppCompatActivity() {

    private lateinit var txtEquipeFixa: TextView
    private lateinit var spinnerAlimento: Spinner
    private lateinit var edtQuantidade: EditText
    private lateinit var edtData: EditText
    private lateinit var btnSalvar: Button
    private lateinit var btnVoltar: Button

    private lateinit var db: FirebaseFirestore
    private lateinit var auth: FirebaseAuth

    private var nomeEquipeUsuario: String = ""
    private var nomeRealUsuario: String = ""

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.contagem)

        db = FirebaseFirestore.getInstance()
        auth = FirebaseAuth.getInstance()

        txtEquipeFixa = findViewById(R.id.txtEquipeFixa)
        spinnerAlimento = findViewById(R.id.spinnerAlimentoContagem)
        edtQuantidade = findViewById(R.id.edtQuantidadeKg)
        edtData = findViewById(R.id.edtDataContagem)
        btnSalvar = findViewById(R.id.btnSalvarContagem)
        btnVoltar = findViewById(R.id.btnVoltarContagem)

        // 1. Define a data atual no formato solicitado: DD/MM/AAAA
        val sdf = SimpleDateFormat("dd/MM/yyyy", Locale.getDefault())
        edtData.setText(sdf.format(Date()))

        // 2. Busca os dados do perfil do usuário (Equipe e Nome)
        carregarDadosDoPerfil()

        configurarSpinnerAlimentos()

        btnSalvar.setOnClickListener { salvarContagem() }
        btnVoltar.setOnClickListener { finish() }
    }

    private fun carregarDadosDoPerfil() {
        val uid = auth.currentUser?.uid ?: return

        db.collection("users").document(uid).get()
            .addOnSuccessListener { doc ->
                if (doc.exists()) {
                    // Pega a equipe e o nome real salvos no documento do usuário
                    nomeEquipeUsuario = doc.getString("equipe") ?: "Sem Equipe"
                    nomeRealUsuario = doc.getString("nome") ?: doc.getString("usuario") ?: "Usuário sem nome"

                    txtEquipeFixa.text = nomeEquipeUsuario
                }
            }
            .addOnFailureListener {
                txtEquipeFixa.text = "Erro ao carregar perfil"
            }
    }

    private fun configurarSpinnerAlimentos() {
        val alimentos = arrayOf("Selecione o Alimento", "Arroz", "Feijão", "Macarrão", "Açúcar", "Óleo", "Café", "Outros")
        spinnerAlimento.adapter = ArrayAdapter(this, android.R.layout.simple_spinner_dropdown_item, alimentos)
    }

    private fun salvarContagem() {
        val user = auth.currentUser
        val alimento = spinnerAlimento.selectedItem.toString()
        val qtdStr = edtQuantidade.text.toString().trim()
        val dataInformada = edtData.text.toString().trim()

        // Validações básicas
        if (user == null || nomeEquipeUsuario.isEmpty() || nomeEquipeUsuario == "Sem Equipe") {
            Toast.makeText(this, "Erro: Usuário sem equipe definida!", Toast.LENGTH_SHORT).show()
            return
        }
        if (spinnerAlimento.selectedItemPosition == 0) {
            Toast.makeText(this, "Selecione o Alimento!", Toast.LENGTH_SHORT).show()
            return
        }
        if (qtdStr.isEmpty()) {
            Toast.makeText(this, "Informe a quantidade!", Toast.LENGTH_SHORT).show()
            return
        }
        if (dataInformada.isEmpty()) {
            Toast.makeText(this, "Informe a data (DD/MM/AAAA)!", Toast.LENGTH_SHORT).show()
            return
        }

        val quantidade = qtdStr.toDoubleOrNull() ?: 0.0

        // Objeto de dados com identificação completa de quem fez a contagem
        val dados = hashMapOf(
            "usuarioUid" to user.uid,
            "usuarioNome" to nomeRealUsuario, // Nome real do cadastro
            "usuarioEmail" to (user.email ?: "S/E"),
            "equipe" to nomeEquipeUsuario,
            "alimento" to alimento,
            "quantidade" to quantidade,
            "dataRegistro" to dataInformada, // Formato DD/MM/AAAA
            "timestamp" to com.google.firebase.firestore.FieldValue.serverTimestamp()
        )

        db.collection("contagem")
            .add(dados)
            .addOnSuccessListener {
                Toast.makeText(this, "Registro salvo com sucesso!", Toast.LENGTH_SHORT).show()
                edtQuantidade.text.clear()
                // Mantém a data para facilitar o próximo registro do mesmo dia
            }
            .addOnFailureListener { e ->
                Toast.makeText(this, "Erro ao salvar: ${e.message}", Toast.LENGTH_SHORT).show()
            }
    }
}