import { Injectable, computed, signal } from '@angular/core';
import { CartItem, Promotion } from '../models/cart.model';

@Injectable({ providedIn: 'root' })
export class CartService {
  private readonly _items = signal<CartItem[]>([]);
  private readonly _promotion = signal<Promotion | null>(null);
  readonly items = this._items.asReadonly();
  readonly promotion = this._promotion.asReadonly();
  readonly itemCount = computed(() => this._items().reduce((sum, item) => sum + item.quantity, 0));
  readonly subtotal = computed(() => this._items().reduce((sum, item) => sum + item.unitPrice * item.quantity, 0));
  readonly discount = computed(() => this.subtotal() * ((this._promotion()?.discountPercent ?? 0) / 100));
  readonly taxableAmount = computed(() => Math.max(0, this.subtotal() - this.discount()));
  readonly itbms = computed(() => this.taxableAmount() * 0.07);
  readonly total = computed(() => this.taxableAmount() + this.itbms());

  agregar(item: CartItem): void { this._items.update(items => [...items, item]); }
  remove(lineId: string): void { this._items.update(items => items.filter(item => item.lineId !== lineId)); }
  updateQuantity(lineId: string, quantity: number): void {
    if (!Number.isInteger(quantity) || quantity < 1) return;
    this._items.update(items => items.map(item => item.lineId === lineId ? { ...item, quantity } : item));
  }
  applyPromotion(promotion: Promotion | null): void { this._promotion.set(promotion); }
  clear(): void { this._items.set([]); this._promotion.set(null); }
}
