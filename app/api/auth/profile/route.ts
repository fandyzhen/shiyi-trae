import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { requireAuth } = await import('@/lib/middleware/auth');
    const { getUserById } = await import('@/lib/services/auth.service');
    const { userId } = await requireAuth(request.headers);
    const user = await getUserById(userId);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    return NextResponse.json({ 
      id: user.id, 
      email: user.email, 
      phone: user.phone, 
      nickname: user.nickname, 
      role: user.role 
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 401 });
  }
}
