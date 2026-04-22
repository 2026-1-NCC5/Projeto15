package com.example.lecontagem

import android.content.Intent
import android.os.Bundle
import android.util.Patterns
import android.widget.Button
import android.widget.TextView
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import com.google.android.material.textfield.TextInputEditText
import com.google.firebase.auth.FirebaseAuth
import com.google.firebase.firestore.FirebaseFirestore

class LoginActivity : AppCompatActivity() {

    private lateinit var inputEmail: TextInputEditText
    private lateinit var inputSenha: TextInputEditText

    private lateinit var entrarButton: Button
    private lateinit var cadastrarSeButton: TextView

    // 🔥 Firebase
    private lateinit var auth: FirebaseAuth
    private lateinit var db: FirebaseFirestore

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.login)

        inputEmail = findViewById(R.id.InputEmail)
        inputSenha = findViewById(R.id.InputSenha)

        entrarButton = findViewById(R.id.EntrarButton)
        cadastrarSeButton = findViewById(R.id.Cadastrase)

        // 🔥 Inicializando Firebase
        auth = FirebaseAuth.getInstance()
        db = FirebaseFirestore.getInstance()

        // BOTÃO ENTRAR
        entrarButton.setOnClickListener {

            val email = inputEmail.text.toString().trim()
            val senha = inputSenha.text.toString().trim()

            if (email.isEmpty()) {
                inputEmail.error = "Digite seu email"
                inputEmail.requestFocus()
                return@setOnClickListener
            }

            if (!Patterns.EMAIL_ADDRESS.matcher(email).matches()) {
                inputEmail.error = "Email inválido"
                inputEmail.requestFocus()
                return@setOnClickListener
            }

            if (senha.isEmpty()) {
                inputSenha.error = "Digite sua senha"
                inputSenha.requestFocus()
                return@setOnClickListener
            }

            // 🔥 LOGIN REAL COM FIREBASE
            auth.signInWithEmailAndPassword(email, senha)
                .addOnCompleteListener { task ->

                    if (task.isSuccessful) {

                        val user = auth.currentUser
                        val uid = user?.uid

                        if (uid != null) {

                            // 🔥 BUSCAR CARGO NO FIRESTORE
                            db.collection("users").document(uid)
                                .get()
                                .addOnSuccessListener { document ->

                                    if (document.exists()) {

                                        val cargo = document.getString("cargo")

                                        Toast.makeText(this, "Login realizado!", Toast.LENGTH_SHORT).show()

                                        // 🔥 REDIRECIONAMENTO POR CARGO
                                        when (cargo) {

                                            "Operador" -> {
                                                startActivity(Intent(this, HomeOperadorActivity::class.java))
                                            }

                                            "Coordenação" -> {
                                                startActivity(Intent(this, HomeCoordenadorActivity::class.java))
                                            }

                                            "Admin" -> {
                                                startActivity(Intent(this, HomeAdminActivity::class.java))
                                            }

                                            else -> {
                                                Toast.makeText(this, "Cargo não identificado", Toast.LENGTH_SHORT).show()
                                            }
                                        }

                                        finish()

                                    } else {
                                        Toast.makeText(this, "Usuário não encontrado no banco", Toast.LENGTH_SHORT).show()
                                    }

                                }
                                .addOnFailureListener {
                                    Toast.makeText(this, "Erro ao buscar dados", Toast.LENGTH_SHORT).show()
                                }

                        }

                    } else {
                        Toast.makeText(this, "Erro no login: email ou senha inválidos", Toast.LENGTH_SHORT).show()
                    }
                }
        }

        // BOTÃO CADASTRAR-SE
        cadastrarSeButton.setOnClickListener {
            val intent = Intent(this, CadastroActivity::class.java)
            startActivity(intent)
        }
    }
}