package com.example.lecontagem;

import android.content.Intent;
import android.os.Bundle;
import android.view.View;
import android.widget.ArrayAdapter;
import android.widget.Button;
import android.widget.Spinner;
import android.widget.TextView;

import androidx.appcompat.app.AppCompatActivity;

public class ContagemActivity extends AppCompatActivity {

    Spinner spinnerEquipe;

    TextView txtStatusSessao;
    TextView txtUltimaDeteccao;
    TextView txtConfianca;

    TextView txtArroz;
    TextView txtFeijao;
    TextView txtOutros;

    Button btnIniciarEncerrar;
    Button btnVoltarHome;

    boolean sessaoAtiva = false;

    int arroz = 0;
    int feijao = 0;
    int outros = 0;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.contagem);

        spinnerEquipe = findViewById(R.id.spinnerEquipe);

        txtStatusSessao = findViewById(R.id.txtStatusSessao);
        txtUltimaDeteccao = findViewById(R.id.txtUltimaDeteccao);
        txtConfianca = findViewById(R.id.txtConfianca);

        txtArroz = findViewById(R.id.txtArroz);
        txtFeijao = findViewById(R.id.txtFeijao);
        txtOutros = findViewById(R.id.txtOutros);

        btnIniciarEncerrar = findViewById(R.id.btnIniciarEncerrar);
        btnVoltarHome = findViewById(R.id.btnVoltarHome);

        String[] equipes = {
                "Selecione uma equipe",
                "Equipe A",
                "Equipe B",
                "Equipe C",
                "Equipe D"
        };

        ArrayAdapter<String> adapter = new ArrayAdapter<>(
                this,
                android.R.layout.simple_spinner_dropdown_item,
                equipes
        );

        spinnerEquipe.setAdapter(adapter);

        btnIniciarEncerrar.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View view) {

                if (!sessaoAtiva) {

                    sessaoAtiva = true;

                    txtStatusSessao.setText("Status: Sessão em andamento");
                    btnIniciarEncerrar.setText("Encerrar Sessão");

                } else {

                    sessaoAtiva = false;

                    txtStatusSessao.setText("Status: Sessão encerrada");
                    btnIniciarEncerrar.setText("Iniciar Sessão");

                }

            }
        });

        btnVoltarHome.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View view) {
                Intent intent = new Intent(ContagemActivity.this, HomeActivity.class);
                startActivity(intent);
                finish();
            }
        });

    }
}