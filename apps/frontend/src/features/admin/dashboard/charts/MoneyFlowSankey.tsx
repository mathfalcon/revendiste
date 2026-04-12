'use client';

import type {SankeyNode as D3SankeyNode} from 'd3-sankey';
import {useCallback, useMemo} from 'react';
import type {GetDashboardRevenueResponse} from '~/lib/api/generated';
import {
  SankeyChart,
  SankeyLink,
  SankeyNode,
  SankeyTooltip,
  type SankeyData,
  type SankeyLinkDatum,
  type SankeyNodeDatum,
} from '~/components/charts/sankey';
import {formatCurrency} from '~/utils';
import {moneyFlowSankeyNodeFill} from '../dashboard-chart-palette';

function parseN(s: string): number {
  const n = parseFloat(s);
  return Number.isFinite(n) ? n : 0;
}

function buildSankeyData(
  revenue: GetDashboardRevenueResponse,
): SankeyData | null {
  const gmv = parseN(revenue.gmv);
  if (gmv <= 0) {
    return null;
  }

  const pc = parseN(revenue.platformCommission);
  const vat = parseN(revenue.vatOnCommission);
  const fees = parseN(revenue.processorFees);
  const net = parseN(revenue.netPlatformIncome);
  const commVat = Math.max(0, pc + vat);
  const seller = Math.max(0, gmv - commVat);

  const feesFlow =
    commVat > 0 ? Math.min(Math.max(fees, 0), commVat) : Math.max(fees, 0);
  const netFlow = Math.max(commVat - feesFlow, 0);

  const incVat = parseN(revenue.platformIncomeVatAmount);

  const nodes: SankeyData['nodes'] = [
    {name: 'Total pagado (GMV)', category: 'source'},
    {name: 'Subtotal vendedor', category: 'landing'},
    {name: 'Comisión + IVA (pedido)', category: 'landing'},
    {name: 'Fees procesador', category: 'outcome'},
    {name: 'Ingreso neto plataforma', category: 'landing'},
  ];

  const links: SankeyData['links'] = [
    {source: 0, target: 1, value: Math.max(seller, 0.0001)},
    {source: 0, target: 2, value: Math.max(commVat, 0.0001)},
    {source: 2, target: 3, value: Math.max(feesFlow, 0.0001)},
    {source: 2, target: 4, value: Math.max(netFlow, 0.0001)},
  ];

  if (net > 0 && netFlow > 0.0001) {
    const vatPart = Math.min(Math.max(incVat, 0), netFlow);
    const afterPart = Math.max(netFlow - vatPart, 0.0001);
    nodes.push(
      {name: 'IVA empresa (est.)', category: 'outcome'},
      {name: 'Neto tras IVA', category: 'outcome'},
    );
    const i5 = 5;
    const i6 = 6;
    links.push(
      {source: 4, target: i5, value: Math.max(vatPart, 0.0001)},
      {source: 4, target: i6, value: afterPart},
    );
  }

  return {nodes, links};
}

type Props = {
  revenue: GetDashboardRevenueResponse | undefined;
  isLoading?: boolean;
};

const CHART_MARGIN = {top: 32, right: 140, bottom: 32, left: 140};

export function MoneyFlowSankey({revenue, isLoading}: Props) {
  const data = useMemo(
    () => (revenue ? buildSankeyData(revenue) : null),
    [revenue],
  );

  const formatMoney = useMemo(() => {
    const currency = revenue?.currency ?? 'UYU';
    return (v: number) => formatCurrency(String(v), currency);
  }, [revenue?.currency]);

  const getSankeyNodeColor = useCallback(
    (node: D3SankeyNode<SankeyNodeDatum, SankeyLinkDatum>) =>
      moneyFlowSankeyNodeFill(node.name ?? ''),
    [],
  );

  if (isLoading || !revenue) {
    return (
      <div
        className='flex min-h-[280px] items-center justify-center rounded-lg border border-dashed text-sm text-muted-foreground'
        aria-hidden
      >
        Cargando diagrama…
      </div>
    );
  }

  if (!data) {
    return (
      <p className='text-sm text-muted-foreground'>
        No hay volumen de GMV en este periodo para dibujar el flujo.
      </p>
    );
  }

  const net = parseN(revenue.netPlatformIncome);

  return (
    <div className='space-y-2'>
      {revenue.mixedCurrency ? (
        <p className='text-xs text-amber-600 dark:text-amber-500'>
          Varias monedas: importes sumados; el diagrama es orientativo.
        </p>
      ) : null}
      {net < 0 ? (
        <p className='text-xs text-muted-foreground'>
          Ingreso neto negativo en el periodo: el Sankey muestra la división
          hasta ingreso neto; el reparto IVA empresa no aplica.
        </p>
      ) : null}
      <SankeyChart
        aspectRatio='16 / 9'
        className='min-h-[320px] w-full'
        data={data}
        margin={CHART_MARGIN}
        nodePadding={24}
        nodeWidth={16}
      >
        <SankeyLink getNodeColor={getSankeyNodeColor} strokeOpacity={0.55} />
        <SankeyNode
          formatNodeValue={formatMoney}
          getNodeColor={getSankeyNodeColor}
          lineCap={4}
        />
        <SankeyTooltip formatValue={formatMoney} />
      </SankeyChart>
    </div>
  );
}
