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
    private lateinit var btnSalvar: Button
    private lateinit var btnVoltarHome: Button
    private lateinit var btnDeslogar: Button

    private lateinit var auth: FirebaseAuth
    private lateinit var db: FirebaseFirestore

    // Variável que armazena o cargo vindo do banco
    private var cargoDefinido: String = ""

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
        btnSalvar = findViewById(R.id.btnSalvar)
        btnVoltarHome = findViewById(R.id.btnVoltarHome)
        btnDeslogar = findViewById(R.id.btnDeslogar)

        configurarSpinners()
        carregarDados()

        btnSalvar.setOnClickListener { salvarAlteracoes() }
        btnVoltarHome.setOnClickListener { redirecionarParaHome() }
        btnDeslogar.setOnClickListener { deslogar() }
    }

    private fun configurarSpinners() {
        val cargos = arrayOf("Operador", "Coordenação", "Admin")
        val equipes = arrayOf("Equipe 1", "Equipe 2", "Equipe 3")
        spinnerCargo.adapter = ArrayAdapter(this, android.R.layout.simple_spinner_dropdown_item, cargos)
        spinnerEquipe.adapter = ArrayAdapter(this, android.R.layout.simple_spinner_dropdown_item, equipes)
    }

    private fun carregarDados() {
        val user = auth.currentUser ?: return
        db.collection("users").document(user.uid).get().addOnSuccessListener { doc ->
            if (doc.exists()) {
                val nome = doc.getString("nome") ?: ""
                val email = doc.getString("email") ?: ""
                cargoDefinido = doc.getString("cargo") ?: ""
                val equipe = doc.getString("equipe") ?: ""

                txtNomeAtual.text = "Nome: $nome"
                txtEmailAtual.text = "Email: $email"
                txtSenhaAtual.text = "Senha atual: ********"

                (spinnerCargo.adapter as ArrayAdapter<String>).let {
                    spinnerCargo.setSelection(it.getPosition(cargoDefinido))
                }
                (spinnerEquipe.adapter as ArrayAdapter<String>).let {
                    spinnerEquipe.setSelection(it.getPosition(equipe))
                }
            }
        }
    }

    private fun salvarAlteracoes() {
        val user = auth.currentUser ?: return
        val updates = mutableMapOf<String, Any>()

        val novoNome = edtNome.text.toString()
        val novoEmail = edtEmail.text.toString()
        val novaSenha = edtSenha.text.toString()
        val novoCargo = spinnerCargo.selectedItem.toString()
        val novaEquipe = spinnerEquipe.selectedItem.toString()

        if (novoNome.isNotEmpty()) updates["nome"] = novoNome
        if (novoEmail.isNotEmpty()) updates["email"] = novoEmail
        if (novaSenha.isNotEmpty()) updates["senha"] = novaSenha

        updates["cargo"] = novoCargo
        updates["equipe"] = novaEquipe

        db.collection("users").document(user.uid).update(updates).addOnSuccessListener {

            // SE O CARGO MUDOU, precisamos garantir que ao sair daqui ele vá para a Home certa
            val cargoAntigo = cargoDefinido
            cargoDefinido = novoCargo

            // Atualiza Auth se necessário
            if (novoEmail.isNotEmpty()) user.updateEmail(novoEmail)
            if (novaSenha.isNotEmpty()) user.updatePassword(novaSenha)

            Toast.makeText(this, "Perfil atualizado!", Toast.LENGTH_SHORT).show()

            // Se o cargo mudou, avisamos o usuário que ele será redirecionado para a nova Home
            if (cargoAntigo != novoCargo) {
                Toast.makeText(this, "Cargo alterado! Redirecionando...", Toast.LENGTH_LONG).show()
                redirecionarParaHome()
            } else {
                carregarDados()
                edtSenha.text.clear()
            }

        }.addOnFailureListener {
            Toast.makeText(this, "Erro ao salvar", Toast.LENGTH_SHORT).show()
        }
    }

    private fun deslogar() {
        auth.signOut()
        val intent = Intent(this, LoginActivity::class.java)
        intent.flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TASK
        startActivity(intent)
        finish()
    }

    private fun redirecionarParaHome() {
        val intent = when (cargoDefinido) {
            "Admin" -> Intent(this, HomeAdminActivity::class.java)
            "Operador" -> Intent(this, HomeOperadorActivity::class.java)
            "Coordenação" -> Intent(this, HomeCoordenadorActivity::class.java)
            else -> Intent(this, LoginActivity::class.java)
        }

        // ESSA LINHA É A CHAVE:
        // Ela limpa todas as telas anteriores. Se ele era Operador e virou Admin,
        // a tela de HomeOperador é destruída e ele entra na HomeAdmin do zero.
        intent.flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TASK

        startActivity(intent)
        finish()
    }
}