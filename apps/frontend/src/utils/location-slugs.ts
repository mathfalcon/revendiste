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
    title: 'Eventos en Montevideo | Entradas en Revendiste',
    description:
      'Encontrá entradas para conciertos, fiestas y eventos en Montevideo. Compra segura con garantía y custodia de fondos en Revendiste.',
    keywords:
      'eventos Montevideo, entradas Montevideo, conciertos Montevideo, fiestas Montevideo, entradas conciertos Montevideo',
  },
  canelones: {
    title: 'Eventos en Canelones | Entradas en Revendiste',
    description:
      'Encontrá entradas para eventos, conciertos y fiestas en Canelones. Compra segura con garantía en Revendiste.',
    keywords:
      'eventos Canelones, entradas Canelones, conciertos Canelones, fiestas Canelones',
  },
  maldonado: {
    title: 'Eventos en Maldonado | Entradas en Revendiste',
    description:
      'Encontrá entradas para eventos en Maldonado y Punta del Este. Conciertos, fiestas y más con compra segura en Revendiste.',
    keywords:
      'eventos Maldonado, eventos Punta del Este, entradas Maldonado, conciertos Punta del Este, fiestas Maldonado',
  },
  rocha: {
    title: 'Eventos en Rocha | Entradas en Revendiste',
    description:
      'Encontrá entradas para eventos en Rocha y La Paloma. Compra segura con garantía en Revendiste.',
    keywords:
      'eventos Rocha, entradas Rocha, conciertos Rocha, fiestas La Paloma',
  },
  colonia: {
    title: 'Eventos en Colonia | Entradas en Revendiste',
    description:
      'Encontrá entradas para eventos en Colonia del Sacramento y alrededores. Compra segura en Revendiste.',
    keywords:
      'eventos Colonia, entradas Colonia del Sacramento, conciertos Colonia',
  },
  paysandu: {
    title: 'Eventos en Paysandú | Entradas en Revendiste',
    description:
      'Encontrá entradas para eventos, conciertos y fiestas en Paysandú. Compra segura con garantía en Revendiste.',
    keywords: 'eventos Paysandú, entradas Paysandú, conciertos Paysandú',
  },
  salto: {
    title: 'Eventos en Salto | Entradas en Revendiste',
    description:
      'Encontrá entradas para eventos, conciertos y fiestas en Salto. Compra segura con garantía en Revendiste.',
    keywords: 'eventos Salto, entradas Salto, conciertos Salto',
  },
};

export function getRegionSeoMeta(regionName: string): RegionSeoMeta {
  const slug = regionToSlug(regionName);
  const display = formatRegionDisplay(regionName);

  return (
    REGION_SEO[slug] ?? {
      title: `Eventos en ${display} | Entradas en Revendiste`,
      description: `Encontrá entradas para conciertos, fiestas y eventos en ${display}. Compra segura con garantía en Revendiste.`,
      keywords: `eventos ${display}, entradas ${display}, conciertos ${display}, fiestas ${display}`,
    }
  );
}
