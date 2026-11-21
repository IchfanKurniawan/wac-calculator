import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { C, fmtFixed } from './tokens';

export interface WacComparisonChartProps {
  data: { name: string; baseline: number; design: number }[];
  unit: string;
}

/** Chart lives in its own lazy chunk so recharts never blocks the wizard. */
export default function WacComparisonChart({ data, unit }: WacComparisonChartProps) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} layout="vertical">
        <XAxis type="number" tick={{ fontSize: 11, fill: C.muted }} axisLine={{ stroke: C.line }} tickLine={false} />
        <YAxis dataKey="name" type="category" tick={{ fontSize: 12, fill: C.body, fontWeight: 500 }} axisLine={false} tickLine={false} width={100} />
        <Tooltip
          contentStyle={{ background: '#fff', border: `1px solid ${C.line}`, borderRadius: 8, boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
          labelStyle={{ color: C.heading, fontWeight: 600 }}
          itemStyle={{ fontSize: 12 }}
          formatter={(value: number) => [fmtFixed(value, 3), unit]}
        />
        <Bar dataKey="baseline" name="Baseline" fill={C.heading} radius={[0, 4, 4, 0]} maxBarSize={24} />
        <Bar dataKey="design" name="Desain" fill={C.accent} radius={[4, 0, 0, 4]} maxBarSize={24} />
      </BarChart>
    </ResponsiveContainer>
  );
}
