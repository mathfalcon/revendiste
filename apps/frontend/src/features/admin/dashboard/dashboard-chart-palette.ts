/**
 * Admin dashboard chart colors — single source of truth for Recharts + Sankey.
 *
 * - **Blue** (`dashboardChartBlue`): processor fees, pending orders (in-flight / acción).
 * - **Grey** (`dashboardChartGrey`): IVA / impuestos estimados, órdenes expiradas (inactivo).
 * - **Positive** (`dashboardChartPositive`): neto tras IVA, órdenes confirmadas (chart-2, tema).
 */

export const dashboardChartBlue = {
  light: 'hsl(217 91% 58%)',
  dark: 'hsl(213 90% 62%)',
} as const;

export const dashboardChartGrey = {
  light: 'hsl(220 9% 56%)',
  dark: 'hsl(215 14% 52%)',
} as const;

/** Use inside `ChartConfig` `{ theme: … }` for shadcn ChartContainer. */
export const dashboardChartBlueTheme = dashboardChartBlue;
export const dashboardChartGreyTheme = dashboardChartGrey;

export const dashboardChartPositive = 'hsl(var(--chart-2))';

export function dashboardChartIsDark(): boolean {
  return (
    typeof document !== 'undefined' &&
    document.documentElement.classList.contains('dark')
  );
}

export function dashboardChartBlueColor(): string {
  return dashboardChartIsDark()
    ? dashboardChartBlue.dark
    : dashboardChartBlue.light;
}

export function dashboardChartGreyColor(): string {
  return dashboardChartIsDark()
    ? dashboardChartGrey.dark
    : dashboardChartGrey.light;
}

/** Sankey node fills — blue/grey aligned with area charts. */
export function moneyFlowSankeyNodeFill(nodeName: string): string {
  switch (nodeName) {
    case 'Fees procesador':
      return dashboardChartBlueColor();
    case 'IVA empresa (est.)':
      return dashboardChartGreyColor();
    case 'Total pagado (GMV)':
      return 'hsl(var(--chart-1))';
    case 'Subtotal vendedor':
      return 'hsl(var(--chart-4))';
    case 'Comisión + IVA (plataforma)':
      return 'hsl(var(--chart-5))';
    case 'Ingreso neto plataforma':
      return dashboardChartPositive;
    case 'Neto tras IVA':
      return dashboardChartPositive;
    default:
      return 'hsl(var(--muted-foreground))';
  }
}
