package com.example.lecontagem

import android.content.Intent
import android.os.Bundle
import android.widget.*
import androidx.appcompat.app.AppCompatActivity

class ContagemActivity : AppCompatActivity() {

    private lateinit var spinnerEquipe: Spinner

    private lateinit var txtStatusSessao: TextView
    private lateinit var txtUltimaDeteccao: TextView
    private lateinit var txtConfianca: TextView

    private lateinit var txtArroz: TextView
    private lateinit var txtFeijao: TextView
    private lateinit var txtOutros: TextView

    private lateinit var btnIniciarEncerrar: Button
    private lateinit var btnVoltarHome: Button

    private var sessaoAtiva = false

    private var arroz = 0
    private var feijao = 0
    private var outros = 0

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.contagem)

        spinnerEquipe = findViewById(R.id.spinnerEquipe)

        txtStatusSessao = findViewById(R.id.txtStatusSessao)
        txtUltimaDeteccao = findViewById(R.id.txtUltimaDeteccao)
        txtConfianca = findViewById(R.id.txtConfianca)

        txtArroz = findViewById(R.id.txtArroz)
        txtFeijao = findViewById(R.id.txtFeijao)
        txtOutros = findViewById(R.id.txtOutros)

        btnIniciarEncerrar = findViewById(R.id.btnIniciarEncerrar)
        btnVoltarHome = findViewById(R.id.btnVoltarHome)

        val equipes = arrayOf(
            "Selecione uma equipe",
            "Equipe A",
            "Equipe B",
            "Equipe C",
            "Equipe D"
        )

        val adapter = ArrayAdapter(
            this,
            android.R.layout.simple_spinner_dropdown_item,
            equipes
        )

        spinnerEquipe.adapter = adapter

        btnIniciarEncerrar.setOnClickListener {

            if (!sessaoAtiva) {
                sessaoAtiva = true
                txtStatusSessao.text = "Status: Sessão em andamento"
                btnIniciarEncerrar.text = "Encerrar Sessão"

            } else {
                sessaoAtiva = false
                txtStatusSessao.text = "Status: Sessão encerrada"
                btnIniciarEncerrar.text = "Iniciar Sessão"
            }
        }

        btnVoltarHome.setOnClickListener {
            val intent = Intent(this, HomeActivity::class.java)
            startActivity(intent)
            finish()
        }
    }
}