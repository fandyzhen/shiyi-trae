export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { verifyTurnstileToken } = await import('@/lib/services/turnstile.service');
    const { register, generateToken } = await import('@/lib/services/auth.service');
    const { sendWelcomeEmail } = await import('@/lib/services/email.service');
    const { email, username, password, confirmPassword, 'cf-turnstile-response': turnstileToken } = await request.json();
    
    if (password !== confirmPassword) {
      return NextResponse.json({ error: 'Passwords do not match' }, { status: 400 });
    }
    
    if (process.env.CF_TURNSTILE_SECRET_KEY && !turnstileToken) {
      return NextResponse.json({ error: '验证失败，请重试' }, { status: 400 });
    }
    
    if (process.env.CF_TURNSTILE_SECRET_KEY) {
      const isValid = await verifyTurnstileToken(turnstileToken);
      if (!isValid) {
        return NextResponse.json({ error: '验证失败，请重试' }, { status: 400 });
      }
    }
    
    const user = await register(email, username, password);
    const token = generateToken(user);

    try {
      await sendWelcomeEmail(email, username);
    } catch (emailError) {
      console.error('[Register] Failed to send welcome email:', emailError);
    }

    return NextResponse.json({ 
      user: { id: user.id, username: user.username, nickname: user.nickname, role: user.role }, 
      token 
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
