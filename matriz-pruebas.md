# Matriz de pruebas

| ID | Operación | Riesgo | Precondiciones | Datos | Resultado esperado y aserciones | Limpieza |
| --- | --- | --- | --- | --- | --- | --- |
| TC-01 | `POST /test/reset` | Estado no reproducible | API iniciada; token de administrador de prueba | `demo-admin-token` | `200`; `message` texto; `seedCount` entero igual a 3 | La propia operación restaura los datos |
| TC-02 | `GET /orders?page=1&limit=1` | Se filtran pedidos de otro usuario o se rompe el esquema | TC-01 ejecutado; Alice autenticada | Token Alice | `200`; `items` arreglo; primer ID `alice-seed-001`; dueño Alice; `statusChanges` numérico; metadatos 1/1/2/2 | Ninguna |
| TC-03 | `GET /orders?page=2&limit=1` | Paginación repite u omite elementos | TC-01 ejecutado; Alice autenticada | Token Alice | `200`; solo `alice-seed-002`; página distinta de TC-02 | Ninguna |
| TC-04 | `POST /orders` | Pedido válido no se crea o se asigna a otro usuario | TC-01 ejecutado; Alice autenticada | Producto, cantidad 2, dirección | `201`; pedido con ID nuevo, dueño Alice, `PENDING`, contador 0; se guarda el ID | TC-01 en próxima ejecución |
| TC-05 | `GET /orders/{id creado}` | No persiste el cambio creado | TC-04 ejecutado; Alice autenticada | Variable `createdOrderId` | `200`; mismo ID y producto `Teclado mecánico` | TC-01 en próxima ejecución |
| TC-06 | `POST /orders` | Se aceptan campos obligatorios ausentes | Alice autenticada | Sin `product` | `422`; error `VALIDATION_ERROR`; mensaje menciona `product` | No crea datos |
| TC-07 | `POST /orders` | Se aceptan cantidades inválidas | Alice autenticada | `quantity: 0` | `422`; error `VALIDATION_ERROR`; mensaje menciona `quantity` | No crea datos |
| TC-08 | `GET /orders` | Se permite acceso sin credenciales | Ninguna | Sin encabezado Authorization | `401`; esquema de error con `error` y `message` | Ninguna |
| TC-09 | `GET /orders` | Se permite token falso | Ninguna | `invalid-token` | `401`; error `UNAUTHORIZED` | Ninguna |
| TC-10 | `GET /orders/alice-seed-001` | Acceso a recurso ajeno | TC-01 ejecutado; Bob autenticado | Token Bob | `404`; no devuelve el pedido de Alice | Ninguna |
| TC-11 | `GET /orders/order-does-not-exist` | Manejo ambiguo de inexistentes | Alice autenticada | ID no existente | `404`; error `NOT_FOUND` | Ninguna |
| TC-12 | `PUT /orders/alice-seed-001/status` | No aplica el estado ni registra el efecto | TC-01 ejecutado; Alice autenticada | `{ "status": "PAID" }` | `200`; `status` PAID y `statusChanges` numérico igual a 1 | TC-01 en próxima ejecución |
| TC-13 | Repetición de `PUT /orders/alice-seed-001/status` | Se duplica el efecto de una operación idempotente | TC-12 ejecutado; Alice autenticada | Mismo cuerpo de TC-12 | `200`; PAID; contador continúa en 1 | TC-01 en próxima ejecución |
| TC-14 | `GET /orders/alice-seed-001` | La respuesta de repetición oculta un efecto no persistido | TC-13 ejecutado; Alice autenticada | ID de semilla | `200`; efecto final persistido: PAID y contador 1 | TC-01 en próxima ejecución |

Las comprobaciones de tipo y campos en Postman validan los cuerpos usados por los casos (por ejemplo, `statusChanges` numérico). La especificación `openapi.yaml` documenta el contrato integral de operaciones, parámetros, seguridad y respuestas; una colección no sustituye por sí sola una validación completa de OpenAPI.
