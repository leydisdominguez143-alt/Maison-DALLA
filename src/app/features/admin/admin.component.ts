import { Component, HostListener, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Product, ProductCategory, ProductColor } from '../../core/models/product.model';
import { AdminDataService, Order, OrderStatus, STATUSES, orderTotal } from './admin-data.service';
import { ProductService } from '../../core/services/product.service';

type Section = 'dashboard' | 'productos' | 'ventas' | 'clientes' | 'reportes';
interface Draft { id: number | null; name: string; price: number; category: ProductCategory; image: string; description: string; madeToMeasure: boolean; featured: boolean; sizes: string[]; colors: ProductColor[]; }

// ---- ACCESO DE DEMOSTRACIÓN ------------------------------------------------------------------
// Esto NO es seguridad real: cualquiera con las herramientas del navegador puede saltárselo.
// La protección real (usuarios, contraseñas cifradas y roles) se hace en el servidor.
const DEMO_USER = 'admin';
const DEMO_PASS = 'dalla2026';
const SESSION_KEY = 'dalla-admin-session';

const NAV: { id: Section; label: string }[] = [
  { id: 'dashboard', label: 'Dashboard' }, { id: 'productos', label: 'Productos' }, { id: 'ventas', label: 'Ventas' },
  { id: 'clientes', label: 'Clientes' }, { id: 'reportes', label: 'Reportes' }
];
const CATEGORIES: ProductCategory[] = ['Vestidos de noche', 'Blusas', 'Vestidos de XV', 'Camisas', 'Trajes Panameños'];
const SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];
const NO_IMG = 'data:image/svg+xml;utf8,' + encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 250"><rect width="200" height="250" fill="#101827"/><path d="M100 95l35 40-35 40-35-40z" fill="none" stroke="#c9a24b" stroke-width="3"/></svg>');

@Component({
  standalone: true,
  selector: 'app-admin',
  imports: [FormsModule, RouterLink],
  template: `
    <div class="adm">
      @if (!logged()) {
        <!-- ================= ACCESO ================= -->
        <main class="login">
          <form class="login-card" (ngSubmit)="login()">
            <p class="brand-mini"><span>Maison</span> DALLA</p>
            <h1>Acceso al panel</h1>
            <p class="hint">Sistema de gestión comercial</p>
            <label for="u">Usuario</label>
            <input id="u" name="u" [(ngModel)]="loginUser" autocomplete="username" required>
            <label for="p">Contraseña</label>
            <input id="p" name="p" type="password" [(ngModel)]="loginPass" autocomplete="current-password" required>
            @if (loginError()) { <p class="err" role="alert">{{ loginError() }}</p> }
            <button class="btn primary block" type="submit">Entrar</button>
            <p class="demo-note">Acceso de demostración · usuario <b>admin</b> · contraseña <b>dalla2026</b>.<br>La protección real requiere un servidor.</p>
            <a class="back" routerLink="/">← Volver a la tienda</a>
          </form>
        </main>
      } @else {
        <header class="topbar">
          <div class="topbar-in">
            <a class="brand" routerLink="/" title="Ir a la tienda"><span class="m">Maison</span> DALLA <b>Admin</b></a>
            <nav aria-label="Secciones del panel">
              @for (n of nav; track n.id) {
                <button type="button" [class.on]="section() === n.id" [attr.aria-current]="section() === n.id ? 'page' : null" (click)="go(n.id)">{{ n.label }}</button>
              }
            </nav>
            <div class="user"><span>Hola, Administración</span><a routerLink="/" class="shop">Ver tienda</a><button type="button" class="btn primary sm" (click)="logout()">Salir</button></div>
          </div>
        </header>
        <p class="banner">Modo demostración · los productos, ventas y clientes se guardan en este navegador; todavía no se sincronizan con un servidor.</p>

        <main class="content" id="admin-main">
          @switch (section()) {
            @case ('dashboard') {
              <h1>Panel de control</h1>
              <p class="sub">Bienvenido al sistema de gestión comercial.</p>
              <div class="stats">
                <div class="stat gold"><span>Total ventas</span><strong>{{ money(revenue()) }}</strong></div>
                <div class="stat navy"><span>Pedidos procesados</span><strong>{{ activeOrders().length }} <small>pedidos</small></strong></div>
                <div class="stat green"><span>Productos en catálogo</span><strong>{{ products.products().length }} <small>uds.</small></strong></div>
                <div class="stat rose"><span>Clientes</span><strong>{{ data.customers().length }} <small>registrados</small></strong></div>
              </div>
              <div class="two">
                <section class="card">
                  <h2>Ventas por mes</h2>
                  <div class="bars" role="img" aria-label="Ventas por mes">
                    @for (m of byMonth(); track m.label) {
                      <div class="bar"><span class="v">{{ money(m.total) }}</span><div class="fill" [style.height.%]="m.pct"></div><span class="l">{{ m.label }}</span></div>
                    }
                  </div>
                </section>
                <section class="card">
                  <h2>Últimos pedidos</h2>
                  <div class="scroll"><table>
                    <thead><tr><th>Pedido</th><th>Cliente</th><th>Total</th><th>Estado</th></tr></thead>
                    <tbody>
                      @for (o of recent(); track o.id) {
                        <tr><td><b>{{ o.id }}</b></td><td>{{ customerName(o) }}</td><td class="num">{{ money(total(o)) }}</td><td><span class="pill" [attr.data-s]="o.status">{{ o.status }}</span></td></tr>
                      }
                    </tbody>
                  </table></div>
                </section>
              </div>
            }

            @case ('productos') {
              <div class="head">
                <div><h1>Productos</h1><p class="sub">{{ products.products().length }} piezas en el catálogo.</p></div>
                <button type="button" class="btn primary" (click)="openEditor(null)">＋ Nuevo producto</button>
              </div>
              <div class="tools">
                <input type="search" placeholder="Buscar por nombre…" aria-label="Buscar producto" [value]="pQuery()" (input)="pQuery.set(val($event))">
                <select aria-label="Filtrar por categoría" [value]="pCat()" (change)="pCat.set(val($event))">
                  <option value="">Todas las categorías</option>
                  @for (c of categories; track c) { <option [value]="c">{{ c }}</option> }
                </select>
              </div>
              @if (shownProducts().length) {
                <div class="pgrid">
                  @for (p of shownProducts(); track p.id) {
                    <article class="pcard">
                      <div class="pimg"><img [src]="p.image" [alt]="p.name" loading="lazy" (error)="imgError($event)"></div>
                      <div class="pbody">
                        <span class="tag">{{ p.category }}</span>
                        <h3>{{ p.name }}</h3>
                        <p class="price">{{ money(p.price) }}</p>
                        <p class="meta">{{ p.sizes.join(' · ') }}@if (p.madeToMeasure) { · A medida }</p>
                        <div class="actions">
                          <button type="button" class="btn ghost grow" (click)="openEditor(p)">Editar</button>
                          <button type="button" class="btn danger" [attr.aria-label]="'Eliminar ' + p.name" (click)="toDelete.set(p)">
                            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/></svg>
                          </button>
                        </div>
                      </div>
                    </article>
                  }
                </div>
              } @else { <p class="empty">No hay productos con ese filtro.</p> }
            }

            @case ('ventas') {
              <div class="head">
                <div><h1>Ventas</h1><p class="sub">Historial de pedidos y su estado.</p></div>
                <button type="button" class="btn ghost" (click)="exportSales()">Exportar CSV</button>
              </div>
              <div class="tools">
                <input type="search" placeholder="Buscar por pedido o cliente…" aria-label="Buscar venta" [value]="sQuery()" (input)="sQuery.set(val($event))">
                <select aria-label="Filtrar por estado" [value]="sStatus()" (change)="sStatus.set(val($event))">
                  <option value="">Todos los estados</option>
                  @for (s of statuses; track s) { <option [value]="s">{{ s }}</option> }
                </select>
              </div>
              <section class="card flush"><div class="scroll"><table>
                <thead><tr><th>Pedido</th><th>Fecha</th><th>Cliente</th><th>Detalle</th><th class="num">Total</th><th>Estado</th></tr></thead>
                <tbody>
                  @for (o of shownSales(); track o.id) {
                    <tr>
                      <td><b>{{ o.id }}</b></td><td>{{ fmtDate(o.date) }}</td><td>{{ customerName(o) }}</td>
                      <td class="detail">{{ detail(o) }}</td><td class="num"><b>{{ money(total(o)) }}</b></td>
                      <td><select class="status" [attr.data-s]="o.status" [attr.aria-label]="'Estado del pedido ' + o.id" [value]="o.status" (change)="setStatus(o, val($event))">
                        @for (s of statuses; track s) { <option [value]="s" [selected]="s === o.status">{{ s }}</option> }
                      </select></td>
                    </tr>
                  } @empty { <tr><td colspan="6" class="empty">No hay ventas con ese filtro.</td></tr> }
                </tbody>
              </table></div></section>
            }

            @case ('clientes') {
              <div class="head"><div><h1>Clientes</h1><p class="sub">{{ data.customers().length }} clientes registrados.</p></div></div>
              <div class="tools"><input type="search" placeholder="Buscar por nombre o correo…" aria-label="Buscar cliente" [value]="cQuery()" (input)="cQuery.set(val($event))"></div>
              <section class="card flush"><div class="scroll"><table>
                <thead><tr><th>Nombre</th><th>Correo</th><th>Teléfono</th><th>Ciudad</th><th class="num">Pedidos</th><th class="num">Total comprado</th></tr></thead>
                <tbody>
                  @for (c of shownCustomers(); track c.id) {
                    <tr><td><b>{{ c.name }}</b></td><td>{{ c.email }}</td><td>{{ c.phone }}</td><td>{{ c.city }}</td><td class="num">{{ c.orders }}</td><td class="num"><b>{{ money(c.spent) }}</b></td></tr>
                  } @empty { <tr><td colspan="6" class="empty">No hay clientes con ese filtro.</td></tr> }
                </tbody>
              </table></div></section>
            }

            @case ('reportes') {
              <h1>Reportes y estadísticas</h1>
              <p class="sub">Análisis de rendimiento comercial del sistema.</p>
              <div class="stats">
                <div class="stat gold"><span>Ingresos totales</span><strong>{{ money(revenue()) }}</strong></div>
                <div class="stat navy"><span>Órdenes procesadas</span><strong>{{ activeOrders().length }} <small>pedidos</small></strong></div>
                <div class="stat green"><span>Ticket promedio</span><strong>{{ money(avgTicket()) }}</strong></div>
                <div class="stat rose"><span>Producto top</span><strong class="small">{{ topProducts().length ? topProducts()[0].name : '—' }}</strong></div>
              </div>
              <div class="two">
                <section class="card">
                  <h2>Ventas por categoría</h2>
                  <ul class="hbars">
                    @for (c of byCategory(); track c.label) {
                      <li><div class="row"><span>{{ c.label }}</span><b>{{ money(c.total) }}</b></div><div class="track"><div class="fill" [style.width.%]="c.pct"></div></div></li>
                    }
                  </ul>
                </section>
                <section class="card">
                  <h2>Productos más vendidos</h2>
                  <div class="scroll"><table>
                    <thead><tr><th>Producto</th><th class="num">Unidades</th><th class="num">Ingresos</th></tr></thead>
                    <tbody>@for (p of topProducts(); track p.name) { <tr><td>{{ p.name }}</td><td class="num">{{ p.units }}</td><td class="num">{{ money(p.total) }}</td></tr> }</tbody>
                  </table></div>
                </section>
              </div>
              <section class="card">
                <h2>Pedidos por estado</h2>
                <div class="states">
                  @for (s of byStatus(); track s.label) { <div><span class="pill" [attr.data-s]="s.label">{{ s.label }}</span><strong>{{ s.count }}</strong></div> }
                </div>
              </section>
              <p class="reset"><button type="button" class="link" (click)="data.resetDemo()">Restablecer los datos de ejemplo</button></p>
            }
          }
        </main>

        <!-- ================= EDITOR DE PRODUCTO ================= -->
        @if (draft(); as d) {
          <div class="overlay" (click)="closeEditor()">
            <form class="modal" role="dialog" aria-modal="true" aria-labelledby="ed-t" (click)="$event.stopPropagation()" (ngSubmit)="saveDraft()">
              <h2 id="ed-t">{{ d.id ? 'Editar producto' : 'Nuevo producto' }}</h2>
              <div class="grid2">
                <div class="f"><label for="f-name">Nombre</label><input id="f-name" name="name" [(ngModel)]="d.name" required></div>
                <div class="f"><label for="f-price">Precio (B/.)</label><input id="f-price" name="price" type="number" min="0" step="0.01" [(ngModel)]="d.price" required></div>
                <div class="f"><label for="f-cat">Categoría</label><select id="f-cat" name="cat" [(ngModel)]="d.category">@for (c of categories; track c) { <option [value]="c">{{ c }}</option> }</select></div>
                <div class="f"><label for="f-img">Imagen (ruta o URL)</label><input id="f-img" name="img" [(ngModel)]="d.image" placeholder="assets/images/…"></div>
              </div>
              <div class="f"><label for="f-desc">Descripción</label><textarea id="f-desc" name="desc" rows="3" [(ngModel)]="d.description"></textarea></div>
              <fieldset class="f"><legend>Tallas disponibles</legend>
                <div class="chips">@for (s of sizes; track s) { <label class="chip" [class.on]="d.sizes.includes(s)"><input type="checkbox" [checked]="d.sizes.includes(s)" (change)="toggleSize(d, s)"> {{ s }}</label> }</div>
              </fieldset>
              <fieldset class="f"><legend>Colores</legend>
                @for (c of d.colors; track $index) {
                  <div class="colorrow">
                    <input type="color" [name]="'hex' + $index" [(ngModel)]="c.hex" [attr.aria-label]="'Color ' + ($index + 1)">
                    <input [name]="'cn' + $index" [(ngModel)]="c.name" placeholder="Nombre del color">
                    <button type="button" class="btn ghost sm" (click)="removeColor(d, $index)" [attr.aria-label]="'Quitar color ' + ($index + 1)">✕</button>
                  </div>
                }
                @if (d.colors.length < 6) { <button type="button" class="btn ghost sm" (click)="addColor(d)">＋ Agregar color</button> }
              </fieldset>
              <div class="checks">
                <label><input type="checkbox" name="mtm" [(ngModel)]="d.madeToMeasure"> Se confecciona a medida</label>
                <label><input type="checkbox" name="feat" [(ngModel)]="d.featured"> Destacado en la tienda</label>
              </div>
              @if (formError()) { <p class="err" role="alert">{{ formError() }}</p> }
              <div class="modal-actions"><button type="button" class="btn ghost" (click)="closeEditor()">Cancelar</button><button type="submit" class="btn primary">Guardar</button></div>
            </form>
          </div>
        }

        <!-- ================= CONFIRMAR ELIMINACIÓN ================= -->
        @if (toDelete(); as p) {
          <div class="overlay" (click)="toDelete.set(null)">
            <div class="modal small" role="alertdialog" aria-modal="true" aria-labelledby="del-t" (click)="$event.stopPropagation()">
              <h2 id="del-t">¿Eliminar este producto?</h2>
              <p><b>{{ p.name }}</b> dejará de aparecer en la tienda. Esta acción no se puede deshacer.</p>
              <div class="modal-actions"><button type="button" class="btn ghost" (click)="toDelete.set(null)">Cancelar</button><button type="button" class="btn dangerfill" (click)="confirmDelete()">Eliminar</button></div>
            </div>
          </div>
        }
        @if (toast()) { <div class="toast" role="status">{{ toast() }}</div> }
      }
    </div>
  `,
  styles: [`
    :host{display:block}
    .adm{--bg:#f5f3ee;--card:#fff;--ink:#101a2e;--muted:#6b7280;--line:#e6e1d6;--navy:#0b1322;--gold:#c9a24b;--gold-d:#9c7a2e;--green:#2f8f5b;--rose:#c2576f;--red:#c0392b;
      position:fixed;inset:0;z-index:2000;overflow:auto;background:var(--bg);color:var(--ink);font:14px/1.5 'Inter',system-ui,sans-serif}
    .adm *{box-sizing:border-box}
    h1{margin:0;font:700 clamp(22px,2.4vw,28px)/1.2 'Inter',system-ui,sans-serif;color:var(--ink)}
    h2{margin:0 0 14px;font:600 16px/1.3 'Inter',system-ui,sans-serif;color:var(--ink)}
    h3{margin:0;font:600 15px/1.3 'Inter',system-ui,sans-serif}
    .sub{margin:4px 0 22px;color:var(--muted);font-size:13px}
    button{font:inherit;cursor:pointer}
    :focus-visible{outline:2px solid var(--gold-d);outline-offset:2px}

    /* acceso */
    .login{min-height:100%;display:grid;place-items:center;padding:24px;background:radial-gradient(ellipse at 50% 0%,#17233a,var(--navy) 70%)}
    .login-card{width:min(400px,100%);padding:34px 30px;background:var(--card);border-radius:14px;box-shadow:0 30px 80px rgba(0,0,0,.4)}
    .brand-mini{margin:0 0 6px;font:600 13px 'Playfair Display',Georgia,serif;letter-spacing:.2em;text-transform:uppercase}.brand-mini span{color:var(--gold-d)}
    .login-card h1{margin-bottom:2px}.hint{margin:0 0 18px;color:var(--muted)}
    .login-card label{display:block;margin:12px 0 4px;font-size:12px;font-weight:600}
    .login-card input{width:100%;padding:11px 12px;border:1px solid var(--line);border-radius:8px;font:inherit;background:#fff;color:var(--ink)}
    .login-card .btn{margin-top:18px}
    .demo-note{margin:16px 0 0;padding:10px 12px;background:#faf3df;border:1px solid #ead9a3;border-radius:8px;font-size:12px;color:#6f5a1c}
    .back{display:block;margin-top:14px;text-align:center;color:var(--muted);font-size:12px;text-decoration:none}
    .err{margin:10px 0 0;color:var(--red);font-size:13px}

    /* barra superior */
    .topbar{position:sticky;top:0;z-index:5;background:var(--navy);color:#fff;border-bottom:1px solid #1d2a44}
    .topbar-in{display:flex;align-items:center;gap:26px;max-width:1400px;margin:0 auto;padding:0 24px;min-height:58px}
    .brand{color:#fff;text-decoration:none;font:600 15px 'Playfair Display',Georgia,serif;letter-spacing:.04em;white-space:nowrap}.brand .m{color:var(--gold)}.brand b{color:var(--gold);font-weight:700;font-family:'Inter',sans-serif;font-size:14px;margin-left:4px}
    nav{display:flex;gap:4px;margin-left:auto;overflow-x:auto}
    nav button{background:none;border:0;border-bottom:2px solid transparent;padding:19px 12px 17px;color:#aab4c8;font-size:13px;font-weight:500;white-space:nowrap}
    nav button:hover{color:#fff}nav button.on{color:#fff;border-bottom-color:var(--gold)}
    .user{display:flex;align-items:center;gap:14px;padding-left:18px;border-left:1px solid #26344f;font-size:12px;color:#aab4c8;white-space:nowrap}
    .user .shop{color:#aab4c8;text-decoration:none}.user .shop:hover{color:#fff}
    .banner{margin:0;padding:8px 24px;background:#faf3df;border-bottom:1px solid #ead9a3;color:#6f5a1c;font-size:12px;text-align:center}

    .content{max-width:1400px;margin:0 auto;padding:28px 24px 70px}
    .head{display:flex;flex-wrap:wrap;align-items:flex-start;justify-content:space-between;gap:12px}
    .head .sub{margin-bottom:16px}

    .btn{display:inline-flex;align-items:center;justify-content:center;gap:6px;padding:9px 16px;border-radius:8px;border:1px solid var(--line);background:#fff;color:var(--ink);font-weight:600;font-size:13px;transition:background .2s,border-color .2s,transform .2s}
    .btn:hover{border-color:#cfc8b8;transform:translateY(-1px)}
    .btn.primary{background:var(--gold);border-color:var(--gold);color:#1a1405}.btn.primary:hover{background:#d4ae56}
    .btn.ghost{background:#fff}.btn.sm{padding:6px 11px;font-size:12px}.btn.block{width:100%}.btn.grow{flex:1}
    .btn.danger{color:var(--red);border-color:#efc9c4;padding:9px 11px}.btn.danger:hover{background:#fdf1ef}
    .btn.dangerfill{background:var(--red);border-color:var(--red);color:#fff}
    .link{background:none;border:0;color:var(--muted);text-decoration:underline;font-size:12px}

    /* tarjetas de resumen */
    .stats{display:grid;grid-template-columns:repeat(4,1fr);gap:16px;margin-bottom:20px}
    .stat{padding:18px 20px 20px;background:var(--card);border:1px solid var(--line);border-top:3px solid var(--gold);border-radius:10px}
    .stat.navy{border-top-color:var(--navy)}.stat.green{border-top-color:var(--green)}.stat.rose{border-top-color:var(--rose)}
    .stat span{display:block;font-size:11px;font-weight:600;letter-spacing:.08em;text-transform:uppercase;color:var(--muted)}
    .stat strong{display:block;margin-top:8px;font:700 clamp(24px,2.4vw,32px)/1.1 'Inter',sans-serif;color:var(--ink)}
    .stat strong small{font-size:12px;font-weight:600;color:var(--muted)}.stat strong.small{font-size:17px;line-height:1.3}
    .card{padding:20px;background:var(--card);border:1px solid var(--line);border-radius:10px;margin-bottom:20px}
    .card.flush{padding:0;overflow:hidden}
    .two{display:grid;grid-template-columns:1fr 1fr;gap:20px}.two .card{margin-bottom:20px}

    /* gráficos */
    .bars{display:flex;align-items:flex-end;gap:14px;height:210px;padding-top:24px}
    .bar{flex:1;display:flex;flex-direction:column;align-items:center;justify-content:flex-end;height:100%;min-width:0}
    .bar .fill{width:100%;max-width:56px;min-height:4px;background:linear-gradient(180deg,var(--gold),#a98530);border-radius:5px 5px 0 0;transition:height .6s}
    .bar .v{margin-bottom:5px;font-size:11px;font-weight:600;white-space:nowrap}.bar .l{margin-top:7px;font-size:12px;color:var(--muted);text-transform:capitalize}
    .hbars{list-style:none;margin:0;padding:0;display:grid;gap:14px}
    .hbars .row{display:flex;justify-content:space-between;gap:10px;margin-bottom:5px;font-size:13px}
    .hbars .track{height:8px;background:#efebe0;border-radius:99px;overflow:hidden}.hbars .fill{height:100%;background:var(--gold);border-radius:99px}
    .states{display:flex;flex-wrap:wrap;gap:30px}.states div{display:flex;align-items:center;gap:10px}.states strong{font-size:22px}

    /* tablas */
    .scroll{overflow-x:auto}
    table{width:100%;border-collapse:collapse;font-size:13px}
    thead th{padding:11px 16px;background:var(--navy);color:#fff;font-size:11px;font-weight:600;letter-spacing:.08em;text-align:left;text-transform:uppercase;white-space:nowrap}
    tbody td{padding:12px 16px;border-top:1px solid var(--line);vertical-align:middle}
    tbody tr:nth-child(even){background:#faf8f3}tbody tr:hover{background:#f4f0e4}
    .card:not(.flush) table thead th{background:#f3efe4;color:var(--muted)}
    .num{text-align:right;font-variant-numeric:tabular-nums}.detail{max-width:320px;color:var(--muted)}
    .empty{padding:36px;text-align:center;color:var(--muted)}
    .pill{display:inline-block;padding:3px 10px;border-radius:99px;font-size:11px;font-weight:600;background:#eceff4;color:#3d4a63}
    [data-s='Entregado']{background:#e2f3ea;color:#1f6b43}[data-s='Enviado']{background:#e3eefb;color:#25598f}
    [data-s='En confección']{background:#faf0d6;color:#7d5f12}[data-s='Pagado']{background:#ece7f6;color:#55408a}[data-s='Cancelado']{background:#fbe6e3;color:#9a2f22}
    select.status{padding:5px 8px;border:0;border-radius:99px;font-size:12px;font-weight:600}

    .tools{display:flex;flex-wrap:wrap;gap:10px;margin-bottom:16px}
    .tools input,.tools select{padding:9px 12px;border:1px solid var(--line);border-radius:8px;background:#fff;color:var(--ink);font:inherit;min-width:220px}
    .tools input{flex:1;max-width:380px}

    /* productos */
    .pgrid{display:grid;grid-template-columns:repeat(auto-fill,minmax(210px,1fr));gap:18px}
    .pcard{background:var(--card);border:1px solid var(--line);border-radius:12px;overflow:hidden;display:flex;flex-direction:column;transition:box-shadow .25s,transform .25s}
    .pcard:hover{box-shadow:0 14px 34px rgba(16,26,46,.12);transform:translateY(-3px)}
    .pimg{aspect-ratio:4/5;background:#101827;overflow:hidden}.pimg img{width:100%;height:100%;object-fit:cover;object-position:50% 20%;display:block}
    .pbody{padding:14px 14px 16px;display:flex;flex-direction:column;gap:3px;flex:1}
    .tag{font-size:10px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:var(--gold-d)}
    .price{margin:2px 0 0;font:700 18px 'Inter',sans-serif}.meta{margin:0 0 10px;font-size:12px;color:var(--muted)}
    .actions{display:flex;gap:8px;margin-top:auto}

    /* ventanas */
    .overlay{position:fixed;inset:0;z-index:30;display:grid;place-items:center;padding:16px;background:rgba(8,12,22,.6);overflow:auto}
    .modal{width:min(640px,100%);max-height:calc(100vh - 32px);overflow:auto;padding:26px;background:#fff;border-radius:14px;box-shadow:0 30px 80px rgba(0,0,0,.4)}
    .modal.small{width:min(420px,100%)}.modal.small p{color:var(--muted);margin:0 0 4px}
    .modal-actions{display:flex;justify-content:flex-end;gap:10px;margin-top:20px}
    .grid2{display:grid;grid-template-columns:1fr 1fr;gap:14px}
    .f{margin-bottom:14px;border:0;padding:0;min-width:0}.f label,.f legend{display:block;margin-bottom:5px;padding:0;font-size:12px;font-weight:600}
    .f input:not([type=checkbox]):not([type=color]),.f select,.f textarea{width:100%;padding:10px 12px;border:1px solid var(--line);border-radius:8px;font:inherit;background:#fff;color:var(--ink)}
    .chips{display:flex;flex-wrap:wrap;gap:8px}.chip{display:inline-flex;align-items:center;gap:6px;padding:6px 12px;border:1px solid var(--line);border-radius:99px;font-size:12px;font-weight:600;cursor:pointer;margin:0!important}
    .chip.on{background:#faf3df;border-color:var(--gold);color:#6f5a1c}.chip input{accent-color:var(--gold-d)}
    .colorrow{display:flex;gap:8px;margin-bottom:8px}.colorrow input[type=color]{width:44px;height:40px;padding:2px;border:1px solid var(--line);border-radius:8px;background:#fff}
    .colorrow input:not([type=color]){flex:1;padding:9px 12px;border:1px solid var(--line);border-radius:8px;font:inherit}
    .checks{display:flex;flex-wrap:wrap;gap:20px;font-size:13px}.checks label{display:flex;gap:8px;align-items:center}.checks input{accent-color:var(--gold-d)}
    .toast{position:fixed;left:50%;bottom:26px;transform:translateX(-50%);z-index:40;padding:11px 20px;background:var(--navy);color:#fff;border-left:3px solid var(--gold);border-radius:8px;font-size:13px;box-shadow:0 12px 30px rgba(0,0,0,.3)}
    .reset{text-align:center;margin:10px 0 0}

    @media(max-width:1000px){.stats{grid-template-columns:repeat(2,minmax(0,1fr))}.two{grid-template-columns:minmax(0,1fr)}}
    @media(max-width:760px){
      .topbar-in{flex-wrap:wrap;gap:0 14px;padding:8px 16px 0}
      .brand{order:1;padding:10px 0}.user{order:2;margin-left:auto;border:0;padding:0}.user .shop,.user span{display:none}
      nav{order:3;display:grid;grid-template-columns:repeat(3,minmax(0,1fr));width:100%;min-width:0;margin:0;overflow:visible}
      nav button{padding:12px 6px;white-space:normal}
      .content{padding:22px 16px 60px}.grid2{grid-template-columns:1fr}
    }
    @media(max-width:480px){
      .stats{grid-template-columns:minmax(0,1fr)}
      .two,.two>.card{min-width:0}
      .card{padding:16px}
      .bars{gap:clamp(4px,2vw,10px)}
      .bar .v{font-size:clamp(8px,2.5vw,10px);white-space:normal;text-align:center;overflow-wrap:anywhere}
      .pgrid{grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}
      .tools input,.tools select{min-width:0;width:100%;max-width:none}
    }
  `]
})
export class AdminComponent {
  readonly products = inject(ProductService);
  readonly data = inject(AdminDataService);

  readonly nav = NAV;
  readonly categories = CATEGORIES;
  readonly sizes = SIZES;
  readonly statuses = STATUSES;

  readonly logged = signal(this.readSession());
  readonly section = signal<Section>('dashboard');
  loginUser = '';
  loginPass = '';
  readonly loginError = signal('');

  readonly pQuery = signal('');
  readonly pCat = signal('');
  readonly sQuery = signal('');
  readonly sStatus = signal('');
  readonly cQuery = signal('');

  readonly draft = signal<Draft | null>(null);
  readonly toDelete = signal<Product | null>(null);
  readonly formError = signal('');
  readonly toast = signal('');
  private toastTimer?: ReturnType<typeof setTimeout>;

  // ---- datos calculados ----
  readonly activeOrders = computed(() => this.data.orders().filter(o => o.status !== 'Cancelado'));
  readonly revenue = computed(() => this.activeOrders().reduce((s, o) => s + orderTotal(o), 0));
  readonly avgTicket = computed(() => (this.activeOrders().length ? this.revenue() / this.activeOrders().length : 0));
  readonly recent = computed(() => [...this.data.orders()].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 6));

  readonly byMonth = computed(() => {
    const m = new Map<string, number>();
    for (const o of this.activeOrders()) m.set(o.date.slice(0, 7), (m.get(o.date.slice(0, 7)) ?? 0) + orderTotal(o));
    const keys = [...m.keys()].sort().slice(-6);
    const max = Math.max(1, ...keys.map(k => m.get(k)!));
    return keys.map(k => ({ label: new Date(k + '-01T00:00:00').toLocaleDateString('es', { month: 'short' }).replace('.', ''), total: m.get(k)!, pct: Math.max(4, (m.get(k)! / max) * 100) }));
  });
  readonly byCategory = computed(() => {
    const m = new Map<string, number>();
    for (const o of this.activeOrders()) for (const l of o.lines) m.set(l.category, (m.get(l.category) ?? 0) + l.unitPrice * l.quantity * 1.07);
    const rows = [...m.entries()].map(([label, total]) => ({ label, total })).sort((a, b) => b.total - a.total);
    const max = Math.max(1, ...rows.map(r => r.total));
    return rows.map(r => ({ ...r, pct: (r.total / max) * 100 }));
  });
  readonly topProducts = computed(() => {
    const m = new Map<string, { units: number; total: number }>();
    for (const o of this.activeOrders()) for (const l of o.lines) {
      const cur = m.get(l.name) ?? { units: 0, total: 0 };
      m.set(l.name, { units: cur.units + l.quantity, total: cur.total + l.unitPrice * l.quantity * 1.07 });
    }
    return [...m.entries()].map(([name, v]) => ({ name, ...v })).sort((a, b) => b.units - a.units || b.total - a.total).slice(0, 5);
  });
  readonly byStatus = computed(() => this.statuses.map(label => ({ label, count: this.data.orders().filter(o => o.status === label).length })));

  readonly shownProducts = computed(() => {
    const q = this.pQuery().trim().toLowerCase(), c = this.pCat();
    return this.products.products().filter(p => (!c || p.category === c) && (!q || p.name.toLowerCase().includes(q)));
  });
  readonly shownSales = computed(() => {
    const q = this.sQuery().trim().toLowerCase(), s = this.sStatus();
    return [...this.data.orders()].sort((a, b) => b.date.localeCompare(a.date))
      .filter(o => (!s || o.status === s) && (!q || o.id.toLowerCase().includes(q) || this.customerName(o).toLowerCase().includes(q)));
  });
  readonly shownCustomers = computed(() => {
    const q = this.cQuery().trim().toLowerCase();
    return this.data.customers()
      .map(c => {
        const mine = this.activeOrders().filter(o => o.customerId === c.id);
        return { ...c, orders: mine.length, spent: mine.reduce((s, o) => s + orderTotal(o), 0) };
      })
      .filter(c => !q || c.name.toLowerCase().includes(q) || c.email.toLowerCase().includes(q));
  });

  // ---- utilidades de la plantilla ----
  money(n: number): string { return 'B/. ' + n.toLocaleString('es-PA', { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }
  fmtDate(iso: string): string { return new Date(iso + 'T00:00:00').toLocaleDateString('es-PA', { day: '2-digit', month: 'short', year: 'numeric' }); }
  total(o: Order): number { return orderTotal(o); }
  customerName(o: Order): string { return this.data.customer(o.customerId)?.name ?? 'Cliente eliminado'; }
  detail(o: Order): string { const [first, ...rest] = o.lines; return `${first.quantity}× ${first.name}${rest.length ? ` y ${rest.length} más` : ''}`; }
  val(e: Event): string { return (e.target as HTMLInputElement | HTMLSelectElement).value; }
  imgError(e: Event): void { const i = e.target as HTMLImageElement; if (i.src !== NO_IMG) i.src = NO_IMG; }
  go(s: Section): void { this.section.set(s); }

  // ---- acceso (demostración) ----
  login(): void {
    if (this.loginUser.trim() === DEMO_USER && this.loginPass === DEMO_PASS) {
      try { sessionStorage.setItem(SESSION_KEY, '1'); } catch { /* sin almacenamiento */ }
      this.loginError.set(''); this.loginPass = ''; this.logged.set(true);
    } else { this.loginError.set('Usuario o contraseña incorrectos.'); }
  }
  logout(): void { try { sessionStorage.removeItem(SESSION_KEY); } catch { /* nada */ } this.logged.set(false); this.section.set('dashboard'); }
  private readSession(): boolean { try { return typeof sessionStorage !== 'undefined' && sessionStorage.getItem(SESSION_KEY) === '1'; } catch { return false; } }

  // ---- productos ----
  openEditor(p: Product | null): void {
    this.formError.set('');
    this.draft.set(p
      ? { id: p.id, name: p.name, price: p.price, category: p.category, image: p.image, description: p.description, madeToMeasure: p.madeToMeasure, featured: !!p.featured, sizes: [...p.sizes], colors: p.colors.map(c => ({ ...c })) }
      : { id: null, name: '', price: 0, category: 'Vestidos de noche', image: '', description: '', madeToMeasure: true, featured: false, sizes: ['S', 'M', 'L'], colors: [{ name: 'Negro', hex: '#101018' }] });
  }
  closeEditor(): void { this.draft.set(null); this.formError.set(''); }
  toggleSize(d: Draft, s: string): void { d.sizes = d.sizes.includes(s) ? d.sizes.filter(x => x !== s) : SIZES.filter(x => x === s || d.sizes.includes(x)); }
  addColor(d: Draft): void { d.colors = [...d.colors, { name: '', hex: '#c9a24b' }]; }
  removeColor(d: Draft, i: number): void { d.colors = d.colors.filter((_, k) => k !== i); }
  saveDraft(): void {
    const d = this.draft(); if (!d) return;
    const name = d.name.trim(), price = Number(d.price);
    if (!name) { this.formError.set('El nombre es obligatorio.'); return; }
    if (!Number.isFinite(price) || price < 0) { this.formError.set('Escribe un precio válido (0 o más).'); return; }
    if (!d.sizes.length) { this.formError.set('Elige al menos una talla.'); return; }
    const id = d.id ?? Math.max(0, ...this.products.products().map(p => p.id)) + 1;
    const colors = d.colors.filter(c => c.name.trim()).map(c => ({ name: c.name.trim(), hex: c.hex }));
    this.products.save({ id, name, price, category: d.category, image: d.image.trim(), description: d.description.trim(), madeToMeasure: d.madeToMeasure, featured: d.featured, sizes: d.sizes, colors: colors.length ? colors : [{ name: 'Negro', hex: '#101018' }] });
    this.notify(d.id ? 'Producto actualizado.' : 'Producto creado.');
    this.closeEditor();
  }
  confirmDelete(): void { const p = this.toDelete(); if (!p) return; this.products.delete(p.id); this.toDelete.set(null); this.notify('Producto eliminado.'); }

  // ---- ventas ----
  setStatus(o: Order, value: string): void { this.data.setStatus(o.id, value as OrderStatus); this.notify(`Pedido ${o.id}: ${value}.`); }
  exportSales(): void {
    const esc = (v: string | number) => `"${String(v).replace(/"/g, '""')}"`;
    const rows = [['Pedido', 'Fecha', 'Cliente', 'Detalle', 'Total (B/.)', 'Estado'], ...this.shownSales().map(o => [o.id, o.date, this.customerName(o), o.lines.map(l => `${l.quantity}x ${l.name} (${l.size})`).join(' | '), orderTotal(o).toFixed(2), o.status])];
    const blob = new Blob(['\uFEFF' + rows.map(r => r.map(esc).join(',')).join('\n')], { type: 'text/csv;charset=utf-8' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'ventas-maison-dalla.csv'; a.click(); URL.revokeObjectURL(a.href);
  }

  private notify(msg: string): void { this.toast.set(msg); clearTimeout(this.toastTimer); this.toastTimer = setTimeout(() => this.toast.set(''), 2600); }

  @HostListener('document:keydown.escape')
  onEsc(): void { if (this.toDelete()) this.toDelete.set(null); else if (this.draft()) this.closeEditor(); }
}