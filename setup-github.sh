#!/bin/bash

# Script para configurar GitHub Token fácilmente

echo "🔧 Configurador de GitHub para TequeñoBot"
echo "=========================================="
echo ""
echo "Este script te ayudará a configurar el token de GitHub"
echo ""

# Verificar si .env existe
if [ ! -f ".env" ]; then
    echo "📝 Creando archivo .env..."
    cp .env.example .env
    echo "✅ Archivo .env creado"
else
    echo "⚠️ .env ya existe"
fi

echo ""
echo "1️⃣  Ve a: https://github.com/settings/tokens/new"
echo "2️⃣  Crea un token con:"
echo "   - Nombre: TequenoBot"
echo "   - Scope: repo (completo)"
echo "3️⃣  Copia el token"
echo ""
read -p "Pega tu token aquí: " TOKEN

if [ -z "$TOKEN" ]; then
    echo "❌ Token vacío. Intenta de nuevo."
    exit 1
fi

# Actualizar .env
sed -i '' "s/GITHUB_TOKEN=.*/GITHUB_TOKEN=$TOKEN/" .env

echo ""
echo "✅ Token guardado en .env"
echo ""
echo "Verifica que tu repositorio exista:"
echo "https://github.com/tu_usuario/tequenobot-news"
echo ""
echo "Si no existe, créalo en GitHub (PÚBLICO)"
echo ""
echo "¡Listo! Ahora puedes iniciar el bot:"
echo "npm start"
