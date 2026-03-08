package com.example.lecontagem;

import android.content.Intent;
import android.os.Bundle;
import android.view.View;
import android.widget.Button;
import android.widget.LinearLayout;
import android.widget.Toast;

import androidx.appcompat.app.AppCompatActivity;

public class EquipeActivity extends AppCompatActivity {

    LinearLayout cardEquipeA;
    LinearLayout cardEquipeB;
    LinearLayout cardEquipeC;

    Button VoltarButton;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.equipe);

        cardEquipeA = findViewById(R.id.cardEquipeA);
        cardEquipeB = findViewById(R.id.cardEquipeB);
        cardEquipeC = findViewById(R.id.cardEquipeC);

        VoltarButton = findViewById(R.id.VoltarButton);

        cardEquipeA.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View view) {
                Toast.makeText(EquipeActivity.this, "Equipe A selecionada", Toast.LENGTH_SHORT).show();
            }
        });

        cardEquipeB.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View view) {
                Toast.makeText(EquipeActivity.this, "Equipe B selecionada", Toast.LENGTH_SHORT).show();
            }
        });

        cardEquipeC.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View view) {
                Toast.makeText(EquipeActivity.this, "Equipe C selecionada", Toast.LENGTH_SHORT).show();
            }
        });

        VoltarButton.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View view) {
                Intent intent = new Intent(EquipeActivity.this, HomeActivity.class);
                startActivity(intent);
                finish();
            }
        });
    }
}