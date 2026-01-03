export const HomeAbout = () => {
  return (
    // Visually hidden but accessible to screen readers and bots (for Google verification)
    // Using plain HTML <a> tags so bots without JavaScript can see the links
    <div className='sr-only'>
      <h2>¿Qué es Revendiste?</h2>
      <p>
        Revendiste es una plataforma segura para comprar y vender entradas para
        eventos, conciertos y fiestas en Uruguay. Si no podés asistir a un
        evento, podés vender tu entrada de forma fácil y segura. Si te pintó ir
        a último momento, encontrá entradas disponibles al mejor precio.
      </p>
      <p>
        Al usar nuestros servicios, aceptás nuestros{' '}
        <a href='/terminos-y-condiciones'>Términos de Servicio</a> y nuestra{' '}
        <a href='/politica-de-privacidad'>Política de Privacidad</a>.
      </p>
    </div>
  );
};
