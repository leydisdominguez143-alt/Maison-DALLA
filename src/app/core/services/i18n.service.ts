import { Injectable, computed, effect, signal } from '@angular/core';

export type Lang = 'es' | 'en' | 'pt';
export type TextPage = 'site' | 'accessibility' | 'home' | 'catalog' | 'about' | 'appointments' | 'contact' | 'cart' | 'admin' | 'atelier';
export interface EditableText { key: string; page: TextPage; }
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
  'nav.atelier': ['Probador Virtual', 'Virtual Fitting Room', 'Provador Virtual'],
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
  'cat.added': ['{name} añadido a la bolsa.', '{name} added to the bag.', '{name} adicionado à sacola.'],
  // citas
  'appointments.eyebrow': ['UNA EXPERIENCIA PRIVADA', 'A PRIVATE EXPERIENCE', 'UMA EXPERIÊNCIA PRIVADA'],
  'appointments.title.a': ['El atelier,', 'The atelier,', 'O ateliê,'],
  'appointments.title.b': ['para ti.', 'for you.', 'para você.'],
  'appointments.intro': ['Reserva una conversación con nuestro equipo para explorar tejidos, siluetas y posibilidades de confección.', 'Book a conversation with our team to explore fabrics, silhouettes and tailoring options.', 'Agende uma conversa com nossa equipe para explorar tecidos, silhuetas e possibilidades de confecção.'],
  'appointments.form': ['SOLICITUD DE CITA', 'APPOINTMENT REQUEST', 'SOLICITAÇÃO DE HORÁRIO'],
  'appointments.prompt': ['Cuéntanos qué imaginas.', 'Tell us what you have in mind.', 'Conte-nos o que você imagina.'],
  'appointments.name': ['Nombre completo', 'Full name', 'Nome completo'],
  'appointments.email': ['Correo electrónico', 'Email address', 'E-mail'],
  'appointments.date': ['Fecha preferida', 'Preferred date', 'Data preferida'],
  'appointments.type': ['Tipo de cita', 'Appointment type', 'Tipo de horário'],
  'appointments.details': ['¿Qué te gustaría crear?', 'What would you like to create?', 'O que você gostaria de criar?'],
  'appointments.placeholder': ['Cuéntanos sobre la ocasión, el diseño o tus ideas...', 'Tell us about the occasion, design or your ideas...', 'Conte-nos sobre a ocasião, o design ou suas ideias...'],
  'appointments.send': ['Enviar solicitud ↗', 'Send request ↗', 'Enviar solicitação ↗'],
  'appointments.disclaimer': ['Esta demo no envía datos a un servidor. Se necesita backend para confirmar y administrar citas.', 'This demo does not send data to a server. A backend is required to confirm and manage appointments.', 'Esta demonstração não envia dados a um servidor. É necessário um backend para confirmar e administrar horários.'],
  'appointments.option.tailoring': ['Confección a medida', 'Made-to-measure tailoring', 'Confecção sob medida'],
  'appointments.option.style': ['Asesoría de estilo', 'Style consultation', 'Consultoria de estilo'],
  'appointments.option.collection': ['Accesorios y colección', 'Accessories and collection', 'Acessórios e coleção'],
  'appointments.option.virtual': ['Consulta virtual', 'Virtual consultation', 'Consulta virtual'],
  'appointments.success': ['Gracias{name}. La solicitud está validada en esta demo; todavía no se ha enviado al atelier.', 'Thank you{name}. Your request is validated in this demo; it has not been sent to the atelier.', 'Obrigado{name}. Sua solicitação foi validada nesta demonstração; ainda não foi enviada ao ateliê.'],
  // contacto
  'contact.eyebrow': ['MAISON DALLA / CONTACTO', 'MAISON DALLA / CONTACT', 'MAISON DALLA / CONTATO'],
  'contact.title.a': ['Hablemos de', "Let's talk about", 'Vamos falar sobre'],
  'contact.title.b': ['lo extraordinario.', 'the extraordinary.', 'o extraordinário.'],
  'contact.intro': ['Cada gran pieza empieza con una conversación. Cuéntanos qué tienes en mente y demos juntos el primer paso.', 'Every great piece begins with a conversation. Tell us what you have in mind and let’s take the first step together.', 'Toda grande peça começa com uma conversa. Conte-nos o que você tem em mente e vamos dar o primeiro passo juntos.'],
  'contact.options': ['Estamos para ayudarte', 'Here to help', 'Estamos aqui para ajudar'],
  'contact.response': ['Elige cómo quieres comenzar. Para una atención personalizada, agenda una cita con nuestro equipo.', 'Choose how you would like to begin. For personal service, book an appointment with our team.', 'Escolha como deseja começar. Para um atendimento personalizado, agende um horário com nossa equipe.'],
  'contact.private': ['DALLA Privado', 'DALLA Private', 'DALLA Privado'],
  'contact.private.text': ['Coordina una cita para conversar sobre una pieza a medida o una asesoría de estilo.', 'Book an appointment to discuss a made-to-measure piece or a style consultation.', 'Agende um horário para conversar sobre uma peça sob medida ou uma consultoria de estilo.'],
  'contact.book': ['Reservar una cita ↗', 'Book an appointment ↗', 'Agendar horário ↗'],
  'contact.support': ['Atención al cliente', 'Customer support', 'Atendimento ao cliente'],
  'contact.support.text': ['Escríbenos o contáctanos por teléfono, WhatsApp e Instagram. Estamos aquí para ayudarte.', 'Email or reach us by phone, WhatsApp and Instagram. We are here to help.', 'Escreva ou fale conosco por telefone, WhatsApp e Instagram. Estamos aqui para ajudar.'],
  'contact.email.label': ['Correo electrónico', 'Email', 'E-mail'],
  'contact.phone.label': ['Teléfono', 'Phone', 'Telefone'],
  'contact.whatsapp.label': ['WhatsApp', 'WhatsApp', 'WhatsApp'],
  'contact.instagram.label': ['Instagram', 'Instagram', 'Instagram'],
  'contact.privacy': ['Privacidad', 'Privacy', 'Privacidade'],
  'contact.privacy.text': ['Conoce cómo se deben proteger tus medidas y preferencias.', 'Learn how your measurements and preferences should be protected.', 'Saiba como suas medidas e preferências devem ser protegidas.'],
  'contact.read': ['Leer nota de privacidad ↘', 'Read privacy note ↘', 'Ler nota de privacidade ↘'],
  'contact.data': ['PRIVACIDAD Y DATOS', 'PRIVACY AND DATA', 'PRIVACIDADE E DADOS'],
  'contact.care': ['Tu información, con cuidado.', 'Your information, handled with care.', 'Suas informações, com cuidado.'],
  'contact.disclaimer': ['Esta plantilla no envía datos a un servidor ni implementa autenticación. Antes de producción, publica una política revisada legalmente, explica el uso de las medidas corporales, establece plazos de conservación y habilita solicitudes de acceso o eliminación de datos.', 'This template does not send data to a server or implement authentication. Before production, publish a legally reviewed policy, explain how body measurements are used, set retention periods and enable data access or deletion requests.', 'Este modelo não envia dados a um servidor nem implementa autenticação. Antes da produção, publique uma política revisada juridicamente, explique o uso das medidas corporais, estabeleça prazos de retenção e habilite solicitações de acesso ou exclusão de dados.'],
  // bolsa
  'cart.selection': ['MAISON DALLA / TU SELECCIÓN', 'MAISON DALLA / YOUR SELECTION', 'MAISON DALLA / SUA SELEÇÃO'],
  'cart.title.a': ['Tu', 'Your', 'Sua'],
  'cart.title.b': ['bolsa.', 'bag.', 'sacola.'],
  'cart.empty.title': ['Tu bolsa está esperando una pieza especial.', 'Your bag is waiting for a special piece.', 'Sua sacola está esperando por uma peça especial.'],
  'cart.empty.text': ['Explora la colección o crea un diseño personalizado en el atelier.', 'Explore the collection or create a custom design at the atelier.', 'Explore a coleção ou crie um design personalizado no ateliê.'],
  'cart.explore': ['Explorar colección', 'Explore collection', 'Explorar coleção'],
  'cart.atelier': ['Ir al atelier', 'Go to the atelier', 'Ir ao ateliê'],
  'cart.made': ['CONFECCIÓN A MEDIDA', 'MADE TO MEASURE', 'CONFECÇÃO SOB MEDIDA'],
  'cart.collection': ['COLECCIÓN', 'COLLECTION', 'COLEÇÃO'],
  'cart.sizeColor': ['Talla: {size} · Color: {color}', 'Size: {size} · Color: {color}', 'Tamanho: {size} · Cor: {color}'],
  'cart.measurements': ['Medidas guardadas: pecho {bust} cm · cintura {waist} cm · cadera {hips} cm · estatura {height} cm', 'Saved measurements: bust {bust} cm · waist {waist} cm · hips {hips} cm · height {height} cm', 'Medidas salvas: busto {bust} cm · cintura {waist} cm · quadril {hips} cm · altura {height} cm'],
  'cart.remove': ['Eliminar', 'Remove', 'Remover'],
  'cart.summary': ['Resumen del pedido', 'Order summary', 'Resumo do pedido'],
  'cart.subtotal': ['Subtotal', 'Subtotal', 'Subtotal'],
  'cart.discount': ['Descuento', 'Discount', 'Desconto'],
  'cart.taxable': ['Base imponible', 'Taxable amount', 'Base tributável'],
  'cart.tax': ['ITBMS (7% ilustrativo)', 'ITBMS (illustrative 7%)', 'ITBMS (7% ilustrativo)'],
  'cart.total': ['Total estimado', 'Estimated total', 'Total estimado'],
  'cart.promo': ['Código promocional', 'Promo code', 'Código promocional'],
  'cart.code': ['Código', 'Code', 'Código'],
  'cart.apply': ['Aplicar', 'Apply', 'Aplicar'],
  'cart.checkout': ['Continuar al pago', 'Continue to checkout', 'Continuar para o pagamento'],
  'cart.legal': ['El pago aún no está conectado a una pasarela. El ITBMS y los descuentos deben validarse según la normativa aplicable.', 'Payments are not connected to a gateway. ITBMS and discounts must be validated against applicable regulations.', 'O pagamento ainda não está conectado a um gateway. O ITBMS e os descontos devem ser validados conforme a legislação aplicável.'],
  'cart.promo.success': ['Descuento de demostración del 10% aplicado.', 'Demo 10% discount applied.', 'Desconto de demonstração de 10% aplicado.'],
  'cart.promo.invalid': ['Código no válido. Prueba DALLA10 (demo).', 'Invalid code. Try DALLA10 (demo).', 'Código inválido. Experimente DALLA10 (demo).'],
  'cart.promo.empty': ['Introduce un código.', 'Enter a code.', 'Digite um código.'],
  'cart.checkout.notice': ['Checkout de demostración: conecta un backend y una pasarela de pago antes de aceptar transacciones reales.', 'Demo checkout: connect a backend and payment gateway before accepting real transactions.', 'Checkout de demonstração: conecte um backend e um gateway de pagamento antes de aceitar transações reais.'],
  'cart.increase': ['Aumentar cantidad', 'Increase quantity', 'Aumentar quantidade'],
  'cart.decrease': ['Reducir cantidad', 'Decrease quantity', 'Reduzir quantidade'],
  // administración
  'admin.title.a': ['Panel de', 'Administration', 'Painel de'],
  'admin.title.b': ['administración.', 'panel.', 'administração.'],
  'admin.demo': ['Modo demostración', 'Demo mode', 'Modo de demonstração'],
  'admin.warning': ['Sin autenticación ni persistencia en servidor. No publicar como panel administrativo real.', 'No authentication or server persistence. Do not publish as a real admin panel.', 'Sem autenticação nem persistência no servidor. Não publique como painel administrativo real.'],
  'admin.products': ['Productos', 'Products', 'Produtos'],
  'admin.categories': ['Categorías', 'Categories', 'Categorias'],
  'admin.orders': ['Pedidos', 'Orders', 'Pedidos'],
  'admin.appointments': ['Citas', 'Appointments', 'Horários'],
  'admin.pending': ['API pendiente', 'API pending', 'API pendente'],
  'admin.crud': ['CATÁLOGO / CRUD LOCAL', 'CATALOG / LOCAL CRUD', 'CATÁLOGO / CRUD LOCAL'],
  'admin.edit': ['Editar producto', 'Edit product', 'Editar produto'],
  'admin.create': ['Crear producto', 'Create product', 'Criar produto'],
  'admin.name': ['Nombre', 'Name', 'Nome'],
  'admin.price': ['Precio (B/.)', 'Price (B/.)', 'Preço (B/.)'],
  'admin.category': ['Categoría', 'Category', 'Categoria'],
  'admin.image': ['URL de imagen', 'Image URL', 'URL da imagem'],
  'admin.description': ['Descripción', 'Description', 'Descrição'],
  'admin.made': ['Confección a medida', 'Made to measure', 'Confecção sob medida'],
  'admin.save': ['Guardar cambios', 'Save changes', 'Salvar alterações'],
  'admin.clear': ['Limpiar', 'Clear', 'Limpar'],
  'admin.inventory': ['Inventario', 'Inventory', 'Inventário'],
  'admin.pieces': ['{count} piezas', '{count} pieces', '{count} peças'],
  'admin.collection': ['Colección', 'Collection', 'Coleção'],
  'admin.custom': ['A medida', 'Made to measure', 'Sob medida'],
  'admin.edit.button': ['Editar', 'Edit', 'Editar'],
  'admin.delete': ['Eliminar', 'Delete', 'Excluir'],
  'admin.error': ['Completa los campos con valores válidos.', 'Complete the fields with valid values.', 'Preencha os campos com valores válidos.'],
  'admin.updated': ['Producto actualizado en memoria.', 'Product updated in memory.', 'Produto atualizado na memória.'],
  'admin.created': ['Producto creado en memoria.', 'Product created in memory.', 'Produto criado na memória.'],
  'admin.editing': ['Editando {name}', 'Editing {name}', 'Editando {name}'],
  'admin.deleted': ['Producto eliminado de la sesión actual.', 'Product removed from the current session.', 'Produto removido da sessão atual.'],
  'admin.category.dresses': ['Vestidos', 'Dresses', 'Vestidos'],
  'admin.category.blouses': ['Blusas', 'Blouses', 'Blusas'],
  'admin.category.blazers': ['Blazers', 'Blazers', 'Blazers'],
  'admin.category.shoes': ['Calzado', 'Shoes', 'Calçados'],
  'admin.category.accessories': ['Accesorios', 'Accessories', 'Acessórios'],
  // atelier
  'atelier.aria': ['Probador virtual', 'Virtual fitting room', 'Provador virtual'],
  'atelier.eyebrow': ['Probador Virtual', 'Virtual Fitting Room', 'Provador Virtual'],
  'atelier.title.a': ['Tu silueta.', 'Your silhouette.', 'Sua silhueta.'],
  'atelier.title.b': ['Tu diseño.', 'Your design.', 'Seu design.'],
  'atelier.intro': ['Ajusta tus medidas y elige una pieza del catálogo para verla puesta.', 'Adjust your measurements and choose a catalog piece to see it fitted.', 'Ajuste suas medidas e escolha uma peça do catálogo para vê-la vestida.'],
  'atelier.measurements': ['Medidas personalizadas', 'Custom measurements', 'Medidas personalizadas'],
  'atelier.estimated': ['Talla estimada', 'Estimated size', 'Tamanho estimado'],
  'atelier.body': ['Tipo de anatomía', 'Body type', 'Tipo de corpo'],
  'atelier.female': ['Femenina', 'Female', 'Feminino'],
  'atelier.male': ['Masculina', 'Male', 'Masculino'],
  'atelier.garmentSize': ['Talla de la prenda', 'Garment size', 'Tamanho da peça'],
  'atelier.auto': ['Auto · {size}', 'Auto · {size}', 'Auto · {size}'],
  'atelier.fit': ['Cambia la talla y mira cómo la prenda queda justa o holgada sobre tus medidas.', 'Change the size to see how the garment fits your measurements.', 'Altere o tamanho para ver como a peça fica justa ou folgada nas suas medidas.'],
  'atelier.color': ['Color', 'Color', 'Cor'],
  'atelier.add': ['Añadir a la bolsa', 'Add to bag', 'Adicionar à sacola'],
  'atelier.book': ['Reservar cita con estas medidas', 'Book an appointment with these measurements', 'Agendar horário com estas medidas'],
  'atelier.reset': ['Restablecer medidas', 'Reset measurements', 'Redefinir medidas'],
  'atelier.disclaimer': ['La talla estimada es orientativa. El ajuste definitivo requiere validar el patrón y las medidas con el atelier.', 'The estimated size is a guide. Final fit requires the atelier to validate the pattern and measurements.', 'O tamanho estimado é apenas uma referência. O ajuste final exige validar o molde e as medidas com o ateliê.'],
  'atelier.catalog': ['Catálogo', 'Catalog', 'Catálogo'],
  'atelier.field.bust': ['Busto / Pecho', 'Bust / Chest', 'Busto / Peito'],
  'atelier.field.waist': ['Cintura', 'Waist', 'Cintura'],
  'atelier.field.hips': ['Cadera', 'Hips', 'Quadril'],
  'atelier.field.height': ['Estatura', 'Height', 'Altura'],
  'atelier.added': ['{name} añadido a la bolsa.', '{name} added to the bag.', '{name} adicionado à sacola.'],
  'atelier.select': ['Elige primero una pieza del catálogo.', 'Choose a catalog piece first.', 'Escolha primeiro uma peça do catálogo.'],
  'admin.category.nightDresses': ['Vestidos de noche', 'Evening dresses', 'Vestidos de noite'],
  'admin.category.xvDresses': ['Vestidos de XV', 'Quinceañera dresses', 'Vestidos de XV'],
  'admin.category.shirts': ['Camisas', 'Shirts', 'Camisas'],
  'admin.category.panama': ['Trajes Panameños', 'Panamanian outfits', 'Trajes panamenhos'],
  'aria.nav': ['Navegación principal', 'Main navigation', 'Navegação principal'],
  'aria.mobileMenu': ['Menú móvil', 'Mobile menu', 'Menu móvel'],
  'product.1.name': ['Camisa', 'Shirt', 'Camisa'],
  'product.1.description': ['Camisa de algodón con cuello de pico y mangas cortas.', 'Cotton shirt with a V-neck and short sleeves.', 'Camisa de algodão com decote em V e mangas curtas.'],
  'product.2.name': ['Blusa Épure', 'Épure blouse', 'Blusa Épure'],
  'product.2.description': ['Blusa de líneas limpias para una elegancia cotidiana.', 'A clean-lined blouse for everyday elegance.', 'Blusa de linhas limpas para uma elegância cotidiana.'],
  'product.3.name': ['Vestido Noche Royale', 'Noche Royale evening dress', 'Vestido Noche Royale'],
  'product.3.description': ['Vestido largo de noche en satén, de silueta ajustada y caída fluida.', 'Long satin evening dress with a fitted silhouette and fluid drape.', 'Vestido longo de noite em cetim, com silhueta ajustada e caimento fluido.'],
  'product.4.name': ['Vestido XV Aurora', 'Aurora quinceañera dress', 'Vestido XV Aurora'],
  'product.4.description': ['Vestido de quinceañera con falda amplia y corpiño bordado, confeccionado a medida.', 'Quinceañera dress with a full skirt and embroidered bodice, made to measure.', 'Vestido de debutante com saia ampla e corpete bordado, feito sob medida.'],
  'product.5.name': ['Traje Típico', 'Traditional Panamanian outfit', 'Traje Típico'],
  'product.5.description': ['Traje típico panameño de gala con encajes y detalles bordados, hecho a medida.', 'Traditional Panamanian formal outfit with lace and embroidered details, made to measure.', 'Traje típico panamenho de gala com rendas e detalhes bordados, feito sob medida.'],
  'product.category.Camisas': ['Camisas', 'Shirts', 'Camisas'],
  'product.category.Blusas': ['Blusas', 'Blouses', 'Blusas'],
  'product.category.Vestidos de noche': ['Vestidos de noche', 'Evening dresses', 'Vestidos de noite'],
  'product.category.Vestidos de XV': ['Vestidos de XV', 'Quinceañera dresses', 'Vestidos de XV'],
  'product.category.Trajes Panameños': ['Trajes Panameños', 'Panamanian outfits', 'Trajes panamenhos'],
  'home.marquee.shipping': ['Envíos a todo el país', 'Shipping nationwide', 'Envios para todo o país'],
  'home.marquee.style': ['Moda con carácter', 'Fashion with character', 'Moda com personalidade'],
  'home.marquee.custom': ['Hecho a tu medida', 'Made to measure', 'Feito sob medida'],
  'home.marquee.appointment': ['Agenda tu cita', 'Book your appointment', 'Agende seu horário'],
  'fitting.canvas': ['Maniquí 3D con la prenda seleccionada. Arrastra para girarlo.', '3D mannequin with the selected garment. Drag to rotate.', 'Manequim 3D com a peça selecionada. Arraste para girar.'],
  'fitting.loading': ['Cargando prenda…', 'Loading garment…', 'Carregando peça…'],
  'fitting.error': ['No se pudo cargar esta prenda. Prueba con otra.', 'This garment could not be loaded. Try another.', 'Não foi possível carregar esta peça. Tente outra.'],
  'fitting.kind.label': ['Tipo de prenda', 'Garment type', 'Tipo de peça'],
  'fitting.kind.vestido': ['Vestido', 'Dress', 'Vestido'],
  'fitting.kind.top': ['Parte de arriba', 'Top', 'Parte de cima'],
  'fitting.kind.pantalon': ['Pantalón', 'Trousers', 'Calça'],
  'fitting.kind.abrigo': ['Abrigo', 'Coat', 'Casaco'],
  'fitting.size': ['Tamaño', 'Size', 'Tamanho'],
  'fitting.height': ['Altura', 'Height', 'Altura'],
  'fitting.remove': ['Quitar prenda', 'Remove garment', 'Remover peça'],
  'fitting.choose': ['Elige una prenda del catálogo para verla puesta.', 'Choose a catalog garment to see it fitted.', 'Escolha uma peça do catálogo para vê-la vestida.'],
  'fitting.stop': ['Detener giro', 'Stop rotation', 'Parar rotação'],
  'fitting.rotate': ['Girar solo', 'Rotate automatically', 'Girar automaticamente'],
  'fitting.drag': ['Arrastra para girar', 'Drag to rotate', 'Arraste para girar'],
  'admin.text.title': ['Cambiar textos de las páginas', 'Edit page text', 'Editar textos das páginas'],
  'admin.text.help': ['Elige una página e idioma. Edita cada texto y guarda; los cambios se conservan en este navegador.', 'Choose a page and language. Edit each text and save; changes are stored in this browser.', 'Escolha uma página e idioma. Edite cada texto e salve; as alterações ficam neste navegador.'],
  'admin.text.page': ['Página', 'Page', 'Página'],
  'admin.text.language': ['Idioma de edición', 'Editing language', 'Idioma de edição'],
  'admin.text.select': ['Selecciona una página', 'Select a page', 'Selecione uma página'],
  'admin.text.home': ['Inicio', 'Home', 'Início'],
  'admin.text.catalog': ['Catálogo', 'Catalog', 'Catálogo'],
  'admin.text.about': ['Nosotros', 'About us', 'Sobre nós'],
  'admin.text.appointments': ['Citas', 'Appointments', 'Horários'],
  'admin.text.contact': ['Contacto', 'Contact', 'Contato'],
  'admin.text.cart': ['Bolsa', 'Shopping bag', 'Sacola'],
  'admin.text.atelier': ['Probador Virtual', 'Virtual Fitting Room', 'Provador Virtual'],
  'admin.text.site': ['Menú y pie de página', 'Menu and footer', 'Menu e rodapé'],
  'admin.text.accessibility': ['Accesibilidad', 'Accessibility', 'Acessibilidade'],
  'admin.text.admin': ['Administración', 'Administration', 'Administração'],
  'admin.text.item': ['Texto visible {number}', 'Visible text {number}', 'Texto visível {number}'],
  'admin.text.placeholder': ['Escribe aquí el texto nuevo...', 'Type the new text here...', 'Digite o novo texto aqui...'],
  'admin.text.save': ['Guardar textos', 'Save text', 'Salvar textos'],
  'admin.text.reset': ['Restaurar textos originales de esta página', 'Restore this page’s original text', 'Restaurar textos originais desta página'],
  'admin.text.saved': ['Textos guardados. Ya puedes ver los cambios en el sitio.', 'Text saved. Your changes are now visible on the site.', 'Textos salvos. Suas alterações já estão visíveis no site.'],
  'admin.text.restored': ['Se restauraron los textos originales de esta página.', 'The original text for this page has been restored.', 'Os textos originais desta página foram restaurados.']
};
const IDX: Record<Lang, number> = { es: 0, en: 1, pt: 2 };

/** Idioma del sitio. Uso en plantillas: {{ t('clave') }}. Se recuerda entre visitas y actualiza <html lang>. */
@Injectable({ providedIn: 'root' })
export class I18nService {
  readonly lang = signal<Lang>(this.initial());
  readonly current = computed(() => LANGS.find(l => l.code === this.lang())!);
  readonly textOverrides = signal<Record<string, Partial<Record<Lang, string>>>>(this.loadTextOverrides());

  constructor() {
    effect(() => {
      const l = this.lang();
      if (typeof document === 'undefined') return;
      document.documentElement.lang = l;
      try { localStorage.setItem('dalla-lang', l); } catch { /* sin almacenamiento */ }
    });
    effect(() => {
      try { localStorage.setItem('dalla-text-overrides', JSON.stringify(this.textOverrides())); } catch { /* sin almacenamiento */ }
    });
  }

  set(l: Lang): void { this.lang.set(l); }

  t(key: string, vars?: Record<string, string | number>): string {
    const entry = D[key];
    let s = this.textOverrides()[key]?.[this.lang()] ?? (entry ? entry[IDX[this.lang()]] : key);
    if (vars) for (const [k, v] of Object.entries(vars)) s = s.replace('{' + k + '}', String(v));
    return s;
  }

  text(key: string, lang: Lang, fallback?: string): string {
    return this.textOverrides()[key]?.[lang] ?? D[key]?.[IDX[lang]] ?? fallback ?? key;
  }

  editableTexts(): EditableText[] {
    return Object.keys(D).map(key => ({ key, page: this.pageForKey(key) }));
  }

  saveTexts(values: { key: string; lang: Lang; value: string }[]): void {
    this.textOverrides.update(current => {
      const next = { ...current };
      for (const { key, lang, value } of values) {
        next[key] = { ...next[key], [lang]: value };
      }
      return next;
    });
  }

  resetTexts(keys: string[], lang: Lang): void {
    this.textOverrides.update(current => {
      const next = { ...current };
      for (const key of keys) {
        const values = { ...next[key] };
        delete values[lang];
        if (Object.keys(values).length) next[key] = values;
        else delete next[key];
      }
      return next;
    });
  }

  productName(id: number, fallback: string): string {
    const key = `product.${id}.name`;
    const value = this.t(key);
    return value === key ? fallback : value;
  }

  productDescription(id: number, fallback: string): string {
    const key = `product.${id}.description`;
    const value = this.t(key);
    return value === key ? fallback : value;
  }

  productCategory(category: string): string {
    const key = `product.category.${category}`;
    const value = this.t(key);
    return value === key ? category : value;
  }

  private initial(): Lang {
    try {
      const saved = localStorage.getItem('dalla-lang');
      if (saved === 'es' || saved === 'en' || saved === 'pt') return saved;
    } catch { /* sin almacenamiento */ }
    return 'es';
  }

  private loadTextOverrides(): Record<string, Partial<Record<Lang, string>>> {
    try {
      const raw = localStorage.getItem('dalla-text-overrides');
      if (raw) return JSON.parse(raw) as Record<string, Partial<Record<Lang, string>>>;
    } catch { /* sin almacenamiento */ }
    return {};
  }

  private pageForKey(key: string): TextPage {
    if (/^(a11y|aria\.a11y)/.test(key)) return 'accessibility';
    if (/^(home|how|feat|band)\./.test(key)) return 'home';
    if (/^(cat|product)\./.test(key)) return 'catalog';
    if (key.startsWith('appointments.')) return 'appointments';
    if (key.startsWith('contact.')) return 'contact';
    if (key.startsWith('cart.')) return 'cart';
    if (key.startsWith('admin.')) return 'admin';
    if (/^(atelier|fitting)\./.test(key)) return 'atelier';
    if (key.startsWith('footer.')) return 'site';
    return 'site';
  }
}