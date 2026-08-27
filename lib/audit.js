import sql from './db';

/**
 * Records a staff action to the audit_logs table. Never throws —
 * a logging failure should never break the actual admin action.
 */
export async function writeAuditLog({ actorUserId, actorName, action, targetType, targetId, details }) {
  try {
    await sql`
      INSERT INTO audit_logs (actor_user_id, actor_name, action, target_type, target_id, details)
      VALUES (${actorUserId}, ${actorName || ''}, ${action}, ${targetType || null}, ${String(targetId ?? '')}, ${JSON.stringify(details || {})})
    `;
  } catch (err) {
    console.error('Audit log write failed (non-fatal):', err);
  }
}
