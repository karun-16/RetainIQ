'use client';

import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  LineChart,
  Line
} from 'recharts';

// --- Types ---
export interface DeptRiskData {
  department: string;
  high: number;
  medium: number;
  low: number;
}

export interface RiskTrendData {
  date: string;
  risk: number;
}

// --- Components ---

export function DepartmentRiskChart({ data }: { data: DeptRiskData[] }) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart
        data={data}
        margin={{ top: 20, right: 30, left: 0, bottom: 5 }}
      >
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
        <XAxis 
          dataKey="department" 
          axisLine={false} 
          tickLine={false} 
          tick={{ fill: '#6B7280', fontSize: 12 }} 
          dy={10}
        />
        <YAxis 
          axisLine={false} 
          tickLine={false} 
          tick={{ fill: '#6B7280', fontSize: 12 }}
        />
        <Tooltip 
          cursor={{ fill: '#F3F4F6' }}
          contentStyle={{ borderRadius: '8px', border: '1px solid #E5E7EB', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
        />
        <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px' }} />
        <Bar dataKey="high" stackId="a" fill="#EF4444" radius={[0, 0, 4, 4]} />
        <Bar dataKey="medium" stackId="a" fill="#F59E0B" />
        <Bar dataKey="low" stackId="a" fill="#10B981" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function IndividualRiskTrendChart({ data }: { data: RiskTrendData[] }) {
  return (
    <ResponsiveContainer width="100%" height={200}>
      <LineChart
        data={data}
        margin={{ top: 5, right: 10, left: -20, bottom: 5 }}
      >
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
        <XAxis 
          dataKey="date" 
          axisLine={false} 
          tickLine={false} 
          tick={{ fill: '#6B7280', fontSize: 10 }}
          dy={10}
        />
        <YAxis 
          domain={[0, 100]}
          axisLine={false} 
          tickLine={false} 
          tick={{ fill: '#6B7280', fontSize: 10 }}
        />
        <Tooltip 
          contentStyle={{ borderRadius: '8px', border: '1px solid #E5E7EB' }}
          labelStyle={{ color: '#374151', fontWeight: 600, marginBottom: '4px' }}
        />
        <Line 
          type="monotone" 
          dataKey="risk" 
          stroke="#2563EB" 
          strokeWidth={3}
          dot={{ r: 4, fill: '#2563EB', strokeWidth: 2, stroke: '#fff' }}
          activeDot={{ r: 6 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
