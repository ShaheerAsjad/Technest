import sql from '@/lib/db';
import { json, serverError, NO_STORE } from '@/lib/api';
import { requireStaffAccess } from '@/lib/permissions';

export const dynamic = 'force-dynamic';

const MAX_BYTES = 3 * 1024 * 1024; // Vercel request bodies are limited (~4.5MB)

function sniffMime(buf) {
  if (buf.length > 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return 'image/jpeg';
  if (buf.length > 7 && buf.slice(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return 'image/png';
  if (buf.length > 11 && buf.slice(0, 4).toString() === 'RIFF' && buf.slice(8, 12).toString() === 'WEBP') return 'image/webp';
  if (buf.length > 5 && ['GIF87a', 'GIF89a'].includes(buf.slice(0, 6).toString())) return 'image/gif';
  return null;
}

/**
 * Stores the image inside the database (table `media`) and returns /api/media/<id>.
 * Works on Vercel (read-only disk) with no extra service or API key.
 */
export async function POST(request) {
  const access = await requireStaffAccess('inventory');
  if (!access.ok) return json({ error: access.error }, access.status, NO_STORE);
  try {
    const formData = await request.formData();
    const file = formData.get('file');
    if (!file || typeof file === 'string') return json({ error: 'No image file provided.' }, 400, NO_STORE);

    const buffer = Buffer.from(await file.arrayBuffer());
    if (buffer.length === 0) return json({ error: 'The file is empty.' }, 400, NO_STORE);
    if (buffer.length > MAX_BYTES) return json({ error: 'Image is too large. Please use an image under 3 MB.' }, 413, NO_STORE);

    const mime = sniffMime(buffer);
    if (!mime) return json({ error: 'Only JPG, PNG, WEBP or GIF images are allowed.' }, 415, NO_STORE);

    const rows = await sql`
      INSERT INTO media (mime, data, size) VALUES (${mime}, decode(${buffer.toString('base64')}, 'base64'), ${buffer.length})
      RETURNING id`;
    return json({ success: true, url: `/api/media/${rows[0].id}`, message: 'Image uploaded successfully!' }, 200, NO_STORE);
  } catch (err) {
    return serverError('admin/upload', err, 'Failed to upload image.');
  }
}
