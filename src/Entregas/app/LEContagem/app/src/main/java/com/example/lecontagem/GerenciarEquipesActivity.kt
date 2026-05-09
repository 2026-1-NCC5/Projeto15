package com.example.lecontagem

import android.content.Intent
import android.os.Bundle
import android.widget.Button
import android.widget.EditText
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import com.google.firebase.firestore.FirebaseFirestore

class GerenciarEquipesActivity : AppCompatActivity() {

    private lateinit var edtNomeEquipe: EditText
    private lateinit var btnCriar: Button
    private lateinit var btnVoltar: Button

    private lateinit var db: FirebaseFirestore

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_gerenciar_equipes)

        db = FirebaseFirestore.getInstance()

        // 1. Criar as equipes padrão 1, 2 e 3 se não existirem
        inicializarEquipesPadrao()

        edtNomeEquipe = findViewById(R.id.edtNomeEquipe)
        btnCriar = findViewById(R.id.btnCriar)
        btnVoltar = findViewById(R.id.btnVoltar)

        btnCriar.setOnClickListener {
            val nomeDigitado = edtNomeEquipe.text.toString().trim()

            if (nomeDigitado.isNotEmpty()) {
                salvarEquipeNoFirestore(nomeDigitado)
            } else {
                edtNomeEquipe.error = "Campo obrigatório"
                Toast.makeText(this, "Digite o nome da equipe!", Toast.LENGTH_SHORT).show()
            }
        }

        btnVoltar.setOnClickListener {
            val intent = Intent(this, HomeAdminActivity::class.java)
            startActivity(intent)
            finish()
        }
    }

    /**
     * Verifica e cria as Equipes 1, 2 e 3 automaticamente
     */
    private fun inicializarEquipesPadrao() {
        val equipesPadrao = listOf("Equipe 1", "Equipe 2", "Equipe 3")

        for (nome in equipesPadrao) {
            val docRef = db.collection("equipes").document(nome)

            // Verifica se o documento já existe para não sobrescrever toda vez
            docRef.get().addOnSuccessListener { document ->
                if (!document.exists()) {
                    val dados = hashMapOf("nome" to nome)
                    docRef.set(dados)
                }
            }
        }
    }

    /**
     * Salva a nova equipe digitada pelo usuário
     */
    private fun salvarEquipeNoFirestore(nome: String) {
        val dados = hashMapOf("nome" to nome)

        db.collection("equipes")
            .document(nome) // O nome da equipe será o ID do documento
            .set(dados)
            .addOnSuccessListener {
                Toast.makeText(this, "Sucesso: Equipe '$nome' criada!", Toast.LENGTH_SHORT).show()
                edtNomeEquipe.text.clear()
            }
            .addOnFailureListener { e ->
                Toast.makeText(this, "Falha ao salvar: ${e.message}", Toast.LENGTH_LONG).show()
            }
    }
}