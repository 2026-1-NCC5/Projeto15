package com.example.lecontagem

import android.content.Intent
import android.os.Bundle
import android.widget.Button
import android.widget.LinearLayout
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity

class EquipeActivity : AppCompatActivity() {

    private lateinit var cardEquipeA: LinearLayout
    private lateinit var cardEquipeB: LinearLayout
    private lateinit var cardEquipeC: LinearLayout

    private lateinit var voltarButton: Button

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.equipe)

        cardEquipeA = findViewById(R.id.cardEquipeA)
        cardEquipeB = findViewById(R.id.cardEquipeB)
        cardEquipeC = findViewById(R.id.cardEquipeC)

        voltarButton = findViewById(R.id.VoltarButton)

        cardEquipeA.setOnClickListener {
            Toast.makeText(this, "Equipe A selecionada", Toast.LENGTH_SHORT).show()
        }

        cardEquipeB.setOnClickListener {
            Toast.makeText(this, "Equipe B selecionada", Toast.LENGTH_SHORT).show()
        }

        cardEquipeC.setOnClickListener {
            Toast.makeText(this, "Equipe C selecionada", Toast.LENGTH_SHORT).show()
        }

        voltarButton.setOnClickListener {
            val intent = Intent(this, HomeActivity::class.java)
            startActivity(intent)
            finish()
        }
    }
}