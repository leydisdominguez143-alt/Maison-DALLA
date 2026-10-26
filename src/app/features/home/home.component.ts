import { AfterViewInit, Component, ElementRef, OnDestroy, computed, effect, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ProductService } from '../../core/services/product.service';
import { I18nService } from '../../core/services/i18n.service';
import { AccessibilityService } from '../../core/services/accessibility.service';

const SLIDE_MS = 8500;

// Imagen de fondo del hero (se muestra completa, sin recortar ni oscurecer)
const HERO_IMG = 'assets/images/FONDO-PAREJA.png';

// ======================================================================
//  TEXTO DE LA FRANJA EN MOVIMIENTO: cambia estas frases a tu gusto
// ======================================================================
const MARQUEE = [
  'Envíos a todo el país',
  'Moda con carácter',
  'Hecho a tu medida',
  'Agenda tu cita',
];

@Component({
  standalone: true,
  selector: 'app-home',
  imports: [RouterLink],
  template: `
    <!-- ============ HERO ============ -->
    <section class="hero">
      <img class="hero-bg" [src]="heroImg" alt="" fetchpriority="high" (error)="$any($event.target).style.display='none'">
      <div class="hero-copy">
        <p class="eyebrow reveal" style="--d:0ms">{{ t('home.eyebrow') }}</p>
        <h1>
          <span class="line reveal" style="--d:120ms">{{ t('home.h1a') }}</span>
          <em class="line reveal" style="--d:260ms">{{ t('home.h1b') }}</em>
        </h1>
        <p class="lead reveal" style="--d:420ms">{{ t('home.lead') }}</p>
        <div class="actions reveal" style="--d:560ms">
          <a routerLink="/citas" class="cta">{{ t('home.cta1') }} →</a>
          <a routerLink="/catalogo" class="cta ghost">{{ t('home.cta2') }}</a>
        </div>
      </div>
    </section>

    <!-- ============ FRANJA EN MOVIMIENTO ============ -->
    <div class="marquee" role="region" [attr.aria-label]="marquee[0]">
      <div class="marquee-track">
        @for (copy of [0, 1]; track copy) {
          <ul [attr.aria-hidden]="copy === 1 ? 'true' : null">
            @for (k of marquee; track k) {
              <li>{{ k }}<i aria-hidden="true">✦</i></li>
            }
          </ul>
        }
      </div>
    </div>

    <!-- ============ CARRUSEL ANCHO ============ -->
    @if (slides().length) {
      <section class="stage-wrap">
        <div class="showcase" role="region" aria-roledescription="carousel" [attr.aria-label]="t('home.carousel')"
             (mouseenter)="paused.set(true)" (mouseleave)="paused.set(false)"
             (focusin)="paused.set(true)" (focusout)="paused.set(false)"
             (keydown.arrowleft)="go(-1)" (keydown.arrowright)="go(1)">
          @for (p of slides(); track p.id; let n = $index) {
            <article class="slide" [class.active]="n === index()" [attr.inert]="n !== index() ? '' : null">
              <div class="media">
                @if (isFailed('p' + p.id)) {
                  <div class="ph" aria-hidden="true"><span>D</span><small>{{ t('home.soon') }}</small></div>
                } @else {
                  <img [src]="p.image" [alt]="p.name" (error)="markFailed('p' + p.id)" [attr.fetchpriority]="n === 0 ? 'high' : null">
                }
              </div>
              <div class="info">
                <span class="info-num">0{{ n + 1 }} / 0{{ slides().length }}</span>
                <span class="info-cat">{{ p.category }}</span>
                <h2>{{ p.name }}</h2>
                <p>B/. {{ p.price.toFixed(2) }}</p>
                <a routerLink="/catalogo" class="info-link">{{ t('home.view') }} →</a>
              </div>
            </article>
          }
          <button type="button" class="arrow prev" (click)="go(-1)" [attr.aria-label]="t('home.prev')">←</button>
          <div class="dots">
            @for (p of slides(); track p.id; let n = $index) {
              <button type="button" class="dot" [class.on]="n === index()" (click)="index.set(n)" [attr.aria-label]="p.name" [attr.aria-current]="n === index() ? 'true' : null">
                @if (n === index() && playing()) { <i></i> }
              </button>
            }
          </div>
          <button type="button" class="arrow next" (click)="go(1)" [attr.aria-label]="t('home.next')">→</button>
        </div>
      </section>
    }

    <!-- ============ CATEGORÍAS ============ -->
    @if (cats().length) {
      <section class="block wrap">
        <div class="head rv">
          <p class="eyebrow">{{ t('home.cats.eyebrow') }}</p>
          <h2>{{ t('home.cats.title') }}</h2>
        </div>
        <div class="cat-grid">
          @for (c of cats(); track c.name; let n = $index) {
            <a class="cat rv" [style.--d]="(n * 90) + 'ms'" routerLink="/catalogo" [queryParams]="{ categoria: c.name }">
              @if (isFailed('c' + c.name)) { <div class="ph" aria-hidden="true"><span>D</span></div> }
              @else { <img [src]="c.image" alt="" loading="lazy" (error)="markFailed('c' + c.name)"> }
              <span class="cat-text">
                <strong>{{ c.name }}</strong>
                <small>{{ c.count === 1 ? t('home.cats.one') : t('home.cats.many', { n: c.count }) }}</small>
              </span>
              <span class="go" aria-hidden="true">→</span>
            </a>
          }
        </div>
      </section>
    }

    <!-- ============ CÓMO FUNCIONA ============ -->
    <section class="block wrap">
      <div class="head rv">
        <p class="eyebrow">{{ t('how.eyebrow') }}</p>
        <h2>{{ t('how.title') }}</h2>
      </div>
      <div class="how rv">
        <div class="tabs" role="tablist" [attr.aria-label]="t('how.title')">
          @for (n of steps; track n; let i = $index) {
            <button type="button" role="tab" class="tab" [class.on]="step() === i" [attr.aria-selected]="step() === i" (click)="step.set(i)">
              <b>0{{ n }}</b><span>{{ t('how.' + n + '.t') }}</span>
            </button>
          }
        </div>
        <div class="step-panel" role="tabpanel">
          <span class="big" aria-hidden="true">0{{ step() + 1 }}</span>
          <h3>{{ t('how.' + (step() + 1) + '.t') }}</h3>
          <p>{{ t('how.' + (step() + 1) + '.d') }}</p>
          <a routerLink="/atelier" class="cta">{{ t('how.cta') }} →</a>
        </div>
      </div>
    </section>

    <!-- ============ DESTACADAS ============ -->
    <section class="block wrap">
      <div class="head split rv">
        <div><p class="eyebrow">{{ t('feat.eyebrow') }}</p><h2>{{ t('feat.a') }} <em>{{ t('feat.b') }}</em></h2></div>
        <a routerLink="/catalogo" class="text-link">{{ t('feat.all') }} →</a>
      </div>
      <div class="feat-grid">
        @for (p of featured(); track p.id; let n = $index) {
          <a class="card rv" [style.--d]="(n * 90) + 'ms'" routerLink="/catalogo">
            <div class="thumb">
              @if (isFailed('f' + p.id)) { <div class="ph" aria-hidden="true"><span>D</span></div> }
              @else { <img [src]="p.image" [alt]="p.name" loading="lazy" (error)="markFailed('f' + p.id)"> }
              <span class="peek">{{ t('home.view') }} →</span>
            </div>
            <div class="card-info"><span>{{ p.category }}</span><h3>{{ p.name }}</h3><p>B/. {{ p.price.toFixed(2) }}</p></div>
          </a>
        }
      </div>
    </section>

    <!-- ============ LLAMADA FINAL ============ -->
    <section class="wrap band-wrap">
      <div class="band rv">
        <h2>{{ t('band.title') }}</h2>
        <p>{{ t('band.text') }}</p>
        <a routerLink="/citas" class="cta">{{ t('home.cta1') }} →</a>
      </div>
    </section>
  `,
  styles: [`
    :host{display:block;--ease:cubic-bezier(.22,.8,.24,1);color:var(--text)}
    .wrap{width:min(1680px,92vw);margin-inline:auto}
    .eyebrow{font-size:14px;letter-spacing:.16em;text-transform:uppercase;color:var(--gold);margin:0}
    .ph{width:100%;height:100%;display:grid;place-content:center;gap:10px;text-align:center;background:linear-gradient(145deg,var(--surface-2),var(--surface));color:var(--gold)}
    .ph span{font:italic 400 clamp(80px,10vw,150px)/1 var(--font-editorial)}
    .ph small{font-size:14px;letter-spacing:.14em;text-transform:uppercase;color:var(--muted)}

    /* ---------- BOTONES ---------- */
    .cta{display:inline-flex;align-items:center;justify-content:center;min-height:60px;padding:0 36px;font-size:16px;font-weight:600;letter-spacing:.06em;
      background:var(--gold);color:var(--on-gold);border:1px solid var(--gold);transition:background .5s var(--ease),color .5s var(--ease),border-color .5s var(--ease)}
    .cta:hover{background:transparent;color:var(--gold)}
    .cta.ghost{background:transparent;color:var(--text);border-color:color-mix(in srgb,var(--text) 40%,transparent)}
    .cta.ghost:hover{border-color:var(--gold);color:var(--gold)}
    .actions{display:flex;flex-wrap:wrap;gap:16px;margin-top:42px}

    /* ---------- HERO CON IMAGEN (completa, sin overlay) ---------- */
    .hero{position:relative;overflow:hidden;display:grid;background:var(--bg)}
    .hero-bg{grid-area:1/1;align-self:center;display:block;width:100%;height:auto}
    .hero-copy{grid-area:1/1;align-self:center;z-index:1;max-width:min(740px,58%);padding:56px 4vw;color:#f4efe6;text-shadow:0 2px 18px rgba(0,0,0,.55),0 1px 3px rgba(0,0,0,.6)}
    .hero .eyebrow{color:#f0cd8e}
    h1{font:500 clamp(60px,8vw,140px)/.95 var(--font-editorial);letter-spacing:-.045em;margin:30px 0 32px;color:#f4efe6}
    h1 .line{display:block}
    h1 em{color:#f0cd8e;font-weight:400;font-style:italic}
    .lead{max-width:580px;font-size:clamp(18px,1.5vw,22px);line-height:1.7;color:#f4efe6;margin:0}
    .hero .cta{text-shadow:none}
    .hero .cta.ghost{color:#f4efe6;border-color:rgba(244,239,230,.7);background:rgba(5,8,13,.25)}
    .hero .cta.ghost:hover{border-color:#e9c17c;color:#e9c17c}

    /* ---------- FRANJA EN MOVIMIENTO ---------- */
    .marquee{overflow:hidden;background:var(--gold);color:var(--on-gold);border-block:1px solid var(--gold)}
    .marquee-track{display:flex;width:max-content;animation:scroll 32s linear infinite}
    .marquee:hover .marquee-track{animation-play-state:paused}
    .marquee ul{display:flex;list-style:none;margin:0;padding:0}
    .marquee li{display:flex;align-items:center;gap:36px;padding:20px 0 20px 36px;white-space:nowrap;
      font:italic 500 clamp(22px,2.4vw,34px)/1 var(--font-editorial);letter-spacing:.01em}
    .marquee li i{font-style:normal;font-size:.6em}
    @keyframes scroll{to{transform:translateX(-50%)}}

    /* ---------- CARRUSEL ANCHO ---------- */
    .stage-wrap{width:min(1840px,96vw);margin:clamp(40px,6vw,80px) auto 0}
    .showcase{--split:63%;position:relative;height:min(78vh,760px);min-height:480px;border:1px solid var(--line);overflow:hidden;background:var(--surface);isolation:isolate}
    .slide{position:absolute;inset:0;display:grid;grid-template-columns:var(--split) 1fr;opacity:0;visibility:hidden;transition:opacity .9s var(--ease),visibility .9s}
    .slide.active{opacity:1;visibility:visible}
    .media{position:relative;overflow:hidden;background:var(--surface-2)}
    .slide img{width:100%;height:100%;object-fit:cover;display:block;transform:scale(1.09);transition:transform 1.6s var(--ease)}
    .slide.active img{transform:scale(1.03)}
    .info{display:flex;flex-direction:column;justify-content:center;gap:10px;padding:48px clamp(24px,3vw,56px) 120px;
      background:radial-gradient(ellipse 90% 60% at 0 0,var(--glow),transparent 70%),var(--surface);color:var(--text)}
    .info-num{font:italic 400 18px var(--font-editorial);color:var(--muted);letter-spacing:.1em}
    .info-cat{font-size:13px;letter-spacing:.16em;text-transform:uppercase;color:var(--gold)}
    .info h2{font:500 clamp(36px,3.6vw,64px)/1.05 var(--font-editorial);letter-spacing:-.02em;margin:6px 0 8px}
    .info p{margin:0 0 18px;font-size:clamp(20px,1.6vw,26px);color:var(--text-2)}
    .info-link{align-self:flex-start;font-size:16px;color:var(--gold);border-bottom:1px solid var(--gold);padding-bottom:3px}
    .arrow{position:absolute;bottom:24px;z-index:2;width:52px;height:52px;border-radius:50%;border:1px solid rgba(244,239,230,.6);background:rgba(5,8,13,.6);color:#f4efe6;font-size:22px;cursor:pointer;transition:background .4s,color .4s,border-color .4s}
    .arrow.prev{left:24px}
    .arrow.next{right:24px}
    .arrow:hover{background:var(--gold);color:var(--on-gold);border-color:var(--gold)}
    .dots{position:absolute;z-index:2;bottom:24px;height:52px;left:calc(var(--split) + clamp(24px,3vw,56px));right:96px;display:flex;align-items:center;gap:8px}
    .dot{flex:1;height:30px;padding:13px 0;background:none;border:0;cursor:pointer;position:relative}
    .dot::before{content:"";position:absolute;left:0;right:0;top:13px;height:4px;background:color-mix(in srgb,var(--text) 22%,transparent)}
    .dot.on::before{background:color-mix(in srgb,var(--text) 40%,transparent)}
    .dot i{position:absolute;left:0;top:13px;height:4px;background:var(--gold);animation:fill ${SLIDE_MS}ms linear forwards}
    @keyframes fill{from{width:0}to{width:100%}}

    /* ---------- SECCIONES ---------- */
    .block{padding-block:clamp(70px,9vw,130px) 0}
    .head{margin-bottom:44px}
    .head h2,.band h2{font:500 clamp(40px,5vw,72px)/1.05 var(--font-editorial);letter-spacing:-.03em;margin:16px 0 0;color:var(--text)}
    .head h2 em{color:var(--gold);font-weight:400}
    .head.split{display:flex;justify-content:space-between;align-items:end;gap:20px;flex-wrap:wrap}
    .text-link{font-size:16px;color:var(--gold);border-bottom:1px solid var(--gold);padding-bottom:4px}

    .rv{opacity:0;transform:translateY(30px);transition:opacity .9s var(--ease),transform .9s var(--ease);transition-delay:var(--d,0ms)}
    .rv.in{opacity:1;transform:none}

    .cat-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:22px}
    .cat{position:relative;aspect-ratio:3/4;overflow:hidden;border:1px solid var(--line);display:block;background:var(--surface-2);color:#f4efe6}
    .cat img{width:100%;height:100%;object-fit:cover;display:block;transition:transform .9s var(--ease)}
    .cat:hover img{transform:scale(1.07)}
    .cat::after{content:"";position:absolute;inset:0;background:linear-gradient(0deg,rgba(5,8,13,.85),transparent 55%);pointer-events:none}
    .cat-text{position:absolute;z-index:1;left:22px;right:70px;bottom:22px;display:grid;gap:6px}
    .cat-text strong{font:500 clamp(24px,2vw,30px)/1.15 var(--font-editorial)}
    .cat-text small{font-size:15px;color:#e9c17c}
    .go{position:absolute;z-index:1;right:22px;bottom:22px;width:46px;height:46px;border-radius:50%;border:1px solid #e9c17c;display:grid;place-items:center;font-size:20px;color:#e9c17c;transition:transform .5s var(--ease),background .4s,color .4s}
    .cat:hover .go{transform:translateX(6px);background:#e9c17c;color:#0a0e16}

    .how{display:grid;grid-template-columns:minmax(260px,.8fr) 1.4fr;gap:clamp(24px,4vw,64px);align-items:stretch}
    .tabs{display:grid;gap:12px;align-content:start}
    .tab{display:flex;align-items:center;gap:20px;min-height:84px;padding:0 26px;text-align:left;background:var(--surface);border:1px solid var(--line);color:var(--text-2);font:500 clamp(22px,1.8vw,28px) var(--font-editorial);cursor:pointer;transition:border-color .4s,color .4s,background .4s}
    .tab b{font:400 18px var(--font-editorial);color:var(--gold)}
    .tab:hover{border-color:var(--gold)}
    .tab.on{border-color:var(--gold);color:var(--text);background:color-mix(in srgb,var(--gold) 10%,var(--surface))}
    .step-panel{position:relative;overflow:hidden;padding:clamp(28px,4vw,56px);border:1px solid var(--line);background:linear-gradient(135deg,var(--surface-2),var(--surface));min-height:340px;display:flex;flex-direction:column;justify-content:center;gap:16px}
    .big{position:absolute;right:24px;top:-18px;font:italic 400 clamp(140px,16vw,240px)/1 var(--font-editorial);color:color-mix(in srgb,var(--gold) 16%,transparent);pointer-events:none}
    .step-panel h3{font:500 clamp(34px,3.4vw,52px)/1.1 var(--font-editorial);margin:0;position:relative}
    .step-panel p{font-size:clamp(17px,1.4vw,21px);line-height:1.75;color:var(--text-2);max-width:620px;margin:0;position:relative}
    .step-panel .cta{align-self:flex-start;margin-top:10px;position:relative}

    .feat-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:30px 24px}
    .card{display:block;border:1px solid var(--line);background:var(--surface);transition:border-color .5s var(--ease),transform .6s var(--ease)}
    .card:hover{border-color:var(--gold);transform:translateY(-6px)}
    .thumb{position:relative;aspect-ratio:4/5;overflow:hidden}
    .thumb img{width:100%;height:100%;object-fit:cover;display:block;transition:transform .9s var(--ease)}
    .card:hover .thumb img{transform:scale(1.06)}
    .peek{position:absolute;left:0;right:0;bottom:0;padding:16px 22px;background:rgba(5,8,13,.82);color:#e9c17c;font-size:15px;letter-spacing:.06em;transform:translateY(100%);transition:transform .5s var(--ease)}
    .card:hover .peek,.card:focus-visible .peek{transform:none}
    .card-info{padding:20px 22px 24px}
    .card-info span{font-size:13px;letter-spacing:.14em;text-transform:uppercase;color:var(--gold)}
    .card-info h3{font:500 clamp(24px,2vw,30px)/1.15 var(--font-editorial);margin:10px 0 8px;color:var(--text)}
    .card-info p{margin:0;font-size:17px;color:var(--text-2)}

    .band-wrap{padding-block:clamp(70px,9vw,130px)}
    .band{position:relative;overflow:hidden;text-align:center;padding:clamp(48px,7vw,100px) 24px;border:1px solid var(--gold);background:radial-gradient(ellipse 60% 120% at 50% 0,var(--glow),transparent 70%),var(--surface)}
    .band p{font-size:clamp(18px,1.6vw,22px);color:var(--text-2);max-width:620px;margin:20px auto 34px;line-height:1.7}

    /* ---------- ENTRADA DEL HERO ---------- */
    .reveal{opacity:0;transform:translateY(20px);animation:rise .9s var(--ease) var(--d,0ms) both}
    @keyframes rise{to{opacity:1;transform:none}}
    @media (prefers-reduced-motion:reduce){
      .reveal,.rv{animation:none;opacity:1;transform:none;transition:none}
      .slide,.slide img,.hero-bg{transition:none}
      .marquee-track{animation:none}
    }
    .cta:focus-visible,.text-link:focus-visible,.card:focus-visible,.cat:focus-visible,.info-link:focus-visible,.arrow:focus-visible,.dot:focus-visible,.tab:focus-visible{outline:3px solid var(--gold);outline-offset:3px}

    @media(max-width:1000px){
      .hero{min-height:78svh}
      .hero-bg{position:absolute;inset:0;height:100%;object-fit:cover}
      .hero-copy{max-width:100%;padding:36px 6vw}
      .how{grid-template-columns:1fr}
      .showcase{height:88vh;min-height:0}
      .slide{grid-template-columns:1fr;grid-template-rows:55% 1fr}
      .info{padding:28px 24px 100px}
      .arrow.prev{left:16px}
      .arrow.next{right:16px}
      .dots{left:84px;right:84px}
    }
    @media(max-width:560px){
      h1{font-size:64px}
      .actions .cta{flex:1 1 100%}
    }
  `]
})
export class HomeComponent implements AfterViewInit, OnDestroy {
  private readonly products = inject(ProductService);
  private readonly tr = inject(I18nService);
  private readonly a11y = inject(AccessibilityService);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);

  t = (key: string, vars?: Record<string, string | number>) => this.tr.t(key, vars);

  readonly heroImg = HERO_IMG;
  readonly marquee = MARQUEE;

  readonly slides = computed(() => this.products.products().slice(0, 6));
  readonly featured = computed(() => {
    const f = this.products.featured();
    return (f.length ? f : this.products.products()).slice(0, 6);
  });
  readonly cats = computed(() => {
    const m = new Map<string, { name: string; count: number; image: string }>();
    for (const p of this.products.products()) {
      const c = m.get(p.category);
      if (c) c.count++; else m.set(p.category, { name: p.category, count: 1, image: p.image });
    }
    return [...m.values()];
  });

  readonly index = signal(0);
  readonly paused = signal(false);
  readonly step = signal(0);
  readonly steps = [1, 2, 3];
  readonly failed = signal<ReadonlySet<string>>(new Set());
  readonly playing = computed(() => !this.paused() && this.slides().length > 1 && !this.a11y.s().motion && !this.prefersReduced());

  private timer?: number;
  private io?: IntersectionObserver;

  constructor() {
    // Carrusel automático: se detiene al pasar el mouse, al enfocar con teclado o si el usuario reduce animaciones.
    effect(() => {
      const playing = this.playing();
      this.index();
      clearTimeout(this.timer);
      if (playing) this.timer = window.setTimeout(() => this.go(1), SLIDE_MS);
    });
  }

  go(dir: number): void {
    const n = this.slides().length;
    if (n) this.index.update(i => (i + dir + n) % n);
  }
  isFailed(key: string): boolean { return this.failed().has(key); }
  markFailed(key: string): void { this.failed.update(s => new Set(s).add(key)); }
  private prefersReduced(): boolean { return typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches; }

  // Aparición de las secciones al hacer scroll
  ngAfterViewInit(): void {
    const els = this.host.nativeElement.querySelectorAll('.rv');
    if (!('IntersectionObserver' in window) || this.prefersReduced() || this.a11y.s().motion) { els.forEach(e => e.classList.add('in')); return; }
    this.io = new IntersectionObserver(entries => entries.forEach(en => {
      if (en.isIntersecting) { en.target.classList.add('in'); this.io?.unobserve(en.target); }
    }), { threshold: 0.12 });
    els.forEach(e => this.io!.observe(e));
  }
  ngOnDestroy(): void { clearTimeout(this.timer); this.io?.disconnect(); }
}