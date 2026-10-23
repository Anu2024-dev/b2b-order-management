import React, { useState, useEffect, useCallback } from 'react';
import api from '../api/client';
import { Loading } from '../components/Loading';
import { Alert } from '../components/Alert';
import { Pagination } from '../components/Pagination';
import { ShieldCheck, User, Code, Calendar } from 'lucide-react';

export const AuditLogAdminPage = () => {
  const [logs, setLogs] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [actionFilter, setActionFilter] = useState('');
  const [entityFilter, setEntityFilter] = useState('');

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = { page, limit: 15 };
      if (actionFilter) params.action = actionFilter;
      if (entityFilter) params.entityType = entityFilter;

      const res = await api.get('/admin/audit-logs', { params });
      setLogs(res.data.data);
      setPagination(res.data.pagination);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch audit log trail');
    } finally {
      setLoading(false);
    }
  }, [page, actionFilter, entityFilter]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1>Compliance & Security Audit Trail</h1>
          <p className="subtitle">Append-only immutable record of state mutations, order placements, and stock shifts</p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <select
            className="form-select"
            value={entityFilter}
            onChange={(e) => {
              setEntityFilter(e.target.value);
              setPage(1);
            }}
          >
            <option value="">All Entity Types</option>
            <option value="USER">USER</option>
            <option value="PRODUCT">PRODUCT</option>
            <option value="CATEGORY">CATEGORY</option>
            <option value="ORDER">ORDER</option>
            <option value="SYSTEM">SYSTEM</option>
          </select>
        </div>
      </div>

      {error && <Alert type="danger" message={error} onClose={() => setError('')} />}

      {loading ? (
        <Loading message="Loading compliance audit records..." />
      ) : logs.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '3.5rem' }}>
          <ShieldCheck size={48} color="var(--neutral-400)" style={{ margin: '0 auto 1rem' }} />
          <h3>No audit logs match criteria</h3>
        </div>
      ) : (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div className="table-responsive" style={{ border: 'none', borderRadius: 0 }}>
            <table className="table">
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>Action</th>
                  <th>Entity</th>
                  <th>Actor Details</th>
                  <th>Metadata Context</th>
                  <th>IP Origin</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log.id}>
                    <td style={{ fontSize: '0.8rem', color: 'var(--neutral-500)', whiteSpace: 'nowrap' }}>
                      {new Date(log.created_at).toLocaleString()}
                    </td>
                    <td>
                      <span
                        style={{
                          fontSize: '0.75rem',
                          fontFamily: 'var(--font-mono)',
                          fontWeight: 700,
                          padding: '3px 8px',
                          borderRadius: 'var(--radius-sm)',
                          background: 'var(--primary-50)',
                          color: 'var(--primary-800)',
                        }}
                      >
                        {log.action}
                      </span>
                    </td>
                    <td>
                      <span style={{ fontWeight: 600, fontSize: '0.85rem' }}>{log.entity_type}</span>
                      {log.entity_id && (
                        <div style={{ fontSize: '0.75rem', color: 'var(--neutral-500)', fontFamily: 'var(--font-mono)' }}>
                          ID: {log.entity_id}
                        </div>
                      )}
                    </td>
                    <td>
                      {log.actor_name ? (
                        <div>
                          <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>{log.actor_name}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--neutral-500)' }}>
                            {log.actor_email} ({log.actor_role})
                          </div>
                        </div>
                      ) : (
                        <span style={{ fontSize: '0.8rem', color: 'var(--neutral-400)', fontStyle: 'italic' }}>
                          System Routine
                        </span>
                      )}
                    </td>
                    <td style={{ maxWidth: '320px' }}>
                      {log.metadata ? (
                        <pre
                          style={{
                            fontSize: '0.75rem',
                            fontFamily: 'var(--font-mono)',
                            background: 'var(--neutral-100)',
                            padding: '4px 8px',
                            borderRadius: 'var(--radius-sm)',
                            overflowX: 'auto',
                            maxHeight: '75px',
                            whiteSpace: 'pre-wrap',
                            wordBreak: 'break-all',
                            margin: 0,
                          }}
                        >
                          {JSON.stringify(log.metadata, null, 2)}
                        </pre>
                      ) : (
                        <span style={{ color: 'var(--neutral-400)', fontSize: '0.8rem' }}>None</span>
                      )}
                    </td>
                    <td style={{ fontSize: '0.8rem', fontFamily: 'var(--font-mono)', color: 'var(--neutral-600)' }}>
                      {log.ip_address || '::1 (local)'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div style={{ padding: '0 1rem 1rem' }}>
            <Pagination pagination={pagination} onPageChange={(p) => setPage(p)} />
          </div>
        </div>
      )}
    </div>
  );
};

export default AuditLogAdminPage;
