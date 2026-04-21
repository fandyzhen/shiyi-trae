import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { requireAuth } = await import('@/lib/middleware/auth');
    const { getDataSource } = await import('@/lib/config/database');
    const { History } = await import('@/lib/entities/History');
    const { userId } = await requireAuth(request.headers);
    const dataSource = await getDataSource();
    const historyRepository = dataSource.getRepository(History);
    const histories = await historyRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' }
    });
    return NextResponse.json(histories);
  } catch (error: any) {
    const status = error.status || 500;
    return NextResponse.json({ error: error.message }, { status });
  }
}
