package com.example.lecontagem

import android.content.Intent
import android.os.Bundle
import android.util.Patterns
import android.widget.*
import androidx.appcompat.app.AppCompatActivity
import com.google.android.material.textfield.TextInputEditText
import com.google.firebase.auth.FirebaseAuth
import com.google.firebase.firestore.FirebaseFirestore

class CadastroActivity : AppCompatActivity() {

    private lateinit var inputNome: TextInputEditText
    private lateinit var inputEmail: TextInputEditText
    private lateinit var inputSenha: TextInputEditText

    private lateinit var spinnerCargo: Spinner
    private lateinit var cadastrarButton: Button
    private lateinit var voltarLogin: TextView

    private lateinit var auth: FirebaseAuth
    private lateinit var firestore: FirebaseFirestore

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.cadastro)

        // Firebase
        auth = FirebaseAuth.getInstance()
        firestore = FirebaseFirestore.getInstance()

        // Inputs
        inputNome = findViewById(R.id.InputNome)
        inputEmail = findViewById(R.id.InputEmail)
        inputSenha = findViewById(R.id.InputSenha)

        spinnerCargo = findViewById(R.id.spinnerCargo)
        cadastrarButton = findViewById(R.id.CadastrarButton)
        voltarLogin = findViewById(R.id.VoltarLogin)

        // cargos
        val cargos = arrayOf(
            "Selecione o cargo",
            "Operador",
            "Coordenação",
            "Admin"
        )

        val adapter = ArrayAdapter(
            this,
            android.R.layout.simple_spinner_dropdown_item,
            cargos
        )
        spinnerCargo.adapter = adapter

        cadastrarButton.setOnClickListener {
            realizarCadastro()
        }

        voltarLogin.setOnClickListener {
            startActivity(Intent(this, LoginActivity::class.java))
            finish()
        }
    }

    private fun realizarCadastro() {

        val nome = inputNome.text.toString().trim()
        val email = inputEmail.text.toString().trim()
        val senha = inputSenha.text.toString().trim()
        val cargo = spinnerCargo.selectedItem.toString()

        // validações
        if (nome.isEmpty()) {
            inputNome.error = "Digite seu nome"
            inputNome.requestFocus()
            return
        }

        if (email.isEmpty()) {
            inputEmail.error = "Digite seu email"
            inputEmail.requestFocus()
            return
        }

        if (!Patterns.EMAIL_ADDRESS.matcher(email).matches()) {
            inputEmail.error = "Email inválido"
            inputEmail.requestFocus()
            return
        }

        if (senha.isEmpty()) {
            inputSenha.error = "Digite sua senha"
            inputSenha.requestFocus()
            return
        }

        if (cargo == "Selecione o cargo") {
            Toast.makeText(this, "Selecione um cargo", Toast.LENGTH_SHORT).show()
            return
        }

        // 🔥 Firebase Auth: criar usuário
        auth.createUserWithEmailAndPassword(email, senha)
            .addOnSuccessListener { result ->

                val uid = result.user?.uid ?: return@addOnSuccessListener

                // 🔥 Dados para salvar no Firestore
                val dadosUsuario = hashMapOf(
                    "uid" to uid,
                    "nome" to nome,
                    "email" to email,
                    "cargo" to cargo
                )

                // 🔥 Firebase Firestore: salvar documento users/{uid}
                firestore.collection("users")
                    .document(uid)
                    .set(dadosUsuario)
                    .addOnSuccessListener {
                        Toast.makeText(this, "Cadastro realizado!", Toast.LENGTH_SHORT).show()

                        // vai pro login
                        startActivity(Intent(this, LoginActivity::class.java))
                        finish()
                    }
                    .addOnFailureListener { e ->
                        Toast.makeText(this, "Erro ao salvar dados: ${e.message}", Toast.LENGTH_LONG).show()
                    }

            }
            .addOnFailureListener { e ->
                Toast.makeText(this, "Erro no cadastro: ${e.message}", Toast.LENGTH_LONG).show()
            }
    }
}