import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', loadComponent: () => import('./features/home/home.component').then(m => m.HomeComponent) },
  { path: 'quienes-somos', loadComponent: () => import('./features/about.component').then(m => m.AboutComponent) },
  { path: 'catalogo', loadComponent: () => import('./features/catalog/catalog.component').then(m => m.CatalogComponent) },
  { path: 'atelier', loadComponent: () => import('./features/virtual-fitting/mannequin-probador.component').then(m => m.MannequinProbadorComponent) },
  { path: 'bolsa', loadComponent: () => import('./features/cart/cart.component').then(m => m.CartComponent) },
  { path: 'citas', loadComponent: () => import('./features/appointments/appointments.component').then(m => m.AppointmentsComponent) },
  { path: 'contacto', loadComponent: () => import('./features/contact/contact.component').then(m => m.ContactComponent) },
  { path: 'admin', loadComponent: () => import('./features/admin/admin.component').then(m => m.AdminComponent) },
  { path: '**', redirectTo: '' }
];
