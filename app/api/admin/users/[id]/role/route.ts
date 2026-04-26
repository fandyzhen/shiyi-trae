import { NextRequest, NextResponse } from 'next/server';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { verifyAdmin } = await import('@/lib/middleware/auth');
    await verifyAdmin(request.headers);

    const { getDataSource } = await import('@/lib/config/database');
    const ds = await getDataSource();

    const { id } = params;
    const { role } = await request.json();

    if (!role || !['guest', 'registered', 'subscriber'].includes(role)) {
      return NextResponse.json({ error: '无效的角色' }, { status: 400 });
    }

    await ds.query(`UPDATE users SET role = $1 WHERE id = $2`, [role, id]);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('[Admin User Role] Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
