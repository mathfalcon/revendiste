'use client';

import {Cell, Pie, PieChart} from 'recharts';
import type {OrderCurrencyBreakdownRow} from '~/lib/api/generated';
import {
  ChartContainer,
  ChartTooltip,
  ChartLegend,
  ChartLegendContent,
  type ChartConfig,
} from '~/components/ui/chart';
import {dashboardChartIsDark} from '../dashboard-chart-palette';

/** Colors per currency key — extend if more currencies are added. */
const CURRENCY_COLORS: Record<string, {light: string; dark: string}> = {
  UYU: {light: 'hsl(152 60% 40%)', dark: 'hsl(152 55% 48%)'},
  USD: {light: 'hsl(217 91% 58%)', dark: 'hsl(213 90% 62%)'},
  ARS: {light: 'hsl(40 96% 50%)', dark: 'hsl(40 92% 56%)'},
  BRL: {light: 'hsl(25 88% 52%)', dark: 'hsl(25 84% 58%)'},
};

const FALLBACK_COLORS: Array<{light: string; dark: string}> = [
  {light: 'hsl(262 80% 58%)', dark: 'hsl(262 76% 64%)'},
  {light: 'hsl(340 75% 52%)', dark: 'hsl(340 70% 58%)'},
];

function getCurrencyColor(currency: string, index: number): string {
  const palette =
    CURRENCY_COLORS[currency] ??
    FALLBACK_COLORS[index % FALLBACK_COLORS.length] ??
    FALLBACK_COLORS[0]!;
  return dashboardChartIsDark() ? palette.dark : palette.light;
}

type Props = {
  rows: OrderCurrencyBreakdownRow[];
};

export function CurrencyBreakdownDonut({rows}: Props) {
  const chartData = rows.map((r, i) => ({
    currency: r.currency,
    value: r.orderCount,
    fill: getCurrencyColor(r.currency, i),
  }));

  const totalOrders = chartData.reduce((sum, d) => sum + d.value, 0);

  const chartConfig = Object.fromEntries(
    rows.map((r, i) => [
      r.currency,
      {
        label: r.currency,
        color: getCurrencyColor(r.currency, i),
      },
    ]),
  ) satisfies ChartConfig;

  return (
    <ChartContainer
      config={chartConfig}
      className='mx-auto aspect-square max-h-[220px] w-full'
    >
      <PieChart>
        <ChartTooltip
          content={({payload}) => {
            if (!payload?.length) return null;
            const item = payload[0]?.payload as (typeof chartData)[number];
            if (!item) return null;
            const pct =
              totalOrders > 0
                ? ((item.value / totalOrders) * 100).toFixed(1)
                : '0.0';
            return (
              <div className='rounded-lg border bg-background px-3 py-2 text-xs shadow-md'>
                <p className='font-semibold'>{item.currency}</p>
                <p className='text-muted-foreground'>
                  Órdenes:{' '}
                  <span className='font-medium text-foreground tabular-nums'>
                    {item.value}
                  </span>
                </p>
                <p className='text-muted-foreground'>
                  Participación:{' '}
                  <span className='font-medium text-foreground tabular-nums'>
                    {pct}%
                  </span>
                </p>
              </div>
            );
          }}
        />
        <Pie
          data={chartData}
          dataKey='value'
          nameKey='currency'
          innerRadius='55%'
          outerRadius='80%'
          paddingAngle={2}
        >
          {chartData.map(entry => (
            <Cell key={entry.currency} fill={entry.fill} />
          ))}
        </Pie>
        <ChartLegend
          content={<ChartLegendContent nameKey='currency' />}
          className='flex-wrap'
        />
      </PieChart>
    </ChartContainer>
  );
}
