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
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const scriptId = 'cf-turnstile-script';

    const initScript = () => {
      if (document.getElementById(scriptId)) {
        if (window.turnstile) {
          setIsReady(true);
        }
        return;
      }

      const script = document.createElement('script');
      script.id = scriptId;
      script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
      script.async = true;
      script.defer = true;

      script.onload = () => {
        setIsReady(true);
      };

      script.onerror = () => {
        console.error('Failed to load Turnstile script');
      };

      document.body.appendChild(script);
    };

    initScript();
  }, []);

  useEffect(() => {
    if (!isReady || !containerRef.current || !window.turnstile || !siteKey) return;

    const id = window.turnstile.render(containerRef.current, {
      sitekey: siteKey,
      theme,
      size,
      callback: (token: string) => {
        onVerify(token);
      },
      'expired-callback': () => {
        onExpire?.();
      },
      'error-callback': () => {
        onError?.();
      },
    });

    widgetIdRef.current = id;

    return () => {
      if (widgetIdRef.current && window.turnstile) {
        try {
          window.turnstile.remove(widgetIdRef.current);
        } catch (e) {
          console.error('Failed to remove Turnstile widget:', e);
        }
      }
    };
  }, [isReady, siteKey, theme, size, onVerify, onExpire, onError]);

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
