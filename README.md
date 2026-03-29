# 🫓 TEQUEÑO NEWS BOT v3.0 - Con Memoria en GitHub

Bot de Telegram que escanea noticias de Venezuela, reporta precios del dólar, deportes y lotería. **Ahora con GitHub como base de datos persistente** para nunca perder el historial de noticias.

## ✨ Características

### 📰 Noticias Inteligentes
- ✅ Múltiples categorías (Nacionales, Economía, Internacional, Deportes, Lotería)
- ✅ Filtrado automático de repetidas (con GitHub como memoria)
- ✅ Prioridad por palabras clave ("Urgente", "Dólar", "BCV", etc.)
- ✅ Limpieza automática de títulos (códigos, IDs, hashtags)

### 💸 Reporte de Dólar
- 📍 **9:00 AM** - Reporte BCV vs Paralelo
- 📍 **1:00 PM** - Actualización con cambio porcentual

### 🔄 Base de Datos en GitHub
- 📥 **Caché Local** - Memoria rápida (instantánea)
- 📤 **Sync a GitHub** - Cada 6 horas (eficiente, sin spam)
- 💾 **Persistencia** - Recupera historial al reiniciar
- 🧹 **Auto-cleanup** - Solo guarda últimas 500 noticias

## 🚀 Instalación Rápida

### Paso 1: Crear Repositorio GitHub

1. Ve a GitHub → New Repository
2. Nombre: `tequenobot-news`
3. Selecciona PÚBLICO
4. Click "Create repository"

### Paso 2: Generar Token

1. Ve a https://github.com/settings/tokens/new
2. Nombre: `TequenoBot`
3. Marca: `repo` (acceso completo)
4. Click "Generate token"
5. Copia el token (no lo pierdes, solo aparece una vez)

### Paso 3: Configurar Bot

```bash
cd /Users/teninlopez/tequenobot

# Copiar archivo de configuración
cp .env.example .env

# Editar .env y pegar tu token
nano .env
# Agrega: GITHUB_TOKEN=ghp_xxxxxxxxxx

# Instalar dependencias
npm install

# Iniciar bot
npm start
```

### Paso 4: Verificar Funcionamiento

Busca en la consola:
```
✅ Cargadas X noticias desde GitHub
✅ Noticia enviada: [título]
💾 Sincronizadas X noticias a GitHub
```

## 🔧 Configuración Avanzada

### Variables Editables en index.js

```javascript
const GITHUB_TOKEN = process.env.GITHUB_TOKEN || 'tu_token_aqui';
const GITHUB_REPO = 'tequenobot-news'; // Tu repo
const GITHUB_USER = 'tu_usuario'; // Tu usuario GitHub
const MAX_NOTICIAS_GUARDADAS = 500; // Historiales a guardar
const TIEMPO_SYNC_GITHUB = 6 * 60 * 60 * 1000; // Sincronizar cada 6h
```

### Fuentes de Noticias

Edita `fuentesConfig` para agregar más RSS:

```javascript
nacionales: [
    { url: 'https://fuente.com/feed/', peso: 1.0, icono: '🇻🇪' },
    // peso: importancia relativa
    // icono: emoji para Telegram
]
```

Weight system:
- `1.0` = máxima prioridad
- `0.5` = menor prioridad
- Se multiplica por 1.5 si tiene palabra clave

## 📊 Estructura de GitHub

Tu repositorio `tequenobot-news` tendrá:

```
tequenobot-news/
├── noticias-guardadas.json (creado automáticamente)
```

Contenido de `noticias-guardadas.json`:

```json
{
  "noticias": [
    {
      "titulo": "Venezuela anuncia...",
      "enlace": "https://...",
      "categoria": "nacionales",
      "timestamp": "2026-03-29T15:30:00.000Z"
    }
  ],
  "ultimaActualizacion": "2026-03-29T15:30:00.000Z",
  "totalEnCache": 245
}
```

## 🔒 Seguridad

### Token de GitHub

- ⚠️ **Nunca** commits el .env a Git
- ⚠️ **Nunca** pases tu token en terminal pública
- ✅ Guarda .env en `~/.bashrc` o `~/.zshrc` si lo necesitas globalmente

### Archivo .gitignore

```
.env
node_modules/
```

## 🛠️ Troubleshooting

| Problema | Solución |
|----------|----------|
| "404 - Not Found" | Normal en primer inicio, se crea automáticamente |
| "401 - Unauthorized" | Token incorrecto o expirado, regenera en GitHub |
| Bot no sube noticias | Verifica que GITHUB_TOKEN no sea 'tu_token_aqui' |
| Lentitud | Reduce `MAX_NOTICIAS_GUARDADAS` o incrementa `TIEMPO_SYNC_GITHUB` |

## 📈 Rendimiento

| Métrica | Valor |
|---------|-------|
| Escaneo de noticias | Cada 5 minutos |
| Sincronización GitHub | Cada 6 horas |
| Caché máximo | 500 noticias |
| Reportes de dólar | 9:00 AM + 1:00 PM |
| Latencia local | < 1s |
| Latencia GitHub | < 5s |

## 🎯 Casos de Uso

✅ Recuperación ante fallos - Reinicia el bot y recupera todo historial
✅ Análisis histórico - Revisa `noticias-guardadas.json` en GitHub
✅ Backups automáticos - Cada 6 horas tienes respaldo en la nube
✅ Sin Spam GitHub - Una sola escritura cada 6 horas

## 📝 Logs

El bot imprime en consola:
- ✅ Noticias exitosas
- ⚠️ Advertencias (fuentes no disponibles)
- ❌ Errores críticos
- 💾 Sincronizaciones con GitHub

## 🤝 Contribuciones

Para agregar nuevas fuentes RSS:

1. Busca el feed del sitio (usualmente en `/feed/` o `/rss/`)
2. Pruébalo en un navegador
3. Agrega a `fuentesConfig` en index.js
4. Reinicia el bot

## 📞 Soporte

Consulta `GITHUB_SETUP.md` para configuración detallada de GitHub.

---

**Made with ❤️ for tequeño.eth** 🫓
