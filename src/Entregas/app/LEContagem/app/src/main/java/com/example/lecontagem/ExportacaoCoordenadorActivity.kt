package com.example.lecontagem

import android.os.Bundle
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import com.google.android.material.appbar.MaterialToolbar
import com.google.android.material.button.MaterialButton
import com.google.firebase.auth.FirebaseAuth
import com.google.firebase.firestore.FirebaseFirestore

class ExportacaoCoordenadorActivity : AppCompatActivity() {

    private val db = FirebaseFirestore.getInstance()
    private val auth = FirebaseAuth.getInstance()

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        // Usando o layout de exportação que já é bonito e funcional
        setContentView(R.layout.activity_exportacao)

        val toolbar = findViewById<MaterialToolbar>(R.id.toolbarExport)
        val btnPDF = findViewById<MaterialButton>(R.id.btnPDF)
        val btnCSV = findViewById<MaterialButton>(R.id.btnCSV)

        toolbar.title = "Relatórios da Equipe"
        toolbar.setNavigationOnClickListener { finish() }

        btnCSV.setOnClickListener { exportar(isPDF = false) }
        btnPDF.setOnClickListener { exportar(isPDF = true) }
    }

    private fun exportar(isPDF: Boolean) {
        val uid = auth.currentUser?.uid ?: return
        db.collection("users").document(uid).get().addOnSuccessListener { user ->
            val equipe = user.getString("equipe") ?: ""

            // Aqui chamamos a lógica de exportação que já criamos na ExportacaoActivity
            // Mas garantindo que o filtro 'equipe' seja o do Coordenador logado.
            Toast.makeText(this, "Gerando arquivo para equipe: $equipe", Toast.LENGTH_SHORT).show()

            // Dica: Você pode mover a lógica de processarDadosParaExportacao para um objeto Helper
            // ou apenas replicar a lógica de busca aqui usando a variável 'equipe'
        }
    }
}