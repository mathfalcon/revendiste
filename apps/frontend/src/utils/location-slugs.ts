/**
 * Bidirectional region-to-slug mapping and SEO metadata for programmatic location pages.
 */

function stripPrefix(name: string): string {
  return name
    .replace(/^Departamento de /i, '')
    .replace(/^Provincia de /i, '')
    .trim();
}

function transliterate(str: string): string {
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

export function regionToSlug(regionName: string): string {
  return transliterate(stripPrefix(regionName));
}

export function slugToRegion(
  slug: string,
  regionGroups: Array<{country: string; regions: string[]}>,
): string | null {
  for (const group of regionGroups) {
    for (const region of group.regions) {
      if (regionToSlug(region) === slug) {
        return region;
      }
    }
  }
  return null;
}

export function formatRegionDisplay(region: string): string {
  return stripPrefix(region);
}

interface RegionSeoMeta {
  title: string;
  description: string;
  keywords: string;
}

const REGION_SEO: Record<string, RegionSeoMeta> = {
  montevideo: {
    title: 'Entradas en Montevideo | Comprá y vendé en Revendiste',
    description:
      'Comprá y vendé entradas para conciertos, fiestas y eventos en Montevideo. Garantía y custodia de fondos; reventa segura entre personas en Revendiste.',
    keywords:
      'reventa entradas Montevideo, revender entradas Montevideo, compra y venta entradas Montevideo, eventos Montevideo, entradas Montevideo, conciertos Montevideo, fiestas Montevideo, entradas conciertos Montevideo',
  },
  canelones: {
    title: 'Entradas en Canelones | Comprá y vendé en Revendiste',
    description:
      'Comprá y vendé entradas para eventos, conciertos y fiestas en Canelones. Garantía en Revendiste; reventa segura entre personas.',
    keywords:
      'reventa entradas Canelones, revender entradas Canelones, compra y venta entradas Canelones, eventos Canelones, entradas Canelones, conciertos Canelones, fiestas Canelones',
  },
  maldonado: {
    title: 'Entradas en Maldonado | Comprá y vendé en Revendiste',
    description:
      'Comprá y vendé entradas para eventos en Maldonado y Punta del Este. Garantía en Revendiste; reventa segura entre personas.',
    keywords:
      'reventa entradas Maldonado, revender entradas Punta del Este, compra y venta entradas Maldonado, eventos Maldonado, eventos Punta del Este, entradas Maldonado, conciertos Punta del Este, fiestas Maldonado',
  },
  rocha: {
    title: 'Entradas en Rocha | Comprá y vendé en Revendiste',
    description:
      'Comprá y vendé entradas para eventos en Rocha y La Paloma. Garantía en Revendiste; reventa segura entre personas.',
    keywords:
      'reventa entradas Rocha, revender entradas Rocha, compra y venta entradas Rocha, eventos Rocha, entradas Rocha, conciertos Rocha, fiestas La Paloma',
  },
  colonia: {
    title: 'Entradas en Colonia | Comprá y vendé en Revendiste',
    description:
      'Comprá y vendé entradas para eventos en Colonia del Sacramento y alrededores. Garantía en Revendiste; reventa segura entre personas.',
    keywords:
      'reventa entradas Colonia, revender entradas Colonia, compra y venta entradas Colonia, eventos Colonia, entradas Colonia del Sacramento, conciertos Colonia',
  },
  paysandu: {
    title: 'Entradas en Paysandú | Comprá y vendé en Revendiste',
    description:
      'Comprá y vendé entradas para eventos, conciertos y fiestas en Paysandú. Garantía en Revendiste; reventa segura entre personas.',
    keywords:
      'reventa entradas Paysandú, revender entradas Paysandú, compra y venta entradas Paysandú, eventos Paysandú, entradas Paysandú, conciertos Paysandú',
  },
  salto: {
    title: 'Entradas en Salto | Comprá y vendé en Revendiste',
    description:
      'Comprá y vendé entradas para eventos, conciertos y fiestas en Salto. Garantía en Revendiste; reventa segura entre personas.',
    keywords:
      'reventa entradas Salto, revender entradas Salto, compra y venta entradas Salto, eventos Salto, entradas Salto, conciertos Salto',
  },
};

export function getRegionSeoMeta(regionName: string): RegionSeoMeta {
  const slug = regionToSlug(regionName);
  const display = formatRegionDisplay(regionName);

  return (
    REGION_SEO[slug] ?? {
      title: `Entradas en ${display} | Comprá y vendé en Revendiste`,
      description: `Comprá y vendé entradas para conciertos, fiestas y eventos en ${display}. Garantía en Revendiste; reventa segura entre personas.`,
      keywords: `reventa entradas ${display}, revender entradas ${display}, compra y venta entradas ${display}, eventos ${display}, entradas ${display}, conciertos ${display}, fiestas ${display}`,
    }
  );
}
