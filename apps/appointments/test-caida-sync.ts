import { ClientProxyFactory, Transport } from '@nestjs/microservices';

async function run() {
    // Conectamos al MS1 (Citas), MS2 (Servicios/Estilistas) y MS3 (Facturación)
    const ms1 = ClientProxyFactory.create({
        transport: Transport.TCP,
        options: { host: '127.0.0.1', port: 3001 },
    });
    const ms2 = ClientProxyFactory.create({
        transport: Transport.TCP,
        options: { host: '127.0.0.1', port: 3002 },
    });
    const ms3 = ClientProxyFactory.create({
        transport: Transport.TCP,
        options: { host: '127.0.0.1', port: 3003 },
    });

    await ms1.connect();
    await ms2.connect();
    await ms3.connect();
    console.log('Conectado a MS1 (Citas), MS2 (Servicios) y MS3 (Facturación)');

    // ── FASE 1: Crear datos de prueba (MS2 debe estar encendido) ──
    console.log('\n📦 FASE 1 — Creando datos de prueba...');

    const stylist = await ms2.send({ cmd: 'stylists.create' }, {
        name: 'Prueba Caida Sync',
        email: `caida.sync.${Date.now()}@test.com`,
        phone: '0900000002',
        specialties: ['Corte'],
        workingHours: { wednesday: '09:00-18:00', thursday: '09:00-18:00', friday: '09:00-18:00' },
    }).toPromise();
    console.log(`   ✅ Estilista creado: ${stylist.name} (${stylist.id})`);

    const service = await ms2.send({ cmd: 'services.create' }, {
        name: 'Corte Caida Sync Test',
        price: 15.00,
        duration: 30,
        category: 'Corte',
    }).toPromise();
    console.log(`   ✅ Servicio creado: ${service.name} (${service.id})`);

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(10, 0, 0, 0);

    const cita = await ms1.send({ cmd: 'appointments.create' }, {
        clientName: 'Cliente Prueba Caida Sync',
        clientPhone: '0999000001',
        clientEmail: 'prueba.caida.sync@test.com',
        stylistId: stylist.id,
        serviceId: service.id,
        startTime: tomorrow.toISOString(),
        duration: 30,
    }).toPromise();
    console.log(`   ✅ Cita creada: ${cita.id} (${cita.status})\n`);

    // ── FASE 2: Apagar MS2 y probar facturación ──
    console.log('🔌 FASE 2 — Prueba de acoplamiento temporal (cadena SÍNCRONA)');
    console.log('   ⚠️  Instrucciones: Apaga MS2 (Services-Staff) en otra terminal:');
    console.log('   └─ docker stop ms-services-staff');
    console.log('\n   Presiona ENTER después de apagar MS2 para continuar...');
    await new Promise<void>((resolve) => {
        process.stdin.once('data', () => resolve());
    });

    console.log('\n⏳ Intentando crear factura desde MS3 (que depende de MS2)...');
    console.log('   Ruta: MS3 → MS2 (TCP) → validar estilista\n');

    try {
        const factura = await ms3.send({ cmd: 'invoices.create' }, {
            appointmentId: cita.id,
            stylistId: stylist.id,
            items: [
                { description: 'Corte de prueba', quantity: 1, unitPrice: 15.00, total: 15.00 },
            ],
            paymentMethod: 'cash',
        }).toPromise();

        console.log('❌ ERROR INESPERADO: La factura se creó exitosamente.');
        console.log(`   Esto NO debería pasar con MS2 apagado. Factura: ${JSON.stringify(factura)}`);
    } catch (error: any) {
        console.log('¡RESULTADO ESPERADO! La facturación FALLÓ al no poder contactar a MS2.');
        console.log(`   Error: ${error.message}`);
        console.log('\nCONCLUSIÓN: La cadena SÍNCRONA (MS3 → MS2) SÍ tiene acoplamiento temporal.');
        console.log('   MS3 necesita validar el estilista contra MS2 en tiempo real.');
        console.log('   Si MS2 (Services-Staff) está caído, la facturación no puede completarse.\n');
    }

    // ── FASE 3: Restaurar MS2 y verificar que funciona ──
    console.log('🔌 FASE 3 — Restaurar MS2 y verificar recuperación');
    console.log('   Levanta MS2 nuevamente:');
    console.log('   └─ docker start ms-services-staff');
    console.log('\n   Presiona ENTER después de iniciar MS2 para verificar...');
    await new Promise<void>((resolve) => {
        process.stdin.once('data', () => resolve());
    });

    try {
        const factura = await ms3.send({ cmd: 'invoices.create' }, {
            appointmentId: cita.id,
            stylistId: stylist.id,
            items: [
                { description: 'Corte de prueba', quantity: 1, unitPrice: 15.00, total: 15.00 },
            ],
            paymentMethod: 'cash',
        }).toPromise();

        console.log('\n✅ RECUPERACIÓN EXITOSA: MS3 pudo facturar con MS2 restaurado.');
        console.log(`   Factura ID: ${factura.id}, Total: $${factura.total}`);
        console.log('\nCONCLUSIÓN FINAL: Cuando MS2 está disponible, la cadena síncrona funciona.');
        console.log('   Esto confirma que el acoplamiento temporal es real:');
        console.log('   si MS2 cae, la facturación falla; si MS2 vuelve, la facturación funciona.\n');
    } catch (error: any) {
        console.log(`\n❌ La facturación sigue fallando: ${error.message}`);
        console.log('   Verifica que MS2 esté completamente levantado.\n');
    }

    ms1.close();
    ms2.close();
    ms3.close();
}

run();
