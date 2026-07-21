'use client';

import React, { useState, useEffect } from 'react';
import { DollarSign, TrendingUp, Users, BarChart3, ArrowUp, ArrowDown } from 'lucide-react';

interface CacLtvData {
  cac: { current: number; previous: number; trend: number };
  ltv: { current: number; previous: number; trend: number };
  ltvCacRatio: { current: number; trend: number };
  paybackDays: { current: number; trend: number };
  monthlyBurn: { current: number; previous: number };
  totalUsers: { current: number; newThisMonth: number };
  payingUsers: { current: number; pct: number };
  monthlyRevenue: { current: number; recurringPct: number };
}

export function CacLtvDashboard() {
  const [data, setData] = useState<CacLtvData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/admin/financial-metrics')
      .then(r => r.json())
      .then(setData)
      .catch(() => {
        setData({
          cac: { current: 0, previous: 0, trend: 0 },
          ltv: { current: 0, previous: 0, trend: 0 },
          ltvCacRatio: { current: 0, trend: 0 },
          paybackDays: { current: 0, trend: 0 },
          monthlyBurn: { current: 0, previous: 0 },
          totalUsers: { current: 0, newThisMonth: 0 },
          payingUsers: { current: 0, pct: 0 },
          monthlyRevenue: { current: 0, recurringPct: 0 },
        });
      })
      .finally(() => setLoading(false));
  }, []);

  const MetricCard = ({ label, value, trend, prefix, suffix, icon }: {
    label: string; value: string; trend?: number; prefix?: string; suffix?: string; icon: React.ReactNode;
  }) => (
    <div className="p-4 bg-gray-900 rounded-lg border border-gray-800">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-gray-500 uppercase tracking-wider">{label}</span>
        {icon}
      </div>
      <div className="text-2xl font-bold">{prefix}{value}{suffix}</div>
      {trend !== undefined && (
        <div className={`flex items-center gap-1 text-xs mt-1 ${trend >= 0 ? 'text-green-400' : 'text-red-400'}`}>
          {trend >= 0 ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />}
          {Math.abs(trend).toFixed(1)}% vs last period
        </div>
      )}
    </div>
  );

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 animate-pulse">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="h-24 bg-gray-900 rounded-lg border border-gray-800" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 mb-4">
        <BarChart3 className="w-6 h-6 text-blue-400" />
        <h2 className="text-xl font-bold">CAC / LTV Dashboard</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard label="CAC (Customer Acquisition Cost)" value={`$${(data?.cac?.current ?? 0).toFixed(2)}`} trend={data?.cac?.trend} icon={<Users className="w-4 h-4 text-blue-400" />} />
        <MetricCard label="LTV (Lifetime Value)" value={`$${(data?.ltv?.current ?? 0).toFixed(2)}`} trend={data?.ltv?.trend} icon={<DollarSign className="w-4 h-4 text-green-400" />} />
        <MetricCard label="LTV:CAC Ratio" value={(data?.ltvCacRatio?.current ?? 0).toFixed(2)} trend={data?.ltvCacRatio?.trend} icon={<TrendingUp className="w-4 h-4 text-purple-400" />} />
        <MetricCard label="Payback Period" value={`${data?.paybackDays?.current ?? 0}`} trend={data?.paybackDays?.trend} suffix=" days" icon={<TrendingUp className="w-4 h-4 text-yellow-400" />} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard label="Monthly Burn" value={`$${(data?.monthlyBurn?.current ?? 0).toLocaleString()}`} icon={<DollarSign className="w-4 h-4 text-red-400" />} />
        <MetricCard label="Total Users" value={(data?.totalUsers?.current ?? 0).toLocaleString()} suffix={` (+${data?.totalUsers?.newThisMonth ?? 0} this mo)`} icon={<Users className="w-4 h-4 text-blue-400" />} />
        <MetricCard label="Paying Users" value={(data?.payingUsers?.current ?? 0).toLocaleString()} suffix={` (${data?.payingUsers?.pct ?? 0}%)`} icon={<Users className="w-4 h-4 text-green-400" />} />
        <MetricCard label="Monthly Revenue" value={`$${(data?.monthlyRevenue?.current ?? 0).toLocaleString()}`} suffix={` (${data?.monthlyRevenue?.recurringPct ?? 0}% recurring)`} icon={<DollarSign className="w-4 h-4 text-green-400" />} />
      </div>

      <div className="p-4 bg-gray-900 rounded-lg border border-gray-800">
        <h3 className="font-semibold mb-3">Metrics Reference</h3>
        <div className="text-sm text-gray-400 space-y-2">
          <p><strong className="text-gray-200">CAC:</strong> Total sales &amp; marketing cost / new customers acquired. Target: &lt;$50 for consumer, &lt;$500 for B2B.</p>
          <p><strong className="text-gray-200">LTV:</strong> Average revenue per user over their lifetime. Target: 3x+ CAC.</p>
          <p><strong className="text-gray-200">LTV:CAC Ratio:</strong> The higher the better. 3:1 is healthy, 5:1+ is excellent.</p>
          <p><strong className="text-gray-200">Payback Period:</strong> Months to recover CAC. Target: &lt;12 months.</p>
        </div>
      </div>
    </div>
  );
}
