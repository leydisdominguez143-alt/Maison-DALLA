import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CartService } from '../../core/services/cart.service';
import { I18nService } from '../../core/services/i18n.service';

@Component({
  standalone: true,
  selector: 'app-cart',
  imports: [RouterLink],
  template: `
    <section class="container cart-page">
      <span class="eyebrow">{{ t('cart.selection') }}</span><h1 class="page-heading">{{ t('cart.title.a') }} <em>{{ t('cart.title.b') }}</em></h1>
      @if(cart.items().length===0){
        <div class="empty panel"><span class="empty-icon">♧</span><h2>{{ t('cart.empty.title') }}</h2><p class="muted">{{ t('cart.empty.text') }}</p><div><a class="button" routerLink="/catalogo">{{ t('cart.explore') }}</a><a class="button secondary" routerLink="/atelier">{{ t('cart.atelier') }}</a></div></div>
      } @else {
        <div class="cart-layout"><div class="cart-items">
          @for(item of cart.items();track item.lineId){
            <article class="cart-item panel"><div class="swatch" [style.background]="item.color"></div><div class="item-info"><span class="eyebrow">{{item.madeToMeasure ? t('cart.made') : t('cart.collection')}}</span><h2>{{productName(item.productId, item.name)}}</h2><p>{{ t('cart.sizeColor', { size: item.size, color: item.color }) }}</p>@if(item.measurements){<small>{{ t('cart.measurements', { bust: item.measurements.bust, waist: item.measurements.waist, hips: item.measurements.hips, height: item.measurements.height }) }}</small>}<div class="quantity"><button (click)="change(item.lineId,item.quantity-1)" [disabled]="item.quantity<=1" [attr.aria-label]="t('cart.decrease')">−</button><span>{{item.quantity}}</span><button (click)="change(item.lineId,item.quantity+1)" [attr.aria-label]="t('cart.increase')">+</button><button class="remove" (click)="cart.remove(item.lineId)">{{ t('cart.remove') }}</button></div></div><strong>B/. {{(item.unitPrice*item.quantity).toFixed(2)}}</strong></article>
          }
        </div><aside class="summary panel"><h2>{{ t('cart.summary') }}</h2><div><span>{{ t('cart.subtotal') }}</span><strong>B/. {{cart.subtotal().toFixed(2)}}</strong></div><div><span>{{ t('cart.discount') }}</span><strong>− B/. {{cart.discount().toFixed(2)}}</strong></div><div><span>{{ t('cart.taxable') }}</span><strong>B/. {{cart.taxableAmount().toFixed(2)}}</strong></div><div><span>{{ t('cart.tax') }}</span><strong>B/. {{cart.itbms().toFixed(2)}}</strong></div><div class="total"><span>{{ t('cart.total') }}</span><strong>B/. {{cart.total().toFixed(2)}}</strong></div><label for="promo">{{ t('cart.promo') }}</label><div class="promo"><input id="promo" #promo [placeholder]="t('cart.code')"><button (click)="applyPromo(promo.value)">{{ t('cart.apply') }}</button></div>@if (promoMessage()) {<p class="promo-message">{{ promoMessage() }}</p>}<button class="button checkout" (click)="checkout()">{{ t('cart.checkout') }}</button><p class="legal">{{ t('cart.legal') }}</p></aside></div>
      }
      @if(checkoutMessage){<div class="notice" role="status">{{checkoutMessage}}</div>}
    </section>
  `,
  styles: [`
    .cart-page{min-height:70vh;padding-block:70px 100px}.empty{padding:55px 25px;text-align:center;margin-top:25px}.empty-icon{font-size:40px;color:var(--dalla-gold)}.empty h2{font:500 28px var(--font-editorial)}.empty p{font-size:12px}.empty>div{display:flex;justify-content:center;gap:12px;flex-wrap:wrap;margin-top:25px}.cart-layout{display:grid;grid-template-columns:minmax(0,1.5fr) minmax(290px,.8fr);gap:24px;margin-top:30px}.cart-items{display:grid;gap:12px;align-content:start}.cart-item{padding:18px;display:grid;grid-template-columns:62px 1fr auto;gap:16px;align-items:start}.swatch{width:62px;height:78px;border:1px solid var(--dalla-border)}.item-info h2{font:500 23px var(--font-editorial);margin:8px 0}.item-info p,.item-info small{font-size:10px;color:var(--dalla-muted);line-height:1.6}.cart-item>strong{font-size:12px;white-space:nowrap}.quantity{display:flex;align-items:center;gap:12px;margin-top:15px;font-size:11px}.quantity button{width:27px;height:27px;background:transparent;border:1px solid var(--dalla-border);color:var(--dalla-ivory)}.quantity button:disabled{opacity:.35}.quantity .remove{width:auto;border:0;color:#d8a39d}.summary{padding:25px;height:max-content}.summary h2{font:500 25px var(--font-editorial);margin:0 0 24px}.summary>div{display:flex;justify-content:space-between;gap:12px;padding:13px 0;border-bottom:1px solid rgba(255,255,255,.08);font-size:11px}.summary>div strong{font-weight:500}.summary .total{margin-top:8px;font-size:13px;color:var(--dalla-gold-light)}.summary label{margin-top:22px}.promo{display:flex}.promo input{min-width:0}.promo button{border:1px solid var(--dalla-gold);background:transparent;color:var(--dalla-gold-light);padding:0 12px;font-size:10px}.promo-message,.legal{font-size:10px;line-height:1.6;color:var(--dalla-muted)}.checkout{width:100%;margin-top:20px}.notice{position:fixed;bottom:24px;right:24px;background:var(--dalla-gold);color:#080c14;padding:18px;z-index:50;font-size:12px}
    @media(max-width:800px){.cart-layout{grid-template-columns:1fr}}@media(max-width:500px){.cart-item{grid-template-columns:45px 1fr}.swatch{width:45px;height:60px}.cart-item>strong{grid-column:2}.empty h2{font-size:23px}}
  `]
})
export class CartComponent {
  readonly cart = inject(CartService);
  private readonly tr = inject(I18nService);
  t = (key: string, vars?: Record<string, string | number>) => this.tr.t(key, vars);
  productName = (id: number, fallback: string) => this.tr.productName(id, fallback);
  readonly promoMessage = signal('');
  checkoutMessage = '';
  change(lineId:string,quantity:number):void { this.cart.updateQuantity(lineId,quantity); }
  applyPromo(code:string):void {
    const normalized=code.trim().toUpperCase();
    if(normalized==='DALLA10'){this.cart.applyPromotion({code:normalized,discountPercent:10});this.promoMessage.set(this.t('cart.promo.success'));}
    else {this.cart.applyPromotion(null);this.promoMessage.set(this.t(normalized?'cart.promo.invalid':'cart.promo.empty'));}
  }
  checkout():void { this.checkoutMessage=this.t('cart.checkout.notice'); }
}
