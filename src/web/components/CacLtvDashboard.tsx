"use client";

import React, { useState, useEffect } from "react";
import {
  DollarSign,
  TrendingUp,
  Users,
  BarChart3,
  ArrowUp,
  ArrowDown,
} from "lucide-react";

type MetricStatus = "measured" | "unavailable";

interface MetricValue {
  current: number | null;
  previous?: number | null;
  trend?: number | null;
  status?: MetricStatus;
  reason?: string;
}

interface CacLtvData {
  cac: MetricValue;
  ltv: MetricValue;
  ltvCacRatio: MetricValue;
  paybackDays: MetricValue;
  monthlyBurn: MetricValue;
  totalUsers: { current: number; newThisMonth: number; status?: MetricStatus };
  payingUsers: { current: number; pct: number; status?: MetricStatus };
  monthlyRevenue: {
    current: number;
    previous?: number;
    recurringPct: number;
    status?: MetricStatus;
    label?: string;
  };
}

export function CacLtvDashboard() {
  const [data, setData] = useState<CacLtvData | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    fetch("/api/admin/financial-metrics")
      .then((r) => r.json())
      .then(setData)
      .catch(() => {
        setLoadError(true);
      })
      .finally(() => setLoading(false));
  }, []);

  const formatMoney = (value: number | null | undefined) =>
    value == null
      ? "Unavailable"
      : `$${value.toLocaleString(undefined, { maximumFractionDigits: 2, minimumFractionDigits: 2 })}`;

  const formatNumber = (value: number | null | undefined, suffix = "") =>
    value == null ? "Unavailable" : `${value.toLocaleString()}${suffix}`;

  const MetricCard = ({
    label,
    value,
    trend,
    suffix,
    icon,
    unavailableReason,
  }: {
    label: string;
    value: string;
    trend?: number | null;
    suffix?: string;
    icon: React.ReactNode;
    unavailableReason?: string;
  }) => (
    <div className="p-4 bg-gray-900 rounded-lg border border-gray-800">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-gray-500 uppercase tracking-wider">
          {label}
        </span>
        {icon}
      </div>
      <div className="text-2xl font-bold">
        {value}
        {suffix}
      </div>
      {unavailableReason && (
        <div className="text-xs mt-1 text-amber-300">{unavailableReason}</div>
      )}
      {trend !== undefined && trend !== null && !unavailableReason && (
        <div
          className={`flex items-center gap-1 text-xs mt-1 ${trend >= 0 ? "text-green-400" : "text-red-400"}`}
        >
          {trend >= 0 ? (
            <ArrowUp className="w-3 h-3" />
          ) : (
            <ArrowDown className="w-3 h-3" />
          )}
          {Math.abs(trend).toFixed(1)}% vs last period
        </div>
      )}
    </div>
  );

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 animate-pulse">
        {[...Array(8)].map((_, i) => (
          <div
            key={i}
            className="h-24 bg-gray-900 rounded-lg border border-gray-800"
          />
        ))}
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="p-4 bg-gray-900 rounded-lg border border-amber-700 text-amber-200">
        CAC / LTV metrics are unavailable because the admin financial metrics
        endpoint could not be loaded.
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
        <MetricCard
          label="CAC (Customer Acquisition Cost)"
          value={formatMoney(data?.cac?.current)}
          trend={data?.cac?.trend}
          unavailableReason={data?.cac?.reason}
          icon={<Users className="w-4 h-4 text-blue-400" />}
        />
        <MetricCard
          label="LTV (Lifetime Value)"
          value={formatMoney(data?.ltv?.current)}
          trend={data?.ltv?.trend}
          icon={<DollarSign className="w-4 h-4 text-green-400" />}
        />
        <MetricCard
          label="LTV:CAC Ratio"
          value={formatNumber(data?.ltvCacRatio?.current)}
          trend={data?.ltvCacRatio?.trend}
          unavailableReason={data?.ltvCacRatio?.reason}
          icon={<TrendingUp className="w-4 h-4 text-purple-400" />}
        />
        <MetricCard
          label="Payback Period"
          value={formatNumber(data?.paybackDays?.current)}
          trend={data?.paybackDays?.trend}
          suffix={data?.paybackDays?.current == null ? "" : " days"}
          unavailableReason={data?.paybackDays?.reason}
          icon={<TrendingUp className="w-4 h-4 text-yellow-400" />}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          label="Monthly Burn"
          value={formatMoney(data?.monthlyBurn?.current)}
          unavailableReason={data?.monthlyBurn?.reason}
          icon={<DollarSign className="w-4 h-4 text-red-400" />}
        />
        <MetricCard
          label="Total Users"
          value={(data?.totalUsers?.current ?? 0).toLocaleString()}
          suffix={` (+${data?.totalUsers?.newThisMonth ?? 0} this mo)`}
          icon={<Users className="w-4 h-4 text-blue-400" />}
        />
        <MetricCard
          label="Paying Users"
          value={(data?.payingUsers?.current ?? 0).toLocaleString()}
          suffix={` (${data?.payingUsers?.pct ?? 0}%)`}
          icon={<Users className="w-4 h-4 text-green-400" />}
        />
        <MetricCard
          label="Test-Money Contract Value"
          value={formatMoney(data?.monthlyRevenue?.current)}
          suffix={` (${data?.monthlyRevenue?.recurringPct ?? 0}% subscription-linked)`}
          icon={<DollarSign className="w-4 h-4 text-green-400" />}
        />
      </div>

      <div className="p-4 bg-gray-900 rounded-lg border border-gray-800">
        <h3 className="font-semibold mb-3">Metrics Reference</h3>
        <div className="text-sm text-gray-400 space-y-2">
          <p>
            <strong className="text-gray-200">CAC:</strong> Total sales &amp;
            marketing cost / new customers acquired. Unavailable until a
            sales/marketing cost ledger exists.
          </p>
          <p>
            <strong className="text-gray-200">LTV:</strong> Average test-money
            contract value per paying user for the measured period.
          </p>
          <p>
            <strong className="text-gray-200">LTV:CAC Ratio:</strong>{" "}
            Unavailable until CAC has a measured acquisition-cost source.
          </p>
          <p>
            <strong className="text-gray-200">Payback Period:</strong> Months to
            recover CAC. Unavailable until CAC is measured.
          </p>
        </div>
      </div>
    </div>
  );
}
