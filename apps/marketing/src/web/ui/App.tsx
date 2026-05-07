import {useCallback, useEffect, useMemo, useState} from 'react';
import {
  AlertCircle,
  Bot,
  ExternalLink,
  Film,
  LayoutGrid,
  Loader2,
  Menu,
  Moon,
  RefreshCw,
  Sparkles,
  Sun,
  Type,
  UserSquare2,
  Video,
} from 'lucide-react';

import {Alert, AlertDescription, AlertTitle} from '~/components/ui/alert';
import {Badge} from '~/components/ui/badge';
import {Button} from '~/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '~/components/ui/card';
import {cn} from '~/lib/utils';

type BriefKind = 'video_kinetic' | 'video_ai' | 'video_ugc' | 'carousel_howto';

type Brief = {
  id: string;
  slug: string;
  title: string;
  kind: BriefKind | string;
  status: string;
  prompt: string;
  tags: string[] | null;
  targetPlatforms: string[] | null;
};

type RenderRow = {
  id: string;
  briefId: string;
  status: string;
  engine: string;
  variantLabel: string | null;
  errorMessage: string | null;
  assetUrls: unknown;
  durationMs: number | null;
  createdAt: string;
};

type PreviewResponse = {
  url: string | null;
  status: string;
  mp4Key?: string;
  error?: string;
};

type SectionId =
  | 'overview'
  | 'video_kinetic'
  | 'video_ai'
  | 'video_ugc'
  | 'carousel_howto'
  | 'renders';

type SectionDef = {
  id: SectionId;
  label: string;
  description: string;
  icon: typeof Sparkles;
  /** Brief kinds this section shows. Empty = not a brief section. */
  kinds: BriefKind[];
};

const SECTIONS: SectionDef[] = [
  {
    id: 'overview',
    label: 'Resumen',
    description: 'Estado general del estudio local.',
    icon: LayoutGrid,
    kinds: [],
  },
  {
    id: 'video_kinetic',
    label: 'Kinetic Type',
    description: 'Spritz / RSVP — Remotion + audio.',
    icon: Type,
    kinds: ['video_kinetic'],
  },
  {
    id: 'video_ai',
    label: 'IA generativa',
    description: 'Higgsfield, Soul, Veo — b-roll generado.',
    icon: Bot,
    kinds: ['video_ai'],
  },
  {
    id: 'video_ugc',
    label: 'UGC',
    description: 'Capturas reales de la app + voz humana.',
    icon: UserSquare2,
    kinds: ['video_ugc'],
  },
  {
    id: 'carousel_howto',
    label: 'Carruseles',
    description: 'Cómo vender / comprar / postear (Satori).',
    icon: LayoutGrid,
    kinds: ['carousel_howto'],
  },
  {
    id: 'renders',
    label: 'Renders',
    description: 'Cola BullMQ, MP4s y vista previa.',
    icon: Video,
    kinds: [],
  },
];

const BRIEF_SECTIONS = SECTIONS.filter(s => s.kinds.length > 0);

function statusBadgeVariant(
  status: string,
): 'default' | 'secondary' | 'destructive' | 'outline' | 'muted' {
  switch (status) {
    case 'done':
      return 'default';
    case 'running':
    case 'queued':
      return 'secondary';
    case 'failed':
      return 'destructive';
    default:
      return 'muted';
  }
}

function formatRelativeTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) {
    return iso;
  }
  return new Intl.DateTimeFormat('es-UY', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(d);
}

export function App() {
  const [briefs, setBriefs] = useState<Brief[]>([]);
  const [renders, setRenders] = useState<RenderRow[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const [busySlug, setBusySlug] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState<SectionId>('overview');
  const [navOpen, setNavOpen] = useState(false);
  const [selectedRenderId, setSelectedRenderId] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewErr, setPreviewErr] = useState<string | null>(null);
  const [dark, setDark] = useState(() => {
    if (typeof window === 'undefined') {
      return false;
    }
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark);
  }, [dark]);

  const load = useCallback(async () => {
    setErr(null);
    setLoading(true);
    try {
      const [b, r] = await Promise.all([
        fetch('/api/briefs').then(x => x.json()),
        fetch('/api/renders').then(x => x.json()),
      ]);
      if (!Array.isArray(b) || !Array.isArray(r)) {
        setErr('Respuesta inválida del servidor.');
        return;
      }
      setBriefs(b);
      setRenders(r);
    } catch (e) {
      setErr(String(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (!selectedRenderId) {
      setPreviewUrl(null);
      setPreviewErr(null);
      setPreviewLoading(false);
      return;
    }
    const ac = new AbortController();
    setPreviewLoading(true);
    setPreviewErr(null);
    setPreviewUrl(null);
    void (async () => {
      try {
        const res = await fetch(
          `/api/renders/${encodeURIComponent(selectedRenderId)}/preview`,
          {signal: ac.signal},
        );
        const j = (await res.json()) as PreviewResponse & {error?: string};
        if (!res.ok) {
          setPreviewErr(j.error ?? res.statusText);
          return;
        }
        setPreviewUrl(j.url ?? null);
        if (!j.url) {
          setPreviewErr(null);
        }
      } catch (e) {
        if (e instanceof DOMException && e.name === 'AbortError') {
          return;
        }
        setPreviewErr(String(e));
      } finally {
        if (!ac.signal.aborted) {
          setPreviewLoading(false);
        }
      }
    })();
    return () => ac.abort();
  }, [selectedRenderId]);

  const briefsByKind = useMemo(() => {
    const map = new Map<string, Brief[]>();
    for (const b of briefs) {
      const list = map.get(b.kind) ?? [];
      list.push(b);
      map.set(b.kind, list);
    }
    return map;
  }, [briefs]);

  const counts = useMemo(() => {
    const c: Record<SectionId, number> = {
      overview: briefs.length,
      video_kinetic: briefsByKind.get('video_kinetic')?.length ?? 0,
      video_ai: briefsByKind.get('video_ai')?.length ?? 0,
      video_ugc: briefsByKind.get('video_ugc')?.length ?? 0,
      carousel_howto: briefsByKind.get('carousel_howto')?.length ?? 0,
      renders: renders.length,
    };
    return c;
  }, [briefs.length, briefsByKind, renders.length]);

  const selectedRender = selectedRenderId
    ? (renders.find(r => r.id === selectedRenderId) ?? null)
    : null;
  const selectedBriefTitle = selectedRender
    ? (briefs.find(b => b.id === selectedRender.briefId)?.title ?? null)
    : null;

  const toggleRenderSelection = (id: string) => {
    setSelectedRenderId(prev => (prev === id ? null : id));
    setActiveSection('renders');
  };

  const queueRender = async (slug: string) => {
    setBusySlug(slug);
    setErr(null);
    try {
      const res = await fetch('/api/renders', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({briefSlug: slug}),
      });
      const j = (await res.json()) as {error?: string};
      if (!res.ok) {
        setErr(j.error ?? res.statusText);
        return;
      }
      await load();
    } catch (e) {
      setErr(String(e));
    } finally {
      setBusySlug(null);
    }
  };

  const goToSection = (id: SectionId) => {
    setActiveSection(id);
    setNavOpen(false);
  };

  const activeDef = SECTIONS.find(s => s.id === activeSection) ?? SECTIONS[0];

  return (
    <div className="min-h-screen bg-background">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-primary focus:px-4 focus:py-2 focus:text-primary-foreground"
      >
        Ir al contenido
      </a>

      <div className="lg:grid lg:min-h-screen lg:grid-cols-[16rem_1fr]">
        {/* Sidebar */}
        <aside
          className={cn(
            'border-b bg-card lg:sticky lg:top-0 lg:h-screen lg:border-b-0 lg:border-r',
          )}
          aria-label="Navegación de secciones"
        >
          <div className="flex items-center justify-between gap-3 px-4 py-4 sm:px-6 lg:px-5">
            <div className="flex items-center gap-3">
              <div
                className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm"
                aria-hidden
              >
                <Sparkles className="size-5" strokeWidth={2} />
              </div>
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Revendiste
                </p>
                <p className="text-sm font-semibold leading-tight text-foreground">
                  Marketing local
                </p>
              </div>
            </div>
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="lg:hidden"
              onClick={() => setNavOpen(v => !v)}
              aria-expanded={navOpen}
              aria-controls="sidebar-nav"
              aria-label={navOpen ? 'Cerrar menú' : 'Abrir menú'}
            >
              <Menu className="size-4" aria-hidden />
            </Button>
          </div>

          <nav
            id="sidebar-nav"
            className={cn(
              'border-t px-3 pb-4 pt-3 lg:block lg:border-t-0',
              navOpen ? 'block' : 'hidden lg:block',
            )}
          >
            <p className="px-2 pb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Estrategias
            </p>
            <ul className="space-y-1">
              {SECTIONS.map(section => {
                const Icon = section.icon;
                const isActive = section.id === activeSection;
                const count = counts[section.id];
                return (
                  <li key={section.id}>
                    <button
                      type="button"
                      onClick={() => goToSection(section.id)}
                      aria-current={isActive ? 'page' : undefined}
                      className={cn(
                        'group flex w-full cursor-pointer items-center gap-3 rounded-md px-3 py-2 text-left text-sm transition-colors duration-200',
                        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                        isActive
                          ? 'bg-primary text-primary-foreground shadow-sm'
                          : 'text-foreground hover:bg-muted',
                      )}
                    >
                      <Icon
                        className={cn(
                          'size-4 shrink-0',
                          isActive
                            ? 'text-primary-foreground'
                            : 'text-muted-foreground group-hover:text-foreground',
                        )}
                        aria-hidden
                      />
                      <span className="flex-1 truncate font-medium">
                        {section.label}
                      </span>
                      {count > 0 ? (
                        <Badge
                          variant={isActive ? 'secondary' : 'muted'}
                          className="shrink-0"
                        >
                          {count}
                        </Badge>
                      ) : null}
                    </button>
                  </li>
                );
              })}
            </ul>
          </nav>
        </aside>

        {/* Main column */}
        <div className="flex min-w-0 flex-col">
          <header className="sticky top-0 z-30 border-b bg-card/80 backdrop-blur-md">
            <div className="flex items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
              <div className="min-w-0">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Estrategia
                </p>
                <h1 className="truncate text-lg font-semibold leading-tight text-foreground sm:text-xl">
                  {activeDef.label}
                </h1>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="shrink-0"
                  onClick={() => setDark(v => !v)}
                  aria-label={
                    dark ? 'Activar modo claro' : 'Activar modo oscuro'
                  }
                >
                  {dark ? (
                    <Sun className="size-4" aria-hidden />
                  ) : (
                    <Moon className="size-4" aria-hidden />
                  )}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => void load()}
                  disabled={loading}
                  aria-busy={loading}
                  className="gap-2"
                >
                  {loading ? (
                    <Loader2 className="size-4 animate-spin" aria-hidden />
                  ) : (
                    <RefreshCw className="size-4" aria-hidden />
                  )}
                  <span className="hidden sm:inline">Actualizar</span>
                </Button>
              </div>
            </div>
          </header>

          <main
            id="main"
            className="mx-auto w-full max-w-6xl flex-1 space-y-8 px-4 py-8 sm:px-6 lg:px-8 lg:py-10"
          >
            <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">
              {activeDef.description}
            </p>

            {err ? (
              <Alert variant="destructive" className="max-w-3xl">
                <AlertCircle className="size-4" aria-hidden />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{err}</AlertDescription>
              </Alert>
            ) : null}

            {activeSection === 'overview' ? (
              <OverviewPanel
                loading={loading}
                briefsByKind={briefsByKind}
                renders={renders}
                onPickSection={goToSection}
              />
            ) : activeSection === 'renders' ? (
              <RendersPanel
                loading={loading}
                renders={renders}
                briefs={briefs}
                selectedRenderId={selectedRenderId}
                selectedRender={selectedRender}
                selectedBriefTitle={selectedBriefTitle}
                previewUrl={previewUrl}
                previewLoading={previewLoading}
                previewErr={previewErr}
                onSelect={toggleRenderSelection}
                onClose={() => setSelectedRenderId(null)}
              />
            ) : (
              <BriefsPanel
                loading={loading}
                briefs={briefsByKind.get(activeSection) ?? []}
                busySlug={busySlug}
                onQueue={queueRender}
              />
            )}
          </main>
        </div>
      </div>
    </div>
  );
}

function OverviewPanel({
  loading,
  briefsByKind,
  renders,
  onPickSection,
}: {
  loading: boolean;
  briefsByKind: Map<string, Brief[]>;
  renders: RenderRow[];
  onPickSection: (id: SectionId) => void;
}) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {BRIEF_SECTIONS.map(section => {
        const Icon = section.icon;
        const items = briefsByKind.get(section.id) ?? [];
        return (
          <button
            key={section.id}
            type="button"
            onClick={() => onPickSection(section.id)}
            className="group cursor-pointer rounded-lg border bg-card p-5 text-left shadow-sm transition-colors duration-200 hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <div className="flex items-center gap-3">
              <div
                className="flex h-9 w-9 items-center justify-center rounded-md bg-primary/10 text-primary"
                aria-hidden
              >
                <Icon className="size-4" />
              </div>
              <div className="min-w-0">
                <p className="font-medium text-foreground">{section.label}</p>
                <p className="text-xs text-muted-foreground">
                  {section.description}
                </p>
              </div>
              <span className="ml-auto text-2xl font-semibold tabular-nums text-foreground">
                {loading ? '—' : items.length}
              </span>
            </div>
          </button>
        );
      })}
      <button
        type="button"
        onClick={() => onPickSection('renders')}
        className="group cursor-pointer rounded-lg border bg-card p-5 text-left shadow-sm transition-colors duration-200 hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <div className="flex items-center gap-3">
          <div
            className="flex h-9 w-9 items-center justify-center rounded-md bg-primary/10 text-primary"
            aria-hidden
          >
            <Video className="size-4" />
          </div>
          <div className="min-w-0">
            <p className="font-medium text-foreground">Renders</p>
            <p className="text-xs text-muted-foreground">
              Cola y MP4s recientes.
            </p>
          </div>
          <span className="ml-auto text-2xl font-semibold tabular-nums text-foreground">
            {loading ? '—' : renders.length}
          </span>
        </div>
      </button>
    </div>
  );
}

function BriefsPanel({
  loading,
  briefs,
  busySlug,
  onQueue,
}: {
  loading: boolean;
  briefs: Brief[];
  busySlug: string | null;
  onQueue: (slug: string) => void;
}) {
  return (
    <Card className="overflow-hidden">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Film className="size-5 text-primary" aria-hidden />
          <CardTitle>Briefs</CardTitle>
        </div>
        <CardDescription>
          Ideas guardadas en Postgres y en{' '}
          <code className="font-mono text-xs">seeds/briefs/</code>.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {loading ? (
          <ul
            className="space-y-3"
            aria-busy="true"
            aria-label="Cargando briefs"
          >
            {[1, 2, 3].map(i => (
              <li
                key={i}
                className="h-24 animate-pulse rounded-lg bg-muted/60"
              />
            ))}
          </ul>
        ) : briefs.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No hay briefs en esta estrategia. Agregá uno en{' '}
            <code className="font-mono">seeds/briefs/</code> y ejecutá{' '}
            <code className="font-mono">pnpm db:seed</code>.
          </p>
        ) : (
          <ul className="space-y-4">
            {briefs.map(b => (
              <li
                key={b.id}
                className="rounded-lg border bg-muted/30 p-4 transition-colors hover:bg-muted/50"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0 space-y-2">
                    <p className="font-medium leading-snug text-foreground">
                      {b.title}
                    </p>
                    <p className="font-mono text-xs text-muted-foreground">
                      {b.slug}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="outline">{b.kind}</Badge>
                      <Badge variant={statusBadgeVariant(b.status)}>
                        {b.status}
                      </Badge>
                      {(b.targetPlatforms ?? []).map(p => (
                        <Badge key={p} variant="muted">
                          {p}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <Button
                    type="button"
                    className="shrink-0 sm:self-start"
                    disabled={busySlug !== null}
                    aria-busy={busySlug === b.slug}
                    onClick={() => onQueue(b.slug)}
                  >
                    {busySlug === b.slug ? (
                      <>
                        <Loader2 className="size-4 animate-spin" aria-hidden />
                        Encolando…
                      </>
                    ) : (
                      <>
                        <Sparkles className="size-4" aria-hidden />
                        Render Remotion
                      </>
                    )}
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

function RendersPanel({
  loading,
  renders,
  selectedRenderId,
  selectedRender,
  selectedBriefTitle,
  previewUrl,
  previewLoading,
  previewErr,
  onSelect,
  onClose,
}: {
  loading: boolean;
  renders: RenderRow[];
  briefs: Brief[];
  selectedRenderId: string | null;
  selectedRender: RenderRow | null;
  selectedBriefTitle: string | null;
  previewUrl: string | null;
  previewLoading: boolean;
  previewErr: string | null;
  onSelect: (id: string) => void;
  onClose: () => void;
}) {
  return (
    <Card className="overflow-hidden">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Loader2 className="size-5 text-primary" aria-hidden />
          <CardTitle>Renders recientes</CardTitle>
        </div>
        <CardDescription>
          Tocá un render para ver el MP4 (enlace firmado a MinIO/R2 cuando el
          estado es <span className="font-medium text-foreground">done</span>).
        </CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <ul
            className="space-y-3"
            aria-busy="true"
            aria-label="Cargando renders"
          >
            {[1, 2, 3, 4].map(i => (
              <li
                key={i}
                className="h-16 animate-pulse rounded-lg bg-muted/60"
              />
            ))}
          </ul>
        ) : renders.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Todavía no hay renders. Encolá uno desde una estrategia.
          </p>
        ) : (
          <>
            <ul className="max-h-[min(28rem,55vh)] space-y-3 overflow-y-auto pr-1">
              {renders.map(r => {
                const isSelected = selectedRenderId === r.id;
                return (
                  <li key={r.id}>
                    <button
                      type="button"
                      onClick={() => onSelect(r.id)}
                      className={cn(
                        'w-full cursor-pointer rounded-lg border bg-card p-4 text-left shadow-sm transition-colors hover:bg-muted/40',
                        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                        isSelected && 'border-primary ring-1 ring-primary/30',
                      )}
                      aria-pressed={isSelected}
                      aria-label={`Render ${r.id.slice(0, 8)}, estado ${r.status}`}
                    >
                      <div className="flex flex-wrap items-center gap-2">
                        <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">
                          {r.id.slice(0, 8)}…
                        </code>
                        <Badge variant="outline">{r.engine}</Badge>
                        <Badge variant={statusBadgeVariant(r.status)}>
                          {r.status}
                        </Badge>
                        <span className="ml-auto text-xs text-muted-foreground">
                          {formatRelativeTime(r.createdAt)}
                        </span>
                      </div>
                      {r.variantLabel ? (
                        <p className="mt-2 text-xs text-muted-foreground">
                          Variante: {r.variantLabel}
                        </p>
                      ) : null}
                      {r.errorMessage ? (
                        <pre className="mt-2 max-h-24 overflow-auto rounded-md bg-destructive/10 p-2 font-mono text-xs text-destructive">
                          {r.errorMessage}
                        </pre>
                      ) : null}
                    </button>
                  </li>
                );
              })}
            </ul>

            {selectedRenderId ? (
              <div
                className="mt-6 border-t pt-6"
                role="region"
                aria-label="Vista previa del render"
              >
                <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
                  <p className="font-medium text-foreground">Vista previa</p>
                  <code className="break-all font-mono text-xs text-muted-foreground">
                    {selectedRenderId}
                  </code>
                </div>
                {selectedBriefTitle ? (
                  <p className="mb-2 text-sm text-muted-foreground">
                    Brief:{' '}
                    <span className="font-medium text-foreground">
                      {selectedBriefTitle}
                    </span>
                  </p>
                ) : null}
                {previewLoading ? (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2
                      className="size-4 shrink-0 animate-spin"
                      aria-hidden
                    />
                    Generando enlace seguro…
                  </div>
                ) : previewErr ? (
                  <Alert variant="destructive">
                    <AlertCircle className="size-4" aria-hidden />
                    <AlertTitle>No se pudo cargar la vista previa</AlertTitle>
                    <AlertDescription>{previewErr}</AlertDescription>
                  </Alert>
                ) : previewUrl ? (
                  <div className="space-y-3">
                    <video
                      key={previewUrl}
                      className="aspect-video w-full max-w-2xl rounded-lg border bg-black object-contain"
                      controls
                      playsInline
                      preload="metadata"
                      src={previewUrl}
                    >
                      Tu navegador no reproduce video embebido.
                    </video>
                    <div className="flex flex-wrap gap-2">
                      <Button variant="outline" size="sm" asChild>
                        <a
                          href={previewUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="gap-2"
                        >
                          <ExternalLink className="size-4" aria-hidden />
                          Abrir MP4 en nueva pestaña
                        </a>
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={onClose}
                      >
                        Cerrar
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Si el video no carga, revisá CORS del bucket en MinIO (GET
                      desde este origen).
                    </p>
                  </div>
                ) : selectedRender ? (
                  <p className="text-sm text-muted-foreground">
                    {selectedRender.status === 'done'
                      ? 'No hay clave MP4 en assetUrls todavía. Volvé a actualizar cuando el worker termine de subir a S3.'
                      : `El MP4 está disponible cuando el estado es done (actual: ${selectedRender.status}).`}
                  </p>
                ) : null}
              </div>
            ) : (
              <p className="mt-4 text-sm text-muted-foreground">
                Seleccioná un render de la lista para ver el video acá.
              </p>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
