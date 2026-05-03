package com.example.lecontagem

import android.content.Intent
import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.*
import androidx.appcompat.app.AppCompatActivity
import androidx.recyclerview.widget.LinearLayoutManager
import androidx.recyclerview.widget.RecyclerView
import com.google.firebase.auth.FirebaseAuth
import com.google.firebase.firestore.FirebaseFirestore
import com.google.firebase.firestore.QueryDocumentSnapshot

// MODELO DE DADOS
data class UsuarioModelo(
    val uid: String = "",
    val nome: String = "",
    val email: String = "",
    val cargo: String = "",
    val equipe: String = ""
)

class GerenciarUsuariosActivity : AppCompatActivity() {

    private lateinit var edtNome: EditText
    private lateinit var edtEmail: EditText
    private lateinit var edtSenha: EditText
    private lateinit var spinnerCargo: Spinner
    private lateinit var spinnerEquipe: Spinner
    private lateinit var btnCriar: Button
    private lateinit var btnVoltar: ImageButton
    private lateinit var recycler: RecyclerView

    private lateinit var auth: FirebaseAuth
    private lateinit var db: FirebaseFirestore

    private lateinit var adapter: UsuariosAdapter
    private val listaUsuarios = ArrayList<UsuarioModelo>()

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_gerenciar_usuarios)

        auth = FirebaseAuth.getInstance()
        db = FirebaseFirestore.getInstance()

        // Mapeamento das Views
        edtNome = findViewById(R.id.edtNome)
        edtEmail = findViewById(R.id.edtEmail)
        edtSenha = findViewById(R.id.edtSenha)
        spinnerCargo = findViewById(R.id.spinnerCargo)
        spinnerEquipe = findViewById(R.id.spinnerEquipe)
        btnCriar = findViewById(R.id.btnCriarUsuario)
        btnVoltar = findViewById(R.id.btnVoltarHome)
        recycler = findViewById(R.id.recyclerUsuarios)

        // Configuração RecyclerView
        recycler.layoutManager = LinearLayoutManager(this)
        adapter = UsuariosAdapter(listaUsuarios) { usuario ->
            try {
                val intent = Intent(this, Class.forName("com.example.lecontagem.GerenciarUsuariosEditarActivity"))
                intent.putExtra("uid", usuario.uid)
                startActivity(intent)
            } catch (e: Exception) {
                Toast.makeText(this, "Tela de edição não encontrada", Toast.LENGTH_SHORT).show()
            }
        }
        recycler.adapter = adapter

        // Clique Botão Voltar
        btnVoltar.setOnClickListener {
            finish()
        }

        // Inicialização de dados
        configurarSpinnerCargo()
        atualizarSpinnerEquipesDinamicamente() // Pega equipes do Firestore
        carregarUsuarios()

        btnCriar.setOnClickListener { criarUsuario() }
    }

    private fun configurarSpinnerCargo() {
        val cargos = arrayOf("Selecione o Cargo", "Operador", "Coordenação", "Admin")
        val adapterCargo = ArrayAdapter(this, android.R.layout.simple_spinner_dropdown_item, cargos)
        spinnerCargo.adapter = adapterCargo
    }

    private fun atualizarSpinnerEquipesDinamicamente() {
        // Começamos com as opções padrão
        val listaEquipes = mutableListOf("Selecione a Equipe", "Equipe 1", "Equipe 2", "Equipe 3")

        db.collection("equipes").get()
            .addOnSuccessListener { docs ->
                for (doc in docs) {
                    val nome = doc.getString("nome")
                    // Adiciona apenas se não for duplicado com as fixas
                    if (nome != null && !listaEquipes.contains(nome)) {
                        listaEquipes.add(nome)
                    }
                }
                val adapterEquipe = ArrayAdapter(this, android.R.layout.simple_spinner_dropdown_item, listaEquipes)
                spinnerEquipe.adapter = adapterEquipe
            }
            .addOnFailureListener {
                // Se falhar o banco, mantém as fixas
                val adapterEquipe = ArrayAdapter(this, android.R.layout.simple_spinner_dropdown_item, listaEquipes)
                spinnerEquipe.adapter = adapterEquipe
            }
    }

    private fun criarUsuario() {
        val nome = edtNome.text.toString().trim()
        val email = edtEmail.text.toString().trim()
        val senha = edtSenha.text.toString().trim()

        val cargoPos = spinnerCargo.selectedItemPosition
        val equipePos = spinnerEquipe.selectedItemPosition

        val cargoSelecionado = spinnerCargo.selectedItem.toString()
        val equipeSelecionada = spinnerEquipe.selectedItem.toString()

        // Validações de texto
        if (nome.isEmpty() || email.isEmpty() || senha.isEmpty()) {
            Toast.makeText(this, "Preencha todos os campos!", Toast.LENGTH_SHORT).show()
            return
        }

        // Validação de seleção obrigatória (índice 0 é "Selecione...")
        if (cargoPos == 0) {
            Toast.makeText(this, "Selecione um Cargo válido!", Toast.LENGTH_SHORT).show()
            return
        }

        if (equipePos == 0) {
            Toast.makeText(this, "Selecione uma Equipe válida!", Toast.LENGTH_SHORT).show()
            return
        }

        if (senha.length < 6) {
            Toast.makeText(this, "A senha deve ter pelo menos 6 caracteres!", Toast.LENGTH_SHORT).show()
            return
        }

        // Cadastro no Firebase Auth
        auth.createUserWithEmailAndPassword(email, senha)
            .addOnSuccessListener { result ->
                val uid = result.user?.uid ?: ""
                val usuario = UsuarioModelo(uid, nome, email, cargoSelecionado, equipeSelecionada)

                // Salvando dados extras no Firestore
                db.collection("users").document(uid).set(usuario)
                    .addOnSuccessListener {
                        Toast.makeText(this, "Usuário cadastrado com sucesso!", Toast.LENGTH_SHORT).show()
                        limparCampos()
                        carregarUsuarios()
                    }
            }
            .addOnFailureListener { e ->
                Toast.makeText(this, "Erro: ${e.message}", Toast.LENGTH_LONG).show()
            }
    }

    private fun carregarUsuarios() {
        db.collection("users").get()
            .addOnSuccessListener { docs ->
                listaUsuarios.clear()
                for (doc: QueryDocumentSnapshot in docs) {
                    val user = doc.toObject(UsuarioModelo::class.java)
                    listaUsuarios.add(user)
                }
                adapter.notifyDataSetChanged()
            }
    }

    private fun limparCampos() {
        edtNome.text.clear()
        edtEmail.text.clear()
        edtSenha.text.clear()
        spinnerCargo.setSelection(0)
        spinnerEquipe.setSelection(0)
    }

    // ADAPTER RECYCLERVIEW
    inner class UsuariosAdapter(
        private val dados: List<UsuarioModelo>,
        private val clique: (UsuarioModelo) -> Unit
    ) : RecyclerView.Adapter<UsuariosAdapter.UserViewHolder>() {

        inner class UserViewHolder(v: View) : RecyclerView.ViewHolder(v) {
            val tNome: TextView = v.findViewById(android.R.id.text1)
            val tSub: TextView = v.findViewById(android.R.id.text2)
        }

        override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): UserViewHolder {
            val view = LayoutInflater.from(parent.context)
                .inflate(android.R.layout.simple_list_item_2, parent, false)
            return UserViewHolder(view)
        }

        override fun onBindViewHolder(holder: UserViewHolder, position: Int) {
            val item = dados[position]
            holder.tNome.text = item.nome
            holder.tSub.text = "${item.cargo} | ${item.equipe}"
            holder.itemView.setOnClickListener { clique(item) }
        }

        override fun getItemCount(): Int = dados.size
    }
}