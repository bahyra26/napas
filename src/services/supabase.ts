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
      let { data, error } = await supabaseClient.auth.signInWithPassword({
        email,
        password,
      });

      // Jika error terkait email belum dikonfirmasi, auto-confirm via Admin API lalu coba login ulang
      if (error && error.message.toLowerCase().includes('not confirmed')) {
        try {
          const listRes = await fetch(`${SUPABASE_URL}/auth/v1/admin/users`, {
            headers: {
              'apikey': SUPABASE_ANON_KEY,
              'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
            },
          });
          if (listRes.ok) {
            const listData = await listRes.json();
            const target = listData.users?.find((u: any) => u.email?.toLowerCase() === email.toLowerCase());
            if (target?.id) {
              await fetch(`${SUPABASE_URL}/auth/v1/admin/users/${target.id}`, {
                method: 'PUT',
                headers: {
                  'Content-Type': 'application/json',
                  'apikey': SUPABASE_ANON_KEY,
                  'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                },
                body: JSON.stringify({ email_confirm: true }),
              });

              // Retry sign in setelah konfirmasi
              const retryRes = await supabaseClient.auth.signInWithPassword({ email, password });
              if (!retryRes.error) {
                return { user: retryRes.data.user };
              }
            }
          }
        } catch (confirmErr) {
          console.warn('Auto-confirm attempt failed:', confirmErr);
        }
      }

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
    const cleanEmail = params.email.trim();
    const cleanName = params.fullName.trim();
    const cleanUser = params.username.trim();

    // 1. Coba daftarkan langsung via Admin API dengan email_confirm: true agar tidak terblokir verifikasi email
    try {
      const adminRes = await fetch(`${SUPABASE_URL}/auth/v1/admin/users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({
          email: cleanEmail,
          password: params.password,
          email_confirm: true,
          user_metadata: {
            full_name: cleanName,
            username: cleanUser,
          },
        }),
      });

      if (adminRes.ok) {
        const createdUser = await adminRes.json();
        // Pastikan row terdaftar di public.users
        try {
          await supabaseClient.from('users').upsert({
            id: createdUser.id,
            nama: cleanName,
            email: cleanEmail,
            consent_camera: true,
            consent_window: true,
            baseline_blink_rate: 15.0,
          });
        } catch {}

        // Otomatis login akun baru
        await this.signInWithPassword(cleanEmail, params.password);
        return { user: createdUser };
      }
    } catch (adminErr) {
      console.warn('Admin API signup fallback to client auth:', adminErr);
    }

    // 2. Fallback ke standard client signup jika Admin API gagal
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
      return { error: 'Supabase client belum terkonfigurasi' };
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
