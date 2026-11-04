import { AfterViewInit, Component, ElementRef, OnDestroy, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AccessibilityService } from '../core/services/accessibility.service';
import { I18nService, Lang } from '../core/services/i18n.service';

// ======================================================================
//  EQUIPO FUNDADOR: cambia aquí los nombres reales (2 mujeres y 2 hombres).
//  `f: true` = mujer ("Cofundadora"), `f: false` = hombre ("Cofundador").
// ======================================================================
const TEAM: { name: string; f: boolean }[] = [
  { name: 'Nombre Apellido', f: true },
  { name: 'Nombre Apellido', f: false },
  { name: 'Nombre Apellido', f: true },
  { name: 'Nombre Apellido', f: false }
];
const NUMERALS = ['I', 'II', 'III', 'IV'];

const IMG_HERO = 'assets/images/atelier-hero.png';
const IMG_STORY = 'assets/images/FONDO-PAREJA.png';

interface Copy {
  eyebrow: string; h1a: string; h1b: string; lead: string; ctaAtelier: string; ctaCatalog: string;
  facts: { n: string; l: string }[];
  frameTag: string;
  marquee: string[];
  storyEyebrow: string; storyTitleA: string; storyTitleB: string; storyP1: string; storyP2: string; quote: string;
  philEyebrow: string; philA: string; philB: string; philP: string;
  howEyebrow: string; howTitleA: string; howTitleB: string; steps: { t: string; d: string }[]; howCta: string;
  valuesEyebrow: string; valuesTitle: string; values: { t: string; d: string }[];
  teamEyebrow: string; teamTitleA: string; teamTitleB: string; teamP: string; roleF: string; roleM: string;
  ctaEyebrow: string; ctaA: string; ctaB: string; ctaBook: string; ctaTry: string;
}

export const COPY: Record<Lang, Copy> = {
  es: {
    eyebrow: 'El universo Maison DALLA', h1a: 'La elegancia', h1b: 'de ser tú.',
    lead: 'Creemos que el verdadero lujo empieza cuando una prenda refleja a la persona que la lleva. Diseñamos piezas que unen intención, oficio y expresión individual.',
    ctaAtelier: 'Descubre el atelier', ctaCatalog: 'Ver la colección',
    facts: [{ n: '4', l: 'fundadores' }, { n: '3D', l: 'probador a tu medida' }, { n: '3', l: 'idiomas' }],
    frameTag: 'Colección atelier',
    marquee: ['Diseño exclusivo', 'Confección a medida', 'Probador virtual 3D', 'Atención personal', 'Desde Panamá'],
    storyEyebrow: 'Nuestra historia', storyTitleA: 'Moda para cada cuerpo,', storyTitleB: 'pensada entre cuatro.',
    storyP1: 'Maison DALLA nace de cuatro emprendedores, dos mujeres y dos hombres, que se hicieron la misma pregunta: ¿por qué comprar ropa de diseñador por internet sigue siendo una apuesta?',
    storyP2: 'Nuestra respuesta es un probador virtual: escribes tus medidas, un maniquí digital se ajusta a ellas y ves cómo cae la prenda antes de decidir. Menos dudas, mejor ajuste y una experiencia pensada para el mercado local.',
    quote: 'Una prenda bien elegida no debería ser una apuesta.',
    philEyebrow: 'Nuestra filosofía', philA: 'Menos piezas.', philB: 'Más significado.',
    philP: 'Maison DALLA nace de la idea de que la moda puede ser íntima: una conversación entre tu estilo, la calidad de los materiales y el cuidado de la confección. Nuestro universo combina una colección seleccionada con la posibilidad de explorar diseños a medida.',
    howEyebrow: 'Cómo funciona', howTitleA: 'Tu pieza,', howTitleB: 'paso a paso.',
    steps: [
      { t: 'Ingresa tus medidas', d: 'Pecho, cintura, cadera y altura. El maniquí se ajusta a tu cuerpo en tiempo real.' },
      { t: 'Mira cómo te queda', d: 'Elige la prenda y la talla: ve si queda justa o holgada antes de comprar.' },
      { t: 'Elige y reserva', d: 'Súmala a tu bolsa o agenda una cita privada en el atelier.' }
    ],
    howCta: 'Probar a mi medida',
    valuesEyebrow: 'Lo que nos guía', valuesTitle: 'Cuatro ideas, una sola casa.',
    values: [
      { t: 'Diseño con intención', d: 'Siluetas elegantes, detalles cuidados y una estética que trasciende temporadas.' },
      { t: 'Personalización', d: 'Medidas y preferencias como punto de partida para conversar sobre tu pieza ideal.' },
      { t: 'Atención personal', d: 'Un proceso acompañado, desde la inspiración hasta la cita privada en el atelier.' },
      { t: 'Tecnología con propósito', d: 'El probador 3D existe para darte seguridad al elegir, no para impresionar.' }
    ],
    teamEyebrow: 'El equipo', teamTitleA: 'Las personas detrás de', teamTitleB: 'Maison DALLA.',
    teamP: 'Cuatro socios, un mismo criterio: que cada cliente se vea y se sienta bien.',
    roleF: 'Cofundadora', roleM: 'Cofundador',
    ctaEyebrow: 'Tu historia, tu estilo', ctaA: 'Una pieza hecha para', ctaB: 'acompañarte.',
    ctaBook: 'Reservar una cita privada', ctaTry: 'Probar a mi medida'
  },
  en: {
    eyebrow: 'The Maison DALLA universe', h1a: 'The elegance', h1b: 'of being you.',
    lead: 'We believe true luxury begins when a garment reflects the person wearing it. We design pieces that bring together intention, craft and individual expression.',
    ctaAtelier: 'Discover the atelier', ctaCatalog: 'View the collection',
    facts: [{ n: '4', l: 'founders' }, { n: '3D', l: 'made-to-measure fitting' }, { n: '3', l: 'languages' }],
    frameTag: 'Atelier collection',
    marquee: ['Exclusive design', 'Made to measure', '3D virtual fitting', 'Personal service', 'From Panama'],
    storyEyebrow: 'Our story', storyTitleA: 'Fashion for every body,', storyTitleB: 'shaped by four.',
    storyP1: 'Maison DALLA was born from four entrepreneurs, two women and two men, who asked themselves the same question: why is buying designer clothes online still a gamble?',
    storyP2: 'Our answer is a virtual fitting room: you enter your measurements, a digital mannequin adjusts to them and you see how the garment falls before deciding. Fewer doubts, a better fit and an experience designed for the local market.',
    quote: 'A well-chosen garment should never be a gamble.',
    philEyebrow: 'Our philosophy', philA: 'Fewer pieces.', philB: 'More meaning.',
    philP: 'Maison DALLA is built on the idea that fashion can be intimate: a conversation between your style, the quality of the materials and the care of the tailoring. Our universe combines a curated collection with the chance to explore made-to-measure designs.',
    howEyebrow: 'How it works', howTitleA: 'Your piece,', howTitleB: 'step by step.',
    steps: [
      { t: 'Enter your measurements', d: 'Bust, waist, hips and height. The mannequin adjusts to your body in real time.' },
      { t: 'See how it fits', d: 'Choose the garment and size: see whether it fits snugly or loosely before you buy.' },
      { t: 'Choose and book', d: 'Add it to your bag or book a private appointment at the atelier.' }
    ],
    howCta: 'Try it to my size',
    valuesEyebrow: 'What guides us', valuesTitle: 'Four ideas, one house.',
    values: [
      { t: 'Design with intent', d: 'Elegant silhouettes, careful details and an aesthetic that outlasts seasons.' },
      { t: 'Personalization', d: 'Measurements and preferences as the starting point to talk about your ideal piece.' },
      { t: 'Personal attention', d: 'A guided process, from inspiration to the private appointment at the atelier.' },
      { t: 'Technology with purpose', d: 'The 3D fitting room exists to give you confidence when choosing, not to impress.' }
    ],
    teamEyebrow: 'The team', teamTitleA: 'The people behind', teamTitleB: 'Maison DALLA.',
    teamP: 'Four partners, one standard: that every client looks and feels good.',
    roleF: 'Co-founder', roleM: 'Co-founder',
    ctaEyebrow: 'Your story, your style', ctaA: 'A piece made to', ctaB: 'stay with you.',
    ctaBook: 'Book a private appointment', ctaTry: 'Try it to my size'
  },
  pt: {
    eyebrow: 'O universo Maison DALLA', h1a: 'A elegância', h1b: 'de ser você.',
    lead: 'Acreditamos que o verdadeiro luxo começa quando uma peça reflete quem a veste. Criamos peças que unem intenção, ofício e expressão individual.',
    ctaAtelier: 'Descubra o ateliê', ctaCatalog: 'Ver a coleção',
    facts: [{ n: '4', l: 'fundadores' }, { n: '3D', l: 'provador sob medida' }, { n: '3', l: 'idiomas' }],
    frameTag: 'Coleção ateliê',
    marquee: ['Design exclusivo', 'Confecção sob medida', 'Provador virtual 3D', 'Atendimento pessoal', 'Do Panamá'],
    storyEyebrow: 'Nossa história', storyTitleA: 'Moda para cada corpo,', storyTitleB: 'pensada a quatro.',
    storyP1: 'A Maison DALLA nasce de quatro empreendedores, duas mulheres e dois homens, que se fizeram a mesma pergunta: por que comprar roupa de grife pela internet ainda é uma aposta?',
    storyP2: 'Nossa resposta é um provador virtual: você informa suas medidas, um manequim digital se ajusta a elas e você vê como a peça cai antes de decidir. Menos dúvidas, melhor caimento e uma experiência pensada para o mercado local.',
    quote: 'Uma peça bem escolhida não deveria ser uma aposta.',
    philEyebrow: 'Nossa filosofia', philA: 'Menos peças.', philB: 'Mais significado.',
    philP: 'A Maison DALLA parte da ideia de que a moda pode ser íntima: uma conversa entre o seu estilo, a qualidade dos materiais e o cuidado da confecção. Nosso universo une uma coleção selecionada à possibilidade de explorar criações sob medida.',
    howEyebrow: 'Como funciona', howTitleA: 'Sua peça,', howTitleB: 'passo a passo.',
    steps: [
      { t: 'Informe suas medidas', d: 'Busto, cintura, quadril e altura. O manequim se ajusta ao seu corpo em tempo real.' },
      { t: 'Veja como fica', d: 'Escolha a peça e o tamanho: veja se fica justa ou folgada antes de comprar.' },
      { t: 'Escolha e agende', d: 'Adicione à sacola ou agende um horário privado no ateliê.' }
    ],
    howCta: 'Provar na minha medida',
    valuesEyebrow: 'O que nos guia', valuesTitle: 'Quatro ideias, uma só casa.',
    values: [
      { t: 'Design com intenção', d: 'Silhuetas elegantes, detalhes cuidadosos e uma estética que atravessa estações.' },
      { t: 'Personalização', d: 'Medidas e preferências como ponto de partida para conversar sobre a sua peça ideal.' },
      { t: 'Atenção pessoal', d: 'Um processo acompanhado, da inspiração ao horário privado no ateliê.' },
      { t: 'Tecnologia com propósito', d: 'O provador 3D existe para dar segurança na escolha, não para impressionar.' }
    ],
    teamEyebrow: 'A equipe', teamTitleA: 'As pessoas por trás da', teamTitleB: 'Maison DALLA.',
    teamP: 'Quatro sócios, um mesmo critério: que cada cliente se veja e se sinta bem.',
    roleF: 'Cofundadora', roleM: 'Cofundador',
    ctaEyebrow: 'Sua história, seu estilo', ctaA: 'Uma peça feita para', ctaB: 'acompanhar você.',
    ctaBook: 'Agendar um horário privado', ctaTry: 'Provar na minha medida'
  }
};

// Iconos del paso a paso: cinta métrica, ojo y bolsa
const STEP_ICONS = [
  'M3 8h18v8H3zM7 8v3M11 8v4M15 8v3M19 8v4',                      // cinta métrica
  'M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12zM12 9.5a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5z', // ojo
  'M5 8h14l-1 12H6zM9 8a3 3 0 0 1 6 0'                            // bolsa
];

@Component({
  selector: 'app-about',
  standalone: true,
  imports: [RouterLink],
  template: `
    <div class="about">
      <!-- ============ PORTADA ============ -->
      <section class="hero contenedor" aria-labelledby="about-h1">
        <div class="hero-copy">
          <p class="eyebrow reveal" style="--d:0ms">{{ c().eyebrow }}</p>
          <h1 id="about-h1">
            <span class="line reveal" style="--d:120ms">{{ c().h1a }}</span>
            <em class="line reveal" style="--d:260ms">{{ c().h1b }}</em>
          </h1>
          <p class="lead reveal" style="--d:420ms">{{ c().lead }}</p>
          <div class="actions reveal" style="--d:560ms">
            <a class="button" routerLink="/atelier">{{ c().ctaAtelier }} <span aria-hidden="true">↗</span></a>
            <a class="button secondary" routerLink="/catalogo">{{ c().ctaCatalog }}</a>
          </div>
          <dl class="facts reveal" style="--d:700ms">
            @for (f of c().facts; track f.l) {
              <div><dt>{{ f.n }}</dt><dd>{{ f.l }}</dd></div>
            }
          </dl>
        </div>
        <figure class="frame hero-frame reveal" style="--d:300ms">
          <img [src]="imgHero" alt="" fetchpriority="high" width="1536" height="1024">
          <figcaption>{{ c().frameTag }}</figcaption>
        </figure>
      </section>

      <!-- ============ FRANJA EN MOVIMIENTO ============ -->
      <div class="marquee" aria-hidden="true">
        <div class="track">
          @for (r of [1, 2]; track r) {
            @for (m of c().marquee; track m) { <span>{{ m }}</span><i>✦</i> }
          }
        </div>
      </div>

      <!-- ============ HISTORIA ============ -->
      <section class="story contenedor" aria-labelledby="about-story">
        <figure class="frame story-frame rv">
          <img [src]="imgStory" alt="" loading="lazy" width="1672" height="941">
        </figure>
        <div class="story-copy rv" style="--d:150ms">
          <p class="eyebrow">{{ c().storyEyebrow }}</p>
          <h2 id="about-story" class="title">{{ c().storyTitleA }} <em>{{ c().storyTitleB }}</em></h2>
          <p>{{ c().storyP1 }}</p>
          <p>{{ c().storyP2 }}</p>
          <blockquote>{{ c().quote }}</blockquote>
        </div>
      </section>

      <!-- ============ FILOSOFÍA ============ -->
      <section class="manifesto rv" aria-labelledby="about-phil">
        <p class="eyebrow">{{ c().philEyebrow }}</p>
        <h2 id="about-phil" class="title big">{{ c().philA }}<br><em>{{ c().philB }}</em></h2>
        <p>{{ c().philP }}</p>
      </section>

      <!-- ============ CÓMO FUNCIONA ============ -->
      <section class="how" aria-labelledby="about-how">
        <div class="contenedor">
          <div class="head rv">
            <p class="eyebrow">{{ c().howEyebrow }}</p>
            <h2 id="about-how" class="title">{{ c().howTitleA }} <em>{{ c().howTitleB }}</em></h2>
          </div>
          <ol class="steps">
            @for (s of c().steps; track s.t; let i = $index) {
              <li class="step rv" [style.--d]="(i * 120) + 'ms'">
                <span class="num" aria-hidden="true">0{{ i + 1 }}</span>
                <svg class="ico" viewBox="0 0 24 24" aria-hidden="true"><path [attr.d]="icons[i]" /></svg>
                <h3>{{ s.t }}</h3>
                <p>{{ s.d }}</p>
              </li>
            }
          </ol>
          <div class="how-cta rv"><a class="button" routerLink="/atelier">{{ c().howCta }} <span aria-hidden="true">↗</span></a></div>
        </div>
      </section>

      <!-- ============ VALORES ============ -->
      <section class="values contenedor" aria-labelledby="about-values">
        <div class="head rv">
          <p class="eyebrow">{{ c().valuesEyebrow }}</p>
          <h2 id="about-values" class="title">{{ c().valuesTitle }}</h2>
        </div>
        <div class="grid">
          @for (v of c().values; track v.t; let i = $index) {
            <article class="value rv" [style.--d]="(i * 90) + 'ms'">
              <span class="n" aria-hidden="true">0{{ i + 1 }}</span>
              <h3>{{ v.t }}</h3>
              <p>{{ v.d }}</p>
            </article>
          }
        </div>
      </section>

      <!-- ============ EQUIPO ============ -->
      <section class="team contenedor" aria-labelledby="about-team">
        <div class="head rv">
          <p class="eyebrow">{{ c().teamEyebrow }}</p>
          <h2 id="about-team" class="title">{{ c().teamTitleA }} <em>{{ c().teamTitleB }}</em></h2>
          <p class="sub">{{ c().teamP }}</p>
        </div>
        <ul class="people">
          @for (p of team; track $index) {
            <li class="person rv" [style.--d]="($index * 90) + 'ms'">
              <span class="mono" aria-hidden="true">{{ numerals[$index] }}</span>
              <h3>{{ p.name }}</h3>
              <p>{{ p.f ? c().roleF : c().roleM }}</p>
            </li>
          }
        </ul>
      </section>

      <!-- ============ CIERRE ============ -->
      <section class="closing rv" aria-labelledby="about-cta">
        <p class="eyebrow">{{ c().ctaEyebrow }}</p>
        <h2 id="about-cta" class="title big">{{ c().ctaA }}<br><em>{{ c().ctaB }}</em></h2>
        <div class="actions">
          <a class="button" routerLink="/citas">{{ c().ctaBook }}</a>
          <a class="button secondary" routerLink="/atelier">{{ c().ctaTry }}</a>
        </div>
      </section>
    </div>
  `,
  styles: [`
    :host{display:block;--ease:cubic-bezier(.2,.7,.2,1)}
    .about{background:var(--bg,#05080d);color:var(--text,#f4efe6);overflow:hidden}
    .contenedor{width:100%;max-width:1480px;margin:0 auto;padding:0 clamp(20px,5vw,72px)}
    .eyebrow{margin:0 0 18px;font-size:11px;font-weight:600;letter-spacing:.24em;text-transform:uppercase;color:var(--gold,#d9b86a)}
    em{font-style:italic;font-weight:400;color:var(--gold,#d9b86a)}
    .title{margin:0 0 22px;font:400 clamp(34px,4.6vw,62px)/1.08 var(--font-editorial);letter-spacing:-.01em}
    .title.big{font-size:clamp(42px,6.4vw,92px)}
    p{line-height:1.8}

    /* aparición */
    .reveal{opacity:0;transform:translateY(20px);animation:rise .9s var(--ease) var(--d,0ms) both}
    @keyframes rise{to{opacity:1;transform:none}}
    .rv{opacity:0;transform:translateY(30px);transition:opacity .9s var(--ease),transform .9s var(--ease);transition-delay:var(--d,0ms)}
    .rv.in{opacity:1;transform:none}

    /* portada */
    .hero{display:grid;grid-template-columns:1.05fr .95fr;align-items:center;gap:clamp(28px,5vw,88px);min-height:min(88vh,800px);padding-top:clamp(40px,6vw,80px);padding-bottom:clamp(40px,6vw,80px);background:radial-gradient(ellipse at 78% 30%,var(--glow,#172131),transparent 62%)}
    .hero h1{margin:0 0 26px;font:400 clamp(54px,8.2vw,128px)/.98 var(--font-editorial);letter-spacing:-.02em}
    .hero h1 .line{display:block}
    .lead{max-width:500px;margin:0 0 32px;font-size:clamp(15px,1.3vw,18px);color:var(--text-2,#d6cfc3)}
    .actions{display:flex;flex-wrap:wrap;gap:14px}
    .facts{display:flex;flex-wrap:wrap;gap:clamp(24px,4vw,56px);margin:44px 0 0;padding-top:26px;border-top:1px solid var(--line,rgba(217,184,106,.28))}
    .facts div{display:grid;gap:2px}
    .facts dt{font:400 clamp(30px,3vw,44px)/1 var(--font-editorial);color:var(--gold,#d9b86a)}
    .facts dd{margin:0;font-size:12px;letter-spacing:.08em;text-transform:uppercase;color:var(--muted,#a9a194)}

    /* marcos de imagen */
    .frame{position:relative;margin:0}
    .frame img{display:block;width:100%;height:100%;object-fit:cover}
    .frame::before{content:"";position:absolute;inset:16px -16px -16px 16px;border:1px solid var(--line,rgba(217,184,106,.28));pointer-events:none;transition:inset .6s var(--ease)}
    .frame:hover::before{inset:10px -10px -10px 10px}
    .hero-frame{aspect-ratio:4/5;max-height:min(78vh,720px);justify-self:center;width:100%}
    .hero-frame img{object-position:50% 20%}
    .hero-frame figcaption{position:absolute;left:0;bottom:28px;padding:10px 18px;background:var(--gold,#d9b86a);color:var(--on-gold,#0a0e16);font-size:11px;font-weight:600;letter-spacing:.16em;text-transform:uppercase}

    /* franja */
    .marquee{overflow:hidden;border-block:1px solid var(--line,rgba(217,184,106,.28));padding:20px 0;background:var(--bg-2,#080c14)}
    .track{display:flex;width:max-content;gap:36px;white-space:nowrap;animation:scroll 38s linear infinite;font:italic 400 clamp(20px,2.2vw,30px) var(--font-editorial);color:var(--text-2,#d6cfc3)}
    .track i{font-style:normal;color:var(--gold,#d9b86a)}
    @keyframes scroll{to{transform:translateX(-50%)}}

    /* historia */
    .story{display:grid;grid-template-columns:1.1fr .9fr;align-items:center;gap:clamp(36px,6vw,110px);padding-top:clamp(70px,9vw,140px);padding-bottom:clamp(70px,9vw,140px)}
    .story-frame{aspect-ratio:4/3}
    .story-copy p{color:var(--text-2,#d6cfc3);margin:0 0 18px;max-width:520px}
    blockquote{margin:30px 0 0;padding:6px 0 6px 22px;border-left:2px solid var(--gold,#d9b86a);font:italic 400 clamp(22px,2.2vw,30px)/1.3 var(--font-editorial);color:var(--text,#f4efe6)}

    /* filosofía */
    .manifesto{max-width:980px;margin:0 auto;padding:clamp(40px,6vw,90px) 24px clamp(70px,9vw,130px);text-align:center}
    .manifesto p:last-child{max-width:640px;margin:0 auto;color:var(--text-2,#d6cfc3)}

    /* cómo funciona */
    .how{padding:clamp(70px,9vw,130px) 0;background:var(--surface,#0a1019);border-block:1px solid var(--line,rgba(217,184,106,.28))}
    .head{margin-bottom:clamp(30px,4vw,56px)}
    .head .sub{max-width:520px;color:var(--muted,#a9a194);margin:0}
    .steps{display:grid;grid-template-columns:repeat(3,1fr);gap:clamp(18px,2.4vw,36px);list-style:none;margin:0;padding:0}
    .step{position:relative;padding:34px 28px 32px;border:1px solid var(--line,rgba(217,184,106,.28));background:var(--bg,#05080d);transition:transform .5s var(--ease),border-color .5s,box-shadow .5s}
    .step:hover{transform:translateY(-6px);border-color:var(--gold,#d9b86a);box-shadow:0 22px 50px rgba(0,0,0,.25)}
    .step .num{position:absolute;top:20px;right:24px;font:italic 400 44px/1 var(--font-editorial);color:var(--gold,#d9b86a);opacity:.5}
    .ico{width:34px;height:34px;margin-bottom:22px;fill:none;stroke:var(--gold,#d9b86a);stroke-width:1.5;stroke-linecap:round;stroke-linejoin:round}
    .step h3{margin:0 0 10px;font:400 clamp(22px,2vw,28px)/1.15 var(--font-editorial)}
    .step p{margin:0;font-size:14px;color:var(--text-2,#d6cfc3)}
    .how-cta{margin-top:clamp(30px,4vw,54px);text-align:center}

    /* valores */
    .values{padding-top:clamp(70px,9vw,130px);padding-bottom:clamp(70px,9vw,130px)}
    .values .grid{display:grid;grid-template-columns:repeat(4,1fr);gap:clamp(14px,1.8vw,26px)}
    .value{padding:28px 24px 30px;border-top:1px solid var(--gold,#d9b86a);background:linear-gradient(160deg,var(--surface-2,#111925),var(--surface,#0a1019));transition:transform .5s var(--ease),background .5s}
    .value:hover{transform:translateY(-6px)}
    .value .n{display:block;margin-bottom:18px;font:italic 400 34px/1 var(--font-editorial);color:var(--gold,#d9b86a)}
    .value h3{margin:0 0 10px;font:400 clamp(21px,1.8vw,26px)/1.2 var(--font-editorial)}
    .value p{margin:0;font-size:14px;color:var(--text-2,#d6cfc3)}

    /* equipo */
    .team{padding-bottom:clamp(70px,9vw,130px)}
    .people{display:grid;grid-template-columns:repeat(4,1fr);gap:clamp(14px,1.8vw,26px);list-style:none;margin:0;padding:0}
    .person{display:grid;justify-items:center;gap:6px;padding:34px 20px 30px;text-align:center;border:1px solid var(--line,rgba(217,184,106,.28));transition:transform .5s var(--ease),border-color .5s}
    .person:hover{transform:translateY(-6px);border-color:var(--gold,#d9b86a)}
    .mono{display:grid;place-items:center;width:96px;height:96px;margin-bottom:14px;border:1px solid var(--gold,#d9b86a);border-radius:50%;font:italic 400 34px var(--font-editorial);color:var(--gold,#d9b86a);background:radial-gradient(circle,var(--glow,#172131),transparent 75%)}
    .person h3{margin:0;font:400 22px/1.2 var(--font-editorial)}
    .person p{margin:0;font-size:12px;letter-spacing:.16em;text-transform:uppercase;color:var(--muted,#a9a194)}

    /* cierre */
    .closing{padding:clamp(80px,10vw,150px) 24px;text-align:center;background:radial-gradient(ellipse at center,var(--glow,#172131),var(--bg,#05080d) 72%);border-top:1px solid var(--line,rgba(217,184,106,.28))}
    .closing .actions{justify-content:center;margin-top:34px}

    @media (max-width:1000px){
      .values .grid,.people{grid-template-columns:repeat(2,1fr)}
      .steps{grid-template-columns:1fr}
    }
    @media (max-width:820px){
      .hero,.story{grid-template-columns:1fr}
      .hero{min-height:0}
      .hero-frame{max-height:560px;aspect-ratio:4/4.4}
      .frame::before{inset:12px -8px -12px 12px}
    }
    @media (max-width:520px){
      .values .grid,.people{grid-template-columns:1fr}
      .facts{gap:22px}
    }
    @media (prefers-reduced-motion:reduce){
      .reveal,.rv{opacity:1;transform:none;animation:none;transition:none}
      .track{animation:none}
    }
  `]
})
export class AboutComponent implements AfterViewInit, OnDestroy {
  private readonly tr = inject(I18nService);
  private readonly a11y = inject(AccessibilityService);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private io?: IntersectionObserver;

  readonly c = computed(() => this.applyTextOverrides(COPY[this.tr.lang()]));
  readonly team = TEAM;
  readonly numerals = NUMERALS;
  readonly icons = STEP_ICONS;
  readonly imgHero = IMG_HERO;
  readonly imgStory = IMG_STORY;

  private applyTextOverrides(copy: Copy): Copy {
    const resolve = (value: unknown, path: string): unknown => {
      if (typeof value === 'string') return this.tr.text(`about.${path}`, this.tr.lang(), value);
      if (Array.isArray(value)) return value.map((item, index) => resolve(item, `${path}.${index}`));
      if (value && typeof value === 'object') {
        return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, resolve(item, path ? `${path}.${key}` : key)]));
      }
      return value;
    };
    return resolve(copy, '') as Copy;
  }

  ngAfterViewInit(): void {
    const els = this.host.nativeElement.querySelectorAll('.rv');
    const reduced = typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!('IntersectionObserver' in window) || reduced || this.a11y.s().motion) { els.forEach(e => e.classList.add('in')); return; }
    this.io = new IntersectionObserver(entries => entries.forEach(en => {
      if (en.isIntersecting) { en.target.classList.add('in'); this.io?.unobserve(en.target); }
    }), { threshold: 0.12 });
    els.forEach(e => this.io!.observe(e));
  }

  ngOnDestroy(): void { this.io?.disconnect(); }
}