import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CartService } from '../../core/services/cart.service';

@Component({
  standalone: true,
  selector: 'app-cart',
  imports: [RouterLink],
  template: `
    <section class="container cart-page">
      <span class="eyebrow">MAISON DALLA / TU SELECCIÓN</span><h1 class="page-heading">Tu <em>bolsa.</em></h1>
      @if(cart.items().length===0){
        <div class="empty panel"><span class="empty-icon">♧</span><h2>Tu bolsa está esperando una pieza especial.</h2><p class="muted">Explora la colección o crea un diseño personalizado en el atelier.</p><div><a class="button" routerLink="/catalogo">Explorar colección</a><a class="button secondary" routerLink="/atelier">Ir al atelier</a></div></div>
      } @else {
        <div class="cart-layout"><div class="cart-items">
          @for(item of cart.items();track item.lineId){
            <article class="cart-item panel"><div class="swatch" [style.background]="item.color"></div><div class="item-info"><span class="eyebrow">{{item.madeToMeasure?'CONFECCIÓN A MEDIDA':'COLECCIÓN'}}</span><h2>{{item.name}}</h2><p>Talla: {{item.size}} · Color: {{item.color}}</p>@if(item.measurements){<small>Medidas guardadas: pecho {{item.measurements.bust}} cm · cintura {{item.measurements.waist}} cm · cadera {{item.measurements.hips}} cm · estatura {{item.measurements.height}} cm</small>}<div class="quantity"><button (click)="change(item.lineId,item.quantity-1)" [disabled]="item.quantity<=1">−</button><span>{{item.quantity}}</span><button (click)="change(item.lineId,item.quantity+1)">+</button><button class="remove" (click)="cart.remove(item.lineId)">Eliminar</button></div></div><strong>B/. {{(item.unitPrice*item.quantity).toFixed(2)}}</strong></article>
          }
        </div><aside class="summary panel"><h2>Resumen del pedido</h2><div><span>Subtotal</span><strong>B/. {{cart.subtotal().toFixed(2)}}</strong></div><div><span>Descuento</span><strong>− B/. {{cart.discount().toFixed(2)}}</strong></div><div><span>Base imponible</span><strong>B/. {{cart.taxableAmount().toFixed(2)}}</strong></div><div><span>ITBMS (7% ilustrativo)</span><strong>B/. {{cart.itbms().toFixed(2)}}</strong></div><div class="total"><span>Total estimado</span><strong>B/. {{cart.total().toFixed(2)}}</strong></div><label for="promo">Código promocional</label><div class="promo"><input id="promo" #promo placeholder="Código"><button (click)="applyPromo(promo.value)">Aplicar</button></div>@if (promoMessage()) {<p class="promo-message">{{ promoMessage() }}</p>}<button class="button checkout" (click)="checkout()">Continuar al pago</button><p class="legal">El pago aún no está conectado a una pasarela. El ITBMS y los descuentos deben validarse según la normativa aplicable.</p></aside></div>
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
  readonly promoMessage = signal('');
  checkoutMessage = '';
  change(lineId:string,quantity:number):void { this.cart.updateQuantity(lineId,quantity); }
  applyPromo(code:string):void {
    const normalized=code.trim().toUpperCase();
    if(normalized==='DALLA10'){this.cart.applyPromotion({code:normalized,discountPercent:10});this.promoMessage.set('Descuento de demostración del 10% aplicado.');}
    else {this.cart.applyPromotion(null);this.promoMessage.set(normalized?'Código no válido. Prueba DALLA10 (demo).':'Introduce un código.');}
  }
  checkout():void { this.checkoutMessage='Checkout de demostración: conecta un backend y una pasarela de pago antes de aceptar transacciones reales.'; }
}
