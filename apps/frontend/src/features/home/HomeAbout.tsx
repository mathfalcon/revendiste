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
            Revendiste es la plataforma de compra y venta de entradas en Uruguay
            para conciertos, fiestas y eventos. Si no podés ir a un evento,
            publicá o vendé tu entrada de forma fácil y segura. Si te pintó ir a
            último momento, encontrá entradas disponibles. Entre personas, la
            reventa es segura: custodia de fondos y vendedores verificados.
          </p>
          <p className='text-xs md:text-sm text-muted-foreground'>
            Al usar nuestros servicios, aceptás nuestros{' '}
            <a
              href='https://revendiste.com/terminos-y-condiciones'
              className='text-primary hover:underline'
            >
              Términos de Servicio
            </a>{' '}
            y nuestra{' '}
            <a
              href='https://revendiste.com/politica-de-privacidad'
              className='text-primary hover:underline'
            >
              Política de Privacidad
            </a>
            .
          </p>
        </div>
      </section>
    </>
  );
};
