import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-about',
  standalone: true,
  imports: [RouterLink],
  template: `
    <main class="about-page">
      <section class="about-hero">
        <div class="about-copy">
          <span class="eyebrow">EL UNIVERSO MAISON DALLA</span>
          <h1>La elegancia<br><em>de ser tú.</em></h1>
          <p>Creemos que el verdadero lujo empieza cuando una prenda refleja a la persona que la lleva. Diseñamos piezas que unen intención, oficio y expresión individual.</p>
          <a class="button" routerLink="/atelier">Descubre el atelier ↗</a>
        </div>
        <div class="about-image" role="img" aria-label="Editorial de moda en un atelier elegante"></div>
      </section>
      <section class="manifesto">
        <span class="eyebrow">NUESTRA FILOSOFÍA</span>
        <h2>Menos piezas. <em>Más significado.</em></h2>
        <p>Maison DALLA nace de la idea de que la moda puede ser íntima: una conversación entre tu estilo, la calidad de los materiales y el cuidado de la confección. Nuestro universo combina una colección seleccionada con la posibilidad de explorar diseños a medida.</p>
      </section>
      <section class="values">
        <article><span>01</span><h3>Diseño con intención</h3><p>Siluetas elegantes, detalles cuidados y una estética que trasciende temporadas.</p></article>
        <article><span>02</span><h3>Personalización</h3><p>Medidas y preferencias como punto de partida para conversar sobre tu pieza ideal.</p></article>
        <article><span>03</span><h3>Atención personal</h3><p>Un proceso acompañado, desde la inspiración hasta la cita privada en el atelier.</p></article>
      </section>
      <section class="about-cta"><span class="eyebrow">TU HISTORIA, TU ESTILO</span><h2>Una pieza hecha para<br><em>acompañarte.</em></h2><a class="button" routerLink="/citas">Reservar una cita privada</a></section>
    </main>
  `,
  styles: [`
    .about-page{background:#080c14;color:#fbf9f5}.about-hero{min-height:590px;display:grid;grid-template-columns:.85fr 1.15fr;align-items:center;gap:5vw;padding:70px 7vw;background:radial-gradient(ellipse at 75% 35%,#192337,#080c14 65%)}.about-copy{max-width:500px;position:relative;z-index:1}.eyebrow{font-size:10px;letter-spacing:.22em;color:#f0d28a}.about-copy h1{font:400 clamp(52px,7vw,92px)/1.02 var(--font-editorial);margin:24px 0}.about-copy h1 em,.manifesto h2 em,.about-cta h2 em{color:#f0d28a;font-weight:400}.about-copy p,.manifesto p{max-width:500px;color:#c5beb2;font-size:13px;line-height:2;margin-bottom:28px}.about-image{height:min(68vh,660px);min-height:430px;background:linear-gradient(0deg,#080c1440,#080c1400),url('/assets/images/atelier-hero.png') center/cover;border:1px solid #d4af3733}.manifesto{max-width:850px;margin:auto;padding:100px 28px;text-align:center}.manifesto h2,.about-cta h2{font:400 clamp(36px,5vw,62px)/1.1 var(--font-editorial);margin:22px 0}.manifesto p{margin:0 auto}.values{display:grid;grid-template-columns:repeat(3,1fr);gap:24px;padding:45px 7vw 100px}.values article{padding:28px;border-top:1px solid #d4af3755;background:linear-gradient(145deg,#111827,#080c14)}.values article span{color:#f0d28a;font:italic 32px var(--font-editorial)}.values h3{font:400 24px var(--font-editorial)}.values p{font-size:12px;line-height:1.8;color:#bcb5aa}.about-cta{text-align:center;padding:80px 20px 100px;background:radial-gradient(ellipse at center,#192337,#080c14 70%)}@media(max-width:760px){.about-hero{grid-template-columns:1fr;padding:50px 24px}.about-image{min-height:360px;height:55vh}.values{grid-template-columns:1fr;padding:25px 24px 65px}}
  `]
})
export class AboutComponent {}
