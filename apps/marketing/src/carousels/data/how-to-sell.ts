import type {CarouselSlide} from '../types';

/**
 * "How to sell" carousel for IG/TikTok (1080x1350).
 *
 * Source of truth: apps/frontend/src/routes/preguntas-frecuentes.tsx
 * (faqVendedoresBase + faqPagos + faqGeneral).
 */
export const howToSellSlides: CarouselSlide[] = [
  {
    kind: 'cover',
    eyebrow: 'Vender en Revendiste',
    title: 'No te quedes con una entrada que no vas a usar',
    subtitle:
      'Publicala, la vendemos por vos y cobrás cuando termina el evento. Sin chats raros.',
  },
  {
    kind: 'content',
    badge: '1 · Verificación',
    title: 'Confirmá tu identidad desde el celular',
    body: 'Subís el documento y hacés una verificación de vida (liveness). Es rápido y es lo que permite que los compradores confíen en tu publicación.',
  },
  {
    kind: 'content',
    badge: '2 · Publicar',
    title: 'Cargá evento, sector, tanda y precio',
    body: 'Podés publicar hasta un 15% por encima del valor original para recuperar la comisión que pagaste al comprarla. Sin especulación: precio justo y legal.',
  },
  {
    kind: 'screenshot',
    badge: 'Sección Publicadores',
    title: 'Todo lo que necesitás saber al vender',
    body: 'Tiempos de cobro, custodia, retiros, qué pasa si todavía no tenés el QR. Está documentado en preguntas-frecuentes.',
    screenshotKey: 'faq-publicadores',
  },
  {
    kind: 'content',
    badge: '3 · Esperar la venta',
    title: 'Te avisamos por email cuando alguien la compra',
    body: 'Subís el QR o documento que necesita el comprador. La imagen no es pública: solo vos y el comprador la ven.',
  },
  {
    kind: 'content',
    badge: 'Cobro',
    title: 'Cobrás cuando termina el período de custodia',
    body: 'El monto queda retenido hasta que termina el evento y pasa la ventana de reportes. Después entrás a Cuenta → Retiros y pedís el pago a tu cuenta bancaria en Uruguay (UYU o USD).',
  },
  {
    kind: 'content',
    badge: 'Empezá hoy',
    title: 'Recuperá lo que pagaste',
    body: 'Entrá a revendiste.com, completá la verificación y publicá. Si tenés dudas escribinos a ayuda@revendiste.com.',
  },
];
