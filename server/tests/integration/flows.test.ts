import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import mongoose from 'mongoose';
import { MongoMemoryReplSet } from 'mongodb-memory-server';
import { createApp } from '../../src/app.js';
import {
  User,
  Product,
  Supplier,
  Wholesaler,
  GRN,
  RawStock,
  StockMovement,
  Batch,
  FinishedStock,
  Order,
} from '../../src/db/models/index.js';

let mongod: MongoMemoryReplSet;
const app = createApp();

const testHeader = (user: { firebaseUid: string; email: string }) => ({
  'x-test-user': JSON.stringify({ uid: user.firebaseUid, email: user.email }),
});

async function createOwner() {
  return User.create({
    firebaseUid: `uid-owner-${Date.now()}`,
    email: `owner-${Date.now()}@test.local`,
    role: 'OWNER',
  });
}

async function createWholesalerUser(wholesalerId: mongoose.Types.ObjectId) {
  return User.create({
    firebaseUid: `uid-wh-${Date.now()}`,
    email: `wh-${Date.now()}@test.local`,
    role: 'WHOLESALER',
    wholesalerId,
  });
}

beforeAll(async () => {
  process.env.NODE_ENV = 'test';
  mongod = await MongoMemoryReplSet.create({ replSet: { count: 1 } });
  await mongoose.connect(mongod.getUri());
});

beforeEach(async () => {
  if (mongoose.connection.db) {
    await mongoose.connection.db.dropDatabase();
  }
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongod.stop();
});

describe('Inventory flows', () => {
  it('blocks direct DISPATCHED status updates', async () => {
    const owner = await createOwner();
    const wholesaler = await Wholesaler.create({ name: 'W1' });
    const product = await Product.create({ type: 'FINISHED_GOOD', sku: 'FG-1', name: 'Finished', unit: 'units' });
    const order = await Order.create({
      wholesalerId: wholesaler._id,
      items: [{ finishedProductId: product._id, qty: 1, unit: 'units' }],
      status: 'DRAFT',
      createdBy: owner._id,
    });

    const res = await request(app)
      .patch(`/api/orders/${order._id}/status`)
      .set(testHeader(owner))
      .send({ status: 'DISPATCHED' });

    expect(res.status).toBe(400);
  });

  it('confirms GRN and updates raw stock + movements', async () => {
    const owner = await createOwner();
    const supplier = await Supplier.create({ name: 'S1' });
    const raw = await Product.create({ type: 'RAW_MATERIAL', sku: 'RAW-1', name: 'Sugar', unit: 'kg' });

    const createRes = await request(app)
      .post('/api/grns')
      .set(testHeader(owner))
      .send({
        supplierId: supplier._id.toString(),
        items: [{ rawMaterialId: raw._id.toString(), qty: 10, unitCost: 5, unit: 'kg' }],
      });

    const confirmRes = await request(app)
      .post(`/api/grns/${createRes.body.data._id}/confirm`)
      .set(testHeader(owner));

    expect(confirmRes.status).toBe(200);
    const stock = await RawStock.findOne({ productId: raw._id });
    const moves = await StockMovement.find({ referenceId: createRes.body.data._id });
    expect(stock?.quantity).toBe(10);
    expect(moves.length).toBe(1);
  });

  it('completes batch and creates finished stock', async () => {
    const owner = await createOwner();
    const raw = await Product.create({ type: 'RAW_MATERIAL', sku: 'RAW-2', name: 'Milk', unit: 'l' });
    const finished = await Product.create({ type: 'FINISHED_GOOD', sku: 'FG-2', name: 'Dessert', unit: 'units' });
    await RawStock.create({ productId: raw._id, quantity: 100, unit: 'l' });

    const batchRes = await request(app)
      .post('/api/batches')
      .set(testHeader(owner))
      .send({ finishedProductId: finished._id.toString(), plannedQty: 10 });

    await request(app)
      .post(`/api/batches/${batchRes.body.data._id}/start`)
      .set(testHeader(owner));

    const completeRes = await request(app)
      .post(`/api/batches/${batchRes.body.data._id}/complete`)
      .set(testHeader(owner))
      .send({
        actualQtyProduced: 8,
        consumption: [{ rawMaterialId: raw._id.toString(), qtyPlanned: 8, qtyActual: 8, unit: 'l' }],
        wastageQty: 2,
      });

    expect(completeRes.status).toBe(200);
    const fs = await FinishedStock.findOne({ batchId: batchRes.body.data._id });
    expect(fs?.quantity).toBe(8);
  });

  it('prevents wholesaler from accessing internal reports', async () => {
    const wholesaler = await Wholesaler.create({ name: 'W2' });
    const user = await createWholesalerUser(wholesaler._id);

    const res = await request(app)
      .get('/api/reports/stock-on-hand')
      .set(testHeader(user));

    expect(res.status).toBe(403);
  });
});
