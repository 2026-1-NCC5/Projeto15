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
    private lateinit var btnVoltar: Button // Faltava mapear o voltar

    private lateinit var db: FirebaseFirestore

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_gerenciar_equipes)

        db = FirebaseFirestore.getInstance()

        edtNomeEquipe = findViewById(R.id.edtNomeEquipe)
        btnCriar = findViewById(R.id.btnCriar)
        btnVoltar = findViewById(R.id.btnVoltar) // Certifique-se que o ID no XML é btnVoltar

        // Ação do Botão Criar
        btnCriar.setOnClickListener {
            val nomeDigitado = edtNomeEquipe.text.toString().trim()

            if (nomeDigitado.isNotEmpty()) {
                salvarEquipeNoFirestore(nomeDigitado)
            } else {
                edtNomeEquipe.error = "Campo obrigatório"
                Toast.makeText(this, "Digite o nome da equipe!", Toast.LENGTH_SHORT).show()
            }
        }

        // Ação do Botão Voltar (CORRIGIDO)
        btnVoltar.setOnClickListener {
            // Volta para a HomeAdminActivity
            val intent = Intent(this, HomeAdminActivity::class.java)
            startActivity(intent)
            finish() // Fecha a tela atual
        }
    }

    private fun salvarEquipeNoFirestore(nome: String) {
        val dados = hashMapOf("nome" to nome)

        db.collection("equipes")
            .document(nome)
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