import {createFileRoute, Link, useNavigate} from '@tanstack/react-router';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '~/components/ui/accordion';
import {Tabs, TabsContent, TabsList, TabsTrigger} from '~/components/ui/tabs';
import {Card, CardContent} from '~/components/ui/card';
import {Button} from '~/components/ui/button';
import {Input} from '~/components/ui/input';
import {z} from 'zod';
import {useEffect, useMemo, useRef, useState} from 'react';
import {cn} from '~/lib/utils';
import {alternateHreflangEsUy, seo} from '~/utils/seo';
import {getBaseUrl} from '~/config/env';
import {EventTicketCurrency} from '~/lib';
import {calculateOrderFees, calculateSellerAmount, getFeeRates} from '~/utils';
import {
  HelpCircle,
  ShoppingCart,
  Tag,
  CreditCard,
  Search,
  Mail,
  ArrowRight,
  MessageCircle,
} from 'lucide-react';

const faqSections = [
  'general',
  'compradores',
  'publicadores',
  'pagos',
] as const;
type FAQSection = (typeof faqSections)[number];

const faqSearchSchema = z.object({
  seccion: z.enum(faqSections).optional().catch(undefined),
  pregunta: z.coerce.number().int().min(0).optional().catch(undefined),
});

export const Route = createFileRoute('/preguntas-frecuentes')({
  component: FAQPage,
  validateSearch: faqSearchSchema,
  head: () => {
    const baseUrl = getBaseUrl();

    const allFaqItems = [
      ...faqGeneral,
      ...getFaqCompradores(),
      ...getFaqVendedores(),
      ...faqPagos,
    ];
    const faqSchema = {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: allFaqItems.map(item => ({
        '@type': 'Question',
        name: item.question,
        acceptedAnswer: {
          '@type': 'Answer',
          text: item.answer,
        },
      })),
    };

    return {
      meta: seo({
        title: 'Preguntas Frecuentes | Revendiste - Compra y venta de entradas',
        description:
          'Dudas sobre cómo comprar o vender entradas en Revendiste? Acá te explicamos todo: comisiones, pagos, plazos de entrega, garantías y más.',
        baseUrl,
      }),
      links: [
        alternateHreflangEsUy(`${baseUrl}/preguntas-frecuentes`),
        {rel: 'canonical', href: `${baseUrl}/preguntas-frecuentes`},
      ],
      scripts: [
        {
          type: 'application/ld+json',
          children: JSON.stringify(faqSchema),
        },
      ],
    };
  },
});

interface FAQItem {
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

const BUYER_COMMISSION_FAQ_QUESTION = '¿Cuánto me cobran de comisión?';
const SELLER_COMMISSION_FAQ_QUESTION =
  '¿Cuánto me cobran de comisión como vendedor?';

const faqGeneral: FAQItem[] = [
  {
    question: '¿Qué es Revendiste?',
    answer:
      'Revendiste es una plataforma de compra y venta de entradas que conecta a personas que quieren vender con quienes las quieren comprar. No somos revendedores: somos intermediarios. Cuando la operación es entre personas, ofrecemos reventa segura: verificamos las entradas, custodiamos el dinero hasta que todo se complete y garantizamos una entrega segura. Comprá o vendé con total tranquilidad: eso buscamos.',
  },
  {
    question: '¿Es legal usar Revendiste?',
    answer:
      'Sí, completamente. Limitamos el precio máximo de reventa a un 15% sobre el valor original. Esto permite que los vendedores puedan recuperar las comisiones que pagaron en la plataforma original (que suelen ser del 10-12%), manteniendo al mismo tiempo precios justos para los compradores.',
  },
  {
    question: '¿Puedo vender mi entrada a un precio mayor al que la pagué?',
    answer:
      'Sí, podés publicarla hasta un 15% por encima del valor original. Así podés recuperar las comisiones que pagaste al comprar la entrada, sin que se genere especulación. Por ejemplo, si pagaste $1.000 más $100 de comisión, podés publicarla hasta por $1.150.',
  },
  {
    question: '¿Cómo sé que no me van a estafar?',
    answer:
      'Entendemos la preocupación, y por eso diseñamos un sistema de custodia. Cuando comprás una entrada, tu dinero queda retenido con nosotros y no se libera al vendedor hasta que el evento finalice y se confirme que todo estuvo en orden. Si la entrada resultó no ser válida, podés abrir un reporte directamente desde la sección "Mis Entradas" en tu cuenta, adjuntando la evidencia correspondiente. Nuestro equipo lo revisa y, si se confirma el problema, te devolvemos el dinero. También podés contactarnos desde nuestra página de contacto.',
  },
  {
    question: '¿Qué tan seguros están mis datos personales?',
    answer:
      'La seguridad de tus datos es nuestra prioridad. Utilizamos cifrado AES-256 para proteger toda la información sensible, el mismo estándar que aplican bancos y entidades financieras. Los datos de verificación de identidad se almacenan de forma segura con acceso restringido exclusivamente a personal autorizado. Todo cumple con la Ley de Protección de Datos Personales de Uruguay (Ley N.o 18.331).',
  },
];

const faqCompradoresBase: FAQItem[] = [
  {
    question: '¿Cómo compro una entrada?',
    answer:
      'Es muy sencillo: buscás el evento que te interesa, elegís la entrada que querés, pagás con el medio de pago disponible y listo. Recibís la entrada por email o podés descargarla desde tu cuenta. Todo el proceso es digital, sin necesidad de coordinación presencial.',
  },
  {
    question: BUYER_COMMISSION_FAQ_QUESTION,
    answer: '',
  },
  {
    question: '¿Qué pasa si la entrada no funciona?',
    answer:
      'Si al llegar al evento la entrada no te permite ingresar por un problema atribuible al vendedor (entrada inválida, duplicada, etc.), tenés 48 horas después de la finalización del evento para abrir un reporte. Podés hacerlo desde la sección "Mis Entradas" en tu cuenta: seleccionás la entrada con problemas, elegís el motivo del reporte y adjuntás la evidencia (captura del rechazo en puerta, por ejemplo). Nuestro equipo revisa cada caso y, si se confirma que fue responsabilidad del vendedor, te devolvemos el dinero. Podés seguir el estado de tu reporte en todo momento desde tu cuenta.',
  },
  {
    question: '¿Qué pasa si se cancela el evento?',
    answer:
      'En caso de cancelación, el proceso de reembolso depende de lo que determine el organizador oficial del evento. Desde Revendiste te mantenemos informado y, cuando corresponde, procesamos las devoluciones según las condiciones aplicables. Si tenés dudas sobre un evento cancelado, podés abrir un reporte desde "Mis Entradas" o escribirnos desde nuestra página de contacto.',
  },
  {
    question: '¿Cuándo me llega la entrada?',
    answer:
      'Depende del caso. Algunas entradas se entregan de forma inmediata después del pago. Otras, especialmente cuando la plataforma original aún no liberó el QR, pueden demorar un poco más. En todos los casos, te notificamos por email en cuanto tu entrada esté lista para descargar. Si se acerca la fecha del evento y aún no recibiste tu entrada, podés abrir un reporte desde "Mis Entradas" en tu cuenta o contactarnos desde nuestra página de contacto para que lo revisemos.',
  },
];

function getFaqCompradores(): FAQItem[] {
  const {buyer} = buildCommissionFaqAnswers();
  return faqCompradoresBase.map(item =>
    item.question === BUYER_COMMISSION_FAQ_QUESTION
      ? {...item, answer: buyer}
      : item,
  );
}

const faqVendedoresBase: FAQItem[] = [
  {
    question: '¿Cómo publico mi entrada?',
    answer:
      'Primero completás la verificación de identidad (es un proceso rápido desde tu celular). Después, publicás tu entrada con la información correspondiente: evento, fecha, sector, categoría/tanda y precio. Podés fijar un precio de hasta un 15% sobre el valor original para recuperar las comisiones que pagaste. Cuando alguien la compre, te avisamos para que hagas la entrega.',
  },
  {
    question: '¿Por qué me piden verificar mi identidad?',
    answer:
      'La verificación de identidad es una medida clave para prevenir fraudes. El proceso consta de dos pasos: primero subís una foto de tu documento y luego realizás una verificación de vida (liveness) desde tu celular para confirmar que sos vos. Esto protege a los compradores y también te beneficia a vos, ya que genera mayor confianza en la plataforma.',
  },
  {
    question: '¿Mis datos de verificación están seguros?',
    answer:
      'Sí. Las imágenes de tu documento y verificación facial se almacenan con cifrado AES-256, el mismo estándar que utilizan bancos y entidades financieras. Solo personal autorizado puede acceder a esta información en casos excepcionales de revisión de seguridad. Conservamos los datos de forma segura para la prevención de fraudes, el cumplimiento de obligaciones legales y la realización de auditorías de seguridad.',
  },
  {
    question: '¿Cuándo me pagan?',
    answer:
      'Tus ganancias pasan a estar disponibles para retirar después de que termina el evento y se cumple un período de custodia (ventana para que el comprador pueda reportar un problema). No es un pago automático: tenés que ir a Cuenta → Retiros, elegir las ganancias y pedir el retiro. El equipo procesa los retiros manualmente en días hábiles a tu cuenta bancaria en Uruguay; en general podés esperar 1 a 3 días hábiles desde que lo pedís.',
  },
  {
    question: '¿Cómo solicito un retiro?',
    answer:
      'Entrá a tu cuenta, sección Retiros. Seleccioná las ganancias que querés retirar (por publicación o por entrada). Elegí un método de cobro compatible (cuenta bancaria en Uruguay en la misma moneda que tus ganancias: UYU o USD), confirmá la solicitud y listo. Te avisamos cuando el retiro esté procesado. Por ahora no ofrecemos cuentas del exterior ni otros canales de cobro.',
  },
  {
    question: 'Soy extranjero, ¿puedo vender en Revendiste?',
    answer:
      'Sí, podés vender si completás la verificación de identidad como cualquier vendedor. Para cobrar necesitás una cuenta bancaria en Uruguay en la misma moneda que tus ganancias (UYU o USD). No ofrecemos transferencias bancarias internacionales ni otros canales de cobro por fuera de Uruguay. Estamos trabajando para habilitar cobros a cuentas en Argentina y Brasil próximamente.',
  },
  {
    question: SELLER_COMMISSION_FAQ_QUESTION,
    answer: '',
  },
  {
    question:
      '¿Qué pasa si todavía no tengo el QR porque la plataforma no lo liberó?',
    answer:
      'Podés publicar tu entrada de todas formas. Tenés plazo hasta la hora de finalización del evento para cargar la entrada en la plataforma. Sabemos que algunas ticketeras liberan los QR con poco tiempo de anticipación. Si tenés algún inconveniente de fuerza mayor, contactanos desde nuestra página de contacto o escribinos a ayuda@revendiste.com y buscamos una solución.',
  },
  {
    question:
      '¿En la foto o PDF de la entrada ya subo el QR? ¿Es seguro? ¿No queda público?',
    answer:
      'Sí: cuando el proceso te pide el QR o el PDF, subí el archivo con el código bien visible y legible. Lo necesitamos para validar la operación y entregarla al comprador de forma digital cuando corresponde. Esa imagen o archivo no se muestra en la página pública del evento: no cualquiera puede verlo ni descargarlo. Queda almacenado de forma segura. El personal de Revendiste no puede verlo; solo vos, desde tu cuenta al gestionar la publicación, y el comprador, desde la suya una vez hecha la compra. Igual, no compartas el QR por fuera de Revendiste (redes, grupos o chats abiertos), porque ahí sí perdés el control sobre quién lo puede usar.',
  },
  {
    question:
      '¿Qué pasa si selecciono mal la categoría de la entrada a propósito?',
    answer:
      'Declarar información incorrecta de forma deliberada, como publicar una entrada de "Preventa" como "Tanda General" para obtener un precio mayor, constituye fraude. En estos casos, Revendiste procede a la suspensión de la cuenta, la retención de los fondos asociados y, cuando corresponda, el inicio de las acciones legales pertinentes. La transparencia en la información es fundamental para mantener una plataforma segura para todos.',
  },
];

function getFaqVendedores(): FAQItem[] {
  const {seller} = buildCommissionFaqAnswers();
  return faqVendedoresBase.map(item =>
    item.question === SELLER_COMMISSION_FAQ_QUESTION
      ? {...item, answer: seller}
      : item,
  );
}

const faqPagos: FAQItem[] = [
  {
    question: '¿Qué métodos de pago aceptan?',
    answer:
      'Aceptamos los medios de pago que se muestran habilitados al momento del checkout, generalmente tarjetas de crédito y débito. Estamos trabajando para incorporar más opciones de pago próximamente.',
  },
  {
    question: '¿Cómo retiro mi dinero si soy vendedor?',
    answer:
      'Configurás tus métodos en Cuenta → Retiros. Por ahora solo podés cobrar por transferencia a una cuenta bancaria en Uruguay, en la misma moneda que tus ganancias (UYU o USD, según la cuenta). Elegís el método al momento de solicitar cada retiro.',
  },
  {
    question: '¿Hay un monto mínimo para retirar?',
    answer:
      'Sí. El mínimo es 1.000 UYU para retiros en pesos uruguayos y 25 USD para retiros en dólares.',
  },
  {
    question: '¿Qué es la custodia de fondos?',
    answer:
      'Cuando un comprador realiza un pago, el dinero no va directamente al vendedor. Revendiste lo retiene en custodia hasta que la operación se complete sin inconvenientes, es decir, hasta que el comprador utilice la entrada sin problemas. Si surge algún inconveniente, el comprador puede abrir un reporte desde su cuenta y nuestro equipo revisa el caso antes de liberar los fondos. Este mecanismo protege a ambas partes: el comprador tiene la garantía de que puede recuperar su dinero si algo falla, y el vendedor tiene la certeza de que cobra cuando la transacción se concreta correctamente.',
  },
  {
    question: '¿Me devuelven la comisión si hay un problema?',
    answer:
      'La comisión de Revendiste corresponde al servicio de intermediación ya prestado (verificación, custodia, entrega, etc.), por lo que no es reembolsable. Lo que sí se reembolsa es el precio de la entrada en caso de que exista un reclamo válido. Para iniciar un reclamo, abrí un reporte desde la sección "Mis Entradas" en tu cuenta. Si tenés dudas sobre el proceso, visitá nuestra página de contacto.',
  },
  {
    question: '¿Van a sumar más formas de cobrar?',
    answer:
      'Sí. Por ahora los retiros se procesan manualmente y solo a cuentas bancarias en Uruguay (UYU o USD). Estamos trabajando para habilitar pagos automáticos a cuentas bancarias en Uruguay, Argentina y Brasil. No usamos PayPal ni ofrecemos transferencias internacionales.',
  },
];

function getSectionConfig(): Record<
  FAQSection,
  {label: string; icon: typeof HelpCircle; items: FAQItem[]}
> {
  return {
    general: {label: 'General', icon: HelpCircle, items: faqGeneral},
    compradores: {
      label: 'Compradores',
      icon: ShoppingCart,
      items: getFaqCompradores(),
    },
    publicadores: {
      label: 'Publicadores',
      icon: Tag,
      items: getFaqVendedores(),
    },
    pagos: {label: 'Pagos', icon: CreditCard, items: faqPagos},
  };
}

interface FAQSectionProps {
  items: FAQItem[];
  openItem?: number;
  highlightedItem?: number;
  onOpenChange?: (index: number | undefined) => void;
}

function FAQSectionAccordion({
  items,
  openItem,
  highlightedItem,
  onOpenChange,
}: FAQSectionProps) {
  const itemRefs = useRef<(HTMLDivElement | null)[]>([]);

  // Scroll to highlighted item on mount
  useEffect(() => {
    if (highlightedItem !== undefined && itemRefs.current[highlightedItem]) {
      setTimeout(() => {
        itemRefs.current[highlightedItem]?.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
        });
      }, 100);
    }
  }, [highlightedItem]);

  return (
    <Accordion
      type='single'
      collapsible
      className='w-full space-y-2'
      value={openItem !== undefined ? `item-${openItem}` : undefined}
      onValueChange={value => {
        if (onOpenChange) {
          const index = value
            ? parseInt(value.replace('item-', ''), 10)
            : undefined;
          onOpenChange(index);
        }
      }}
    >
      {items.map((item, index) => (
        <AccordionItem
          key={index}
          value={`item-${index}`}
          ref={el => {
            itemRefs.current[index] = el;
          }}
          className={cn(
            'rounded-lg border bg-card px-4 transition-all duration-300',
            'hover:shadow-sm hover:border-primary/20',
            'data-[state=open]:shadow-sm data-[state=open]:border-primary/30',
            highlightedItem === index &&
              'bg-primary/5 ring-2 ring-primary/20 border-primary/30',
          )}
        >
          <AccordionTrigger className='text-left py-4 text-[15px] font-medium hover:no-underline'>
            {item.question}
          </AccordionTrigger>
          <AccordionContent className='text-muted-foreground leading-relaxed pb-4 text-sm'>
            {item.answer}
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
}

function FAQPage() {
  const {seccion, pregunta} = Route.useSearch();
  const navigate = useNavigate({from: Route.fullPath});
  const [searchQuery, setSearchQuery] = useState('');

  const sectionConfig = useMemo(() => getSectionConfig(), []);

  // Determine active tab - default to 'general'
  const activeTab = seccion ?? 'general';

  // Get the items for the active section to validate pregunta
  const activeItems = sectionConfig[activeTab].items;
  const validPregunta =
    pregunta !== undefined && pregunta >= 0 && pregunta < activeItems.length
      ? pregunta
      : undefined;

  // Local state for the open accordion item, synced from URL on mount/change
  const [openItem, setOpenItem] = useState<number | undefined>(validPregunta);

  // Sync from URL -> local state when URL params change (e.g. direct navigation)
  useEffect(() => {
    setOpenItem(validPregunta);
  }, [validPregunta]);

  // Filter items based on search query
  const filteredResults = useMemo(() => {
    if (!searchQuery.trim()) return null;

    const normalize = (s: string) =>
      s
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '');
    const query = normalize(searchQuery);
    const results: {section: FAQSection; items: FAQItem[]}[] = [];

    for (const [key, config] of Object.entries(sectionConfig)) {
      const matched = config.items.filter(
        item =>
          normalize(item.question).includes(query) ||
          normalize(item.answer).includes(query),
      );
      if (matched.length > 0) {
        results.push({section: key as FAQSection, items: matched});
      }
    }

    return results;
  }, [searchQuery, sectionConfig]);

  const handleTabChange = (value: string) => {
    setSearchQuery('');
    setOpenItem(undefined);
    navigate({
      search: prev => ({
        ...prev,
        seccion: value as FAQSection,
        pregunta: undefined,
      }),
      replace: true,
    });
  };

  const handleQuestionChange = (index: number | undefined) => {
    setOpenItem(index);
    navigate({
      search: prev => ({
        ...prev,
        pregunta: index,
      }),
      replace: true,
    });
  };

  const isSearching = searchQuery.trim().length > 0;

  return (
    <main className='min-h-screen bg-background-secondary'>
      <div className='container mx-auto max-w-4xl px-4 py-8 md:py-16'>
        {/* Header */}
        <div className='text-center mb-8 md:mb-12'>
          <div className='inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary/10 mb-4'>
            <MessageCircle className='w-7 h-7 text-primary' />
          </div>
          <h1 className='text-3xl md:text-4xl font-bold tracking-tight mb-3'>
            Preguntas Frecuentes
          </h1>
          <p className='text-muted-foreground max-w-xl mx-auto text-balance'>
            Encontrá respuestas a las dudas más comunes sobre Revendiste. Si
            necesitás ayuda adicional, escribinos a{' '}
            <a
              href='mailto:ayuda@revendiste.com'
              className='text-primary hover:underline font-medium'
            >
              ayuda@revendiste.com
            </a>
          </p>
        </div>

        {/* Search */}
        <div className='relative mb-6'>
          <Search className='absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground' />
          <Input
            type='text'
            placeholder='Buscá tu pregunta...'
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className='pl-10 h-11 bg-card'
          />
        </div>

        {/* Search Results */}
        {isSearching ? (
          <div className='space-y-6'>
            {filteredResults && filteredResults.length > 0 ? (
              filteredResults.map(({section, items}) => {
                const config = sectionConfig[section];
                const Icon = config.icon;
                return (
                  <div key={section}>
                    <div className='flex items-center gap-2 mb-3'>
                      <Icon className='w-4 h-4 text-muted-foreground' />
                      <h3 className='text-sm font-medium text-muted-foreground'>
                        {config.label}
                      </h3>
                    </div>
                    <FAQSectionAccordion items={items} />
                  </div>
                );
              })
            ) : (
              <Card>
                <CardContent className='py-12 text-center'>
                  <Search className='w-10 h-10 text-muted-foreground/40 mx-auto mb-3' />
                  <p className='text-muted-foreground font-medium'>
                    No encontramos resultados para &ldquo;{searchQuery}&rdquo;
                  </p>
                  <p className='text-muted-foreground/70 text-sm mt-1'>
                    Probá con otras palabras o escribinos a{' '}
                    <a
                      href='mailto:ayuda@revendiste.com'
                      className='text-primary hover:underline'
                    >
                      ayuda@revendiste.com
                    </a>
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        ) : (
          /* FAQ Tabs */
          <Card className='overflow-hidden'>
            <CardContent className='p-0'>
              <Tabs
                value={activeTab}
                onValueChange={handleTabChange}
                className='w-full'
              >
                <div className='border-b bg-muted/30 p-2 md:p-3'>
                  <TabsList className='grid w-full grid-cols-2 md:grid-cols-4 h-auto gap-1.5 bg-transparent'>
                    {faqSections.map(section => {
                      const config = sectionConfig[section];
                      const Icon = config.icon;
                      return (
                        <TabsTrigger
                          key={section}
                          value={section}
                          className={cn(
                            'flex items-center gap-1.5 py-2.5 px-3 text-xs md:text-sm rounded-lg transition-all',
                            'data-[state=active]:bg-card data-[state=active]:shadow-sm data-[state=active]:text-foreground',
                            'data-[state=inactive]:text-muted-foreground data-[state=inactive]:hover:text-foreground data-[state=inactive]:hover:bg-card/50',
                          )}
                        >
                          <Icon className='w-4 h-4 shrink-0' />
                          <span>{config.label}</span>
                        </TabsTrigger>
                      );
                    })}
                  </TabsList>
                </div>

                <div className='p-4 md:p-6'>
                  {faqSections.map(section => (
                    <TabsContent key={section} value={section} className='mt-0'>
                      <FAQSectionAccordion
                        items={sectionConfig[section].items}
                        openItem={activeTab === section ? openItem : undefined}
                        highlightedItem={
                          activeTab === section ? validPregunta : undefined
                        }
                        onOpenChange={handleQuestionChange}
                      />
                    </TabsContent>
                  ))}
                </div>
              </Tabs>
            </CardContent>
          </Card>
        )}

        {/* Contact CTA */}
        <Card className='mt-8 border-primary/10 bg-linear-to-br from-primary/5 via-card to-card overflow-hidden'>
          <CardContent className='py-8 px-6 md:px-8'>
            <div className='flex flex-col md:flex-row items-center gap-6 md:gap-8'>
              <div className='flex items-center justify-center w-12 h-12 rounded-xl bg-primary/10 shrink-0'>
                <Mail className='w-6 h-6 text-primary' />
              </div>
              <div className='text-center md:text-left flex-1'>
                <h2 className='font-semibold text-lg mb-1'>
                  ¿No encontraste lo que buscabas?
                </h2>
                <p className='text-muted-foreground text-sm'>
                  Escribinos y te respondemos a la brevedad. Estamos para
                  ayudarte.
                </p>
              </div>
              <Button asChild size='lg' className='shrink-0 group'>
                <Link to='/contacto'>
                  Contactanos
                  <ArrowRight className='w-4 h-4 ml-2 transition-transform group-hover:translate-x-0.5' />
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
