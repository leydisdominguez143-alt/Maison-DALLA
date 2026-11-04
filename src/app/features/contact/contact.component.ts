import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { I18nService } from '../../core/services/i18n.service';

@Component({
  standalone: true,
  selector: 'app-contact',
  imports: [RouterLink],
  template: `
    <section class="contact">
      <div class="contact-hero">
        <div class="contact-copy">
          <span class="eyebrow">{{ t('contact.eyebrow') }}</span>
          <h1>{{ t('contact.title.a') }}<br><em>{{ t('contact.title.b') }}</em></h1>
          <p>{{ t('contact.intro') }}</p>
        </div>
        <div class="hero-mark" aria-hidden="true"><span>M</span><i>D</i></div>
        <span class="hero-caption">{{ t('footer.tag') }}</span>
      </div>

      <div class="contact-content container">
        <div class="section-heading">
          <span class="eyebrow">{{ t('contact.options') }}</span>
          <p>{{ t('contact.response') }}</p>
        </div>

        <div class="contact-grid">
          <article class="contact-card appointment-card">
            <div class="card-top"><span class="number">01</span><span class="card-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24"><rect x="3.5" y="5" width="17" height="15" rx="1"/><path d="M7.5 3v4M16.5 3v4M4 9.5h16M8 13h3"/></svg>
            </span></div>
            <h2>{{ t('contact.private') }}</h2>
            <p>{{ t('contact.private.text') }}</p>
            <a class="contact-link" routerLink="/citas">{{ t('contact.book') }} <span aria-hidden="true">↗</span></a>
          </article>

          <article class="contact-card support-card">
            <div class="card-top"><span class="number">02</span><span class="card-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24"><path d="M4 5.5h16v13H4zM4.5 7l7.5 6 7.5-6"/></svg>
            </span></div>
            <h2>{{ t('contact.support') }}</h2>
            <p>{{ t('contact.support.text') }}</p>
            <div class="contact-methods">
              <a href="mailto:maisondallapty@gmail.com"><span>{{ t('contact.email.label') }}</span><strong>maisondallapty&#64;gmail.com</strong></a>
              <a href="tel:+50767870522"><span>{{ t('contact.phone.label') }}</span><strong>+507 6787-0522</strong></a>
              <a href="https://wa.me/50767870522" target="_blank" rel="noopener noreferrer"><span>{{ t('contact.whatsapp.label') }}</span><strong>+507 6787-0522 ↗</strong></a>
              <a href="https://www.instagram.com/maison_dallapty/" target="_blank" rel="noopener noreferrer"><span>{{ t('contact.instagram.label') }}</span><strong>&#64;maison_dallapty ↗</strong></a>
            </div>
          </article>
        </div>

        <a class="privacy-card" href="#privacy">
          <span class="privacy-icon" aria-hidden="true">✳</span>
          <span><strong>{{ t('contact.privacy') }}</strong><small>{{ t('contact.privacy.text') }}</small></span>
          <span class="privacy-arrow" aria-hidden="true">↘</span>
        </a>

        <div id="privacy" class="privacy">
          <span class="eyebrow">{{ t('contact.data') }}</span>
          <h2>{{ t('contact.care') }}</h2>
          <p>{{ t('contact.disclaimer') }}</p>
        </div>
      </div>
    </section>
  `,
  styles: [`
    .contact{min-height:75vh;background:var(--bg,#05080d);color:var(--text,#f4efe6)}
    .contact-hero{position:relative;isolation:isolate;overflow:hidden;min-height:390px;padding:70px max(24px,calc((100vw - 1200px)/2));display:flex;align-items:center;border-bottom:1px solid var(--line,rgba(217,184,106,.28));background:radial-gradient(ellipse at 82% 55%,var(--glow,#172131),transparent 42%),linear-gradient(115deg,var(--bg-2,#080c14),var(--bg,#05080d))}
    .contact-copy{position:relative;z-index:1;max-width:760px}
    .contact-copy .eyebrow,.section-heading .eyebrow{display:block;color:var(--gold,#d9b86a)}
    .contact-copy h1{margin:20px 0;font:500 clamp(54px,8vw,104px)/.98 var(--font-editorial);letter-spacing:-.045em}
    .contact-copy h1 em{color:var(--gold,#d9b86a);font-weight:400}
    .contact-copy>p{max-width:510px;margin:0;color:var(--text-2,#d6cfc3);font-size:16px;line-height:1.8}
    .hero-mark{position:absolute;z-index:-1;right:9%;top:50%;transform:translateY(-50%);font:500 clamp(220px,32vw,440px)/.8 var(--font-editorial);letter-spacing:-.16em;color:color-mix(in srgb,var(--gold,#d9b86a) 10%,transparent);user-select:none}
    .hero-mark i{font-style:italic;color:color-mix(in srgb,var(--gold,#d9b86a) 19%,transparent)}
    .hero-caption{position:absolute;right:4vw;bottom:24px;color:var(--muted,#a9a194);font-size:10px;letter-spacing:.18em;text-transform:uppercase}
    .contact-content{padding-block:64px 90px}
    .section-heading{display:flex;align-items:end;justify-content:space-between;gap:24px;margin-bottom:24px}
    .section-heading p{max-width:440px;margin:0;color:var(--muted,#a9a194);font-size:13px;line-height:1.7}
    .contact-grid{display:grid;grid-template-columns:1fr 1fr;gap:18px}
    .contact-card{position:relative;overflow:hidden;min-height:300px;padding:30px;display:flex;flex-direction:column;align-items:flex-start;border:1px solid var(--line,rgba(217,184,106,.28));background:linear-gradient(145deg,var(--surface,#0a1019),var(--bg-2,#080c14));transition:transform .3s,border-color .3s}
    .contact-card:hover{transform:translateY(-4px);border-color:var(--gold,#d9b86a)}
    .appointment-card{background:radial-gradient(ellipse at 100% 0,color-mix(in srgb,var(--gold,#d9b86a) 13%,transparent),transparent 55%),linear-gradient(145deg,var(--surface,#0a1019),var(--bg-2,#080c14))}
    .card-top{width:100%;display:flex;justify-content:space-between;align-items:center}
    .number{font:italic 400 28px var(--font-editorial);color:var(--gold,#d9b86a)}
    .card-icon{width:46px;height:46px;display:grid;place-items:center;border:1px solid var(--line,rgba(217,184,106,.28));border-radius:50%;color:var(--gold,#d9b86a)}
    .card-icon svg{width:21px;height:21px;fill:none;stroke:currentColor;stroke-width:1.4;stroke-linecap:round;stroke-linejoin:round}
    .contact-card h2{margin:26px 0 10px;font:500 30px var(--font-editorial)}
    .contact-card p{max-width:440px;margin:0;color:var(--muted,#a9a194);font-size:13px;line-height:1.8}
    .contact-link{margin-top:auto;padding-top:28px;color:var(--gold,#d9b86a);font-size:12px;font-weight:600;letter-spacing:.08em;text-transform:uppercase}
    .contact-link span{display:inline-block;margin-left:10px;transition:transform .2s}
    .contact-link:hover span{transform:translate(3px,-3px)}
    .contact-methods{display:grid;grid-template-columns:1fr 1fr;gap:14px 20px;width:100%;margin-top:auto;padding-top:24px}
    .contact-methods a{display:grid;gap:5px;min-width:0}
    .contact-methods a span{color:var(--muted,#a9a194);font-size:10px;letter-spacing:.12em;text-transform:uppercase}
    .contact-methods a strong{overflow-wrap:anywhere;color:var(--gold,#d9b86a);font-size:13px;font-weight:500}
    .contact-methods a:hover strong{text-decoration:underline;text-underline-offset:4px}
    .privacy-card{display:flex;align-items:center;gap:18px;margin-top:18px;padding:20px 24px;border:1px solid var(--line,rgba(217,184,106,.28));background:var(--surface,#0a1019);transition:border-color .2s}
    .privacy-card:hover{border-color:var(--gold,#d9b86a)}
    .privacy-icon{font-size:26px;color:var(--gold,#d9b86a)}
    .privacy-card>span:nth-child(2){display:grid;gap:5px}
    .privacy-card strong{font:500 20px var(--font-editorial)}
    .privacy-card small{color:var(--muted,#a9a194);font-size:12px;line-height:1.6}
    .privacy-arrow{margin-left:auto;color:var(--gold,#d9b86a);font-size:22px}
    .privacy{max-width:760px;margin:58px auto 0;padding-top:28px;border-top:1px solid var(--line,rgba(217,184,106,.28));scroll-margin-top:30px}
    .privacy .eyebrow{color:var(--gold,#d9b86a)}
    .privacy h2{margin:14px 0;font:500 32px var(--font-editorial)}
    .privacy p{margin:0;color:var(--muted,#a9a194);font-size:13px;line-height:1.9}
    @media(max-width:700px){.contact-hero{min-height:350px;padding:55px 24px}.hero-mark{right:1%;font-size:260px}.hero-caption{font-size:8px}.contact-content{padding-block:45px 65px}.section-heading{align-items:flex-start;flex-direction:column}.contact-grid{grid-template-columns:1fr}.contact-card{min-height:260px}.privacy-card{align-items:flex-start;padding:18px}.privacy-card small{font-size:11px}}
    @media(max-width:420px){.contact-methods{grid-template-columns:1fr}}
  `]
})
export class ContactComponent {
  private readonly tr = inject(I18nService);
  t = (key: string) => this.tr.t(key);
}
