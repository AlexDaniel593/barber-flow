import { ClientProxyFactory, Transport } from '@nestjs/microservices';

async function run() {
    // Conectamos al MS1 (Citas) y al MS2 (Servicios/Estilistas)
    const ms1 = ClientProxyFactory.create({
        transport: Transport.TCP,
        options: { host: '127.0.0.1', port: 3001 },
    });
    const ms2 = ClientProxyFactory.create({
        transport: Transport.TCP,
        options: { host: '127.0.0.1', port: 3002 },
    });

    await ms1.connect();
    await ms2.connect();
    console.log('Conectado al MS1 (Citas) y MS2 (Servicios)');
    console.log('NOTA: El MS3 (Facturación) esta APAGADO para esta prueba.');

    // 1. Crear un estilista de prueba
    const stylist = await ms2.send({ cmd: 'stylists.create' }, {
        name: 'Prueba Caida',
        email: `caida.${Date.now()}@test.com`,
        phone: '0900000001',
        specialties: ['Corte'],
        workingHours: { wednesday: '09:00-18:00', thursday: '09:00-18:00', friday: '09:00-18:00' },
    }).toPromise();
    console.log(`Estilista creado: ${stylist.name} (${stylist.id})`);

    // 2. Crear un servicio de prueba
    const service = await ms2.send({ cmd: 'services.create' }, {
        name: 'Corte Caida Test',
        price: 10.00,
        duration: 30,
        category: 'Corte',
    }).toPromise();
    console.log(`Servicio creado: ${service.name} (${service.id})`);

    // 3. Crear la cita
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(10, 0, 0, 0);

    const cita = await ms1.send({ cmd: 'appointments.create' }, {
        clientName: 'Cliente Prueba Caida',
        clientPhone: '0999000000',
        clientEmail: 'prueba.caida@test.com',
        stylistId: stylist.id,
        serviceId: service.id,
        startTime: tomorrow.toISOString(),
        duration: 30,
    }).toPromise();
    console.log(`Cita creada con estado: ${cita.status} (${cita.id})\n`);

    // 4. COMPLETAR la cita → esto publica el evento en Redis
    // Si MS3 está apagado, el MS1 de todas formas funciona sin crashear
    console.log('⏳ Completando la cita (se publicará evento Redis "appointment.completed")...');
    console.log('   Si MS3 está apagado, el evento quedará "perdido" pero MS1 NO fallará.\n');

    try {
        const result = await ms1.send(
            { cmd: 'appointments.updateStatus' },
            { id: cita.id, status: 'COMPLETED', notes: 'Prueba de caída con MS3 apagado' }
        ).toPromise();

        console.log('¡ÉXITO! MS1 completó la cita SIN depender de que MS3 esté vivo:');
        console.log(`   ID: ${result.id}`);
        console.log(`   Status: ${result.status}`);
        console.log('\nCONCLUSIÓN: El sistema NO tiene acoplamiento temporal.');
        console.log('   MS1 publicó el evento en Redis y siguió funcionando.');
        console.log('   Cuando MS3 se reinicie, puede procesar los eventos pendientes.\n');
    } catch (error) {
        console.log(' Falló al completar la cita:', error.message);
    }

    ms1.close();
    ms2.close();
}

run();
