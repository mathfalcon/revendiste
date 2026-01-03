import {createFileRoute, Link} from '@tanstack/react-router';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '~/components/ui/accordion';
import {Tabs, TabsContent, TabsList, TabsTrigger} from '~/components/ui/tabs';
import {Card, CardContent} from '~/components/ui/card';
import {Button} from '~/components/ui/button';

export const Route = createFileRoute('/preguntas-frecuentes')({
  component: FAQPage,
  head: () => ({
    meta: [
      {
        title: 'Preguntas Frecuentes | Revendiste',
      },
      {
        name: 'description',
        content:
          'Encontrá respuestas a las preguntas más comunes sobre cómo comprar y vender entradas en Revendiste.',
      },
    ],
  }),
});

interface FAQItem {
  question: string;
  answer: string;
}

const faqGeneral: FAQItem[] = [
  {
    question: '¿Qué es Revendiste?',
    answer:
      'Revendiste es una plataforma que conecta personas que quieren vender sus entradas con personas que las quieren comprar. Nosotros no somos revendedores, somos intermediarios. Nos encargamos de verificar que las entradas sean válidas, de custodiar la plata hasta que todo salga bien, y de garantizar que la transferencia se haga de forma segura. Básicamente, te sacamos el miedo de comprarle a un desconocido.',
  },
  {
    question: '¿Es legal usar Revendiste?',
    answer:
      'Sí, totalmente. Lo que está prohibido en Uruguay es la reventa con sobreprecio, y justamente eso es algo que no permitimos. En Revendiste nadie puede vender una entrada por más de lo que la pagó. Así que si compraste una entrada y no podés ir, podés recuperar tu plata (o parte de ella) sin problemas.',
  },
  {
    question: '¿Puedo vender mi entrada a un precio mayor al que la pagué?',
    answer:
      'No, eso no está permitido. Es una regla que tenemos por cumplir con la normativa uruguaya y porque nos parece lo correcto. Si publicás a un precio mayor al original, te vamos a pedir el comprobante de compra y si no coincide, te bajamos la publicación. Si insistís, te suspendemos la cuenta.',
  },
  {
    question: '¿Cómo sé que no me van a cagar?',
    answer:
      'Mirá, entendemos la desconfianza. Por eso nuestro sistema funciona así: cuando comprás, tu plata queda en custodia con nosotros. No se la damos al vendedor hasta que el evento termine y verifiquemos que todo salió bien. Si la entrada no era válida, te devolvemos la plata. Simple.',
  },
];

const faqCompradores: FAQItem[] = [
  {
    question: '¿Cómo compro una entrada?',
    answer:
      'Es re fácil: buscás el evento que te interesa, elegís la entrada que querés, pagás con tarjeta o el medio que tengas disponible, y listo. Te llega la entrada por email o te aparece en tu cuenta para descargarla. Todo digital, nada de juntarse con nadie.',
  },
  {
    question: '¿Cuánto me cobran de comisión?',
    answer:
      'Te cobramos un 6% sobre el precio de la entrada, más el IVA de esa comisión. Por ejemplo, si la entrada sale $1.000, la comisión es $60 + IVA ($13,20) = $73,20. Total a pagar: $1.073,20. Todo esto lo ves desglosado antes de confirmar la compra, sin sorpresas.',
  },
  {
    question: '¿Qué pasa si la entrada no funciona?',
    answer:
      'Si llegás al evento y la entrada no te deja entrar por algún problema del vendedor (entrada inválida, duplicada, etc.), tenés 48 horas después de que termine el evento para hacer un reclamo. Nos mandás la evidencia (captura del rechazo, lo que sea) y lo investigamos. Si el vendedor la cagó, te devolvemos la plata.',
  },
  {
    question: '¿Qué pasa si se cancela el evento?',
    answer:
      'Si el evento se cancela, la cosa depende de lo que haga el organizador oficial. Nosotros te comunicamos lo que sabemos y, cuando corresponde, procesamos los reembolsos según las reglas que apliquen. No es algo que manejemos nosotros directamente porque no somos los organizadores.',
  },
  {
    question: '¿Cuándo me llega la entrada?',
    answer:
      'Depende. Algunas entradas te llegan al toque después de pagar. Otras, especialmente cuando el vendedor todavía no tiene el QR porque la plataforma original no lo liberó, pueden tardar más. Te avisamos siempre por email cuando tu entrada está lista.',
  },
];

const faqVendedores: FAQItem[] = [
  {
    question: '¿Cómo vendo mi entrada?',
    answer:
      'Primero tenés que verificar tu identidad (es un proceso de dos pasos desde tu celular). Después publicás tu entrada con toda la info correcta: evento, fecha, sector, categoría/tanda, y el precio al que la querés vender (que no puede ser mayor a lo que la pagaste). Cuando alguien la compre, te avisamos y tenés que transferirla.',
  },
  {
    question: '¿Por qué me piden verificar mi identidad?',
    answer:
      'Para evitar fraudes. Si alguien vende una entrada trucha, necesitamos saber quién es. El proceso tiene dos pasos: primero subís una foto de tu documento, y después hacés una verificación de "vida" (liveness) desde tu celular para confirmar que sos vos. Esto protege a los compradores y también te protege a vos, porque genera confianza en la plataforma. Tus datos están seguros, solo los usamos para verificación y prevención de fraude.',
  },
  {
    question: '¿Cuándo me pagan?',
    answer:
      'La plata te la liberamos hasta 10 días hábiles después del evento. ¿Por qué? Porque le damos tiempo al comprador de reclamar si algo salió mal. Si no hay reclamos ni problemas, te transferimos a tu cuenta bancaria o PayPal.',
  },
  {
    question: '¿Cuánto me cobran de comisión como vendedor?',
    answer:
      'También es el 6% más IVA, igual que al comprador. Entonces si vendés una entrada de $1.000, te descontamos $73,20 y te quedan $926,80. Ese descuento se hace automáticamente cuando te liquidamos.',
  },
  {
    question:
      '¿Qué pasa si todavía no tengo el QR porque la plataforma no lo liberó?',
    answer:
      'Tranqui, podés publicar igual. Tenés hasta 3 horas antes del evento para cargar la entrada en la plataforma. Sabemos que algunas ticketeras no liberan los QR hasta último momento. Si se te complica por algún motivo de fuerza mayor, escribinos a ayuda@revendiste.com y vemos cómo lo solucionamos.',
  },
  {
    question:
      '¿Qué pasa si selecciono mal la categoría de la entrada a propósito?',
    answer:
      'Eso es fraude y nos lo tomamos muy en serio. Si publicás una entrada de "Preventa" como "Tanda General" para poder venderla más cara, te suspendemos la cuenta y te retenemos toda la plata. Además, podemos tomar acciones legales. No vale la pena, en serio.',
  },
];

const faqPagos: FAQItem[] = [
  {
    question: '¿Qué métodos de pago aceptan?',
    answer:
      'Aceptamos los medios de pago que aparecen habilitados al momento del checkout. Generalmente tarjetas de crédito y débito. Estamos trabajando en agregar más opciones.',
  },
  {
    question: '¿Cómo recibo mi plata si soy vendedor?',
    answer:
      'Podés elegir entre transferencia bancaria o PayPal. Lo configurás en tu perfil y cuando te toque cobrar, te mandamos la plata ahí.',
  },
  {
    question: '¿Qué es eso de "custodia de fondos"?',
    answer:
      'Cuando un comprador paga, la plata no va directo al vendedor. Nosotros la guardamos hasta que se complete la operación exitosamente (o sea, que el comprador use la entrada sin problemas). Esto protege a ambas partes: el comprador sabe que si algo falla recupera su plata, y el vendedor sabe que cuando todo sale bien, cobra seguro.',
  },
  {
    question: '¿Me devuelven la comisión si hay un problema?',
    answer:
      'La comisión de Revendiste es por el servicio de intermediación que ya prestamos (verificar, custodiar, transferir, etc.), así que no es reembolsable. Lo que sí te devolvemos es el precio de la entrada si hay un problema válido.',
  },
];

function FAQSection({items}: {items: FAQItem[]}) {
  return (
    <Accordion type='single' collapsible className='w-full'>
      {items.map((item, index) => (
        <AccordionItem key={index} value={`item-${index}`}>
          <AccordionTrigger className='text-left'>
            {item.question}
          </AccordionTrigger>
          <AccordionContent className='text-muted-foreground leading-relaxed'>
            {item.answer}
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
}

function FAQPage() {
  return (
    <main className='min-h-screen bg-background-secondary'>
      <div className='container mx-auto max-w-4xl px-4 py-8 md:py-16'>
        {/* Header */}
        <div className='text-center mb-8 md:mb-12'>
          <h1 className='text-3xl md:text-4xl font-bold tracking-tight mb-3'>
            Preguntas Frecuentes
          </h1>
          <p className='text-muted-foreground max-w-xl mx-auto'>
            Acá te respondemos las dudas más comunes. Si no encontrás lo que
            buscás, escribinos a{' '}
            <a
              href='mailto:ayuda@revendiste.com'
              className='text-primary hover:underline'
            >
              ayuda@revendiste.com
            </a>
          </p>
        </div>

        {/* FAQ Tabs */}
        <Card>
          <CardContent className='p-4 md:p-6'>
            <Tabs defaultValue='general' className='w-full'>
              <TabsList className='grid w-full grid-cols-2 md:grid-cols-4 h-auto gap-1'>
                <TabsTrigger value='general' className='text-xs md:text-sm'>
                  General
                </TabsTrigger>
                <TabsTrigger value='compradores' className='text-xs md:text-sm'>
                  Compradores
                </TabsTrigger>
                <TabsTrigger value='vendedores' className='text-xs md:text-sm'>
                  Vendedores
                </TabsTrigger>
                <TabsTrigger value='pagos' className='text-xs md:text-sm'>
                  Pagos
                </TabsTrigger>
              </TabsList>
              <TabsContent value='general' className='mt-4'>
                <FAQSection items={faqGeneral} />
              </TabsContent>
              <TabsContent value='compradores' className='mt-4'>
                <FAQSection items={faqCompradores} />
              </TabsContent>
              <TabsContent value='vendedores' className='mt-4'>
                <FAQSection items={faqVendedores} />
              </TabsContent>
              <TabsContent value='pagos' className='mt-4'>
                <FAQSection items={faqPagos} />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Contact CTA */}
        <Card className='mt-6 bg-muted/50'>
          <CardContent className='py-6 text-center'>
            <h2 className='font-semibold mb-2'>
              ¿No encontraste lo que buscabas?
            </h2>
            <p className='text-muted-foreground text-sm mb-4'>
              No hay drama, escribinos y te ayudamos.
            </p>
            <Button asChild>
              <Link to='/contacto'>Ir a Contacto</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
