package com.example.lecontagem;

import android.content.Intent;
import android.os.Bundle;
import android.util.Patterns;
import android.view.View;
import android.widget.ArrayAdapter;
import android.widget.Button;
import android.widget.Spinner;
import android.widget.TextView;
import android.widget.Toast;

import androidx.appcompat.app.AppCompatActivity;

import com.google.android.material.textfield.TextInputEditText;

public class CadastroActivity extends AppCompatActivity {

    TextInputEditText inputNome;
    TextInputEditText inputEmail;
    TextInputEditText inputSenha;

    Spinner spinnerCargo;

    Button cadastrarButton;

    TextView voltarLogin;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.cadastro);

        inputNome = findViewById(R.id.InputNome);
        inputEmail = findViewById(R.id.InputEmail);
        inputSenha = findViewById(R.id.InputSenha);

        spinnerCargo = findViewById(R.id.spinnerCargo);

        cadastrarButton = findViewById(R.id.CadastrarButton);
        voltarLogin = findViewById(R.id.VoltarLogin);

        String[] cargos = {
                "Selecione o cargo",
                "Funcionário",
                "Nutricionista",
                "Gestor",
                "Administrador"
        };

        ArrayAdapter<String> adapter = new ArrayAdapter<>(
                this,
                android.R.layout.simple_spinner_dropdown_item,
                cargos
        );

        spinnerCargo.setAdapter(adapter);

        cadastrarButton.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {

                String nome = inputNome.getText().toString().trim();
                String email = inputEmail.getText().toString().trim();
                String senha = inputSenha.getText().toString().trim();
                String cargo = spinnerCargo.getSelectedItem().toString();

                if (nome.isEmpty()) {
                    inputNome.setError("Digite seu nome");
                    inputNome.requestFocus();
                    return;
                }

                if (email.isEmpty()) {
                    inputEmail.setError("Digite seu email");
                    inputEmail.requestFocus();
                    return;
                }

                if (!Patterns.EMAIL_ADDRESS.matcher(email).matches()) {
                    inputEmail.setError("Email inválido");
                    inputEmail.requestFocus();
                    return;
                }

                if (senha.isEmpty()) {
                    inputSenha.setError("Digite sua senha");
                    inputSenha.requestFocus();
                    return;
                }

                if (cargo.equals("Selecione o cargo")) {
                    Toast.makeText(CadastroActivity.this, "Selecione um cargo", Toast.LENGTH_SHORT).show();
                    return;
                }

                Toast.makeText(CadastroActivity.this, "Cadastro realizado com sucesso!", Toast.LENGTH_SHORT).show();

                Intent intent = new Intent(CadastroActivity.this, LoginActivity.class);

                intent.putExtra("email", email);
                intent.putExtra("senha", senha);

                startActivity(intent);
                finish();
            }
        });

        voltarLogin.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {

                Intent intent = new Intent(CadastroActivity.this, LoginActivity.class);
                startActivity(intent);
                finish();
            }
        });
    }
}