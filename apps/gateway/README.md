# API Gateway

## Ubicación en el Monorepo

Este API Gateway vive dentro de la estructura estandarizada del monorepo:

```
barber-flow/
├── apps/
│   ├── gateway/                 # Este API Gateway
│   ├── services-staff/          # MS2 - Servicios y Estilistas
│   ├── inventory-billing/       # MS3 - Inventario y Facturación
│   └── appointments/            # MS1 - Citas (planificado)
├── docker-compose.yml           # Orquestación global
└── README.md
```

**Ruta actual**: `apps/gateway/`

---

## Descripción

API Gateway que sirve como punto único de entrada del sistema Barber Flow. Enruta peticiones HTTP y las redirige a los microservicios internos mediante clientes TCP con `@nestjs/microservices`.

**Puerto**: 3000 (HTTP)

---

## Stack Tecnológico

| Tecnología | Versión | Propósito |
|------------|---------|-----------|
| NestJS | 11.x | Framework base |
| @nestjs/microservices | 11.x | Transporte TCP para proxy |
| @nestjs/platform-express | 11.x | Servidor HTTP |
| class-validator | 0.14.x | Validación de DTOs |

---

## Configuración Inicial

```bash
nest new api-gateway
cd api-gateway
nest g res auth --no-spec
nest g res appointments --no-spec
nest g res stylists --no-spec
nest g res services --no-spec
```

---

## Estructura de Archivos

```
apps/gateway/
├── src/
│   ├── main.ts                              # Bootstrap HTTP puerto 3000
│   ├── app.module.ts                        # Módulo raíz
│   ├── shared/
│   │   └── microservices-client.module.ts   # Clientes TCP compartidos
│   ├── auth/
│   │   ├── auth.controller.ts               # Endpoints /auth (mocked)
│   │   └── auth.module.ts
│   ├── services/
│   │   ├── services.controller.ts           # Proxy HTTP → TCP (MS2)
│   │   └── services.module.ts
│   └── stylists/
│       ├── stylists.controller.ts           # Proxy HTTP → TCP (MS2)
│       └── stylists.module.ts
├── Dockerfile                               # Multi-stage build
├── .dockerignore
├── .env.example
├── .gitignore
├── package.json
├── tsconfig.json
└── nest-cli.json
```

---

## Recursos a Implementar

### 1. Auth (Autenticación)

| Método | Endpoint HTTP | Entrada | Salida | Descripción |
|--------|--------------|---------|--------|-------------|
| POST | /auth/login | `{ email, password }` | `{ access_token, user }` | Login de usuario |
| POST | /auth/register | `{ email, password, name, role? }` | `{ id, email, name, role }` | Registrar usuario |
| GET | /auth/profile | `Authorization: Bearer <token>` | `{ id, email, name, role }` | Obtener perfil del usuario autenticado |

> **Avance 1**: Respuestas simuladas (mocked). JWT real y Guards en Avance 3.

### 2. Services (Proxy → MS2 Services-Staff)

| Método | Endpoint HTTP | Comando TCP | Descripción |
|--------|--------------|-------------|-------------|
| POST | /services | `{ cmd: 'services.create' }` | Crear servicio |
| GET | /services | `{ cmd: 'services.findAll' }` | Listar servicios |
| GET | /services/:id | `{ cmd: 'services.findOne' }` | Obtener servicio por ID |
| PUT | /services/:id | `{ cmd: 'services.update' }` | Actualizar servicio |
| DELETE | /services/:id | `{ cmd: 'services.remove' }` | Desactivar servicio |
| GET | /services/stylist/:stylistId | `{ cmd: 'services.findByStylist' }` | Servicios de un estilista |

### 3. Stylists (Proxy → MS2 Services-Staff)

| Método | Endpoint HTTP | Comando TCP | Descripción |
|--------|--------------|-------------|-------------|
| POST | /stylists | `{ cmd: 'stylists.create' }` | Crear estilista |
| GET | /stylists | `{ cmd: 'stylists.findAll' }` | Listar estilistas |
| GET | /stylists/:id | `{ cmd: 'stylists.findOne' }` | Obtener estilista por ID |
| PUT | /stylists/:id | `{ cmd: 'stylists.update' }` | Actualizar estilista |
| DELETE | /stylists/:id | `{ cmd: 'stylists.remove' }` | Eliminar estilista |

---

## Clientes TCP Configurados

Los microservicios se registran mediante `ClientsModule` con soporte para variables de entorno (Docker Compose):

| Cliente | Env Host | Env Port | Default Host | Default Port |
|---------|----------|----------|--------------|--------------|
| SERVICES_STAFF_CLIENT | `SERVICES_STAFF_HOST` | `SERVICES_STAFF_PORT` | services-staff | 3002 |
| PEDIDOS_CLIENT | `SVC_PEDIDOS_HOST` | `SVC_PEDIDOS_PORT` | svc-pedidos | 3001 |

---

## Variables de Entorno

```env
# Gateway
PORT=3000

# Microservicio Pedidos (Orders)
SVC_PEDIDOS_HOST=svc-pedidos
SVC_PEDIDOS_PORT=3001

# Microservicio Staff (Services-Staff)
SERVICES_STAFF_HOST=services-staff
SERVICES_STAFF_PORT=3002
```

---

## Guards y Estrategias JWT (Avance 3)

**JwtGuard**:
```typescript
@Injectable()
export class JwtGuard extends AuthGuard('jwt') {
  canActivate(context: ExecutionContext) {
    return super.canActivate(context);
  }
}
```

**RolesGuard**:
```typescript
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}
  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>('roles', [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!requiredRoles) return true;
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    return requiredRoles.some((role) => user.roles?.includes(role));
  }
}
```

**Uso en controladores**:
```typescript
@UseGuards(JwtGuard, RolesGuard)
@Roles('admin')
@Post('stylists')
create(@Body() dto: CreateStylistDto) {
  return this.stylistsService.create(dto);
}
```

---

## Integración con Docker Compose

```yaml
services:
  gateway:
    build: ./apps/gateway
    container_name: api-gateway
    environment:
      PORT: 3000
      SERVICES_STAFF_HOST: services-staff
      SERVICES_STAFF_PORT: 3002
      SVC_PEDIDOS_HOST: svc-pedidos
      SVC_PEDIDOS_PORT: 3001
    ports:
      - "3000:3000"
    depends_on:
      - services-staff
    networks:
      - barber-flow-network
```

---

## Instalación y Ejecución Local

### Sin Docker

```bash
# Instalar dependencias
npm install

# Ejecutar en modo desarrollo (services-staff debe estar corriendo)
SERVICES_STAFF_HOST=localhost SERVICES_STAFF_PORT=3002 npm run start:dev

# Ejecutar en modo producción
npm run build
SERVICES_STAFF_HOST=localhost SERVICES_STAFF_PORT=3002 npm run start:prod
```

### Con Docker

```bash
# Desde la raíz del monorepo
cd barber-flow
docker compose up --build gateway
```

---

## Pruebas del Gateway

```bash
# Auth (mocked)
curl http://localhost:3000/auth/profile

# Crear servicio
curl -X POST http://localhost:3000/services \
  -H "Content-Type: application/json" \
  -d '{"name":"Corte clásico","price":25,"duration":30,"category":"corte"}'

# Listar servicios
curl http://localhost:3000/services

# Crear estilista
curl -X POST http://localhost:3000/stylists \
  -H "Content-Type: application/json" \
  -d '{"name":"Carlos","email":"carlos@test.com","phone":"5551234567"}'

# Listar estilistas
curl http://localhost:3000/stylists
```

---

## Criterios de Aceptación

- [x] Gateway creado con NestJS en puerto 3000
- [x] Proxies TCP a microservicios configurados (ClientsModule)
- [x] Endpoints /services y /stylists con proxy HTTP → TCP
- [x] Endpoints /auth con respuestas mock (login, register, profile)
- [x] Dockerfile multi-stage configurado
- [ ] Autenticación JWT implementada (Avance 3)
- [ ] Guards de roles funcionando (Avance 3)
- [ ] Manejo de errores y excepciones
- [ ] Endpoints protegidos según rol

---

## Dependencias en el Ecosistema

| Dependencia | Tipo | Descripción |
|-------------|------|-------------|
| services-staff | Microservicio TCP | Catálogo de servicios y estilistas |
| appointments (futuro) | Microservicio TCP | Gestión de citas |
| PostgreSQL | Base de datos | Acceso indirecto vía MS |
| Redis | Mensajería | Tráfico eventual vía MS |

---

## Licencia

UNLICENSED
