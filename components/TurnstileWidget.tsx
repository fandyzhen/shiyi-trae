'use client';

import { useEffect, useRef, useState } from 'react';

declare global {
  interface Window {
    turnstile?: {
      render: (container: string | HTMLElement, options: any) => string;
      reset: (widgetId?: string) => void;
      getResponse: (widgetId?: string) => string;
      remove: (widgetId?: string) => void;
    };
  }
}

interface TurnstileWidgetProps {
  siteKey: string;
  onVerify: (token: string) => void;
  onExpire?: () => void;
  onError?: () => void;
  theme?: 'light' | 'dark' | 'auto';
  size?: 'normal' | 'compact';
}

export default function TurnstileWidget({
  siteKey,
  onVerify,
  onExpire,
  onError,
  theme = 'auto',
  size = 'normal',
}: TurnstileWidgetProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string>();
  const onVerifyRef = useRef(onVerify);
  const onExpireRef = useRef(onExpire);
  const onErrorRef = useRef(onError);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    onVerifyRef.current = onVerify;
  }, [onVerify]);

  useEffect(() => {
    onExpireRef.current = onExpire;
  }, [onExpire]);

  useEffect(() => {
    onErrorRef.current = onError;
  }, [onError]);

  useEffect(() => {
    if (!isClient) return;

    const scriptId = 'cf-turnstile-script';

    if (document.getElementById(scriptId)) {
      return;
    }

    const script = document.createElement('script');
    script.id = scriptId;
    script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
    script.async = true;
    script.defer = true;
    document.body.appendChild(script);
  }, [isClient]);

  useEffect(() => {
    if (!isClient || !containerRef.current || !siteKey || widgetIdRef.current) return;

    const attemptRender = () => {
      if (!window.turnstile) {
        setTimeout(attemptRender, 100);
        return;
      }

      try {
        const id = window.turnstile.render(containerRef.current, {
          sitekey: siteKey,
          theme,
          size,
          callback: (token: string) => {
            onVerifyRef.current?.(token);
          },
          'expired-callback': () => {
            onExpireRef.current?.();
          },
          'error-callback': () => {
            onErrorRef.current?.();
          },
        });

        widgetIdRef.current = id;
      } catch (e) {
        console.error('Failed to render Turnstile widget:', e);
      }
    };

    attemptRender();

    return () => {
      if (widgetIdRef.current && window.turnstile) {
        try {
          window.turnstile.remove(widgetIdRef.current);
          widgetIdRef.current = undefined;
        } catch (e) {
          console.error('Failed to remove Turnstile widget:', e);
        }
      }
    };
  }, [isClient, siteKey, theme, size]);

  return (
    <div>
      {!siteKey && (
        <div className="text-red-500 text-sm">
          Turnstile siteKey is not configured
        </div>
      )}
      <div ref={containerRef} />
    </div>
  );
}
