# Auditoría de códigos HTTP — después del cambio

Actividad E — Filtro de excepciones y mapeo de códigos. Estado del repositorio después de mi intervención, en la rama `exam/Reishel-Tipan`.

| Caso de error | Código que devuelve ahora | Cambio aplicado |
|---|:--:|---|
| `GET /api/stylists/:id` con un id que no existe | **404** Not Found, con mensaje claro (`"Stylist with ID ... not found"`) | 1) `stylists.service.ts:45` ahora lanza `NotFoundException` en vez de `Error` plano. 2) `rpc-exception.filter.ts` (services-staff) amplié `@Catch()` para capturar también `HttpException` y propagar el `statusCode` real. 3) `StylistsController` ahora registra ese filtro explícitamente con `@UseFilters(RpcExceptionFilter)`. 4) `all-exceptions.filter.ts` (Gateway) reconoce el objeto `{statusCode, message}` serializado desde el microservicio y lo traduce correctamente. |
| Cualquier error no controlado que llega al Gateway | **500**, con mensaje genérico fijo (`"Internal server error"`), sin exponer el mensaje interno real | `all-exceptions.filter.ts`: eliminé la rama `else if (exception instanceof Error) { message = exception.message }` que exponía el mensaje crudo. |
| `GET /api/stylists/:id` con un id que sí existe | **200** OK (sin cambios) | Verificado que el camino feliz no se rompió tras el cambio. |

## Evidencia de respaldo

- `despues-notfound-404.png` — captura de Postman: mismo `GET /api/stylists/00000000-0000-0000-0000-000000000000` con token válido → 404, body `{"statusCode":404,"message":"Stylist with ID ... not found", ...}`.
- `despues-caso-ok-200.png` — captura de Postman: `GET /api/stylists/b753e50e-605e-4087-a2e8-3b68bfda424e` (id real) → 200 OK, sin regresión.
- Prueba automatizada `apps/services-staff/src/stylists/stylists.service.spec.ts` — pasa en verde (2/2), confirmando que `findOne` lanza `NotFoundException` cuando no existe el registro.

## Comando de reproducción

```bash
docker compose up -d --build services-staff gateway
curl -X POST http://localhost:3000/api/auth/login -H "Content-Type: application/json" -d '{"email":"admin@barberflow.com","password":"Admin123!"}'
# copiar access_token
curl -i http://localhost:3000/api/stylists/00000000-0000-0000-0000-000000000000 -H "Authorization: Bearer <TOKEN>"
# resultado (después del cambio): 404 Not Found, mensaje claro, sin fuga de detalles internos
```
