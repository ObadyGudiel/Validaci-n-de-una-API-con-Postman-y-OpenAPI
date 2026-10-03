const express = require('express');

const usersByToken = {
  'demo-alice-token': { id: 'alice', role: 'customer' },
  'demo-bob-token': { id: 'bob', role: 'customer' },
  'demo-admin-token': { id: 'admin', role: 'test-admin' }
};

function seedOrders() {
  return [
    {
      id: 'alice-seed-001',
      ownerId: 'alice',
      product: 'Cuaderno',
      quantity: 1,
      shippingAddress: 'Zona 1, Ciudad de Guatemala',
      status: 'PENDING',
      statusChanges: 0,
      createdAt: '2026-10-03T00:00:00.000Z'
    },
    {
      id: 'alice-seed-002',
      ownerId: 'alice',
      product: 'Lapicero',
      quantity: 3,
      shippingAddress: 'Zona 10, Ciudad de Guatemala',
      status: 'PENDING',
      statusChanges: 0,
      createdAt: '2026-10-03T00:01:00.000Z'
    },
    {
      id: 'bob-seed-001',
      ownerId: 'bob',
      product: 'Mochila',
      quantity: 1,
      shippingAddress: 'Zona 4, Ciudad de Guatemala',
      status: 'PENDING',
      statusChanges: 0,
      createdAt: '2026-10-03T00:02:00.000Z'
    }
  ];
}

function errorBody(error, message, details) {
  return details ? { error, message, details } : { error, message };
}

function createApp() {
  const app = express();
  let orders = seedOrders();
  let nextOrderNumber = 1;

  app.use(express.json());

  function authenticate(req, res, next) {
    const header = req.get('Authorization');
    const token = header && header.startsWith('Bearer ') ? header.slice(7) : null;
    const user = token && usersByToken[token];

    if (!user) {
      return res.status(401).json(errorBody('UNAUTHORIZED', 'Credenciales ausentes o inválidas'));
    }

    req.user = user;
    return next();
  }

  function findOwnedOrder(id, ownerId) {
    return orders.find((order) => order.id === id && order.ownerId === ownerId);
  }

  app.post('/test/reset', authenticate, (req, res) => {
    if (req.user.role !== 'test-admin') {
      return res.status(404).json(errorBody('NOT_FOUND', 'Recurso no encontrado'));
    }

    orders = seedOrders();
    nextOrderNumber = 1;
    return res.status(200).json({ message: 'Datos de demostración restablecidos', seedCount: orders.length });
  });

  app.get('/orders', authenticate, (req, res) => {
    const page = Number(req.query.page ?? 1);
    const limit = Number(req.query.limit ?? 10);

    if (!Number.isInteger(page) || page < 1 || !Number.isInteger(limit) || limit < 1 || limit > 50) {
      return res.status(400).json(errorBody('BAD_REQUEST', 'page debe ser mayor o igual que 1 y limit debe estar entre 1 y 50'));
    }

    const ownOrders = orders.filter((order) => order.ownerId === req.user.id);
    const totalItems = ownOrders.length;
    const totalPages = Math.ceil(totalItems / limit);
    const start = (page - 1) * limit;

    return res.status(200).json({
      items: ownOrders.slice(start, start + limit),
      pagination: { page, limit, totalItems, totalPages }
    });
  });

  app.post('/orders', authenticate, (req, res) => {
    const { product, quantity, shippingAddress } = req.body ?? {};
    const details = [];

    if (typeof product !== 'string' || !product.trim()) details.push('product es obligatorio');
    if (!Number.isInteger(quantity) || quantity < 1 || quantity > 100) details.push('quantity debe ser un entero entre 1 y 100');
    if (typeof shippingAddress !== 'string' || !shippingAddress.trim()) details.push('shippingAddress es obligatorio');

    if (details.length > 0) {
      return res.status(422).json(errorBody('VALIDATION_ERROR', details[0], details));
    }

    const order = {
      id: `order-${nextOrderNumber++}`,
      ownerId: req.user.id,
      product: product.trim(),
      quantity,
      shippingAddress: shippingAddress.trim(),
      status: 'PENDING',
      statusChanges: 0,
      createdAt: new Date().toISOString()
    };
    orders.push(order);
    return res.status(201).json(order);
  });

  app.get('/orders/:id', authenticate, (req, res) => {
    const order = findOwnedOrder(req.params.id, req.user.id);
    if (!order) {
      return res.status(404).json(errorBody('NOT_FOUND', 'Pedido no encontrado'));
    }

    return res.status(200).json(order);
  });

  app.put('/orders/:id/status', authenticate, (req, res) => {
    const order = findOwnedOrder(req.params.id, req.user.id);
    if (!order) {
      return res.status(404).json(errorBody('NOT_FOUND', 'Pedido no encontrado'));
    }

    const { status } = req.body ?? {};
    if (!['PENDING', 'PAID', 'CANCELLED'].includes(status)) {
      return res.status(422).json(errorBody('VALIDATION_ERROR', 'status debe ser PENDING, PAID o CANCELLED', ['status inválido']));
    }

    if (order.status !== status) {
      order.status = status;
      order.statusChanges += 1;
    }
    return res.status(200).json(order);
  });

  app.use((error, req, res, next) => {
    if (error instanceof SyntaxError && 'body' in error) {
      return res.status(400).json(errorBody('BAD_REQUEST', 'El cuerpo JSON no es válido'));
    }
    return next(error);
  });

  return app;
}

if (require.main === module) {
  const port = Number(process.env.PORT ?? 3000);
  createApp().listen(port, () => {
    console.log(`API de pedidos disponible en http://localhost:${port}`);
  });
}

module.exports = { createApp };
