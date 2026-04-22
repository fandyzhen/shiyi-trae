'use client';

export default function TestEnv() {
  return (
    <div>
      <h1>Environment Variables Test</h1>
      <p>Turnstile siteKey: {process.env.NEXT_PUBLIC_CF_TURNSTILE_SITE_KEY}</p>
      <p>Turnstile secret: {process.env.CF_TURNSTILE_SECRET_KEY ? 'Set' : 'Not set'}</p>
    </div>
  );
}