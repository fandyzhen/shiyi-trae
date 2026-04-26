import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { login } = await import('@/lib/services/auth.service');
    const body = await request.json();
    const emailOrUsername = body.emailOrUsername || body.username || body.email;
    const password = body.password;
    const { user, token } = await login(emailOrUsername, password);
    return NextResponse.json({ 
      user: { id: user.id, username: user.username, nickname: user.nickname, role: user.role }, 
      token 
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 401 });
  }
}
