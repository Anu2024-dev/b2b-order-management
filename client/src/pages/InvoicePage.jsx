import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../api/client';
import { Loading } from '../components/Loading';
import { Alert } from '../components/Alert';
import { ArrowLeft, Printer, Download, FileText } from 'lucide-react';

export const InvoicePage = () => {
  const { id } = useParams();
  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    const fetchInvoice = async () => {
      setLoading(true);
      try {
        const res = await api.get(`/invoices/${id}`);
        setInvoice(res.data.data);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load invoice');
      } finally {
        setLoading(false);
      }
    };
    fetchInvoice();
  }, [id]);

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPdf = async () => {
    setDownloading(true);
    try {
      const res = await api.get(`/invoices/${id}/download`, {
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Invoice-${invoice.invoice_number}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
    } catch {
      alert('Failed to download invoice PDF.');
    } finally {
      setDownloading(false);
    }
  };

  if (loading) return <Loading message="Loading commercial tax invoice..." />;
  if (error || !invoice) {
    return (
      <div className="card" style={{ maxWidth: '600px', margin: '2rem auto', textAlign: 'center' }}>
        <Alert type="danger" message={error || 'Invoice not found'} />
        <Link to="/orders" className="btn btn-secondary">
          <ArrowLeft size={16} /> Back to Orders
        </Link>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '850px', margin: '0 auto' }}>
      {/* Top action buttons (hidden in print mode) */}
      <div
        className="no-print"
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '1.25rem',
        }}
      >
        <Link to={`/orders/${invoice.order_id}`} className="btn btn-sm btn-secondary">
          <ArrowLeft size={16} /> Back to Order
        </Link>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button className="btn btn-sm btn-secondary" onClick={handlePrint}>
            <Printer size={16} /> Print Tax Invoice
          </button>
          <button className="btn btn-sm btn-primary" onClick={handleDownloadPdf} disabled={downloading}>
            <Download size={16} /> {downloading ? 'Generating PDF...' : 'Download PDF'}
          </button>
        </div>
      </div>

      {/* Printable Invoice Sheet */}
      <div className="invoice-sheet">
        {/* Header */}
        <div className="invoice-header">
          <div>
            <h2 style={{ fontSize: '1.5rem', color: 'var(--primary-900)', marginBottom: '0.25rem' }}>
              {invoice.distributor.name}
            </h2>
            <p style={{ fontSize: '0.85rem', color: 'var(--neutral-600)' }}>
              Industrial & Commercial B2B Supply Chain Partner
            </p>
            <p style={{ fontSize: '0.85rem', color: 'var(--neutral-600)' }}>
              {invoice.distributor.address}
            </p>
            <p style={{ fontSize: '0.85rem', color: 'var(--neutral-600)', marginTop: '4px' }}>
              <strong>GSTIN:</strong> {invoice.distributor.gstin}
            </p>
          </div>

          <div style={{ textAlign: 'right' }}>
            <h1 style={{ fontSize: '1.75rem', color: 'var(--neutral-900)', marginBottom: '0.25rem' }}>
              TAX INVOICE
            </h1>
            <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: '1.05rem', color: 'var(--primary-800)' }}>
              {invoice.invoice_number}
            </div>
            <div style={{ fontSize: '0.85rem', color: 'var(--neutral-600)', marginTop: '4px' }}>
              <strong>Invoice Date:</strong> {new Date(invoice.invoice_date).toLocaleDateString()}
            </div>
            <div style={{ fontSize: '0.85rem', color: 'var(--neutral-600)' }}>
              <strong>Order Ref:</strong> {invoice.order_number}
            </div>
            <div style={{ fontSize: '0.85rem', color: 'var(--neutral-600)' }}>
              <strong>Payment Status:</strong> {invoice.payment_status}
            </div>
          </div>
        </div>

        {/* Bill To / Ship To Details */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', margin: '1.5rem 0' }}>
          <div>
            <h4 style={{ fontSize: '0.85rem', color: 'var(--neutral-500)', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
              Billed & Invoiced To:
            </h4>
            <div style={{ fontWeight: 700, fontSize: '1.05rem', color: 'var(--neutral-900)' }}>
              {invoice.customer_company || invoice.customer_name}
            </div>
            <p style={{ fontSize: '0.85rem', color: 'var(--neutral-600)' }}>Contact: {invoice.customer_name}</p>
            <p style={{ fontSize: '0.85rem', color: 'var(--neutral-600)' }}>Email: {invoice.customer_email}</p>
            {invoice.customer_phone && (
              <p style={{ fontSize: '0.85rem', color: 'var(--neutral-600)' }}>Phone: {invoice.customer_phone}</p>
            )}
          </div>

          <div>
            <h4 style={{ fontSize: '0.85rem', color: 'var(--neutral-500)', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
              Dispatch & Delivery Destination:
            </h4>
            <p style={{ fontSize: '0.85rem', color: 'var(--neutral-700)', lineHeight: '1.5' }}>
              {invoice.shipping_address}
            </p>
          </div>
        </div>

        {/* Items Table */}
        <table className="table" style={{ margin: '1.5rem 0' }}>
          <thead>
            <tr>
              <th style={{ width: '120px' }}>SKU</th>
              <th>Item Description</th>
              <th style={{ textAlign: 'center', width: '80px' }}>Qty</th>
              <th style={{ textAlign: 'right', width: '120px' }}>Unit Price (INR)</th>
              <th style={{ textAlign: 'right', width: '140px' }}>Total (INR)</th>
            </tr>
          </thead>
          <tbody>
            {invoice.items?.map((item, idx) => (
              <tr key={idx}>
                <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem' }}>{item.product_sku}</td>
                <td style={{ fontWeight: 600 }}>{item.product_name}</td>
                <td style={{ textAlign: 'center' }}>{item.quantity}</td>
                <td style={{ textAlign: 'right' }}>{Number(item.unit_price).toFixed(2)}</td>
                <td style={{ textAlign: 'right', fontWeight: 600 }}>{Number(item.line_total).toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Summary Totals */}
        <div style={{ maxWidth: '340px', marginLeft: 'auto', marginTop: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.35rem 0', fontSize: '0.9rem' }}>
            <span style={{ color: 'var(--neutral-600)' }}>Taxable Value (Subtotal):</span>
            <span style={{ fontWeight: 600 }}>INR {Number(invoice.subtotal).toFixed(2)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.35rem 0', fontSize: '0.9rem' }}>
            <span style={{ color: 'var(--neutral-600)' }}>Standard GST (18%):</span>
            <span style={{ fontWeight: 600 }}>INR {Number(invoice.tax_amount).toFixed(2)}</span>
          </div>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              padding: '0.75rem 0',
              borderTop: '2px solid var(--neutral-800)',
              fontSize: '1.25rem',
              fontWeight: 800,
              color: 'var(--neutral-900)',
            }}
          >
            <span>Total Amount:</span>
            <span>INR {Number(invoice.total_amount).toFixed(2)}</span>
          </div>
        </div>

        {/* Legal / Internship Notice */}
        <div
          style={{
            marginTop: '3rem',
            paddingTop: '1rem',
            borderTop: '1px solid var(--neutral-300)',
            textAlign: 'center',
            fontSize: '0.75rem',
            color: 'var(--neutral-500)',
          }}
        >
          <p>{invoice.distributor.disclaimer}</p>
          <p style={{ marginTop: '0.25rem' }}>
            Arrowstack B2B Order Management Platform &bull; Computer Generated Tax Document
          </p>
        </div>
      </div>
    </div>
  );
};

export default InvoicePage;
