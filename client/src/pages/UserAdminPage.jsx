import React, { useState, useEffect, useCallback } from 'react';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import { Loading } from '../components/Loading';
import { Alert } from '../components/Alert';
import { StatusBadge } from '../components/StatusBadge';
import { Pagination } from '../components/Pagination';
import { Users, Shield, Building2, UserX, UserCheck } from 'lucide-react';

export const UserAdminPage = () => {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [page, setPage] = useState(1);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get(`/admin/users?page=${page}&limit=10`);
      setUsers(res.data.data);
      setPagination(res.data.pagination);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load users');
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleToggleStatus = async (userToUpdate) => {
    if (userToUpdate.id === currentUser.id) {
      setError('You cannot deactivate your own administrative account.');
      return;
    }

    const newStatus = !userToUpdate.is_active;
    try {
      await api.patch(`/admin/users/${userToUpdate.id}/status`, { isActive: newStatus });
      setSuccess(`User ${userToUpdate.email} ${newStatus ? 'activated' : 'deactivated'} successfully`);
      fetchUsers();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update user account status');
    }
  };

  return (
    <div>
      <div style={{ marginBottom: '1.5rem' }}>
        <h1>Commercial User Management</h1>
        <p className="subtitle">Audit registered corporate accounts, buyer credentials, and access statuses</p>
      </div>

      {success && <Alert type="success" message={success} onClose={() => setSuccess('')} />}
      {error && <Alert type="danger" message={error} onClose={() => setError('')} />}

      {loading ? (
        <Loading message="Loading user accounts..." />
      ) : (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div className="table-responsive" style={{ border: 'none', borderRadius: 0 }}>
            <table className="table">
              <thead>
                <tr>
                  <th>User Details</th>
                  <th>Company Entity</th>
                  <th>Role</th>
                  <th>Contact Phone</th>
                  <th>Status</th>
                  <th>Registered</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id}>
                    <td>
                      <div style={{ fontWeight: 700, color: 'var(--neutral-900)' }}>{u.name}</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--neutral-500)' }}>{u.email}</div>
                    </td>
                    <td style={{ fontSize: '0.85rem' }}>{u.company_name || '—'}</td>
                    <td>
                      <span
                        style={{
                          fontSize: '0.75rem',
                          padding: '3px 8px',
                          borderRadius: 'var(--radius-sm)',
                          fontWeight: 700,
                          background: u.role === 'admin' ? '#fef3c7' : '#e0e7ff',
                          color: u.role === 'admin' ? '#92400e' : '#3730a3',
                        }}
                      >
                        {u.role.toUpperCase()}
                      </span>
                    </td>
                    <td style={{ fontSize: '0.85rem' }}>{u.phone || '—'}</td>
                    <td>
                      <StatusBadge status={u.is_active ? 'ACTIVE' : 'INACTIVE'} />
                    </td>
                    <td style={{ fontSize: '0.8rem', color: 'var(--neutral-500)' }}>
                      {new Date(u.created_at).toLocaleDateString()}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      {u.id !== currentUser.id ? (
                        <button
                          className={`btn btn-sm ${u.is_active ? 'btn-danger' : 'btn-primary'}`}
                          onClick={() => handleToggleStatus(u)}
                        >
                          {u.is_active ? (
                            <>
                              <UserX size={14} /> Deactivate
                            </>
                          ) : (
                            <>
                              <UserCheck size={14} /> Activate
                            </>
                          )}
                        </button>
                      ) : (
                        <span style={{ fontSize: '0.8rem', color: 'var(--neutral-400)', fontStyle: 'italic' }}>
                          Current User
                        </span>
                      )}
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

export default UserAdminPage;
