@echo off
title SERVEUR MORPION ULTIMATE
color 0B
cls

:: Vérification du dossier
if not exist "program" (
    color 0C
    echo [ERREUR] Le dossier 'program' est introuvable !
    pause
    exit
)

cd program

:menu
cls
echo ╔══════════════════════════════════════════════════════╗
echo ║           ROKET SERVEUR MORPION ULTIMATE             ║
echo ╚══════════════════════════════════════════════════════╝
echo.

:: 1. Question PORT
set /p port="Sur quel port lancer le serveur ? (Entree pour 7498) : "
if "%port%"=="" set port=7498

:: 2. Question LOGS
echo.
set /p showlogs="Afficher les requetes (GET/POST) ? (y/n) : "

cls
echo ╔══════════════════════════════════════════════════════╗
echo ║               OK  SERVEUR EN LIGNE  OK               ║
echo ╚══════════════════════════════════════════════════════╝
echo.
echo  PC LOCAL (Toi)     : http://localhost:%port%
echo.
echo  MOBILE / AUTRE PC  : Utiliser l'IP ci-dessous
echo --------------------------------------------------------
ipconfig | findstr "IPv4"
echo --------------------------------------------------------
echo.
echo [INFO] CTRL+C pour stopper le serveur.

:: Lancement avec ou sans logs
if /I "%showlogs%"=="n" (
    echo Mode silencieux active.
    php -S 0.0.0.0:%port% > NUL 2>&1
) else (
    php -S 0.0.0.0:%port%
)

pause