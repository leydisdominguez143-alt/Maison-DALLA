import { Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  standalone: true,
  selector: 'app-appointments',
  imports: [FormsModule],
  template: `
    <section class="container appointments">
      <div class="intro"><span class="eyebrow">UNA EXPERIENCIA PRIVADA</span><h1 class="page-heading">El atelier,<br><em>para ti.</em></h1><p class="muted">Reserva una conversación con nuestro equipo para explorar tejidos, siluetas y posibilidades de confección.</p></div>
      <form class="panel booking" (ngSubmit)="submit()">
        <span class="eyebrow">SOLICITUD DE CITA</span><h2>Cuéntanos qué imaginas.</h2>
        <div class="form-grid"><div><label for="name">Nombre completo</label><input id="name" name="name" [(ngModel)]="form.name" required></div><div><label for="email">Correo electrónico</label><input id="email" name="email" type="email" [(ngModel)]="form.email" required></div><div><label for="date">Fecha preferida</label><input id="date" name="date" type="date" [min]="today" [(ngModel)]="form.date" required></div><div><label for="type">Tipo de cita</label><select id="type" name="type" [(ngModel)]="form.type"><option>Confección a medida</option><option>Asesoría de estilo</option><option>Accesorios y colección</option><option>Consulta virtual</option></select></div><div class="full"><label for="details">¿Qué te gustaría crear?</label><textarea id="details" name="details" rows="4" [(ngModel)]="form.details" placeholder="Cuéntanos sobre la ocasión, el diseño o tus ideas..."></textarea></div></div>
        <button class="button" type="submit">Enviar solicitud ↗</button><p class="muted fine">Esta demo no envía datos a un servidor. Se necesita backend para confirmar y administrar citas.</p>
        @if(message()){<p class="success" role="status">{{message()}}</p>}
      </form>
    </section>
  `,
  styles: [`
    .appointments{min-height:75vh;padding-block:75px 100px;display:grid;grid-template-columns:.8fr 1.2fr;gap:7vw;align-items:start}.intro{position:sticky;top:125px}.intro .page-heading{font-size:clamp(50px,7vw,86px)}.intro>p{max-width:350px;font-size:13px;line-height:1.9}.booking{padding:32px}.booking h2{font:500 30px var(--font-editorial);margin:15px 0 28px}.form-grid{display:grid;grid-template-columns:1fr 1fr;gap:20px}.form-grid .full{grid-column:1/-1}textarea{resize:vertical}.booking>.button{margin-top:25px}.fine{font-size:10px;line-height:1.6;margin-top:18px}.success{color:var(--dalla-gold-light);font-size:12px;line-height:1.6}
    @media(max-width:750px){.appointments{grid-template-columns:1fr;gap:30px;padding-block:45px}.intro{position:static}.booking{padding:22px}}@media(max-width:500px){.form-grid{grid-template-columns:1fr}.form-grid .full{grid-column:auto}}
  `]
})
export class AppointmentsComponent {
  readonly today = new Date().toISOString().slice(0,10);
  readonly message = signal('');
  form = {name:'',email:'',date:'',type:'Confección a medida',details:''};
  submit():void { this.message.set(`Gracias${this.form.name ? ', '+this.form.name : ''}. La solicitud está validada en esta demo; todavía no se ha enviado al atelier.`); }
}
