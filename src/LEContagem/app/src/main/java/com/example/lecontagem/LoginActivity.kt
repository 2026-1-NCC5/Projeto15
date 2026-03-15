package com.example.lecontagem

import android.content.Intent
import android.os.Bundle
import android.util.Patterns
import android.widget.Button
import android.widget.TextView
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import com.google.android.material.textfield.TextInputEditText

class LoginActivity : AppCompatActivity() {

    private lateinit var inputEmail: TextInputEditText
    private lateinit var inputSenha: TextInputEditText

    private lateinit var entrarButton: Button
    private lateinit var cadastrarSeButton: TextView

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.login)

        inputEmail = findViewById(R.id.InputEmail)
        inputSenha = findViewById(R.id.InputSenha)

        entrarButton = findViewById(R.id.EntrarButton)
        cadastrarSeButton = findViewById(R.id.Cadastrase)

        // RECEBENDO DADOS DO CADASTRO
        val intentRecebida = intent

        val emailRecebido = intentRecebida.getStringExtra("email")
        val senhaRecebida = intentRecebida.getStringExtra("senha")

        emailRecebido?.let { inputEmail.setText(it) }
        senhaRecebida?.let { inputSenha.setText(it) }

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

            Toast.makeText(this, "Login realizado com sucesso!", Toast.LENGTH_SHORT).show()

            val intent = Intent(this, HomeActivity::class.java)
            startActivity(intent)
            finish()
        }

        // BOTÃO CADASTRAR-SE
        cadastrarSeButton.setOnClickListener {
            val intent = Intent(this, CadastroActivity::class.java)
            startActivity(intent)
        }
    }
}