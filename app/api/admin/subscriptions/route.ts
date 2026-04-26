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
    const status = searchParams.get('status') || '';

    const offset = (page - 1) * limit;

    let whereConditions = '1=1';
    const params: any[] = [];
    let paramIdx = 1;

    if (search) {
      whereConditions += ` AND (s."id"::text ILIKE $${paramIdx} OR u."nickname" ILIKE $${paramIdx} OR u."email" ILIKE $${paramIdx})`;
      params.push(`%${search}%`);
      paramIdx++;
    }

    if (status) {
      whereConditions += ` AND s."status" = $${paramIdx}`;
      params.push(status);
      paramIdx++;
    }

    const countResult = await ds.query(
      `SELECT COUNT(*)::int as count FROM subscriptions s LEFT JOIN users u ON s."userId" = u."id" WHERE ${whereConditions}`,
      params
    );
    const total = parseInt(countResult[0]?.count || '0', 10);

    const subscriptions = await ds.query(
      `SELECT s.*, json_build_object('id', u."id", 'nickname', u."nickname", 'email', u."email") as user FROM subscriptions s LEFT JOIN users u ON s."userId" = u."id" WHERE ${whereConditions} ORDER BY s."createdAt" DESC LIMIT $${paramIdx} OFFSET $${paramIdx + 1}`,
      [...params, limit, offset]
    );

    return NextResponse.json({
      subscriptions,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error: any) {
    console.error('[Admin Subscriptions] Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
