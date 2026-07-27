# Auditoría de códigos HTTP — antes del cambio

Actividad E — Filtro de excepciones y mapeo de códigos. Estado del repositorio antes de mi intervención, en la rama `main` (commit `2aa152e`).

| Caso de error | Código que devuelve hoy | Código que debería devolver | Archivo:línea del origen del error |
|---|:--:|:--:|---|
| `GET /api/stylists/:id` con un id que no existe | **500** Internal Server Error, con el mensaje interno crudo expuesto en el body (`"Stylist with ID ... not found"`) | 404 Not Found | `apps/services-staff/src/stylists/stylists.service.ts:45` (`throw new Error(...)`, no tipado) propagado sin traducir por `apps/gateway/src/shared/filters/all-exceptions.filter.ts:30-31` (rama `else if (exception instanceof Error) { message = exception.message; }`) |
| Cualquier error no controlado (`Error` genérico) que llega al Gateway | **500**, exponiendo `exception.message` real (fuga de información interna) | 500, con mensaje genérico fijo, sin datos internos | `apps/gateway/src/shared/filters/all-exceptions.filter.ts:30-31` |
| `GET /api/services/:id` con un id que no existe (vía gRPC `FindOneService`) | El controller convierte **cualquier** error (no solo "no encontrado") en `RpcException({code: NOT_FOUND})` fijo | 404 solo si realmente es "no encontrado"; otros errores deberían mapear a su código real | `apps/services-staff/src/services/services.controller.ts:26-31` |

## Evidencia de respaldo

- `antes-notfound-500.png` — captura de Postman: `GET /api/stylists/00000000-0000-0000-0000-000000000000` con token válido → 500, body `{"statusCode":500,"message":"Internal server error", ...}`.
- Logs de `ms-services-staff` (`docker logs ms-services-staff`) confirmando que el microservicio sí lanzaba el error correcto (`Stylist with ID ... not found`) pero se perdía el tipo al cruzar TCP hacia el Gateway.

## Comando de reproducción

```bash
curl -X POST http://localhost:3000/api/auth/login -H "Content-Type: application/json" -d '{"email":"admin@barberflow.com","password":"Admin123!"}'
# copiar access_token
curl -i http://localhost:3000/api/stylists/00000000-0000-0000-0000-000000000000 -H "Authorization: Bearer <TOKEN>"
# resultado (antes del cambio): 500 Internal Server Error
```
