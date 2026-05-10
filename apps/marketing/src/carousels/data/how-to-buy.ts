import type {CarouselSlide} from '../types';
import {sharedClosingSlide} from './shared-closing-slide';

/** Buyer carousel for Instagram/TikTok pinned posts. */
export const howToBuySlides: CarouselSlide[] = [
  {
    kind: 'cover',
    eyebrow: 'Cómo comprar',
    title: 'No te quedes afuera, todos ya están adentro',
    subtitle:
      'Buscás el evento, elegís la entrada y pagás dentro de Revendiste.',
  },
  {
    kind: 'stepper',
    badge: 'Comprar',
    title: 'Así funciona la compra',
    intro:
      'Todo pasa dentro de la plataforma, con el precio final visible antes de pagar.',
    steps: [
      {label: 'Buscás el evento', icon: 'calendar'},
      {label: 'Elegís la entrada', icon: 'ticket'},
      {
        label: 'Revisás el total',
        icon: 'tag',
        detail: 'Precio, comisión y total final antes de confirmar.',
      },
      {
        label: 'Pagás con protección',
        icon: 'wallet',
        detail:
          'El dinero queda en custodia mientras se completa la operación.',
      },
      {
        label: 'Recibís la entrada',
        icon: 'circleCheck',
        detail:
          'Si el QR todavía no está disponible, te avisamos cuando el vendedor lo suba.',
      },
    ],
  },
  {
    kind: 'screenshot',
    badge: 'En la web',
    title: 'Encontrá eventos y entradas disponibles',
    body: 'Podés explorar eventos, comparar opciones y revisar disponibilidad antes de elegir.',
    screenshotKey: 'eventos-hoy-desktop',
    presentation: 'desktop',
    icon: 'ticket',
  },
  {
    kind: 'cards',
    badge: 'Pago protegido',
    title: 'Comprás sin coordinar con desconocidos',
    cards: [
      {
        title: 'Reserva con tiempo',
        body: 'En el checkout tenés un tiempo para completar el pago antes de que la entrada vuelva a estar disponible.',
        icon: 'clock',
      },
      {
        title: 'Custodia',
        body: 'El pago queda protegido hasta que pase el evento y la ventana de revisión.',
        icon: 'wallet',
      },
      {
        title: 'Caso si algo falla',
        body: 'Si la entrada no funciona por culpa del vendedor, podés abrir un caso y lo revisamos.',
        icon: 'verify',
      },
    ],
  },
  {
    kind: 'screenshot',
    badge: 'Dudas frecuentes',
    title: 'Lo importante para comprar está explicado',
    body: 'Comisiones, plazos, entrega de QR, custodia y casos: está todo en la sección Compradores.',
    screenshotKey: 'faq-compradores-desktop',
    presentation: 'desktop',
    icon: 'scrollText',
  },
  {
    kind: 'content',
    badge: 'Si algo no sale bien',
    title: 'Tenés una ventana para abrir un caso',
    body: 'Si la entrada no funciona por responsabilidad del vendedor, podés abrir un caso desde tu cuenta con la evidencia. Revisamos la situación y, si corresponde, procesamos la devolución.',
    icon: 'verify',
  },
  {
    kind: 'content',
    badge: 'Listo para tu evento',
    title: 'Buscá tu entrada y comprá con más tranquilidad',
    body: 'Entrá a revendiste.com, elegí el evento y seguí la compra desde tu cuenta. Si tenés dudas, ayuda@revendiste.com.',
    icon: 'sparkles',
  },
  sharedClosingSlide,
];
