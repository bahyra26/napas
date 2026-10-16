/**
 * NAPAS PWA & Service Worker Manager
 * 
 * Mengelola instalasi aplikasi PWA ke Desktop / Android / iOS,
 * manajemen cache offline, dan deteksi status konektivitas.
 */

type Listener<T> = (data: T) => void;

class PwaManager {
  private deferredPrompt: any = null;
  private canInstallState = false;
  private isInstalledState = false;
  private isOnlineState = typeof navigator !== 'undefined' ? navigator.onLine : true;
  private updateAvailableState = false;

  private installableListeners: Set<Listener<boolean>> = new Set();
  private onlineListeners: Set<Listener<boolean>> = new Set();
  private updateListeners: Set<Listener<boolean>> = new Set();

  constructor() {
    this.checkStandalone();
    this.initListeners();
  }

  private checkStandalone() {
    if (typeof window !== 'undefined') {
      const isStandalone =
        window.matchMedia('(display-mode: standalone)').matches ||
        (navigator as any).standalone === true ||
        document.referrer.includes('android-app://');

      this.isInstalledState = isStandalone;
      if (isStandalone) {
        this.canInstallState = false;
      }
    }
  }

  private initListeners() {
    if (typeof window === 'undefined') return;

    // 1. Tangkap event beforeinstallprompt (Chrome, Edge, Android)
    window.addEventListener('beforeinstallprompt', (e: Event) => {
      e.preventDefault();
      this.deferredPrompt = e;
      this.canInstallState = true;
      this.notifyInstallable(true);
    });

    // 2. Tangkap event appinstalled
    window.addEventListener('appinstalled', () => {
      this.deferredPrompt = null;
      this.canInstallState = false;
      this.isInstalledState = true;
      this.notifyInstallable(false);
    });

    // 3. Pantau status jaringan online / offline
    window.addEventListener('online', () => {
      this.isOnlineState = true;
      this.notifyOnline(true);
    });

    window.addEventListener('offline', () => {
      this.isOnlineState = false;
      this.notifyOnline(false);
    });
  }

  /**
   * Daftarkan Service Worker
   */
  public registerServiceWorker() {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
      return;
    }

    window.addEventListener('load', () => {
      navigator.serviceWorker
        .register('./sw.js', { scope: './' })
        .then((registration) => {
          // Trigger pembaruan aktif
          registration.update().catch(() => {});

          // Pantau pembaruan service worker
          registration.onupdatefound = () => {
            const installingWorker = registration.installing;
            if (installingWorker) {
              installingWorker.onstatechange = () => {
                if (installingWorker.state === 'installed') {
                  if (navigator.serviceWorker.controller) {
                    console.log('[PWA] Update baru terdeteksi. Mengaktifkan...');
                    installingWorker.postMessage({ type: 'SKIP_WAITING' });
                    this.updateAvailableState = true;
                    this.notifyUpdate(true);
                  }
                }
              };
            }
          };
        })
        .catch((err) => {
          console.warn('[PWA] Service Worker registration failed:', err);
        });

      // Otomatis reload halaman begitu controller baru mengklaim halaman
      let refreshing = false;
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        if (!refreshing) {
          refreshing = true;
          console.log('[PWA] Versi baru aktif. Memuat ulang halaman...');
          window.location.reload();
        }
      });
    });
  }

  /**
   * Pemicu dialog instalasi PWA ke perangkat
   */
  public async promptInstall(): Promise<'accepted' | 'dismissed' | 'unsupported'> {
    if (!this.deferredPrompt) {
      return 'unsupported';
    }

    try {
      this.deferredPrompt.prompt();
      const choiceResult = await this.deferredPrompt.userChoice;
      this.deferredPrompt = null;
      this.canInstallState = false;
      this.notifyInstallable(false);

      if (choiceResult.outcome === 'accepted') {
        this.isInstalledState = true;
        return 'accepted';
      }
      return 'dismissed';
    } catch (err) {
      console.warn('[PWA] Prompt error:', err);
      return 'unsupported';
    }
  }

  // Getters
  public canInstall(): boolean {
    return this.canInstallState;
  }

  public isInstalled(): boolean {
    return this.isInstalledState;
  }

  public isOnline(): boolean {
    return this.isOnlineState;
  }

  public isUpdateAvailable(): boolean {
    return this.updateAvailableState;
  }

  // Observers
  public onInstallableChange(cb: Listener<boolean>): () => void {
    this.installableListeners.add(cb);
    cb(this.canInstallState);
    return () => this.installableListeners.delete(cb);
  }

  public onOnlineChange(cb: Listener<boolean>): () => void {
    this.onlineListeners.add(cb);
    cb(this.isOnlineState);
    return () => this.onlineListeners.delete(cb);
  }

  public onUpdateAvailable(cb: Listener<boolean>): () => void {
    this.updateListeners.add(cb);
    cb(this.updateAvailableState);
    return () => this.updateListeners.delete(cb);
  }

  private notifyInstallable(val: boolean) {
    this.installableListeners.forEach((cb) => cb(val));
  }

  private notifyOnline(val: boolean) {
    this.onlineListeners.forEach((cb) => cb(val));
  }

  private notifyUpdate(val: boolean) {
    this.updateListeners.forEach((cb) => cb(val));
  }
}

export const pwaService = new PwaManager();
