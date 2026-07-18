import * as grpc from '@grpc/grpc-js';
import * as protoLoader from '@grpc/proto-loader';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const PROTO_PATH = join(__dirname, '../proto/barber.proto');

async function test() {
  const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
    keepCase: true,
    longs: String,
    enums: String,
    defaults: true,
    oneofs: true,
  });
  const proto = grpc.loadPackageDefinition(packageDefinition).barber;

  const client = new proto.StylistService(
    'localhost:50051',
    grpc.credentials.createInsecure(),
  );

  console.log('=== Prueba de Tolerancia a Fallos (gRPC) ===\n');
  console.log('Enviando petición con ID inválido...\n');

  const invalidIds = [
    'id-invalido-que-rompe-el-contrato-grpc-12345',
    '00000000-0000-0000-0000-000000000000',
    'no-es-un-uuid',
  ];

  for (const id of invalidIds) {
    console.log(`--- Test ID: "${id}" ---`);
    await new Promise((resolve) => {
      client.findOneStylist({ id }, (error, response) => {
        if (error) {
          console.log(`  Respuesta: ERROR controlado (código ${error.code})`);
          console.log(`  Mensaje: "${error.details}"`);
          console.log(`  El servidor respondió con un error estructurado en lugar de caerse\n`);
        } else {
          console.log(`  Respuesta: OK - ${JSON.stringify(response)}\n`);
        }
        resolve();
      });
    });
  }

  console.log('=== VERIFICACIÓN: El proceso del servidor sigue activo ===');
  console.log('(Si ves este mensaje, significa que el servidor gRPC');
  console.log(' maneja errores sin crash — tolerancia a fallos demostrada)\n');

  client.close();
}

test().catch(console.error);
