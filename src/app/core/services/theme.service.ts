import { Injectable, effect, signal } from '@angular/core';

export type Theme = 'dark' | 'light';

/** Tema oscuro / claro. Se guarda en el navegador y se aplica en <html data-theme="...">. */
@Injectable({ providedIn: 'root' })
export class ThemeService {
  readonly theme = signal<Theme>(this.initial());

  constructor() {
    effect(() => {
      const t = this.theme();
      if (typeof document === 'undefined') return;
      document.documentElement.dataset['theme'] = t;
      document.querySelector<HTMLMetaElement>('meta[name="theme-color"]')?.setAttribute('content', t === 'light' ? '#faf7f1' : '#080c14');
      try { localStorage.setItem('dalla-theme', t); } catch { /* sin almacenamiento */ }
    });
  }

  toggle(): void { this.theme.update(t => (t === 'dark' ? 'light' : 'dark')); }

  private initial(): Theme {
    try {
      const saved = localStorage.getItem('dalla-theme');
      if (saved === 'light' || saved === 'dark') return saved;
    } catch { /* sin almacenamiento */ }
    return 'dark';
  }
}