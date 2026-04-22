export async function verifyTurnstileToken(token: string, remoteip?: string): Promise<boolean> {
  const secretKey = process.env.CF_TURNSTILE_SECRET_KEY;
  
  if (!secretKey) {
    console.warn('[Turnstile] Secret key not configured, skipping verification');
    return true;
  }

  try {
    const formData = new FormData();
    formData.append('secret', secretKey);
    formData.append('response', token);
    if (remoteip) {
      formData.append('remoteip', remoteip);
    }

    const response = await fetch(
      'https://challenges.cloudflare.com/turnstile/v0/siteverify',
      {
        method: 'POST',
        body: formData,
      }
    );

    const data = await response.json();
    console.log('[Turnstile] Verification result:', data);
    
    return data.success === true;
  } catch (error) {
    console.error('[Turnstile] Verification error:', error);
    return false;
  }
}
