'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { signOut as nextAuthSignOut, SessionProvider, useSession } from 'next-auth/react';
import type { Session } from 'next-auth';

type Profile = {
  avatar_url: string | null;
  first_name: string | null;
  id: string;
  interests: string[];
  last_name: string | null;
  travel_style: string | null;
};

type AuthContextType = {
  isLoading: boolean;
  profile: Profile | null;
  refreshProfile: () => Promise<void>;
  session: ReturnType<typeof useSession>['data'];
  signOut: () => Promise<void>;
  user:
    | {
        created_at: string;
        email: string | null | undefined;
        id: string;
      }
    | null;
};

const AuthContext = createContext<AuthContextType>({
  isLoading: true,
  profile: null,
  refreshProfile: async () => {},
  session: null,
  signOut: async () => {},
  user: null,
});

function AuthStateProvider({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const [profile, setProfile] = useState<Profile | null>(null);

  async function refreshProfile() {
    if (!session?.user?.id) {
      setProfile(null);
      return;
    }

    const response = await fetch('/api/me', { cache: 'no-store' });

    if (!response.ok) {
      setProfile(null);
      return;
    }

    const payload = (await response.json()) as { profile: Profile | null };
    setProfile(payload.profile);
  }

  useEffect(() => {
    void refreshProfile();
  }, [session?.user?.id]);

  return (
    <AuthContext.Provider
      value={{
        isLoading: status === 'loading',
        profile,
        refreshProfile,
        session,
        signOut: async () => {
          await nextAuthSignOut({ callbackUrl: '/auth/login' });
        },
        user: session?.user
          ? {
              created_at: new Date().toISOString(),
              email: session.user.email,
              id: session.user.id,
            }
          : null,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function AuthProvider({
  children,
  session,
}: {
  children: React.ReactNode;
  session: Session | null;
}) {
  return (
    <SessionProvider session={session}>
      <AuthStateProvider>{children}</AuthStateProvider>
    </SessionProvider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
