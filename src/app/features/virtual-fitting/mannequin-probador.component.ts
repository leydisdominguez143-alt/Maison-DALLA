import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { MannequinService } from '../../core/services/mannequin.service';
import { CartService } from '../../core/services/cart.service';
import { ProductService } from '../../core/services/product.service';
import { BodyMeasurements, BodyType } from '../../core/models/measurements.model';
import { CartItem } from '../../core/models/cart.model';
import { MannequinFittingComponent } from './mannequin-fitting.component';

type Item = ReturnType<ProductService['products']>[number];
type Kind = 'vestido' | 'top' | 'pantalon' | 'abrigo';

@Component({
  selector: 'app-mannequin-probador',
  standalone: true,
  imports: [FormsModule, RouterLink, MannequinFittingComponent],
  template: `
    <section class="atelier">
      <div class="stage" aria-label="Probador">
        <app-mannequin-fitting class="stage-3d" [src]="garmentUrl()" [type]="garmentKind()" (cleared)="selected.set(null)" />
        <div class="stage-copy">
          <p class="eyebrow">Atelier digital</p>
          <h1>Tu silueta.<br><em>Tu diseño.</em></h1>
          <p class="intro">Ajusta tus medidas y elige una pieza del catálogo para verla puesta.</p>
        </div>
      </div>

      <aside class="panel">
        <p class="eyebrow">Medidas personalizadas</p>
        <div class="size-line"><span>Talla estimada</span><strong>{{mannequin.estimatedSize()}}</strong></div>

        @for (field of fields; track field.key) {
          <div class="measurement">
            <div class="m-top"><label [for]="field.key">{{field.label}}</label><strong>{{mannequin.measurements()[field.key]}} cm</strong></div>
            <input [id]="field.key" type="range" [min]="field.min" [max]="field.max" [ngModel]="mannequin.measurements()[field.key]" (ngModelChange)="mannequin.updateMeasurement(field.key,$event)">
            <div class="range-labels"><span>{{field.min}}</span><span>{{field.max}}</span></div>
          </div>
        }

        <div class="block">
          <p class="label">Tipo de anatomía</p>
          <div class="segmented">
            <button type="button" [class.active]="mannequin.bodyType()==='female'" (click)="changeBodyType('female')">Femenina</button>
            <button type="button" [class.active]="mannequin.bodyType()==='male'" (click)="changeBodyType('male')">Masculina</button>
          </div>
        </div>

        @if (selected(); as p) {
          <div class="chosen"><span>{{p.name}}</span><strong>B/. {{p.price.toFixed(2)}}</strong></div>
        }
        <button type="button" class="primary" [disabled]="!selected()" (click)="addToCart()">Añadir a la bolsa</button>
        <a routerLink="/citas" class="secondary">Reservar cita con estas medidas</a>
        <button type="button" class="reset-button" (click)="mannequin.reset()">Restablecer medidas</button>
        @if (message()) { <p class="feedback" role="status">{{message()}}</p> }
        <p class="disclaimer">La talla estimada es orientativa. El ajuste definitivo requiere validar el patrón y las medidas con el atelier.</p>
      </aside>

      <div class="catalog">
        <p class="eyebrow">Catálogo</p>
        <div class="cards">
          @for (p of catalog(); track p.id) {
            <button type="button" class="card" [class.selected]="selected()?.id===p.id" (click)="select(p)">
              <img [src]="p.image" [alt]="p.name" loading="lazy">
              <span class="name">{{p.name}}</span>
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
  readonly mannequin = inject(MannequinService);
  private readonly cart = inject(CartService);
  private readonly products = inject(ProductService);

  /** Todas las piezas del catálogo se pueden probar. */
  readonly catalog = computed(() => this.products.products());
  readonly selected = signal<Item | null>(null);
  readonly message = signal('');

  /** Foto de la prenda: si el producto tiene `tryOn` (PNG sin fondo) se usa esa; si no, su foto normal. */
  readonly garmentUrl = computed(() => {
    const p = this.selected();
    return p ? ((p as unknown as { tryOn?: string }).tryOn ?? p.image) : null;
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
    { key: 'bust', label: 'Busto / Pecho', min: 65, max: 140 },
    { key: 'waist', label: 'Cintura', min: 50, max: 130 },
    { key: 'hips', label: 'Cadera', min: 70, max: 145 },
    { key: 'height', label: 'Estatura', min: 130, max: 220 }
  ];

  select(p: Item): void { this.selected.set(p); this.message.set(''); }

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
      lineId: crypto.randomUUID(), productId: p.id, name: p.name,
      unitPrice: p.price, quantity: 1, color: c.garmentColor,
      size: c.estimatedSize, madeToMeasure: true, measurements: { ...c.measurements }
    };
    this.cart.agregar(item);
    this.message.set(`${p.name} añadido a la bolsa con tus medidas.`);
  }
}