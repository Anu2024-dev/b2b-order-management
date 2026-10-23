import PDFDocument from 'pdfkit';

export const generateInvoicePdf = (invoiceData, outputStream) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 40, size: 'A4' });

      doc.pipe(outputStream);

      // Header: Distributor info
      doc
        .fontSize(20)
        .font('Helvetica-Bold')
        .text('ARROWSTACK APEX DISTRIBUTION', 40, 40)
        .fontSize(9)
        .font('Helvetica')
        .text('Industrial & Commercial B2B Supply Chain Partner', 40, 65)
        .text('100 Feet Ring Road, BTM 2nd Stage, Bengaluru, Karnataka, 560076', 40, 78)
        .text('GSTIN: 29ABCDE1234F1Z5 | Email: billing@arrowdistributors.example.com', 40, 91);

      // Invoice Title & Metadata (Right Aligned)
      doc
        .fontSize(16)
        .font('Helvetica-Bold')
        .text('TAX INVOICE', 350, 40, { align: 'right' })
        .fontSize(9)
        .font('Helvetica')
        .text(`Invoice No: ${invoiceData.invoice_number}`, 350, 65, { align: 'right' })
        .text(`Date: ${new Date(invoiceData.invoice_date).toLocaleDateString()}`, 350, 78, { align: 'right' })
        .text(`Order No: ${invoiceData.order_number}`, 350, 91, { align: 'right' })
        .text(`Status: ${invoiceData.payment_status}`, 350, 104, { align: 'right' });

      // Divider Line
      doc.moveTo(40, 125).lineTo(555, 125).strokeColor('#cccccc').stroke();

      // Billed To / Shipping Details
      const colTop = 135;
      doc
        .fontSize(10)
        .font('Helvetica-Bold')
        .text('BILLED & SHIPPED TO:', 40, colTop)
        .font('Helvetica')
        .fontSize(9)
        .text(invoiceData.customer_company || invoiceData.customer_name, 40, colTop + 15)
        .text(`Contact: ${invoiceData.customer_name}`, 40, colTop + 28)
        .text(`Email: ${invoiceData.customer_email}`, 40, colTop + 41)
        .text(`Phone: ${invoiceData.customer_phone || 'N/A'}`, 40, colTop + 54)
        .text(`Delivery Address: ${invoiceData.shipping_address}`, 40, colTop + 67, { width: 300 });

      // Table Header
      const tableTop = 225;
      doc.rect(40, tableTop, 515, 20).fill('#2c3e50');
      doc
        .fillColor('#ffffff')
        .fontSize(9)
        .font('Helvetica-Bold')
        .text('SKU', 45, tableTop + 5)
        .text('DESCRIPTION', 120, tableTop + 5)
        .text('QTY', 340, tableTop + 5, { align: 'right' })
        .text('UNIT PRICE (INR)', 430, tableTop + 5, { align: 'right' })
        .text('TOTAL (INR)', 550, tableTop + 5, { align: 'right' });

      let currentY = tableTop + 25;
      doc.fillColor('#333333').font('Helvetica');

      // Table Items
      invoiceData.items.forEach((item, index) => {
        const rowBg = index % 2 === 0 ? '#fdfdfd' : '#f8f9fa';
        doc.rect(40, currentY - 3, 515, 18).fill(rowBg);

        doc
          .fillColor('#333333')
          .fontSize(8.5)
          .text(item.product_sku, 45, currentY)
          .text(item.product_name, 120, currentY, { width: 200, ellipsis: true })
          .text(item.quantity.toString(), 340, currentY, { align: 'right' })
          .text(Number(item.unit_price).toFixed(2), 430, currentY, { align: 'right' })
          .text(Number(item.line_total).toFixed(2), 550, currentY, { align: 'right' });

        currentY += 20;
      });

      // Bottom Totals Box
      doc.moveTo(40, currentY + 5).lineTo(555, currentY + 5).strokeColor('#cccccc').stroke();
      currentY += 15;

      const totalsX = 350;
      doc
        .fontSize(9)
        .font('Helvetica')
        .text('Subtotal:', totalsX, currentY)
        .text(`INR ${Number(invoiceData.subtotal).toFixed(2)}`, 550, currentY, { align: 'right' });

      currentY += 15;
      doc
        .text('Standard GST (18%):', totalsX, currentY)
        .text(`INR ${Number(invoiceData.tax_amount).toFixed(2)}`, 550, currentY, { align: 'right' });

      currentY += 15;
      doc.rect(totalsX, currentY - 2, 205, 20).fill('#eef2f7');
      doc
        .fillColor('#1a252f')
        .fontSize(10)
        .font('Helvetica-Bold')
        .text('Grand Total:', totalsX + 5, currentY + 3)
        .text(`INR ${Number(invoiceData.total_amount).toFixed(2)}`, 550, currentY + 3, { align: 'right' });

      // Disclaimer & Footer
      doc
        .fillColor('#7f8c8d')
        .fontSize(8)
        .font('Helvetica')
        .text(
          'Note: Simulated B2B commercial invoice for Arrowstack Internship demonstration only. Not certified for legal tax compliance.',
          40,
          730,
          { align: 'center', width: 515 }
        )
        .text('Arrowstack B2B Order Management Platform | Generated automatically', 40, 745, {
          align: 'center',
          width: 515,
        });

      doc.end();

      outputStream.on('finish', () => resolve());
      outputStream.on('error', (err) => reject(err));
    } catch (err) {
      reject(err);
    }
  });
};

export default {
  generateInvoicePdf,
};
