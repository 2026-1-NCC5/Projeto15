package com.example.lecontagem

import android.content.Intent
import android.os.Bundle
import android.widget.LinearLayout
import androidx.appcompat.app.AppCompatActivity

class HomeActivity : AppCompatActivity() {

    private lateinit var cardCamera: LinearLayout
    private lateinit var cardEquipe: LinearLayout
    private lateinit var cardHistorico: LinearLayout
    private lateinit var cardExportar: LinearLayout
    private lateinit var cardPerfil: LinearLayout

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.home)

        cardCamera = findViewById(R.id.cardCamera)
        cardEquipe = findViewById(R.id.cardEquipe)
        cardHistorico = findViewById(R.id.cardHistorico)
        cardExportar = findViewById(R.id.cardExportar)
        cardPerfil = findViewById(R.id.cardPerfil)

        cardCamera.setOnClickListener {
            startActivity(Intent(this, ContagemActivity::class.java))
        }

        cardEquipe.setOnClickListener {
            startActivity(Intent(this, EquipeActivity::class.java))
        }

        cardHistorico.setOnClickListener {
            startActivity(Intent(this, HistoricoActivity::class.java))
        }

        cardExportar.setOnClickListener {
            startActivity(Intent(this, ExportacaoActivity::class.java))
        }

        cardPerfil.setOnClickListener {
            startActivity(Intent(this, PerfilActivity::class.java))
        }
    }
}