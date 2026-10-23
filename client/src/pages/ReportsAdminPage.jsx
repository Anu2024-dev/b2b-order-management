import React, { useState, useEffect, useCallback } from 'react';
import api from '../api/client';
import { Loading } from '../components/Loading';
import { Alert } from '../components/Alert';
import { FileText, Calendar, Filter, TrendingUp, Award, Building2 } from 'lucide-react';

export const ReportsAdminPage = () => {
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const fetchReports = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = {};
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;

      const res = await api.get('/admin/reports', { params });
      setReportData(res.data.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to generate business reports');
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate]);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  const handleFilterSubmit = (e) => {
    e.preventDefault();
    fetchReports();
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1>Operations & Business Analytics</h1>
          <p className="subtitle">Historical procurement volume, commercial demand rankings, and client revenue</p>
        </div>
      </div>

      {error && <Alert type="danger" message={error} onClose={() => setError('')} />}

      {/* Date Filter Card */}
      <div className="card" style={{ padding: '1rem', marginBottom: '1.5rem' }}>
        <form onSubmit={handleFilterSubmit} style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'flex-end' }}>
          <div style={{ flex: '1 1 200px' }}>
            <label className="form-label">
              <Calendar size={14} style={{ display: 'inline', marginRight: '4px' }} /> Start Date
            </label>
            <input
              type="date"
              className="form-input"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>

          <div style={{ flex: '1 1 200px' }}>
            <label className="form-label">
              <Calendar size={14} style={{ display: 'inline', marginRight: '4px' }} /> End Date
            </label>
            <input
              type="date"
              className="form-input"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>

          <button type="submit" className="btn btn-secondary">
            <Filter size={16} /> Apply Date Filter
          </button>
        </form>
      </div>

      {loading ? (
        <Loading message="Compiling business intelligence records..." />
      ) : !reportData ? (
        <p>No report data available.</p>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '1.5rem' }}>
          {/* Top Selling Products */}
          <div className="card">
            <div className="card-header">
              <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Award size={18} color="var(--primary-600)" /> Top Commercial Demand Products
              </h3>
            </div>
            {reportData.topProducts.length === 0 ? (
              <p style={{ color: 'var(--neutral-500)', fontSize: '0.9rem' }}>No product order history.</p>
            ) : (
              <div className="table-responsive">
                <table className="table">
                  <thead>
                    <tr>
                      <th>SKU & Name</th>
                      <th style={{ textAlign: 'center' }}>Units Ordered</th>
                      <th style={{ textAlign: 'right' }}>Total Volume (INR)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportData.topProducts.map((p, idx) => (
                      <tr key={idx}>
                        <td>
                          <span className="product-sku">{p.product_sku}</span>
                          <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>{p.product_name}</div>
                        </td>
                        <td style={{ textAlign: 'center', fontWeight: 700 }}>{p.total_quantity_ordered}</td>
                        <td style={{ textAlign: 'right', fontWeight: 700 }}>
                          INR {Number(p.total_volume_value).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Top Client Accounts */}
          <div className="card">
            <div className="card-header">
              <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Building2 size={18} color="var(--primary-600)" /> Top Purchasing Accounts
              </h3>
            </div>
            {reportData.topCustomers.length === 0 ? (
              <p style={{ color: 'var(--neutral-500)', fontSize: '0.9rem' }}>No client orders found.</p>
            ) : (
              <div className="table-responsive">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Client Company</th>
                      <th style={{ textAlign: 'center' }}>Orders</th>
                      <th style={{ textAlign: 'right' }}>Cumulative Spend (INR)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportData.topCustomers.map((c, idx) => (
                      <tr key={idx}>
                        <td>
                          <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>
                            {c.company_name || c.name}
                          </div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--neutral-500)' }}>{c.email}</div>
                        </td>
                        <td style={{ textAlign: 'center', fontWeight: 700 }}>{c.total_orders}</td>
                        <td style={{ textAlign: 'right', fontWeight: 700 }}>
                          INR {Number(c.total_spend).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Daily Order Volume Timeline */}
          <div className="card" style={{ gridColumn: '1 / -1' }}>
            <div className="card-header">
              <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
                <TrendingUp size={18} color="var(--primary-600)" /> Daily Order Intake Activity
              </h3>
            </div>
            {reportData.timeline.length === 0 ? (
              <p style={{ color: 'var(--neutral-500)', fontSize: '0.9rem' }}>No orders in selected range.</p>
            ) : (
              <div className="table-responsive">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th style={{ textAlign: 'center' }}>Orders Received</th>
                      <th style={{ textAlign: 'right' }}>Gross Intake Value (INR)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportData.timeline.map((t, idx) => (
                      <tr key={idx}>
                        <td style={{ fontWeight: 600 }}>{t.date}</td>
                        <td style={{ textAlign: 'center', fontWeight: 700 }}>{t.order_count}</td>
                        <td style={{ textAlign: 'right', fontWeight: 700 }}>
                          INR {Number(t.daily_total).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ReportsAdminPage;
