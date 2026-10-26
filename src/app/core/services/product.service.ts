import { Injectable, computed, signal } from '@angular/core';
import { Product, ProductCategory } from '../models/product.model';

@Injectable({ providedIn: 'root' })
export class ProductService {
  private readonly _products = signal<Product[]>([
    // Una pieza por categoría. Los nombres, precios, descripciones y fotos de las piezas 3, 4 y 5 son de ejemplo: cámbialos por los reales.
    { id: 1, name: 'Camisa', description: 'Camisa de algodón con cuello de pico y mangas cortas.', price: 28, category: 'Camisas', image: 'assets/images/Camisa-D.png', madeToMeasure: true, sizes: ['XS','S','M','L','XL'], colors: [{name:'Azul noche',hex:'#101b32'},{name:'Negro',hex:'#080c14'},{name:'Marfil',hex:'#e9dfce'}], featured: true },
    { id: 2, name: 'Blusa Épure', description: 'Blusa de líneas limpias para una elegancia cotidiana.', price: 125, category: 'Blusas', image: 'src/assets/images/Blusa-Epure.png', madeToMeasure: false, sizes: ['XS','S','M','L'], colors: [{name:'Marfil',hex:'#e9dfce'},{name:'Negro',hex:'#080c14'}], featured: true },
    { id: 3, name: 'Vestido Noche Royale', description: 'Vestido largo de noche en satén, de silueta ajustada y caída fluida.', price: 289, category: 'Vestidos de noche', image: 'assets/images/vestido-noche-royale.png', madeToMeasure: true, sizes: ['XS','S','M','L','XL'], colors: [{name:'Azul noche',hex:'#101b32'},{name:'Negro',hex:'#080c14'},{name:'Borgoña',hex:'#552331'}], featured: true },
    { id: 4, name: 'Vestido XV Aurora', description: 'Vestido de quinceañera con falda amplia y corpiño bordado, confeccionado a medida.', price: 450, category: 'Vestidos de XV', image: 'assets/images/vestido-xv-aurora.png', madeToMeasure: true, sizes: ['XS','S','M','L'], colors: [{name:'Marfil',hex:'#e9dfce'},{name:'Rosa empolvado',hex:'#d9b3b0'}], featured: true },
    { id: 5, name: 'Traje Tipico', description: 'Traje típico panameño de gala con encajes y detalles bordados, hecho a medida.', price: 35, category: 'Trajes Panameños', image: 'assets/images/TRAJET1.png', madeToMeasure: true, sizes: ['S','M','L'], colors: [{name:'Blanco',hex:'#f4efe6'},{name:'Marfil',hex:'#e9dfce'}], featured: true }
  ]);
  readonly products = this._products.asReadonly();
  readonly featured = computed(() => this._products().filter(p => p.featured));
  getById(id: number): Product | undefined { return this._products().find(p => p.id === id); }
  getByCategory(category: ProductCategory): Product[] { return this._products().filter(p => p.category === category); }
  save(product: Product): void {
    this._products.update(items => {
      const exists = items.some(p => p.id === product.id);
      return exists ? items.map(p => p.id === product.id ? product : p) : [...items, product];
    });
  }
  delete(id: number): void { this._products.update(items => items.filter(p => p.id !== id)); }
}