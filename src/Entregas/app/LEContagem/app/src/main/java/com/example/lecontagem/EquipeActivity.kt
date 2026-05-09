package com.example.lecontagem

import android.content.Intent
import android.os.Bundle
import android.view.View
import android.widget.*
import androidx.appcompat.app.AppCompatActivity
import androidx.core.content.ContextCompat
import com.google.firebase.auth.FirebaseAuth
import com.google.firebase.firestore.FirebaseFirestore

class EquipeActivity : AppCompatActivity() {

    private lateinit var containerExtras: LinearLayout
    private lateinit var containerMembros: LinearLayout
    private lateinit var btnEntrar: Button
    private lateinit var btnVoltar: Button
    private lateinit var txtMembrosTitulo: TextView

    private lateinit var db: FirebaseFirestore
    private lateinit var auth: FirebaseAuth

    private var equipeSelecionada: String? = null

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.equipe)

        db = FirebaseFirestore.getInstance()
        auth = FirebaseAuth.getInstance()

        // Inicialização
        containerExtras = findViewById(R.id.containerEquipesExtras)
        containerMembros = findViewById(R.id.containerMembros)
        btnEntrar = findViewById(R.id.btnEntrar)
        btnVoltar = findViewById(R.id.btnVoltar)
        txtMembrosTitulo = findViewById(R.id.txtMembros)

        // Equipes Fixas
        findViewById<LinearLayout>(R.id.cardEquipe1).setOnClickListener { selecionarEquipe("Equipe 1") }
        findViewById<LinearLayout>(R.id.cardEquipe2).setOnClickListener { selecionarEquipe("Equipe 2") }
        findViewById<LinearLayout>(R.id.cardEquipe3).setOnClickListener { selecionarEquipe("Equipe 3") }

        btnVoltar.setOnClickListener {
            finish() // Fecha a tela e volta para a anterior
        }

        btnEntrar.setOnClickListener {
            equipeSelecionada?.let { entrarNaEquipe(it) }
        }

        carregarEquipesDoAdmin()
    }

    private fun carregarEquipesDoAdmin() {
        containerExtras.removeAllViews()

        // Busca na coleção "equipes" que o GerenciarEquipesActivity cria
        db.collection("equipes").get()
            .addOnSuccessListener { docs ->
                for (d in docs) {
                    val nome = d.getString("nome") ?: continue
                    adicionarCardDinamico(nome)
                }
            }
            .addOnFailureListener {
                Toast.makeText(this, "Erro ao carregar equipes extras", Toast.LENGTH_SHORT).show()
            }
    }

    private fun adicionarCardDinamico(nome: String) {
        val card = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            setPadding(45, 45, 45, 45) // Ajuste de padding aproximado para 16dp
            background = ContextCompat.getDrawable(context, R.drawable.card_branco)
            layoutParams = LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.MATCH_PARENT,
                LinearLayout.LayoutParams.WRAP_CONTENT
            ).apply { setMargins(0, 0, 0, 32) } // Margin bottom 12dp aprox
            isClickable = true
            isFocusable = true
        }

        val txt = TextView(this).apply {
            text = "📁 $nome"
            textSize = 20f
            setTextColor(ContextCompat.getColor(context, android.R.color.black))
            setTypeface(typeface, android.graphics.Typeface.BOLD)
        }

        card.addView(txt)
        card.setOnClickListener { selecionarEquipe(nome) }
        containerExtras.addView(card)
    }

    private fun selecionarEquipe(nome: String) {
        equipeSelecionada = nome
        txtMembrosTitulo.visibility = View.VISIBLE
        btnEntrar.visibility = View.VISIBLE

        // Feedback visual para o usuário
        Toast.makeText(this, "Selecionado: $nome", Toast.LENGTH_SHORT).show()

        listarMembros(nome)
    }

    private fun listarMembros(equipe: String) {
        containerMembros.removeAllViews()

        db.collection("users")
            .whereEqualTo("equipe", equipe)
            .get()
            .addOnSuccessListener { docs ->
                if (docs.isEmpty) {
                    val txt = TextView(this)
                    txt.text = "Equipe vazia no momento"
                    txt.setTextColor(0xFFFFFFFF.toInt())
                    containerMembros.addView(txt)
                    return@addOnSuccessListener
                }

                for (d in docs) {
                    val nomeMembro = d.getString("nome") ?: "Sem nome"
                    val txt = TextView(this).apply {
                        text = "• $nomeMembro"
                        textSize = 16f
                        setTextColor(0xFFFFFFFF.toInt())
                        setPadding(0, 8, 0, 8)
                    }
                    containerMembros.addView(txt)
                }
            }
    }

    private fun entrarNaEquipe(equipe: String) {
        val user = auth.currentUser
        if (user == null) {
            Toast.makeText(this, "Usuário não logado!", Toast.LENGTH_SHORT).show()
            return
        }

        // Salva a alteração no campo "equipe" do usuário logado
        db.collection("users")
            .document(user.uid)
            .update("equipe", equipe)
            .addOnSuccessListener {
                Toast.makeText(this, "Você agora faz parte da $equipe!", Toast.LENGTH_LONG).show()
                listarMembros(equipe)
            }
            .addOnFailureListener { e ->
                Toast.makeText(this, "Erro ao salvar: ${e.message}", Toast.LENGTH_SHORT).show()
            }
    }
}