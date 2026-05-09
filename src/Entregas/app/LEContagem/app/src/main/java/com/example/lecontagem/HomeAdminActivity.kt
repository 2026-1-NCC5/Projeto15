package com.example.lecontagem

import android.content.Intent
import android.os.Bundle
import androidx.appcompat.app.AppCompatActivity
import androidx.cardview.widget.CardView

class HomeAdminActivity : AppCompatActivity() {

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.homeadmin)

        // 1. Mapeamento dos Cards de Gerenciamento
        val cardGerenciarEquipes = findViewById<CardView>(R.id.cardGerenciarEquipes)
        val cardGerenciarUsuarios = findViewById<CardView>(R.id.cardGerenciarUsuarios)
        val cardGerenciarMetas = findViewById<CardView>(R.id.cardGerenciarMetas)

        // 2. Mapeamento dos Cards Operacionais e Ajustes
        val cardPerfil = findViewById<CardView>(R.id.cardPerfil)
        val cardHistorico = findViewById<CardView>(R.id.cardHistorico)
        val cardExportar = findViewById<CardView>(R.id.cardExportar)
        val cardEquipe = findViewById<CardView>(R.id.cardEquipe)
        val cardCamera = findViewById<CardView>(R.id.cardCamera)

        // --- Cliques Gerenciar ---
        cardGerenciarEquipes.setOnClickListener {
            startActivity(Intent(this, GerenciarEquipesActivity::class.java))
        }

        cardGerenciarUsuarios.setOnClickListener {
            startActivity(Intent(this, GerenciarUsuariosActivity::class.java))
        }

        cardGerenciarMetas.setOnClickListener {
            startActivity(Intent(this, GerenciarMetasActivity::class.java))
        }

        // --- Cliques Operacionais e Ajustes ---
        cardPerfil.setOnClickListener {
            startActivity(Intent(this, PerfilActivity::class.java))
        }

        cardHistorico.setOnClickListener {
            startActivity(Intent(this, HistoricoActivity::class.java))
        }

        cardExportar.setOnClickListener {
            startActivity(Intent(this, ExportacaoActivity::class.java))
        }

        cardEquipe.setOnClickListener {
            startActivity(Intent(this, EquipeActivity::class.java))
        }

        cardCamera.setOnClickListener {
            startActivity(Intent(this, ContagemActivity::class.java))
        }
    }
}