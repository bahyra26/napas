// Focus Guardian: Web-Native Focus Mode & Website Whitelist Engine

export interface WhitelistWebsite {
  id: string;
  name: string;
  url: string;
  domain: string;
  category: 'elearning' | 'docs' | 'research' | 'code' | 'other';
  icon: string;
}

export const DEFAULT_STUDENT_WHITELIST: WhitelistWebsite[] = [
  {
    id: 'w-1',
    name: 'E-Learning Kampus',
    url: 'https://elearning.ugm.ac.id',
    domain: 'elearning.ugm.ac.id',
    category: 'elearning',
    icon: '🎓',
  },
  {
    id: 'w-2',
    name: 'Google Docs & Drive',
    url: 'https://docs.google.com',
    domain: 'docs.google.com',
    category: 'docs',
    icon: '📝',
  },
  {
    id: 'w-3',
    name: 'Notion Workspace',
    url: 'https://notion.so',
    domain: 'notion.so',
    category: 'docs',
    icon: '📑',
  },
  {
    id: 'w-4',
    name: 'GitHub / GitLab',
    url: 'https://github.com',
    domain: 'github.com',
    category: 'code',
    icon: '💻',
  },
  {
    id: 'w-5',
    name: 'Jurnal & Perpustakaan',
    url: 'https://journal.ugm.ac.id',
    domain: 'journal.ugm.ac.id',
    category: 'research',
    icon: '📚',
  },
  {
    id: 'w-6',
    name: 'Wikipedia Indonesia',
    url: 'https://id.wikipedia.org',
    domain: 'wikipedia.org',
    category: 'research',
    icon: '📖',
  },
  {
    id: 'w-7',
    name: 'ChatGPT / Riset AI',
    url: 'https://chatgpt.com',
    domain: 'chatgpt.com',
    category: 'research',
    icon: '🤖',
  },
];

export const KNOWN_DISTRACTIONS = [
  { domain: 'youtube.com', name: 'YouTube', icon: '▶️' },
  { domain: 'instagram.com', name: 'Instagram', icon: '📷' },
  { domain: 'tiktok.com', name: 'TikTok', icon: '🎵' },
  { domain: 'discord.com', name: 'Discord', icon: '💬' },
  { domain: 'twitter.com', name: 'Twitter / X', icon: '🐦' },
  { domain: 'x.com', name: 'Twitter / X', icon: '🐦' },
  { domain: 'facebook.com', name: 'Facebook', icon: '👥' },
  { domain: 'netflix.com', name: 'Netflix', icon: '🎬' },
  { domain: 'reddit.com', name: 'Reddit', icon: '🤖' },
  { domain: 'twitch.tv', name: 'Twitch', icon: '🎮' },
];

/**
 * Ekstraksi hostname/domain dari link atau teks bebas
 */
export function extractDomain(inputUrl: string): string {
  if (!inputUrl) return '';
  let clean = inputUrl.trim();
  if (!clean.startsWith('http://') && !clean.startsWith('https://')) {
    clean = 'https://' + clean;
  }
  try {
    const parsed = new URL(clean);
    return parsed.hostname.toLowerCase().replace(/^www\./, '');
  } catch {
    return clean
      .replace(/^https?:\/\//, '')
      .replace(/^www\./, '')
      .split('/')[0]
      .split('?')[0]
      .toLowerCase();
  }
}

/**
 * Memeriksa apakah suatu link/domain masuk dalam whitelist yang diizinkan.
 * Mencakup seluruh path dan subdomain pada website tersebut.
 */
export function isUrlAllowed(
  urlOrDomain: string,
  whitelist: WhitelistWebsite[]
): { allowed: boolean; matchedWebsite?: WhitelistWebsite; isKnownDistraction?: boolean; distractionName?: string } {
  const targetDomain = extractDomain(urlOrDomain);
  if (!targetDomain) return { allowed: false };

  // Cek apakah ada di whitelist
  for (const item of whitelist) {
    const whiteDomain = extractDomain(item.domain || item.url);
    if (
      targetDomain === whiteDomain ||
      targetDomain.endsWith('.' + whiteDomain) ||
      whiteDomain.endsWith('.' + targetDomain)
    ) {
      return { allowed: true, matchedWebsite: item };
    }
  }

  // Cek apakah tergolong distraksi populer
  for (const d of KNOWN_DISTRACTIONS) {
    if (targetDomain === d.domain || targetDomain.endsWith('.' + d.domain)) {
      return { allowed: false, isKnownDistraction: true, distractionName: d.name };
    }
  }

  return { allowed: false };
}

/**
 * Web Audio Ambient Sound Generator (Rain, Lo-Fi Pink Noise, Binaural Beats)
 * Bekerja murni via Web Audio API browser tanpa file audio eksternal.
 */
class AmbientAudioPlayer {
  private ctx: AudioContext | null = null;
  private noiseNode: AudioNode | null = null;
  private gainNode: GainNode | null = null;
  private isPlaying = false;
  private currentType: 'rain' | 'binaural' | 'none' = 'none';

  private initContext() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  playRain(volume = 0.3) {
    this.stop();
    this.initContext();
    if (!this.ctx) return;

    // Buffer white noise
    const bufferSize = this.ctx.sampleRate * 2;
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }

    const whiteNoise = this.ctx.createBufferSource();
    whiteNoise.buffer = noiseBuffer;
    whiteNoise.loop = true;

    // Filter agar terdengar seperti hujan
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 1000;

    const gain = this.ctx.createGain();
    gain.gain.value = volume;

    whiteNoise.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);

    whiteNoise.start(0);
    this.noiseNode = whiteNoise;
    this.gainNode = gain;
    this.isPlaying = true;
    this.currentType = 'rain';
  }

  playBinaural(volume = 0.2) {
    this.stop();
    this.initContext();
    if (!this.ctx) return;

    // Left channel: 214 Hz, Right channel: 200 Hz -> 14Hz Alpha focus beat
    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    osc1.frequency.value = 214;
    osc2.frequency.value = 200;

    const merger = this.ctx.createChannelMerger(2);
    const gain = this.ctx.createGain();
    gain.gain.value = volume;

    osc1.connect(merger, 0, 0);
    osc2.connect(merger, 0, 1);
    merger.connect(gain);
    gain.connect(this.ctx.destination);

    osc1.start();
    osc2.start();

    this.gainNode = gain;
    this.isPlaying = true;
    this.currentType = 'binaural';
  }

  playChime() {
    this.initContext();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(587.33, now); // D5
    osc.frequency.exponentialRampToValueAtTime(880, now + 0.15); // A5

    gain.gain.setValueAtTime(0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 1.2);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 1.2);
  }

  setVolume(vol: number) {
    if (this.gainNode) {
      this.gainNode.gain.value = Math.max(0, Math.min(1, vol));
    }
  }

  stop() {
    if (this.noiseNode) {
      try {
        (this.noiseNode as any).stop?.();
        this.noiseNode.disconnect();
      } catch {}
      this.noiseNode = null;
    }
    this.isPlaying = false;
    this.currentType = 'none';
  }

  getStatus() {
    return { isPlaying: this.isPlaying, type: this.currentType };
  }
}

export const ambientAudio = new AmbientAudioPlayer();
