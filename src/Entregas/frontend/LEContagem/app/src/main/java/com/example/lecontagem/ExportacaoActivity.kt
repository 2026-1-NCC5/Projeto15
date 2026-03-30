package com.example.lecontagem

import android.content.Intent
import android.os.Bundle
import android.widget.Button
import android.widget.DatePicker
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity

class ExportacaoActivity : AppCompatActivity() {

    private lateinit var dataExport: DatePicker
    private lateinit var btnPDF: Button
    private lateinit var btnCSV: Button
    private lateinit var btnVoltar: Button

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.exportacao)

        dataExport = findViewById(R.id.dataExport)
        btnPDF = findViewById(R.id.btnPDF)
        btnCSV = findViewById(R.id.btnCSV)
        btnVoltar = findViewById(R.id.btnVoltar)

        btnPDF.setOnClickListener {
            val dia = dataExport.dayOfMonth
            val mes = dataExport.month + 1
            val ano = dataExport.year

            val dataSelecionada = "$dia/$mes/$ano"

            Toast.makeText(
                this,
                "Exportando PDF da data: $dataSelecionada",
                Toast.LENGTH_SHORT
            ).show()
        }

        btnCSV.setOnClickListener {
            val dia = dataExport.dayOfMonth
            val mes = dataExport.month + 1
            val ano = dataExport.year

            val dataSelecionada = "$dia/$mes/$ano"

            Toast.makeText(
                this,
                "Exportando CSV da data: $dataSelecionada",
                Toast.LENGTH_SHORT
            ).show()
        }

        btnVoltar.setOnClickListener {
            val intent = Intent(this, HomeActivity::class.java)
            startActivity(intent)
            finish()
        }
    }
}