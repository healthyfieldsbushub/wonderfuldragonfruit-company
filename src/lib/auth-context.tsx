import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, Session } from '@/integrations/manus/client';
import { appClient } from '@/integrations/manus/client';

interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  [key: string]: unknown;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  isAdmin: boolean;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string, fullName?: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function asError(error: unknown): Error | null {
  if (!error) return null;
  return error instanceof Error ? error : new Error(typeof error === 'string' ? error : (error as { message?: string }).message || 'Authentication failed');
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const fetchUserData = async (userId: string) => {
    try {
      const { data: profileData } = await appClient.from<Profile>('profiles').select('*').eq('id', userId).maybeSingle();
      if (profileData) setProfile(profileData);
      const { data: roleData } = await appClient.from('user_roles').select('role').eq('user_id', userId).eq('role', 'admin').maybeSingle();
      setIsAdmin(Boolean(roleData));
    } catch (error) {
      console.error('Error fetching application user data:', error);
    }
  };

  useEffect(() => {
    let active = true;
    const applySession = async (nextSession: Session | null) => {
      if (!active) return;
      setSession(nextSession);
      setUser(nextSession?.user ?? null);
      if (nextSession?.user?.id) await fetchUserData(nextSession.user.id);
      else { setProfile(null); setIsAdmin(false); }
      setIsLoading(false);
    };

    const { data: { subscription } } = appClient.auth.onAuthStateChange((_event, nextSession) => { void applySession(nextSession); });
    void appClient.auth.getSession().then(({ data }) => applySession(data.session));
    return () => { active = false; subscription.unsubscribe(); };
  }, []);

  const startManusLogin = () => {
    const returnTo = `${window.location.origin}/`;
    window.location.assign(`/api/auth/login?returnTo=${encodeURIComponent(returnTo)}`);
  };

  const signIn = async () => {
    startManusLogin();
    return { error: null };
  };

  const signUp = async () => {
    startManusLogin();
    return { error: null };
  };

  const signOut = async () => {
    await appClient.auth.signOut();
    setUser(null); setSession(null); setProfile(null); setIsAdmin(false);
  };

  return (
    <AuthContext.Provider value={{ user, session, profile, isAdmin, isLoading, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
