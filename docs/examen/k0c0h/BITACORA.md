# Bitácora — Examen Final

---

## 0. Identificación

| | |
|---|---|
| **Nombre** | Kerlly Chiriboga |
| **Usuario GitHub** | @k0c0h |
| **Grupo / Proyecto** | Grupo 2 — Barber Flow |
| **Actividad asignada** | Actividad B — Nuevo salto síncrono con contrato |
| **Rama** | `exam/k0c0h` |
| **Tag** | `examen-k0c0h` |
| **Pull Request** | https://github.com/AlexDaniel593/barber-flow/pull/75 |
| **Tarjeta Kanban** | https://github.com/users/AlexDaniel593/projects/1/views/1?pane=issue&itemId=219052171&issue=AlexDaniel593%7Cbarber-flow%7C73 |
| **¿Hiciste el Paso 0?** | No — La base de gRPC y contratos proto ya existía en el archivo `apps/proto/barber.proto`. |

---

## 1. Qué construí

Añadí una nueva consulta de comunicación directa gRPC llamada `GetStylistWorkingHours` en el archivo de contrato compartido `barber.proto`. Esta funcionalidad permite al sistema consultar los horarios de trabajo y especialidades de un estilista directamente desde el microservicio propietario (`services-staff`), en lugar de duplicar o adivinar esa información en otros servicios. Implementé el manejador en el servidor con validación de datos para evitar IDs vacíos, consumí esta nueva función desde el microservicio de citas (`appointments`) y la expuse en el (`gateway`) a través de la ruta HTTP `GET /stylists/:id/working-hours`, asegurando que los errores de recurso no encontrado se devuelvan como un estado HTTP 404 y los errores de datos inválidos como 400, evitando así que la página colapse por algún error no controlado.

---

## 2. Anclaje con el repositorio de mi grupo — **obligatorio (C2)**

| Código preexistente | Archivo:línea | Cómo me conecto con él |
|---|---|---|
| Contrato protobuf del grupo | [`apps/proto/barber.proto:5-7`](file:///c:/Users/DELL/Documents/KERLLY/UNIVERSIDAD/SEXTO%20SEMESTRE/A.%20DISTRIBUIDAS/barber-flow/apps/proto/barber.proto#L5-L7) | Extendí la interfaz existente `StylistService` añadiendo la función `rpc GetStylistWorkingHours (StylistRequest) returns (StylistWorkingHoursResponse);`. |
| Conexión de cliente gRPC en appointments | [`apps/appointments/src/appointments/appointments.module.ts:34-44`](file:///c:/Users/DELL/Documents/KERLLY/UNIVERSIDAD/SEXTO%20SEMESTRE/A.%20DISTRIBUIDAS/barber-flow/apps/appointments/src/appointments/appointments.module.ts#L34-L44) | Reutilicé la configuración del cliente gRPC llamado `'STYLIST_GRPC_PACKAGE'` para invocar el nuevo método sin duplicar código ya existente. |
| Controlador gRPC en el microservicio de estilistas | [`apps/services-staff/src/stylists/stylists.controller.ts:13-30`](file:///c:/Users/DELL/Documents/KERLLY/UNIVERSIDAD/SEXTO%20SEMESTRE/A.%20DISTRIBUIDAS/barber-flow/apps/services-staff/src/stylists/stylists.controller.ts#L13-L30) | Creé el método `@GrpcMethod('StylistService', 'GetStylistWorkingHours')` adaptándome a la misma estructura y patrón que tenía el método `findOneStylist`. |
| Mapeo de patrones de mensajes en Gateway | [`apps/gateway/src/constants/index.ts:13-19`](file:///c:/Users/DELL/Documents/KERLLY/UNIVERSIDAD/SEXTO%20SEMESTRE/A.%20DISTRIBUIDAS/barber-flow/apps/gateway/src/constants/index.ts#L13-L19) | Agregué la constante `GET_WORKING_HOURS: 'stylists.getStylistWorkingHours'` dentro del objeto `stylistsMessagePatterns`. |

**¿Qué convención del repositorio seguí para que mi código no desentone?**
Seguí la estructura estándar de NestJS que usaba mi grupo y que fue enseñada en clase, manteniendo la arquitectura de transporte híbrida (TCP y gRPC), el uso de `lastValueFrom` de RxJS para manejar las llamadas entre microservicios, la conversión a JSON de los horarios de trabajo, y la propagación de errores mediante las excepciones nativas de gRPC (`RpcException` y `status`).

**¿Qué NO dupliqué, pudiendo hacerlo?**
No creé un archivo `.proto` nuevo ni una conexión gRPC separada. Utilicé el contrato `barber.proto` y el cliente gRPC `'STYLIST_GRPC_PACKAGE'` que mi grupo ya tenía configurado en `appointments.module.ts:36`.

---

## 3. Decisiones técnicas

### Decisión 1
- **Qué decidí:** Devolver errores de gRPC estructurados usando `status.NOT_FOUND` y `status.INVALID_ARGUMENT` dentro de `RpcException` en el microservicio `services-staff`.
- **Alternativa que descarté:** Retornar una respuesta simple con una propiedad de texto como `{ success: false, error: 'No existe' }`.
- **Por qué:** Usar los códigos nativos del protocolo gRPC permite que el gateway entienda exactamente el tipo de fallo que ocurrió y pueda responder al usuario o cliente web con los códigos HTTP estándar 404 (No encontrado) y 400 (Petición incorrecta), en lugar de siempre responder con un error 500 genérico.

### Decisión 2
- **Qué decidí:** Incluir tanto los horarios de atención (`workingHours`) como la lista de especialidades (`specialties`) en la respuesta del método `GetStylistWorkingHours`.
- **Alternativa que descarté:** Realizar dos consultas síncronas por separado (una para el estilista y otra para el horario).
- **Por qué:** Hacer múltiples peticiones de red para obtener datos relacionados ralentiza el sistema. Al incluir ambos datos en una sola respuesta síncrona, reduje el número de llamadas de red a una sola, haciendo la consulta más eficiente.

---

## 4. Las 3 preguntas de mi actividad

**Pregunta 1: ¿Por qué el contrato debe vivir en un lugar compartido y no duplicado dentro de cada servicio?**

> *Respuesta:* Porque el contrato en un archivo `.proto` es la regla oficial de cómo se comunican los servicios. Si copiamos y pegamos el archivo en cada servicio de forma independiente, corremos el riesgo de que alguien modifique una copia y olvide actualizar las demás. Esto provocaría que los servicios no esten actualizados, además de que sufran daños internos y se generen errores inesperados al intentar leer los mensajes recibidos.

**Pregunta 2: ¿Qué código de error del transporte elegiste para "no encontrado" y a qué código HTTP lo mapeas? ¿Por qué no es correcto devolver 500?**

> *Respuesta:* Elegí el código de gRPC `status.NOT_FOUND` (código numérico 5) y lo transformé en la puerta de enlace al código HTTP `404 Not Found`. No es correcto devolver 500 porque un error 500 significa que el servidor o la base de datos se cayeron o tuvieron una falla imprevista. Cuando un cliente busca un ID que no existe, es simplemente un error de búsqueda (el id no se encontró), por lo que el código correcto debe ser 404.

**Pregunta 3: Si mañana añades un campo nuevo al contrato, ¿siguen funcionando los clientes que no lo conocen? ¿Por qué?**

> *Respuesta:* Sí, siguen funcionando normalmente. El formato Protocol Buffers (proto3) puede llegar a ser compatible con versiones antiguas. Como cada dato dentro del mensaje usa un número identificador, los servicios antiguos que reciban una respuesta con un campo nuevo simplemente ignoran esa información que no conocen y continúan procesando el resto sin fallar.

---

## 5. Uso de Inteligencia Artificial — **obligatorio**

**¿Usaste IA en este examen?**  ☑ Sí  ☐ No

| # | Qué le pedí | Qué me devolvió | Qué corregí, adapté o descarté — y por qué |
|:--:|---|---|---|
| 1 | Le pedí ayuda para ubicar los archivos donde mi grupo definió la configuración de gRPC y contratos proto. | Me indicó los archivos `barber.proto`, `stylists.controller.ts` y `appointments.service.ts`. | Revisé el proyecto y verifiqué las líneas para asegurar que la información coincidía con el código real. |
| 2 | Le pedí una sugerencia de cómo escribir el método `@GrpcMethod` para consultar los horarios del estilista. | Me devolvió un método de ejemplo que usaba observables `of()` de RxJS en el controlador. | Descarté el uso de `of()` porque en los controladores NestJS se puede retornar directamente el objeto o la promesa desde la base de datos de manera más limpia. |
| 3 | Le solicité asistencia para estructurar la prueba unitaria en Jest que evalúa la respuesta cuando un ID está vacío. | Me dio la estructura básica de una prueba unitaria usando `@nestjs/testing`. | Adapté la verificación para evaluar específicamente que el código de error devuelto fuera `status.INVALID_ARGUMENT` en lugar de una validación de texto genérico. |

**¿En qué se equivocó respecto a mi repositorio?**
Al principio me sugería usar excepciones de HTTP (`NotFoundException`) directamente dentro del microservicio de estilistas (`services-staff`). Lo corregí porque ese microservicio se comunica por transporte gRPC (puerto 50051), por lo que debía usar `RpcException` con la librería `@grpc/grpc-js` para que el error viaje correctamente por el protocolo de red.

---

## 6. Evidencia

| Archivo | Qué demuestra |
|---|---|
| `docs/examen/k0c0h/antes-sin-metodo.txt` | Muestra que antes de mi cambio no existía la consulta de horarios en el archivo `.proto` ni en la puerta de enlace. |
| `docs/examen/k0c0h/despues-caso-ok.txt` | Muestra el resultado de la consulta exitosa devolviendo el estado 200 con el horario y especialidades del estilista. |
| `docs/examen/k0c0h/despues-caso-error.txt` | Demuestra cómo los errores de estilista no encontrado devuelven estado 404 y los de ID vacío devuelven estado 400. |
| `docs/examen/k0c0h/Captura de pantalla 2026-07-27 085101.png` | Captura del tablero Kanban en GitHub Projects con la tarjeta movida a Hecho. |

TABLERO KANBAN KERLLY CHIRIBOGA
![Tablero Kanban Kerlly Chiriboga](./Captura%20de%20pantalla%202026-07-27%20085101.png)

**Cómo reproducir mi cambio desde cero:**

```bash
# 1. Ubicarse en la rama de mi examen
git checkout exam/k0c0h

# 2. Ir a la carpeta del microservicio de estilistas
cd apps/services-staff

# 3. Ejecutar la prueba automatizada
npm test -- --testPathPattern=stylists.controller.spec
```

---

## 7. Prueba automatizada

| | |
|---|---|
| **Archivo de la prueba** | [`apps/services-staff/src/stylists/stylists.controller.spec.ts`](file:///c:/Users/DELL/Documents/KERLLY/UNIVERSIDAD/SEXTO%20SEMESTRE/A.%20DISTRIBUIDAS/barber-flow/apps/services-staff/src/stylists/stylists.controller.spec.ts) |
| **Comando para ejecutarla** | `npm test -- --testPathPattern=stylists.controller.spec` |
| **Qué verifica** | Comprueba que el nuevo método retorna los horarios y especialidades correctamente cuando el estilista existe, y que responde con los errores adecuados (`NOT_FOUND` e `INVALID_ARGUMENT`) cuando no existe o cuando el ID está vacío. |
| **¿Falla sin mi cambio?** | Sí — Si ejecutamos la prueba en la rama `main`, la prueba falla porque el método `getStylistWorkingHours` no existe en el controlador ni en el contrato síncrono. |

*Salida de la prueba pasando:*

```text
PS C:\Users\DELL\Documents\KERLLY\UNIVERSIDAD\A. DISTRIBUIDAS\barber-flow\apps\services-staff> npm test -- --testPathPattern=stylists.controller.spec

> ms-services-staff@1.0.0 test
> jest --testPathPattern=stylists.controller.spec

 PASS  src/stylists/stylists.controller.spec.ts (8.038 s)
  StylistsController — GetStylistWorkingHours (Actividad B)
    √ debe retornar workingHours y specialties cuando el estilista existe (38 ms)  
    √ debe lanzar RpcException NOT_FOUND cuando el estilista no existe (47 ms)     
    √ debe lanzar RpcException INVALID_ARGUMENT cuando el id esta vacio (9 ms)     
    √ debe lanzar RpcException INVALID_ARGUMENT cuando el id contiene solo espacios (5 ms)                                                                            
    √ debe manejar estilistas sin workingHours devolviendo JSON de objeto vacio (7 ms)                                                                                

Test Suites: 1 passed, 1 total
Tests:       5 passed, 5 total                                                     
Snapshots:   0 total
Time:        8.675 s, estimated 15 s
Ran all test suites matching /stylists.controller.spec/i.
PS C:\Users\DELL\Documents\KERLLY\UNIVERSIDAD\A. DISTRIBUIDAS\barber-flow\apps\services-staff>
```

---

## 8. Estado final — honesto

**Funciona:**
- La extensión del contrato `.proto` con la función `GetStylistWorkingHours`.
- El controlador del microservicio de estilistas procesando la consulta con validaciones y manejo de errores.
- La integración en el servicio de citas para consultar la disponibilidad sin duplicar datos.
- La ruta en la puerta de enlace (`GET /stylists/:id/working-hours`) traduciendo errores gRPC a respuestas HTTP 404 y 400.
- Las 5 pruebas unitarias automatizadas ejecutándose y pasando correctamente.

**No funciona / quedó incompleto:**
- Ninguno. La actividad asignada se completó

**Cuál era mi siguiente paso:**
- Realizar varias pruebas que validen la veracidad de mi código y su correcto funcioamiento, además de abrir el Pull Request hacia la rama `main` y publicar la etiqueta `examen-k0c0h`.

---

## 9. Declaración

> Declaro que este trabajo es individual, que corresponde a la actividad que me fue asignada, y que la sección 5 refleja de forma completa y veraz el uso que hice de herramientas de Inteligencia Artificial durante el examen.

**Nombre:** Kerlly Chiriboga  
**Fecha:** 27 de julio de 2026  
