export type SpritzAdProps = {
  hook: string[];
  problem: string[];
  solution: string[];
  pitch: string[];
  cta: string;
  /**
   * Display cadence in words per second.
   * Typical RSVP mapping: WPM / 60 (e.g. 250 WPM → ~4.17).
   */
  wordsPerSecond: number;
  /**
   * Cadence after the Nth `__blank__` beat (default 1 = first blank in the stream).
   * Defaults to `wordsPerSecond` when omitted.
   */
  wordsPerSecondAfterBlank?: number;
  /**
   * Use `wordsPerSecondAfterBlank` only after this many `__blank__` beats have
   * occurred (default 1). Set to 2 if you insert a breath between intro and story.
   */
  slowWpmAfterBlankCount?: number;
  /** Pause after problem section (seconds) */
  pauseAfterProblemSec: number;
  /** Logo outro length (seconds) */
  outroSec: number;
};

/** RSVP-style reading speed for the default Spritz ad (words per minute). */
export const defaultSpritzWordsPerMinute = 250;

/**
 * One frame-beat shows the Revendiste logo instead of a word (use inside `hook` / sections).
 */
export const spritzLogoBeat = '__logo__';

/** One frame-beat of empty canvas (breath / gap between phrases). */
export const spritzBlankBeat = '__blank__';

export const defaultSpritzProps: SpritzAdProps = {
  hook: [
    // HOOK — reading-speed trivia (250 WPM = 1 word per beat at 125 BPM)
    '¿Cuántas',
    'palabras',
    'podés',
    'leer',
    'en',
    'un',
    'minuto?',
    'La',
    'persona',
    'promedio',
    'lee',
    'de',
    '200',
    'a',
    '250',
    'por',
    'minuto',
    // 3 breath beats before the ad
    spritzBlankBeat,
    spritzBlankBeat,
    spritzBlankBeat,
    // INDIRECT AD
    'Compraste',
    'una',
    'entrada',
    'para',
    'un',
    'evento',
    'y',
    'no',
    'podés',
    'ir',
    'No',
    'te',
    'preocupes',
    'publicala',
    'en',
    spritzLogoBeat,
    'y',
    'transferila',
    'a',
    'otra',
    'persona',
  ],
  problem: [],
  solution: [],
  pitch: [],
  cta: '',
  // 250 WPM throughout. At 30 fps that's ~7 frames/word — also lines up with
  // 125 BPM (1 word per beat).
  wordsPerSecond: defaultSpritzWordsPerMinute / 60,
  pauseAfterProblemSec: 0,
  outroSec: 3,
};

function pauseFramesAfterProblem(props: SpritzAdProps, fps: number): number {
  if (props.problem.length === 0) {
    return 0;
  }
  return Math.round(props.pauseAfterProblemSec * fps);
}

export function countSpritzWords(props: SpritzAdProps): number {
  const ctaWords = props.cta.trim().split(/\s+/).filter(Boolean);
  return (
    props.hook.length +
    props.problem.length +
    props.solution.length +
    props.pitch.length +
    ctaWords.length
  );
}

export type SpritzSequenceItem = {
  from: number;
  durationInFrames: number;
  word: string;
  kind: 'word' | 'logo' | 'blank';
};

/** Word / logo / blank beats with per-item duration (fast before `__blank__`, slower after). */
export function buildSpritzSequencePlan(
  props: SpritzAdProps,
  fps: number,
): SpritzSequenceItem[] {
  const pauseFrames = Math.round(props.pauseAfterProblemSec * fps);
  const sections: {words: string[]; pauseAfter?: number}[] = [
    {words: props.hook},
    {words: props.problem, pauseAfter: pauseFrames},
    {words: props.solution},
    {words: props.pitch},
    {words: props.cta.trim().split(/\s+/).filter(Boolean)},
  ];

  const wpsSlow = props.wordsPerSecondAfterBlank ?? props.wordsPerSecond;
  const slowAfterBlanks = props.slowWpmAfterBlankCount ?? 1;
  const items: SpritzSequenceItem[] = [];
  let offset = 0;
  let blanksSeen = 0;

  for (const sec of sections) {
    for (const w of sec.words) {
      const useSlow = blanksSeen >= slowAfterBlanks;
      const wps = useSlow ? wpsSlow : props.wordsPerSecond;
      const durationInFrames = Math.max(2, Math.round(fps / wps));
      const kind =
        w === spritzLogoBeat
          ? 'logo'
          : w === spritzBlankBeat
            ? 'blank'
            : 'word';
      items.push({from: offset, durationInFrames, word: w, kind});
      offset += durationInFrames;
      if (w === spritzBlankBeat) {
        blanksSeen += 1;
      }
    }
    if (sec.pauseAfter && sec.words.length > 0) {
      offset += sec.pauseAfter;
    }
  }
  return items;
}

export function spritzMainContentEndFrame(
  props: SpritzAdProps,
  fps: number,
): number {
  const items = buildSpritzSequencePlan(props, fps);
  if (items.length === 0) {
    return 0;
  }
  const last = items[items.length - 1]!;
  return last.from + last.durationInFrames;
}

export function spritzDurationInFrames(
  props: SpritzAdProps,
  fps: number,
): number {
  const outroFrames = Math.round(props.outroSec * fps);
  return spritzMainContentEndFrame(props, fps) + outroFrames;
}

/**
 * Normalize a raw blank/logo token to the canonical form. Tolerates common
 * typos like `_blank_`, `_blank__`, `___blank___`, and any case variation of
 * `logo` / `blank` wrapped in underscores.
 */
function normalizeToken(raw: string): string {
  const m = raw
    .trim()
    .toLowerCase()
    .match(/^_+([a-z0-9]+)_+$/);
  if (!m) {
    return raw;
  }
  const inner = m[1];
  if (inner === 'blank') return spritzBlankBeat;
  if (inner === 'logo') return spritzLogoBeat;
  return raw;
}

function asStringArray(v: unknown): string[] | null {
  if (!Array.isArray(v)) return null;
  return v.map(x => String(x)).map(normalizeToken);
}

function asNumber(v: unknown): number | null {
  if (typeof v === 'number' && Number.isFinite(v)) return v;
  if (typeof v === 'string' && v.trim() !== '') {
    const n = Number(v);
    if (Number.isFinite(n)) return n;
  }
  return null;
}

/**
 * Build a fully-formed `SpritzAdProps` from arbitrary brief JSON, merging over
 * `defaultSpritzProps` and normalizing tokens. Unknown / missing keys fall back
 * to defaults so partial briefs still render.
 */
export function parseSpritzProps(raw: unknown): SpritzAdProps {
  const obj =
    raw && typeof raw === 'object' && !Array.isArray(raw)
      ? (raw as Record<string, unknown>)
      : {};

  const hook = asStringArray(obj.hook) ?? defaultSpritzProps.hook;
  const problem = asStringArray(obj.problem) ?? defaultSpritzProps.problem;
  const solution = asStringArray(obj.solution) ?? defaultSpritzProps.solution;
  const pitch = asStringArray(obj.pitch) ?? defaultSpritzProps.pitch;
  const cta = typeof obj.cta === 'string' ? obj.cta : defaultSpritzProps.cta;

  return {
    hook,
    problem,
    solution,
    pitch,
    cta,
    wordsPerSecond:
      asNumber(obj.wordsPerSecond) ?? defaultSpritzProps.wordsPerSecond,
    wordsPerSecondAfterBlank:
      asNumber(obj.wordsPerSecondAfterBlank) ??
      defaultSpritzProps.wordsPerSecondAfterBlank,
    slowWpmAfterBlankCount:
      asNumber(obj.slowWpmAfterBlankCount) ??
      defaultSpritzProps.slowWpmAfterBlankCount,
    pauseAfterProblemSec:
      asNumber(obj.pauseAfterProblemSec) ??
      defaultSpritzProps.pauseAfterProblemSec,
    outroSec: asNumber(obj.outroSec) ?? defaultSpritzProps.outroSec,
  };
}
