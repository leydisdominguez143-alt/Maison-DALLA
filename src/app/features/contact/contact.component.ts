import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  standalone: true,
  selector: 'app-contact',
  imports: [RouterLink],
  template: `
    <section class="container contact">
      <span class="eyebrow">MAISON DALLA / CONTACTO</span><h1 class="page-heading">Hablemos de<br><em>lo extraordinario.</em></h1>
      <div class="contact-grid"><article class="panel"><span class="number">01</span><h2>Atelier privado</h2><p>Coordina una cita para conversar sobre una pieza a medida o una asesoría de estilo.</p><a routerLink="/citas">Reservar una cita ↗</a></article><article class="panel"><span class="number">02</span><h2>Atención al cliente</h2><p>Para consultas sobre catálogo, pedidos y disponibilidad, añade aquí los canales oficiales de Maison DALLA.</p><a href="mailto:hola@maisondalla.example">Correo de demostración ↗</a></article><article class="panel"><span class="number">03</span><h2>Privacidad</h2><p>Las medidas y preferencias deben gestionarse con acceso restringido y una política de privacidad publicada.</p><a href="#privacy">Leer nota de privacidad ↘</a></article></div>
      <div id="privacy" class="privacy"><span class="eyebrow">PRIVACIDAD Y DATOS</span><h2>Tu información, con cuidado.</h2><p>Esta plantilla no envía datos a un servidor ni implementa autenticación. Antes de producción, publica una política revisada legalmente, explica el uso de las medidas corporales, establece plazos de conservación y habilita solicitudes de acceso o eliminación de datos.</p></div>
    </section>
  `,
  styles: [`
    .contact{padding-block:75px 100px;min-height:75vh}.contact>.page-heading{margin-bottom:50px}.contact-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:18px}.contact-grid article{padding:28px;min-height:245px}.number{font:400 24px var(--font-editorial);color:var(--dalla-gold)}.contact-grid h2,.privacy h2{font:500 26px var(--font-editorial)}.contact-grid p,.privacy p{font-size:12px;line-height:1.9;color:var(--dalla-muted)}.contact-grid a{display:inline-block;margin-top:15px;font-size:11px;color:var(--dalla-gold-light)}.privacy{max-width:760px;margin-top:70px;padding-top:30px;border-top:1px solid var(--dalla-border)}
    @media(max-width:750px){.contact-grid{grid-template-columns:1fr}.contact-grid article{min-height:auto}}
  `]
})
export class ContactComponent {}
