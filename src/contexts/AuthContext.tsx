import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { hasSupabaseConfig, supabase } from '../lib/supabaseClient';
import type { AppUser } from '../types';

interface AuthContextValue {
  user: AppUser | null;
  loading: boolean;
  error: string | null;
  sessionWarningVisible: boolean;
  timeRemaining: number;
  extendSession: () => void;
  signIn: (email: string, password: string) => Promise<boolean>;
  signUp: (email: string, password: string) => Promise<boolean>;
  resetPassword: (email: string) => Promise<boolean>;
  signOut: (reason?: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const createProfileIfNeeded = async (userId: string, email: string): Promise<void> => {
  if (!hasSupabaseConfig || !supabase) {
    return;
  }

  const { data: existingAdmins } = await supabase
    .from('profiles')
    .select('id')
    .eq('role', 'admin')
    .limit(1);

  const role = existingAdmins && existingAdmins.length > 0 ? 'user' : 'admin';
  const approved = role === 'admin';

  await supabase.from('profiles').upsert({
    id: userId,
    email: email.toLowerCase(),
    role,
    approved,
    vendorAccess: false,
  });
};

let lastProfileError: string | null = null;

const fetchProfileByEmail = async (email: string): Promise<AppUser | null> => {
  if (!hasSupabaseConfig || !supabase || !email) {
    return null;
  }

  const { data, error } = await supabase
    .from('profiles')
    .select('id, email, role, approved, vendorAccess')
    .eq('email', email.toLowerCase())
    .limit(1)
    .maybeSingle();

  if (error || !data) {
    const details = {
      message: (error as any)?.message ?? null,
      details: (error as any)?.details ?? null,
      hint: (error as any)?.hint ?? null,
      code: (error as any)?.code ?? null,
    };
    lastProfileError = JSON.stringify(details);
    console.error('fetchProfileByEmail error', details, { error });
    return null;
  }

  lastProfileError = null;

  return {
    id: data.id,
    email: data.email,
    role: data.role,
    approved: data.approved,
    vendorAccess: data.vendorAccess ?? false,
  };
};

const ensureProfileExists = async (userId: string, email: string): Promise<AppUser | null> => {
  if (!hasSupabaseConfig || !supabase) {
    return null;
  }

  let profile = await fetchProfile(userId);
  if (profile) {
    return profile;
  }

  const emailProfile = await fetchProfileByEmail(email);
  if (emailProfile) {
    await supabase.from('profiles').upsert({
      id: userId,
      email: email.toLowerCase(),
      role: emailProfile.role,
      approved: emailProfile.approved,
      vendorAccess: emailProfile.vendorAccess,
    });
    return fetchProfile(userId);
  }

  await createProfileIfNeeded(userId, email);
  return fetchProfile(userId);
};

const fetchProfile = async (userId: string): Promise<AppUser | null> => {
  if (!hasSupabaseConfig || !supabase) {
    return null;
  }

  const { data, error } = await supabase
    .from('profiles')
    .select('id, email, role, approved, vendorAccess')
    .eq('id', userId)
    .limit(1)
    .maybeSingle();

  if (error || !data) {
    const details = {
      message: (error as any)?.message ?? null,
      details: (error as any)?.details ?? null,
      hint: (error as any)?.hint ?? null,
      code: (error as any)?.code ?? null,
    };
    lastProfileError = JSON.stringify(details);
    console.error('fetchProfile error', details, { error });
    return null;
  }

  lastProfileError = null;

  return {
    id: data.id,
    email: data.email,
    role: data.role,
    approved: data.approved,
    vendorAccess: data.vendorAccess ?? false,
  };
};

const SESSION_TIMEOUT_MS = 30 * 60 * 1000;
const WARNING_WINDOW_MS = 5 * 60 * 1000;

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sessionWarningVisible, setSessionWarningVisible] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const sessionExpiryRef = useRef<number | null>(null);

  const resetSessionTimer = useCallback(() => {
    if (!user) {
      sessionExpiryRef.current = null;
      setSessionWarningVisible(false);
      setTimeRemaining(0);
      return;
    }

    sessionExpiryRef.current = Date.now() + SESSION_TIMEOUT_MS;
    setSessionWarningVisible(false);
    setTimeRemaining(0);
  }, [user]);

  const signOut = useCallback(async (reason?: string): Promise<void> => {
    if (!hasSupabaseConfig || !supabase) {
      setUser(null);
      setError(reason ?? null);
      setSessionWarningVisible(false);
      setTimeRemaining(0);
      sessionExpiryRef.current = null;
      return;
    }

    setLoading(true);
    setError(reason ?? null);

    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.error('Session sign-out failed', err);
    } finally {
      setUser(null);
      setLoading(false);
      setSessionWarningVisible(false);
      setTimeRemaining(0);
      sessionExpiryRef.current = null;
    }
  }, []);

  const extendSession = useCallback(() => {
    sessionExpiryRef.current = Date.now() + SESSION_TIMEOUT_MS;
    setSessionWarningVisible(false);
    setTimeRemaining(0);
    setError(null);
  }, []);

  useEffect(() => {
    const loadSession = async () => {
      if (!hasSupabaseConfig || !supabase) {
        setError('Missing Supabase config. Create .env.local with VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.');
        setLoading(false);
        return;
      }

      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (session?.user) {
        const profile = await ensureProfileExists(session.user.id, session.user.email ?? '');
        setUser(profile);
        if (!profile && lastProfileError) {
          setError(lastProfileError);
        }
      }

      setLoading(false);
    };

    loadSession();

    if (hasSupabaseConfig && supabase) {
      const { data: listener } = supabase.auth.onAuthStateChange(async (_event, session) => {
        if (session?.user) {
          const profile = await ensureProfileExists(session.user.id, session.user.email ?? '');
          setUser(profile);
          if (!profile && lastProfileError) {
            setError(lastProfileError);
          }
        } else {
          setUser(null);
        }
      });

      return () => {
        listener.subscription.unsubscribe();
      };
    }

    return undefined;
  }, []);

  useEffect(() => {
    if (!user) {
      sessionExpiryRef.current = null;
      setSessionWarningVisible(false);
      setTimeRemaining(0);
      return;
    }

    resetSessionTimer();

    const activityEvents = ['mousemove', 'keydown', 'click', 'scroll', 'touchstart'];
    const handleActivity = () => {
      sessionExpiryRef.current = Date.now() + SESSION_TIMEOUT_MS;
      setSessionWarningVisible(false);
      setTimeRemaining(0);
    };

    activityEvents.forEach((eventName) => {
      window.addEventListener(eventName, handleActivity, { passive: true });
    });

    const interval = window.setInterval(() => {
      if (!sessionExpiryRef.current) {
        return;
      }

      const remaining = sessionExpiryRef.current - Date.now();
      const secondsRemaining = Math.max(0, Math.ceil(remaining / 1000));
      setTimeRemaining(secondsRemaining);

      if (secondsRemaining > 0 && remaining <= WARNING_WINDOW_MS) {
        setSessionWarningVisible(true);
      } else if (secondsRemaining <= 0) {
        setSessionWarningVisible(false);
        void signOut('Your session expired due to inactivity. Please sign in again.');
      }
    }, 1000);

    return () => {
      activityEvents.forEach((eventName) => {
        window.removeEventListener(eventName, handleActivity);
      });
      window.clearInterval(interval);
    };
  }, [resetSessionTimer, signOut, user]);

  const signIn = async (email: string, password: string): Promise<boolean> => {
    if (!hasSupabaseConfig || !supabase) {
      setError('Missing Supabase config. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.');
      return false;
    }

    setLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.toLowerCase(),
        password,
      });

      if (error) {
        setError(error.message || 'Login failed. Please check your credentials.');
        return false;
      }

      if (data.session?.user) {
        const profile = await ensureProfileExists(data.session.user.id, data.session.user.email ?? '');
        if (!profile) {
          if (lastProfileError) {
            setError(lastProfileError);
          } else {
            setError('Your account is authenticated but no profile was found. Please ask the admin to create or approve your profile in the profiles table.');
          }
          return false;
        }

        setUser(profile);
        if (!profile.approved) {
          setError('Your account is authenticated but pending admin approval. Please ask an admin to approve your profile.');
          return false;
        }
      }

      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Login failed. Please try again.';
      setError(message);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const formatAuthError = (error: unknown): string => {
    const message = error instanceof Error ? error.message : String(error);
    if (message.toLowerCase().includes('rate limit')) {
      return 'Too many signup emails were sent. Please wait a few minutes, then check your confirmation email or use login/password reset instead.';
    }
    if (message.toLowerCase().includes('already registered') || message.toLowerCase().includes('user already exists')) {
      return 'That email is already registered. Try signing in or resetting your password.';
    }
    return message || 'Registration failed. Please try again.';
  };

  const signUp = async (email: string, password: string): Promise<boolean> => {
    if (!hasSupabaseConfig || !supabase) {
      setError('Missing Supabase config. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.');
      return false;
    }

    setLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase.auth.signUp({
        email: email.toLowerCase(),
        password,
      });

      if (error) {
        setError(formatAuthError(error));
        return false;
      }

      if (data.user) {
        await createProfileIfNeeded(data.user.id, email);
        const profile = await fetchProfile(data.user.id);
        setUser(profile);
      }

      return true;
    } catch (err) {
      const message = formatAuthError(err);
      setError(message);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async (email: string): Promise<boolean> => {
    if (!hasSupabaseConfig || !supabase) {
      setError('Missing Supabase config. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.');
      return false;
    }

    setLoading(true);
    setError(null);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email.toLowerCase());
      if (error) {
        setError(formatAuthError(error));
        return false;
      }
      return true;
    } catch (err) {
      const message = formatAuthError(err);
      setError(message);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const value = useMemo(
    () => ({
      user,
      loading,
      error,
      sessionWarningVisible,
      timeRemaining,
      extendSession,
      signIn,
      signUp,
      resetPassword,
      signOut,
    }),
    [user, loading, error, sessionWarningVisible, timeRemaining, extendSession, signIn, signUp, resetPassword, signOut]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextValue => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
