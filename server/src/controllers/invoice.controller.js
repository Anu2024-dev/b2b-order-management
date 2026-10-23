import * as invoiceService from '../services/invoice.service.js';
import * as pdfService from '../services/pdf.service.js';

export const getByOrder = async (req, res, next) => {
  try {
    const orderId = parseInt(req.params.id, 10);
    const invoice = await invoiceService.getInvoiceByOrderId(orderId, req.user.role, req.user.id);
    res.status(200).json({
      success: true,
      data: invoice,
    });
  } catch (error) {
    next(error);
  }
};

export const getById = async (req, res, next) => {
  try {
    const invoiceId = parseInt(req.params.id, 10);
    const invoice = await invoiceService.getInvoiceById(invoiceId, req.user.role, req.user.id);
    res.status(200).json({
      success: true,
      data: invoice,
    });
  } catch (error) {
    next(error);
  }
};

export const downloadPdf = async (req, res, next) => {
  try {
    const invoiceId = parseInt(req.params.id, 10);
    const invoice = await invoiceService.getInvoiceById(invoiceId, req.user.role, req.user.id);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="Invoice-${invoice.invoice_number}.pdf"`
    );

    await pdfService.generateInvoicePdf(invoice, res);
  } catch (error) {
    next(error);
  }
};
