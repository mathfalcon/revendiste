import {randomUUID} from 'crypto';
import {db} from './db';
import {NotificationService} from './services/notifications';
import {UsersRepository} from './repositories';

const TEST_USER_ID = 'a7ccc7f0-e17f-4fce-9a21-d1ae366ea4e9';
const APP_BASE_URL = process.env.APP_BASE_URL || 'http://localhost:3000';

// Generate test UUIDs
const testOrderId1 = randomUUID();
const testOrderId2 = randomUUID();
const testListingId1 = randomUUID();
const testListingId2 = randomUUID();
const testOrderId3 = randomUUID();
const testOrderId4 = randomUUID();
const testOrderId5 = randomUUID();
const testOrderId6 = randomUUID();
const testOrderId7 = randomUUID();

(async () => {
  const notificationService = new NotificationService(
    db,
    new UsersRepository(db),
  );

  console.log('Creating test notifications for user:', TEST_USER_ID);

  // 1. ticket_sold_buyer
  await notificationService.createNotification({
    userId: TEST_USER_ID,
    type: 'ticket_sold_buyer',
    title: '¡Tu compra fue exitosa!',
    description:
      'Has comprado 2 entradas para Coldplay en Estadio Centenario. Por favor, sube los documentos de tus tickets.',
    channels: ['in_app', 'email'],
    actions: [
      {
        type: 'upload_documents',
        label: 'Subir documentos',
        url: `${APP_BASE_URL}/cuenta/publicaciones?subirTicket=${testOrderId1}`,
      },
    ],
    metadata: {
      type: 'ticket_sold_buyer',
      orderId: testOrderId1,
      eventName: 'Coldplay en Estadio Centenario',
      ticketCount: 2,
    },
  });
  console.log('✓ Created ticket_sold_buyer notification');
  await new Promise(resolve => setTimeout(resolve, 600)); // Rate limit: 2 req/sec

  // 2. ticket_sold_seller
  await notificationService.createNotification({
    userId: TEST_USER_ID,
    type: 'ticket_sold_seller',
    title: '¡Tus entradas han sido vendidas!',
    description:
      'Has vendido 3 entradas para Taylor Swift en Estadio Centenario. El evento comienza el 15 de marzo de 2024.',
    channels: ['in_app', 'email'],
    actions: [
      {
        type: 'upload_documents',
        label: 'Subir documentos',
        url: `${APP_BASE_URL}/cuenta/publicaciones?subirTicket=${testListingId1}`,
      },
    ],
    metadata: {
      type: 'ticket_sold_seller',
      listingId: testListingId1,
      eventName: 'Taylor Swift en Estadio Centenario',
      eventStartDate: new Date('2024-03-15T20:00:00Z').toISOString(),
      ticketCount: 3,
      platform: 'revendiste',
      qrAvailabilityTiming: '24h',
      shouldPromptUpload: true,
    },
  });
  console.log('✓ Created ticket_sold_seller notification');
  await new Promise(resolve => setTimeout(resolve, 600));

  // 3. document_reminder
  await notificationService.createNotification({
    userId: TEST_USER_ID,
    type: 'document_reminder',
    title: 'Recordatorio: Sube los documentos de tus tickets',
    description:
      'El evento "Bad Bunny en Estadio Centenario" comienza en 12 horas. Aún tienes 1 ticket sin documentar. Por favor, sube los documentos lo antes posible.',
    channels: ['in_app', 'email'],
    actions: [
      {
        type: 'upload_documents',
        label: 'Subir documentos',
        url: `${APP_BASE_URL}/cuenta/publicaciones?subirTicket=${testListingId2}`,
      },
    ],
    metadata: {
      type: 'document_reminder',
      listingId: testListingId2,
      eventName: 'Bad Bunny en Estadio Centenario',
      eventStartDate: new Date('2024-04-20T21:00:00Z').toISOString(),
      ticketCount: 1,
      hoursUntilEvent: 12,
    },
  });
  console.log('✓ Created document_reminder notification');
  await new Promise(resolve => setTimeout(resolve, 600));

  // 4. order_confirmed
  await notificationService.createNotification({
    userId: TEST_USER_ID,
    type: 'order_confirmed',
    title: 'Orden confirmada',
    description:
      'Tu orden para The Weeknd en Estadio Centenario ha sido confirmada. Total pagado: 5000 UYU.',
    channels: ['in_app', 'email'],
    actions: [
      {
        type: 'view_order',
        label: 'Ver orden',
        url: `${APP_BASE_URL}/cuenta/tickets?orderId=${testOrderId3}`,
      },
    ],
    metadata: {
      type: 'order_confirmed',
      orderId: testOrderId3,
      eventName: 'The Weeknd en Estadio Centenario',
      totalAmount: '5000',
      currency: 'UYU',
    },
  });
  console.log('✓ Created order_confirmed notification');
  await new Promise(resolve => setTimeout(resolve, 600));

  // 5. order_expired
  await notificationService.createNotification({
    userId: TEST_USER_ID,
    type: 'order_expired',
    title: 'Orden expirada',
    description:
      'Tu orden para Dua Lipa en Estadio Centenario ha expirado. Las entradas han sido liberadas.',
    channels: ['in_app', 'email'],
    actions: [],
    metadata: {
      type: 'order_expired',
      orderId: testOrderId4,
      eventName: 'Dua Lipa en Estadio Centenario',
    },
  });
  console.log('✓ Created order_expired notification');
  await new Promise(resolve => setTimeout(resolve, 600));

  // 6. payment_failed
  await notificationService.createNotification({
    userId: TEST_USER_ID,
    type: 'payment_failed',
    title: 'Pago fallido',
    description:
      'El pago para tu orden de Ed Sheeran en Estadio Centenario ha fallado. Error: Tarjeta rechazada. Por favor, intenta nuevamente.',
    channels: ['in_app', 'email'],
    actions: [
      {
        type: 'retry_payment',
        label: 'Reintentar pago',
        url: `${APP_BASE_URL}/checkout/${testOrderId5}`,
      },
    ],
    metadata: {
      type: 'payment_failed',
      orderId: testOrderId5,
      eventName: 'Ed Sheeran en Estadio Centenario',
      errorMessage: 'Tarjeta rechazada',
    },
  });
  console.log('✓ Created payment_failed notification');
  await new Promise(resolve => setTimeout(resolve, 600));

  // 7. payment_succeeded
  await notificationService.createNotification({
    userId: TEST_USER_ID,
    type: 'payment_succeeded',
    title: 'Pago exitoso',
    description:
      'Tu pago de 7500 UYU para Billie Eilish en Estadio Centenario fue procesado exitosamente.',
    channels: ['in_app', 'email'],
    actions: [
      {
        type: 'view_order',
        label: 'Ver orden',
        url: `${APP_BASE_URL}/cuenta/tickets?orderId=${testOrderId6}`,
      },
    ],
    metadata: {
      type: 'payment_succeeded',
      orderId: testOrderId6,
      eventName: 'Billie Eilish en Estadio Centenario',
      totalAmount: '7500',
      currency: 'UYU',
    },
  });
  console.log('✓ Created payment_succeeded notification');

  console.log('\n✅ All test notifications created successfully!');
  console.log(
    'Check your email and in-app notifications to see how they look.',
  );
})();
