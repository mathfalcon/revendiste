import {createFileRoute, Link} from '@tanstack/react-router';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '~/components/ui/card';
import {Button} from '~/components/ui/button';
import {Shield, Lock, Clock, CheckCircle, ArrowRight} from 'lucide-react';

export const Route = createFileRoute('/garantia')({
  component: GarantiaPage,
  head: () => ({
    meta: [
      {
        title: 'Garantía Revendiste | Compra y Venta Segura de Entradas',
      },
      {
        name: 'description',
        content:
          'Conocé cómo funciona la Garantía Revendiste: custodia de fondos, verificación de vendedores y protección para compradores y vendedores.',
      },
    ],
  }),
});

function GarantiaPage() {
  return (
    <main className='min-h-screen bg-background-secondary'>
      <div className='container mx-auto max-w-4xl px-4 py-8 md:py-16'>
        {/* Header */}
        <div className='text-center mb-8 md:mb-12'>
          <div className='inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4'>
            <Shield className='w-8 h-8 text-primary' />
          </div>
          <h1 className='text-3xl md:text-4xl font-bold tracking-tight mb-3'>
            Garantía Revendiste
          </h1>
          <p className='text-muted-foreground max-w-xl mx-auto text-lg'>
            Nuestro sistema de protección que hace posible comprar y vender
            entradas entre desconocidos con total confianza.
          </p>
        </div>

        {/* How it works */}
        <Card className='mb-6'>
          <CardHeader>
            <CardTitle>¿Cómo funciona?</CardTitle>
            <CardDescription>
              Un proceso simple que protege a ambas partes
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className='grid gap-6 md:grid-cols-3'>
              <div className='flex flex-col items-center text-center p-4'>
                <div className='w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-3'>
                  <span className='text-primary font-bold'>1</span>
                </div>
                <h3 className='font-semibold mb-2'>Comprás con confianza</h3>
                <p className='text-sm text-muted-foreground'>
                  Cuando pagás, tu dinero queda en custodia con nosotros. No se
                  lo damos al vendedor todavía.
                </p>
              </div>
              <div className='flex flex-col items-center text-center p-4'>
                <div className='w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-3'>
                  <span className='text-primary font-bold'>2</span>
                </div>
                <h3 className='font-semibold mb-2'>Recibís tu entrada</h3>
                <p className='text-sm text-muted-foreground'>
                  El vendedor te transfiere la entrada de forma digital. Todo
                  queda registrado en la plataforma.
                </p>
              </div>
              <div className='flex flex-col items-center text-center p-4'>
                <div className='w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-3'>
                  <span className='text-primary font-bold'>3</span>
                </div>
                <h3 className='font-semibold mb-2'>Disfrutás del evento</h3>
                <p className='text-sm text-muted-foreground'>
                  Usás tu entrada sin problemas. Después del evento, liberamos
                  el pago al vendedor.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Protection features */}
        <div className='grid gap-4 md:grid-cols-2 mb-6'>
          <Card>
            <CardHeader className='pb-3'>
              <div className='flex items-center gap-3'>
                <div className='w-10 h-10 rounded-full bg-green-500/10 flex items-center justify-center'>
                  <Lock className='w-5 h-5 text-green-600' />
                </div>
                <CardTitle className='text-lg'>Custodia de Fondos</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className='text-sm text-muted-foreground'>
                Tu dinero está seguro con nosotros hasta que confirmemos que
                todo salió bien. Si hay algún problema con la entrada, te
                devolvemos el dinero.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className='pb-3'>
              <div className='flex items-center gap-3'>
                <div className='w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center'>
                  <CheckCircle className='w-5 h-5 text-blue-600' />
                </div>
                <CardTitle className='text-lg'>
                  Vendedores Verificados
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className='text-sm text-muted-foreground'>
                Todos los vendedores pasan por un proceso de verificación de
                identidad en dos pasos antes de poder publicar entradas.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className='pb-3'>
              <div className='flex items-center gap-3'>
                <div className='w-10 h-10 rounded-full bg-orange-500/10 flex items-center justify-center'>
                  <Clock className='w-5 h-5 text-orange-600' />
                </div>
                <CardTitle className='text-lg'>
                  Ventana de Reclamos
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className='text-sm text-muted-foreground'>
                Tenés 48 horas después del evento para reportar cualquier
                problema. Investigamos cada caso y actuamos en consecuencia.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className='pb-3'>
              <div className='flex items-center gap-3'>
                <div className='w-10 h-10 rounded-full bg-purple-500/10 flex items-center justify-center'>
                  <Shield className='w-5 h-5 text-purple-600' />
                </div>
                <CardTitle className='text-lg'>Sin Sobreprecio</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className='text-sm text-muted-foreground'>
                Nadie puede vender una entrada por más de lo que la pagó.
                Cumplimos con la normativa uruguaya y protegemos a los
                compradores.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* What happens if */}
        <Card className='mb-6'>
          <CardHeader>
            <CardTitle>¿Qué pasa si algo sale mal?</CardTitle>
          </CardHeader>
          <CardContent className='space-y-4'>
            <div className='flex gap-3'>
              <ArrowRight className='w-5 h-5 text-primary flex-shrink-0 mt-0.5' />
              <div>
                <p className='font-medium'>La entrada no funciona</p>
                <p className='text-sm text-muted-foreground'>
                  Te devolvemos el 100% del precio de la entrada. La comisión de
                  servicio no es reembolsable ya que cubre el trabajo de
                  intermediación.
                </p>
              </div>
            </div>
            <div className='flex gap-3'>
              <ArrowRight className='w-5 h-5 text-primary flex-shrink-0 mt-0.5' />
              <div>
                <p className='font-medium'>El vendedor no entrega la entrada</p>
                <p className='text-sm text-muted-foreground'>
                  Cancelamos la operación y te devolvemos el dinero. El vendedor
                  recibe una sanción en su cuenta.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* CTA */}
        <Card className='bg-muted/50'>
          <CardContent className='py-6 text-center'>
            <h2 className='font-semibold mb-2'>¿Tenés más dudas?</h2>
            <p className='text-muted-foreground text-sm mb-4'>
              Revisá nuestras preguntas frecuentes o escribinos directamente.
            </p>
            <div className='flex flex-col sm:flex-row gap-3 justify-center'>
              <Button variant='outline' asChild>
                <Link to='/preguntas-frecuentes'>Preguntas Frecuentes</Link>
              </Button>
              <Button asChild>
                <Link to='/contacto'>Contactanos</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
