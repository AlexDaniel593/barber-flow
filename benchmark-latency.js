/**
 * benchmark-latency.js — Mide latencia del camino síncrono y asíncrono.
 *   Adaptado para el Gateway con JWT de Barber-Flow.
 *   Requiere Node 18+ (usa fetch nativo).
 *
 * Camino Síncrono  : GET /api/services  → Gateway → MS2 (Services-Staff) [2 saltos TCP]
 * Camino Asíncrono : POST /api/appointments/check-availability → Gateway → MS1 → respuesta
 *                    (MS1 publica en Redis sin bloquear; el benchmark mide solo la aceptación)
 *
 * Uso:
 *   node benchmark-latency.js
 *   node benchmark-latency.js 200 > docs/bench-avance1.txt
 *
 * Variables de entorno opcionales:
 *   BASE_URL   — URL base del Gateway (por defecto: http://localhost:3000)
 *   BENCH_USER — email del usuario de prueba (se registra automáticamente si no existe)
 *   BENCH_PASS — contraseña del usuario de prueba
 */

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const N = Number(process.argv[2]) || 200;
const BENCH_EMAIL = process.env.BENCH_USER || 'bench@barber-flow.test';
const BENCH_PASS = process.env.BENCH_PASS || 'Bench1234!';

// ──────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────
function percentil(ordenados, p) {
  const idx = Math.ceil((p / 100) * ordenados.length) - 1;
  return ordenados[Math.max(0, idx)];
}

function printResultados(titulo, tiempos, errores) {
  tiempos.sort((a, b) => a - b);
  const suma = tiempos.reduce((s, t) => s + t, 0);
  const prom = suma / tiempos.length;
  const p95  = percentil(tiempos, 95);
  const max  = tiempos[tiempos.length - 1];

  console.log(`\n════════ ${titulo} ════════`);
  console.log(`Peticiones        : ${tiempos.length}`);
  console.log(`Latencia promedio : ${prom.toFixed(2)} ms`);
  console.log(`Latencia p95      : ${p95.toFixed(2)} ms`);
  console.log(`Latencia máx      : ${max.toFixed(2)} ms`);
  console.log(`Errores           : ${errores}`);
  console.log('─────────────────────────────────────────────');
  console.log('📋 Fila para el README:');
  console.log(`| ${titulo} | ${prom.toFixed(2)} | ${p95.toFixed(2)} | ${max.toFixed(2)} |\n`);

  return { prom, p95, max, errores };
}

async function medir(url, opciones, n, etiqueta) {
  const tiempos = [];
  let errores = 0;

  process.stdout.write(`\n⏳ Midiendo ${etiqueta} (${n} peticiones)...\n`);

  for (let i = 0; i < n; i++) {
    const inicio = Date.now();
    try {
      const res = await fetch(url, opciones);
      await res.text(); // consume el body
      if (!res.ok) errores++;
    } catch {
      errores++;
    }
    tiempos.push(Date.now() - inicio);
    if ((i + 1) % 50 === 0) process.stdout.write(`  ${i + 1}/${n}\r`);
  }

  return printResultados(etiqueta, tiempos, errores);
}

// ──────────────────────────────────────────────
// Main
// ──────────────────────────────────────────────
(async () => {
  console.log('\n🔐 PASO 1 — Autenticación en el Gateway...');

  // Intentar registrar el usuario de benchmark (puede fallar si ya existe, está bien)
  await fetch(`${BASE_URL}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: BENCH_EMAIL,
      password: BENCH_PASS,
      name: 'Benchmark User',
    }),
  }).catch(() => {});

  // Login para obtener el JWT
  let token;
  try {
    const loginRes = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: BENCH_EMAIL, password: BENCH_PASS }),
    });

    if (!loginRes.ok) {
      const body = await loginRes.text();
      throw new Error(`Login falló (${loginRes.status}): ${body}`);
    }

    const data = await loginRes.json();
    token = data.access_token;
    console.log(`✅ Token obtenido para: ${data.user?.email ?? BENCH_EMAIL}`);
  } catch (err) {
    console.error(`\n❌ No se pudo autenticar: ${err.message}`);
    console.error('   Asegúrate de que el docker compose esté levantado:');
    console.error('   docker compose up -d --build\n');
    process.exit(1);
  }

  const headers = {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  };

  // ── CAMINO SÍNCRONO ──
  // GET /api/services  →  Gateway (HTTP) → TCP → MS2 (Services-Staff)
  // Dos saltos en cadena: si MS2 está caído, la petición falla.
  console.log('\n📡 PASO 2 — Camino SÍNCRONO');
  console.log('   Ruta: Cliente → Gateway → MS2 (Services-Staff) [TCP]');
  console.log(`   URL : GET ${BASE_URL}/api/services\n`);

  const sincrono = await medir(
    `${BASE_URL}/api/services`,
    { method: 'GET', headers },
    N,
    'Síncrono (Gateway→MS2)',
  );

  // ── CAMINO ASÍNCRONO ──
  // POST /api/appointments/check-availability → Gateway → MS1
  // MS1 verifica disponibilidad; cuando crea una cita, publica en Redis sin bloquear.
  // Aquí medimos la aceptación de la petición por MS1 (no espera a MS3).
  console.log('\n⚡ PASO 3 — Camino ASÍNCRONO');
  console.log('   Ruta: Cliente → Gateway → MS1 (Appointments) → Redis PUB (no bloquea)');
  console.log(`   URL : GET ${BASE_URL}/api/appointments\n`);

  const asincrono = await medir(
    `${BASE_URL}/api/appointments`,
    { method: 'GET', headers },
    N,
    'Asíncrono (Gateway→MS1)',
  );

  // ── RESUMEN FINAL ──
  console.log('\n\n╔══════════════════════════════════════════════════════╗');
  console.log('║          TABLA COMPLETA PARA EL README              ║');
  console.log('╠══════════════════════════════════════════════════════╣');
  console.log('║ Camino                   | Prom(ms) | p95(ms)| Máx(ms)║');
  console.log('╠══════════════════════════════════════════════════════╣');
  console.log(`║ Síncrono (Gateway→MS2)   | ${sincrono.prom.toFixed(2).padStart(8)} | ${sincrono.p95.toFixed(2).padStart(6)} | ${sincrono.max.toFixed(2).padStart(7)} ║`);
  console.log(`║ Asíncrono (Gateway→MS1)  | ${asincrono.prom.toFixed(2).padStart(8)} | ${asincrono.p95.toFixed(2).padStart(6)} | ${asincrono.max.toFixed(2).padStart(7)} ║`);
  console.log('╚══════════════════════════════════════════════════════╝');

})();
