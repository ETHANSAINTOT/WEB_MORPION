@echo off
title SERVEUR MORPION
color 0B
cls


if exist "program" (
    cd program
) else (
    color 0C
    echo.
    echo [ERREUR] Le dossier 'program' est introuvable !
    echo Verifiez que ce fichier est bien a cote du dossier 'program'.
    echo.
    pause
    exit
)

echo =========================================
echo      LANCEMENT DU SERVEUR WINDOWS
echo =========================================
echo.

set /p port="Sur quel port voulez-vous lancer le jeu ? (Defaut: 7498) : "
if "%port%"=="" set port=7498

echo.
echo Recherche de votre IP locale...
echo -----------------------------------------
ipconfig | findstr "IPv4"
echo -----------------------------------------
echo.
echo [INFO] Pour jouer sur ce PC, allez sur : 
echo        http://localhost:%port%
echo.
echo [INFO] Pour jouer sur MOBILE, utilisez l'IP ci-dessus :
echo        http://[VOTRE_IP]:%port%
echo.
echo Appuyez sur CTRL+C pour arreter le serveur.
echo.

php -S 0.0.0.0:%port%

pause