package com.example.lecontagem

import android.content.Intent
import android.os.Bundle
import android.widget.*
import androidx.appcompat.app.AppCompatActivity
import com.google.firebase.auth.FirebaseAuth
import com.google.firebase.firestore.FirebaseFirestore

class EquipeActivity : AppCompatActivity() {

    private lateinit var cardEquipe1: LinearLayout
    private lateinit var cardEquipe2: LinearLayout
    private lateinit var cardEquipe3: LinearLayout
    private lateinit var containerMembros: LinearLayout
    private lateinit var btnEntrarEquipe: Button
    private lateinit var voltarButton: Button

    private lateinit var auth: FirebaseAuth
    private lateinit var db: FirebaseFirestore

    private var equipeSelecionada: String? = null  // Guarda qual equipe o user clicou

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.equipe)

        auth = FirebaseAuth.getInstance()
        db = FirebaseFirestore.getInstance()

        cardEquipe1 = findViewById(R.id.cardEquipe1)
        cardEquipe2 = findViewById(R.id.cardEquipe2)
        cardEquipe3 = findViewById(R.id.cardEquipe3)

        containerMembros = findViewById(R.id.containerMembros)
        voltarButton = findViewById(R.id.VoltarButton)

        // botão aparece só depois que a pessoa clicar em uma equipe
        btnEntrarEquipe = Button(this).apply {
            text = "Entrar nesta equipe"
            textSize = 16f
            setTextColor(resources.getColor(android.R.color.white))
            setBackgroundColor(resources.getColor(android.R.color.holo_green_dark))
            setPadding(20, 10, 20, 10)
            visibility = Button.GONE
        }

        val parentLayout = findViewById<LinearLayout>(R.id.containerMainScroll)
        parentLayout.addView(btnEntrarEquipe)

        cardEquipe1.setOnClickListener { mostrarMembrosDaEquipe("Equipe 1") }
        cardEquipe2.setOnClickListener { mostrarMembrosDaEquipe("Equipe 2") }
        cardEquipe3.setOnClickListener { mostrarMembrosDaEquipe("Equipe 3") }

        voltarButton.setOnClickListener {
            startActivity(Intent(this, HomeAdminActivity::class.java))
            finish()
        }

        btnEntrarEquipe.setOnClickListener {
            equipeSelecionada?.let { equipe ->
                entrarNaEquipe(equipe)
            }
        }
    }

    private fun mostrarMembrosDaEquipe(equipe: String) {
        equipeSelecionada = equipe
        btnEntrarEquipe.visibility = Button.VISIBLE

        containerMembros.removeAllViews()

        db.collection("usuarios")
            .whereEqualTo("equipe", equipe)
            .get()
            .addOnSuccessListener { result ->
                if (result.isEmpty) {
                    val msg = TextView(this)
                    msg.text = "Nenhum membro nesta equipe"
                    msg.setTextColor(resources.getColor(android.R.color.white))
                    msg.textSize = 16f
                    containerMembros.addView(msg)
                    return@addOnSuccessListener
                }

                for (doc in result) {
                    val nome = doc.getString("nome") ?: "Sem nome"

                    val textView = TextView(this)
                    textView.text = "• $nome"
                    textView.textSize = 16f
                    textView.setTextColor(resources.getColor(android.R.color.white))

                    containerMembros.addView(textView)
                }
            }
    }

    private fun entrarNaEquipe(equipe: String) {
        val userId = auth.currentUser?.uid ?: return

        db.collection("usuarios")
            .document(userId)
            .update("equipe", equipe)
            .addOnSuccessListener {
                Toast.makeText(this, "Agora você pertence à $equipe", Toast.LENGTH_SHORT).show()
                mostrarMembrosDaEquipe(equipe)
            }
    }
}