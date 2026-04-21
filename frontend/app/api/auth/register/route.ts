import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { register, generateToken } = await import('@/lib/services/auth.service');
    const { username, password, confirmPassword } = await request.json();
    
    if (password !== confirmPassword) {
      return NextResponse.json({ error: 'Passwords do not match' }, { status: 400 });
    }
    
    const user = await register(username, password);
    const token = generateToken(user);
    return NextResponse.json({ 
      user: { id: user.id, username: user.username, nickname: user.nickname, role: user.role }, 
      token 
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
