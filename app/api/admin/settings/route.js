import { json, readJson, serverError, NO_STORE } from '@/lib/api';
import { requireAdmin, actorName } from '@/lib/permissions';
import { getStoreSettings, saveStoreSettings } from '@/lib/settings';
import { writeAuditLog } from '@/lib/audit';

export const dynamic = 'force-dynamic';

export async function GET() {
  const access = await requireAdmin();
  if (!access.ok) return json({ error: access.error }, access.status, NO_STORE);
  try {
    return json(await getStoreSettings({ fresh: true }), 200, NO_STORE);
  } catch (err) {
    return serverError('admin/settings GET', err, 'Could not load settings.');
  }
}

export async function PUT(request) {
  const access = await requireAdmin();
  if (!access.ok) return json({ error: access.error }, access.status, NO_STORE);
  try {
    const body = await readJson(request);
    if (!body || typeof body !== 'object') return json({ error: 'Invalid settings payload.' }, 400, NO_STORE);
    const saved = await saveStoreSettings(body, access.user.id);
    await writeAuditLog({
      actorUserId: access.user.id,
      actorName: actorName(access.user),
      action: 'settings.updated',
      targetType: 'settings',
      targetId: '1',
      details: {
        freeShipping: saved.shipping.freeEnabled ? saved.shipping.freeThreshold : 'off',
        defaultFee: saved.shipping.defaultFee,
        tax: saved.tax.enabled ? `${saved.tax.rate}%` : 'off',
        zones: saved.shipping.zones.length,
      },
    });
    return json({ success: true, settings: saved }, 200, NO_STORE);
  } catch (err) {
    return serverError('admin/settings PUT', err, 'Could not save settings.');
  }
}
