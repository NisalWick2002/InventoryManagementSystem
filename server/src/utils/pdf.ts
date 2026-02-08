import PDFDocument from 'pdfkit';

export interface AllocationRow {
  allocation: { productId: unknown; batchId: unknown; qty: number; unit: string };
  product?: { name?: string };
  batch?: { batchId?: string };
}

export interface DeliveryNoteContext {
  dispatch: { _id: unknown; dispatchedAt: Date };
  order: { _id: unknown };
  wholesaler: { name: string; address?: string };
  allocationsWithDetails: AllocationRow[];
}

export function generateDeliveryNotePDF(ctx: DeliveryNoteContext): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50 });
    const chunks: Buffer[] = [];
    doc.on('data', (chunk) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    doc.fontSize(20).text('Delivery Note', { align: 'center' });
    doc.moveDown();
    doc.fontSize(10);
    doc.text(`Date: ${new Date(ctx.dispatch.dispatchedAt).toLocaleDateString()}`);
    doc.text(`Order ID: ${ctx.order._id}`);
    doc.text(`Wholesaler: ${ctx.wholesaler.name}`);
    if (ctx.wholesaler.address) doc.text(`Address: ${ctx.wholesaler.address}`);
    doc.moveDown(2);

    doc.fontSize(12).text('Items dispatched:', { underline: true });
    doc.moveDown(0.5);
    doc.fontSize(10);
    const tableTop = doc.y;
    doc.text('Product', 50, tableTop);
    doc.text('Batch', 200, tableTop);
    doc.text('Qty', 320, tableTop);
    doc.text('Unit', 380, tableTop);
    doc.moveTo(50, doc.y + 5).lineTo(550, doc.y + 5).stroke();
    doc.moveDown(0.5);
    let y = doc.y;
    for (const row of ctx.allocationsWithDetails) {
      const productName = row.product?.name ?? '-';
      const batchId = row.batch?.batchId ?? '-';
      doc.text(productName, 50, y);
      doc.text(batchId, 200, y);
      doc.text(String(row.allocation.qty), 320, y);
      doc.text(row.allocation.unit, 380, y);
      y += 20;
    }
    doc.moveDown(2);
    doc.fontSize(9).text('Thank you for your business.', { align: 'center' });
    doc.end();
  });
}
