import Link from 'next/link';
import { Compass } from 'lucide-react';

import { Button } from '@/components/ui/button';

export default function AuthErrorPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-6">
      <div className="max-w-md rounded-3xl border bg-card p-8 text-center shadow-sm">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary">
          <Compass className="h-6 w-6 text-primary-foreground" />
        </div>
        <h1 className="text-2xl font-bold text-foreground">Sign-in issue</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          Google auth needs valid local credentials. You can go back and use the built-in demo traveler flow while you set up OAuth.
        </p>
        <div className="mt-6 flex flex-col gap-3">
          <Button asChild>
            <Link href="/auth/login">Back to login</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
