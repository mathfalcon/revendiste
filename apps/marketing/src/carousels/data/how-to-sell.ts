import type {CarouselSlide} from '../types';
import {sharedClosingSlide} from './shared-closing-slide';

/**
 * Vendedor: publicar, vender y cobrar (IG/TikTok 1080×1350).
 *
 * Fuentes de verdad:
 *  - apps/frontend/src/routes/preguntas-frecuentes.tsx (publicadores + pagos)
 *  - apps/frontend/src/routes/entradas/publicar.tsx
 *  - apps/frontend/src/features/event/QrAvailabilityDialog.tsx
 *  - apps/frontend/src/routes/cuenta/retiro
 */
export const howToSellSlides: CarouselSlide[] = [
  {
    kind: 'cover',
    eyebrow: 'Cómo vender en Revendiste',
    title: 'No te quedes con una entrada que no vas a usar',
    subtitle:
      'Publicala, la vendemos por vos; recibís el dinero cuando termina el evento',
  },
  {
    kind: 'stepper',
    badge: '1 · Tu cuenta',
    title: 'Primero confirmamos que sos vos',
    intro:
      'Es rápido y lo hacés una sola vez, desde el celular o la compu. Así todos publicamos con cara y documento.',
    steps: [
      {
        label: 'Completás los datos de tu documento',
        icon: 'idCard',
        detail: 'Cédula uruguaya, DNI argentino o pasaporte, más el número.',
      },
      {
        label: 'Sacás una foto del documento',
        icon: 'fileText',
        detail: 'Que se lea bien el número y tu foto.',
      },
      {
        label: 'Una selfie para cerrar',
        icon: 'scanFace',
        detail:
          'Te pedimos una prueba de vida cortita: es la forma más segura de saber que el documento es tuyo.',
      },
    ],
  },
  {
    kind: 'stepper',
    badge: '2 · Publicar',
    title: 'Publicar lleva unos minutos',
    intro:
      'En la web, tocá el botón Publicá tus entradas y completá el formulario. Son estos pasos:',
    steps: [
      {label: 'Elegís el evento', icon: 'calendar'},
      {label: 'Elegís el tipo de entrada', icon: 'ticket'},
      {
        label: 'Ponés el precio',
        icon: 'tag',
        detail: 'Hasta un 15% más que lo que pagaste (lo validamos nosotros).',
      },
      {label: 'Decís cuántas vendés', icon: 'list'},
      {
        label: 'Si ya tenés el QR o PDF, los subís',
        icon: 'upload',
        detail:
          'Si el evento todavía no liberó códigos, no pasa nada: te avisamos cuando toque.',
      },
      {
        label: 'Aceptás los términos',
        icon: 'scrollText',
        detail: 'Marcás que estás de acuerdo con las reglas de publicación.',
      },
      {label: '¡Listo, ya estás publicando!', icon: 'circleCheck'},
    ],
  },
  {
    kind: 'screenshot',
    badge: 'En la app',
    title: 'Así es el formulario para publicar',
    body: 'Evento, tipo de entrada, precio, cantidad y documentos en un solo lugar. El tope del 15% se valida antes de publicar.',
    screenshotKey: 'entradas-publicar-desktop',
    presentation: 'desktop',
    icon: 'list',
  },
  {
    kind: 'content',
    badge: '3 · Te compran',
    title: 'Cuando se vende, te avisamos',
    body: 'Recibís un mail y una notificación en la app. Si falta subir el QR o un documento, te lo recordamos con tiempo. Cuando lo completás, la persona compradora recibe su entrada.',
    icon: 'bell',
  },
  {
    kind: 'stepper',
    badge: '4 · Cobrar',
    title: 'Cómo retirás tus ganancias',
    intro:
      'Después del evento hay una ventana de custodia para proteger la operación. Cuando tus ganancias quedan disponibles, solicitás el retiro así:',
    steps: [
      {
        label: 'Esperás a que libere la custodia',
        icon: 'clock',
        detail:
          'El saldo queda retenido hasta que termina el evento y pasa la ventana de casos (aprox. 48 h).',
      },
      {
        label: 'Entrás a Cuenta → Retiros',
        icon: 'wallet',
        detail: 'Ahí ves qué monto está disponible.',
      },
      {
        label: 'Elegís el monto y tu cuenta',
        icon: 'landmark',
        detail:
          'Cuenta bancaria en Uruguay, en la misma moneda que tus ganancias.',
      },
      {
        label: 'Confirmás y te avisamos',
        icon: 'bell',
        detail: 'Te avisamos cuando el retiro esté en proceso.',
      },
      {
        label: 'Montos mínimos y plazos',
        icon: 'handCoins',
        detail:
          'Mínimo UYU 1.000 o USD 25. Suele demorar entre 1 y 3 días hábiles.',
      },
    ],
  },
  {
    kind: 'screenshot',
    badge: 'Más sobre plata',
    title: 'Custodia, retiros y montos mínimos',
    body: 'En Preguntas frecuentes → Pagos tenés los plazos, monedas y requisitos explicados con más detalle.',
    screenshotKey: 'faq-pagos-desktop',
    presentation: 'desktop',
    icon: 'wallet',
  },
  {
    kind: 'screenshot',
    badge: '¿Alguna duda?',
    title: 'Hay una sección solo para quien publica',
    body: 'En Preguntas frecuentes tenés respuestas pensadas para quien publica. Escaneá el código y entrás directo. También podés escribirnos a ayuda@revendiste.com.',
    bodyQrUrl:
      'https://revendiste.com/preguntas-frecuentes?seccion=publicadores',
    screenshotKey: 'faq-publicadores',
    icon: 'sparkles',
  },
  sharedClosingSlide,
];
