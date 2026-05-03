package com.example.lecontagem

import android.content.Intent
import android.graphics.Canvas
import android.graphics.Color
import android.graphics.Paint
import android.graphics.pdf.PdfDocument
import android.os.Bundle
import android.os.Environment
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import androidx.core.content.FileProvider
import com.google.android.material.appbar.MaterialToolbar
import com.google.android.material.button.MaterialButton
import com.google.firebase.firestore.FirebaseFirestore
import java.io.File
import java.io.FileOutputStream
import java.io.IOException

class ExportacaoActivity : AppCompatActivity() {

    private val db = FirebaseFirestore.getInstance()

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_exportacao)

        val toolbar = findViewById<MaterialToolbar>(R.id.toolbarExport)
        val btnPDF = findViewById<MaterialButton>(R.id.btnPDF)
        val btnCSV = findViewById<MaterialButton>(R.id.btnCSV)

        toolbar.setNavigationOnClickListener { finish() }

        btnCSV.setOnClickListener { processarDadosParaExportacao(isPDF = false) }
        btnPDF.setOnClickListener { processarDadosParaExportacao(isPDF = true) }
    }

    private fun processarDadosParaExportacao(isPDF: Boolean) {
        Toast.makeText(this, "Coletando dados do Firebase...", Toast.LENGTH_SHORT).show()

        db.collection("metas").get().addOnSuccessListener { snapshotMetas ->
            db.collection("contagem").get().addOnSuccessListener { snapshotContagens ->

                val dadosProcessados = mutableListOf<String>()
                // Cabeçalho para CSV
                if (!isPDF) dadosProcessados.add("Equipe;Alimento;Meta;Realizado;%\n")

                for (docMeta in snapshotMetas.documents) {
                    val equipe = docMeta.getString("equipe") ?: ""
                    val alimento = docMeta.getString("alimento") ?: ""
                    val meta = docMeta.getDouble("quantidadeKg") ?: 0.0

                    var realizado = 0.0
                    for (docCont in snapshotContagens.documents) {
                        if (docCont.getString("equipe") == equipe && docCont.getString("alimento") == alimento) {
                            realizado += docCont.getDouble("quantidade") ?: 0.0
                        }
                    }

                    val porc = if (meta > 0) (realizado / meta * 100).toInt() else 0

                    if (isPDF) {
                        dadosProcessados.add("$equipe | $alimento: ${realizado}kg de ${meta}kg ($porc%)")
                    } else {
                        dadosProcessados.add("$equipe;$alimento;$meta;$realizado;$porc%\n")
                    }
                }

                if (isPDF) gerarPDF(dadosProcessados) else gerarCSV(dadosProcessados)
            }
        }.addOnFailureListener {
            Toast.makeText(this, "Erro ao conectar ao banco", Toast.LENGTH_SHORT).show()
        }
    }

    private fun gerarCSV(linhas: List<String>) {
        val csvTexto = StringBuilder()
        linhas.forEach { csvTexto.append(it) }

        val arquivo = criarArquivoLocal("Relatorio.csv")
        try {
            val out = FileOutputStream(arquivo)
            out.write(csvTexto.toString().toByteArray())
            out.close()
            compartilharArquivo(arquivo, "text/csv")
        } catch (e: Exception) {
            Toast.makeText(this, "Erro ao salvar CSV", Toast.LENGTH_SHORT).show()
        }
    }

    private fun gerarPDF(linhas: List<String>) {
        val pdf = PdfDocument()
        val pageInfo = PdfDocument.PageInfo.Builder(595, 842, 1).create()
        val page = pdf.startPage(pageInfo)
        val canvas = page.canvas
        val paint = Paint()

        // Título
        paint.textSize = 18f
        paint.isFakeBoldText = true
        canvas.drawText("Relatório de Produção - LeContagem", 50f, 50f, paint)

        // Conteúdo
        paint.textSize = 12f
        paint.isFakeBoldText = false
        var yPos = 100f

        for (linha in linhas) {
            canvas.drawText(linha, 50f, yPos, paint)
            yPos += 25f
            if (yPos > 800f) break // Limite da página
        }

        pdf.finishPage(page)

        val arquivo = criarArquivoLocal("Relatorio.pdf")
        try {
            pdf.writeTo(FileOutputStream(arquivo))
            pdf.close()
            compartilharArquivo(arquivo, "application/pdf")
        } catch (e: IOException) {
            Toast.makeText(this, "Erro ao salvar PDF", Toast.LENGTH_SHORT).show()
        }
    }

    private fun criarArquivoLocal(nome: String): File {
        val diretorio = getExternalFilesDir(Environment.DIRECTORY_DOWNLOADS)
        return File(diretorio, "${System.currentTimeMillis()}_$nome")
    }

    private fun compartilharArquivo(arquivo: File, tipo: String) {
        try {
            val uri = FileProvider.getUriForFile(this, "${packageName}.fileprovider", arquivo)
            val intent = Intent(Intent.ACTION_SEND)
            intent.type = tipo
            intent.putExtra(Intent.EXTRA_STREAM, uri)
            intent.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION)
            startActivity(Intent.createChooser(intent, "Abrir Relatório"))
        } catch (e: Exception) {
            Toast.makeText(this, "Erro ao abrir arquivo: ${e.message}", Toast.LENGTH_LONG).show()
        }
    }
}