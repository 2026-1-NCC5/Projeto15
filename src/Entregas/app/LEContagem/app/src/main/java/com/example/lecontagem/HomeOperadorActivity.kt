package com.example.lecontagem

import android.content.Intent
import android.os.Bundle
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import androidx.cardview.widget.CardView

class HomeOperadorActivity : AppCompatActivity() {

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.homeoperador)

        // IDs baseados no XML homeoperador.xml
        val cardContagem = findViewById<CardView>(R.id.cardCamera)
        val cardMinhaEquipe = findViewById<CardView>(R.id.cardMinhaEquipe)
        val cardPerfil = findViewById<CardView>(R.id.cardPerfil)
        val cardVerMetas = findViewById<CardView>(R.id.cardVerMetas)

        // 1. REGISTRAR CONTAGEM
        cardContagem.setOnClickListener {
            startActivity(Intent(this, ContagemActivity::class.java))
        }

        // 2. MINHA EQUIPE (SELECIONAR)
        cardMinhaEquipe.setOnClickListener {
            startActivity(Intent(this, EquipeActivity::class.java))
        }

        // 3. PERFIL
        cardPerfil.setOnClickListener {
            startActivity(Intent(this, PerfilActivity::class.java))
        }

        // 4. VER METAS (TELA QUE CRIAMOS ACIMA)
        cardVerMetas.setOnClickListener {
            startActivity(Intent(this, VisualizarMetasActivity::class.java))
        }

        // 5. DASHBOARD DA EQUIPE

    }
}