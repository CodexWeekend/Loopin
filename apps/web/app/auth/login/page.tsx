'use client';

import Link from 'next/link';
import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { Compass, Loader2, Mail, Sparkles } from 'lucide-react';

import { Button } from '@/components/ui/button';

const googleEnabled = Boolean(
  process.env.NEXT_PUBLIC_AUTH_GOOGLE_ENABLED === 'true',
);

export default function LoginPage() {
  const [loadingProvider, setLoadingProvider] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleGoogleLogin() {
    setError(null);
    setLoadingProvider('google');

    await signIn('google', { callbackUrl: '/' });
  }

  async function handleDemoLogin() {
    setError(null);
    setLoadingProvider('demo');

    const result = await signIn('credentials', {
      callbackUrl: '/',
      email: 'demo@loopin.local',
      password: 'demo',
      redirect: false,
    });

    if (result?.error) {
      setError(result.error);
      setLoadingProvider(null);
      return;
    }

    window.location.href = '/';
  }

  return (
    <div className="flex min-h-screen">
      <div className="hidden w-1/2 bg-gradient-to-br from-primary/90 to-primary lg:flex lg:flex-col lg:justify-between p-12">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm">
            <Compass className="h-6 w-6 text-white" />
          </div>
          <span className="text-2xl font-bold text-white">Loopin</span>
        </div>

        <div className="space-y-6">
          <h1 className="text-4xl font-bold text-white leading-tight">
            Discover hidden gems,
            <br />
            plan smarter trips.
          </h1>
          <p className="text-lg text-white/80 max-w-md">
            Local MVP with real trip planning surfaces, explore, now, and social views. Google auth works once you set credentials.
          </p>
        </div>

        <div className="flex items-center gap-2 text-white/60 text-sm">
          <Sparkles className="h-4 w-4" />
          <span>Smart itinerary suggestions and social trip planning</span>
        </div>
      </div>

      <div className="flex w-full flex-col justify-center px-8 lg:w-1/2 lg:px-16 xl:px-24 bg-background">
        <div className="mx-auto w-full max-w-md">
          <div className="flex items-center gap-3 mb-8 lg:hidden">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary">
              <Compass className="h-6 w-6 text-primary-foreground" />
            </div>
            <span className="text-2xl font-bold text-foreground">Loopin</span>
          </div>

          <div className="mb-8">
            <h2 className="text-3xl font-bold text-foreground">Welcome back</h2>
            <p className="mt-2 text-muted-foreground">
              Sign in with Google or use the built-in demo traveler account.
            </p>
          </div>

          {error ? (
            <div className="mb-6 rounded-lg border border-destructive/20 bg-destructive/10 p-4">
              <p className="text-sm text-destructive">{error}</p>
            </div>
          ) : null}

          <div className="space-y-4">
            <Button
              type="button"
              className="w-full h-12 text-base font-medium"
              disabled={loadingProvider !== null || !googleEnabled}
              onClick={handleGoogleLogin}
            >
              {loadingProvider === 'google' ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Connecting to Google...
                </>
              ) : (
                <>
                  <svg className="mr-2 h-5 w-5" viewBox="0 0 24 24">
                    <path
                      fill="currentColor"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="currentColor"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                  </svg>
                  Continue with Google
                </>
              )}
            </Button>

            {!googleEnabled ? (
              <p className="text-sm text-muted-foreground">
                Set `AUTH_GOOGLE_ID`, `AUTH_GOOGLE_SECRET`, and `NEXT_PUBLIC_AUTH_GOOGLE_ENABLED=true` to enable Google sign-in.
              </p>
            ) : null}

            <div className="my-6 flex items-center gap-4">
              <div className="h-px flex-1 bg-border" />
              <span className="text-sm text-muted-foreground">or use local demo</span>
              <div className="h-px flex-1 bg-border" />
            </div>

            <Button
              type="button"
              variant="outline"
              className="w-full h-12 text-base font-medium"
              disabled={loadingProvider !== null}
              onClick={handleDemoLogin}
            >
              {loadingProvider === 'demo' ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Opening demo traveler...
                </>
              ) : (
                <>
                  <Mail className="mr-2 h-4 w-4" />
                  Continue as demo traveler
                </>
              )}
            </Button>
          </div>

          <p className="mt-8 text-center text-sm text-muted-foreground">
            Demo login uses `demo@loopin.local` / `demo`. Google auth is ready once you add credentials.
          </p>
          <p className="mt-3 text-center text-sm text-muted-foreground">
            <Link href="/auth/error" className="font-medium text-primary hover:underline">
              Trouble signing in?
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
