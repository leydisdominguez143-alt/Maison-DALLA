import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { MannequinService } from '../../core/services/mannequin.service';
import { CartService } from '../../core/services/cart.service';
import { ProductService } from '../../core/services/product.service';
import { BodyMeasurements, BodyType } from '../../core/models/measurements.model';
import { CartItem } from '../../core/models/cart.model';
import { MannequinFittingComponent } from './mannequin-fitting.component';
import { I18nService } from '../../core/services/i18n.service';

type Item = ReturnType<ProductService['products']>[number];
type Kind = 'vestido' | 'top' | 'pantalon' | 'abrigo';
type Variant = 'noche' | 'xv' | 'tipico' | 'camisa' | 'blusa' | 'otro';

@Component({
  selector: 'app-mannequin-probador',
  standalone: true,
  imports: [FormsModule, RouterLink, MannequinFittingComponent],
  template: `
    <section class="atelier">
      <div class="stage" [attr.aria-label]="t('atelier.aria')">
        <app-mannequin-fitting class="stage-3d" [src]="garmentUrl()" [type]="garmentKind()" [variant]="garmentVariant()" [color]="activeColor()" [size]="activeSize()" (cleared)="selected.set(null)" />
        <div class="stage-copy">
          <p class="eyebrow">{{ t('atelier.eyebrow') }}</p>
          <h1>{{ t('atelier.title.a') }}<br><em>{{ t('atelier.title.b') }}</em></h1>
          <p class="intro">{{ t('atelier.intro') }}</p>
        </div>
      </div>

      <aside class="panel">
        <p class="eyebrow">{{ t('atelier.measurements') }}</p>
        <div class="size-line"><span>{{ t('atelier.estimated') }}</span><strong>{{mannequin.estimatedSize()}}</strong></div>

        @for (field of fields; track field.key) {
          <div class="measurement">
            <div class="m-top"><label [for]="field.key">{{t(field.label)}}</label><strong>{{mannequin.measurements()[field.key]}} cm</strong></div>
            <input [id]="field.key" type="range" [min]="field.min" [max]="field.max" [ngModel]="mannequin.measurements()[field.key]" (ngModelChange)="mannequin.updateMeasurement(field.key,$event)">
            <div class="range-labels"><span>{{field.min}}</span><span>{{field.max}}</span></div>
          </div>
        }

        <div class="block">
          <p class="label">{{ t('atelier.body') }}</p>
          <div class="segmented">
            <button type="button" [class.active]="mannequin.bodyType()==='female'" (click)="changeBodyType('female')">{{ t('atelier.female') }}</button>
            <button type="button" [class.active]="mannequin.bodyType()==='male'" (click)="changeBodyType('male')">{{ t('atelier.male') }}</button>
          </div>
        </div>

        @if (selected(); as p) {
          <div class="block">
            <p class="label">{{ t('atelier.garmentSize') }}</p>
            <div class="sizes" role="group" [attr.aria-label]="t('atelier.garmentSize')">
              <button type="button" [class.active]="!sizeChoice()" (click)="sizeChoice.set(null)">{{ t('atelier.auto', { size: mannequin.estimatedSize() }) }}</button>
              @for (s of p.sizes; track s) {
                <button type="button" [class.active]="sizeChoice()===s" (click)="sizeChoice.set(s)">{{s}}</button>
              }
            </div>
            <p class="fit-note">{{ t('atelier.fit') }}</p>
          </div>
          @if (p.colors.length > 1) {
            <div class="block">
              <p class="label">{{ t('atelier.color') }}</p>
              <div class="swatches" role="group" [attr.aria-label]="t('atelier.color')">
                @for (c of p.colors; track c.hex) {
                  <button type="button" class="swatch" [class.active]="activeColor()===c.hex" [style.background]="c.hex" [attr.aria-label]="c.name" [title]="c.name" (click)="colorChoice.set(c.hex)"></button>
                }
              </div>
            </div>
          }
          <div class="chosen"><span>{{productName(p.id, p.name)}}</span><strong>B/. {{p.price.toFixed(2)}}</strong></div>
        }
        <button type="button" class="primary" [disabled]="!selected()" (click)="addToCart()">{{ t('atelier.add') }}</button>
        <a routerLink="/citas" class="secondary">{{ t('atelier.book') }}</a>
        <button type="button" class="reset-button" (click)="mannequin.reset()">{{ t('atelier.reset') }}</button>
        @if (message()) { <p class="feedback" role="status">{{message()}}</p> }
        <p class="disclaimer">{{ t('atelier.disclaimer') }}</p>
      </aside>

      <div class="catalog">
        <p class="eyebrow">{{ t('atelier.catalog') }}</p>
        <div class="cards">
          @for (p of catalog(); track p.id) {
            <button type="button" class="card" [class.selected]="selected()?.id===p.id" (click)="select(p)">
              <img [src]="p.image" [alt]="productName(p.id, p.name)" loading="lazy">
              <span class="name">{{productName(p.id, p.name)}}</span>
              <span class="price">B/. {{p.price.toFixed(2)}}</span>
            </button>
          }
        </div>
      </div>
    </section>
  `,
  styles: [`
    :host{
      --gold:#e2b34d; --gold-soft:#e9c17c; --ink:#f8f4ed; --muted:#c9c1b4;
      --line:rgba(218,177,94,.22); --ease:cubic-bezier(.22,.8,.24,1);
      display:block;background:#05080d;color:var(--ink);
    }
    .atelier{display:grid;grid-template-columns:minmax(0,1fr) 390px;background:#05080d}

    .stage{position:relative;isolation:isolate;overflow:hidden;min-height:max(700px,calc(100svh - 146px));
      background:radial-gradient(ellipse 45% 60% at 62% 50%,#18212f 0,transparent 70%),linear-gradient(180deg,#080c14,#05080d)}
    .stage-3d{position:absolute;right:0;top:0;width:72%;height:100%}
    .stage-copy{position:absolute;z-index:2;left:clamp(26px,4vw,52px);top:9%;width:min(290px,26%)}
    .eyebrow{font-size:12px;letter-spacing:.18em;text-transform:uppercase;color:var(--gold);margin:0}
    h1{font:400 clamp(40px,3.8vw,62px)/1.04 var(--font-editorial);letter-spacing:-.04em;margin:24px 0 20px}
    h1 em{color:var(--gold-soft);font-weight:400}
    .intro{font-size:15px;line-height:1.7;color:#ddd5ca;margin:0}

    .panel{padding:28px 24px 24px;border-left:1px solid var(--line);background:linear-gradient(155deg,#0a0f18,#03070c);min-width:0}
    .size-line{display:flex;align-items:center;justify-content:space-between;padding:20px 0 17px;border-bottom:1px solid var(--line);font-size:14px}
    .size-line strong{display:grid;place-items:center;min-width:58px;height:38px;padding:0 12px;border:1px solid #c99b35;border-radius:24px;font:400 18px var(--font-editorial);color:#f4d58e}
    .measurement{padding:16px 0 14px;border-bottom:1px solid rgba(255,255,255,.08)}
    .m-top{display:flex;justify-content:space-between;align-items:baseline;font-size:14px}
    .m-top strong{font-weight:500;color:var(--gold-soft)}
    .measurement input{width:100%;margin:12px 0 4px;display:block;height:4px;accent-color:var(--gold)}
    .range-labels{display:flex;justify-content:space-between;color:#a9a194;font-size:12px}
    .block{margin-top:22px}
    .label{font-size:12px;letter-spacing:.14em;text-transform:uppercase;color:var(--muted);margin:0 0 10px}
    .segmented{display:grid;grid-template-columns:1fr 1fr;border:1px solid var(--line);border-radius:24px;overflow:hidden}
    .segmented button{padding:12px 6px;border:0;background:transparent;color:#a9a39a;font-size:13px;cursor:pointer}
    .segmented button.active{color:#efc66d;border:1px solid #c99b35;border-radius:24px;background:rgba(212,175,55,.09)}
    .sizes{display:flex;flex-wrap:wrap;gap:8px}
    .sizes button{padding:9px 14px;border:1px solid var(--line);border-radius:20px;background:transparent;color:#cfc8bb;font-size:13px;cursor:pointer;transition:border-color .3s,color .3s,background .3s}
    .sizes button:hover{border-color:var(--gold)}
    .sizes button.active{color:#efc66d;border-color:#c99b35;background:rgba(212,175,55,.1)}
    .fit-note{font-size:12px;line-height:1.5;color:#a39c90;margin:10px 0 0}
    .swatches{display:flex;flex-wrap:wrap;gap:10px}
    .swatch{width:30px;height:30px;border-radius:50%;border:2px solid rgba(255,255,255,.25);cursor:pointer;padding:0;transition:transform .3s,border-color .3s}
    .swatch:hover{transform:scale(1.12)}
    .swatch.active{border-color:var(--gold);box-shadow:0 0 0 2px #05080d,0 0 0 4px var(--gold)}
    .chosen{display:flex;justify-content:space-between;gap:10px;margin-top:22px;padding:12px 14px;border:1px solid var(--line);border-radius:12px;font-size:14px}
    .chosen strong{color:var(--gold-soft);font-weight:500;white-space:nowrap}
    .primary,.secondary,.reset-button{display:flex;justify-content:center;align-items:center;width:100%;min-height:48px;border-radius:28px;font-size:13px;letter-spacing:.1em;text-transform:uppercase;cursor:pointer;transition:background .5s var(--ease),color .5s var(--ease),opacity .3s}
    .primary{margin-top:16px;border:1px solid #d8a846;background:linear-gradient(100deg,#d4a143,#e4bd69);color:#080b10;font-weight:600}
    .primary:hover:not(:disabled){background:transparent;color:var(--gold)}
    .primary:disabled{opacity:.4;cursor:not-allowed}
    .secondary{margin-top:12px;border:1px solid rgba(234,213,174,.5);color:#e8e0d4}
    .reset-button{margin-top:12px;border:0;background:transparent;color:var(--muted);min-height:40px}
    .secondary:hover,.reset-button:hover{color:var(--gold)}
    .feedback{font-size:13px;line-height:1.5;color:#e9c477;margin:14px 0 0}
    .disclaimer{font-size:12px;line-height:1.6;color:#a39c90;margin:16px 0 0}

    .catalog{grid-column:1/-1;padding:22px clamp(20px,4vw,52px) 28px;border-top:1px solid var(--line);background:#05080d;min-width:0}
    .cards{display:flex;gap:16px;margin-top:14px;overflow-x:auto;padding-bottom:6px}
    .card{flex:0 0 160px;display:grid;gap:6px;padding:0 0 10px;border:1px solid rgba(255,255,255,.18);border-radius:8px;background:#0a1019;color:var(--ink);text-align:left;cursor:pointer;overflow:hidden;transition:border-color .4s var(--ease)}
    .card img{width:100%;height:200px;object-fit:cover;display:block}
    .card .name{padding:0 12px;font-size:14px}
    .card .price{padding:0 12px;font-size:13px;color:var(--gold-soft)}
    .card:hover,.card.selected{border-color:var(--gold)}
    a:focus-visible,button:focus-visible,input:focus-visible{outline:2px solid var(--gold);outline-offset:3px}

    @media(max-width:1200px){.atelier{grid-template-columns:minmax(0,1fr) 340px}.stage-copy{width:220px}}
    @media(max-width:900px){
      .atelier{display:flex;flex-direction:column}
      .stage{display:flex;flex-direction:column;min-height:0;padding:30px 20px 20px}
      .stage-copy{position:static;width:auto}
      .stage-3d{position:relative;width:100%;height:540px;margin-top:10px}
      .panel{border-left:0;border-top:1px solid var(--line)}
    }
  `]
})
export class MannequinProbadorComponent {
  private readonly tr = inject(I18nService);
  t = (key: string, vars?: Record<string, string | number>) => this.tr.t(key, vars);
  productName = (id: number, fallback: string) => this.tr.productName(id, fallback);
  readonly mannequin = inject(MannequinService);
  private readonly cart = inject(CartService);
  private readonly products = inject(ProductService);

  /** Todas las piezas del catálogo se pueden probar. */
  readonly catalog = computed(() => this.products.products());
  readonly selected = signal<Item | null>(null);
  readonly message = signal('');
  readonly sizeChoice = signal<string | null>(null);
  readonly colorChoice = signal<string | null>(null);
  /** Talla con la que se viste la prenda: la elegida o, si no, la que corresponde a tus medidas. */
  readonly activeSize = computed(() => this.sizeChoice() ?? this.mannequin.estimatedSize());
  readonly activeColor = computed(() => this.colorChoice() ?? this.selected()?.colors?.[0]?.hex ?? this.mannequin.garmentColor());

  /**
   * Solo se envuelve una foto si el producto trae `tryOn`: un PNG de la prenda ya recortada, sin modelo ni fondo.
   * Las fotos de catálogo con personas NO sirven para esto, así que la prenda se arma por código con el color elegido.
   */
  readonly garmentUrl = computed(() => {
    const p = this.selected();
    return p ? ((p as unknown as { tryOn?: string }).tryOn ?? null) : null;
  });
  /** Estilo de la prenda según la categoría del producto. */
  readonly garmentVariant = computed<Variant>(() => {
    const c = String(this.selected()?.category ?? '').toLowerCase();
    if (/xv/.test(c)) return 'xv';
    if (/paname|traje/.test(c)) return 'tipico';
    if (/noche/.test(c)) return 'noche';
    if (/camis/.test(c)) return 'camisa';
    if (/blus/.test(c)) return 'blusa';
    return 'otro';
  });
  readonly garmentKind = computed<Kind | null>(() => {
    const p = this.selected();
    if (!p) return null;
    const c = String(p.category ?? '').toLowerCase();
    if (/pantal|jean|falda/.test(c)) return 'pantalon';
    if (/blazer|abrig|chaqueta|saco|gabard/.test(c)) return 'abrigo';
    if (/blus|camis|top|suter|camisa/.test(c)) return 'top';
    return 'vestido';
  });

  readonly fields: { key: keyof BodyMeasurements; label: string; min: number; max: number }[] = [
    { key: 'bust', label: 'atelier.field.bust', min: 65, max: 140 },
    { key: 'waist', label: 'atelier.field.waist', min: 50, max: 130 },
    { key: 'hips', label: 'atelier.field.hips', min: 70, max: 145 },
    { key: 'height', label: 'atelier.field.height', min: 130, max: 220 }
  ];

  select(p: Item): void { this.selected.set(p); this.message.set(''); this.sizeChoice.set(null); this.colorChoice.set(null); }

  /** Al cambiar de anatomía se cargan medidas típicas de cada una, para que la figura se vea natural. */
  changeBodyType(type: BodyType): void {
    this.mannequin.setBodyType(type);
    const d: BodyMeasurements = type === 'male'
      ? { bust: 100, waist: 84, hips: 98, height: 178 }
      : { bust: 92, waist: 72, hips: 96, height: 168 };
    (Object.keys(d) as (keyof BodyMeasurements)[]).forEach(k => this.mannequin.updateMeasurement(k, d[k]));
  }

  addToCart(): void {
    const p = this.selected();
    if (!p) return;
    const c = this.mannequin.configuration();
    const item: CartItem = {
      lineId: crypto.randomUUID(), productId: p.id, name: this.productName(p.id, p.name),
      unitPrice: p.price, quantity: 1, color: this.activeColor(),
      size: this.activeSize(), madeToMeasure: true, measurements: { ...c.measurements }
    };
    this.cart.agregar(item);
    this.message.set(this.t('atelier.added', { name: this.productName(p.id, p.name) }));
  }
}