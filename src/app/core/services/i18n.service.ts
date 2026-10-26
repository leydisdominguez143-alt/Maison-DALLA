import { Injectable, computed, effect, signal } from '@angular/core';

export type Lang = 'es' | 'en' | 'pt';
export const LANGS: { code: Lang; label: string; short: string }[] = [
  { code: 'es', label: 'Español', short: 'ES' },
  { code: 'en', label: 'English', short: 'EN' },
  { code: 'pt', label: 'Português', short: 'PT' }
];

/** Textos del sitio: clave → [español, inglés, portugués]. Para traducir algo nuevo, añade una línea aquí. */
const D: Record<string, [string, string, string]> = {
  // navegación y cabecera
  'nav.home': ['Inicio', 'Home', 'Início'],
  'nav.catalog': ['Catálogo', 'Catalog', 'Catálogo'],
  'nav.atelier': ['Atelier', 'Atelier', 'Ateliê'],
  'nav.about': ['Nosotros', 'About us', 'Sobre nós'],
  'nav.contact': ['Contacto', 'Contact', 'Contato'],
  'cta.book': ['Reservar cita', 'Book appointment', 'Agendar horário'],
  'skip': ['Saltar al contenido', 'Skip to content', 'Pular para o conteúdo'],
  'aria.home': ['Maison Dalla, inicio', 'Maison Dalla, home', 'Maison Dalla, início'],
  'aria.search': ['Buscar productos', 'Search products', 'Buscar produtos'],
  'aria.cart': ['Bolsa de compras', 'Shopping bag', 'Sacola de compras'],
  'aria.items': ['artículos', 'items', 'itens'],
  'aria.menu': ['Abrir menú', 'Open menu', 'Abrir menu'],
  'aria.lang': ['Cambiar idioma', 'Change language', 'Mudar idioma'],
  'aria.a11y': ['Opciones de accesibilidad', 'Accessibility options', 'Opções de acessibilidade'],
  'aria.theme.light': ['Cambiar a modo claro', 'Switch to light mode', 'Mudar para o modo claro'],
  'aria.theme.dark': ['Cambiar a modo oscuro', 'Switch to dark mode', 'Mudar para o modo escuro'],
  'theme.on.light': ['Modo claro activado', 'Light mode on', 'Modo claro ativado'],
  'theme.on.dark': ['Modo oscuro activado', 'Dark mode on', 'Modo escuro ativado'],
  'lang.on': ['Idioma: {lang}', 'Language: {lang}', 'Idioma: {lang}'],
  // pie de página
  'footer.tag': ['Diseño exclusivo · Confección a medida · Panamá', 'Exclusive design · Made to measure · Panama', 'Design exclusivo · Sob medida · Panamá'],
  'footer.contact': ['Contacto', 'Contact', 'Contato'],
  'footer.private': ['Citas privadas', 'Private appointments', 'Horários privados'],
  'footer.admin': ['Administración', 'Administration', 'Administração'],
  'footer.note': ['© {year} Maison DALLA. Concepto de tienda — sustituir datos de demostración antes de producción.', '© {year} Maison DALLA. Store concept — replace demo data before production.', '© {year} Maison DALLA. Conceito de loja — substituir os dados de demonstração antes da produção.'],
  // accesibilidad
  'a11y.title': ['Accesibilidad', 'Accessibility', 'Acessibilidade'],
  'a11y.size': ['Tamaño del contenido', 'Content size', 'Tamanho do conteúdo'],
  'a11y.contrast': ['Alto contraste', 'High contrast', 'Alto contraste'],
  'a11y.links': ['Subrayar enlaces', 'Underline links', 'Sublinhar links'],
  'a11y.motion': ['Reducir animaciones', 'Reduce motion', 'Reduzir animações'],
  'a11y.dyslexia': ['Fuente fácil de leer', 'Easy-to-read font', 'Fonte fácil de ler'],
  'a11y.spacing': ['Más espacio entre líneas', 'More line spacing', 'Mais espaço entre linhas'],
  'a11y.cursor': ['Cursor grande', 'Large cursor', 'Cursor grande'],
  'a11y.focus': ['Resaltar el foco del teclado', 'Highlight keyboard focus', 'Destacar o foco do teclado'],
  'a11y.read': ['Leer la página en voz alta', 'Read the page aloud', 'Ler a página em voz alta'],
  'a11y.stop': ['Detener lectura', 'Stop reading', 'Parar a leitura'],
  'a11y.reset': ['Restablecer todo', 'Reset all', 'Redefinir tudo'],
  'a11y.close': ['Cerrar', 'Close', 'Fechar'],
  'a11y.hint': ['Usa Tab para navegar y Enter para activar.', 'Use Tab to navigate and Enter to activate.', 'Use Tab para navegar e Enter para ativar.'],
  // inicio
  'home.eyebrow': ['Diseño exclusivo y confección a medida', 'Exclusive design and made-to-measure tailoring', 'Design exclusivo e confecção sob medida'],
  'home.h1a': ['El lujo de', 'The luxury of', 'O luxo de'],
  'home.h1b': ['ser único.', 'being unique.', 'ser único.'],
  'home.lead': ['Piezas creadas alrededor de ti. Una nueva expresión de la elegancia, diseñada para acompañar tu individualidad.', 'Pieces created around you. A new expression of elegance, designed to accompany your individuality.', 'Peças criadas ao seu redor. Uma nova expressão da elegância, desenhada para acompanhar a sua individualidade.'],
  'home.cta1': ['Reservar cita', 'Book an appointment', 'Agendar horário'],
  'home.cta2': ['Ver colección', 'View collection', 'Ver coleção'],
  'home.carousel': ['Piezas de la colección', 'Collection pieces', 'Peças da coleção'],
  'home.prev': ['Pieza anterior', 'Previous piece', 'Peça anterior'],
  'home.next': ['Pieza siguiente', 'Next piece', 'Próxima peça'],
  'home.view': ['Ver pieza', 'View piece', 'Ver peça'],
  'home.soon': ['Foto próximamente', 'Photo coming soon', 'Foto em breve'],
  'home.cats.eyebrow': ['Explora', 'Explore', 'Explore'],
  'home.cats.title': ['Por categoría', 'By category', 'Por categoria'],
  'home.cats.one': ['1 pieza', '1 piece', '1 peça'],
  'home.cats.many': ['{n} piezas', '{n} pieces', '{n} peças'],
  'how.eyebrow': ['Así funciona', 'How it works', 'Como funciona'],
  'how.title': ['Tu pieza, paso a paso', 'Your piece, step by step', 'Sua peça, passo a passo'],
  'how.1.t': ['Diseño', 'Design', 'Design'],
  'how.1.d': ['Elige una pieza de la colección o parte de una idea propia. Nuestro equipo la interpreta contigo.', 'Choose a piece from the collection or start from your own idea. Our team interprets it with you.', 'Escolha uma peça da coleção ou parta de uma ideia própria. Nossa equipe a interpreta com você.'],
  'how.2.t': ['Personalización', 'Customization', 'Personalização'],
  'how.2.d': ['Ajusta tus medidas, elige el color y mira cómo cae la pieza en el atelier 3D.', 'Adjust your measurements, choose the color and see how the piece fits in the 3D atelier.', 'Ajuste suas medidas, escolha a cor e veja como a peça veste no ateliê 3D.'],
  'how.3.t': ['Confección', 'Tailoring', 'Confecção'],
  'how.3.d': ['Confeccionamos tu pieza a mano con tus medidas y la validamos contigo antes de entregarla.', 'We make your piece by hand to your measurements and review it with you before delivery.', 'Confeccionamos sua peça à mão com suas medidas e a validamos com você antes da entrega.'],
  'how.cta': ['Ir al atelier', 'Go to the atelier', 'Ir ao ateliê'],
  'feat.eyebrow': ['Selección de la casa', 'House selection', 'Seleção da casa'],
  'feat.a': ['Piezas', 'Featured', 'Peças'],
  'feat.b': ['destacadas', 'pieces', 'em destaque'],
  'feat.all': ['Ver colección completa', 'View full collection', 'Ver coleção completa'],
  'band.title': ['Tu pieza única empieza aquí.', 'Your unique piece starts here.', 'Sua peça única começa aqui.'],
  'band.text': ['Reserva una cita privada y diseñemos juntos algo hecho para ti.', "Book a private appointment and let's design something made for you.", 'Agende um horário privado e vamos criar juntos algo feito para você.'],
  // catálogo
  'cat.eyebrow': ['MAISON DALLA / COLECCIÓN', 'MAISON DALLA / COLLECTION', 'MAISON DALLA / COLEÇÃO'],
  'cat.title.a': ['El arte de', 'The art of', 'A arte de'],
  'cat.title.b': ['vestir.', 'dressing.', 'vestir.'],
  'cat.sub': ['Diseño contemporáneo, piezas seleccionadas y confección personalizada.', 'Contemporary design, curated pieces and personalized tailoring.', 'Design contemporâneo, peças selecionadas e confecção personalizada.'],
  'cat.all': ['Todas', 'All', 'Todas'],
  'cat.search': ['Buscar una pieza...', 'Search for a piece...', 'Buscar uma peça...'],
  'cat.add': ['Añadir a la bolsa', 'Add to bag', 'Adicionar à sacola'],
  'cat.custom': ['Personalizar', 'Customize', 'Personalizar'],
  'cat.tag.made': ['A medida', 'Made to measure', 'Sob medida'],
  'cat.tag.col': ['Colección', 'Collection', 'Coleção'],
  'cat.empty': ['No encontramos piezas con esos criterios.', "We couldn't find pieces matching those criteria.", 'Não encontramos peças com esses critérios.'],
  'cat.reset': ['Ver todas las piezas', 'View all pieces', 'Ver todas as peças'],
  'cat.added': ['{name} añadido a la bolsa.', '{name} added to the bag.', '{name} adicionado à sacola.']
};
const IDX: Record<Lang, number> = { es: 0, en: 1, pt: 2 };

/** Idioma del sitio. Uso en plantillas: {{ t('clave') }}. Se recuerda entre visitas y actualiza <html lang>. */
@Injectable({ providedIn: 'root' })
export class I18nService {
  readonly lang = signal<Lang>(this.initial());
  readonly current = computed(() => LANGS.find(l => l.code === this.lang())!);

  constructor() {
    effect(() => {
      const l = this.lang();
      if (typeof document === 'undefined') return;
      document.documentElement.lang = l;
      try { localStorage.setItem('dalla-lang', l); } catch { /* sin almacenamiento */ }
    });
  }

  set(l: Lang): void { this.lang.set(l); }

  t(key: string, vars?: Record<string, string | number>): string {
    const entry = D[key];
    let s = entry ? entry[IDX[this.lang()]] : key;
    if (vars) for (const [k, v] of Object.entries(vars)) s = s.replace('{' + k + '}', String(v));
    return s;
  }

  private initial(): Lang {
    try {
      const saved = localStorage.getItem('dalla-lang');
      if (saved === 'es' || saved === 'en' || saved === 'pt') return saved;
    } catch { /* sin almacenamiento */ }
    return 'es';
  }
}