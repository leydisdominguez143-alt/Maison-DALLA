import { Component, HostListener, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { CartService } from '../../core/services/cart.service';
import { ProductService } from '../../core/services/product.service';
import { Product } from '../../core/models/product.model';
import { MannequinService } from '../../core/services/mannequin.service';
import { I18nService } from '../../core/services/i18n.service';

@Component({
  standalone: true,
  selector: 'app-catalog',
  imports: [FormsModule, RouterLink],
  template: `
    <section class="catalog-page container">
      <header class="catalog-heading"><span class="eyebrow">{{ t('cat.eyebrow') }}</span><h1 class="page-heading">{{ t('cat.title.a') }} <em>{{ t('cat.title.b') }}</em></h1><p class="muted">{{ t('cat.sub') }}</p></header>
      <div class="filters">
        <div class="category-list">
          @for (cat of categories(); track cat) { <button type="button" [class.selected]="activeCategory() === cat" (click)="category.set(cat)">{{ cat === 'Todas' ? t('cat.all') : productCategory(cat) }}</button> }
        </div>
        <input class="search" [(ngModel)]="query" [placeholder]="t('cat.search')" [attr.aria-label]="t('cat.search')">
      </div>
      <div class="product-grid">
        @for (product of filtered(); track product.id) {
          <article class="product-card">
            <button type="button" class="product-image" (click)="openDetails(product)" [attr.aria-label]="t('cat.details') + ': ' + productName(product.id, product.name)"><img [src]="product.image" [alt]="productName(product.id, product.name)" loading="lazy"><span class="tag">{{ product.madeToMeasure ? t('cat.tag.made') : t('cat.tag.col') }}</span><span class="image-cta">{{ t('cat.details') }} <i aria-hidden="true">↗</i></span></button>
            <div class="product-meta"><span>{{ productCategory(product.category) }}</span><span>B/. {{ product.price.toFixed(2) }}</span></div>
            <button type="button" class="product-title" (click)="openDetails(product)">{{ productName(product.id, product.name) }}</button><p>{{ productDescription(product.id, product.description) }}</p>
            <div class="card-actions"><button type="button" (click)="openDetails(product)">{{ t('cat.details') }} →</button>@if(product.madeToMeasure){<a routerLink="/atelier">{{ t('cat.custom') }} →</a>}</div>
          </article>
        }
      </div>
      @if(filtered().length === 0){<p class="empty">{{ t('cat.empty') }} <button type="button" class="link" (click)="reset()">{{ t('cat.reset') }}</button></p>}
      @if(message){<p class="toast" role="status">{{ message }}</p>}
    </section>
    @if (selectedProduct(); as product) {
      <div class="detail-overlay" (click)="closeDetails()">
        <section class="detail-dialog" role="dialog" aria-modal="true" aria-labelledby="detail-title" (click)="$event.stopPropagation()">
          <button type="button" class="detail-close" (click)="closeDetails()" [attr.aria-label]="t('cat.close')">×</button>
          <div class="detail-media">
            @if (detailSide() === 'back' && !product.backImage) {
              <div class="back-placeholder"><span aria-hidden="true">D</span><p>{{ t('cat.backSoon') }}</p></div>
            } @else {
              <img [src]="detailSide() === 'back' ? product.backImage : product.image" [alt]="productName(product.id, product.name) + ' — ' + t(detailSide() === 'back' ? 'cat.back' : 'cat.front')">
            }
            <span class="tag">{{ product.madeToMeasure ? t('cat.tag.made') : t('cat.tag.col') }}</span>
          </div>
          <div class="detail-info">
            <span class="detail-category">{{ productCategory(product.category) }}</span>
            <h2 id="detail-title">{{ productName(product.id, product.name) }}</h2>
            <p class="detail-price">B/. {{ product.price.toFixed(2) }}</p>
            <div class="view-switch" role="group" [attr.aria-label]="t('cat.views')">
              <button type="button" [class.selected]="detailSide() === 'front'" [attr.aria-pressed]="detailSide() === 'front'" (click)="detailSide.set('front')">{{ t('cat.front') }}</button>
              <button type="button" [class.selected]="detailSide() === 'back'" [attr.aria-pressed]="detailSide() === 'back'" (click)="detailSide.set('back')">{{ t('cat.back') }}</button>
            </div>
            <div class="detail-description">
              <h3>{{ t('cat.description') }}</h3>
              <p>{{ productDescription(product.id, product.description) }}</p>
            </div>
            <p class="detail-sizes">{{ t('cat.sizes') }}: {{ product.sizes.join(' · ') }}@if(product.madeToMeasure){ · {{ t('cat.tag.made') }} }</p>
            <button type="button" class="detail-add" (click)="add(product)">{{ t('cat.add') }}</button>
            @if(product.madeToMeasure){<a class="detail-custom" routerLink="/atelier">{{ t('cat.custom') }} →</a>}
          </div>
        </section>
      </div>
    }
  `,
  styles: [`
    .catalog-page{max-width:none;width:min(1680px,92vw);margin-inline:auto;padding-block:70px 100px;min-height:75vh}.catalog-heading{margin-bottom:40px}.catalog-heading>p{font-size:15px}.filters{display:flex;align-items:center;justify-content:space-between;gap:20px;flex-wrap:wrap;border-bottom:1px solid var(--dalla-border);padding-bottom:18px;margin-bottom:28px}.category-list{display:flex;flex-wrap:wrap;gap:10px}.category-list button{padding:12px 20px;border:1px solid transparent;background:transparent;color:#d6cfc3;font-size:14px;letter-spacing:.04em;cursor:pointer;transition:border-color .4s,color .4s}.category-list button.selected,.category-list button:hover{border-color:var(--dalla-gold);color:var(--dalla-gold-light)}.search{max-width:380px;min-height:48px;font-size:15px}.product-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(320px,1fr));gap:40px 26px}.product-card{min-width:0}.product-image{width:100%;padding:0;display:block;aspect-ratio:4/5;position:relative;overflow:hidden;background:#111925;border:1px solid var(--dalla-border);cursor:pointer;text-align:left}.product-image img{width:100%;height:100%;object-fit:cover;display:block;transition:transform .5s}.product-card:hover .product-image img{transform:scale(1.04)}.tag{position:absolute;top:13px;left:13px;padding:8px 11px;background:#080c14d9;color:#e9c17c;font-size:11px;letter-spacing:.14em;text-transform:uppercase}.image-cta{position:absolute;inset:auto 0 0;display:flex;justify-content:space-between;align-items:center;padding:17px 20px;background:linear-gradient(transparent,rgba(5,8,13,.9));color:#f4efe6;font-size:13px;letter-spacing:.08em;text-transform:uppercase;opacity:0;transform:translateY(8px);transition:opacity .3s,transform .3s}.product-image:hover .image-cta,.product-image:focus-visible .image-cta{opacity:1;transform:none}.image-cta i{font-style:normal;color:var(--dalla-gold-light);font-size:20px}.product-meta{display:flex;justify-content:space-between;margin-top:15px;color:var(--dalla-gold-light);font-size:12px;letter-spacing:.1em;text-transform:uppercase}.product-title{display:block;margin:10px 0;border:0;padding:0;background:none;color:var(--dalla-ivory);font:500 28px var(--font-editorial);text-align:left;cursor:pointer}.product-card>p{font-size:14px;line-height:1.7;color:var(--dalla-muted);min-height:48px}.card-actions{display:flex;justify-content:space-between;align-items:center;gap:10px;margin-top:16px}.card-actions button{border:0;border-bottom:1px solid var(--dalla-gold);padding:8px 0;background:transparent;color:var(--dalla-ivory);font-size:13px;cursor:pointer}.card-actions a{font-size:13px;color:var(--dalla-gold-light)}.empty{padding:40px 0;font-size:16px;color:var(--dalla-muted)}.empty .link{margin-left:10px;border:0;border-bottom:1px solid var(--dalla-gold);background:none;color:var(--dalla-gold-light);font-size:15px;cursor:pointer}.toast{position:fixed;right:24px;bottom:24px;z-index:20;background:var(--dalla-gold);color:var(--on-gold,#080c14);padding:16px 22px;font-size:14px}
    .detail-overlay{position:fixed;inset:0;z-index:100;display:grid;place-items:center;padding:24px;background:rgba(3,6,11,.82);backdrop-filter:blur(10px);overflow:auto}.detail-dialog{position:relative;display:grid;grid-template-columns:minmax(0,1.05fr) minmax(320px,.95fr);width:min(1120px,100%);max-height:min(820px,calc(100vh - 48px));overflow:auto;background:var(--surface,#0a1019);border:1px solid var(--dalla-border);box-shadow:0 32px 100px rgba(0,0,0,.5);color:var(--dalla-ivory)}.detail-close{position:absolute;z-index:3;top:14px;right:14px;width:44px;height:44px;border:1px solid var(--dalla-border);border-radius:50%;background:rgba(5,8,13,.72);color:#fff;font-size:28px;cursor:pointer}.detail-media{position:relative;min-height:540px;background:#111925}.detail-media>img{display:block;width:100%;height:100%;min-height:540px;object-fit:cover}.back-placeholder{min-height:540px;height:100%;display:grid;place-content:center;text-align:center;padding:30px;background:radial-gradient(ellipse at center,var(--glow,#172131),transparent 70%),#0a1019}.back-placeholder span{font:italic 400 150px/1 var(--font-editorial);color:color-mix(in srgb,var(--dalla-gold) 55%,transparent)}.back-placeholder p{color:var(--dalla-muted);font:italic 24px var(--font-editorial)}.detail-info{display:flex;flex-direction:column;align-items:flex-start;justify-content:center;padding:clamp(28px,5vw,64px);overflow:auto}.detail-category{color:var(--dalla-gold-light);font-size:12px;letter-spacing:.14em;text-transform:uppercase}.detail-info h2{margin:14px 0 8px;font:500 clamp(36px,4vw,54px)/1.08 var(--font-editorial);color:var(--dalla-ivory)}.detail-price{margin:0;color:var(--dalla-ivory);font-size:20px}.view-switch{display:flex;gap:8px;margin:28px 0 26px;padding:4px;border:1px solid var(--dalla-border)}.view-switch button{min-width:100px;padding:10px 16px;border:1px solid transparent;background:transparent;color:var(--dalla-muted);cursor:pointer}.view-switch button.selected{border-color:var(--dalla-gold);color:var(--dalla-gold-light)}.detail-description{border-top:1px solid var(--dalla-border);padding-top:22px}.detail-description h3{margin:0 0 9px;color:var(--dalla-gold-light);font-size:12px;letter-spacing:.14em;text-transform:uppercase}.detail-description p{margin:0;color:var(--dalla-muted);font-size:15px;line-height:1.8}.detail-sizes{margin:18px 0;color:var(--dalla-muted);font-size:13px}.detail-add{width:100%;min-height:54px;margin-top:8px;border:1px solid var(--dalla-gold);background:var(--dalla-gold);color:var(--on-gold,#080c14);font-weight:700;letter-spacing:.05em;text-transform:uppercase;cursor:pointer}.detail-custom{align-self:center;margin-top:16px;color:var(--dalla-gold-light);font-size:13px}
    @media(max-width:760px){.detail-overlay{padding:12px}.detail-dialog{grid-template-columns:1fr;max-height:calc(100vh - 24px)}.detail-media,.detail-media>img,.back-placeholder{min-height:0;height:min(54vh,480px)}.detail-info{padding:28px 24px 32px}.detail-info h2{font-size:38px}}
    @media(max-width:560px){.catalog-page{width:92vw}.search{max-width:none;width:100%}.product-grid{grid-template-columns:repeat(auto-fill,minmax(250px,1fr))}}
  `]
})
export class CatalogComponent {
  readonly productService = inject(ProductService);
  private readonly cart = inject(CartService);
  private readonly mannequin = inject(MannequinService);
  private readonly tr = inject(I18nService);
  private readonly route = inject(ActivatedRoute);
  t = (key: string, vars?: Record<string, string | number>) => this.tr.t(key, vars);
  productName = (id: number, fallback: string) => this.tr.productName(id, fallback);
  productDescription = (id: number, fallback: string) => this.tr.productDescription(id, fallback);
  productCategory = (category: string) => this.tr.productCategory(category);

  /** "Todas" + las categorías que realmente tienen los productos (se actualiza solo). */
  readonly categories = computed(() => ['Todas', ...new Set(this.productService.products().map(p => p.category as string))]);
  readonly category = signal<string>('Todas');
  readonly selectedProduct = signal<Product | null>(null);
  readonly detailSide = signal<'front' | 'back'>('front');
  /** Si la categoría elegida ya no existe (por ejemplo, la renombraste), se vuelve a "Todas". */
  readonly activeCategory = computed(() => this.categories().includes(this.category()) ? this.category() : 'Todas');
  query = '';
  message = '';

  constructor() {
    // /catalogo?categoria=Blusas abre el catálogo ya filtrado (lo usan las tarjetas del inicio)
    const c = this.route.snapshot.queryParamMap.get('categoria');
    if (c) this.category.set(c);
  }

  readonly filtered = computed(() => {
    const q = this.query.trim().toLowerCase();
    const cat = this.activeCategory();
    return this.productService.products().filter(p =>
      (cat === 'Todas' || p.category === cat) &&
      (!q || `${p.name} ${p.description} ${p.category} ${this.productName(p.id, p.name)} ${this.productDescription(p.id, p.description)} ${this.productCategory(p.category)}`.toLowerCase().includes(q))
    );
  });
  reset(): void { this.category.set('Todas'); this.query = ''; }
  openDetails(product: Product): void { this.detailSide.set('front'); this.selectedProduct.set(product); }
  closeDetails(): void { this.selectedProduct.set(null); }
  @HostListener('document:keydown.escape')
  onEscape(): void { if (this.selectedProduct()) this.closeDetails(); }
  add(product: Product): void {
    const config = this.mannequin.configuration();
    this.cart.agregar({
      lineId: crypto.randomUUID(), productId: product.id, name: product.name,
      unitPrice: product.price, quantity: 1, color: product.colors[0]?.hex ?? '#080c14',
      size: product.madeToMeasure ? config.estimatedSize : (product.sizes[0] ?? 'Única'),
      madeToMeasure: product.madeToMeasure,
      ...(product.madeToMeasure ? { measurements: { ...config.measurements } } : {})
    });
    this.message = this.t('cat.added', { name: this.productName(product.id, product.name) });
    setTimeout(() => this.message = '', 2600);
    this.closeDetails();
  }
}