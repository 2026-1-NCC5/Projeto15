package com.example.lecontagem;

import android.content.Intent;
import android.os.Bundle;
import android.view.View;
import android.widget.Button;
import android.widget.EditText;
import android.widget.Toast;

import androidx.appcompat.app.AppCompatActivity;

public class PerfilActivity extends AppCompatActivity {

    EditText edtNome;
    EditText edtEmail;
    EditText edtSenha;
    EditText edtCargo;

    Button btnSalvar;
    Button btnVoltarHome;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.perfil);

        edtNome = findViewById(R.id.edtNome);
        edtEmail = findViewById(R.id.edtEmail);
        edtSenha = findViewById(R.id.edtSenha);
        edtCargo = findViewById(R.id.edtCargo);

        btnSalvar = findViewById(R.id.btnSalvar);
        btnVoltarHome = findViewById(R.id.btnVoltarHome);

        btnSalvar.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View view) {

                String nome = edtNome.getText().toString();
                String email = edtEmail.getText().toString();
                String senha = edtSenha.getText().toString();
                String cargo = edtCargo.getText().toString();

                Toast.makeText(PerfilActivity.this,
                        "Dados salvos com sucesso!",
                        Toast.LENGTH_SHORT).show();
            }
        });

        btnVoltarHome.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View view) {
                Intent intent = new Intent(PerfilActivity.this, HomeActivity.class);
                startActivity(intent);
                finish();
            }
        });
    }
}