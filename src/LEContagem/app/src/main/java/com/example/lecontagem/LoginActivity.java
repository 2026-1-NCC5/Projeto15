package com.example.lecontagem;

import android.content.Intent;
import android.os.Bundle;
import android.util.Patterns;
import android.view.View;
import android.widget.Button;
import android.widget.TextView;
import android.widget.Toast;

import androidx.appcompat.app.AppCompatActivity;

import com.google.android.material.textfield.TextInputEditText;

public class LoginActivity extends AppCompatActivity {

    TextInputEditText inputEmail;
    TextInputEditText inputSenha;

    Button entrarButton;
    TextView cadastrarSeButton;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.login);

        inputEmail = findViewById(R.id.InputEmail);
        inputSenha = findViewById(R.id.InputSenha);

        entrarButton = findViewById(R.id.EntrarButton);
        cadastrarSeButton = findViewById(R.id.Cadastrase);

        // RECEBENDO DADOS DO CADASTRO
        Intent intentRecebida = getIntent();

        String emailRecebido = intentRecebida.getStringExtra("email");
        String senhaRecebida = intentRecebida.getStringExtra("senha");

        if (emailRecebido != null) {
            inputEmail.setText(emailRecebido);
        }

        if (senhaRecebida != null) {
            inputSenha.setText(senhaRecebida);
        }

        // BOTÃO ENTRAR
        entrarButton.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {

                String email = inputEmail.getText().toString().trim();
                String senha = inputSenha.getText().toString().trim();

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

                Toast.makeText(LoginActivity.this, "Login realizado com sucesso!", Toast.LENGTH_SHORT).show();

                Intent intent = new Intent(LoginActivity.this, HomeActivity.class);
                startActivity(intent);
                finish();
            }
        });

        // BOTÃO CADASTRAR-SE
        cadastrarSeButton.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {

                Intent intent = new Intent(LoginActivity.this, CadastroActivity.class);
                startActivity(intent);

            }
        });

    }
}