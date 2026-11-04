import { Injectable, effect, signal } from '@angular/core';
import { ProductCategory } from '../../core/models/product.model';

export type OrderStatus = 'Pagado' | 'En confección' | 'Enviado' | 'Entregado' | 'Cancelado';
export const STATUSES: OrderStatus[] = ['Pagado', 'En confección', 'Enviado', 'Entregado', 'Cancelado'];
export const ITBMS = 0.07;

export interface OrderLine { productId: number; name: string; category: ProductCategory; unitPrice: number; quantity: number; size: string; }
export interface Order { id: string; date: string; customerId: number; lines: OrderLine[]; status: OrderStatus; }
export interface Customer { id: number; name: string; email: string; phone: string; city: string; }

export const orderSubtotal = (o: Order) => o.lines.reduce((s, l) => s + l.unitPrice * l.quantity, 0);
export const orderTotal = (o: Order) => Math.round(orderSubtotal(o) * (1 + ITBMS) * 100) / 100;

const KEY_ORDERS = 'dalla-admin-orders-v1';
const KEY_CUSTOMERS = 'dalla-admin-customers-v1';

const CAMISA: Omit<OrderLine, 'quantity' | 'size'> = { productId: 1, name: 'Camisa', category: 'Camisas', unitPrice: 28 };
const BLUSA: Omit<OrderLine, 'quantity' | 'size'> = { productId: 2, name: 'Blusa Épure', category: 'Blusas', unitPrice: 125 };
const NOCHE: Omit<OrderLine, 'quantity' | 'size'> = { productId: 3, name: 'Vestido Noche Royale', category: 'Vestidos de noche', unitPrice: 289 };
const XV: Omit<OrderLine, 'quantity' | 'size'> = { productId: 4, name: 'Vestido XV Aurora', category: 'Vestidos de XV', unitPrice: 450 };
const TIPICO: Omit<OrderLine, 'quantity' | 'size'> = { productId: 5, name: 'Traje Tipico', category: 'Trajes Panameños', unitPrice: 35 };
const line = (product: Omit<OrderLine, 'quantity' | 'size'>, quantity: number, size: string): OrderLine => ({ ...product, quantity, size });

const SEED_CUSTOMERS: Customer[] = [
  { id: 1, name: 'Cliente Demo Uno', email: 'cliente1@ejemplo.com', phone: '6000-0001', city: 'Ciudad de Panamá' },
  { id: 2, name: 'Cliente Demo Dos', email: 'cliente2@ejemplo.com', phone: '6000-0002', city: 'San Miguelito' },
  { id: 3, name: 'Cliente Demo Tres', email: 'cliente3@ejemplo.com', phone: '6000-0003', city: 'Colón' },
  { id: 4, name: 'Cliente Demo Cuatro', email: 'cliente4@ejemplo.com', phone: '6000-0004', city: 'David' },
  { id: 5, name: 'Cliente Demo Cinco', email: 'cliente5@ejemplo.com', phone: '6000-0005', city: 'Ciudad de Panamá' },
  { id: 6, name: 'Cliente Demo Seis', email: 'cliente6@ejemplo.com', phone: '6000-0006', city: 'Chitré' },
  { id: 7, name: 'Cliente Demo Siete', email: 'cliente7@ejemplo.com', phone: '6000-0007', city: 'Arraiján' },
  { id: 8, name: 'Cliente Demo Ocho', email: 'cliente8@ejemplo.com', phone: '6000-0008', city: 'La Chorrera' }
];

const SEED_ORDERS: Order[] = [
  { id: 'MD-0001', date: '2026-07-04', customerId: 1, lines: [line(NOCHE, 1, 'M')], status: 'Entregado' },
  { id: 'MD-0002', date: '2026-07-11', customerId: 2, lines: [line(CAMISA, 2, 'L'), line(BLUSA, 1, 'S')], status: 'Entregado' },
  { id: 'MD-0003', date: '2026-07-19', customerId: 3, lines: [line(XV, 1, 'S')], status: 'Entregado' },
  { id: 'MD-0004', date: '2026-07-27', customerId: 4, lines: [line(TIPICO, 1, 'M')], status: 'Entregado' },
  { id: 'MD-0005', date: '2026-08-03', customerId: 5, lines: [line(BLUSA, 2, 'M')], status: 'Entregado' },
  { id: 'MD-0006', date: '2026-08-12', customerId: 1, lines: [line(NOCHE, 1, 'M'), line(CAMISA, 1, 'M')], status: 'Entregado' },
  { id: 'MD-0007', date: '2026-08-21', customerId: 6, lines: [line(XV, 1, 'M')], status: 'Cancelado' },
  { id: 'MD-0008', date: '2026-08-29', customerId: 7, lines: [line(TIPICO, 2, 'S')], status: 'Entregado' },
  { id: 'MD-0009', date: '2026-09-05', customerId: 2, lines: [line(NOCHE, 1, 'S')], status: 'Entregado' },
  { id: 'MD-0010', date: '2026-09-14', customerId: 8, lines: [line(XV, 1, 'L'), line(BLUSA, 1, 'L')], status: 'Enviado' },
  { id: 'MD-0011', date: '2026-09-23', customerId: 3, lines: [line(CAMISA, 3, 'XL')], status: 'Entregado' },
  { id: 'MD-0012', date: '2026-10-02', customerId: 4, lines: [line(TIPICO, 1, 'L'), line(BLUSA, 1, 'M')], status: 'En confección' },
  { id: 'MD-0013', date: '2026-10-11', customerId: 5, lines: [line(NOCHE, 2, 'M')], status: 'En confección' },
  { id: 'MD-0014', date: '2026-10-20', customerId: 7, lines: [line(XV, 1, 'S')], status: 'En confección' },
  { id: 'MD-0015', date: '2026-10-28', customerId: 1, lines: [line(CAMISA, 1, 'M'), line(TIPICO, 1, 'M')], status: 'Pagado' },
  { id: 'MD-0016', date: '2026-11-02', customerId: 6, lines: [line(BLUSA, 1, 'S')], status: 'Pagado' }
];

@Injectable({ providedIn: 'root' })
export class AdminDataService {
  readonly orders = signal<Order[]>(this.load(KEY_ORDERS, SEED_ORDERS));
  readonly customers = signal<Customer[]>(this.load(KEY_CUSTOMERS, SEED_CUSTOMERS));

  constructor() {
    effect(() => this.save(KEY_ORDERS, this.orders()));
    effect(() => this.save(KEY_CUSTOMERS, this.customers()));
  }

  customer(id: number): Customer | undefined { return this.customers().find(c => c.id === id); }

  setStatus(id: string, status: OrderStatus): void {
    this.orders.update(list => list.map(o => (o.id === id ? { ...o, status } : o)));
  }

  registerOrder(customerId: number, lines: OrderLine[]): Order {
    const n = this.orders().length + 1;
    const order: Order = { id: 'MD-' + String(n).padStart(4, '0'), date: new Date().toISOString().slice(0, 10), customerId, lines, status: 'Pagado' };
    this.orders.update(list => [...list, order]);
    return order;
  }

  resetDemo(): void { this.orders.set(SEED_ORDERS); this.customers.set(SEED_CUSTOMERS); }

  private load<T>(key: string, fallback: T): T {
    try {
      if (typeof localStorage === 'undefined') return fallback;
      const raw = localStorage.getItem(key);
      return raw ? (JSON.parse(raw) as T) : fallback;
    } catch { return fallback; }
  }

  private save(key: string, value: unknown): void {
    try { if (typeof localStorage !== 'undefined') localStorage.setItem(key, JSON.stringify(value)); } catch { /* sin espacio o bloqueado */ }
  }
}
