import {EventTicketCurrency} from '~/lib';
import {calculateOrderFees, calculateSellerAmount, getFeeRates} from '~/utils';

export const faqSections = [
  'general',
  'compradores',
  'publicadores',
  'pagos',
] as const;
export type FAQSection = (typeof faqSections)[number];

/** Stable key for lookups / event-page subset — not emitted in JSON-LD. */
export type FaqItemId =
  | 'gen-what-is-revendiste'
  | 'gen-is-legal'
  | 'gen-resell-price-cap'
  | 'gen-anti-scam'
  | 'gen-data-privacy'
  | 'buy-how-to-purchase'
  | 'buy-checkout-timer'
  | 'buy-cash-network-timer'
  | 'buy-change-payment-method'
  | 'buy-commission'
  | 'buy-ticket-fails'
  | 'buy-event-cancelled'
  | 'buy-ticket-delivery'
  | 'sell-how-to-list'
  | 'sell-why-verify'
  | 'sell-verification-data'
  | 'sell-sale-notify'
  | 'sell-when-paid'
  | 'sell-instant-payout'
  | 'sell-how-withdraw'
  | 'sell-foreign-seller'
  | 'sell-commission'
  | 'sell-qr-not-released'
  | 'sell-qr-photo-privacy'
  | 'sell-wrong-category-fraud'
  | 'pay-methods'
  | 'pay-seller-withdraw'
  | 'pay-min-withdraw'
  | 'pay-escrow'
  | 'pay-commission-refund'
  | 'pay-more-methods';

export interface FAQItem {
  id: FaqItemId;
  question: string;
  answer: string;
}

const FAQ_EXAMPLE_TICKET_PRICE = 1000;

function formatMoneyEsUy(amount: number): string {
  return amount.toLocaleString('es-UY', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function formatIntegerEsUy(amount: number): string {
  return amount.toLocaleString('es-UY', {
    maximumFractionDigits: 0,
  });
}

/** Copy for FAQ examples; rates from VITE_PLATFORM_COMMISSION_RATE / VITE_VAT_RATE. */
function buildCommissionFaqAnswers(): {buyer: string; seller: string} {
  const feeRates = getFeeRates();
  const buyerBreakdown = calculateOrderFees(FAQ_EXAMPLE_TICKET_PRICE);
  const sellerBreakdown = calculateSellerAmount(
    FAQ_EXAMPLE_TICKET_PRICE,
    EventTicketCurrency.UYU,
  );
  const commissionPlusVat =
    buyerBreakdown.platformCommission + buyerBreakdown.vatOnCommission;
  const sellerDeductions =
    sellerBreakdown.platformCommission + sellerBreakdown.vatOnCommission;
  const priceLabel = `$${formatIntegerEsUy(FAQ_EXAMPLE_TICKET_PRICE)}`;

  const buyer = `La comisión es del ${feeRates.platformCommissionPercentage}% sobre el precio de la entrada, más el IVA correspondiente (${feeRates.vatPercentage}%). Por ejemplo, si la entrada cuesta ${priceLabel}, la comisión es $${formatMoneyEsUy(buyerBreakdown.platformCommission)} + IVA ($${formatMoneyEsUy(buyerBreakdown.vatOnCommission)}) = $${formatMoneyEsUy(commissionPlusVat)}. Total a pagar: $${formatMoneyEsUy(buyerBreakdown.totalAmount)}. Siempre vas a ver el desglose completo antes de confirmar la compra, sin costos ocultos.`;

  const seller = `La comisión es del ${feeRates.platformCommissionPercentage}% más IVA (${feeRates.vatPercentage}%), igual que para los compradores. Si vendés una entrada de ${priceLabel}, se te descuentan $${formatMoneyEsUy(sellerDeductions)} y recibís $${formatMoneyEsUy(sellerBreakdown.sellerAmount)}. El descuento se aplica automáticamente al momento de la liquidación.`;

  return {buyer, seller};
}

export const faqGeneral: FAQItem[] = [
  {
    id: 'gen-what-is-revendiste',
    question: '¿Qué es Revendiste?',
    answer:
      'Revendiste es una plataforma de compra y venta de entradas que conecta a personas que quieren vender con quienes las quieren comprar. No somos revendedores: somos intermediarios. Cuando la operación es entre personas, ofrecemos reventa segura: verificamos las entradas, custodiamos el dinero hasta que todo se complete y garantizamos una entrega segura. Comprá o vendé con total tranquilidad: eso buscamos.',
  },
  {
    id: 'gen-is-legal',
    question: '¿Es legal usar Revendiste?',
    answer:
      'Sí, completamente. Limitamos el precio máximo de reventa a un 15% sobre el valor original. Esto permite que los vendedores puedan recuperar las comisiones que pagaron en la plataforma original (que suelen ser del 10-12%), manteniendo al mismo tiempo precios justos para los compradores.',
  },
  {
    id: 'gen-resell-price-cap',
    question: '¿Puedo vender mi entrada a un precio mayor al que la pagué?',
    answer:
      'Sí, podés publicarla hasta un 15% por encima del valor original. Así podés recuperar las comisiones que pagaste al comprar la entrada, sin que se genere especulación. Por ejemplo, si pagaste $1.000 más $100 de comisión, podés publicarla hasta por $1.150.',
  },
  {
    id: 'gen-anti-scam',
    question: '¿Cómo sé que no me van a estafar?',
    answer:
      'Entendemos la preocupación, y por eso diseñamos un sistema de custodia. Cuando comprás una entrada, tu dinero queda retenido con nosotros y no se libera al vendedor hasta que el evento finalice y se confirme que todo estuvo en orden. Si la entrada resultó no ser válida, podés abrir un reporte directamente desde la sección "Mis Entradas" en tu cuenta, adjuntando la evidencia correspondiente. Nuestro equipo lo revisa y, si se confirma el problema, te devolvemos el dinero. También podés contactarnos desde nuestra página de contacto.',
  },
  {
    id: 'gen-data-privacy',
    question: '¿Qué tan seguros están mis datos personales?',
    answer:
      'La seguridad de tus datos es nuestra prioridad. Utilizamos cifrado AES-256 para proteger toda la información sensible, el mismo estándar que aplican bancos y entidades financieras. Los datos de verificación de identidad se almacenan de forma segura con acceso restringido exclusivamente a personal autorizado. Todo cumple con la Ley de Protección de Datos Personales de Uruguay (Ley N.o 18.331).',
  },
];

const faqCompradoresBase: FAQItem[] = [
  {
    id: 'buy-how-to-purchase',
    question: '¿Cómo compro una entrada?',
    answer:
      'Es muy sencillo: buscás el evento que te interesa, elegís la entrada que querés, pagás con el medio de pago disponible y listo. Recibís la entrada por email o podés descargarla desde tu cuenta. Todo el proceso es digital, sin necesidad de coordinación presencial.',
  },
  {
    id: 'buy-checkout-timer',
    question: '¿Cuánto tiempo tengo para pagar desde el checkout?',
    answer:
      'En la pantalla de checkout ves un cronómetro con el tiempo que tenés para completar el pago en Revendiste. Cuando ese tiempo se cumple, la reserva de las entradas puede liberarse y tendrías que crear una nueva orden si querés seguir comprando. Por eso conviene terminar el pago dentro de ese margen. Si ya iniciaste un pago y la procesadora de pagos sigue confirmándolo, la página puede actualizarse sola hasta que haya un resultado.',
  },
  {
    id: 'buy-cash-network-timer',
    question:
      '¿Cuánto tiempo tengo para pagar en efectivo o en una red como RedPagos?',
    answer:
      'Además del tiempo que ves en el checkout de Revendiste, la procesadora de pagos te muestra su propio plazo para completar el pago en el punto habilitado (por ejemplo una red de cobranzas). Revisá el cupón, el código o las instrucciones que aparecen al elegir ese medio: ahí figura hasta cuándo podés pagar en la agencia o lugar indicado. Si tenés dudas sobre fechas o montos del cupón, podés contactarnos en ayuda@revendiste.com.',
  },
  {
    id: 'buy-change-payment-method',
    question: '¿Puedo cambiar el medio de pago después de iniciar la compra?',
    answer:
      'Para usar otro medio tenés que cancelar la orden desde el checkout y empezar una compra nueva. Si ya iniciaste un pago alternativo (por ejemplo transferencia o efectivo) y querés cambiar de opción, no completes ese pago en la red del proveedor y cancelá la orden en Revendiste. Así liberás la reserva y podés volver a intentar con la opción que prefieras.',
  },
  {
    id: 'buy-commission',
    question: '¿Cuánto me cobran de comisión?',
    answer: '',
  },
  {
    id: 'buy-ticket-fails',
    question: '¿Qué pasa si la entrada no funciona?',
    answer:
      'Si al llegar al evento la entrada no te permite ingresar por un problema atribuible al vendedor (entrada inválida, duplicada, etc.), tenés 48 horas después de la finalización del evento para abrir un reporte. Podés hacerlo desde la sección "Mis Entradas" en tu cuenta: seleccionás la entrada con problemas, elegís el motivo del reporte y adjuntás la evidencia (captura del rechazo en puerta, por ejemplo). Nuestro equipo revisa cada caso y, si se confirma que fue responsabilidad del vendedor, te devolvemos el dinero. Podés seguir el estado de tu reporte en todo momento desde tu cuenta.',
  },
  {
    id: 'buy-event-cancelled',
    question: '¿Qué pasa si se cancela el evento?',
    answer:
      'En caso de cancelación, el proceso de reembolso depende de lo que determine el organizador oficial del evento. Desde Revendiste te mantenemos informado y, cuando corresponde, procesamos las devoluciones según las condiciones aplicables. Si tenés dudas sobre un evento cancelado, podés abrir un reporte desde "Mis Entradas" o escribirnos desde nuestra página de contacto.',
  },
  {
    id: 'buy-ticket-delivery',
    question: '¿Cuándo me llega la entrada?',
    answer:
      'Depende del caso. Algunas entradas se entregan de forma inmediata después del pago. Otras, especialmente cuando la plataforma original aún no liberó el QR, pueden demorar un poco más. En todos los casos, te notificamos por email en cuanto tu entrada esté lista para descargar. Si se acerca la fecha del evento y aún no recibiste tu entrada, podés abrir un reporte desde "Mis Entradas" en tu cuenta o contactarnos desde nuestra página de contacto para que lo revisemos.',
  },
];

export function getFaqCompradores(): FAQItem[] {
  const {buyer} = buildCommissionFaqAnswers();
  return faqCompradoresBase.map(item =>
    item.id === 'buy-commission' ? {...item, answer: buyer} : item,
  );
}

const faqVendedoresBase: FAQItem[] = [
  {
    id: 'sell-how-to-list',
    question: '¿Cómo publico mi entrada?',
    answer:
      'Primero completás la verificación de identidad (es un proceso rápido desde tu celular). Después, publicás tu entrada con la información correspondiente: evento, fecha, sector, categoría/tanda y precio. Podés fijar un precio de hasta un 15% sobre el valor original para recuperar las comisiones que pagaste. Cuando alguien la compre, te avisamos para que hagas la entrega.',
  },
  {
    id: 'sell-why-verify',
    question: '¿Por qué me piden verificar mi identidad?',
    answer:
      'La verificación de identidad es una medida clave para prevenir fraudes. El proceso consta de dos pasos: primero subís una foto de tu documento y luego realizás una verificación de vida (liveness) desde tu celular para confirmar que sos vos. Esto protege a los compradores y también te beneficia a vos, ya que genera mayor confianza en la plataforma.',
  },
  {
    id: 'sell-verification-data',
    question: '¿Mis datos de verificación están seguros?',
    answer:
      'Sí. Las imágenes de tu documento y verificación facial se almacenan con cifrado AES-256, el mismo estándar que utilizan bancos y entidades financieras. Solo personal autorizado puede acceder a esta información en casos excepcionales de revisión de seguridad. Conservamos los datos de forma segura para la prevención de fraudes, el cumplimiento de obligaciones legales y la realización de auditorías de seguridad.',
  },
  {
    id: 'sell-sale-notify',
    question: '¿Me avisan cuando compran mis entradas?',
    answer:
      'Sí. Cuando alguien compra tus entradas te enviamos un correo electrónico y también vas a ver notificaciones en tu cuenta. Desde ahí seguís los pasos para cargar los documentos que necesita el comprador según el tipo de entrada y el evento.',
  },
  {
    id: 'sell-when-paid',
    question: '¿Cuándo me pagan?',
    answer:
      'Tus ganancias pasan a estar disponibles para retirar después de que termina el evento y se cumple un período de custodia (ventana para que el comprador pueda reportar un problema). No es un pago automático: tenés que ir a Cuenta → Retiros, elegir las ganancias y pedir el retiro. El equipo procesa los retiros manualmente en días hábiles a tu cuenta bancaria en Uruguay; en general podés esperar 1 a 3 días hábiles desde que lo pedís.',
  },
  {
    id: 'sell-instant-payout',
    question:
      '¿Cuando venden mis entradas recibo el dinero en mi cuenta al instante?',
    answer:
      'No. Cuando la venta se confirma, el monto queda en custodia en Revendiste: es una garantía para el comprador hasta que termina el evento y pasa el período en el que puede reportar un problema si algo falló. Recién después ese saldo queda disponible para que solicites el retiro a tu cuenta bancaria en Uruguay. No es un ingreso inmediato en tu cuenta el mismo día de la venta.',
  },
  {
    id: 'sell-how-withdraw',
    question: '¿Cómo solicito un retiro?',
    answer:
      'Entrá a tu cuenta, sección Retiros. Seleccioná las ganancias que querés retirar (por publicación o por entrada). Elegí un método de cobro compatible (cuenta bancaria en Uruguay en la misma moneda que tus ganancias: UYU o USD), confirmá la solicitud y listo. Te avisamos cuando el retiro esté procesado. Por ahora no ofrecemos cuentas del exterior ni otros canales de cobro.',
  },
  {
    id: 'sell-foreign-seller',
    question: 'Soy extranjero, ¿puedo vender en Revendiste?',
    answer:
      'Sí, podés vender si completás la verificación de identidad como cualquier vendedor. Para cobrar necesitás una cuenta bancaria en Uruguay en la misma moneda que tus ganancias (UYU o USD). No ofrecemos transferencias bancarias internacionales ni otros canales de cobro por fuera de Uruguay. Estamos trabajando para habilitar cobros a cuentas en Argentina y Brasil próximamente.',
  },
  {
    id: 'sell-commission',
    question: '¿Cuánto me cobran de comisión como vendedor?',
    answer: '',
  },
  {
    id: 'sell-qr-not-released',
    question:
      '¿Qué pasa si todavía no tengo el QR porque la plataforma no lo liberó?',
    answer:
      'Podés publicar tu entrada de todas formas. Tenés plazo hasta la hora de finalización del evento para cargar la entrada en la plataforma. Sabemos que algunas ticketeras liberan los QR con poco tiempo de anticipación. Si tenés algún inconveniente de fuerza mayor, contactanos desde nuestra página de contacto o escribinos a ayuda@revendiste.com y buscamos una solución.',
  },
  {
    id: 'sell-qr-photo-privacy',
    question:
      '¿En la foto o PDF de la entrada ya subo el QR? ¿Es seguro? ¿No queda público?',
    answer:
      'Sí: cuando el proceso te pide el QR o el PDF, subí el archivo con el código bien visible y legible. Lo necesitamos para validar la operación y entregarla al comprador de forma digital cuando corresponde. Esa imagen o archivo no se muestra en la página pública del evento: no cualquiera puede verlo ni descargarlo. Queda almacenado de forma segura. El personal de Revendiste no puede verlo; solo vos, desde tu cuenta al gestionar la publicación, y el comprador, desde la suya una vez hecha la compra. Igual, no compartas el QR por fuera de Revendiste (redes, grupos o chats abiertos), porque ahí sí perdés el control sobre quién lo puede usar.',
  },
  {
    id: 'sell-wrong-category-fraud',
    question:
      '¿Qué pasa si selecciono mal la categoría de la entrada a propósito?',
    answer:
      'Declarar información incorrecta de forma deliberada, como publicar una entrada de "Preventa" como "Tanda General" para obtener un precio mayor, constituye fraude. En estos casos, Revendiste procede a la suspensión de la cuenta, la retención de los fondos asociados y, cuando corresponda, el inicio de las acciones legales pertinentes. La transparencia en la información es fundamental para mantener una plataforma segura para todos.',
  },
];

export function getFaqVendedores(): FAQItem[] {
  const {seller} = buildCommissionFaqAnswers();
  return faqVendedoresBase.map(item =>
    item.id === 'sell-commission' ? {...item, answer: seller} : item,
  );
}

export const faqPagos: FAQItem[] = [
  {
    id: 'pay-methods',
    question: '¿Qué métodos de pago aceptan?',
    answer:
      'Los medios disponibles dependen del país que seleccionás en el checkout y de lo que habilita nuestra procesadora de pagos en ese momento: suele incluir tarjetas y, cuando corresponde, opciones como transferencia o pago en efectivo o en redes de cobranzas (según región). Solo ves lo que aplica a tu caso en la pantalla de pago. Si tu pregunta es cuánto tenés para pagar en una red como RedPagos, el plazo concreto figura en el cupón o las instrucciones que te muestra la procesadora además del tiempo del checkout en Revendiste.',
  },
  {
    id: 'pay-seller-withdraw',
    question: '¿Cómo retiro mi dinero si soy vendedor?',
    answer:
      'Configurás tus métodos en Cuenta → Retiros. Por ahora solo podés cobrar por transferencia a una cuenta bancaria en Uruguay, en la misma moneda que tus ganancias (UYU o USD, según la cuenta). Elegís el método al momento de solicitar cada retiro.',
  },
  {
    id: 'pay-min-withdraw',
    question: '¿Hay un monto mínimo para retirar?',
    answer:
      'Sí. El mínimo es 1.000 UYU para retiros en pesos uruguayos y 25 USD para retiros en dólares.',
  },
  {
    id: 'pay-escrow',
    question: '¿Qué es la custodia de fondos?',
    answer:
      'Cuando un comprador realiza un pago, el dinero no va directamente al vendedor. Revendiste lo retiene en custodia hasta que la operación se complete sin inconvenientes, es decir, hasta que el comprador utilice la entrada sin problemas. Si surge algún inconveniente, el comprador puede abrir un reporte desde su cuenta y nuestro equipo revisa el caso antes de liberar los fondos. Este mecanismo protege a ambas partes: el comprador tiene la garantía de que puede recuperar su dinero si algo falla, y el vendedor tiene la certeza de que cobra cuando la transacción se concreta correctamente.',
  },
  {
    id: 'pay-commission-refund',
    question: '¿Me devuelven la comisión si hay un problema?',
    answer:
      'La comisión de Revendiste corresponde al servicio de intermediación ya prestado (verificación, custodia, entrega, etc.), por lo que no es reembolsable. Lo que sí se reembolsa es el precio de la entrada en caso de que exista un reclamo válido. Para iniciar un reclamo, abrí un reporte desde la sección "Mis Entradas" en tu cuenta. Si tenés dudas sobre el proceso, visitá nuestra página de contacto.',
  },
  {
    id: 'pay-more-methods',
    question: '¿Van a sumar más formas de cobrar?',
    answer:
      'Sí. Por ahora los retiros se procesan manualmente y solo a cuentas bancarias en Uruguay (UYU o USD). Estamos trabajando para habilitar pagos automáticos a cuentas bancarias en Uruguay, Argentina y Brasil. No usamos PayPal ni ofrecemos transferencias internacionales.',
  },
];

function buildFaqById(): Map<FaqItemId, FAQItem> {
  const map = new Map<FaqItemId, FAQItem>();
  const add = (items: FAQItem[]) => {
    for (const item of items) {
      map.set(item.id, item);
    }
  };
  add(faqGeneral);
  add(getFaqCompradores());
  add(getFaqVendedores());
  add(faqPagos);
  return map;
}

/** Full list for /preguntas-frecuentes FAQPage JSON-LD. */
export function getAllFaqItemsForSchema(): FAQItem[] {
  return [
    ...faqGeneral,
    ...getFaqCompradores(),
    ...getFaqVendedores(),
    ...faqPagos,
  ];
}

/** Ordered subset for event detail FAQPage JSON-LD (stable ids, not question text). */
const EVENT_PAGE_FAQ_IDS = [
  'gen-what-is-revendiste',
  'buy-how-to-purchase',
  'buy-commission',
  'buy-ticket-fails',
  'buy-event-cancelled',
  'buy-ticket-delivery',
  'sell-how-to-list',
  'sell-commission',
  'pay-escrow',
] as const satisfies readonly FaqItemId[];

/**
 * Subset for event detail pages: buying/selling/trust around a specific event.
 * (Event name is not injected into answers — kept generic for JSON-LD reuse.)
 */
export function getEventPageFaqItems(): FAQItem[] {
  const byId = buildFaqById();
  return EVENT_PAGE_FAQ_IDS.map(id => {
    const item = byId.get(id);
    if (!item) {
      throw new Error(`Event FAQ subset references missing id: ${id}`);
    }
    return item;
  });
}
