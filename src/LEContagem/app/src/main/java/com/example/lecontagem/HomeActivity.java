package com.example.lecontagem;

import android.content.Intent;
import android.os.Bundle;
import android.view.View;
import android.widget.LinearLayout;

import androidx.appcompat.app.AppCompatActivity;

public class HomeActivity extends AppCompatActivity {

    LinearLayout cardCamera;
    LinearLayout cardEquipe;
    LinearLayout cardHistorico;
    LinearLayout cardExportar;
    LinearLayout cardPerfil;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.home);

        cardCamera = findViewById(R.id.cardCamera);
        cardEquipe = findViewById(R.id.cardEquipe);
        cardHistorico = findViewById(R.id.cardHistorico);
        cardExportar = findViewById(R.id.cardExportar);
        cardPerfil = findViewById(R.id.cardPerfil);

        cardCamera.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View view) {
                Intent intent = new Intent(HomeActivity.this, ContagemActivity.class);
                startActivity(intent);
            }
        });

        cardEquipe.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View view) {
                Intent intent = new Intent(HomeActivity.this, EquipeActivity.class);
                startActivity(intent);
            }
        });

        cardHistorico.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View view) {
                Intent intent = new Intent(HomeActivity.this, HistoricoActivity.class);
                startActivity(intent);
            }
        });

        cardExportar.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View view) {
                Intent intent = new Intent(HomeActivity.this, ExportacaoActivity.class);
                startActivity(intent);
            }
        });

        cardPerfil.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View view) {
                Intent intent = new Intent(HomeActivity.this, PerfilActivity.class);
                startActivity(intent);
            }
        });
    }
}