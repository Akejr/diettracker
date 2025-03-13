@echo off
setlocal enabledelayedexpansion

:: Define o caminho do Inkscape
set "INKSCAPE=C:\Program Files\Inkscape\bin\inkscape.exe"
if not exist "!INKSCAPE!" (
    set "INKSCAPE=C:\Program Files (x86)\Inkscape\bin\inkscape.exe"
)

:: Verifica se o Inkscape foi encontrado
if not exist "!INKSCAPE!" (
    echo Inkscape não encontrado em:
    echo C:\Program Files\Inkscape\bin\inkscape.exe
    echo C:\Program Files (x86)\Inkscape\bin\inkscape.exe
    echo Por favor, verifique se o Inkscape está instalado corretamente.
    exit /b 1
)

:: Cria os diretórios se não existirem
if not exist "public\icons" mkdir "public\icons"
if not exist "public\splash" mkdir "public\splash"

:: Exporta os ícones
echo Exportando ícones...
for %%s in (72 96 128 144 152 167 180 192 384 512) do (
    echo Gerando ícone %%sx%%s...
    "!INKSCAPE!" --export-type=png --export-filename="public\icons\icon-%%sx%%s.png" --export-width=%%s --export-height=%%s "src\assets\logo.svg"
)

:: Exporta as splash screens
echo Exportando splash screens...
for %%s in ("2048x2732" "1668x2224" "1536x2048" "1125x2436" "1242x2208" "750x1334" "640x1136") do (
    set "size=%%~s"
    for /f "tokens=1,2 delims=x" %%a in ("!size!") do (
        set "width=%%a"
        set "height=%%b"
        echo Gerando splash screen !width!x!height!...
        "!INKSCAPE!" --export-type=png --export-filename="public\splash\apple-splash-!width!-!height!.png" --export-width=!width! --export-height=!height! "src\assets\splash.svg"
    )
)

echo Concluído!
pause 