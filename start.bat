@echo off
chcp 65001 >nul
color 0A
echo ========================================
echo    INSTALLAZIONE LIBRERIE E GIT
echo ========================================
echo.

REM Verifica se Node.js è installato
echo [1/4] Verifico Node.js...
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Node.js NON è installato!
    echo.
    echo Scaricalo da: https://nodejs.org
    echo Premi un tasto per aprire il sito...
    pause >nul
    start https://nodejs.org
    echo.
    echo Dopo aver installato Node.js, riavvia questo file .bat
    pause
    exit
) else (
    echo ✅ Node.js è già installato
)

echo.

REM Verifica se Git è installato
echo [2/4] Verifico Git...
git --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Git NON è installato!
    echo.
    echo Scaricalo da: https://git-scm.com/download/win
    echo Premi un tasto per aprire il sito...
    pause >nul
    start https://git-scm.com/download/win
    echo.
    echo Dopo aver installato Git, riavvia questo file .bat
    pause
    exit
) else (
    echo ✅ Git è già installato
)

echo.

REM Installa le dipendenze npm
echo [3/4] Installo le librerie Node.js...
echo.
call npm install express
if %errorlevel% neq 0 (
    echo ❌ Errore durante l'installazione!
    pause
    exit
)

echo.
echo ✅ Librerie installate con successo!
echo.

REM Inizializza Git
echo [4/4] Inizializzo Git repository...
git init
git add .
git commit -m "Prima versione del progetto"

echo.
echo ========================================
echo    ✅ INSTALLAZIONE COMPLETATA!
echo ========================================
echo.
echo Ora puoi:
echo 1. Creare un repository su GitHub
echo 2. Eseguire questi comandi (cambia NOME-REPO):
echo.
echo    git remote add origin https://github.com/patrickdj546/NOME-REPO.git
echo    git branch -M main
echo    git push -u origin main
echo.
echo ========================================
pause