import { createClient, SupabaseClient, Session } from '@supabase/supabase-js';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://enzizvrvfogjjgctpmli.supabase.co';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVueml6dnJ2Zm9nampnY3RwbWxpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4OTM2MTY2NywiZXhwIjoyMTA0OTM3NjY3fQ.WRZlF1Mn8rv-yX--mv6go5YQXYS-xix2vMPrF8VzG9o';

let supabaseClient: SupabaseClient | null = null;

try {
  if (SUPABASE_URL) {
    supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    });
  }
} catch (e) {
  console.warn('Supabase client init error:', e);
}

export const supabase = supabaseClient;

export interface AuthUser {
  id: string;
  email?: string;
  name?: string;
  avatarUrl?: string;
  providerToken?: string | null;
}

export const authService = {
  isConfigured(): boolean {
    return !!supabaseClient;
  },

  async signInWithPassword(emailOrUsername: string, password: string): Promise<{ user?: any; error?: string }> {
    if (!supabaseClient) {
      return { error: 'Supabase client belum terkonfigurasi' };
    }
    try {
      const email = emailOrUsername.includes('@') ? emailOrUsername.trim() : `${emailOrUsername.trim()}@napas.app`;
      const { data, error } = await supabaseClient.auth.signInWithPassword({
        email,
        password,
      });
      if (error) return { error: error.message };
      return { user: data.user };
    } catch (err: any) {
      return { error: err?.message || 'Gagal masuk akun' };
    }
  },

  async signUpWithEmail(params: {
    email: string;
    password: string;
    fullName: string;
    username: string;
  }): Promise<{ user?: any; error?: string }> {
    if (!supabaseClient) {
      return { error: 'Supabase client belum terkonfigurasi' };
    }
    try {
      const { data, error } = await supabaseClient.auth.signUp({
        email: params.email.trim(),
        password: params.password,
        options: {
          data: {
            full_name: params.fullName.trim(),
            username: params.username.trim(),
          },
        },
      });
      if (error) return { error: error.message };
      return { user: data.user };
    } catch (err: any) {
      return { error: err?.message || 'Gagal mendaftar akun' };
    }
  },

  async signInWithGoogle(): Promise<{ error?: string }> {
    if (!supabaseClient) {
      return {
        error: 'Kredensial Supabase (VITE_SUPABASE_URL & VITE_SUPABASE_ANON_KEY) belum diisi di .env.',
      };
    }

    try {
      const redirectUrl = window.location.origin + window.location.pathname;
      const { error } = await supabaseClient.auth.signInWithOAuth({
        provider: 'google',
        options: {
          scopes: 'https://www.googleapis.com/auth/calendar.readonly https://www.googleapis.com/auth/calendar.events',
          redirectTo: redirectUrl,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      });

      if (error) return { error: error.message };
      return {};
    } catch (err: any) {
      return { error: err?.message || 'Gagal memulai login Google' };
    }
  },

  async signOut(): Promise<void> {
    if (supabaseClient) {
      try {
        await supabaseClient.auth.signOut();
      } catch (e) {
        console.warn('Sign out error:', e);
      }
    }
    localStorage.removeItem('napas_user_id');
    localStorage.removeItem('napas_user_name');
    localStorage.removeItem('napas_user_email');
    localStorage.removeItem('napas_user_avatar');
    localStorage.removeItem('napas_provider_token');
    localStorage.removeItem('napas_demo_mode');
  },

  async getSession(): Promise<Session | null> {
    if (!supabaseClient) return null;
    try {
      const { data } = await supabaseClient.auth.getSession();
      return data.session;
    } catch {
      return null;
    }
  },

  getStoredProviderToken(): string | null {
    return localStorage.getItem('napas_provider_token');
  },

  setStoredProviderToken(token: string) {
    localStorage.setItem('napas_provider_token', token);
  },

  onAuthStateChange(callback: (session: Session | null) => void) {
    if (!supabaseClient) return () => {};
    const { data: authListener } = supabaseClient.auth.onAuthStateChange((_event, session) => {
      if (session?.provider_token) {
        localStorage.setItem('napas_provider_token', session.provider_token);
      }
      callback(session);
    });
    return () => {
      authListener.subscription.unsubscribe();
    };
  },
};
