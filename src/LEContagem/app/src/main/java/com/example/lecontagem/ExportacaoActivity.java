package com.example.lecontagem;

import android.content.Intent;
import android.os.Bundle;
import android.widget.Button;
import android.widget.DatePicker;
import android.widget.Toast;

import androidx.appcompat.app.AppCompatActivity;

public class ExportacaoActivity extends AppCompatActivity {

    DatePicker dataExport;
    Button btnPDF;
    Button btnCSV;
    Button btnVoltar;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.exportacao);

        dataExport = findViewById(R.id.dataExport);
        btnPDF = findViewById(R.id.btnPDF);
        btnCSV = findViewById(R.id.btnCSV);
        btnVoltar = findViewById(R.id.btnVoltar);

        btnPDF.setOnClickListener(v -> {

            int dia = dataExport.getDayOfMonth();
            int mes = dataExport.getMonth() + 1;
            int ano = dataExport.getYear();

            String dataSelecionada = dia + "/" + mes + "/" + ano;

            Toast.makeText(ExportacaoActivity.this,
                    "Exportando PDF da data: " + dataSelecionada,
                    Toast.LENGTH_SHORT).show();

        });

        btnCSV.setOnClickListener(v -> {

            int dia = dataExport.getDayOfMonth();
            int mes = dataExport.getMonth() + 1;
            int ano = dataExport.getYear();

            String dataSelecionada = dia + "/" + mes + "/" + ano;

            Toast.makeText(ExportacaoActivity.this,
                    "Exportando CSV da data: " + dataSelecionada,
                    Toast.LENGTH_SHORT).show();

        });

        btnVoltar.setOnClickListener(v -> {

            Intent intent = new Intent(ExportacaoActivity.this, HomeActivity.class);
            startActivity(intent);
            finish();

        });
    }
}