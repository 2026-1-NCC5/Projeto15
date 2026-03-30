package com.example.lecontagem

import android.content.Intent
import android.os.Bundle
import android.util.Patterns
import android.widget.*
import androidx.appcompat.app.AppCompatActivity
import com.google.android.material.textfield.TextInputEditText

class CadastroActivity : AppCompatActivity() {

    private lateinit var inputNome: TextInputEditText
    private lateinit var inputEmail: TextInputEditText
    private lateinit var inputSenha: TextInputEditText

    private lateinit var spinnerCargo: Spinner
    private lateinit var cadastrarButton: Button
    private lateinit var voltarLogin: TextView

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.cadastro)

        inputNome = findViewById(R.id.InputNome)
        inputEmail = findViewById(R.id.InputEmail)
        inputSenha = findViewById(R.id.InputSenha)

        spinnerCargo = findViewById(R.id.spinnerCargo)

        cadastrarButton = findViewById(R.id.CadastrarButton)
        voltarLogin = findViewById(R.id.VoltarLogin)

        val cargos = arrayOf(
            "Selecione o cargo",
            "Funcionário",
            "Nutricionista",
            "Gestor",
            "Administrador"
        )

        val adapter = ArrayAdapter(
            this,
            android.R.layout.simple_spinner_dropdown_item,
            cargos
        )

        spinnerCargo.adapter = adapter

        cadastrarButton.setOnClickListener {

            val nome = inputNome.text.toString().trim()
            val email = inputEmail.text.toString().trim()
            val senha = inputSenha.text.toString().trim()
            val cargo = spinnerCargo.selectedItem.toString()

            if (nome.isEmpty()) {
                inputNome.error = "Digite seu nome"
                inputNome.requestFocus()
                return@setOnClickListener
            }

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

            if (cargo == "Selecione o cargo") {
                Toast.makeText(this, "Selecione um cargo", Toast.LENGTH_SHORT).show()
                return@setOnClickListener
            }

            Toast.makeText(this, "Cadastro realizado com sucesso!", Toast.LENGTH_SHORT).show()

            val intent = Intent(this, LoginActivity::class.java)
            intent.putExtra("email", email)
            intent.putExtra("senha", senha)

            startActivity(intent)
            finish()
        }

        voltarLogin.setOnClickListener {
            val intent = Intent(this, LoginActivity::class.java)
            startActivity(intent)
            finish()
        }
    }
}