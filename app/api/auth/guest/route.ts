import { NextResponse, NextRequest } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { verifyTurnstileToken } = await import('@/lib/services/turnstile.service');
    const { createGuestUser, generateToken } = await import('@/lib/services/auth.service');
    
    const body = await request.json();
    const turnstileToken = body['cf-turnstile-response'];
    
    if (process.env.CF_TURNSTILE_SECRET_KEY && !turnstileToken) {
      return NextResponse.json({ error: '验证失败，请重试' }, { status: 400 });
    }
    
    if (process.env.CF_TURNSTILE_SECRET_KEY) {
      const isValid = await verifyTurnstileToken(turnstileToken);
      if (!isValid) {
        return NextResponse.json({ error: '验证失败，请重试' }, { status: 400 });
      }
    }
    
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
