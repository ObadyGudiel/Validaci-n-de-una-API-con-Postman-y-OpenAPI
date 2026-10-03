# Incompatibilidad controlada

Fecha de ejecución: 3 de octubre de 2026.

Se cambió temporalmente el valor inicial de `statusChanges` en `src/server.js` de número a texto (`'0'`). El contrato [`openapi.yaml`](../openapi.yaml) exige un `integer` con mínimo 0. La colección no se modificó y el contrato tampoco se debilitó.

Comando ejecutado:

```powershell
node_modules\.bin\newman.cmd run postman\orders.postman_collection.json -e postman\local.example.postman_environment.json --reporters cli,json --reporter-json-export evidence\controlled-failure-result.json
```

Resultado real: 14 solicitudes, 14 aserciones y 4 fallos. Los fallos relevantes fueron:

1. `TC-02`: se esperaba que `statusChanges` fuera numérico, pero se recibió `'0'`.
2. `TC-12`, `TC-13` y `TC-14`: el incremento sobre texto produjo `'01'` en lugar del entero `1`, por lo que también falló la verificación del efecto final idempotente.

Después de conservar [`controlled-failure-result.json`](controlled-failure-result.json), se restauró el tipo numérico. La ejecución corregida se conserva en [`latest-collection-result.json`](latest-collection-result.json).
