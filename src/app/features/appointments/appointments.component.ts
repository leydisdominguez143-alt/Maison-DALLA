import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { I18nService } from '../../core/services/i18n.service';

@Component({
  standalone: true,
  selector: 'app-appointments',
  imports: [FormsModule],
  template: `
    <section class="container appointments">
      <div class="intro"><span class="eyebrow">{{ t('appointments.eyebrow') }}</span><h1 class="page-heading">{{ t('appointments.title.a') }}<br><em>{{ t('appointments.title.b') }}</em></h1><p class="muted">{{ t('appointments.intro') }}</p></div>
      <form class="panel booking" (ngSubmit)="submit()">
        <span class="eyebrow">{{ t('appointments.form') }}</span><h2>{{ t('appointments.prompt') }}</h2>
        <div class="form-grid"><div><label for="name">{{ t('appointments.name') }}</label><input id="name" name="name" [(ngModel)]="form.name" required></div><div><label for="email">{{ t('appointments.email') }}</label><input id="email" name="email" type="email" [(ngModel)]="form.email" required></div><div><label for="date">{{ t('appointments.date') }}</label><input id="date" name="date" type="date" [min]="today" [(ngModel)]="form.date" required></div><div><label for="type">{{ t('appointments.type') }}</label><select id="type" name="type" [(ngModel)]="form.type"><option value="tailoring">{{ t('appointments.option.tailoring') }}</option><option value="style">{{ t('appointments.option.style') }}</option><option value="collection">{{ t('appointments.option.collection') }}</option><option value="virtual">{{ t('appointments.option.virtual') }}</option></select></div><div class="full"><label for="details">{{ t('appointments.details') }}</label><textarea id="details" name="details" rows="4" [(ngModel)]="form.details" [placeholder]="t('appointments.placeholder')"></textarea></div></div>
        <button class="button" type="submit">{{ t('appointments.send') }}</button><p class="muted fine">{{ t('appointments.disclaimer') }}</p>
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
  private readonly tr = inject(I18nService);
  t = (key: string, vars?: Record<string, string | number>) => this.tr.t(key, vars);
  readonly today = new Date().toISOString().slice(0,10);
  readonly message = signal('');
  form = {name:'',email:'',date:'',type:'tailoring',details:''};
  submit():void { this.message.set(this.t('appointments.success', { name: this.form.name ? ', ' + this.form.name : '' })); }
}
