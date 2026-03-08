package com.example.lecontagem;

import android.content.Intent;
import android.os.Bundle;
import android.widget.Button;
import android.widget.DatePicker;
import android.widget.LinearLayout;
import android.widget.TextView;

import androidx.appcompat.app.AppCompatActivity;

public class HistoricoActivity extends AppCompatActivity {

    DatePicker datePicker;
    LinearLayout listaHistorico;
    Button voltarButton;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.historico);

        datePicker = findViewById(R.id.datePicker);
        listaHistorico = findViewById(R.id.listaHistorico);
        voltarButton = findViewById(R.id.VoltarButton);

        // EXEMPLO DE HISTÓRICO
        adicionarItem("Produto A - 10 unidades");
        adicionarItem("Produto B - 5 unidades");
        adicionarItem("Produto C - 18 unidades");

        // BOTÃO VOLTAR
        voltarButton.setOnClickListener(v -> {

            Intent intent = new Intent(HistoricoActivity.this, HomeActivity.class);
            startActivity(intent);
            finish();

        });
    }

    private void adicionarItem(String texto){

        TextView item = new TextView(this);
        item.setText(texto);
        item.setTextSize(18);
        item.setPadding(10,10,10,10);

        listaHistorico.addView(item);

    }
}