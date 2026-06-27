import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/src/lib/supabase';

export type UserRole = 'admin' | 'member' | 'viewer';

interface AppUser {
  uid: string;
  email?: string | null;
  name?: string | null;
  role: UserRole;
}

interface AuthContextType {
  user: AppUser | null;
  loading: boolean;
  signIn: (email: string, pass: string) => Promise<void>;
  signUp: (email: string, pass: string, name: string) => Promise<boolean>;
  logout: () => Promise<void>;
  updateRole: (uid: string, role: UserRole) => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  signIn: async () => {},
  signUp: async () => false,
  logout: async () => {},
  updateRole: async () => {},
});

export const useAuth = () => useContext(AuthContext);

function toAppUser(u: { id: string; email?: string | null; user_metadata?: Record<string, unknown> } | undefined): AppUser | null {
  if (!u) return null;
  const role = (u.user_metadata?.role as UserRole) ?? 'admin'; // 기존 계정은 admin 기본값
  return {
    uid: u.id,
    email: u.email,
    name: (u.user_metadata?.name as string) ?? null,
    role,
  };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setUser(toAppUser(data.session?.user));
      setLoading(false);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(toAppUser(session?.user));
      setLoading(false);
    });

    return () => sub.subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, pass: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password: pass });
    if (error) throw error;
  };

  const signUp = async (email: string, pass: string, name: string): Promise<boolean> => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password: pass,
      options: { data: { name, role: 'member' as UserRole } },
    });
    if (error) throw error;
    return !!data.session;
  };

  const logout = async () => {
    await supabase.auth.signOut();
  };

  const updateRole = async (uid: string, role: UserRole) => {
    const { error } = await supabase.auth.admin.updateUserById(uid, {
      user_metadata: { role },
    });
    if (error) throw error;
  };

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signUp, logout, updateRole }}>
      {children}
    </AuthContext.Provider>
  );
}
