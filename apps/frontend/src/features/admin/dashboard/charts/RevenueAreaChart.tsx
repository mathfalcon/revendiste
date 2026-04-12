'use client';

import {format, parseISO} from 'date-fns';
import {es} from 'date-fns/locale';
import {Area, AreaChart, CartesianGrid, XAxis, YAxis} from 'recharts';
import type {
  GetDashboardRevenueTimeSeriesResponse,
  EventTicketCurrency,
} from '~/lib/api/generated';
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '~/components/ui/chart';
import {formatCurrency} from '~/utils';
import {
  dashboardChartBlueTheme,
  dashboardChartGreyTheme,
  dashboardChartPositive,
} from '../dashboard-chart-palette';

const chartConfig = {
  processor: {
    label: 'Fees procesador',
    theme: dashboardChartBlueTheme,
  },
  incomeVat: {
    label: 'IVA empresa (est.)',
    theme: dashboardChartGreyTheme,
  },
  netAfter: {
    label: 'Neto tras IVA',
    color: dashboardChartPositive,
  },
} satisfies ChartConfig;

function parseN(s: string): number {
  const n = parseFloat(s);
  return Number.isFinite(n) ? n : 0;
}

type Props = {
  data: GetDashboardRevenueTimeSeriesResponse | undefined;
  isLoading?: boolean;
};

export function RevenueAreaChart({data, isLoading}: Props) {
  if (isLoading || !data) {
    return (
      <div className='flex min-h-[280px] items-center justify-center rounded-lg border border-dashed text-sm text-muted-foreground'>
        Cargando…
      </div>
    );
  }

  if (!data.rows.length) {
    return (
      <p className='text-sm text-muted-foreground'>
        Sin puntos en este periodo.
      </p>
    );
  }

  const currency: EventTicketCurrency = data.currency;
  const chartData = data.rows.map(r => ({
    day: r.day,
    processor: parseN(r.processorFees),
    incomeVat: parseN(r.platformIncomeVatAmount),
    netAfter: parseN(r.netPlatformIncomeAfterIncomeVat),
  }));

  return (
    <div className='space-y-2'>
      {data.mixedCurrency ? (
        <p className='text-xs text-amber-600 dark:text-amber-500'>
          Varias monedas: series sumadas en una sola escala.
        </p>
      ) : null}
      <ChartContainer config={chartConfig} className='aspect-[21/9] min-h-[280px] w-full'>
        <AreaChart accessibilityLayer data={chartData} margin={{left: 8, right: 8}}>
          <CartesianGrid vertical={false} />
          <XAxis
            dataKey='day'
            tickLine={false}
            axisLine={false}
            tickMargin={8}
            tickFormatter={v => {
              try {
                return format(parseISO(String(v)), 'd MMM', {locale: es});
              } catch {
                return String(v);
              }
            }}
          />
          <YAxis
            tickLine={false}
            axisLine={false}
            width={56}
            tickFormatter={v =>
              new Intl.NumberFormat('es-UY', {
                notation: 'compact',
                maximumFractionDigits: 1,
              }).format(Number(v))
            }
          />
          <ChartTooltip
            content={
              <ChartTooltipContent
                labelFormatter={(_, payload) => {
                  const row = payload?.[0]?.payload as {day?: string} | undefined;
                  if (!row?.day) {
                    return '';
                  }
                  try {
                    return format(parseISO(row.day), 'd MMM yyyy', {locale: es});
                  } catch {
                    return row.day;
                  }
                }}
                valueFormatter={value => (
                  <span className='tabular-nums'>
                    {formatCurrency(String(value), currency)}
                  </span>
                )}
              />
            }
          />
          <Area
            name={chartConfig.processor.label as string}
            dataKey='processor'
            type='natural'
            fill='var(--color-processor)'
            fillOpacity={0.6}
            stroke='var(--color-processor)'
            stackId='revenue'
          />
          <Area
            name={chartConfig.incomeVat.label as string}
            dataKey='incomeVat'
            type='natural'
            fill='var(--color-incomeVat)'
            fillOpacity={0.6}
            stroke='var(--color-incomeVat)'
            stackId='revenue'
          />
          <Area
            name={chartConfig.netAfter.label as string}
            dataKey='netAfter'
            type='natural'
            fill='var(--color-netAfter)'
            fillOpacity={0.6}
            stroke='var(--color-netAfter)'
            stackId='revenue'
          />
          <ChartLegend content={<ChartLegendContent />} />
        </AreaChart>
      </ChartContainer>
    </div>
  );
}
