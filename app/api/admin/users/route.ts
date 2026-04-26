import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { verifyAdmin } = await import('@/lib/middleware/auth');
    await verifyAdmin(request.headers);

    const { getDataSource } = await import('@/lib/config/database');
    const ds = await getDataSource();

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '10', 10);
    const search = searchParams.get('search') || '';
    const role = searchParams.get('role') || '';

    const offset = (page - 1) * limit;

    let whereConditions = '1=1';
    const params: any[] = [];
    let paramIdx = 1;

    if (search) {
      whereConditions += ` AND ("nickname" ILIKE $${paramIdx} OR "email" ILIKE $${paramIdx} OR "username" ILIKE $${paramIdx})`;
      params.push(`%${search}%`);
      paramIdx++;
    }

    if (role) {
      whereConditions += ` AND "role" = $${paramIdx}`;
      params.push(role);
      paramIdx++;
    }

    const countResult = await ds.query(
      `SELECT COUNT(*)::int as count FROM users WHERE ${whereConditions}`,
      params
    );
    const total = parseInt(countResult[0]?.count || '0', 10);

    const users = await ds.query(
      `SELECT "id", "nickname", "email", "username", "phone", "role", "isAdmin", "createdAt" FROM users WHERE ${whereConditions} ORDER BY "createdAt" DESC LIMIT $${paramIdx} OFFSET $${paramIdx + 1}`,
      [...params, limit, offset]
    );

    return NextResponse.json({
      users,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error: any) {
    console.error('[Admin Users] Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
