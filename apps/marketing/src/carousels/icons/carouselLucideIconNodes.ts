/**
 * Byte-identical copies of lucide-react `__iconNode` arrays (stroke geometry).
 * Source: `lucide-react@0.544.0` `dist/esm/icons/*.js` (ISC license).
 *
 * We snapshot instead of importing those chunks because `tsx` entrypoints can
 * bundle subpath imports in a way that drops `__iconNode`. Refresh this file
 * when upgrading `lucide-react` in apps/marketing so carousels stay aligned
 * with Lucide.
 */
import type {ContentSlideIconKey} from '../types';
import type {LucideCarouselIconNode} from './lucideIconNode';

/** @see lucide-react shield-check */
const shieldCheckNodes = [
  [
    'path',
    {
      d: 'M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z',
      key: 'oel41y',
    },
  ],
  ['path', {d: 'm9 12 2 2 4-4', key: 'dzmm74'}],
] as const satisfies LucideCarouselIconNode;

/** @see lucide-react list */
const listNodes = [
  ['path', {d: 'M3 5h.01', key: '18ugdj'}],
  ['path', {d: 'M3 12h.01', key: 'nlz23k'}],
  ['path', {d: 'M3 19h.01', key: 'noohij'}],
  ['path', {d: 'M8 5h13', key: '1pao27'}],
  ['path', {d: 'M8 12h13', key: '1za7za'}],
  ['path', {d: 'M8 19h13', key: 'm83p4d'}],
] as const satisfies LucideCarouselIconNode;

/** @see lucide-react mail */
const mailNodes = [
  ['path', {d: 'm22 7-8.991 5.727a2 2 0 0 1-2.009 0L2 7', key: '132q7q'}],
  ['rect', {x: '2', y: '4', width: '20', height: '16', rx: '2', key: 'izxlao'}],
] as const satisfies LucideCarouselIconNode;

/** @see lucide-react wallet */
const walletNodes = [
  [
    'path',
    {
      d: 'M19 7V4a1 1 0 0 0-1-1H5a2 2 0 0 0 0 4h15a1 1 0 0 1 1 1v4h-3a2 2 0 0 0 0 4h3a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1',
      key: '18etb6',
    },
  ],
  ['path', {d: 'M3 5v14a2 2 0 0 0 2 2h15a1 1 0 0 0 1-1v-4', key: 'xoc0q4'}],
] as const satisfies LucideCarouselIconNode;

/** @see lucide-react sparkles */
const sparklesNodes = [
  [
    'path',
    {
      d: 'M11.017 2.814a1 1 0 0 1 1.966 0l1.051 5.558a2 2 0 0 0 1.594 1.594l5.558 1.051a1 1 0 0 1 0 1.966l-5.558 1.051a2 2 0 0 0-1.594 1.594l-1.051 5.558a1 1 0 0 1-1.966 0l-1.051-5.558a2 2 0 0 0-1.594-1.594l-5.558-1.051a1 1 0 0 1 0-1.966l5.558-1.051a2 2 0 0 0 1.594-1.594z',
      key: '1s2grr',
    },
  ],
  ['path', {d: 'M20 2v4', key: '1rf3ol'}],
  ['path', {d: 'M22 4h-4', key: 'gwowj6'}],
  ['circle', {cx: '4', cy: '20', r: '2', key: '6kqj1y'}],
] as const satisfies LucideCarouselIconNode;

/** @see lucide-react id-card */
const idCardNodes = [
  ['path', {d: 'M16 10h2', key: '8sgtl7'}],
  ['path', {d: 'M16 14h2', key: 'epxaof'}],
  ['path', {d: 'M6.17 15a3 3 0 0 1 5.66 0', key: 'n6f512'}],
  ['circle', {cx: '9', cy: '11', r: '2', key: 'yxgjnd'}],
  ['rect', {x: '2', y: '5', width: '20', height: '14', rx: '2', key: 'qneu4z'}],
] as const satisfies LucideCarouselIconNode;

/** @see lucide-react scan-face */
const scanFaceNodes = [
  ['path', {d: 'M3 7V5a2 2 0 0 1 2-2h2', key: 'aa7l1z'}],
  ['path', {d: 'M17 3h2a2 2 0 0 1 2 2v2', key: '4qcy5o'}],
  ['path', {d: 'M21 17v2a2 2 0 0 1-2 2h-2', key: '6vwrx8'}],
  ['path', {d: 'M7 21H5a2 2 0 0 1-2-2v-2', key: 'ioqczr'}],
  ['path', {d: 'M8 14s1.5 2 4 2 4-2 4-2', key: '1y1vjs'}],
  ['path', {d: 'M9 9h.01', key: '1q5me6'}],
  ['path', {d: 'M15 9h.01', key: 'x1ddxp'}],
] as const satisfies LucideCarouselIconNode;

/** @see lucide-react file-text */
const fileTextNodes = [
  ['path', {d: 'M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z', key: '1rqfz7'}],
  ['path', {d: 'M14 2v4a2 2 0 0 0 2 2h4', key: 'tnqrlb'}],
  ['path', {d: 'M10 9H8', key: 'b1mrlr'}],
  ['path', {d: 'M16 13H8', key: 't4e002'}],
  ['path', {d: 'M16 17H8', key: 'z1uh3a'}],
] as const satisfies LucideCarouselIconNode;

/** @see lucide-react calendar */
const calendarNodes = [
  ['path', {d: 'M8 2v4', key: '1cmpym'}],
  ['path', {d: 'M16 2v4', key: '4m81vk'}],
  ['rect', {width: '18', height: '18', x: '3', y: '4', rx: '2', key: '1hopcy'}],
  ['path', {d: 'M3 10h18', key: '8toen8'}],
] as const satisfies LucideCarouselIconNode;

/** @see lucide-react ticket */
const ticketNodes = [
  [
    'path',
    {
      d: 'M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z',
      key: 'qn84l0',
    },
  ],
  ['path', {d: 'M13 5v2', key: 'dyzc3o'}],
  ['path', {d: 'M13 17v2', key: '1ont0d'}],
  ['path', {d: 'M13 11v2', key: '1wjjxi'}],
] as const satisfies LucideCarouselIconNode;

/** @see lucide-react tag */
const tagNodes = [
  [
    'path',
    {
      d: 'M12.586 2.586A2 2 0 0 0 11.172 2H4a2 2 0 0 0-2 2v7.172a2 2 0 0 0 .586 1.414l8.704 8.704a2.426 2.426 0 0 0 3.42 0l6.58-6.58a2.426 2.426 0 0 0 0-3.42z',
      key: 'vktsd0',
    },
  ],
  ['circle', {cx: '7.5', cy: '7.5', r: '.5', fill: 'currentColor', key: 'kqv944'}],
] as const satisfies LucideCarouselIconNode;

/** @see lucide-react upload */
const uploadNodes = [
  ['path', {d: 'M12 3v12', key: '1x0j5s'}],
  ['path', {d: 'm17 8-5-5-5 5', key: '7q97r8'}],
  ['path', {d: 'M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4', key: 'ih7n3h'}],
] as const satisfies LucideCarouselIconNode;

/** @see lucide-react bell */
const bellNodes = [
  ['path', {d: 'M10.268 21a2 2 0 0 0 3.464 0', key: 'vwvbt9'}],
  [
    'path',
    {
      d: 'M3.262 15.326A1 1 0 0 0 4 17h16a1 1 0 0 0 .74-1.673C19.41 13.956 18 12.499 18 8A6 6 0 0 0 6 8c0 4.499-1.411 5.956-2.738 7.326',
      key: '11g9vi',
    },
  ],
] as const satisfies LucideCarouselIconNode;

/** @see lucide-react banknote */
const banknoteNodes = [
  ['rect', {width: '20', height: '12', x: '2', y: '6', rx: '2', key: '9lu3g6'}],
  ['circle', {cx: '12', cy: '12', r: '2', key: '1c9p78'}],
  ['path', {d: 'M6 12h.01M18 12h.01', key: '113zkx'}],
] as const satisfies LucideCarouselIconNode;

/** @see lucide-react hand-coins */
const handCoinsNodes = [
  ['path', {d: 'M11 15h2a2 2 0 1 0 0-4h-3c-.6 0-1.1.2-1.4.6L3 17', key: 'geh8rc'}],
  [
    'path',
    {
      d: 'm7 21 1.6-1.4c.3-.4.8-.6 1.4-.6h4c1.1 0 2.1-.4 2.8-1.2l4.6-4.4a2 2 0 0 0-2.75-2.91l-4.2 3.9',
      key: '1fto5m',
    },
  ],
  ['path', {d: 'm2 16 6 6', key: '1pfhp9'}],
  ['circle', {cx: '16', cy: '9', r: '2.9', key: '1n0dlu'}],
  ['circle', {cx: '6', cy: '5', r: '3', key: '151irh'}],
] as const satisfies LucideCarouselIconNode;

/** @see lucide-react clock */
const clockNodes = [
  ['path', {d: 'M12 6v6l4 2', key: 'mmk7yg'}],
  ['circle', {cx: '12', cy: '12', r: '10', key: '1mglay'}],
] as const satisfies LucideCarouselIconNode;

/** @see lucide-react circle-check */
const circleCheckNodes = [
  ['circle', {cx: '12', cy: '12', r: '10', key: '1mglay'}],
  ['path', {d: 'm9 12 2 2 4-4', key: 'dzmm74'}],
] as const satisfies LucideCarouselIconNode;

/** @see lucide-react scroll-text */
const scrollTextNodes = [
  ['path', {d: 'M15 12h-5', key: 'r7krc0'}],
  ['path', {d: 'M15 8h-5', key: '1khuty'}],
  ['path', {d: 'M19 17V5a2 2 0 0 0-2-2H4', key: 'zz82l3'}],
  [
    'path',
    {
      d: 'M8 21h12a2 2 0 0 0 2-2v-1a1 1 0 0 0-1-1H11a1 1 0 0 0-1 1v1a2 2 0 1 1-4 0V5a2 2 0 1 0-4 0v2a1 1 0 0 0 1 1h3',
      key: '1ph1d7',
    },
  ],
] as const satisfies LucideCarouselIconNode;

/** @see lucide-react landmark */
const landmarkNodes = [
  ['path', {d: 'M10 18v-7', key: 'wt116b'}],
  [
    'path',
    {
      d: 'M11.12 2.198a2 2 0 0 1 1.76.006l7.866 3.847c.476.233.31.949-.22.949H3.474c-.53 0-.695-.716-.22-.949z',
      key: '1m329m',
    },
  ],
  ['path', {d: 'M14 18v-7', key: 'vav6t3'}],
  ['path', {d: 'M18 18v-7', key: 'aexdmj'}],
  ['path', {d: 'M3 22h18', key: '8prr45'}],
  ['path', {d: 'M6 18v-7', key: '1ivflk'}],
] as const satisfies LucideCarouselIconNode;

export const CAROUSEL_LUCIDE_ICON_NODES: Record<
  ContentSlideIconKey,
  LucideCarouselIconNode
> = {
  verify: shieldCheckNodes,
  list: listNodes,
  mail: mailNodes,
  wallet: walletNodes,
  sparkles: sparklesNodes,
  idCard: idCardNodes,
  scanFace: scanFaceNodes,
  fileText: fileTextNodes,
  calendar: calendarNodes,
  ticket: ticketNodes,
  tag: tagNodes,
  upload: uploadNodes,
  bell: bellNodes,
  banknote: banknoteNodes,
  handCoins: handCoinsNodes,
  clock: clockNodes,
  circleCheck: circleCheckNodes,
  scrollText: scrollTextNodes,
  landmark: landmarkNodes,
};
