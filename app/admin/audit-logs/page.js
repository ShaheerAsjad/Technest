'use client';

import { useEffect, useState } from 'react';

export default function AdminAuditLogsPage() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [accessDenied, setAccessDenied] = useState(false);

  useEffect(() => {
    (async () => {
      const res = await fetch('/api/admin/audit-logs');
      if (res.ok) {
        setLogs(await res.json());
      } else if (res.status === 403) {
        setAccessDenied(true);
      }
      setLoading(false);
    })();
  }, []);

  if (loading) return <p className="empty-state">Loading audit logs…</p>;

  if (accessDenied) {
    return (
      <div style={{ padding: '60px 20px', textAlign: 'center', backgroundColor: '#18181b', border: '1px solid #27272a', borderRadius: '1rem', marginTop: '20px' }}>
        <div style={{ fontSize: '3rem', marginBottom: '12px' }}>🔒</div>
        <h2 style={{ color: '#fff', fontSize: '1.4rem', fontWeight: '700', marginBottom: '8px' }}>
          Admin Access Required
        </h2>
        <p style={{ color: '#a1a1aa', fontSize: '0.9rem', maxWidth: '440px', margin: '0 auto' }}>
          Employees cannot access Audit Logs. Only full administrators have access to activity history.
        </p>
      </div>
    );
  }

  return (
    <div>
      <h1 className="admin-page-title">Audit Logs</h1>
      <p className="admin-page-subtitle">Every staff action across the admin portal, most recent first.</p>

      <div className="admin-panel">
        <table className="admin-table">
          <thead>
            <tr><th>Action</th><th>By</th><th>Target</th><th>When</th></tr>
          </thead>
          <tbody>
            {logs.map((log) => (
              <tr key={log.id}>
                <td><code>{log.action}</code></td>
                <td>{log.actor_name || log.actor_user_id}</td>
                <td>{log.target_type} {log.target_id ? `#${log.target_id}` : ''}</td>
                <td>{new Date(log.created_at).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {logs.length === 0 && <p className="empty-state">No activity recorded yet.</p>}
      </div>
    </div>
  );
}
