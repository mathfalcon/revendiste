import type {CarouselSlide} from '../types';

/**
 * "How to buy" carousel for IG/TikTok (1080x1350).
 *
 * Source of truth: apps/frontend/src/routes/preguntas-frecuentes.tsx
 * (faqCompradoresBase + faqGeneral + faqPagos).
 *
 * Slide structure:
 *   1) cover         — eye-catching hook
 *   2) content       — value prop
 *   3) screenshot    — captured /eventos/hoy on mobile
 *   4) content       — payment timer
 *   5) screenshot    — captured /preguntas-frecuentes?seccion=compradores
 *   6) content       — protection / 48h reports
 *   7) content       — CTA
 */
export const howToBuySlides: CarouselSlide[] = [
  {
    kind: 'cover',
    eyebrow: 'Comprar en Revendiste',
    title: 'Pagás. Disfrutás. Después cobra el vendedor.',
    subtitle:
      'Tu plata queda en custodia hasta que entres al evento. Si algo falla, te devolvemos.',
  },
  {
    kind: 'content',
    badge: '1 · Buscar',
    title: 'Buscá tu evento y elegí la entrada',
    body: 'Filtrá por evento, sector y tanda. Antes de pagar ves el precio, la comisión y el total final, sin sorpresas.',
  },
  {
    kind: 'screenshot',
    badge: 'Vista real',
    title: 'Eventos disponibles cerca tuyo',
    body: 'Buscás, comparás precios y ves disponibilidad en tiempo real. Todo desde el celular.',
    screenshotKey: 'eventos-hoy',
  },
  {
    kind: 'content',
    badge: '2 · Pagar',
    title: 'Pagá con el medio que más te sirva',
    body: 'Tarjeta, transferencia o efectivo en redes como RedPagos. En el checkout corre un cronómetro: completá el pago a tiempo o la reserva se libera.',
  },
  {
    kind: 'screenshot',
    badge: 'Preguntas frecuentes',
    title: 'Resolvemos tus dudas en la web',
    body: 'Comisiones, plazos, devoluciones, custodia: todo está documentado en preguntas-frecuentes.',
    screenshotKey: 'faq-compradores',
  },
  {
    kind: 'content',
    badge: 'Si algo falla',
    title: 'Tenés 48h después del evento para reportarlo',
    body: 'Si la entrada no funcionó por culpa del vendedor, abrís un reporte desde "Mis Entradas" con la evidencia. Revisamos y, si corresponde, te devolvemos la plata.',
  },
  {
    kind: 'content',
    badge: 'Empezá ahora',
    title: 'Compra segura, sin coordinar con desconocidos',
    body: 'Entrá a revendiste.com, buscá tu evento y comprá tranquilo. Tu plata está protegida hasta que disfrutes el show.',
  },
];
