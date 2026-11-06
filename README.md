# Maison DALLA — Atelier Digital

Sitio frontend para una experiencia de e-commerce de moda de diseñador con Angular standalone, Signals y Three.js.

## Requisitos
- Node.js LTS compatible con Angular 18
- npm

## Instalar y ejecutar
```bash
npm install
npm start
```
Abre la URL local que muestre Angular CLI (habitualmente `http://localhost:4200`).

## Compilar
```bash
npm run build
```

## Rutas
- `/` — Inicio editorial
- `/catalogo` — Catálogo con categorías, búsqueda y carrito
- `/atelier` — Probador 3D, medidas, color y selección de anatomía
- `/bolsa` — Carrito, descuento demo e ITBMS ilustrativo
- `/citas` — Formulario de solicitud de cita (demo)
- `/quienes-somos` — Filosofía, historia y valores de Maison DALLA\n- `/contacto` — Contacto y nota de privacidad
- `/admin` — CRUD local de demostración

## Estructura
```text
src/app/
  core/
    models/
    services/
  features/
    home/
    catalog/
    virtual-fitting/
    cart/
    appointments/
    contact/
    admin/
  app.component.ts
  app.config.ts
  app.routes.ts
src/styles.css
public/assets/
  images/
  models/
  textures/
```

## Qué está implementado
- Angular standalone components y lazy loading por ruta.
- Servicios reactivos con Signals para carrito, productos, medidas y navegación.
- Interfaz global con modo oscuro/claro, preferencia guardada y paleta adaptable en todas las rutas.
- Controles globales de accesibilidad y traducciones ES/EN/PT para la navegación, páginas y productos de muestra.
- Catálogo de demostración con búsqueda, categorías y productos de muestra.
- Carrito reactivo con subtotal, código demo `DALLA10`, descuento e ITBMS calculado al 7%.
- Probador Three.js con controles de cámara, maniquí geométrico, color y proporciones ilustrativas.
- CRUD de catálogo solo en memoria para mostrar la interfaz administrativa.

## Importante antes de producción
Este proyecto es una experiencia frontend funcional, no un sistema comercial listo para cobrar:
- Los productos y precios son datos de ejemplo. Algunas imágenes se cargan desde URLs externas de Unsplash; sustitúyelas por fotografías propias/licenciadas.
- `public/assets/models/mannequin-female.glb` es opcional y no viene incluido. Si lo agregas, el visor intentará cargarlo; si no existe, utiliza el maniquí geométrico.
- El maniquí es estilizado; no constituye simulación de ajuste ni predicción antropométrica validada. Las tallas son ilustrativas.
- El estado de los Signals y el CRUD administrativo se pierden al recargar; aún no hay backend ni base de datos.
- El checkout no procesa pagos. Para Yappy y tarjetas, integra proveedores oficiales mediante un backend y verifica los pagos con webhooks.
- No publiques `/admin` sin autenticación, autorización del lado servidor y controles de acceso a datos.
- Valida con asesoría fiscal el ITBMS aplicable y las reglas de descuentos antes de vender.
- Añade pruebas unitarias/e2e, manejo de errores, accesibilidad y revisión de seguridad antes de producción.

## Próximos pasos sugeridos
1. Conectar API y base de datos para catálogo, usuarios, medidas, citas y pedidos.
2. Crear modelos GLB optimizados y preparados para deformaciones (morph targets o rig).
3. Conectar medidas con morph targets reales y evaluar simulación de prendas.
4. Integrar pagos mediante backend, checkout alojado/tokenizado y webhooks verificados.
5. Incorporar autenticación, roles, políticas de privacidad y pruebas.

## Actualización UX
- Añadida la página `/quienes-somos`.
- Añadidos controles globales de idioma (ES/EN/PT), tema claro/oscuro y accesibilidad (texto grande, contraste, subrayado de enlaces, reducción de animaciones, lectura en voz alta y otras opciones).
- El idioma seleccionado actualiza la navegación, textos de las páginas, formularios, productos de muestra y el atributo `lang` del documento.
- El modo claro y las preferencias de accesibilidad se aplican globalmente y se conservan entre visitas.
- En `/admin`, la sección «Cambiar textos de las páginas» permite editar el contenido por página e idioma sin mostrar claves ni tocar código; los cambios se guardan en el navegador actual y se pueden restaurar por página.
- Integrado el canvas Three.js dentro del escenario del atelier, con rotación mediante arrastre y zoom.
- El visor utiliza un maniquí geométrico de demostración. Los controles alteran proporciones de manera ilustrativa; no predicen el ajuste real de una prenda. Para un avatar realista se requiere un modelo GLB preparado con rig/morph targets y prendas compatibles.
- Los datos nuevos que se introduzcan manualmente en el panel de administración permanecen en el idioma en que fueron escritos.
