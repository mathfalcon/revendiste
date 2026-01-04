export const HomeAbout = () => {
  return (
    <>
      {/* Visible section for Google verification - styled to match site design */}
      <section className='mx-auto max-w-4xl px-4 py-8 md:py-12'>
        <div className='text-center space-y-3'>
          <h2 className='text-lg md:text-xl font-semibold'>
            ¿Qué es Revendiste?
          </h2>
          <p className='text-sm md:text-base text-muted-foreground max-w-2xl mx-auto leading-relaxed'>
            Revendiste es una plataforma tecnológica de intermediación que
            facilita la transferencia segura de entradas entre personas para
            eventos, conciertos y fiestas en Uruguay. Si no podés asistir a un
            evento, podés transferir tu entrada de forma fácil y segura. Si te
            pintó ir a último momento, encontrá entradas disponibles para
            transferencia.
          </p>
          <p className='text-xs md:text-sm text-muted-foreground'>
            Al usar nuestros servicios, aceptás nuestros{' '}
            <a
              href='/terminos-y-condiciones'
              className='text-primary hover:underline'
            >
              Términos de Servicio
            </a>{' '}
            y nuestra{' '}
            <a
              href='/politica-de-privacidad'
              className='text-primary hover:underline'
            >
              Política de Privacidad
            </a>
            .
          </p>
        </div>
      </section>
      {/* Also keep sr-only version for screen readers with more detail */}
      <div className='sr-only'>
        <h2>¿Qué es Revendiste?</h2>
        <p>
          Revendiste es una plataforma tecnológica de intermediación que
          facilita la transferencia segura de entradas entre personas para
          eventos, conciertos y fiestas en Uruguay. Si no podés asistir a un
          evento, podés transferir tu entrada de forma fácil y segura. Si te
          pintó ir a último momento, encontrá entradas disponibles para
          transferencia.
        </p>
        <p>
          Al usar nuestros servicios, aceptás nuestros{' '}
          <a href='/terminos-y-condiciones'>Términos de Servicio</a> y nuestra{' '}
          <a href='/politica-de-privacidad'>Política de Privacidad</a>.
        </p>
      </div>
    </>
  );
};
