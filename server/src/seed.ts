/**
 * Seed script: run with npm run seed (from server dir) or npm run seed --workspace=server
 * Requires: MONGODB_URI, OWNER_EMAIL, OWNER_FIREBASE_UID (Firebase Auth UID for OWNER_EMAIL)
 * Create the Firebase Auth user first, then copy UID to OWNER_FIREBASE_UID.
 */
import dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';
import {
  User,
  Product,
  Supplier,
  Wholesaler,
  BOM,
  GRN,
  Batch,
  RawStock,
  FinishedStock,
  StockMovement,
  Order,
  Dispatch,
} from './db/models/index.js';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/factory_inventory';
const OWNER_EMAIL = process.env.OWNER_EMAIL || 'owner@factory.com';
const OWNER_FIREBASE_UID = process.env.OWNER_FIREBASE_UID || '';

async function seed() {
  await mongoose.connect(MONGODB_URI);
  console.log('Connected to MongoDB');

  const existingOwner = await User.findOne({ email: OWNER_EMAIL });
  if (!existingOwner && !OWNER_FIREBASE_UID) {
    console.warn('OWNER_FIREBASE_UID not set. Create a Firebase Auth user with email:', OWNER_EMAIL);
    console.warn('Then set OWNER_FIREBASE_UID to that user UID and re-run seed.');
  }

  const owner =
    existingOwner ||
    (await User.create({
      firebaseUid: OWNER_FIREBASE_UID || `seed-owner-${Date.now()}`,
      email: OWNER_EMAIL,
      displayName: 'Owner',
      role: 'OWNER',
    }));
  console.log('Owner user:', owner.email);

  const supplier = await Supplier.findOne({ name: 'Sample Supplier' }) || (await Supplier.create({
    name: 'Sample Supplier',
    contactPerson: 'John',
    phone: '+94110000000',
    email: 'supplier@example.com',
    address: '123 Supplier St',
  }));

  const wholesaler = await Wholesaler.findOne({ name: 'Sample Wholesaler' }) || (await Wholesaler.create({
    name: 'Sample Wholesaler',
    contactPerson: 'Jane',
    phone: '+94111111111',
    email: 'wholesaler@example.com',
    address: '456 Wholesaler Ave',
  }));

  const raw1 = await Product.findOne({ sku: 'RAW-SUGAR' }) || (await Product.create({
    type: 'RAW_MATERIAL',
    sku: 'RAW-SUGAR',
    name: 'Sugar',
    unit: 'kg',
    category: 'Dry',
    reorderLevel: 100,
    cost: 150,
  }));
  const raw2 = await Product.findOne({ sku: 'RAW-EGG' }) || (await Product.create({
    type: 'RAW_MATERIAL',
    sku: 'RAW-EGG',
    name: 'Eggs',
    unit: 'units',
    category: 'Fresh',
    reorderLevel: 50,
    cost: 25,
  }));
  const raw3 = await Product.findOne({ sku: 'RAW-JACKFRUIT' }) || (await Product.create({
    type: 'RAW_MATERIAL',
    sku: 'RAW-JACKFRUIT',
    name: 'Jackfruit Pulp',
    unit: 'kg',
    category: 'Fresh',
    reorderLevel: 20,
    cost: 200,
  }));

  const finished1 = await Product.findOne({ sku: 'FG-WATALAPPAN' }) || (await Product.create({
    type: 'FINISHED_GOOD',
    sku: 'FG-WATALAPPAN',
    name: 'Watalappan',
    unit: 'units',
    category: 'Dessert',
    reorderLevel: 50,
    sellingPrice: 120,
  }));
  const finished2 = await Product.findOne({ sku: 'FG-ICE-PACK' }) || (await Product.create({
    type: 'FINISHED_GOOD',
    sku: 'FG-ICE-PACK',
    name: 'Ice Packet',
    unit: 'units',
    category: 'Frozen',
    reorderLevel: 100,
    sellingPrice: 30,
  }));

  let bom = await BOM.findOne({ finishedProductId: finished1._id });
  if (!bom) {
    bom = await BOM.create({
      finishedProductId: finished1._id,
      components: [
        { rawMaterialId: raw1._id, qtyPerUnit: 0.2, unit: 'kg' },
        { rawMaterialId: raw2._id, qtyPerUnit: 2, unit: 'units' },
        { rawMaterialId: raw3._id, qtyPerUnit: 0.1, unit: 'kg' },
      ],
    });
  }

  let grn = await GRN.findOne({ status: 'CONFIRMED' }).sort({ createdAt: -1 });
  if (!grn) {
    grn = await GRN.create({
      supplierId: supplier._id,
      date: new Date(),
      items: [
        { rawMaterialId: raw1._id, qty: 500, unitCost: 150, unit: 'kg' },
        { rawMaterialId: raw2._id, qty: 200, unitCost: 25, unit: 'units' },
        { rawMaterialId: raw3._id, qty: 50, unitCost: 200, unit: 'kg' },
      ],
      status: 'DRAFT',
      createdBy: owner._id,
    });
    grn.status = 'CONFIRMED';
    grn.confirmedBy = owner._id;
    grn.confirmedAt = new Date();
    await grn.save();

    for (const item of grn.items) {
      let rs = await RawStock.findOne({ productId: item.rawMaterialId });
      if (!rs) rs = await RawStock.create({ productId: item.rawMaterialId, quantity: 0, unit: item.unit });
      rs.quantity += item.qty;
      await rs.save();
      await StockMovement.create({
        type: 'GRN_IN',
        productId: item.rawMaterialId,
        qty: item.qty,
        unit: item.unit,
        referenceId: grn._id,
        referenceType: 'GRN',
        userId: owner._id,
      });
    }
  }

  let batch = await Batch.findOne({ status: 'COMPLETED' }).sort({ createdAt: -1 });
  if (!batch) {
    const batchId = `BATCH-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-0001`;
    batch = await Batch.create({
      batchId,
      finishedProductId: finished1._id,
      plannedQty: 50,
      actualQtyProduced: 48,
      manufactureDate: new Date(),
      expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      status: 'DRAFT',
      consumption: [],
      wastageQty: 2,
      wastageReason: 'Sample wastage',
      createdBy: owner._id,
    });
    batch.status = 'IN_PROGRESS';
    await batch.save();
    batch.consumption = [
      { rawMaterialId: raw1._id, qtyPlanned: 10, qtyActual: 10, unit: 'kg', reasonOverride: undefined },
      { rawMaterialId: raw2._id, qtyPlanned: 96, qtyActual: 96, unit: 'units', reasonOverride: undefined },
      { rawMaterialId: raw3._id, qtyPlanned: 4.8, qtyActual: 4.8, unit: 'kg', reasonOverride: undefined },
    ];
    batch.actualQtyProduced = 48;
    batch.wastageQty = 2;
    batch.wastageReason = 'Sample wastage';
    batch.status = 'COMPLETED';
    batch.completedAt = new Date();
    await batch.save();

    for (const c of batch.consumption) {
      const rs = await RawStock.findOne({ productId: c.rawMaterialId });
      if (rs) {
        rs.quantity -= c.qtyActual;
        await rs.save();
      }
      await StockMovement.create({
        type: 'PROD_CONSUME',
        productId: c.rawMaterialId,
        batchId: batch._id,
        qty: -c.qtyActual,
        unit: c.unit,
        referenceId: batch._id,
        referenceType: 'Batch',
        userId: owner._id,
      });
    }
    await FinishedStock.create({
      productId: finished1._id,
      batchId: batch._id,
      quantity: 48,
      unit: 'units',
      expiryDate: batch.expiryDate,
    });
    await StockMovement.create({
      type: 'PROD_OUTPUT',
      productId: finished1._id,
      batchId: batch._id,
      qty: 48,
      unit: 'units',
      referenceId: batch._id,
      referenceType: 'Batch',
      userId: owner._id,
    });
  }

  let order = await Order.findOne({ status: 'DISPATCHED' }).sort({ createdAt: -1 });
  if (!order) {
    order = await Order.create({
      wholesalerId: wholesaler._id,
      items: [{ finishedProductId: finished1._id, qty: 10, unit: 'units' }],
      status: 'DRAFT',
      createdBy: owner._id,
    });
    order.status = 'CONFIRMED';
    order.confirmedBy = owner._id;
    order.confirmedAt = new Date();
    await order.save();

    const allocs = [
      { batchId: batch._id, productId: finished1._id, qty: 10, unit: 'units' },
    ];
    const fs = await FinishedStock.findOne({ productId: finished1._id, batchId: batch._id });
    if (fs && fs.quantity >= 10) {
      fs.quantity -= 10;
      await fs.save();
      await StockMovement.create({
        type: 'DISPATCH_OUT',
        productId: finished1._id,
        batchId: batch._id,
        qty: -10,
        unit: 'units',
        referenceId: order._id,
        referenceType: 'Order',
        userId: owner._id,
      });
      await Dispatch.create({
        orderId: order._id,
        allocations: allocs,
        dispatchedBy: owner._id,
        dispatchedAt: new Date(),
      });
      order.status = 'DISPATCHED';
      await order.save();
    }
  }

  console.log('Seed completed.');
  console.log('Owner:', owner.email);
  console.log('Supplier:', supplier.name);
  console.log('Wholesaler:', wholesaler.name);
  console.log('Products: raw', [raw1.sku, raw2.sku, raw3.sku].join(', '), '| finished', [finished1.sku, finished2.sku].join(', '));
  console.log('BOM for', finished1.name, '| GRN confirmed | Batch completed | Order dispatched');
  await mongoose.disconnect();
  process.exit(0);
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
