const assert = require('node:assert/strict');
const test = require('node:test');
const request = require('supertest');
const { createApp } = require('../src/server');

const alice = { Authorization: 'Bearer demo-alice-token' };
const bob = { Authorization: 'Bearer demo-bob-token' };
const admin = { Authorization: 'Bearer demo-admin-token' };

function api() {
  return request(createApp());
}

test('TC-01 restablece los datos de demostración de forma controlada', async () => {
  const response = await api().post('/test/reset').set(admin);

  assert.equal(response.status, 200);
  assert.deepEqual(response.body, { message: 'Datos de demostración restablecidos', seedCount: 3 });
});

test('TC-02 lista solo pedidos propios con metadatos de paginación', async () => {
  const response = await api().get('/orders?page=1&limit=1').set(alice);

  assert.equal(response.status, 200);
  assert.deepEqual(response.body.pagination, { page: 1, limit: 1, totalItems: 2, totalPages: 2 });
  assert.equal(response.body.items[0].id, 'alice-seed-001');
  assert.equal(response.body.items[0].ownerId, 'alice');
});

test('TC-03 entrega una segunda página distinta', async () => {
  const response = await api().get('/orders?page=2&limit=1').set(alice);

  assert.equal(response.status, 200);
  assert.equal(response.body.items.length, 1);
  assert.equal(response.body.items[0].id, 'alice-seed-002');
});

test('TC-04 crea un pedido válido para el usuario autenticado', async () => {
  const response = await api()
    .post('/orders')
    .set(alice)
    .send({ product: 'Teclado mecánico', quantity: 2, shippingAddress: 'Zona 1, Ciudad de Guatemala' });

  assert.equal(response.status, 201);
  assert.equal(response.body.status, 'PENDING');
  assert.equal(response.body.ownerId, 'alice');
  assert.equal(response.body.statusChanges, 0);
  assert.match(response.body.id, /^order-\d+$/);
});

test('TC-05 consulta posteriormente el pedido creado', async () => {
  const client = api();
  const created = await client
    .post('/orders')
    .set(alice)
    .send({ product: 'Mouse', quantity: 1, shippingAddress: 'Zona 10, Ciudad de Guatemala' });
  const response = await client.get(`/orders/${created.body.id}`).set(alice);

  assert.equal(response.status, 200);
  assert.equal(response.body.id, created.body.id);
  assert.equal(response.body.product, 'Mouse');
});

test('TC-06 rechaza campos obligatorios ausentes', async () => {
  const response = await api().post('/orders').set(alice).send({ quantity: 1, shippingAddress: 'Zona 1' });

  assert.equal(response.status, 422);
  assert.equal(response.body.error, 'VALIDATION_ERROR');
  assert.match(response.body.message, /product/i);
});

test('TC-07 rechaza una cantidad fuera de rango', async () => {
  const response = await api()
    .post('/orders')
    .set(alice)
    .send({ product: 'Mouse', quantity: 0, shippingAddress: 'Zona 1' });

  assert.equal(response.status, 422);
  assert.equal(response.body.error, 'VALIDATION_ERROR');
  assert.match(response.body.message, /quantity/i);
});

test('TC-08 rechaza una solicitud sin credenciales', async () => {
  const response = await api().get('/orders');

  assert.equal(response.status, 401);
  assert.equal(response.body.error, 'UNAUTHORIZED');
});

test('TC-09 rechaza una credencial inválida', async () => {
  const response = await api().get('/orders').set('Authorization', 'Bearer invalid-token');

  assert.equal(response.status, 401);
  assert.equal(response.body.error, 'UNAUTHORIZED');
});

test('TC-10 no expone a Bob un pedido que pertenece a Alice', async () => {
  const response = await api().get('/orders/alice-seed-001').set(bob);

  assert.equal(response.status, 404);
  assert.equal(response.body.error, 'NOT_FOUND');
});

test('TC-11 informa un recurso inexistente', async () => {
  const response = await api().get('/orders/order-does-not-exist').set(alice);

  assert.equal(response.status, 404);
  assert.equal(response.body.error, 'NOT_FOUND');
});

test('TC-12 cambia el estado y registra un único efecto', async () => {
  const response = await api()
    .put('/orders/alice-seed-001/status')
    .set(alice)
    .send({ status: 'PAID' });

  assert.equal(response.status, 200);
  assert.equal(response.body.status, 'PAID');
  assert.equal(response.body.statusChanges, 1);
});

test('TC-13 repetir el mismo cambio no duplica su efecto', async () => {
  const client = api();
  await client.put('/orders/alice-seed-001/status').set(alice).send({ status: 'PAID' });
  const repeated = await client.put('/orders/alice-seed-001/status').set(alice).send({ status: 'PAID' });

  assert.equal(repeated.status, 200);
  assert.equal(repeated.body.status, 'PAID');
  assert.equal(repeated.body.statusChanges, 1);
});

test('TC-14 confirma el efecto final persistido de la operación idempotente', async () => {
  const client = api();
  await client.put('/orders/alice-seed-001/status').set(alice).send({ status: 'PAID' });
  await client.put('/orders/alice-seed-001/status').set(alice).send({ status: 'PAID' });
  const response = await client.get('/orders/alice-seed-001').set(alice);

  assert.equal(response.status, 200);
  assert.equal(response.body.status, 'PAID');
  assert.equal(response.body.statusChanges, 1);
});
