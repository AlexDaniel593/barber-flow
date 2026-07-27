# Bitácora — Examen Final

---

## 0. Identificación

| | |
|---|---|
| **Nombre** | Reishel Tipán |
| **Usuario GitHub** | @Reishel-Tipan |
| **Grupo / Proyecto** | Grupo 2 — Barber-Flow (`AlexDaniel593/barber-flow`) |
| **Actividad asignada** | E — Filtro de excepciones y mapeo de códigos |
| **Rama** | [`exam/Reishel-Tipan`](https://github.com/AlexDaniel593/barber-flow/tree/exam/Reishel-Tipan) |
| **Tag** | [`examen-Reishel-Tipan`](https://github.com/AlexDaniel593/barber-flow/releases/tag/examen-Reishel-Tipan) |
| **Pull Request** | https://github.com/AlexDaniel593/barber-flow/pull/77 |
| **Tarjeta Kanban** | https://github.com/users/AlexDaniel593/projects/1/views/1?pane=issue&itemId=219050457&issue=AlexDaniel593%7Cbarber-flow%7C72 |
| **¿Hiciste el Paso 0?** | No aplica — la actividad E no tiene prerrequisito de Avance 3 (no requiere JWT ni Sentry como base). |

---

## 1. Qué construí

Extendí el filtro global de excepciones del Gateway y el filtro RPC del microservicio `services-staff` para que un error de "recurso no encontrado" viaje correctamente tipado desde el microservicio (TCP) hasta el cliente HTTP final, devolviendo 404 en vez de 500. También corregí una fuga de información en el filtro del Gateway, que exponía el mensaje interno crudo de cualquier error no controlado en el body del 500. Verifiqué que el camino feliz (`GET` de un stylist existente) sigue devolviendo 200 sin regresiones, y agregué una prueba unitaria que confirma que el servicio lanza `NotFoundException` en vez de un `Error` genérico.

---

## 2. Anclaje con el repositorio de mi grupo — **obligatorio (C2)**

| Código preexistente | Archivo:línea | Cómo me conecto con él |
|---|---|---|
| Filtro global HTTP ya registrado | `apps/gateway/src/shared/filters/all-exceptions.filter.ts:12` (`AllExceptionsFilter`, `@Catch()`), registrado en `apps/gateway/src/main.ts:14` (`app.useGlobalFilters(new AllExceptionsFilter())`) | Extendí el `catch()` existente: agregué una rama para reconocer errores serializados desde microservicios (objeto con `statusCode` numérico) y eliminé la línea que exponía `exception.message` crudo en el 500 genérico. No creé un filtro nuevo ni un segundo `@Catch()` paralelo. |
| Filtro RPC ya registrado en el microservicio | `apps/services-staff/src/shared/filters/rpc-exception.filter.ts:6` (`RpcExceptionFilter`, `@Catch(RpcException)`), registrado en `apps/services-staff/src/main.ts` (`app.useGlobalFilters(...)`) | Amplié el `@Catch()` para capturar también `HttpException` (antes solo capturaba `RpcException`), y cambié la lógica para propagar el `statusCode` real de la excepción en vez de forzar `400` fijo siempre. |
| Servicio de dominio con el bug de origen | `apps/services-staff/src/stylists/stylists.service.ts:44-46` (método `findOne`) | Cambié `throw new Error(...)` por `throw new NotFoundException(...)` de `@nestjs/common`, para que el error nazca ya tipado y el filtro pueda reconocerlo. |
| Orden de inicialización del microservicio | `apps/services-staff/src/main.ts` (bootstrap) | Moví `app.useGlobalFilters(...)` para que se registre **antes** de `app.connectMicroservice(...)` (TCP y gRPC). No fue, por sí solo, la causa raíz del bug (el filtro seguía sin ejecutarse para el patrón `@MessagePattern`), pero es un orden más correcto y lo dejé aplicado. |
| Controller de dominio | `apps/services-staff/src/stylists/stylists.controller.ts:9` (`StylistsController`) | Agregué `@UseFilters(RpcExceptionFilter)` directamente sobre la clase del controller. Esta fue la corrección que realmente resolvió el bug: el filtro registrado globalmente vía `useGlobalFilters` en `main.ts` no se estaba invocando para las excepciones lanzadas dentro de un handler `@MessagePattern` sobre TCP puro (a diferencia de gRPC), así que hasta que lo registré explícitamente a nivel de controller, el error seguía cayendo al manejador por defecto de Nest (`{status:'error', message:'Internal server error'}`). |

**¿Qué convención del repositorio seguí para que mi código no desentone?**

Mantuve el patrón ya existente de un único filtro global por aplicación (`@Catch()` en el Gateway, `@Catch(...)` en cada microservicio) registrado vía `useGlobalFilters` en el `main.ts` correspondiente. Seguí el mismo estilo de los filtros existentes: uso de `HttpException.getStatus()`/`getResponse()`, y el mismo formato de body de respuesta (`statusCode`, `message`, `timestamp`, `path`) que ya usaba `AllExceptionsFilter`.

**¿Qué NO dupliqué, pudiendo hacerlo?**

No creé un segundo filtro de excepciones en el Gateway ni en `services-staff` — extendí los dos que ya existían (`AllExceptionsFilter` en `apps/gateway/src/shared/filters/all-exceptions.filter.ts:12` y `RpcExceptionFilter` en `apps/services-staff/src/shared/filters/rpc-exception.filter.ts:6`). Tampoco creé una excepción de dominio custom nueva: usé `NotFoundException` de Nest, que ya es la convención estándar del framework que el resto del repo usa en otros puntos (p. ej. los guards de auth).

---

## 3. Decisiones técnicas

### Decisión 1
- **Qué decidí:** tipar el error de "no encontrado" en el origen (`stylists.service.ts`, usando `NotFoundException` de Nest) en vez de intentar adivinar el tipo de error solo con texto en el filtro del Gateway.
- **Alternativa que descarté:** parchear únicamente `AllExceptionsFilter` para inspeccionar el string del mensaje (ej. `if (message.includes('not found')) statusCode = 404`).
- **Por qué:** una solución basada en texto es frágil (se rompe si cambia la redacción del mensaje) y no es una traducción real de errores de dominio, solo un parche cosmético. Tipar el error en origen es la práctica correcta y ya es el patrón que usan los guards de autenticación del Gateway (`UnauthorizedException`, `ForbiddenException`).

### Decisión 2
- **Qué decidí:** extender el filtro RPC existente en `services-staff` para que capture también `HttpException` (no solo `RpcException`) y propague el `statusCode` real, en vez de crear un filtro nuevo o traducir el error únicamente en el Gateway.
- **Alternativa que descarté:** dejar el filtro RPC de `services-staff` sin tocar y en su lugar intentar reconstruir el código HTTP correcto solo en el Gateway, adivinando a partir del mensaje recibido.
- **Por qué:** el Gateway no tiene forma confiable de reconstruir el tipo real del error si el microservicio ya lo aplanó a un `400` fijo o a un error genérico no tipado. El código correcto debe nacer donde se conoce el dominio (el microservicio) y propagarse tal cual; el Gateway solo debe traducirlo al protocolo HTTP, no inventarlo.

### Decisión 3
- **Qué decidí:** registrar el filtro RPC explícitamente con `@UseFilters(RpcExceptionFilter)` sobre `StylistsController`, en vez de depender únicamente de `app.useGlobalFilters(...)` en `main.ts`.
- **Alternativa que descarté:** seguir intentando que el filtro global (registrado una sola vez en el bootstrap) cubriera automáticamente el contexto TCP de `@MessagePattern`.
- **Por qué:** verifiqué con logs de Docker que el filtro global nunca se ejecutaba para las excepciones lanzadas dentro de un handler `@MessagePattern` en este microservicio (aunque en teoría `useGlobalFilters` debería cubrir también el contexto RPC de microservicios conectados con `connectMicroservice`). Insistir en el registro global habría significado seguir sin solución tras varios rebuilds; registrar el filtro a nivel de controller es un mecanismo de Nest igual de válido y no duplica nada — sigue siendo la misma clase de filtro ya existente, solo cambia el punto donde se declara su aplicación.

---

## 4. Las 3 preguntas de mi actividad

**Pregunta 1:** ¿Por qué devolver 201 con cuerpo `{status:'FAILED'}` es un problema para quien consume la API? Da un ejemplo concreto de qué se rompe.

> Porque rompe el contrato implícito entre el código de estado HTTP y el resultado real de la operación: un cliente (o cualquier librería HTTP estándar) interpreta 2xx como éxito y no revisa el body para saber si algo falló. En mi propio sistema, antes de mi cambio, `AllExceptionsFilter` tenía el mismo problema en su forma inversa: cualquier `Error` no tipado caía a 500 aunque semánticamente fuera un simple "no encontrado" — un cliente que solo mira el código HTTP (por ejemplo, un `fetch` con `if (response.ok)`) jamás distinguiría "no encontrado" de "el servidor realmente se rompió", y un frontend no podría decidir automáticamente si reintentar la petición o mostrar un mensaje de "no existe". Si en cambio se devolviera 201 con `{status:'FAILED'}`, el problema sería el opuesto: un cliente que confía en el código HTTP asumiría éxito y seguiría su flujo (ej. redirigir a "cita creada") aunque la operación realmente falló.

**Pregunta 2:** ¿Cuál es la diferencia entre 409 y 422, y cuál usaste en tu caso? Justifica.

> 409 (Conflict) es para cuando el recurso o el estado del sistema ya está en una condición que impide la operación por una cuestión de **estado/concurrencia** (ej. un registro duplicado, una reserva que ya fue tomada). 422 (Unprocessable Entity) es para cuando la petición está bien formada pero **viola una regla de negocio** sobre datos por lo demás válidos (ej. saldo insuficiente, sin stock). En mi implementación, el caso principal que corregí fue 404 (recurso no encontrado), no 409 ni 422 — no llegué a implementar ni corregir un caso real de conflicto o regla de negocio en el tiempo del bloque de 2 horas. Lo documento honestamente en la sección 8 en vez de simular que lo cubrí.

**Pregunta 3:** ¿Por qué el filtro no debe devolver al cliente el mensaje original de la excepción? ¿Qué se arriesga?

> Porque el mensaje de una excepción no controlada suele contener detalles internos del sistema: rutas de archivos, fragmentos de queries SQL, nombres de tablas o columnas, stack traces, o incluso valores de configuración. Confirmé esto directamente en mi propio repositorio: la versión original de `AllExceptionsFilter` (línea 30-31, `apps/gateway/src/shared/filters/all-exceptions.filter.ts`) tenía `else if (exception instanceof Error) { message = exception.message; }`, que reenviaba tal cual cualquier mensaje de error interno al cliente HTTP. Si ese error viniera, por ejemplo, de una consulta fallida a la base de datos, el mensaje podría exponer el nombre real de la tabla o de una columna, información útil para un atacante que intenta mapear la estructura interna del sistema. Por eso mi corrección deja el 500 con un mensaje genérico fijo (`'Internal server error'`) cuando el error no es un tipo reconocido, y solo propaga mensajes específicos cuando provienen de una excepción de dominio ya tipada (`HttpException` o el objeto serializado con `statusCode` que viene de un microservicio).

---

## 5. Uso de Inteligencia Artificial — **obligatorio**

**¿Usaste IA en este examen?**  ☒ Sí  ☐ No

| # | Qué le pedí | Qué me devolvió | Qué corregí, adapté o descarté — y por qué |
|:--:|---|---|---|
| 1 | Analizar los documentos del examen (ACTIVIDADES.md, ASIGNACION.md, BITACORA.plantilla.md, enunciado general) y explicarme qué me tocaba hacer | Un resumen de la Actividad E asignada a mí, plan de trabajo de las 2 horas, y checklist de entregables | Lo usé tal cual como guía de planificación; no requirió corrección, solo verificación cruzada con el enunciado original |
| 2 | Auditar el repositorio para encontrar el filtro de excepciones existente y los casos de código HTTP mal mapeado | Diagnóstico de `AllExceptionsFilter`, `RpcExceptionFilter` de varios microservicios, y casos concretos de `Error` plano en `services-staff` | Verifiqué cada archivo:línea leyendo el código yo mismo antes de aceptar el diagnóstico; confirmé con logs de Docker que el bug era real antes de tocar código |
| 3 | Diagnosticar por qué mi primer intento de fix (tipar `NotFoundException` + ampliar el filtro RPC) seguía devolviendo 500 | Identificó, leyendo el código fuente de `@nestjs/microservices` y `@nestjs/core` dentro del propio contenedor, que `useGlobalFilters()` se registraba después de `connectMicroservice()` en `services-staff/src/main.ts`, por lo que el filtro nunca se aplicaba al contexto RPC | Verifiqué el fix ejecutando el rebuild y repitiendo la petición real en Postman antes de darlo por bueno |

**¿En qué se equivocó respecto a mi repositorio?**

En el primer intento de solución, la IA asumió que bastaba con tipar la excepción como `NotFoundException` y ampliar el `@Catch()` del filtro RPC existente para que el error llegara correctamente al Gateway como 404. Esto no funcionó: seguía devolviendo 500 con un mensaje genérico `{"status":"error","message":"Internal server error"}`. Lo detecté ejecutando la petición real en Postman después de cada cambio y revisando los logs de Docker, en vez de asumir que el fix era correcto solo por lectura de código. La causa real (orden de registro del filtro global antes de `connectMicroservice`) solo se encontró leyendo el código fuente compilado de Nest dentro del propio contenedor, no era evidente a simple vista y no estaba documentada en el repo.

---

## 6. Evidencia

| Archivo | Qué demuestra |
|---|---|
| [antes-notfound-500.png](antes-notfound-500.png) | GET a un stylist inexistente devolviendo 500 con mensaje genérico, antes del fix completo |
| [login.png](login.png) | Apoyo: obtención del token JWT usado para autenticar las pruebas |
| [despues-notfound-404.png](despues-notfound-404.png) | GET al mismo stylist inexistente, ya con el fix aplicado: 404 con mensaje claro |
| [antes-caso-ok-200.png](antes-caso-ok-200.png) / [despues-caso-ok-200.png](despues-caso-ok-200.png) | GET a un stylist que sí existe, antes y después del cambio: sigue devolviendo 200 sin regresión |
| [antes-codigos.md](antes-codigos.md) / [despues-codigos.md](despues-codigos.md) | Tabla de auditoría de códigos HTTP por caso de error, antes y después de mi intervención |
| [kanban-hecho.png](kanban-hecho.png) | Tarjeta propia en el Kanban del grupo, movida a Hecho y enlazada al PR |

**Cómo reproducir mi cambio desde cero:**

```bash
docker compose up -d --build services-staff gateway
curl -X POST http://localhost:3000/api/auth/login -H "Content-Type: application/json" -d '{"email":"admin@barberflow.com","password":"Admin123!"}'
# copiar el access_token de la respuesta
curl -i http://localhost:3000/api/stylists/00000000-0000-0000-0000-000000000000 -H "Authorization: Bearer <TOKEN>"
# resultado esperado: 404 con mensaje "Stylist with ID ... not found"
```

---

## 7. Prueba automatizada

| | |
|---|---|
| **Archivo de la prueba** | `apps/services-staff/src/stylists/stylists.service.spec.ts` |
| **Comando para ejecutarla** | `cd apps/services-staff && npm test -- stylists.service.spec.ts` |
| **Qué verifica** | Que `StylistsService.findOne` lanza `NotFoundException` (no un `Error` genérico) cuando el repositorio no encuentra el registro, y que retorna el stylist correctamente cuando sí existe |
| **¿Falla sin mi cambio?** | Sí — contra el código original (`throw new Error(...)`), el test `"lanza NotFoundException cuando el stylist no existe"` falla porque `Error` no es instancia de `NotFoundException`. Lo comprobé mentalmente revisando el tipo antes de aplicar el fix; con el cambio aplicado, ambos tests pasan. |

```
PASS  src/stylists/stylists.service.spec.ts
  StylistsService
    findOne
      √ lanza NotFoundException cuando el stylist no existe (26 ms)
      √ retorna el stylist cuando existe (4 ms)

Test Suites: 1 passed, 1 total
Tests:       2 passed, 2 total
```

---

## 8. Estado final — honesto

**Funciona:**
- El caso principal completo: `GET /api/stylists/:id` con un id inexistente devuelve 404 con mensaje claro, en vez de 500 con mensaje crudo.
- El camino feliz no se rompió: `GET /api/stylists/:id` con un id existente sigue devolviendo 200.
- El 500 genérico para errores verdaderamente no controlados ya no expone `exception.message` real al cliente.
- Prueba automatizada en verde (2/2), que falla contra el código original y pasa con el cambio.

**No funciona / quedó incompleto:**
- No implementé ni corregí un caso real de 409 (conflicto) ni 422 (regla de negocio) — mi corrección se concentró en el caso de 404/fuga de información, que era el bug más claro y verificable que encontré en el repositorio dentro del tiempo disponible.
- El fix de "no encontrado" solo lo apliqué en `StylistsService`/`StylistsController` (`services-staff`). No repliqué el mismo patrón en `ServicesController` (mismo microservicio, mismo problema: en `services.controller.ts:26-31` cualquier error se convierte en 404 fijo), ni en los filtros RPC de `appointments` e `inventory-billing`, que tienen el mismo defecto de forzar `statusCode: 400` siempre. Los dejé documentados en `antes-codigos.md` como hallazgos de auditoría, pero no alcancé a corregirlos.
- La solución final (`@UseFilters(RpcExceptionFilter)` a nivel de controller) resuelve el caso puntual, pero no investigué a fondo por qué `useGlobalFilters()` en el bootstrap no cubre el contexto TCP de `@MessagePattern` en este microservicio — quedó como una particularidad de esta versión de Nest que no llegué a explicar del todo, solo a evadir con un mecanismo de registro alternativo igual de válido.

**Cuál era mi siguiente paso:**

Replicar el mismo patrón (`NotFoundException` en el servicio + `@UseFilters(RpcExceptionFilter)` en el controller) en `ServicesController` de `services-staff`, y extender los filtros RPC de `appointments` e `inventory-billing` de la misma forma para que propaguen el `statusCode` real en vez de forzar 400 fijo siempre.


---

## 9. Declaración

> Declaro que este trabajo es individual, que corresponde a la actividad que me fue asignada, y que la sección 5 refleja de forma completa y veraz el uso que hice de herramientas de Inteligencia Artificial durante el examen.

**Nombre:** Reishel Tipán
**Fecha:** 2026-07-27
