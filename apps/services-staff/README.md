# MS2 - Services & Staff

## Ubicación en el Monorepo

Este microservicio vive dentro de la estructura estandarizada del monorepo:

```
barber-flow/
├── apps/
│   ├── ms-orders/              # MS1 - Gestión de pedidos
│   ├── services-staff/         # MS2 - Este microservicio
│   └── ms-notifications/       # MS3 - Notificaciones (Redis)
├── libs/                       # Librerías compartidas
├── docker-compose.yml          # Orquestación global
└── package.json                # Root del monorepo
```

**Ruta actual**: `apps/services-staff/`

---

## Descripción

Microservicio síncrono encargado de gestionar el catálogo de servicios y estilistas de la peluquería "Barber Flow". Es el último eslabón de la cadena de comunicación TCP síncrona:

```
API Gateway → MS1 (Orders) → MS2 (Services & Staff) [Este]
```

**Responsabilidades:**
- Gestión del catálogo de servicios de peluquería
- Gestión de estilistas y sus especialidades
- Relación Many-to-Many entre servicios y estilistas
- Exposición de endpoints TCP para consumo por MS1

**Puerto**: 3002 (TCP puro)

---

## Stack Tecnológico

| Tecnología | Versión | Propósito |
|------------|---------|-----------|
| NestJS | 11.x | Framework base |
| TypeORM | 0.3.x | ORM para PostgreSQL |
| PostgreSQL | 16.x | Base de datos relacional |
| @nestjs/microservices | 11.x | Transporte TCP |
| class-validator | 0.14.x | Validación de DTOs |

---

## Configuración Inicial

```bash
nest new ms-services-staff
cd ms-services-staff
nest g res services --no-spec
nest g res stylists --no-spec
```

---

## Estructura de Archivos

```
apps/services-staff/
├── src/
│   ├── main.ts                              # Bootstrap TCP puerto 3002
│   ├── app.module.ts                        # Módulo raíz + TypeORM config
│   ├── services/
│   │   ├── entities/
│   │   │   └── service.entity.ts           # Entidad Service
│   │   ├── dto/
│   │   │   ├── create-service.dto.ts       # DTO creación de servicio
│   │   │   └── update-service.dto.ts       # DTO actualización
│   │   ├── services.controller.ts          # Controlador TCP (6 patterns)
│   │   ├── services.service.ts             # Lógica de negocio + try-catch
│   │   └── services.module.ts              # Módulo de servicios
│   └── stylists/
│       ├── entities/
│       │   └── stylist.entity.ts           # Entidad Stylist
│       ├── dto/
│       │   ├── create-stylist.dto.ts       # DTO creación de estilista
│       │   └── update-stylist.dto.ts       # DTO actualización
│       ├── stylists.controller.ts          # Controlador TCP (5 patterns)
│       ├── stylists.service.ts             # Lógica de negocio + try-catch
│       └── stylists.module.ts              # Módulo de estilistas
├── Dockerfile                               # Multi-stage build
├── .dockerignore
├── test-client.ts                           # Cliente TCP para pruebas
├── package.json
├── tsconfig.json
└── nest-cli.json
```

---

## Recursos a Implementar

### 1. Services (Servicios)

| Método | Endpoint (TCP) | Entrada | Salida | Descripción |
|--------|----------------|---------|--------|-------------|
| POST | `{ cmd: 'services.create' }` | `CreateServiceDto` | `Service` | Crear nuevo servicio |
| GET | `{ cmd: 'services.findAll' }` | `{}` | `Service[]` | Listar servicios activos |
| GET | `{ cmd: 'services.findOne' }` | `{ id: string }` | `Service` | Obtener servicio por ID |
| PUT | `{ cmd: 'services.update' }` | `{ id, updateServiceDto }` | `Service` | Actualizar servicio |
| DELETE | `{ cmd: 'services.remove' }` | `{ id: string }` | `{ success: true }` | Desactivar servicio (soft delete) |
| GET | `{ cmd: 'services.findByStylist' }` | `{ stylistId: string }` | `Service[]` | Servicios de un estilista |

**DTO para crear servicio (`CreateServiceDto`)**:

```typescript
{
  name: string;              // "Corte clásico"
  description?: string;      // "Corte tradicional con tijera"
  price: number;             // 25.00
  duration: number;          // 30 (minutos)
  category: string;          // "corte"
  isActive?: boolean;        // true (default)
}
```

### 2. Stylists (Estilistas)

| Método | Endpoint (TCP) | Entrada | Salida | Descripción |
|--------|----------------|---------|--------|-------------|
| POST | `{ cmd: 'stylists.create' }` | `CreateStylistDto` | `Stylist` | Crear nuevo estilista |
| GET | `{ cmd: 'stylists.findAll' }` | `{}` | `Stylist[]` | Listar todos los estilistas |
| GET | `{ cmd: 'stylists.findOne' }` | `{ id: string }` | `Stylist` | Obtener estilista por ID |
| PUT | `{ cmd: 'stylists.update' }` | `{ id, updateStylistDto }` | `Stylist` | Actualizar estilista |
| DELETE | `{ cmd: 'stylists.remove' }` | `{ id: string }` | `{ success: true }` | Eliminar estilista |

**DTO para crear estilista (`CreateStylistDto`)**:

```typescript
{
  name: string;              // "Carlos Mendoza"
  email: string;             // "carlos@barberflow.com"
  phone: string;             // "5551234567"
  specialties?: string[];    // ["corte", "barba", "colorimetría"]
  workingHours?: {           // Horario semanal (jsonb)
    monday?: { start: string, end: string },
    tuesday?: { start: string, end: string },
    wednesday?: { start: string, end: string },
    thursday?: { start: string, end: string },
    friday?: { start: string, end: string },
    saturday?: { start: string, end: string }
  };
}
```

---

## Modelos de TypeORM

### Entidad Service

```typescript
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToMany,
  JoinTable,
} from 'typeorm';
import { Stylist } from '../../stylists/entities/stylist.entity';

@Entity('services')
export class Service {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 100 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  price: number;

  @Column({ type: 'int' })
  duration: number;

  @Column({ type: 'varchar', length: 50 })
  category: string;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @ManyToMany(() => Stylist, (stylist) => stylist.services)
  @JoinTable({
    name: 'service_stylist',
    joinColumn: { name: 'serviceId', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'stylistId', referencedColumnName: 'id' },
  })
  stylists: Stylist[];
}
```

### Entidad Stylist

```typescript
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToMany,
} from 'typeorm';
import { Service } from '../../services/entities/service.entity';

@Entity('stylists')
export class Stylist {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 100 })
  name: string;

  @Column({ type: 'varchar', length: 150, unique: true })
  email: string;

  @Column({ type: 'varchar', length: 20 })
  phone: string;

  @Column({ type: 'text', array: true, default: '{}' })
  specialties: string[];

  @Column({ type: 'jsonb', nullable: true })
  workingHours: Record<string, any>;

  @ManyToMany(() => Service, (service) => service.stylists)
  services: Service[];
}
```

**Relación Many-to-Many:**
- Tabla intermedia: `service_stylist`
- Columnas: `serviceId`, `stylistId`
- Un servicio puede ser realizado por múltiples estilistas
- Un estilista puede ofrecer múltiples servicios

---

## Variables de Entorno

El microservicio lee las siguientes variables para configurar TypeORM:

```env
DB_HOST=localhost              # Host de PostgreSQL (en Docker: 'postgres')
DB_PORT=5432                   # Puerto de PostgreSQL
DB_USERNAME=postgres           # Usuario de la base de datos
DB_PASSWORD=postgres           # Contraseña de la base de datos
DB_DATABASE=barber_flow        # Nombre de la base de datos
NODE_ENV=development           # Entorno (development/production)
```

**Nota**: En Docker, `DB_HOST` debe apuntar al nombre del servicio `postgres` definido en el `docker-compose.yml` global.

---

## Integración con Docker Compose

Este microservicio se integra al `docker-compose.yml` global ubicado en la raíz del monorepo.

### Configuración en docker-compose.yml (raíz del monorepo)

```yaml
services:
  ms-services-staff:
    build: ./apps/services-staff
    container_name: ms-services-staff
    ports:
      - "3002:3002"
    environment:
      - DB_HOST=postgres              # Nombre del servicio PostgreSQL
      - DB_PORT=5432
      - DB_USERNAME=${POSTGRES_USER}
      - DB_PASSWORD=${POSTGRES_PASSWORD}
      - DB_DATABASE=${POSTGRES_DB}
      - NODE_ENV=production
    depends_on:
      postgres:
        condition: service_healthy
    networks:
      - barber-flow-network
    restart: unless-stopped

  postgres:
    image: postgres:16-alpine
    container_name: barber-db
    environment:
      - POSTGRES_USER=${POSTGRES_USER}
      - POSTGRES_PASSWORD=${POSTGRES_PASSWORD}
      - POSTGRES_DB=${POSTGRES_DB}
    ports:
      - "5432:5432"
    volumes:
      - postgres-data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 5s
      timeout: 5s
      retries: 5
    networks:
      - barber-flow-network

volumes:
  postgres-data:

networks:
  barber-flow-network:
    driver: bridge
```

### Variables de entorno en .env (raíz del monorepo)

```env
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
POSTGRES_DB=barber_flow
```

### Comandos Docker

```bash
# Construir y levantar todo el ecosistema
docker-compose up --build

# Ver logs del microservicio
docker-compose logs -f ms-services-staff

# Detener todos los servicios
docker-compose down

# Detener y eliminar volúmenes
docker-compose down -v
```

---

## Instalación y Ejecución Local

### Sin Docker (desarrollo local)

```bash
# Instalar dependencias
npm install

# Configurar PostgreSQL local
sudo -u postgres createdb barber_flow
sudo -u postgres psql -d barber_flow -c "CREATE EXTENSION IF NOT EXISTS \"uuid-ossp\";"

# Configurar variables de entorno
cp .env.example .env
# Editar .env con tus credenciales locales

# Ejecutar en modo desarrollo
npm run start:dev

# Ejecutar en modo producción
npm run build
npm run start:prod
```

### Con Docker

```bash
# Desde la raíz del monorepo
cd barber-flow
docker-compose up --build ms-services-staff
```

---

## Pruebas del Microservicio

### Cliente TCP de prueba

El archivo `test-client.ts` permite validar todos los endpoints:

```bash
# Ejecutar pruebas
npx ts-node test-client.ts
```

**Salida esperada:**
```
=== Conectado al microservicio ===

--- Crear Estilista ---
Estilista creado: { id: '...', name: 'Carlos Mendoza', ... }

--- Crear Servicio 1 ---
Servicio 1 creado: { id: '...', name: 'Corte clásico', price: 25, ... }

--- Listar todos los servicios ---
Servicios: [ { id: '...', name: 'Corte clásico', ... } ]

--- Buscar servicios por estilista ---
Servicios del estilista: []

=== Prueba completada ===
```

### Ejemplo de consumo desde MS1 (Orders)

```typescript
import { ClientProxyFactory, Transport } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';

const servicesClient = ClientProxyFactory.create({
  transport: Transport.TCP,
  options: { host: 'ms-services-staff', port: 3002 },
});

// Crear un servicio
const newService = await firstValueFrom(
  servicesClient.send({ cmd: 'services.create' }, {
    name: 'Corte moderno',
    description: 'Corte con máquina y tijera',
    price: 30.00,
    duration: 45,
    category: 'corte',
  })
);

// Obtener servicios de un estilista
const stylistServices = await firstValueFrom(
  servicesClient.send({ cmd: 'services.findByStylist' }, {
    stylistId: 'uuid-del-estilista'
  })
);
```

---

## Criterios de Aceptación

- [x] Microservicio creado con NestJS en puerto 3002
- [x] Recursos `services` y `stylists` implementados con CRUD completo
- [x] Conexión a PostgreSQL con **TypeORM** (no Prisma)
- [x] Todos los endpoints TCP funcionando correctamente
- [x] Relación Many-to-Many entre estilistas y servicios
- [x] Manejo de excepciones con try-catch en la capa de servicios
- [x] Dockerfile multi-stage configurado y optimizado
- [x] Integración documentada para docker-compose global
- [x] README actualizado con endpoints, ejemplos y configuración

---

## Dependencias en el Ecosistema

| Dependencia | Tipo | Descripción |
|-------------|------|-------------|
| PostgreSQL | Base de datos | Persistencia de datos |
| MS1 (Orders) | Consumidor | Este MS es consumido vía TCP |
| Redis | N/A | No depende de Redis (100% síncrono) |

---

## Licencia

UNLICENSED
