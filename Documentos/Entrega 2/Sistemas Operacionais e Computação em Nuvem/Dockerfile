# 1. Usa o Python oficial na versão slim (mais leve para o container)
FROM python:3.9-slim

# 2. Define a pasta onde tudo vai acontecer dentro do container
WORKDIR /app

# 3. Instala o Pandas e o Scikit-Learn (sem guardar cache para economizar espaço)
RUN pip install --no-cache-dir pandas scikit-learn

# 4. Copia o seu código Python para dentro do container
COPY script_ia.py .

# 5. Comando que o Docker vai executar quando o container iniciar
CMD ["python", "script_ia.py"]