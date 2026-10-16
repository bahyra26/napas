import { useState, useEffect } from 'react';

type LoadingListener = (isFetching: boolean, count: number, activeKeys: Set<string>) => void;

class LoadingTracker {
  private activeCount = 0;
  private activeKeys = new Set<string>();
  private listeners: Set<LoadingListener> = new Set();

  /**
   * Mulai operasi pemuatan data
   * @param key Identifikasi opsional untuk query tertentu (mis. 'radar', 'workload')
   */
  start(key?: string): void {
    this.activeCount++;
    if (key) {
      this.activeKeys.add(key);
    }
    this.notify();
  }

  /**
   * Selesai operasi pemuatan data
   * @param key Identifikasi opsional yang selesai
   */
  end(key?: string): void {
    this.activeCount = Math.max(0, this.activeCount - 1);
    if (key) {
      this.activeKeys.delete(key);
    }
    this.notify();
  }

  /**
   * Bungkus promise fungsi async agar otomatis mentrigger animasi loading
   */
  async wrap<T>(promise: Promise<T>, key?: string): Promise<T> {
    this.start(key);
    try {
      const result = await promise;
      return result;
    } finally {
      this.end(key);
    }
  }

  get isFetching(): boolean {
    return this.activeCount > 0;
  }

  get count(): number {
    return this.activeCount;
  }

  hasKey(key: string): boolean {
    return this.activeKeys.has(key);
  }

  subscribe(listener: LoadingListener): () => void {
    this.listeners.add(listener);
    // Langsung berikan state terkini ke subscriber baru
    listener(this.isFetching, this.activeCount, new Set(this.activeKeys));
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify(): void {
    const isFetching = this.isFetching;
    const count = this.activeCount;
    const keysCopy = new Set(this.activeKeys);
    this.listeners.forEach((listener) => {
      try {
        listener(isFetching, count, keysCopy);
      } catch (err) {
        console.error('Error in LoadingTracker listener:', err);
      }
    });
  }
}

export const loadingTracker = new LoadingTracker();

/**
 * React Hook untuk mendeteksi apakah ada pemuatan data yang sedang aktif
 * @param keyFilter Opsional: filter untuk kategori tertentu (mis. 'radar', 'focus')
 */
export function useIsFetching(keyFilter?: string): boolean {
  const [isFetching, setIsFetching] = useState<boolean>(() => {
    if (keyFilter) {
      return loadingTracker.hasKey(keyFilter);
    }
    return loadingTracker.isFetching;
  });

  useEffect(() => {
    const unsubscribe = loadingTracker.subscribe((globalFetching, _count, activeKeys) => {
      if (keyFilter) {
        setIsFetching(activeKeys.has(keyFilter));
      } else {
        setIsFetching(globalFetching);
      }
    });
    return unsubscribe;
  }, [keyFilter]);

  return isFetching;
}

/**
 * React Hook untuk mendapatkan jumlah total data fetching yang aktif
 */
export function useActiveFetchCount(): number {
  const [count, setCount] = useState<number>(() => loadingTracker.count);

  useEffect(() => {
    const unsubscribe = loadingTracker.subscribe((_globalFetching, currentCount) => {
      setCount(currentCount);
    });
    return unsubscribe;
  }, []);

  return count;
}
