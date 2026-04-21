import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { login } = await import('@/lib/services/auth.service');
    const { username, password } = await request.json();
    const { user, token } = await login(username, password);
    return NextResponse.json({ 
      user: { id: user.id, username: user.username, nickname: user.nickname, role: user.role }, 
      token 
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 401 });
  }
}
