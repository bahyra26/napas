import { createClient, SupabaseClient, Session } from '@supabase/supabase-js';
import { API_BASE_URL } from './api';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://enzizvrvfogjjgctpmli.supabase.co';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

let supabaseClient: SupabaseClient | null = null;

try {
  if (SUPABASE_URL && SUPABASE_ANON_KEY) {
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
      return { error: 'Layanan autentikasi sedang tidak tersedia.' };
    }
    try {
      let email = emailOrUsername.trim();
      if (!email.includes('@')) {
        const knownUsernames: Record<string, string> = {
          maikotampan: 'h4trayyan@gmail.com',
          miko1908: 'mikailcoding64@gmail.com',
          mikailcoding64: 'mikailcoding64@gmail.com',
          mikail: 'mikail@napas.local',
          hiqanz: 'haqqinazili9@gmail.com',
          'haq!': 'haqqinazili@gmail.com',
          nyapo: '5027261073@student.its.ac.id',
        };
        const lower = email.toLowerCase();
        if (knownUsernames[lower]) {
          email = knownUsernames[lower];
        } else {
          try {
            const { data: userMatch } = await supabaseClient
              .from('users')
              .select('email')
              .ilike('nama', email)
              .maybeSingle();
            if (userMatch?.email) {
              email = userMatch.email;
            } else {
              email = `${email}@napas.app`;
            }
          } catch {
            email = `${email}@napas.app`;
          }
        }
      }

      let { data, error } = await supabaseClient.auth.signInWithPassword({
        email,
        password,
      });

      // Jika error terkait email belum dikonfirmasi, minta backend (yang memegang service_role) untuk auto-confirm secara aman
      if (error && error.message.toLowerCase().includes('not confirmed')) {
        try {
          const confirmRes = await fetch(`${API_BASE_URL}/users/auto-confirm`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email }),
          });
          if (confirmRes.ok) {
            const retryRes = await supabaseClient.auth.signInWithPassword({ email, password });
            if (!retryRes.error && retryRes.data.user) {
              data = retryRes.data;
              error = null;
            }
          }
        } catch (confirmErr) {
          console.warn('Backend auto-confirm attempt failed:', confirmErr);
        }
      }

      if (error) return { error: error.message };

      if (data?.user) {
        let finalUser = data.user;
        try {
          const { data: pubUser } = await supabaseClient
            .from('users')
            .select('*')
            .eq('email', data.user.email)
            .maybeSingle();
          if (pubUser) {
            finalUser = {
              ...data.user,
              id: pubUser.id,
              user_metadata: {
                ...data.user.user_metadata,
                full_name: pubUser.nama || data.user.user_metadata?.full_name,
              },
            };
          }
        } catch {}
        return { user: finalUser };
      }

      return { error: 'Gagal mendapatkan data sesi pengguna' };
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
      return { error: 'Layanan pendaftaran sedang tidak tersedia.' };
    }
    const cleanEmail = params.email.trim();
    const cleanName = params.fullName.trim();
    const cleanUser = params.username.trim();

    // 1. Coba daftarkan via backend API (menggunakan service_role di server agar email langsung terkonfirmasi)
    try {
      const regRes = await fetch(`${API_BASE_URL}/users/register-direct`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: cleanEmail,
          password: params.password,
          full_name: cleanName,
          username: cleanUser,
        }),
      });

      if (regRes.ok) {
        const regData = await regRes.json();
        if (regData.status === 'success' && regData.user) {
          // Otomatis login akun baru
          const loginRes = await this.signInWithPassword(cleanEmail, params.password);
          if (loginRes.user) {
            return { user: loginRes.user };
          }
          return { user: regData.user };
        }
      }
    } catch (backendErr) {
      console.warn('Backend direct signup failed, fallback to client auth:', backendErr);
    }

    // 2. Fallback ke standard client signup jika backend offline
    try {
      const { data, error } = await supabaseClient.auth.signUp({
        email: cleanEmail,
        password: params.password,
        options: {
          data: {
            full_name: cleanName,
            username: cleanUser,
          },
        },
      });

      if (error) return { error: error.message };

      if (data.user?.id) {
        try {
          await supabaseClient.from('users').upsert({
            id: data.user.id,
            nama: cleanName,
            email: cleanEmail,
            consent_camera: true,
            consent_window: true,
            baseline_blink_rate: 15.0,
          });
        } catch {}
      }

      return { user: data.user };
    } catch (err: any) {
      return { error: err?.message || 'Gagal mendaftar akun' };
    }
  },

  async resetPassword(email: string): Promise<{ error?: string }> {
    if (!supabaseClient) {
      return { error: 'Layanan reset password sedang tidak tersedia.' };
    }
    try {
      const redirectUrl = window.location.origin + window.location.pathname;
      const { error } = await supabaseClient.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: redirectUrl,
      });
      if (error) return { error: error.message };
      return {};
    } catch (err: any) {
      return { error: err?.message || 'Gagal mengirim email reset password' };
    }
  },

  async signInWithGoogle(): Promise<{ error?: string }> {
    if (!supabaseClient) {
      return {
        error: 'Layanan autentikasi Google sedang dalam pemeliharaan. Silakan gunakan opsi sinkronisasi lainnya.',
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
      if (data?.session?.provider_token) {
        localStorage.setItem('napas_provider_token', data.session.provider_token);
      }
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
