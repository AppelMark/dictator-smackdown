'use client';

import { useState, useEffect } from 'react';
import { createBrowserClient } from '@/lib/supabase';

interface SaveProgressSheetProps {
  authProvider: string | null;
  onSaved: () => void;
  onDismiss: () => void;
}

function shouldShow(authProvider: string | null): boolean {
  if (authProvider) return false;
  if (typeof window === 'undefined') return false;
  const dismissed = localStorage.getItem('dictator_dismissed_save_today');
  const today = new Date().toISOString().split('T')[0];
  return dismissed !== today;
}

export default function SaveProgressSheet({
  authProvider,
  onSaved,
  onDismiss,
}: SaveProgressSheetProps): React.JSX.Element | null {
  const [visible, setVisible] = useState(false);
  const [slidIn, setSlidIn] = useState(false);
  const [loadingGoogle, setLoadingGoogle] = useState(false);
  const [loadingApple, setLoadingApple] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    if (shouldShow(authProvider)) {
      setVisible(true);
      requestAnimationFrame(() => {
        requestAnimationFrame(() => setSlidIn(true));
      });
    }
    setIsIOS(/iPad|iPhone|iPod/.test(navigator.userAgent));
  }, [authProvider]);

  if (!visible) return null;

  const handleGoogle = async (): Promise<void> => {
    setLoadingGoogle(true);
    const supabase = createBrowserClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    if (error) {
      setLoadingGoogle(false);
    } else {
      onSaved();
    }
  };

  const handleApple = async (): Promise<void> => {
    setLoadingApple(true);
    const supabase = createBrowserClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'apple',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    if (error) {
      setLoadingApple(false);
    } else {
      onSaved();
    }
  };

  const handleDismiss = (): void => {
    const today = new Date().toISOString().split('T')[0];
    localStorage.setItem('dictator_dismissed_save_today', today);
    setSlidIn(false);
    setTimeout(() => {
      setVisible(false);
      onDismiss();
    }, 300);
  };

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 50,
        transform: slidIn ? 'translateY(0)' : 'translateY(100%)',
        transition: 'transform 300ms ease-out',
      }}
    >
      <div
        style={{
          backgroundColor: '#1a1a2e',
          borderTop: '2px solid #FFD700',
          borderRadius: '16px 16px 0 0',
          padding: '24px 20px 32px',
          maxWidth: '390px',
          margin: '0 auto',
        }}
      >
        <div style={{ textAlign: 'center', fontSize: '48px', marginBottom: '12px' }}>
          🏆
        </div>

        <p
          style={{
            color: '#CCCCCC',
            fontSize: '14px',
            textAlign: 'center',
            lineHeight: '1.5',
            marginBottom: '20px',
          }}
        >
          Your trophy is saved locally. Sign in to keep it forever — even if you
          reinstall the app.
        </p>

        <button
          onClick={handleGoogle}
          disabled={loadingGoogle || loadingApple}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '10px',
            width: '100%',
            padding: '12px',
            backgroundColor: '#FFFFFF',
            color: '#333333',
            fontSize: '15px',
            fontWeight: 600,
            borderRadius: '10px',
            border: 'none',
            cursor: loadingGoogle ? 'wait' : 'pointer',
            opacity: loadingApple ? 0.5 : 1,
            marginBottom: '10px',
          }}
        >
          <svg width="18" height="18" viewBox="0 0 48 48">
            <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
            <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
            <path fill="#FBBC05" d="M10.53 28.59a14.5 14.5 0 0 1 0-9.18l-7.98-6.19a24.04 24.04 0 0 0 0 21.56l7.98-6.19z" />
            <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
          </svg>
          {loadingGoogle ? 'Signing in...' : 'Continue with Google'}
        </button>

        {isIOS && (
          <button
            onClick={handleApple}
            disabled={loadingGoogle || loadingApple}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px',
              width: '100%',
              padding: '12px',
              backgroundColor: '#000000',
              color: '#FFFFFF',
              fontSize: '15px',
              fontWeight: 600,
              borderRadius: '10px',
              border: '1px solid #333333',
              cursor: loadingApple ? 'wait' : 'pointer',
              opacity: loadingGoogle ? 0.5 : 1,
              marginBottom: '10px',
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="white">
              <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
            </svg>
            {loadingApple ? 'Signing in...' : 'Continue with Apple'}
          </button>
        )}

        <button
          onClick={handleDismiss}
          style={{
            display: 'block',
            margin: '8px auto 0',
            background: 'none',
            border: 'none',
            color: '#666666',
            fontSize: '13px',
            cursor: 'pointer',
            textDecoration: 'underline',
          }}
        >
          Not now
        </button>
      </div>
    </div>
  );
}
