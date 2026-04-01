require('dotenv').config(); // Cargar variables de entorno desde .env
const { Telegraf } = require('telegraf');
const axios = require('axios');

// --- TUS CREDENCIALES ---
const bot = new Telegraf('8750024177:AAHY47OotTS-PbDj_WhKfvQPfOa_1NHPYSY'); 
const miChatId = '8459999354'; 

let preciosDolarAnterior = { bcv: null, paralelo: null };

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
    console.log("║   🫓 TEQUEÑO BOT v3.0 - VIDEOS        ║");
    console.log("║   Enfocado en Videos                  ║");
    console.log("╚════════════════════════════════════════╝");
    console.log(`⏰ ${new Date().toLocaleTimeString('es-VE')}`);
    console.log("✅ Bot activo...");
}

// ===== EJECUCIÓN =====
async function iniciar() {
    console.log('🚀 Iniciando TequeñoBot...');
    
    renderSimple();
    setInterval(renderSimple, 10000);

    // Programar reportes de dólar
    programarHorarios();

    console.log('✅ Bot iniciado correctamente');
}

iniciar().catch(e => console.error('Error al iniciar:', e.message));
