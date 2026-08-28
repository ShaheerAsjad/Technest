import { NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { requireStaffAccess } from '@/lib/permissions';

export const dynamic = 'force-dynamic';

export async function POST(request) {
  try {
    const access = await requireStaffAccess('inventory');
    if (!access.ok) {
      return NextResponse.json({ error: access.error }, { status: access.status });
    }

    const formData = await request.formData();
    const file = formData.get('file');

    if (!file || typeof file === 'string') {
      return NextResponse.json({ error: 'No image file provided.' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Sanitize filename and create unique timestamp name
    const rawFileName = file.name || 'image.png';
    const ext = rawFileName.substring(rawFileName.lastIndexOf('.')).toLowerCase() || '.png';
    const safeExts = ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.svg'];
    const finalExt = safeExts.includes(ext) ? ext : '.png';
    
    const fileName = `product-${Date.now()}-${Math.random().toString(36).substring(2, 7)}${finalExt}`;

    let fileUrl = '';
    try {
      const uploadDir = join(process.cwd(), 'public', 'uploads');
      await mkdir(uploadDir, { recursive: true });
      const filePath = join(uploadDir, fileName);
      await writeFile(filePath, buffer);
      fileUrl = `/uploads/${fileName}`;
    } catch (fsErr) {
      console.warn('[admin/upload] Disk write fallback to Data URL:', fsErr.message);
      // Fallback: convert file to Base64 Data URL if filesystem write fails
      const mimeType = file.type || 'image/png';
      fileUrl = `data:${mimeType};base64,${buffer.toString('base64')}`;
    }

    return NextResponse.json({
      success: true,
      url: fileUrl,
      message: 'Image uploaded successfully!',
    });
  } catch (err) {
    console.error('[admin/upload] Error:', err.message);
    return NextResponse.json({ error: 'Failed to upload image.' }, { status: 500 });
  }
}
