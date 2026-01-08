import {ModeToggle} from '../ModeToggle';
import {cn} from '~/lib/utils';
import {Link} from '@tanstack/react-router';
import {FullLogo} from '~/assets';
import {VITE_APP_VERSION, VITE_APP_ENV} from '~/config/env';

export const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer
      className={cn(
        'border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80',
      )}
    >
      <div className='mx-auto w-full max-w-screen-2xl px-4 md:px-6 py-8 md:py-12'>
        <div className='grid grid-cols-1 md:grid-cols-4 gap-8 mb-8'>
          <div className='space-y-4'>
            <Link to='/' className='flex items-center'>
              <FullLogo className='h-8 w-auto' />
            </Link>
            <p className='text-sm text-muted-foreground'>
              Transferí tus entradas de forma fácil y segura
            </p>
          </div>

          <div>
            <h3 className='text-sm font-semibold mb-4'>Legal</h3>
            <ul className='space-y-3'>
              <li>
                <Link
                  to='/terminos-y-condiciones'
                  className='text-sm text-muted-foreground hover:text-foreground transition-colors'
                  resetScroll
                >
                  Términos de Servicio
                </Link>
              </li>
              <li>
                <Link
                  to='/politica-de-privacidad'
                  className='text-sm text-muted-foreground hover:text-foreground transition-colors'
                  resetScroll
                >
                  Política de Privacidad
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className='text-sm font-semibold mb-4'>Ayuda</h3>
            <ul className='space-y-3'>
              <li>
                <Link
                  to='/garantia'
                  className='text-sm text-muted-foreground hover:text-foreground transition-colors'
                  resetScroll
                >
                  Garantía Revendiste
                </Link>
              </li>
              <li>
                <Link
                  to='/contacto'
                  className='text-sm text-muted-foreground hover:text-foreground transition-colors'
                  resetScroll
                >
                  Contacto
                </Link>
              </li>
              <li>
                <Link
                  to='/preguntas-frecuentes'
                  className='text-sm text-muted-foreground hover:text-foreground transition-colors'
                  resetScroll
                >
                  Preguntas Frecuentes
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className='text-sm font-semibold mb-4'>Recursos</h3>
            <ul className='space-y-3'>
              <li>
                <a
                  href='/sitemap'
                  className='text-sm text-muted-foreground hover:text-foreground transition-colors'
                >
                  Mapa del Sitio
                </a>
              </li>
              {/* <li>
                <Link
                  to='/acerca-de'
                  className='text-sm text-muted-foreground hover:text-foreground transition-colors'
                >
                  Acerca de Nosotros
                </Link>
              </li> */}
              {/* <li>
                <Link
                  to='/blog'
                  className='text-sm text-muted-foreground hover:text-foreground transition-colors'
                >
                  Blog
                </Link>
              </li> */}
            </ul>
          </div>
        </div>

        <div className='flex flex-col md:flex-row items-center justify-between gap-4 pt-8 border-t'>
          <div className='flex flex-col md:flex-row items-center gap-2 md:gap-4 text-center md:text-left'>
            <p className='text-sm text-muted-foreground'>
              © {currentYear} Revendiste. Todos los derechos reservados.
            </p>
            {(VITE_APP_VERSION || VITE_APP_ENV) && (
              <p className='text-xs text-muted-foreground/70'>
                {VITE_APP_ENV && (
                  <span className='uppercase'>{VITE_APP_ENV}</span>
                )}
                {VITE_APP_ENV && VITE_APP_VERSION && <span> • </span>}
                {VITE_APP_VERSION && <span>v{VITE_APP_VERSION}</span>}
              </p>
            )}
          </div>
          <div className='flex items-center gap-4'>
            <ModeToggle />
          </div>
        </div>
      </div>
    </footer>
  );
};
