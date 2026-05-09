package com.example.lecontagem

import android.os.Bundle
import android.widget.*
import androidx.appcompat.app.AppCompatActivity
import com.google.android.material.textfield.TextInputEditText
import com.google.firebase.auth.FirebaseAuth
import com.google.firebase.firestore.FirebaseFirestore

class CadastroActivity : AppCompatActivity() {

    private val auth = FirebaseAuth.getInstance()
    private val firestore = FirebaseFirestore.getInstance()

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.cadastro)

        val btnCadastrar = findViewById<Button>(R.id.CadastrarButton)
        val spinnerCargo = findViewById<Spinner>(R.id.spinnerCargo)

        val cargos = arrayOf("Selecione o cargo", "Operador", "Coordenação", "Admin")
        spinnerCargo.adapter = ArrayAdapter(this, android.R.layout.simple_spinner_dropdown_item, cargos)

        btnCadastrar.setOnClickListener {
            val email = findViewById<TextInputEditText>(R.id.InputEmail).text.toString()
            val senha = findViewById<TextInputEditText>(R.id.InputSenha).text.toString()
            val nome = findViewById<TextInputEditText>(R.id.InputNome).text.toString()
            val cargo = spinnerCargo.selectedItem.toString()

            if (email.isNotEmpty() && cargo != "Selecione o cargo") {
                auth.createUserWithEmailAndPassword(email, senha).addOnSuccessListener {
                    val uid = it.user?.uid ?: ""
                    val map = hashMapOf("uid" to uid, "nome" to nome, "cargo" to cargo, "email" to email)
                    firestore.collection("users").document(uid).set(map).addOnSuccessListener {
                        Toast.makeText(this, "Sucesso!", Toast.LENGTH_SHORT).show()
                        finish()
                    }
                }
            }
        }
    }
}