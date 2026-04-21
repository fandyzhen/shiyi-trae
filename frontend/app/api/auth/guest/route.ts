import { NextResponse } from 'next/server';

export async function POST() {
  try {
    const { createGuestUser, generateToken } = await import('@/lib/services/auth.service');
    const user = await createGuestUser();
    const token = generateToken(user);
    return NextResponse.json({ 
      user: { id: user.id, nickname: user.nickname, role: user.role }, 
      token 
    });
  } catch (error: any) {
    console.error('Guest API error:', error);
    return NextResponse.json({ 
      error: error.message, 
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined 
    }, { status: 500 });
  }
}
