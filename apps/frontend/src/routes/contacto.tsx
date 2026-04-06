import {createFileRoute, Link} from '@tanstack/react-router';
import posthog from 'posthog-js';
import {Mail, MessageCircle, Clock, AlertTriangle} from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '~/components/ui/card';
import {Button} from '~/components/ui/button';
import {alternateHreflangEsUy, seo} from '~/utils/seo';
import {getBaseUrl} from '~/config/env';

export const Route = createFileRoute('/contacto')({
  component: ContactPage,
  head: () => {
    const baseUrl = getBaseUrl();
    return {
      meta: seo({
        title: 'Contacto | Revendiste - Ayuda con entradas',
        description:
          'Escribinos si tenés alguna duda sobre tu compra o venta de entradas. El equipo de Revendiste está para ayudarte.',
        baseUrl,
      }),
      links: [
        alternateHreflangEsUy(`${baseUrl}/contacto`),
        {rel: 'canonical', href: `${baseUrl}/contacto`},
      ],
    };
  },
});

function ContactPage() {
  return (
    <main className='min-h-screen bg-background-secondary'>
      <div className='container mx-auto max-w-4xl px-4 py-8 md:py-16'>
        {/* Header */}
        <div className='text-center mb-8 md:mb-12'>
          <h1 className='text-3xl md:text-4xl font-bold tracking-tight mb-3'>
            Contacto
          </h1>
          <p className='text-muted-foreground max-w-xl mx-auto'>
            ¿Tenés alguna consulta, problema o sugerencia? Estamos acá para
            ayudarte.
          </p>
        </div>

        {/* Ticket Problem CTA — most common reason users visit this page */}
        <Card className='mb-6 border-primary/30 bg-primary/5'>
          <CardContent className='py-5 sm:py-6'>
            <div className='flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left'>
              <div className='flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary/10'>
                <AlertTriangle className='h-6 w-6 text-primary' />
              </div>
              <div className='flex-1 min-w-0'>
                <h2 className='font-semibold text-base mb-1'>
                  ¿Tenés un problema con una entrada?
                </h2>
                <p className='text-sm text-muted-foreground'>
                  Podés abrir un caso directamente desde tus entradas. Nuestro
                  equipo lo revisa y te avisa cuando haya novedades.
                </p>
              </div>
              <Button asChild size='sm' className='shrink-0'>
                <Link to='/cuenta/entradas'>Ir a mis entradas</Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Contact Cards */}
        <div className='grid gap-4 md:gap-6 md:grid-cols-2'>
          {/* WhatsApp */}
          <Card>
            <CardHeader className='text-center pb-2'>
              <div className='mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-green-500/10'>
                <MessageCircle className='h-6 w-6 text-green-600' />
              </div>
              <CardTitle className='text-lg'>WhatsApp</CardTitle>
              <CardDescription>
                Para consultas rápidas o urgentes
              </CardDescription>
            </CardHeader>
            <CardContent className='text-center space-y-3'>
              <p className='text-sm text-muted-foreground'>+598 99 303 326</p>
              <Button asChild variant='outline' size='sm'>
                <a
                  href='https://wa.me/59899303326'
                  target='_blank'
                  rel='noopener noreferrer'
                  onClick={() =>
                    posthog.capture('contact_whatsapp_clicked')
                  }
                >
                  <MessageCircle className='h-4 w-4 mr-1.5' />
                  Abrir chat
                </a>
              </Button>
            </CardContent>
          </Card>

          {/* Email */}
          <Card>
            <CardHeader className='text-center pb-2'>
              <div className='mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10'>
                <Mail className='h-6 w-6 text-primary' />
              </div>
              <CardTitle className='text-lg'>Email</CardTitle>
              <CardDescription>
                Para consultas, reclamos o soporte
              </CardDescription>
            </CardHeader>
            <CardContent className='text-center'>
              <a
                href='mailto:ayuda@revendiste.com'
                className='text-primary hover:underline font-medium'
              >
                ayuda@revendiste.com
              </a>
            </CardContent>
          </Card>
        </div>

        {/* Horarios */}
        <Card className='mt-6'>
          <CardHeader className='text-center pb-2'>
            <div className='mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-muted'>
              <Clock className='h-6 w-6 text-muted-foreground' />
            </div>
            <CardTitle className='text-lg'>Horario de atención</CardTitle>
          </CardHeader>
          <CardContent className='text-center space-y-2'>
            <p className='text-sm'>
              <span className='font-medium'>Lunes a viernes:</span>{' '}
              <span className='text-muted-foreground'>9:00 - 18:00 hs</span>
            </p>
            <p className='text-sm'>
              <span className='font-medium'>Fines de semana y feriados:</span>{' '}
              <span className='text-muted-foreground'>
                Soporte limitado por email
              </span>
            </p>
            <p className='text-xs text-muted-foreground pt-2'>
              Para reclamos urgentes el día del evento, intentamos responder lo
              más rápido posible.
            </p>
          </CardContent>
        </Card>

        {/* FAQ Link */}
        <Card className='mt-6 bg-muted/50'>
          <CardContent className='py-6 text-center'>
            <p className='text-muted-foreground mb-4'>
              Antes de escribirnos, capaz encontrás la respuesta en nuestras
              preguntas frecuentes.
            </p>
            <Button asChild variant='outline'>
              <Link to='/preguntas-frecuentes'>Ver preguntas frecuentes</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
