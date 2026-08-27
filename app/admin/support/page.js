'use client';

import { useEffect, useState } from 'react';

export default function AdminSupportPage() {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeId, setActiveId] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [sending, setSending] = useState(false);

  async function load() {
    setLoading(true);
    const res = await fetch('/api/admin/support');
    if (res.ok) setMessages(await res.json());
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  const active = messages.find((m) => m.id === activeId);

  async function sendReply() {
    if (!replyText.trim() || !activeId) return;
    setSending(true);
    const res = await fetch(`/api/admin/support/${activeId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reply: replyText }),
    });
    if (res.ok) {
      setMessages((prev) =>
        prev.map((m) => (m.id === activeId ? { ...m, status: 'replied', reply: replyText } : m))
      );
      setReplyText('');
    }
    setSending(false);
  }

  if (loading) return <p className="empty-state">Loading inbox…</p>;

  return (
    <div>
      <h1 className="admin-page-title">Support Inbox</h1>

      <div className="admin-inbox">
        <div className="admin-inbox__list">
          {messages.length === 0 && <p className="empty-state">No messages yet.</p>}
          {messages.map((m) => (
            <button
              key={m.id}
              className={`admin-inbox__item${activeId === m.id ? ' admin-inbox__item--active' : ''}`}
              onClick={() => { setActiveId(m.id); setReplyText(''); }}
            >
              <div className="admin-inbox__item-top">
                <strong>{m.customer_name || m.customer_email}</strong>
                <span className={`admin-badge admin-badge--sm ${m.status === 'open' ? 'admin-badge--danger' : 'admin-badge--success'}`}>
                  {m.status}
                </span>
              </div>
              <span className="admin-inbox__subject">{m.subject}</span>
              <span className="admin-inbox__preview">{m.message.slice(0, 60)}…</span>
            </button>
          ))}
        </div>

        <div className="admin-inbox__detail">
          {!active ? (
            <p className="empty-state">Select a message to view it.</p>
          ) : (
            <>
              <h3>{active.subject}</h3>
              <p className="admin-table__muted">
                From: {active.customer_name} &lt;{active.customer_email}&gt; ·{' '}
                {new Date(active.created_at).toLocaleString()}
              </p>
              <div className="admin-inbox__message-body">{active.message}</div>

              {active.reply && (
                <div className="admin-inbox__reply-sent">
                  <strong>Your reply:</strong>
                  <p>{active.reply}</p>
                </div>
              )}

              <textarea
                className="form-input form-textarea"
                placeholder="Write your reply — it will be emailed to the customer…"
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                rows={4}
              />
              <button className="btn btn--primary" onClick={sendReply} disabled={sending}>
                {sending ? 'Sending…' : 'Send Reply'}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
