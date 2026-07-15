import { ClientProxyFactory, Transport } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';

async function test() {
  const client = ClientProxyFactory.create({
    transport: Transport.TCP,
    options: { host: 'localhost', port: 3002 },
  });

  await client.connect();
  console.log('=== Conectado al microservicio ===\n');

  console.log('--- Crear Estilista ---');
  const stylist = await firstValueFrom(
    client.send({ cmd: 'stylists.create' }, {
      name: 'Carlos Mendoza',
      email: 'carlos@barberflow.com',
      phone: '5551234567',
      specialties: ['corte', 'barba'],
      workingHours: {
        monday: '9:00-18:00',
        tuesday: '9:00-18:00',
        wednesday: '9:00-18:00',
        thursday: '9:00-18:00',
        friday: '9:00-20:00',
      },
    })
  );
  console.log('Estilista creado:', stylist);

  console.log('\n--- Crear Servicio 1 ---');
  const service1 = await firstValueFrom(
    client.send({ cmd: 'services.create' }, {
      name: 'Corte clásico',
      description: 'Corte tradicional con tijera',
      price: 25.00,
      duration: 30,
      category: 'corte',
    })
  );
  console.log('Servicio 1 creado:', service1);

  console.log('\n--- Crear Servicio 2 ---');
  const service2 = await firstValueFrom(
    client.send({ cmd: 'services.create' }, {
      name: 'Arreglo de barba',
      description: 'Perfilado y arreglo de barba',
      price: 15.00,
      duration: 20,
      category: 'barba',
    })
  );
  console.log('Servicio 2 creado:', service2);

  console.log('\n--- Listar todos los servicios ---');
  const allServices = await firstValueFrom(client.send({ cmd: 'services.findAll' }, {}));
  console.log('Servicios:', allServices);

  console.log('\n--- Listar todos los estilistas ---');
  const allStylists = await firstValueFrom(client.send({ cmd: 'stylists.findAll' }, {}));
  console.log('Estilistas:', allStylists);

  console.log('\n--- Buscar servicios por estilista ---');
  const stylistServices = await firstValueFrom(
    client.send({ cmd: 'services.findByStylist' }, { stylistId: stylist.id })
  );
  console.log('Servicios del estilista:', stylistServices.length > 0 ? stylistServices : 'Ninguno (relación no establecida aún)');

  console.log('\n--- Buscar estilista por ID ---');
  const foundStylist = await firstValueFrom(
    client.send({ cmd: 'stylists.findOne' }, { id: stylist.id })
  );
  console.log('Estilista encontrado:', foundStylist);

  console.log('\n--- Actualizar servicio ---');
  const updated = await firstValueFrom(
    client.send({ cmd: 'services.update' }, {
      id: service1.id,
      updateServiceDto: { price: 30.00 }
    })
  );
  console.log('Servicio actualizado:', updated);

  console.log('\n--- Eliminar servicio (soft delete) ---');
  const removed = await firstValueFrom(
    client.send({ cmd: 'services.remove' }, { id: service2.id })
  );
  console.log('Resultado:', removed);

  console.log('\n--- Verificar servicios activos ---');
  const activeServices = await firstValueFrom(client.send({ cmd: 'services.findAll' }, {}));
  console.log('Servicios activos:', activeServices.length);

  client.close();
  console.log('\n=== Prueba completada ===');
}

test().catch(console.error);
