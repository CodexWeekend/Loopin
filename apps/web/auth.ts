import type { DefaultSession, NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import GoogleProvider from 'next-auth/providers/google';

import { ensureDemoData, upsertUser } from '@/lib/local-db';

const googleEnabled = Boolean(process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET);

const providers: NextAuthOptions['providers'] = [
  CredentialsProvider({
    credentials: {
      email: { label: 'Email', type: 'email' },
      password: { label: 'Password', type: 'password' },
    },
    async authorize(credentials) {
      if (credentials?.email !== 'demo@loopin.local' || credentials.password !== 'demo') {
        return null;
      }

      ensureDemoData();
      const user = upsertUser({
        email: 'demo@loopin.local',
        firstName: 'Demo',
        image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=demo',
        lastName: 'Traveler',
        name: 'Demo Traveler',
        provider: 'credentials',
      });

      return {
        email: user.email,
        id: user.id,
        image: user.image,
        name: user.name,
      };
    },
    name: 'Demo Login',
  }),
];

if (googleEnabled) {
  providers.unshift(
    GoogleProvider({
      clientId: process.env.AUTH_GOOGLE_ID as string,
      clientSecret: process.env.AUTH_GOOGLE_SECRET as string,
    }),
  );
}

export const authOptions: NextAuthOptions = {
  callbacks: {
    async jwt({ token, user }) {
      if (user?.id) {
        token.sub = user.id;
      }

      return token;
    },
    async session({ session, token, user }) {
      if (session.user) {
        session.user.email = user?.email ?? session.user.email;
        session.user.id = token.sub as string;
        session.user.image = user?.image ?? session.user.image;
        session.user.name = user?.name ?? session.user.name;
      }

      return session;
    },
    async signIn({ account, user }) {
      if (user.email) {
        upsertUser({
          email: user.email,
          firstName: user.name?.split(' ')[0] ?? 'Traveler',
          image: user.image,
          lastName: user.name?.split(' ').slice(1).join(' ') || null,
          name: user.name,
          provider: account?.provider ?? 'credentials',
        });
      }

      return true;
    },
  },
  pages: {
    error: '/auth/error',
    signIn: '/auth/login',
  },
  providers,
  session: { strategy: 'jwt' },
  secret: process.env.AUTH_SECRET,
};

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
    } & DefaultSession['user'];
  }
}
