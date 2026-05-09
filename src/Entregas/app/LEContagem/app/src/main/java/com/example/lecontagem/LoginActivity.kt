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

    private lateinit var auth: FirebaseAuth
    private lateinit var db: FirebaseFirestore

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.login)

        auth = FirebaseAuth.getInstance()
        db = FirebaseFirestore.getInstance()

        inputEmail = findViewById(R.id.InputEmail)
        inputSenha = findViewById(R.id.InputSenha)
        entrarButton = findViewById(R.id.EntrarButton)
        cadastrarSeButton = findViewById(R.id.Cadastrase)

        entrarButton.setOnClickListener {
            fazerLogin()
        }

        cadastrarSeButton.setOnClickListener {
            startActivity(Intent(this, CadastroActivity::class.java))
        }
    }

    private fun fazerLogin() {
        val email = inputEmail.text.toString().trim()
        val senha = inputSenha.text.toString().trim()

        if (email.isEmpty() || senha.isEmpty()) {
            Toast.makeText(this, "Preencha todos os campos", Toast.LENGTH_SHORT).show()
            return
        }

        auth.signInWithEmailAndPassword(email, senha)
            .addOnCompleteListener { task ->
                if (task.isSuccessful) {
                    val uid = auth.currentUser?.uid
                    if (uid != null) {
                        verificarCargoERedirecionar(uid)
                    }
                } else {
                    Toast.makeText(this, "Erro: e-mail ou senha incorretos", Toast.LENGTH_SHORT).show()
                }
            }
    }

    private fun verificarCargoERedirecionar(uid: String) {
        db.collection("users").document(uid).get()
            .addOnSuccessListener { document ->
                if (document.exists()) {
                    val cargo = document.getString("cargo")

                    // Importante: O nome da classe deve ser exatamente como você criou os arquivos .kt
                    when (cargo) {
                        "Admin" -> {
                            val intent = Intent(this, HomeAdminActivity::class.java)
                            startActivity(intent)
                        }
                        "Operador" -> {
                            val intent = Intent(this, HomeOperadorActivity::class.java)
                            startActivity(intent)
                        }
                        "Coordenação" -> {
                            val intent = Intent(this, HomeCoordenadorActivity::class.java)
                            startActivity(intent)
                        }
                        else -> {
                            Toast.makeText(this, "Cargo '$cargo' não reconhecido", Toast.LENGTH_SHORT).show()
                        }
                    }
                    finish() // Fecha a tela de login para o usuário não voltar nela ao clicar em "voltar"
                } else {
                    Toast.makeText(this, "Perfil não encontrado no banco de dados", Toast.LENGTH_SHORT).show()
                }
            }
            .addOnFailureListener {
                Toast.makeText(this, "Erro ao carregar permissões", Toast.LENGTH_SHORT).show()
            }
    }
}