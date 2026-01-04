import {createFileRoute, Link} from '@tanstack/react-router';
import {Mail, MessageCircle, Clock} from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '~/components/ui/card';
import {Button} from '~/components/ui/button';

export const Route = createFileRoute('/contacto')({
  component: ContactPage,
  head: () => ({
    meta: [
      {
        title: 'Contacto | Revendiste',
      },
      {
        name: 'description',
        content:
          'Contactá al equipo de Revendiste. Estamos para ayudarte con cualquier consulta sobre compra o venta de entradas.',
      },
    ],
  }),
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

        {/* Contact Cards */}
        <div className='grid gap-4 md:gap-6 md:grid-cols-2'>
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
            <CardContent className='text-center'>
              <span className='text-sm text-muted-foreground italic'>
                Próximamente
              </span>
            </CardContent>
          </Card>
        </div>

        {/* Horarios */}
        <Card className='mt-6'>
          <CardHeader className='text-center pb-2'>
            <div className='mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-muted'>
              <Clock className='h-6 w-6 text-muted-foreground' />
            </div>
            <CardTitle className='text-lg'>Horario de Atención</CardTitle>
          </CardHeader>
          <CardContent className='text-center space-y-2'>
            <p className='text-sm'>
              <span className='font-medium'>Lunes a Viernes:</span>{' '}
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
              <Link to='/preguntas-frecuentes'>Ver Preguntas Frecuentes</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
