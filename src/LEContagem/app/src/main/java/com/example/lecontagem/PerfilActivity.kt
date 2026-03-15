package com.example.lecontagem

import android.content.Intent
import android.os.Bundle
import android.widget.Button
import android.widget.EditText
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity

class PerfilActivity : AppCompatActivity() {

    private lateinit var edtNome: EditText
    private lateinit var edtEmail: EditText
    private lateinit var edtSenha: EditText
    private lateinit var edtCargo: EditText

    private lateinit var btnSalvar: Button
    private lateinit var btnVoltarHome: Button

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.perfil)

        edtNome = findViewById(R.id.edtNome)
        edtEmail = findViewById(R.id.edtEmail)
        edtSenha = findViewById(R.id.edtSenha)
        edtCargo = findViewById(R.id.edtCargo)

        btnSalvar = findViewById(R.id.btnSalvar)
        btnVoltarHome = findViewById(R.id.btnVoltarHome)

        btnSalvar.setOnClickListener {

            val nome = edtNome.text.toString()
            val email = edtEmail.text.toString()
            val senha = edtSenha.text.toString()
            val cargo = edtCargo.text.toString()

            Toast.makeText(
                this,
                "Dados salvos com sucesso!",
                Toast.LENGTH_SHORT
            ).show()
        }

        btnVoltarHome.setOnClickListener {
            val intent = Intent(this, HomeActivity::class.java)
            startActivity(intent)
            finish()
        }
    }
}