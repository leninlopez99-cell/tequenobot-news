require('dotenv').config(); // Cargar variables de entorno desde .env
const { Telegraf } = require('telegraf');
const RSSParser = require('rss-parser');
const axios = require('axios');
const parser = new RSSParser();

// --- TUS CREDENCIALES ---
const bot = new Telegraf('8750024177:AAHY47OotTS-PbDj_WhKfvQPfOa_1NHPYSY'); 
const miChatId = '8459999354'; 

// ===== CONFIGURACIÓN DE GITHUB =====
const GITHUB_TOKEN = process.env.GITHUB_TOKEN || 'tu_token_aqui'; // Configura en tu terminal
const GITHUB_REPO = 'tequenobot-news'; // Nombre del repo en GitHub
const GITHUB_USER = 'leninlopez99-cell'; // Tu usuario en GitHub
const GITHUB_BRANCH = 'main';
const ARCHIVO_NOTICIAS = 'noticias-guardadas.json';
const MAX_NOTICIAS_GUARDADAS = 500;
const TIEMPO_SYNC_GITHUB = 6 * 60 * 60 * 1000; // 6 horas 

// ===== CONFIGURACIÓN DE FUENTES POR CATEGORÍA =====
const fuentesConfig = {
    nacionales: [
        { url: 'https://efectococuyo.com/feed/', peso: 1.0, icono: '🇻🇪' },
        { url: 'https://monitoreamos.com/feed/', peso: 1.0, icono: '⚡' },
        { url: 'https://elestimulo.com/feed/', peso: 1.0, icono: '💡' },
        { url: 'https://elpitazo.net/feed/', peso: 0.9, icono: '🎯' },
        { url: 'https://talcual.com/feed/', peso: 0.8, icono: '📰' },
        { url: 'https://albertonews.com/feed/', peso: 0.8, icono: '📡' }
    ],
    economia: [
        { url: 'https://www.bancaynegocios.com/feed/', peso: 1.0, icono: '💰' },
        { url: 'https://finanzasdigital.com/feed/', peso: 1.0, icono: '📊' }
    ],
    internacional: [
        { url: 'https://www.diariolasamericas.com/feed/', peso: 0.5, icono: '🌎' }
    ],
    deportes: [
        { url: 'https://www.meridiano.net/feed/', peso: 0.7, icono: '⚽' },
        { url: 'https://www.lavinotinto.com/feed/', peso: 0.7, icono: '🏟️' }
    ],
    loteria: [
        { url: 'https://www.tuazar.com/feed/', peso: 0.9, icono: '🎰' },
        { url: 'https://tripletachira.com/feed/', peso: 0.9, icono: '💎' },
        { url: 'https://granjamillonaria.com/feed/', peso: 0.9, icono: '🎲' }
    ]
};

// Palabras clave para priorizar
const palabrasInteresantes = ['Urgente', 'Atención', 'Dólar', 'BCV', 'resultados', 'final', 'crisis', 'emergencia'];
const palabrasIgnorar = ['Publicidad', 'Promoción', 'Anuncio', 'Patrocinio', 'Comercial'];

// ===== SISTEMA DE CACHÉ LOCAL + GITHUB =====
let noticiasEnCache = new Set(); // Memoria rápida local
let noticiasCompletas = []; // Array con detalles de noticias para sincronizar
let preciosDolarAnterior = { bcv: null, paralelo: null };

// ===== FUNCIONES DE GITHUB =====
async function obtenerNoticiasDeGitHub() {
    try {
        const url = `https://api.github.com/repos/${GITHUB_USER}/${GITHUB_REPO}/contents/${ARCHIVO_NOTICIAS}?ref=${GITHUB_BRANCH}`;
        const response = await axios.get(url, {
            headers: { 
                'Authorization': `Bearer ${GITHUB_TOKEN}`,
                'Accept': 'application/vnd.github.v3.raw'
            },
            timeout: 5000
        });
        
        const datos = typeof response.data === 'string' ? JSON.parse(response.data) : response.data;
        
        // Cargar en caché local
        if (datos.noticias && Array.isArray(datos.noticias)) {
            datos.noticias.forEach(n => {
                noticiasEnCache.add(normalizarTexto(n.titulo));
            });
            noticiasCompletas = datos.noticias;
            console.log(`✅ Cargadas ${datos.noticias.length} noticias desde GitHub`);
        }
        
        return datos;
    } catch (e) {
        if (e.response?.status === 404) {
            console.log('📝 Primer inicio: creando archivo en GitHub');
            return { noticias: [] };
        }
        console.log('⚠️ No se pudo conectar con GitHub (continuando con caché local)');
        return { noticias: [] };
    }
}

async function sincronizarNoticiasAGitHub() {
    try {
        if (GITHUB_TOKEN === 'tu_token_aqui') {
            console.log('⚠️ Token de GitHub no configurado. Configurado solo caché local.');
            return;
        }

        // Mantener solo las últimas MAX_NOTICIAS_GUARDADAS
        if (noticiasCompletas.length > MAX_NOTICIAS_GUARDADAS) {
            noticiasCompletas = noticiasCompletas.slice(-MAX_NOTICIAS_GUARDADAS);
        }

        const data = {
            noticias: noticiasCompletas,
            ultimaActualizacion: new Date().toISOString(),
            totalEnCache: noticiasEnCache.size
        };

        const contenido = Buffer.from(JSON.stringify(data, null, 2)).toString('base64');
        
        // Primero intentar obtener el SHA del archivo existente
        let sha = null;
        try {
            const getUrl = `https://api.github.com/repos/${GITHUB_USER}/${GITHUB_REPO}/contents/${ARCHIVO_NOTICIAS}?ref=${GITHUB_BRANCH}`;
            const getResponse = await axios.get(getUrl, {
                headers: { 'Authorization': `Bearer ${GITHUB_TOKEN}` }
            });
            sha = getResponse.data.sha;
        } catch (e) {
            // Archivo no existe aún, se creará nuevo
        }

        const url = `https://api.github.com/repos/${GITHUB_USER}/${GITHUB_REPO}/contents/${ARCHIVO_NOTICIAS}`;
        const payload = {
            message: `Sync noticias: ${new Date().toISOString()}`,
            content: contenido,
            branch: GITHUB_BRANCH
        };

        if (sha) {
            payload.sha = sha;
        }

        const response = await axios.put(url, payload, {
            headers: { 'Authorization': `Bearer ${GITHUB_TOKEN}` },
            timeout: 10000
        });

        console.log(`💾 Sincronizadas ${noticiasCompletas.length} noticias a GitHub`);
        return response.data;
    } catch (e) {
        console.log('❌ Error sincronizando con GitHub:', e.message);
    }
}

function normalizarTexto(texto) {
    return texto.toLowerCase().trim()
        .replace(/\s+/g, ' ')
        .replace(/[^\w\s]/g, '');
}

function yaFueEnviada(titulo) {
    const normalizado = normalizarTexto(titulo);
    return noticiasEnCache.has(normalizado);
}

function marcarEnviada(titulo, enlace, categoria) {
    const normalizado = normalizarTexto(titulo);
    noticiasEnCache.add(normalizado);
    
    // Guardar en array completo con timestamp
    noticiasCompletas.push({
        titulo,
        enlace,
        categoria,
        timestamp: new Date().toISOString(),
        normalizado
    });
    
    // Mantener límite
    if (noticiasCompletas.length > MAX_NOTICIAS_GUARDADAS * 1.5) {
        noticiasCompletas = noticiasCompletas.slice(-MAX_NOTICIAS_GUARDADAS);
    }
}

// ===== LIMPIEZA DE NOTICIAS =====
function limpiarTitulo(titulo) {
    return titulo
        .replace(/\[.*?\]/g, '')
        .replace(/#\w+/g, '')
        .replace(/\d{5,}/g, '')
        .trim();
}

function debePublicarse(titulo) {
    // Ignorar si tiene palabras bloqueadas
    if (palabrasIgnorar.some(palabra => titulo.includes(palabra))) {
        return false;
    }
    // Debe tener longitud mínima
    if (titulo.length < 15) {
        return false;
    }
    return true;
}

// ===== OBTENER PRECIO DEL DÓLAR =====
async function obtenerPrecioDolar() {
    try {
        const response = await axios.get('https://ve.dolartoday.com/', {
            headers: { 'User-Agent': 'Mozilla/5.0' },
            timeout: 5000
        });
        
        const html = response.data;
        const bcvMatch = html.match(/BCV["\']?\s*:\s*["\']([\d.,]+)/i);
        const paraleloMatch = html.match(/Paralelo["\']?\s*:\s*["\']([\d.,]+)/i);
        
        return {
            bcv: bcvMatch ? bcvMatch[1] : 'N/A',
            paralelo: paraleloMatch ? paraleloMatch[1] : 'N/A',
            fecha: new Date().toLocaleString('es-VE')
        };
    } catch (e) {
        console.log('Error obteniendo precio del dólar:', e.message);
        return { bcv: 'N/A', paralelo: 'N/A', fecha: new Date().toLocaleString('es-VE') };
    }
}

// ===== PROCESAR NOTICIAS POR CATEGORÍA =====
async function procesarNoticiasCategoria(categoria, fuentes) {
    const noticiasProcesadas = [];
    
    for (const fuente of fuentes) {
        try {
            const feed = await parser.parseURL(fuente.url);
            if (!feed.items || feed.items.length === 0) continue;
            
            for (const item of feed.items.slice(0, 5)) {
                let titulo = item.title || '';
                titulo = limpiarTitulo(titulo);
                
                if (!debePublicarse(titulo) || yaFueEnviada(titulo)) continue;
                
                // Calcular relevancia
                let relevancia = fuente.peso;
                if (palabrasInteresantes.some(palabra => titulo.toUpperCase().includes(palabra.toUpperCase()))) {
                    relevancia *= 1.5;
                }
                
                noticiasProcesadas.push({
                    titulo,
                    enlace: item.link || '',
                    categoria,
                    relevancia,
                    icono: fuente.icono,
                    fuente: fuente.url
                });
            }
        } catch (e) {
            // Siguiente fuente
        }
    }
    
    return noticiasProcesadas;
}

// ===== ENVIAR NOTICIA FORMATEADA =====
async function enviarNoticia(noticia) {
    try {
        const mensaje = `${noticia.icono} *${noticia.categoria.toUpperCase()}*\n\n${noticia.titulo}\n\n[📌 Leer más](${noticia.enlace})`;
        await bot.telegram.sendMessage(miChatId, mensaje, { parse_mode: 'Markdown' });
        marcarEnviada(noticia.titulo, noticia.enlace, noticia.categoria);
        console.log(`✅ Noticia enviada: ${noticia.titulo.substring(0, 50)}`);
    } catch (e) {
        console.log('Error enviando noticia:', e.message);
    }
}

// ===== REPORTAR PRECIO DEL DÓLAR =====
async function reportarDolar() {
    try {
        const dolar = await obtenerPrecioDolar();
        
        // Calcular cambio porcentual si hay precio anterior
        let cambio = '';
        if (preciosDolarAnterior.paralelo && dolar.paralelo !== 'N/A') {
            const anterior = parseFloat(preciosDolarAnterior.paralelo.replace(',', '.'));
            const actual = parseFloat(dolar.paralelo.replace(',', '.'));
            const porcentaje = ((actual - anterior) / anterior * 100).toFixed(2);
            cambio = porcentaje > 0 ? `📈 +${porcentaje}%` : `📉 ${porcentaje}%`;
        }
        
        const mensaje = `💸 *REPORTE DE DÓLAR VENEZUELA* 💸\n\n` +
                       `📍 *BCV:* ${dolar.bcv} Bs/USD\n` +
                       `📈 *Paralelo:* ${dolar.paralelo} Bs/USD\n` +
                       (cambio ? `${cambio}\n\n` : '') +
                       `🕐 Actualizado: ${dolar.fecha}`;
        
        await bot.telegram.sendMessage(miChatId, mensaje, { parse_mode: 'Markdown' });
        
        // Guardar precio actual
        preciosDolarAnterior = dolar;
        console.log(`💰 Reporte de dólar enviado: BCV ${dolar.bcv} | Paralelo ${dolar.paralelo}`);
    } catch (e) {
        console.log('Error reportando dólar:', e.message);
    }
}

// ===== FUNCIÓN PRINCIPAL DE ESCANEO =====
async function procesarNoticias() {
    try {
        const todasNoticias = [];
        
        for (const [categoria, fuentes] of Object.entries(fuentesConfig)) {
            const noticias = await procesarNoticiasCategoria(categoria, fuentes);
            todasNoticias.push(...noticias);
        }
        
        // Ordenar por relevancia
        todasNoticias.sort((a, b) => b.relevancia - a.relevancia);
        
        // Enviar las 2-3 mejores noticias por ciclo
        const cantidad = Math.min(2, todasNoticias.length);
        for (let i = 0; i < cantidad; i++) {
            await enviarNoticia(todasNoticias[i]);
            await new Promise(resolve => setTimeout(resolve, 2000)); // Esperar 2s entre mensajes
        }
    } catch (e) {
        console.log('Error en procesarNoticias:', e.message);
    }
}

// ===== FUNCIÓN DE HORARIOS (9:00 AM y 1:00 PM) =====
function programarHorarios() {
    function calcularProximaEjecucion(hora, minuto) {
        const ahora = new Date();
        const proxima = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate(), hora, minuto, 0);
        
        if (ahora > proxima) {
            proxima.setDate(proxima.getDate() + 1);
        }
        
        return proxima.getTime() - ahora.getTime();
    }
    
    function programarReportes() {
        // Calcular tiempo hasta 9:00 AM
        const tiempo9AM = calcularProximaEjecucion(9, 0);
        setTimeout(() => {
            console.log('📢 Enviando reporte de dólar (9:00 AM)');
            reportarDolar();
            programarReportes(); // Reprogramar después de ejecutar
        }, tiempo9AM);
        
        // Calcular tiempo hasta 1:00 PM
        const tiempo1PM = calcularProximaEjecucion(13, 0);
        setTimeout(() => {
            console.log('📢 Enviando reporte de dólar (1:00 PM)');
            reportarDolar();
        }, tiempo1PM);
    }
    
    // Ejecutar reportarDolar ahora
    reportarDolar();
    
    // Programar para hoy/mañana
    programarReportes();
    
    console.log('⏰ Horarios configurados: 9:00 AM y 1:00 PM');
}

// ===== RENDERIZADO EN CONSOLA =====
function renderSimple() {
    console.clear();
    console.log("╔════════════════════════════════════════╗");
    console.log("║   🫓 TEQUEÑO NEWS BOT v3.0 GITHUB     ║");
    console.log("║   Con Memoria en GitHub               ║");
    console.log("╚════════════════════════════════════════╝");
    console.log(`📰 Noticias en caché: ${noticiasEnCache.size}`);
    console.log(`💾 Guardadas en archivo: ${noticiasCompletas.length}`);
    console.log(`⏰ ${new Date().toLocaleTimeString('es-VE')}`);
    console.log("✅ Bot activo escaneando todas las categorías...");
    console.log("🔄 Sincronización con GitHub cada 6 horas");
}

// ===== EJECUCIÓN =====
async function iniciar() {
    console.log('🚀 Iniciando TequeñoBot con GitHub...');
    
    // Cargar noticias desde GitHub en caché
    await obtenerNoticiasDeGitHub();
    
    renderSimple();
    setInterval(renderSimple, 10000);

    // Comenzar a escanear noticias
    procesarNoticias();
    setInterval(procesarNoticias, 300000); // Cada 5 minutos

    // Programar reportes de dólar
    programarHorarios();
    
    // Sincronizar con GitHub cada 6 horas
    setInterval(sincronizarNoticiasAGitHub, TIEMPO_SYNC_GITHUB);
    
    // Sincronizar también al iniciar
    setTimeout(() => sincronizarNoticiasAGitHub(), 30000);

    console.log('✅ Bot iniciado correctamente');
}

iniciar().catch(e => console.error('Error al iniciar:', e.message));
