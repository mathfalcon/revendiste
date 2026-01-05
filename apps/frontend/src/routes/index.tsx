import {createFileRoute} from '@tanstack/react-router';
import {HomePage} from '~/features';
import {seo} from '~/utils/seo';
import {getBaseUrl} from '~/config/env';

export const Route = createFileRoute('/')({
  component: Home,
  head: () => {
    const baseUrl = getBaseUrl();

    // Organization structured data for homepage
    const organizationSchema = {
      '@context': 'https://schema.org',
      '@type': 'Organization',
      name: 'Revendiste',
      url: baseUrl,
      logo: `${baseUrl}/favicon-32x32.png`,
      description:
        'Plataforma de compra y venta de entradas de forma segura en Uruguay.',
      sameAs: ['https://twitter.com/revendiste'],
      contactPoint: {
        '@type': 'ContactPoint',
        contactType: 'customer service',
        availableLanguage: 'Spanish',
      },
    };

    // Website structured data
    const websiteSchema = {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      name: 'Revendiste',
      url: baseUrl,
      potentialAction: {
        '@type': 'SearchAction',
        target: {
          '@type': 'EntryPoint',
          urlTemplate: `${baseUrl}/eventos?search={search_term_string}`,
        },
        'query-input': 'required name=search_term_string',
      },
    };

    return {
      meta: [
        ...seo({
          title: 'Revendiste | Transferí tus entradas de forma fácil y segura',
          description:
            'Compra y vende entradas para eventos, conciertos y fiestas de forma segura en Uruguay. Revendiste es la plataforma más confiable para transferir tus entradas.',
          keywords:
            'entradas, eventos, conciertos, fiestas, comprar entradas, vender entradas, Uruguay, Montevideo, reventa segura',
          baseUrl,
        }),
        {
          property: 'og:url',
          content: baseUrl,
        },
        // Additional meta tag for app purpose (for Google verification)
        {
          name: 'application-name',
          content: 'Revendiste - Plataforma de compra y venta de entradas',
        },
      ],
      links: [
        {
          rel: 'canonical',
          href: baseUrl,
        },
      ],
      scripts: [
        {
          type: 'application/ld+json',
          children: JSON.stringify(organizationSchema),
        },
        {
          type: 'application/ld+json',
          children: JSON.stringify(websiteSchema),
        },
      ],
    };
  },
});

function Home() {
  return (
    <>
      {/* Noscript fallback for bots without JavaScript */}
      <noscript>
        <div>
          <p>
            Revendiste es una plataforma segura para comprar y vender entradas
            para eventos, conciertos y fiestas en Uruguay.{' '}
            <a href='/politica-de-privacidad'>Política de Privacidad</a>
          </p>
        </div>
      </noscript>
      <HomePage />
    </>
  );
}
