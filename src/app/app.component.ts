import { Component, HostListener, ViewEncapsulation, effect, inject, signal } from '@angular/core';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { CartService } from './core/services/cart.service';
import { ThemeService } from './core/services/theme.service';
import { I18nService, LANGS, Lang } from './core/services/i18n.service';
import { AccessibilityService, A11y } from './core/services/accessibility.service';

@Component({
  selector: 'app-root',
  standalone: true,
  encapsulation: ViewEncapsulation.None,   // los estilos de tema y accesibilidad son globales a propósito
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    <a class="skip-link" href="#contenido" (click)="skip($event)">{{ t('skip') }}</a>

    <header class="site-header" [class.scrolled]="scrolled()">
      <div class="header-top">
        <div class="header-left">
          <button class="burger" type="button" (click)="menuOpen.set(!menuOpen())" [class.is-open]="menuOpen()"
                  [attr.aria-expanded]="menuOpen()" [attr.aria-label]="t('aria.menu')"><span></span><span></span></button>
        </div>

        <a class="brand" routerLink="/" [attr.aria-label]="t('aria.home')" (click)="menuOpen.set(false)">
          <span class="maison">Maison</span><span class="dalla">Dalla</span>
        </a>

        <div class="header-actions">
          <a class="hdr-btn search-link" routerLink="/catalogo" [attr.aria-label]="t('aria.search')">
            <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="6.5"/><path d="m16 16 4.5 4.5"/></svg>
          </a>

          <div class="lang-wrap">
            <button class="hdr-btn lang-btn" type="button" (click)="langOpen.set(!langOpen())"
                    aria-haspopup="menu" [attr.aria-expanded]="langOpen()" [attr.aria-label]="t('aria.lang') + ': ' + tr.current().label">
              <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18"/></svg>
              <span>{{ tr.current().short }}</span>
            </button>
            @if (langOpen()) {
              <ul class="lang-menu" role="menu">
                @for (l of langs; track l.code) {
                  <li role="none"><button type="button" role="menuitemradio" [attr.aria-checked]="tr.lang()===l.code" [class.on]="tr.lang()===l.code" (click)="pickLang(l.code)">
                    <span>{{ l.label }}</span><b>{{ l.short }}</b></button></li>
                }
              </ul>
            }
          </div>

          <button class="hdr-btn" type="button" (click)="toggleTheme()" [attr.aria-label]="theme.theme()==='dark' ? t('aria.theme.light') : t('aria.theme.dark')">
            @if (theme.theme()==='dark') {
              <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 2.5v2.5M12 19v2.5M2.5 12H5M19 12h2.5M5.3 5.3l1.8 1.8M16.9 16.9l1.8 1.8M5.3 18.7l1.8-1.8M16.9 7.1l1.8-1.8"/></svg>
            } @else {
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 14.5A8.5 8.5 0 0 1 9.5 4a8.5 8.5 0 1 0 10.5 10.5Z"/></svg>
            }
          </button>

          <button id="a11y-trigger" class="hdr-btn" type="button" (click)="toggleA11y()" [attr.aria-expanded]="a11yOpen()" [attr.aria-label]="t('aria.a11y')">
            <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="4.5" r="1.7"/><path d="M5 8.5c4.7 1.3 9.3 1.3 14 0M12 9v5.5m0 0-3 5.5m3-5.5 3 5.5"/></svg>
          </button>

          <a routerLink="/bolsa" class="hdr-btn bag-link" [attr.aria-label]="t('aria.cart') + ': ' + cart.itemCount() + ' ' + t('aria.items')">
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5.5 8h13l-1 12h-11l-1-12Z"/><path d="M9 8V6.5a3 3 0 0 1 6 0V8"/></svg>
            <span class="bag-count" [class.bump]="bump()">{{ cart.itemCount() }}</span>
          </a>

          <a routerLink="/citas" class="hdr-book">{{ t('cta.book') }}</a>
        </div>
      </div>

      <nav class="main-nav" [attr.aria-label]="t('aria.nav')">
        @for (l of links; track l.path) {
          <a [routerLink]="l.path" routerLinkActive="active" [routerLinkActiveOptions]="{exact: l.path === '/'}">{{ t(l.k) }}</a>
        }
      </nav>
    </header>

    @if (menuOpen()) {
      <nav class="mobile-sheet" [attr.aria-label]="t('aria.mobileMenu')">
        @for (l of links; track l.path) { <a [routerLink]="l.path" (click)="menuOpen.set(false)">{{ t(l.k) }}</a> }
        <a routerLink="/citas" class="hdr-book" (click)="menuOpen.set(false)">{{ t('cta.book') }}</a>
      </nav>
    }

    @if (a11yOpen()) {
      <aside class="a11y-panel" role="dialog" aria-labelledby="a11y-title">
        <div class="a11y-head">
          <h2 id="a11y-title">{{ t('a11y.title') }}</h2>
          <button id="a11y-close" type="button" class="a11y-x" (click)="closeA11y()" [attr.aria-label]="t('a11y.close')">×</button>
        </div>
        <p class="a11y-label">{{ t('a11y.size') }}</p>
        <div class="a11y-sizes" role="radiogroup" [attr.aria-label]="t('a11y.size')">
          @for (s of sizes; track s.v) {
            <button type="button" role="radio" [attr.aria-checked]="a11y.s().size===s.v" [class.on]="a11y.s().size===s.v" [style.font-size.px]="s.px" (click)="a11y.set('size', s.v)">A{{ s.plus }}</button>
          }
        </div>
        @for (o of toggles; track o.k) {
          <label class="a11y-row"><input type="checkbox" [checked]="a11y.s()[o.k]" (change)="a11y.set(o.k, $any($event.target).checked)"><span class="sw"></span><span>{{ t(o.l) }}</span></label>
        }
        <button type="button" class="a11y-btn" (click)="a11y.reading() ? a11y.stop() : a11y.read(tr.lang())">{{ a11y.reading() ? t('a11y.stop') : t('a11y.read') }}</button>
        <button type="button" class="a11y-btn ghost" (click)="a11y.reset()">{{ t('a11y.reset') }}</button>
        <p class="a11y-hint">{{ t('a11y.hint') }}</p>
      </aside>
    }

    <main id="contenido" tabindex="-1"><router-outlet /></main>

    <footer class="site-footer">
      <a class="foot-mark" routerLink="/">MAISON <span>DALLA</span></a>
      <p>{{ t('footer.tag') }}</p>
      <div class="foot-links"><a routerLink="/contacto">{{ t('footer.contact') }}</a><a routerLink="/citas">{{ t('footer.private') }}</a><a routerLink="/admin">{{ t('footer.admin') }}</a></div>
      <small>{{ t('footer.note', { year }) }}</small>
    </footer>

    <div class="sr-only" aria-live="polite">{{ announce() }}</div>
  `,
  styles: [`
    /* ---------- TEMA: modo oscuro (por defecto) y claro ---------- */
    :root{
      --bg:#05080d; --bg-2:#080c14; --surface:#0a1019; --surface-2:#111925;
      --text:#f4efe6; --text-2:#d6cfc3; --muted:#a9a194;
      --line:rgba(217,184,106,.28); --gold:#d9b86a; --on-gold:#0a0e16; --glow:#172131;
      --header-h:160px; color-scheme:dark;
    }
    /* ---------- ACCESIBILIDAD (se aplica a todo el sitio) ---------- */
    .sr-only{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap}
    .skip-link{position:fixed;left:16px;top:-80px;z-index:200;padding:14px 22px;background:var(--gold);color:var(--on-gold);font-weight:600;transition:top .2s}
    .skip-link:focus{top:16px}
    main:focus{outline:none}
    :focus-visible{outline:3px solid var(--gold);outline-offset:3px}
    html.a11y-focus *:focus-visible{outline:5px solid #ffbf00!important;outline-offset:4px!important}
    html.a11y-links a{text-decoration:underline!important;text-underline-offset:4px}
    html.a11y-motion *,html.a11y-motion *::before,html.a11y-motion *::after{animation:none!important;transition:none!important;scroll-behavior:auto!important}
    html.a11y-dyslexia,html.a11y-dyslexia *{font-family:Verdana,"Trebuchet MS",Arial,sans-serif!important;letter-spacing:.03em!important;word-spacing:.12em!important}
    html.a11y-spacing p,html.a11y-spacing li,html.a11y-spacing a,html.a11y-spacing span,html.a11y-spacing label{line-height:1.9!important}
    html.a11y-cursor,html.a11y-cursor *{cursor:url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='40' height='40' viewBox='0 0 24 24'><path d='M4 2l16 9-7 2 4 8-3 1-4-8-6 5z' fill='black' stroke='white' stroke-width='1.5'/></svg>") 4 2,auto!important}
    html.a11y-contrast{--text:#fff;--text-2:#fff;--muted:#f0f0f0;--line:#fff;--gold:#ffd54a;--on-gold:#000;--bg:#000;--bg-2:#000;--surface:#000;--surface-2:#111;--dalla-muted:#f0f0f0;--dalla-border:#fff;--dalla-gold:#ffd54a;--dalla-gold-light:#ffd54a;--dalla-ivory:#fff}
    html.a11y-contrast body{background:#000!important;color:#fff!important}
    /* ---------- CABECERA ---------- */
    .site-header{position:sticky;top:0;z-index:50;padding:0 4vw;background:var(--bg);border-bottom:1px solid var(--line);transition:background .5s}
    .site-header.scrolled{background:color-mix(in srgb,var(--bg) 84%,transparent);backdrop-filter:blur(14px) saturate(1.2)}
    .header-top{height:104px;display:grid;grid-template-columns:1fr auto 1fr;align-items:center;gap:24px;transition:height .5s}
    .scrolled .header-top{height:76px}
    .header-left{display:flex;align-items:center}
    .brand{display:flex;flex-direction:column;align-items:center;line-height:1;font-family:var(--font-editorial);color:var(--text)}
    .maison{font-size:17px;letter-spacing:.6em;margin-right:-.6em;text-transform:uppercase;color:var(--gold);transition:font-size .5s,letter-spacing .5s}
    .dalla{font-size:46px;font-weight:500;letter-spacing:.2em;margin-right:-.2em;text-transform:uppercase;margin-top:8px;transition:font-size .5s,margin .5s}
    .scrolled .brand{flex-direction:row;gap:14px;align-items:baseline}
    .scrolled .maison{font-size:15px;letter-spacing:.3em;margin:0}
    .scrolled .dalla{font-size:30px;margin:0}
    .main-nav{display:flex;align-items:center;justify-content:center;gap:clamp(28px,3.6vw,64px);height:56px;border-top:1px solid color-mix(in srgb,var(--gold) 18%,transparent)}
    .main-nav a{position:relative;font-size:15px;letter-spacing:.12em;text-transform:uppercase;color:var(--text-2);padding:10px 0;transition:color .4s}
    .main-nav a::after{content:"";position:absolute;left:0;right:0;bottom:3px;height:2px;background:var(--gold);transform:scaleX(0);transform-origin:left;transition:transform .5s}
    .main-nav a:hover,.main-nav a.active{color:var(--gold)}
    .main-nav a:hover::after,.main-nav a.active::after{transform:scaleX(1)}

    .header-actions{display:flex;align-items:center;justify-content:flex-end;gap:4px}
    .hdr-btn{position:relative;display:inline-flex;align-items:center;justify-content:center;gap:8px;min-width:50px;height:50px;background:none;border:0;color:var(--text);cursor:pointer;transition:color .4s}
    .hdr-btn svg{width:27px;height:27px;fill:none;stroke:currentColor;stroke-width:1.5;stroke-linecap:round;stroke-linejoin:round}
    .hdr-btn:hover{color:var(--gold)}
    .lang-btn{padding:0 10px;font-size:15px;letter-spacing:.1em;font-weight:600}
    .lang-wrap{position:relative}
    .lang-menu{position:absolute;right:0;top:calc(100% + 8px);min-width:200px;margin:0;padding:6px;list-style:none;background:var(--surface);border:1px solid var(--line);box-shadow:0 18px 40px rgba(0,0,0,.35);z-index:60}
    .lang-menu button{width:100%;min-height:50px;display:flex;justify-content:space-between;align-items:center;padding:0 16px;background:none;border:0;color:var(--text);font-size:16px;cursor:pointer}
    .lang-menu button:hover,.lang-menu button.on{background:color-mix(in srgb,var(--gold) 14%,transparent);color:var(--gold)}
    .lang-menu b{font-size:13px;letter-spacing:.1em}
    .bag-count{position:absolute;top:3px;right:1px;min-width:21px;height:21px;border-radius:11px;padding:0 6px;background:var(--gold);color:var(--on-gold);font-size:13px;font-weight:700;display:grid;place-items:center;transition:transform .3s}
    .bag-count.bump{animation:bag-bump .45s}
    @keyframes bag-bump{40%{transform:scale(1.5)}}
    .hdr-book{margin-left:14px;height:50px;padding:0 26px;display:inline-flex;align-items:center;border:1px solid var(--gold);color:var(--gold);font-size:14px;font-weight:600;letter-spacing:.12em;text-transform:uppercase;white-space:nowrap;transition:background .5s,color .5s}
    .hdr-book:hover{background:var(--gold);color:var(--on-gold)}

    .burger{display:none;background:none;border:0;width:52px;height:52px;cursor:pointer;position:relative}
    .burger span{position:absolute;left:11px;right:11px;height:2px;background:var(--text);transition:transform .5s,top .5s}
    .burger span:nth-child(1){top:21px}.burger span:nth-child(2){top:29px}
    .burger.is-open span:nth-child(1){top:25px;transform:rotate(45deg)}
    .burger.is-open span:nth-child(2){top:25px;transform:rotate(-45deg)}
    .mobile-sheet{position:fixed;inset:76px 0 0 0;z-index:49;background:var(--bg);display:flex;flex-direction:column;justify-content:center;align-items:center;gap:28px;animation:sheet-in .4s}
    .mobile-sheet a:not(.hdr-book){font:500 42px var(--font-editorial);color:var(--text)}
    .mobile-sheet a:not(.hdr-book):hover{color:var(--gold)}
    @keyframes sheet-in{from{opacity:0}to{opacity:1}}

    /* ---------- PANEL DE ACCESIBILIDAD ---------- */
    .a11y-panel{position:fixed;z-index:120;right:24px;top:calc(var(--header-h) + 8px);width:min(380px,calc(100vw - 32px));max-height:calc(100svh - var(--header-h) - 24px);overflow:auto;padding:22px;background:var(--surface);color:var(--text);border:1px solid var(--gold);box-shadow:0 24px 60px rgba(0,0,0,.45)}
    .a11y-head{display:flex;justify-content:space-between;align-items:center;margin-bottom:12px}
    .a11y-head h2{margin:0;font:500 26px var(--font-editorial)}
    .a11y-x{width:44px;height:44px;font-size:30px;background:none;border:0;color:var(--text);cursor:pointer}
    .a11y-label{font-size:14px;letter-spacing:.1em;text-transform:uppercase;color:var(--muted);margin:14px 0 8px}
    .a11y-sizes{display:grid;grid-template-columns:repeat(4,1fr);gap:8px}
    .a11y-sizes button{min-height:52px;background:none;border:1px solid var(--line);color:var(--text);cursor:pointer}
    .a11y-sizes button.on{border-color:var(--gold);background:var(--gold);color:var(--on-gold);font-weight:700}
    .a11y-row{display:flex;align-items:center;gap:14px;min-height:52px;font-size:16px;cursor:pointer;border-bottom:1px solid color-mix(in srgb,var(--text) 10%,transparent)}
    .a11y-row input{position:absolute;opacity:0}
    .a11y-row .sw{flex:none;width:46px;height:26px;border:1px solid var(--line);border-radius:14px;position:relative;transition:background .3s}
    .a11y-row .sw::after{content:"";position:absolute;left:3px;top:3px;width:18px;height:18px;border-radius:50%;background:var(--muted);transition:left .3s,background .3s}
    .a11y-row input:checked + .sw{background:color-mix(in srgb,var(--gold) 30%,transparent);border-color:var(--gold)}
    .a11y-row input:checked + .sw::after{left:23px;background:var(--gold)}
    .a11y-row input:focus-visible + .sw{outline:3px solid var(--gold);outline-offset:3px}
    .a11y-btn{width:100%;min-height:52px;margin-top:14px;border:1px solid var(--gold);background:var(--gold);color:var(--on-gold);font-size:15px;font-weight:600;cursor:pointer}
    .a11y-btn.ghost{background:none;color:var(--text);border-color:var(--line);margin-top:10px}
    .a11y-hint{font-size:14px;color:var(--muted);margin:14px 0 0}

    /* ---------- PIE ---------- */
    .site-footer{padding:48px 4vw 32px;border-top:1px solid var(--line);display:flex;align-items:center;justify-content:space-between;gap:24px;flex-wrap:wrap;background:var(--bg)}
    .foot-mark{font:400 clamp(22px,2.4vw,32px) var(--font-editorial);letter-spacing:.1em;white-space:nowrap;color:var(--text)}
    .foot-mark span{color:var(--gold)}
    .site-footer p,.site-footer small{font-size:14px;color:var(--muted);margin:0}
    .foot-links{display:flex;gap:24px;font-size:15px}
    .foot-links a{color:var(--text);transition:color .3s}
    .foot-links a:hover{color:var(--gold)}

    @media(max-width:1100px){
      :root{--header-h:76px}
      .header-top,.scrolled .header-top{height:76px}
      .main-nav,.header-actions .hdr-book{display:none}
      .burger{display:block}
      .dalla{font-size:32px}
      .maison{font-size:14px}
    }
    @media(max-width:560px){
      .header-top,.scrolled .header-top{grid-template-columns:44px minmax(0,1fr) auto;gap:4px}
      .header-left{min-width:0}
      .brand{min-width:0}
      .header-actions{gap:0}
      .search-link{display:none}
      .maison{letter-spacing:.5em;margin-right:-.5em}
      .hdr-btn{min-width:44px;height:44px}
      .lang-btn{padding:0 6px}
      .site-header.scrolled .brand{flex-direction:column;gap:0;align-items:center}
      .a11y-panel{top:max(8px,env(safe-area-inset-top));right:8px;width:calc(100vw - 16px);max-height:calc(100svh - 16px - env(safe-area-inset-top))}
    }
  `]
})
export class AppComponent {
  readonly cart = inject(CartService);              // mismo carrito que usan las demás páginas
  readonly theme = inject(ThemeService);
  readonly tr = inject(I18nService);
  readonly a11y = inject(AccessibilityService);
  private readonly router = inject(Router);

  readonly langs = LANGS;
  readonly links = [
    { k: 'nav.home', path: '/' }, { k: 'nav.catalog', path: '/catalogo' }, { k: 'nav.atelier', path: '/atelier' },
    { k: 'nav.about', path: '/quienes-somos' }, { k: 'nav.contact', path: '/contacto' }
  ];
  readonly sizes = [{ v: 100, px: 14, plus: '' }, { v: 115, px: 17, plus: '+' }, { v: 130, px: 20, plus: '++' }, { v: 150, px: 23, plus: '+++' }];
  readonly toggles: { k: 'contrast' | 'links' | 'motion' | 'dyslexia' | 'spacing' | 'cursor' | 'focus'; l: string }[] = [
    { k: 'contrast', l: 'a11y.contrast' }, { k: 'links', l: 'a11y.links' }, { k: 'motion', l: 'a11y.motion' },
    { k: 'dyslexia', l: 'a11y.dyslexia' }, { k: 'spacing', l: 'a11y.spacing' }, { k: 'cursor', l: 'a11y.cursor' }, { k: 'focus', l: 'a11y.focus' }
  ];

  readonly scrolled = signal(false);
  readonly menuOpen = signal(false);
  readonly langOpen = signal(false);
  readonly a11yOpen = signal(false);
  readonly bump = signal(false);
  readonly announce = signal('');
  readonly year = new Date().getFullYear();
  private lastCount = this.cart.itemCount();

  constructor() {
    this.router.events.subscribe(e => {
      if (e instanceof NavigationEnd) { this.menuOpen.set(false); this.langOpen.set(false); }
    });
    // El contador del carrito "salta" cuando se añade algo
    effect(() => {
      const n = this.cart.itemCount();
      if (n > this.lastCount) { this.bump.set(true); setTimeout(() => this.bump.set(false), 500); }
      this.lastCount = n;
    });
  }

  t = (key: string, vars?: Record<string, string | number>) => this.tr.t(key, vars);

  toggleTheme(): void { this.theme.toggle(); this.announce.set(this.t(this.theme.theme() === 'light' ? 'theme.on.light' : 'theme.on.dark')); }
  pickLang(code: Lang): void { this.tr.set(code); this.langOpen.set(false); this.announce.set(this.t('lang.on', { lang: this.tr.current().label })); }
  toggleA11y(): void { this.a11yOpen() ? this.closeA11y() : this.openA11y(); }
  openA11y(): void { this.a11yOpen.set(true); setTimeout(() => document.getElementById('a11y-close')?.focus()); }
  closeA11y(): void { this.a11yOpen.set(false); document.getElementById('a11y-trigger')?.focus(); }
  skip(e: Event): void { e.preventDefault(); const m = document.getElementById('contenido'); m?.focus(); m?.scrollIntoView(); }

  @HostListener('window:scroll') onScroll(): void { this.scrolled.set(window.scrollY > 24); }
  @HostListener('document:click', ['$event']) onDoc(e: MouseEvent): void {
    if (!(e.target as HTMLElement).closest('.lang-wrap')) this.langOpen.set(false);
  }
  @HostListener('document:keydown.escape') onEsc(): void {
    this.langOpen.set(false); this.menuOpen.set(false);
    if (this.a11yOpen()) this.closeA11y();
  }
}