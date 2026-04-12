'use client';

import {format, parseISO} from 'date-fns';
import {es} from 'date-fns/locale';
import {Area, AreaChart, CartesianGrid, XAxis, YAxis} from 'recharts';
import type {GetDashboardTicketsTimeSeriesResponse} from '~/lib/api/generated';
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '~/components/ui/chart';

const chartConfig = {
  published: {
    label: 'Publicadas',
    color: 'hsl(var(--chart-1))',
  },
  sold: {
    label: 'Vendidas',
    color: 'hsl(var(--chart-2))',
  },
} satisfies ChartConfig;

type Props = {
  data: GetDashboardTicketsTimeSeriesResponse | undefined;
  isLoading?: boolean;
};

export function TicketsAreaChart({data, isLoading}: Props) {
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
        Sin entradas en este periodo.
      </p>
    );
  }

  const chartData = data.rows.map(r => ({
    day: r.day,
    published: r.published,
    sold: r.sold,
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
          name={chartConfig.published.label as string}
          dataKey='published'
          type='natural'
          fill='var(--color-published)'
          fillOpacity={0.35}
          stroke='var(--color-published)'
          strokeWidth={2}
        />
        <Area
          name={chartConfig.sold.label as string}
          dataKey='sold'
          type='natural'
          fill='var(--color-sold)'
          fillOpacity={0.35}
          stroke='var(--color-sold)'
          strokeWidth={2}
        />
        <ChartLegend content={<ChartLegendContent />} />
      </AreaChart>
    </ChartContainer>
  );
}
