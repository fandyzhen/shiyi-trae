export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { requireAuth } = await import('@/lib/middleware/auth');
    const { getDataSource } = await import('@/lib/config/database');
    const { History } = await import('@/lib/entities/History');
    
    const { userId } = await requireAuth(request.headers);
    const { id } = params;
    
    const dataSource = await getDataSource();
    const historyRepository = dataSource.getRepository(History);
    
    const history = await historyRepository.findOne({
      where: { id, userId }
    });
    
    if (!history) {
      return NextResponse.json({ error: 'History not found' }, { status: 404 });
    }
    
    await historyRepository.remove(history);
    
    return NextResponse.json({ success: true });
  } catch (error: any) {
    const status = error.status || 500;
    return NextResponse.json({ error: error.message }, { status });
  }
}
