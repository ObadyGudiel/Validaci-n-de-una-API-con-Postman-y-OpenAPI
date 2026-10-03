# Validación de una API de pedidos con Postman y OpenAPI

Proyecto individual para demostrar reglas funcionales y contrato de una API mediante OpenAPI 3.1 y una colección automatizada de Postman.

## Requisitos y versiones

- Node.js 20 o posterior (verificado: 24.20.0).
- npm 10 o posterior (verificado: 11.19.0).
- Postman Desktop 11 o posterior **o** Newman 6.2.2 o posterior (verificado: 6.2.2).

La colección usa el formato Postman Collection v2.1 y el ambiente fue exportado para Postman 11. Puede volver a consultar las versiones con `npm run versions`.

## Preparación e inicio

1. Instale dependencias:

   ```powershell
   npm install
   ```

2. Inicie la API en una terminal:

   ```powershell
   npm start
   ```

   La API queda disponible en `http://localhost:3000` y reinicia sus datos controlados en cada inicio.

3. Importe en Postman los archivos de `postman/`:

   - `orders.postman_collection.json`
   - `local.example.postman_environment.json`

4. Seleccione el ambiente **Pedidos local (ejemplo)** y ejecute toda la colección con Collection Runner. La primera solicitud de preparación restablece el estado; por ello, la colección no depende de IDs de otra ejecución.

## Ejecución automatizada

Con la API iniciada en otra terminal, ejecute la colección con Newman:

```powershell
npm run collection
```

El comando genera `evidence/latest-collection-result.json` y debe informar 14 solicitudes y 14 aserciones sin fallos.

También puede usar Postman CLI:

```powershell
postman collection run postman/orders.postman_collection.json -e postman/local.example.postman_environment.json
```

También puede ejecutar las pruebas de la API:

```powershell
npm test
```

## Usuarios de demostración

Los siguientes valores son únicamente datos locales de prueba, no contraseñas ni secretos:

| Usuario | Token de demostración |
| --- | --- |
| Alice | `demo-alice-token` |
| Bob | `demo-bob-token` |

La colección los guarda como variables iniciales del ambiente de ejemplo para validar autenticación y permisos.

## Archivos de entrega

- `src/server.js`: API local de pedidos.
- `openapi.yaml`: contrato OpenAPI 3.1 de las operaciones evaluadas.
- `matriz-pruebas.md`: matriz de al menos doce casos y su trazabilidad.
- `postman/`: colección y ambiente exportable sin secretos.
- `evidence/`: resultados legibles del fallo de incompatibilidad controlado y de la corrección.

## Incompatibilidad controlada

La evidencia en `evidence/` muestra que devolver `statusChanges` como texto contradice el esquema que lo define como entero. La prueba de Postman falla con ese cambio local. Después de restaurar el tipo numérico, la misma colección aprueba. El contrato OpenAPI no se modifica para ocultar el defecto.

## Uso responsable de IA

Se utilizó IA como apoyo para proponer la estructura de casos, scripts y documentación. La persona autora debe ejecutar la colección, revisar cada aserción, verificar la evidencia y comprender las decisiones antes de entregar. No se utilizan secretos ni datos reales.
