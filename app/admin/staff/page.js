'use client';

import { useEffect, useState } from 'react';

const MODULES = [
  { key: 'orders',    label: 'Orders' },
  { key: 'inventory', label: 'Inventory' },
  { key: 'coupons',   label: 'Coupons' },
  { key: 'support',   label: 'Support Inbox' },
  { key: 'analytics', label: 'Analytics' },
];

const EMPTY_FORM = {
  firstName: '', lastName: '', email: '', password: '',
  role: 'employee', permissions: [],
};

export default function AdminStaffPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState('');
  const [createSuccess, setCreateSuccess] = useState('');

  const [accessDenied, setAccessDenied] = useState(false);

  // Editing state for existing staff members
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});

  async function load() {
    setLoading(true);
    setAccessDenied(false);
    const res = await fetch('/api/admin/staff');
    if (res.ok) {
      setUsers(await res.json());
    } else if (res.status === 403) {
      setAccessDenied(true);
    }
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  function startEdit(u) {
    setEditingId(u.id);
    setEditForm({
      firstName: u.first_name || '',
      lastName: u.last_name || '',
      email: u.email || '',
      password: '',
      role: u.role || 'customer',
      permissions: Array.isArray(u.permissions) ? u.permissions : [],
    });
  }

  function toggleEditPerm(key) {
    setEditForm(prev => ({
      ...prev,
      permissions: prev.permissions.includes(key)
        ? prev.permissions.filter(p => p !== key)
        : [...prev.permissions, key],
    }));
  }

  async function saveEditUser(id) {
    setSavingId(id);
    try {
      const res = await fetch(`/api/admin/staff/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm),
      });
      const json = await res.json();
      if (res.ok) {
        setEditingId(null);
        load();
      } else {
        alert(json.error || 'Could not update user details.');
      }
    } catch {
      alert('Network error updating user.');
    } finally {
      setSavingId(null);
    }
  }

  async function deleteUser(id, email) {
    if (!confirm(`Are you sure you want to delete staff account (${email})?`)) return;
    try {
      const res = await fetch(`/api/admin/staff/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setUsers(prev => prev.filter(u => u.id !== id));
      } else {
        const json = await res.json();
        alert(json.error || 'Failed to delete user.');
      }
    } catch {
      alert('Network error deleting user.');
    }
  }

  function toggleFormPerm(key) {
    setForm(prev => ({
      ...prev,
      permissions: prev.permissions.includes(key)
        ? prev.permissions.filter(p => p !== key)
        : [...prev.permissions, key],
    }));
  }

  async function handleCreate(e) {
    e.preventDefault();
    setCreateError('');
    setCreateSuccess('');
    setCreateLoading(true);
    try {
      const res = await fetch('/api/admin/staff/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const json = await res.json();
      if (res.ok) {
        setCreateSuccess(json.message || `✅ ${form.email} has been configured as ${form.role}.`);
        setForm(EMPTY_FORM);
        load();
      } else {
        setCreateError(json.error || 'Could not save staff member.');
      }
    } catch {
      setCreateError('Network error. Please try again.');
    } finally {
      setCreateLoading(false);
    }
  }

  const cardStyle = {
    backgroundColor: 'var(--admin-surface, #18181b)',
    border: '1px solid var(--admin-border, #27272a)',
    borderRadius: '1rem',
    padding: '24px',
    marginBottom: '24px',
  };

  const inputStyle = {
    width: '100%',
    padding: '10px 14px',
    backgroundColor: '#0f0f10',
    border: '1px solid #3f3f46',
    borderRadius: '0.75rem',
    color: '#fff',
    fontSize: '0.9rem',
    outline: 'none',
    boxSizing: 'border-box',
  };

  if (accessDenied) {
    return (
      <div style={{ padding: '60px 20px', textAlign: 'center', backgroundColor: '#18181b', border: '1px solid #27272a', borderRadius: '1rem', marginTop: '20px' }}>
        <div style={{ fontSize: '3rem', marginBottom: '12px' }}>🔒</div>
        <h2 style={{ color: '#fff', fontSize: '1.4rem', fontWeight: '700', marginBottom: '8px' }}>
          Admin Access Required
        </h2>
        <p style={{ color: '#a1a1aa', fontSize: '0.9rem', maxWidth: '440px', margin: '0 auto' }}>
          Employees are restricted from viewing or managing Staff &amp; Roles. Only full administrators have access to user management.
        </p>
      </div>
    );
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
        <h1 className="admin-page-title" style={{ margin: 0 }}>Staff &amp; Roles</h1>
        <button
          id="create-staff-btn"
          className="btn btn--primary"
          onClick={() => { setShowCreate(v => !v); setCreateError(''); setCreateSuccess(''); }}
        >
          {showCreate ? '✕ Cancel' : '+ Add / Edit Staff Member'}
        </button>
      </div>
      <p className="admin-page-subtitle">
        Manage administrators and employees. Set names, roles, module permissions, and reset passwords directly from here.
      </p>

      {/* ── Create / Upgrade Staff Form ── */}
      {showCreate && (
        <div style={cardStyle}>
          <h2 style={{ margin: '0 0 4px 0', fontSize: '1.1rem', color: '#fff', fontWeight: '700' }}>
            🔐 Add New Staff or Promote Account
          </h2>
          <p style={{ margin: '0 0 20px 0', fontSize: '0.85rem', color: '#71717a' }}>
            Staff will log in at <code style={{ color: '#f97316' }}>/sign-in → Staff Login</code> using the email &amp; password configured below.
          </p>

          <form onSubmit={handleCreate}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: '#a1a1aa', marginBottom: '6px' }}>First Name</label>
                <input
                  id="staff-first-name"
                  style={inputStyle}
                  placeholder="Muhammad"
                  value={form.firstName}
                  onChange={e => setForm(p => ({ ...p, firstName: e.target.value }))}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: '#a1a1aa', marginBottom: '6px' }}>Last Name</label>
                <input
                  id="staff-last-name"
                  style={inputStyle}
                  placeholder="Ali"
                  value={form.lastName}
                  onChange={e => setForm(p => ({ ...p, lastName: e.target.value }))}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: '#a1a1aa', marginBottom: '6px' }}>Email *</label>
                <input
                  id="staff-email"
                  type="email"
                  required
                  style={inputStyle}
                  placeholder="employee@technest.com"
                  value={form.email}
                  onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: '#a1a1aa', marginBottom: '6px' }}>Password * (min 8 chars)</label>
                <input
                  id="staff-password"
                  type="password"
                  required
                  minLength={8}
                  style={inputStyle}
                  placeholder="••••••••"
                  value={form.password}
                  onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
                />
              </div>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '0.8rem', color: '#a1a1aa', marginBottom: '6px' }}>Role *</label>
              <select
                id="staff-role"
                required
                style={{ ...inputStyle, cursor: 'pointer' }}
                value={form.role}
                onChange={e => setForm(p => ({ ...p, role: e.target.value, permissions: [] }))}
              >
                <option value="employee">Employee (limited module access)</option>
                <option value="admin">Admin (full access)</option>
              </select>
            </div>

            {form.role === 'employee' && (
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', color: '#a1a1aa', marginBottom: '10px' }}>
                  Modules this employee can access
                </label>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {MODULES.map(m => (
                    <button
                      key={m.key}
                      type="button"
                      id={`perm-${m.key}`}
                      onClick={() => toggleFormPerm(m.key)}
                      style={{
                        padding: '6px 14px',
                        borderRadius: '999px',
                        border: '1px solid',
                        fontSize: '0.8rem',
                        fontWeight: '600',
                        cursor: 'pointer',
                        transition: 'all 0.15s',
                        backgroundColor: form.permissions.includes(m.key) ? '#f97316' : 'transparent',
                        borderColor: form.permissions.includes(m.key) ? '#f97316' : '#3f3f46',
                        color: form.permissions.includes(m.key) ? '#fff' : '#a1a1aa',
                      }}
                    >
                      {m.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {createError && (
              <div style={{ padding: '10px 14px', backgroundColor: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '0.75rem', color: '#ef4444', fontSize: '0.875rem', marginBottom: '16px' }}>
                {createError}
              </div>
            )}
            {createSuccess && (
              <div style={{ padding: '10px 14px', backgroundColor: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.3)', borderRadius: '0.75rem', color: '#22c55e', fontSize: '0.875rem', marginBottom: '16px' }}>
                {createSuccess}
              </div>
            )}

            <button
              id="staff-create-submit"
              type="submit"
              className="btn btn--primary"
              disabled={createLoading}
              style={{ minWidth: '160px' }}
            >
              {createLoading ? 'Saving…' : '🔐 Save Staff Credentials'}
            </button>
          </form>
        </div>
      )}

      {/* ── Existing Staff Table ── */}
      <div className="admin-panel">
        <h2 className="admin-panel__title">Staff Members ({users.filter(u => u.role === 'admin' || u.role === 'employee').length})</h2>
        {loading ? (
          <p className="empty-state">Loading staff…</p>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>User Details</th>
                <th>Role</th>
                <th>Permissions</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.filter(u => u.role === 'admin' || u.role === 'employee').map((u) => (
                <tr key={u.id}>
                  <td>
                    {editingId === u.id ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <div style={{ display: 'flex', gap: '6px' }}>
                          <input
                            style={inputStyle}
                            placeholder="First Name"
                            value={editForm.firstName}
                            onChange={e => setEditForm(p => ({ ...p, firstName: e.target.value }))}
                          />
                          <input
                            style={inputStyle}
                            placeholder="Last Name"
                            value={editForm.lastName}
                            onChange={e => setEditForm(p => ({ ...p, lastName: e.target.value }))}
                          />
                        </div>
                        <input
                          style={inputStyle}
                          placeholder="New Password (optional)"
                          type="password"
                          value={editForm.password}
                          onChange={e => setEditForm(p => ({ ...p, password: e.target.value }))}
                        />
                      </div>
                    ) : (
                      <div className="admin-table__user-cell">
                        <strong>{u.first_name} {u.last_name || ''}</strong>
                        <span style={{ fontSize: '0.8rem', color: '#a1a1aa' }}>{u.email}</span>
                      </div>
                    )}
                  </td>
                  <td>
                    {editingId === u.id ? (
                      <select
                        className="admin-table__select"
                        value={editForm.role}
                        onChange={(e) => setEditForm(p => ({ ...p, role: e.target.value }))}
                      >
                        <option value="employee">Employee</option>
                        <option value="admin">Admin</option>
                      </select>
                    ) : (
                      <span className={`admin-badge ${u.role === 'admin' ? 'admin-badge--success' : u.role === 'employee' ? 'admin-badge--info' : 'admin-badge--muted'}`}>
                        {u.role ? u.role.toUpperCase() : 'CUSTOMER'}
                      </span>
                    )}
                  </td>
                  <td>
                    {editingId === u.id ? (
                      editForm.role === 'employee' ? (
                        <div className="admin-perm-chips">
                          {MODULES.map((m) => (
                            <button
                              key={m.key}
                              type="button"
                              className={`admin-perm-chip${(editForm.permissions || []).includes(m.key) ? ' admin-perm-chip--active' : ''}`}
                              onClick={() => toggleEditPerm(m.key)}
                            >
                              {m.label}
                            </button>
                          ))}
                        </div>
                      ) : (
                        <span className="admin-table__muted">{editForm.role === 'admin' ? 'All modules' : '—'}</span>
                      )
                    ) : (
                      u.role === 'employee' ? (
                        <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                          {(u.permissions || []).map(p => (
                            <span key={p} style={{ fontSize: '0.75rem', padding: '2px 8px', borderRadius: '6px', background: '#27272a', color: '#f97316' }}>
                              {p}
                            </span>
                          ))}
                          {(!u.permissions || u.permissions.length === 0) && <span className="admin-table__muted">No modules</span>}
                        </div>
                      ) : (
                        <span className="admin-table__muted">{u.role === 'admin' ? 'Full Access' : 'Storefront Only'}</span>
                      )
                    )}
                  </td>
                  <td className="admin-table__actions">
                    {editingId === u.id ? (
                      <>
                        <button
                          className="btn btn--primary admin-table__btn-sm"
                          disabled={savingId === u.id}
                          onClick={() => saveEditUser(u.id)}
                        >
                          {savingId === u.id ? 'Saving…' : 'Save Changes'}
                        </button>
                        <button
                          className="btn btn--secondary admin-table__btn-sm"
                          onClick={() => setEditingId(null)}
                        >
                          Cancel
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          className="btn btn--secondary admin-table__btn-sm"
                          onClick={() => startEdit(u)}
                        >
                          ✏️ Edit / Reset Pass
                        </button>
                        <button
                          className="btn admin-table__btn-sm admin-table__btn-danger"
                          onClick={() => deleteUser(u.id, u.email)}
                        >
                          Delete
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
              {users.filter(u => u.role === 'admin' || u.role === 'employee').length === 0 && (
                <tr>
                  <td colSpan={4} style={{ textAlign: 'center', padding: '40px 20px', color: '#a1a1aa', fontSize: '0.9rem' }}>
                    No staff accounts yet. Use <strong>+ Add / Edit Staff Member</strong> above to create the first one.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
