'use client';

import {format, parseISO} from 'date-fns';
import {es} from 'date-fns/locale';
import {Area, AreaChart, CartesianGrid, XAxis, YAxis} from 'recharts';
import type {GetDashboardOrdersTimeSeriesResponse} from '~/lib/api/generated';
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '~/components/ui/chart';
import {
  dashboardChartBlueTheme,
  dashboardChartGreyTheme,
  dashboardChartPositive,
} from '../dashboard-chart-palette';

const chartConfig = {
  confirmed: {
    label: 'Confirmadas',
    color: dashboardChartPositive,
  },
  pending: {
    label: 'Pendientes',
    theme: dashboardChartBlueTheme,
  },
  expired: {
    label: 'Expiradas',
    theme: dashboardChartGreyTheme,
  },
  cancelled: {
    label: 'Canceladas',
    color: 'hsl(var(--destructive))',
  },
} satisfies ChartConfig;

type Props = {
  data: GetDashboardOrdersTimeSeriesResponse | undefined;
  isLoading?: boolean;
};

export function OrdersAreaChart({data, isLoading}: Props) {
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
        Sin órdenes en este periodo.
      </p>
    );
  }

  const chartData = data.rows.map(r => ({
    day: r.day,
    confirmed: r.confirmed,
    pending: r.pending,
    expired: r.expired,
    cancelled: r.cancelled,
  }));

  return (
    <ChartContainer config={chartConfig} className='aspect-[21/9] min-h-[280px] w-full'>
      <AreaChart accessibilityLayer data={chartData} margin={{left: 4, right: 8}}>
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
        <YAxis tickLine={false} axisLine={false} width={36} allowDecimals={false} />
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
                  {Number(value).toLocaleString('es-UY')}
                </span>
              )}
            />
          }
        />
        <Area
          name={chartConfig.confirmed.label as string}
          dataKey='confirmed'
          type='natural'
          fill='var(--color-confirmed)'
          fillOpacity={0.55}
          stroke='var(--color-confirmed)'
          stackId='orders'
        />
        <Area
          name={chartConfig.pending.label as string}
          dataKey='pending'
          type='natural'
          fill='var(--color-pending)'
          fillOpacity={0.55}
          stroke='var(--color-pending)'
          stackId='orders'
        />
        <Area
          name={chartConfig.expired.label as string}
          dataKey='expired'
          type='natural'
          fill='var(--color-expired)'
          fillOpacity={0.55}
          stroke='var(--color-expired)'
          stackId='orders'
        />
        <Area
          name={chartConfig.cancelled.label as string}
          dataKey='cancelled'
          type='natural'
          fill='var(--color-cancelled)'
          fillOpacity={0.55}
          stroke='var(--color-cancelled)'
          stackId='orders'
        />
        <ChartLegend content={<ChartLegendContent />} />
      </AreaChart>
    </ChartContainer>
  );
}
