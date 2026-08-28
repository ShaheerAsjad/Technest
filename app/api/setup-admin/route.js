import { NextResponse } from 'next/server';
import { clerkClient } from '@clerk/nextjs/server';
import sql from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const targetPassword = searchParams.get('password') || 'TechNestPass2026!';

  const results = [];

  try {
    const client = await clerkClient();
    const clerkUsers = await client.users.getUserList();

    for (const u of clerkUsers.data) {
      const email = u.emailAddresses[0]?.emailAddress?.toLowerCase()?.trim();
      if (email === 'shaheerasjad.05@gmail.com' || email === 'mshaf1122334455@gmail.com') {
        // 1. Update Clerk Metadata & Password
        try {
          await client.users.updateUser(u.id, {
            password: targetPassword,
            publicMetadata: { role: 'admin', permissions: [] },
          });
          results.push({ email, clerkStatus: `SUCCESS: Updated role to admin & password to '${targetPassword}'` });
        } catch (cErr) {
          const detail = cErr?.errors?.[0]?.longMessage || cErr?.errors?.[0]?.message || cErr.message;
          results.push({ email, clerkError: detail });
        }

        // 2. Update Neon DB (soft try)
        try {
          await sql`
            INSERT INTO users (id, email, first_name, last_name, role, permissions, created_at, updated_at)
            VALUES (${u.id}, ${email}, ${u.firstName || 'Admin'}, ${u.lastName || ''}, 'admin', '[]'::jsonb, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
            ON CONFLICT (id) DO UPDATE SET role = 'admin', permissions = '[]'::jsonb, updated_at = CURRENT_TIMESTAMP
          `;
        } catch (dbErr) {
          results.push({ email, dbWarning: dbErr.message });
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: `Clerk password reset executed with password: "${targetPassword}"`,
      results,
    });
  } catch (err) {
    console.error('[setup-admin] Error:', err);
    return NextResponse.json({ error: err.message, results }, { status: 500 });
  }
}
