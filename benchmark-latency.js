/**
 * benchmark-latency.js — Mide latencia de los caminos síncrono y asíncrono.
 *   Adaptado para el Gateway con JWT de Barber-Flow.
 *   Requiere Node 18+ (usa fetch nativo).
 *
 * Caminos medidos:
 *   1. Síncrono          : GET  /api/services           → Gateway → MS2 (1 salto TCP)
 *   2. Completar cita     : PATCH /api/appointments/{id}/status → Gateway → MS1 → Redis PUB
 *                                                         (dispara evento appointment.completed genuino)
 *   3. Facturación        : POST /api/invoices           → Gateway → MS3 → MS2 (2 saltos TCP)
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

async function medir(method, url, headers, body, n, etiqueta) {
  const tiempos = [];
  let errores = 0;

  const opciones = { method, headers };
  if (body) opciones.body = JSON.stringify(body);

  process.stdout.write(`\n⏳ Midiendo ${etiqueta} (${n} peticiones)...\n`);

  for (let i = 0; i < n; i++) {
    const inicio = Date.now();
    try {
      const res = await fetch(url, opciones);
      await res.text();
      if (!res.ok) errores++;
    } catch {
      errores++;
    }
    tiempos.push(Date.now() - inicio);
    if ((i + 1) % 50 === 0) process.stdout.write(`  ${i + 1}/${n}\r`);
  }

  return printResultados(etiqueta, tiempos, errores);
}

async function medirPatchStatus(appointmentIds, headers, n, etiqueta) {
  const tiempos = [];
  let errores = 0;

  process.stdout.write(`\n⏳ Midiendo ${etiqueta} (${n} peticiones)...\n`);

  for (let i = 0; i < n; i++) {
    const inicio = Date.now();
    try {
      const res = await fetch(`${BASE_URL}/api/appointments/${appointmentIds[i]}/status`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({ status: 'COMPLETED', notes: 'Benchmark' }),
      });
      await res.text();
      if (!res.ok) errores++;
    } catch {
      errores++;
    }
    tiempos.push(Date.now() - inicio);
    if ((i + 1) % 50 === 0) process.stdout.write(`  ${i + 1}/${n}\r`);
  }

  return printResultados(etiqueta, tiempos, errores);
}

async function medirCreateInvoice(appointmentIds, stylistId, headers, n, etiqueta) {
  const tiempos = [];
  let errores = 0;

  process.stdout.write(`\n⏳ Midiendo ${etiqueta} (${n} peticiones)...\n`);

  for (let i = 0; i < n; i++) {
    const inicio = Date.now();
    try {
      const res = await fetch(`${BASE_URL}/api/invoices`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          appointmentId: appointmentIds[n + i],
          stylistId,
          items: [
            { description: 'Corte Benchmark', quantity: 1, unitPrice: 25.00, total: 25.00 },
          ],
          paymentMethod: 'cash',
        }),
      });
      await res.text();
      if (!res.ok) errores++;
    } catch {
      errores++;
    }
    tiempos.push(Date.now() - inicio);
    if ((i + 1) % 50 === 0) process.stdout.write(`  ${i + 1}/${n}\r`);
  }

  return printResultados(etiqueta, tiempos, errores);
}

async function setupTestData(headers) {
  const totalNeeded = 2 * N;

  console.log('\n📦 PASO 2 — Creando datos de prueba...');
  console.log(`   Serán necesarias ${totalNeeded} citas (${N} para completar + ${N} para facturar).`);

  // Crear estilista
  const stylistRes = await fetch(`${BASE_URL}/api/stylists`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      name: 'Benchmark Stylist',
      email: `stylist.bench.${Date.now()}@test.com`,
      phone: '0999999999',
      specialties: ['Corte'],
      workingHours: { monday: '09:00-18:00' },
    }),
  });
  if (!stylistRes.ok) {
    const text = await stylistRes.text();
    throw new Error(`Error creando estilista (${stylistRes.status}): ${text}`);
  }
  const stylist = await stylistRes.json();
  console.log(`   ✅ Estilista creado: ${stylist.id}`);

  // Crear servicio
  const serviceRes = await fetch(`${BASE_URL}/api/services`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      name: 'Benchmark Service',
      price: 25.00,
      duration: 30,
      category: 'Corte',
    }),
  });
  if (!serviceRes.ok) {
    const text = await serviceRes.text();
    throw new Error(`Error creando servicio (${serviceRes.status}): ${text}`);
  }
  const service = await serviceRes.json();
  console.log(`   ✅ Servicio creado: ${service.id}`);

  // Crear citas
  const appointmentIds = [];
  for (let i = 0; i < totalNeeded; i++) {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(10 + Math.floor(i / 8), (i % 8) * 15, 0, 0);

    const aptRes = await fetch(`${BASE_URL}/api/appointments`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        clientName: `Bench Client ${i}`,
        clientPhone: '0999000000',
        clientEmail: `bench.client.${i}@test.com`,
        stylistId: stylist.id,
        serviceId: service.id,
        startTime: tomorrow.toISOString(),
        duration: 30,
      }),
    });
    if (!aptRes.ok) {
      const text = await aptRes.text();
      console.error(`   ❌ Error creando cita ${i}: ${aptRes.status} ${text}`);
      throw new Error(`Setup falló en cita ${i}`);
    }
    const apt = await aptRes.json();
    appointmentIds.push(apt.id);

    if ((i + 1) % 50 === 0 || i === totalNeeded - 1) {
      process.stdout.write(`   Progreso: ${i + 1}/${totalNeeded} citas creadas\r`);
    }
  }
  console.log(`\n   ✅ ${totalNeeded} citas creadas exitosamente`);

  return { stylistId: stylist.id, appointmentIds };
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

  // ── CREAR DATOS DE PRUEBA ──
  const { stylistId, appointmentIds } = await setupTestData(headers);

  // ── 1. CAMINO SÍNCRONO ──
  // GET /api/services  →  Gateway (HTTP) → TCP → MS2 (Services-Staff)
  // Un salto en cadena: si MS2 está caído, la petición falla.
  console.log('\n📡 PASO 3 — Camino SÍNCRONO');
  console.log('   Ruta: Cliente → Gateway → MS2 (Services-Staff) [1 salto TCP]');
  console.log(`   URL : GET ${BASE_URL}/api/services\n`);

  const sincrono = await medir(
    'GET', `${BASE_URL}/api/services`,
    headers, null, N,
    'Síncrono (Gateway→MS2)',
  );

  // ── 2. EVENTO appointment.completed GENUINO ──
  // PATCH /api/appointments/{id}/status → Gateway → MS1 → Redis PUB
  // MS1 publica el evento "appointment.completed" en Redis y responde sin esperar a MS3.
  console.log('\n⚡ PASO 4 — Evento appointment.completed genuino');
  console.log('   Ruta: Cliente → Gateway → MS1 (Appointments) → Redis PUB');
  console.log(`   URL : PATCH ${BASE_URL}/api/appointments/{id}/status  (status=COMPLETED)\n`);

  const completar = await medirPatchStatus(
    appointmentIds, headers, N,
    'Completar cita (Gateway→MS1→Redis)',
  );

  // ── 3. CADENA REAL DE FACTURACIÓN ──
  // POST /api/invoices → Gateway (HTTP) → MS3 (TCP) → MS2 (TCP, validar estilista)
  // Dos saltos síncronos en cadena: si MS2 está caído, la facturación falla.
  console.log('\n💰 PASO 5 — Cadena real de facturación');
  console.log('   Ruta: Cliente → Gateway → MS3 (Inventory-Billing) → MS2 (Services-Staff)');
  console.log('   [2 saltos TCP: Gateway→MS3 y MS3→MS2 para validar estilista]');
  console.log(`   URL : POST ${BASE_URL}/api/invoices\n`);

  const facturacion = await medirCreateInvoice(
    appointmentIds, stylistId, headers, N,
    'Facturación (Gateway→MS3→MS2)',
  );

  // ── RESUMEN FINAL ──
  console.log('\n\n╔══════════════════════════════════════════════════════════╗');
  console.log('║            TABLA COMPLETA PARA EL README                ║');
  console.log('╠══════════════════════════════════════════════════════════╣');
  console.log('║ Camino                       | Prom(ms) | p95(ms)| Máx(ms)║');
  console.log('╠══════════════════════════════════════════════════════════╣');
  console.log(`║ Síncrono (Gateway→MS2)       | ${sincrono.prom.toFixed(2).padStart(8)} | ${sincrono.p95.toFixed(2).padStart(6)} | ${sincrono.max.toFixed(2).padStart(7)} ║`);
  console.log(`║ Completar cita (Gateway→MS1) | ${completar.prom.toFixed(2).padStart(8)} | ${completar.p95.toFixed(2).padStart(6)} | ${completar.max.toFixed(2).padStart(7)} ║`);
  console.log(`║ Facturación (Gateway→MS3→MS2)| ${facturacion.prom.toFixed(2).padStart(8)} | ${facturacion.p95.toFixed(2).padStart(6)} | ${facturacion.max.toFixed(2).padStart(7)} ║`);
  console.log('╚══════════════════════════════════════════════════════════╝');

})();
