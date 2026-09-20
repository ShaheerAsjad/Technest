// Thin wrapper around Resend. If RESEND_API_KEY isn't set yet, every
// function here logs to the console instead of throwing — so the
// rest of the app (order status updates, support replies) keeps
// working even before you've configured email sending.

const esc = (v) => String(v ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

async function send({ to, subject, html }) {
  const apiKey = process.env.RESEND_API_KEY;
  const fromAddress = process.env.RESEND_FROM || 'TechNest <onboarding@resend.dev>';

  if (!apiKey) {
    console.warn(`[email skipped — no RESEND_API_KEY] To: ${to} | Subject: ${subject}`);
    return { skipped: true };
  }

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ from: fromAddress, to, subject, html }),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error('Resend send failed:', errText);
      return { skipped: true, error: errText };
    }

    return { skipped: false };
  } catch (err) {
    console.error('Resend send error:', err);
    return { skipped: true, error: String(err) };
  }
}

export async function sendOrderStatusEmail({ to, customerName, orderId, status }) {
  const statusLabel = { shipped: 'Shipped', delivered: 'Delivered' }[status] || status;
  return send({
    to,
    subject: `Your TechNest order #${orderId} has been ${statusLabel}`,
    html: `
      <div style="font-family:sans-serif;background:#0a0a0d;color:#fff;padding:24px;border-radius:12px;">
        <h2 style="color:#38bdf8;">Order Update</h2>
        <p>Hi ${esc(customerName) || 'there'},</p>
        <p>Your order <strong>#${esc(orderId)}</strong> status has changed to <strong>${esc(statusLabel)}</strong>.</p>
        <p style="color:#999;font-size:13px;margin-top:24px;">— The TechNest Team</p>
      </div>
    `,
  });
}

export async function sendSupportReplyEmail({ to, customerName, subject, reply }) {
  return send({
    to,
    subject: `Re: ${subject || 'Your message to TechNest'}`,
    html: `
      <div style="font-family:sans-serif;background:#0a0a0d;color:#fff;padding:24px;border-radius:12px;">
        <h2 style="color:#38bdf8;">TechNest Support</h2>
        <p>Hi ${esc(customerName) || 'there'},</p>
        <p style="white-space:pre-wrap;">${esc(reply)}</p>
        <p style="color:#999;font-size:13px;margin-top:24px;">— The TechNest Support Team</p>
      </div>
    `,
  });
}

export async function sendBackInStockEmail({ to, productName, productUrl }) {
  return send({
    to,
    subject: `Back in stock: ${productName}`,
    html: `
      <div style="font-family:sans-serif;background:#0a0a0d;color:#fff;padding:24px;border-radius:12px;">
        <h2 style="color:#FF6600;">Good news - it is back!</h2>
        <p><strong>${esc(productName)}</strong> is available again.</p>
        <p><a href="${esc(productUrl)}" style="background:#FF6600;color:#000;padding:10px 18px;border-radius:8px;text-decoration:none;font-weight:700;">View product</a></p>
        <p style="color:#999;font-size:13px;margin-top:24px;">You are receiving this because you asked to be notified. -- The TechNest Team</p>
      </div>
    `,
  });
}
