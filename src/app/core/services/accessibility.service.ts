import { Injectable, effect, signal } from '@angular/core';

export interface A11y {
  size: number;        // 100 | 115 | 130 | 150 (% de zoom del contenido)
  contrast: boolean;
  links: boolean;
  motion: boolean;     // reducir animaciones
  dyslexia: boolean;   // fuente fácil de leer
  spacing: boolean;
  cursor: boolean;
  focus: boolean;
}
const DEFAULT: A11y = { size: 100, contrast: false, links: false, motion: false, dyslexia: false, spacing: false, cursor: false, focus: false };

/** Opciones de accesibilidad. Se aplican a TODA la página (clases en <html>) y se recuerdan. */
@Injectable({ providedIn: 'root' })
export class AccessibilityService {
  readonly s = signal<A11y>(this.load());
  readonly reading = signal(false);

  constructor() {
    effect(() => {
      const v = this.s();
      if (typeof document === 'undefined') return;
      const c = document.documentElement.classList;
      c.toggle('a11y-contrast', v.contrast);
      c.toggle('a11y-links', v.links);
      c.toggle('a11y-motion', v.motion);
      c.toggle('a11y-dyslexia', v.dyslexia);
      c.toggle('a11y-spacing', v.spacing);
      c.toggle('a11y-cursor', v.cursor);
      c.toggle('a11y-focus', v.focus);
      (document.body.style as any).zoom = String(v.size / 100);
      try { localStorage.setItem('dalla-a11y', JSON.stringify(v)); } catch { /* sin almacenamiento */ }
    });
    // Hace que el navegador cargue las voces desde el inicio
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) window.speechSynthesis.getVoices();
  }

  set<K extends keyof A11y>(key: K, value: A11y[K]): void { this.s.update(s => ({ ...s, [key]: value })); }
  reset(): void { this.s.set({ ...DEFAULT }); this.stop(); }

  /** Lee en voz alta el contenido principal con la voz del navegador. */
  read(lang: string): void {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    const synth = window.speechSynthesis;
    this.stop();

    const root = (document.querySelector('main') ?? document.querySelector('app-root') ?? document.body) as HTMLElement;
    const text = root.innerText?.replace(/\s+/g, ' ').trim();
    if (!text) return;

    const code = lang === 'en' ? 'en-US' : lang === 'pt' ? 'pt-BR' : 'es-419';
    const chunks = text.slice(0, 8000).match(/[^.!?]+[.!?]*\s*/g) ?? [text];

    this.reading.set(true);
    // Chrome ignora speak() si se llama justo después de cancel()
    setTimeout(() => {
      const voice = this.pickVoice(code);
      chunks.forEach((chunk, i) => {
        const u = new SpeechSynthesisUtterance(chunk.trim());
        u.lang = voice?.lang ?? code;
        if (voice) u.voice = voice;
        if (i === chunks.length - 1) u.onend = () => this.reading.set(false);
        u.onerror = e => { if (e.error !== 'canceled' && e.error !== 'interrupted') this.reading.set(false); };
        synth.speak(u);
      });
    }, 120);
  }

  stop(): void {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) window.speechSynthesis.cancel();
    this.reading.set(false);
  }

  private pickVoice(code: string): SpeechSynthesisVoice | undefined {
    const voices = window.speechSynthesis.getVoices();
    const base = code.slice(0, 2).toLowerCase();
    return voices.find(v => v.lang.replace('_', '-') === code)
        ?? voices.find(v => v.lang.toLowerCase().startsWith(base));
  }

  private load(): A11y {
    try {
      const raw = localStorage.getItem('dalla-a11y');
      if (raw) return { ...DEFAULT, ...JSON.parse(raw) };
    } catch { /* sin almacenamiento */ }
    return { ...DEFAULT };
  }
}