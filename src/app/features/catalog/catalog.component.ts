import { Component, computed, inject, signal } from '@angular/core';
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
            <div class="product-image"><img [src]="product.image" [alt]="productName(product.id, product.name)" loading="lazy"><span class="tag">{{ product.madeToMeasure ? t('cat.tag.made') : t('cat.tag.col') }}</span><button class="quick-add" (click)="add(product)" [attr.aria-label]="t('cat.add') + ' ' + productName(product.id, product.name)">+</button></div>
            <div class="product-meta"><span>{{ productCategory(product.category) }}</span><span>B/. {{ product.price.toFixed(2) }}</span></div>
            <h2>{{ productName(product.id, product.name) }}</h2><p>{{ productDescription(product.id, product.description) }}</p>
            <div class="card-actions"><button (click)="add(product)">{{ t('cat.add') }}</button>@if(product.madeToMeasure){<a routerLink="/atelier">{{ t('cat.custom') }} →</a>}</div>
          </article>
        }
      </div>
      @if(filtered().length === 0){<p class="empty">{{ t('cat.empty') }} <button type="button" class="link" (click)="reset()">{{ t('cat.reset') }}</button></p>}
      @if(message){<p class="toast" role="status">{{ message }}</p>}
    </section>
  `,
  styles: [`
    .catalog-page{max-width:none;width:min(1680px,92vw);margin-inline:auto;padding-block:70px 100px;min-height:75vh}.catalog-heading{margin-bottom:40px}.catalog-heading>p{font-size:15px}.filters{display:flex;align-items:center;justify-content:space-between;gap:20px;flex-wrap:wrap;border-bottom:1px solid var(--dalla-border);padding-bottom:18px;margin-bottom:28px}.category-list{display:flex;flex-wrap:wrap;gap:10px}.category-list button{padding:12px 20px;border:1px solid transparent;background:transparent;color:#d6cfc3;font-size:14px;letter-spacing:.04em;cursor:pointer;transition:border-color .4s,color .4s}.category-list button.selected,.category-list button:hover{border-color:var(--dalla-gold);color:var(--dalla-gold-light)}.search{max-width:380px;min-height:48px;font-size:15px}.product-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(320px,1fr));gap:40px 26px}.product-card{min-width:0}.product-image{aspect-ratio:4/5;position:relative;overflow:hidden;background:#111925;border:1px solid var(--dalla-border)}.product-image img{width:100%;height:100%;object-fit:cover;transition:transform .5s}.product-card:hover .product-image img{transform:scale(1.04)}.tag{position:absolute;top:13px;left:13px;padding:8px 11px;background:#080c14d9;color:#e9c17c;font-size:11px;letter-spacing:.14em;text-transform:uppercase}.quick-add{position:absolute;right:13px;bottom:13px;width:40px;height:40px;border:1px solid #d9b86a;background:#080c14;color:#e9c17c;font-size:23px;cursor:pointer}.product-meta{display:flex;justify-content:space-between;margin-top:15px;color:var(--dalla-gold-light);font-size:12px;letter-spacing:.1em;text-transform:uppercase}.product-card h2{font:500 28px var(--font-editorial);margin:10px 0}.product-card p{font-size:14px;line-height:1.7;color:var(--dalla-muted);min-height:48px}.card-actions{display:flex;justify-content:space-between;align-items:center;gap:10px;margin-top:16px}.card-actions button{border:0;border-bottom:1px solid var(--dalla-gold);padding:8px 0;background:transparent;color:var(--dalla-ivory);font-size:13px;cursor:pointer}.card-actions a{font-size:13px;color:var(--dalla-gold-light)}.empty{padding:40px 0;font-size:16px;color:var(--dalla-muted)}.empty .link{margin-left:10px;border:0;border-bottom:1px solid var(--dalla-gold);background:none;color:var(--dalla-gold-light);font-size:15px;cursor:pointer}.toast{position:fixed;right:24px;bottom:24px;z-index:20;background:var(--dalla-gold);color:var(--on-gold,#080c14);padding:16px 22px;font-size:14px}
    @media(max-width:560px){.catalog-page{width:92vw}.search{max-width:none;width:100%}}
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
  }
}