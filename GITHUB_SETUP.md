# 🔧 Configuración de GitHub como Base de Datos

## Pasos para activar la memoria en GitHub:

### 1️⃣ Crear Token Personal de GitHub

**URL:** https://github.com/settings/tokens/new

- **Nombre del token:** `TequenoBot`
- **Expiration:** No expiration (o la que prefieras)
- **Scopes necesarios:**
  - ✅ `repo` (acceso completo a repositorios)
  

### 2️⃣ Crear Repositorio en GitHub

```bash
# Tu nuevo repositorio se llamará:
tequenobot-news

# Debe ser PÚBLICO (para que GitHub Actions pueda leerlo)
# o PRIVADO (si usas tokens)
```

### 3️⃣ Configurar el Archivo .env

```bash
# Copiar archivo de ejemplo
cp .env.example .env

# Editar .env y agregar:
GITHUB_TOKEN=ghp_xxxxxxxxxxxxxxxxxxxxx
```

### 4️⃣ Actualizar index.js si es necesario

Verifica estas variables si usas un usuario/repo diferente:

```javascript
const GITHUB_REPO = 'tequenobot-news'; // Tu nombre de repo
const GITHUB_USER = 'tu_usuario'; // Tu usuario de GitHub
```

### 5️⃣ Iniciar el Bot

```bash
npm start
```

## 🎯 ¿Cómo funciona?

### **Flujo Normal:**

1. **Al iniciar** → Descarga `noticias-guardadas.json` desde GitHub
2. **Cada noticia que ve** → La guarda en memoria local (RÁPIDO)
3. **Cada 6 horas** → Sube un "paquete" con todas a GitHub (EFICIENTE)

### **Ventajas:**

✅ **Sin lentitud** - No escribe a GitHub a cada noticia
✅ **Sin conflictos** - Una sola versión del archivo  
✅ **Ligero** - Solo guarda las últimas 500 noticias
✅ **Persistencia** - Si el bot falla, recupera todo al reiniciar

## 🔒 Cómo funcionan los permisos:

| Acción | Permiso | Frecuencia |
|--------|---------|-----------|
| Leer noticias del GitHub | repo | Al iniciar |
| Escribir en GitHub | repo | Cada 6 horas |
| Cambios locales | ninguno | Instantáneo (solo en RAM) |

## 📊 Estructura del archivo guardado

```json
{
  "noticias": [
    {
      "titulo": "Noticia importante",
      "enlace": "https://...",
      "categoria": "nacionales",
      "timestamp": "2026-03-29T15:30:00.000Z",
      "normalizado": "noticiaimportante"
    }
  ],
  "ultimaActualizacion": "2026-03-29T15:30:00.000Z",
  "totalEnCache": 245
}
```

## ⚠️ Solución de problemas

### Error: "404 - Not Found en GitHub"

Solución: Es normal en el primer inicio. El bot creará el archivo automáticamente.

### Error: "401 - Unauthorized"

Solución: Tu token tiene problemas. Verifica:
- El token está en `.env` sin espacios
- El token no está expirado
- Tiene permisos `repo`

### El bot no sube noticias a GitHub

Solución: Asegúrate de que `GITHUB_TOKEN` no sea `'tu_token_aqui'`

## 🚀 Verificar que funciona

1. Inicia el bot y mira la consola
2. Busca: `✅ Cargadas X noticias desde GitHub`
3. Espera 6 horas o modifica `TIEMPO_SYNC_GITHUB` en index.js para testear
4. Verifica en tu repo: https://github.com/tuusuario/tequenobot-news/blob/main/noticias-guardadas.json

¡Listo! Tu bot ahora tiene memoria infinita en GitHub ☁️
