package com.example.lecontagem

import android.content.Intent
import android.os.Bundle
import android.widget.*
import androidx.appcompat.app.AppCompatActivity
import com.google.firebase.auth.FirebaseAuth
import com.google.firebase.firestore.FirebaseFirestore

class PerfilActivity : AppCompatActivity() {

    private lateinit var edtNome: EditText
    private lateinit var edtEmail: EditText
    private lateinit var edtSenha: EditText

    private lateinit var spinnerCargo: Spinner
    private lateinit var spinnerEquipe: Spinner

    private lateinit var txtNomeAtual: TextView
    private lateinit var txtEmailAtual: TextView
    private lateinit var txtSenhaAtual: TextView
    private lateinit var txtCargoAtual: TextView
    private lateinit var txtEquipeAtual: TextView

    private lateinit var btnSalvar: Button
    private lateinit var btnVoltarHome: Button

    private lateinit var auth: FirebaseAuth
    private lateinit var db: FirebaseFirestore

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.perfil)

        auth = FirebaseAuth.getInstance()
        db = FirebaseFirestore.getInstance()

        edtNome = findViewById(R.id.edtNome)
        edtEmail = findViewById(R.id.edtEmail)
        edtSenha = findViewById(R.id.edtSenha)

        spinnerCargo = findViewById(R.id.spinnerCargo)
        spinnerEquipe = findViewById(R.id.spinnerEquipe)

        txtNomeAtual = findViewById(R.id.txtNomeAtual)
        txtEmailAtual = findViewById(R.id.txtEmailAtual)
        txtSenhaAtual = findViewById(R.id.txtSenhaAtual)
        txtCargoAtual = findViewById(R.id.txtCargoAtual)
        txtEquipeAtual = findViewById(R.id.txtEquipeAtual)

        btnSalvar = findViewById(R.id.btnSalvar)
        btnVoltarHome = findViewById(R.id.btnVoltarHome)

        configurarSpinners()
        carregarDados()

        btnSalvar.setOnClickListener { salvarAlteracoes() }

        btnVoltarHome.setOnClickListener {
            startActivity(Intent(this, HomeAdminActivity::class.java))
            finish()
        }
    }

    private fun configurarSpinners() {
        val cargos = arrayOf("Operador", "Coordenação", "Admin")
        val equipes = arrayOf("Equipe 1", "Equipe 2", "Equipe 3")

        spinnerCargo.adapter =
            ArrayAdapter(this, android.R.layout.simple_spinner_dropdown_item, cargos)

        spinnerEquipe.adapter =
            ArrayAdapter(this, android.R.layout.simple_spinner_dropdown_item, equipes)
    }

    private fun carregarDados() {
        val user = auth.currentUser ?: return

        db.collection("users").document(user.uid)   // 🔥 AQUI ESTÁ A CORREÇÃO
            .get()
            .addOnSuccessListener { doc ->

                if (!doc.exists()) {
                    Toast.makeText(this, "Dados não encontrados", Toast.LENGTH_SHORT).show()
                    return@addOnSuccessListener
                }

                val nome = doc.getString("nome") ?: ""
                val email = doc.getString("email") ?: ""
                val senha = doc.getString("senha") ?: ""
                val cargo = doc.getString("cargo") ?: ""
                val equipe = doc.getString("equipe") ?: ""

                // EXIBIR NOS "ATUAL"
                txtNomeAtual.text = "Nome atual: $nome"
                txtEmailAtual.text = "Email atual: $email"
                txtSenhaAtual.text = "Senha atual: ${"*".repeat(senha.length)}"
                txtCargoAtual.text = "Cargo atual: $cargo"
                txtEquipeAtual.text = "Equipe atual: $equipe"

                // SETAR SPINNERS
                (spinnerCargo.adapter as ArrayAdapter<String>).apply {
                    spinnerCargo.setSelection(getPosition(cargo))
                }

                (spinnerEquipe.adapter as ArrayAdapter<String>).apply {
                    spinnerEquipe.setSelection(getPosition(equipe))
                }
            }
            .addOnFailureListener {
                Toast.makeText(this, "Erro ao carregar dados", Toast.LENGTH_SHORT).show()
            }
    }

    private fun salvarAlteracoes() {
        val user = auth.currentUser ?: return

        val updates = mutableMapOf<String, Any>()

        if (edtNome.text.isNotEmpty()) updates["nome"] = edtNome.text.toString()
        if (edtEmail.text.isNotEmpty()) updates["email"] = edtEmail.text.toString()
        if (edtSenha.text.isNotEmpty()) updates["senha"] = edtSenha.text.toString()

        updates["cargo"] = spinnerCargo.selectedItem.toString()
        updates["equipe"] = spinnerEquipe.selectedItem.toString()

        db.collection("users").document(user.uid)   // 🔥 AQUI TAMBÉM
            .update(updates)
            .addOnSuccessListener {

                if (edtEmail.text.isNotEmpty()) user.updateEmail(edtEmail.text.toString())
                if (edtSenha.text.isNotEmpty()) user.updatePassword(edtSenha.text.toString())

                Toast.makeText(this, "Alterações salvas!", Toast.LENGTH_SHORT).show()
            }
            .addOnFailureListener {
                Toast.makeText(this, "Erro ao salvar", Toast.LENGTH_SHORT).show()
            }
    }
}