'use client';

import { useEffect, useState } from 'react';

const MODULES = [
  { key: 'orders',    label: 'Orders' },
  { key: 'inventory', label: 'Inventory' },
  { key: 'coupons',   label: 'Coupons' },
  { key: 'support',   label: 'Support Inbox' },
  { key: 'analytics', label: 'Analytics' },
];

export default function AdminStaffPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState(null);

  async function load() {
    setLoading(true);
    const res = await fetch('/api/admin/staff');
    if (res.ok) setUsers(await res.json());
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  function updateLocal(id, patch) {
    setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, ...patch } : u)));
  }

  function togglePermission(id, permKey) {
    const user = users.find((u) => u.id === id);
    const current = Array.isArray(user.permissions) ? user.permissions : [];
    const next = current.includes(permKey)
      ? current.filter((p) => p !== permKey)
      : [...current, permKey];
    updateLocal(id, { permissions: next });
  }

  async function saveUser(id) {
    const user = users.find((u) => u.id === id);
    setSavingId(id);
    await fetch(`/api/admin/staff/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role: user.role, permissions: user.permissions }),
    });
    setSavingId(null);
  }

  if (loading) return <p className="empty-state">Loading staff…</p>;

  return (
    <div>
      <h1 className="admin-page-title">Staff &amp; Roles</h1>
      <p className="admin-page-subtitle">
        Promote a customer to <strong>Employee</strong> and tick only the modules they should access, or to{' '}
        <strong>Admin</strong> for full control.
      </p>

      <div className="admin-panel">
        <table className="admin-table">
          <thead>
            <tr><th>User</th><th>Role</th><th>Permissions (Employees only)</th><th></th></tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id}>
                <td>
                  <div className="admin-table__user-cell">
                    <strong>{u.first_name} {u.last_name}</strong>
                    <span>{u.email}</span>
                  </div>
                </td>
                <td>
                  <select
                    className="admin-table__select"
                    value={u.role}
                    onChange={(e) => updateLocal(u.id, { role: e.target.value })}
                  >
                    <option value="customer">Customer</option>
                    <option value="employee">Employee</option>
                    <option value="admin">Admin</option>
                  </select>
                </td>
                <td>
                  {u.role === 'employee' ? (
                    <div className="admin-perm-chips">
                      {MODULES.map((m) => (
                        <button
                          key={m.key}
                          type="button"
                          className={`admin-perm-chip${(u.permissions || []).includes(m.key) ? ' admin-perm-chip--active' : ''}`}
                          onClick={() => togglePermission(u.id, m.key)}
                        >
                          {m.label}
                        </button>
                      ))}
                    </div>
                  ) : (
                    <span className="admin-table__muted">
                      {u.role === 'admin' ? 'All modules' : '—'}
                    </span>
                  )}
                </td>
                <td>
                  <button
                    className="btn btn--primary admin-table__btn-sm"
                    disabled={savingId === u.id}
                    onClick={() => saveUser(u.id)}
                  >
                    {savingId === u.id ? 'Saving…' : 'Save'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
