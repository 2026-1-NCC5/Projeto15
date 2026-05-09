package com.example.lecontagem

import android.content.Intent
import android.os.Bundle
import androidx.appcompat.app.AppCompatActivity
import androidx.cardview.widget.CardView

class HomeCoordenadorActivity : AppCompatActivity() {

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.homecoordenador)

        // Referências
        val cardDashboard = findViewById<CardView>(R.id.cardDashboardEquipe)
        val cardExportar = findViewById<CardView>(R.id.cardExportarCoordenador)
        val cardCamera = findViewById<CardView>(R.id.cardCameraCoordenador)
        val cardEquipe = findViewById<CardView>(R.id.cardMinhaEquipeCoordenador)
        val cardPerfil = findViewById<CardView>(R.id.cardPerfilCoordenador)
        val cardMetas = findViewById<CardView>(R.id.cardVerMetasCoordenador)

        // Cliques
        cardDashboard.setOnClickListener {
            startActivity(Intent(this, DashboardCoordenadorActivity::class.java))
        }

        cardExportar.setOnClickListener {
            startActivity(Intent(this, ExportacaoCoordenadorActivity::class.java))
        }

        cardCamera.setOnClickListener {
            startActivity(Intent(this, ContagemActivity::class.java))
        }

        cardEquipe.setOnClickListener {
            startActivity(Intent(this, EquipeActivity::class.java))
        }

        cardPerfil.setOnClickListener {
            // Direciona para a tela de perfil já existente
            startActivity(Intent(this, PerfilActivity::class.java))
        }

        cardMetas.setOnClickListener {
            startActivity(Intent(this, VisualizarMetasActivity::class.java))
        }
    }
}