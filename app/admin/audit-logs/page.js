'use client';

import { useEffect, useState } from 'react';

export default function AdminAuditLogsPage() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const res = await fetch('/api/admin/audit-logs');
      if (res.ok) setLogs(await res.json());
      setLoading(false);
    })();
  }, []);

  if (loading) return <p className="empty-state">Loading audit logs…</p>;

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
