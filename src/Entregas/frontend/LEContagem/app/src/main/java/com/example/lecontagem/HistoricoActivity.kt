package com.example.lecontagem

import android.content.Intent
import android.os.Bundle
import android.widget.Button
import android.widget.DatePicker
import android.widget.LinearLayout
import android.widget.TextView
import androidx.appcompat.app.AppCompatActivity

class HistoricoActivity : AppCompatActivity() {

    private lateinit var datePicker: DatePicker
    private lateinit var listaHistorico: LinearLayout
    private lateinit var voltarButton: Button

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.historico)

        datePicker = findViewById(R.id.datePicker)
        listaHistorico = findViewById(R.id.listaHistorico)
        voltarButton = findViewById(R.id.VoltarButton)

        // EXEMPLO DE HISTÓRICO
        adicionarItem("Produto A - 10 unidades")
        adicionarItem("Produto B - 5 unidades")
        adicionarItem("Produto C - 18 unidades")

        // BOTÃO VOLTAR
        voltarButton.setOnClickListener {
            val intent = Intent(this, HomeActivity::class.java)
            startActivity(intent)
            finish()
        }
    }

    private fun adicionarItem(texto: String) {

        val item = TextView(this).apply {
            text = texto
            textSize = 18f
            setPadding(10, 10, 10, 10)
        }

        listaHistorico.addView(item)
    }
}