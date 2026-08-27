import { NextResponse } from 'next/server';
import sql from '@/lib/db';
import { requireStaffAccess } from '@/lib/permissions';
import { writeAuditLog } from '@/lib/audit';
import { sendSupportReplyEmail } from '@/lib/email';

export const dynamic = 'force-dynamic';

export async function PATCH(request, { params }) {
  const access = await requireStaffAccess('support');
  if (!access.ok) {
    return NextResponse.json({ error: access.error }, { status: access.status });
  }

  const { id } = await params;
  const { reply, status } = await request.json();

  try {
    if (reply) {
      const [msg] = await sql`
        UPDATE support_messages
        SET reply = ${reply}, status = 'replied', replied_by = ${access.user.id}, replied_at = CURRENT_TIMESTAMP
        WHERE id = ${id}
        RETURNING *
      `;

      if (msg) {
        await sendSupportReplyEmail({
          to: msg.customer_email,
          customerName: msg.customer_name,
          subject: msg.subject,
          reply,
        });
      }
    } else if (status) {
      await sql`UPDATE support_messages SET status = ${status} WHERE id = ${id}`;
    }

    await writeAuditLog({
      actorUserId: access.user.id,
      actorName: `${access.user.first_name || ''} ${access.user.last_name || ''}`.trim(),
      action: reply ? 'support.replied' : 'support.status_changed',
      targetType: 'support',
      targetId: id,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Support reply error:', error);
    return NextResponse.json({ error: 'Could not send reply.' }, { status: 500 });
  }
}
