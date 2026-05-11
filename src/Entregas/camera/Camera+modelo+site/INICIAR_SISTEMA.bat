@echo off
title Sistema LeContagem - Inicializando
echo ==========================================
echo    INICIANDO BACKEND (PYTHON + IA)
echo ==========================================
:: Abre o servidor Python em uma nova janela minimizada
start /min cmd /k "& C:/Users/Gabriel/AppData/Local/Programs/Python/Python314/python.exe camera.py"

echo.
echo ==========================================
echo    INICIANDO FRONTEND (REACT UI)
echo ==========================================
:: Entra na pasta do dashboard e inicia o site
cd lecontagem-dashboard
npm start

pause