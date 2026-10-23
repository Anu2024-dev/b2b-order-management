import { Router } from 'express';
import * as invoiceController from '../controllers/invoice.controller.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

router.use(authenticate);

// Invoices by order ID
router.get('/orders/:id/invoice', invoiceController.getByOrder);

// Invoices by invoice ID
router.get('/invoices/:id', invoiceController.getById);

// Download PDF
router.get('/invoices/:id/download', invoiceController.downloadPdf);

export default router;
