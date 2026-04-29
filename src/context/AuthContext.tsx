import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import { useQueryClient } from "@tanstack/react-query";
import type { Session } from "@supabase/supabase-js";
import { getSupabase, isSupabaseConfigured } from "@/lib/supabase";
import {
  fetchProfile,
  updateProfileInDb,
  type UserProfile,
} from "@/lib/supabase-db";

export type { UserProfile };

interface AuthContextType {
  user: UserProfile | null;
  login: (email: string, password: string) => Promise<{ ok: boolean; error?: string }>;
  register: (name: string, email: string, password: string) => Promise<{ ok: boolean; error?: string }>;
  logout: () => Promise<void>;
  updateProfile: (updates: Partial<Pick<UserProfile, "name" | "goal" | "unit" | "avatarUrl">>) => Promise<void>;
  isLoading: boolean;
  supabaseConfigured: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const qc = useQueryClient();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const supabaseConfigured = isSupabaseConfigured();

  useEffect(() => {
    if (!supabaseConfigured) {
      setUser(null);
      setIsLoading(false);
      return;
    }

    const supabase = getSupabase();
    let cancelled = false;

    const applySession = async (session: Session | null) => {
      if (!session?.user) {
        if (!cancelled) setUser(null);
        return;
      }
      try {
        const profile = await fetchProfile(session.user.id, session.user.email ?? "");
        if (!cancelled) setUser(profile);
      } catch {
        if (!cancelled) setUser(null);
      }
    };

    supabase.auth
      .getSession()
      .then(({ data: { session } }) => applySession(session))
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      void applySession(session);
      if (event === "SIGNED_IN" || event === "SIGNED_OUT") {
        qc.invalidateQueries({ queryKey: ["workouts"] });
        qc.invalidateQueries({ queryKey: ["workout-plans"] });
      }
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, [qc, supabaseConfigured]);

  const login = async (email: string, password: string) => {
    if (!supabaseConfigured) {
      return { ok: false, error: "Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to .env.local." };
    }
    const { error } = await getSupabase().auth.signInWithPassword({ email, password });
    if (error) return { ok: false, error: "Invalid email or password." };
    return { ok: true };
  };

  const register = async (name: string, email: string, password: string) => {
    if (!supabaseConfigured) {
      return { ok: false, error: "Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to .env.local." };
    }
    const { data, error } = await getSupabase().auth.signUp({
      email,
      password,
      options: { data: { name } },
    });
    if (error) return { ok: false, error: error.message };
    if (!data.session) {
      return {
        ok: false,
        error: "Confirm your email from the inbox link, then sign in (or disable email confirmation in Supabase Auth settings for dev).",
      };
    }
    return { ok: true };
  };

  const logout = async () => {
    if (supabaseConfigured) await getSupabase().auth.signOut();
    setUser(null);
  };

  const updateProfile = async (updates: Partial<Pick<UserProfile, "name" | "goal" | "unit" | "avatarUrl">>) => {
    if (!user) return;
    await updateProfileInDb(user.id, updates);
    setUser((prev) => (prev ? { ...prev, ...updates } : prev));
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        register,
        logout,
        updateProfile,
        isLoading,
        supabaseConfigured,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
};
