import { Injectable, computed, signal } from '@angular/core';
import { ProductCategory } from '../models/product.model';

@Injectable({ providedIn: 'root' })
export class NavigationService {
  readonly sections = ['inicio', 'catalogo', 'atelier', 'citas', 'contacto'] as const;
  readonly categories: ProductCategory[] = ['Vestidos de noche', 'Blusas', 'Vestidos de XV', 'Camisas', 'Trajes Panameños'];
  private readonly _sectionIndex = signal(0);
  private readonly _categoryIndex = signal(0);
  readonly sectionIndex = this._sectionIndex.asReadonly();
  readonly categoryIndex = this._categoryIndex.asReadonly();
  readonly currentSection = computed(() => this.sections[this._sectionIndex()]);
  readonly currentCategory = computed(() => this.categories[this._categoryIndex()]);
  nextSection(): void { this._sectionIndex.update(i => Math.min(i + 1, this.sections.length - 1)); }
  previousSection(): void { this._sectionIndex.update(i => Math.max(i - 1, 0)); }
  nextCategory(): void { this._categoryIndex.update(i => (i + 1) % this.categories.length); }
  previousCategory(): void { this._categoryIndex.update(i => (i - 1 + this.categories.length) % this.categories.length); }
  goToSection(i: number): void { if (i >= 0 && i < this.sections.length) this._sectionIndex.set(i); }
  goToCategory(i: number): void { if (i >= 0 && i < this.categories.length) this._categoryIndex.set(i); }
}
