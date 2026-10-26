import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ProductService } from '../../core/services/product.service';
import { Product, ProductCategory } from '../../core/models/product.model';

@Component({
  standalone: true,
  selector: 'app-admin',
  imports: [FormsModule],
  template: `
    <section class="container admin">
      <span class="eyebrow">MAISON DALLA / BACKOFFICE</span><h1 class="page-heading">Panel de <em>administración.</em></h1>
      <div class="warning"><strong>Modo demostración</strong><span>Sin autenticación ni persistencia en servidor. No publicar como panel administrativo real.</span></div>
      <div class="stats"><div class="panel"><span>Productos</span><strong>{{products.products().length}}</strong></div><div class="panel"><span>Categorías</span><strong>05</strong></div><div class="panel"><span>Pedidos</span><strong>—</strong><small>API pendiente</small></div><div class="panel"><span>Citas</span><strong>—</strong><small>API pendiente</small></div></div>
      <div class="admin-grid"><form class="panel editor" (ngSubmit)="save()"><span class="eyebrow">CATÁLOGO / CRUD LOCAL</span><h2>{{editingId() ? 'Editar producto' : 'Crear producto'}}</h2><label for="name">Nombre</label><input id="name" name="name" [(ngModel)]="form.name" required><label for="price">Precio (B/.)</label><input id="price" name="price" type="number" min="0" step=".01" [(ngModel)]="form.price" required><label for="category">Categoría</label><select id="category" name="category" [(ngModel)]="form.category"><option>Vestidos</option><option>Blusas</option><option>Blazers</option><option>Calzado</option><option>Accesorios</option></select><label for="image">URL de imagen</label><input id="image" name="image" [(ngModel)]="form.image" required><label for="description">Descripción</label><textarea id="description" name="description" rows="3" [(ngModel)]="form.description"></textarea><label class="checkbox"><input type="checkbox" name="madeToMeasure" [(ngModel)]="form.madeToMeasure"> Confección a medida</label><button class="button" type="submit">{{editingId() ? 'Guardar cambios' : 'Crear producto'}}</button><button class="button secondary full-button" type="button" (click)="reset()">Limpiar</button>@if(message()){<p class="message" role="status">{{message()}}</p>}</form>
      <div class="panel inventory"><div class="inventory-head"><h2>Inventario</h2><span>{{products.products().length}} piezas</span></div>@for(product of products.products();track product.id){<div class="inventory-item"><img [src]="product.image" [alt]="product.name"><div><strong>{{product.name}}</strong><small>{{product.category}} · B/. {{product.price.toFixed(2)}}</small><small>{{product.madeToMeasure?'A medida':'Colección'}}</small></div><div class="item-actions"><button (click)="edit(product)">Editar</button><button class="delete" (click)="remove(product.id)">Eliminar</button></div></div>}</div></div>
    </section>
  `,
  styles: [`
    .admin{padding-block:65px 100px;min-height:75vh}.warning{display:flex;gap:15px;flex-wrap:wrap;padding:15px 18px;margin:25px 0;background:#332815;border:1px solid #8e6c2a;color:#f0d28a;font-size:11px}.warning span{color:#d7c8a7}.stats{display:grid;grid-template-columns:repeat(4,1fr);gap:14px;margin-bottom:25px}.stats>div{padding:20px}.stats span,.stats small{display:block;color:var(--dalla-muted);font-size:10px}.stats strong{display:block;font:400 30px var(--font-editorial);margin-top:12px}.stats small{margin-top:5px}.admin-grid{display:grid;grid-template-columns:330px minmax(0,1fr);gap:20px;align-items:start}.editor{padding:24px}.editor h2,.inventory h2{font:500 25px var(--font-editorial);margin:12px 0 22px}.editor label{margin-top:15px}.checkbox{display:flex;align-items:center;gap:8px}.checkbox input{width:auto}.editor .button{width:100%;margin-top:20px}.editor .full-button{margin-top:10px}.message{font-size:11px;color:var(--dalla-gold-light);line-height:1.5}.inventory{padding:24px}.inventory-head{display:flex;align-items:center;justify-content:space-between}.inventory-head span{font-size:10px;color:var(--dalla-muted)}.inventory-item{display:grid;grid-template-columns:58px minmax(0,1fr) auto;align-items:center;gap:14px;padding:13px 0;border-top:1px solid rgba(255,255,255,.09)}.inventory-item img{width:58px;height:68px;object-fit:cover}.inventory-item strong,.inventory-item small{display:block}.inventory-item strong{font:500 16px var(--font-editorial)}.inventory-item small{font-size:9px;color:var(--dalla-muted);margin-top:5px}.item-actions{display:flex;gap:8px}.item-actions button{padding:8px;background:transparent;border:1px solid var(--dalla-border);color:var(--dalla-gold-light);font-size:9px}.item-actions .delete{color:#e0a4a0;border-color:#704341}
    @media(max-width:900px){.admin-grid{grid-template-columns:1fr}.stats{grid-template-columns:repeat(2,1fr)}}@media(max-width:560px){.inventory-item{grid-template-columns:48px minmax(0,1fr)}.inventory-item img{width:48px;height:58px}.item-actions{grid-column:2}.item-actions button{flex:1}}
  `]
})
export class AdminComponent {
  readonly products=inject(ProductService);
  readonly editingId=signal<number|null>(null);
  readonly message=signal('');
  form={name:'',price:0,category:'Vestidos' as ProductCategory,image:'',description:'',madeToMeasure:true};
  save():void {
    const id=this.editingId() ?? Math.max(0,...this.products.products().map(p=>p.id))+1;
    const product:Product={id,name:this.form.name.trim(),price:Number(this.form.price),category:this.form.category,image:this.form.image.trim(),description:this.form.description.trim(),madeToMeasure:this.form.madeToMeasure,sizes:['XS','S','M','L','XL'],colors:[{name:'Azul noche',hex:'#101b32'}]};
    if(!product.name||!product.image||!Number.isFinite(product.price)||product.price<0){this.message.set('Completa los campos con valores válidos.');return;}
    this.products.save(product);this.message.set(this.editingId()?'Producto actualizado en memoria.':'Producto creado en memoria.');this.reset();
  }
  edit(p:Product):void {this.editingId.set(p.id);this.form={name:p.name,price:p.price,category:p.category,image:p.image,description:p.description,madeToMeasure:p.madeToMeasure};this.message.set('Editando '+p.name);}
  remove(id:number):void {this.products.delete(id);if(this.editingId()===id)this.reset();this.message.set('Producto eliminado de la sesión actual.');}
  reset():void {this.editingId.set(null);this.form={name:'',price:0,category:'Vestidos de noche',image:'',description:'',madeToMeasure:true};}
}
