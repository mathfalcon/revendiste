import type {CarouselSlide} from '../types';
import {sharedClosingSlide} from './shared-closing-slide';

/**
 * Profile intro carousel: what Revendiste is and why it is safer.
 *
 * Public framing: Revendiste is a marketplace de entradas. Reventa is the
 * current seller flow, but not the full brand definition.
 *
 * Slide 2 (post-cover): resumen alineado a
 * `apps/frontend/src/features/home/HomeAbout.tsx`. Énfasis en frases clave
 * vía `bodyRuns` (orden + espacios en los `text`).
 */
export const whatIsRevendisteSlides: CarouselSlide[] = [
  {
    kind: 'cover',
    eyebrow: 'Qué es Revendiste',
    title: 'Un marketplace para comprar y vender entradas',
    subtitle:
      'Con cuentas verificadas, pagos protegidos y reglas claras para todos.',
  },
  {
    kind: 'content',
    badge: 'Revendiste',
    title: '¿Qué es Revendiste?',
    body: '',
    bodyRuns: [
      {
        text: 'Somos la plataforma número uno en Uruguay\u00A0para ',
      },
      {text: 'comprar y vender entradas a eventos.', emphasize: true},
      {
        text: ' Si no podés ir, publicá la tuya; si te sumaste a último momento, encontrá tu entrada. Nosotros ',
      },
      {text: 'nos encargamos de intermediar\u00A0', emphasize: true},
      {text: 'la operación.'},
    ],
    icon: 'ticket',
  },
  {
    kind: 'cards',
    badge: 'La idea',
    title: 'Entradas con menos incertidumbre',
    intro:
      'Revendiste ordena lo que suele pasar por chats sueltos: buscás, comprás o publicás dentro de una plataforma con reglas claras.',
    cards: [
      {
        title: 'Comprá entradas',
        body: 'Ves el precio final antes de pagar y seguís todo desde tu cuenta.',
        icon: 'ticket',
      },
      {
        title: 'Publicá las tuyas',
        body: 'Si no vas a usar una entrada, podés publicarla para que otra persona la compre.',
        icon: 'upload',
      },
      {
        title: 'Pagos protegidos',
        body: 'El dinero queda en custodia mientras se completa la operación.',
        icon: 'wallet',
      },
      {
        title: 'Reglas visibles',
        body: 'Precios, comisiones, plazos y retiros están explicados en la web.',
        icon: 'scrollText',
      },
    ],
  },
  {
    kind: 'cards',
    badge: 'Por qué da confianza',
    title: 'No es solo “transferime y vemos”',
    cards: [
      {
        title: 'Cuentas verificadas',
        body: 'Quien publica confirma su identidad antes de vender.',
        icon: 'verify',
      },
      {
        title: 'Custodia',
        body: 'El pago no se libera automáticamente: hay una ventana para revisar que todo haya salido bien.',
        icon: 'clock',
      },
      {
        title: 'Soporte',
        body: 'Si algo no coincide, podés abrir un caso desde la plataforma.',
        icon: 'mail',
      },
    ],
  },
  {
    kind: 'content',
    badge: 'Precios claros',
    title: 'Las publicaciones tienen un límite de precio',
    body: 'Hoy las entradas publicadas por usuarios tienen un tope: hasta 15% por encima del valor original. La idea es que puedas recuperar costos sin convertir la compra en una subasta infinita.',
    icon: 'tag',
  },
  {
    kind: 'screenshot',
    badge: 'En la web',
    title: 'Todas las reglas están explicadas',
    body: 'En Preguntas frecuentes encontrás cómo funcionan compras, publicaciones, pagos, custodia y retiros.',
    screenshotKey: 'faq-general-desktop',
    presentation: 'desktop',
    icon: 'scrollText',
  },
  {
    kind: 'cards',
    badge: 'Empezá por acá',
    title: 'Elegí qué querés hacer',
    cards: [
      {
        title: 'Comprar',
        body: 'Buscá el evento, elegí tu entrada y pagá con protección.',
        icon: 'ticket',
      },
      {
        title: 'Vender',
        body: 'Verificá tu cuenta, publicá y solicitá el retiro cuando corresponda.',
        icon: 'banknote',
      },
      {
        title: 'Resolver dudas',
        body: 'Leé la FAQ o escribinos a ayuda@revendiste.com.',
        icon: 'sparkles',
      },
    ],
  },
  sharedClosingSlide,
];
