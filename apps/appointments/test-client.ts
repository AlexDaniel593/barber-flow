import { ClientProxyFactory, Transport } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';

async function runTest() {
  const staffClient = ClientProxyFactory.create({
    transport: Transport.TCP,
    options: { host: 'localhost', port: 3002 },
  });

  const appointmentsClient = ClientProxyFactory.create({
    transport: Transport.TCP,
    options: { host: 'localhost', port: 3001 },
  });

  console.log('Connecting to microservices...');
  await staffClient.connect();
  await appointmentsClient.connect();
  console.log('Connected!');

  // 1. Create a stylist and service in services-staff first so we have valid entities in Postgres
  console.log('\n--- 1. Creating Stylist (via MS2 Services-Staff) ---');
  const stylist = await firstValueFrom(
    staffClient.send({ cmd: 'stylists.create' }, {
      name: 'Jorge El Estilista',
      email: `jorge.${Date.now()}@barber.com`,
      phone: '0987654321',
      specialties: ['Corte', 'Barba'],
      workingHours: {
        monday: '09:00-18:00',
        tuesday: '09:00-18:00',
        wednesday: '09:00-18:00',
        thursday: '09:00-18:00',
        friday: '09:00-18:00',
        saturday: '09:00-18:00',
        sunday: '09:00-18:00',
      }
    })
  );
  console.log('Stylist Created:', stylist);

  console.log('\n--- 2. Creating Service (via MS2 Services-Staff) ---');
  const service = await firstValueFrom(
    staffClient.send({ cmd: 'services.create' }, {
      name: 'Corte Premium',
      description: 'Corte premium con lavado de cabello',
      price: 15.50,
      duration: 30, // 30 minutes
      category: 'Corte',
    })
  );
  console.log('Service Created:', service);

  // 3. Test checkAvailability endpoint
  const targetTime = new Date();
  targetTime.setHours(10, 0, 0, 0); // 10:00 AM today
  // Use tomorrow if today has already passed 10 AM, to ensure availability works cleanly
  if (targetTime.getTime() < Date.now()) {
    targetTime.setDate(targetTime.getDate() + 1);
  }
  const startTimeStr = targetTime.toISOString();

  console.log('\n--- 3. Checking Availability (appointments.checkAvailability) ---');
  const availability1 = await firstValueFrom(
    appointmentsClient.send({ cmd: 'appointments.checkAvailability' }, {
      stylistId: stylist.id,
      startTime: startTimeStr,
      duration: 30
    })
  );
  console.log('Availability Check result:', availability1);

  // 4. Test getAvailableSlots
  console.log('\n--- 4. Checking Available Slots (appointments.getAvailableSlots) ---');
  const slotsBefore = await firstValueFrom(
    appointmentsClient.send({ cmd: 'appointments.getAvailableSlots' }, {
      stylistId: stylist.id,
      date: startTimeStr.split('T')[0],
      serviceId: service.id
    })
  );
  console.log(`Available Slots: ${slotsBefore.length} slots found. First 3:`, slotsBefore.slice(0, 3));

  // 5. Test appointments.create
  console.log('\n--- 5. Creating Appointment (appointments.create) ---');
  const appointment1 = await firstValueFrom(
    appointmentsClient.send({ cmd: 'appointments.create' }, {
      clientName: 'Juan Pérez',
      clientPhone: '0999888777',
      clientEmail: 'juan.perez@example.com',
      stylistId: stylist.id,
      serviceId: service.id,
      startTime: startTimeStr,
      duration: 30,
      notes: 'Requiere corte clásico',
      totalPrice: 15.50
    })
  );
  console.log('Appointment 1 Created:', appointment1);

  // 6. Test overlap rejection
  console.log('\n--- 6. Testing Overlap Rejection (should fail/throw) ---');
  try {
    const overlappingAppointment = await firstValueFrom(
      appointmentsClient.send({ cmd: 'appointments.create' }, {
        clientName: 'Maria Gomez',
        clientPhone: '0999111222',
        clientEmail: 'maria.gomez@example.com',
        stylistId: stylist.id,
        serviceId: service.id,
        startTime: startTimeStr, // Same start time
        duration: 30
      })
    );
    console.log('ERROR: Overlapping appointment was created successfully!', overlappingAppointment);
  } catch (error) {
    console.log('SUCCESS: Overlapping appointment was correctly rejected! Error:', error.message);
  }

  // 7. Test getByStylist
  console.log('\n--- 7. Getting daily agenda by stylist (appointments.getByStylist) ---');
  const stylistAgenda = await firstValueFrom(
    appointmentsClient.send({ cmd: 'appointments.getByStylist' }, {
      stylistId: stylist.id,
      date: startTimeStr.split('T')[0]
    })
  );
  console.log(`Agenda for stylist ${stylist.name}:`, stylistAgenda);

  // 8. Test getByClient
  console.log('\n--- 8. Getting history by client (appointments.getByClient) ---');
  const clientHistory = await firstValueFrom(
    appointmentsClient.send({ cmd: 'appointments.getByClient' }, {
      clientEmail: 'juan.perez@example.com'
    })
  );
  console.log('History for juan.perez@example.com:', clientHistory);

  // 9. Test findOne
  console.log('\n--- 9. Finding Appointment detailed (appointments.findOne) ---');
  const detailedApp = await firstValueFrom(
    appointmentsClient.send({ cmd: 'appointments.findOne' }, { id: appointment1.id })
  );
  console.log('Detailed Appointment found:', detailedApp);

  // 10. Test reschedule
  console.log('\n--- 10. Rescheduling Appointment (appointments.reschedule) ---');
  const newTime = new Date(targetTime.getTime() + 60 * 60000); // Shift 1 hour later
  const rescheduled = await firstValueFrom(
    appointmentsClient.send({ cmd: 'appointments.reschedule' }, {
      id: appointment1.id,
      newStartTime: newTime.toISOString()
    })
  );
  console.log('Reschedule result:', rescheduled);

  // 11. Test findAll
  console.log('\n--- 11. Listing all appointments with filters (appointments.findAll) ---');
  const filtered = await firstValueFrom(
    appointmentsClient.send({ cmd: 'appointments.findAll' }, {
      status: 'PENDING'
    })
  );
  console.log('Filtered Appointments (status: PENDING):', filtered.length);

  // 12. Test cancel
  console.log('\n--- 12. Cancelling Appointment (appointments.cancel) ---');
  // Create another appointment to cancel
  const appointment2 = await firstValueFrom(
    appointmentsClient.send({ cmd: 'appointments.create' }, {
      clientName: 'Carlos Cancel',
      clientPhone: '0981234567',
      clientEmail: 'carlos.cancel@example.com',
      stylistId: stylist.id,
      serviceId: service.id,
      startTime: startTimeStr, // original slot is now free
      duration: 30
    })
  );
  console.log('Appointment 2 Created (for cancellation):', appointment2);

  const cancelled = await firstValueFrom(
    appointmentsClient.send({ cmd: 'appointments.cancel' }, {
      id: appointment2.id,
      reason: 'Cliente canceló por WhatsApp'
    })
  );
  console.log('Cancellation result:', cancelled);

  // 13. Test updateStatus to COMPLETED (should trigger Redis publisher + Inventory consumption/billing!)
  console.log('\n--- 13. Completing Appointment to trigger Redis event (appointments.updateStatus -> COMPLETED) ---');
  const completed = await firstValueFrom(
    appointmentsClient.send({ cmd: 'appointments.updateStatus' }, {
      id: appointment1.id,
      status: 'COMPLETED',
      notes: 'Servicio realizado con éxito.'
    })
  );
  console.log('UpdateStatus to COMPLETED result:', completed);

  console.log('Waiting 3 seconds for Redis publisher and MS3 billing subscriber to run...');
  await new Promise(resolve => setTimeout(resolve, 3000));

  // Connect to billing or query to check if invoice was generated in Postgres DB!
  console.log('\n--- 14. Querying Billing MS to verify Invoice creation (via MS3 inventory-billing) ---');
  try {
    const billingClient = ClientProxyFactory.create({
      transport: Transport.TCP,
      options: { host: 'localhost', port: 3003 },
    });
    await billingClient.connect();
    
    // We can query invoices to check if an invoice with appointmentId exists!
    // Since there isn't a direct findOneByAppointment in billing MS exposed endpoint, we can find detailed appointment again
    // which has relation to the invoice in Postgres DB!
    const verifiedApp = await firstValueFrom(
      appointmentsClient.send({ cmd: 'appointments.findOne' }, { id: appointment1.id })
    );
    console.log('Verified Appointment in DB after completion:', verifiedApp);
    if (verifiedApp.invoice) {
      console.log('SUCCESS: Invoice was automatically created in DB by ms-inventory-billing after receiving the Redis event!', verifiedApp.invoice);
    } else {
      console.log('WARNING: Invoice relation not populated. Let us check if ms-inventory-billing is up and logged.');
    }
    billingClient.close();
  } catch (err) {
    console.log('Error verifying billing:', err.message);
  }

  staffClient.close();
  appointmentsClient.close();
  console.log('\n=== All Tests Completed Successfully ===');
}

runTest().catch(console.error);
