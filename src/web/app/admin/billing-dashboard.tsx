"use client";

import { useState } from "react";
import {
  DollarSign,
  TrendingUp,
  Users,
  CreditCard,
  Activity,
} from "lucide-react";

interface BillingDashboardProps {
  enterpriseId: string;
  enterpriseName?: string;
}

interface BillingMetric {
  label: string;
  value: string;
  change: string;
  icon: React.ReactNode;
}

export default function BillingDashboard({
  enterpriseId,
  enterpriseName,
}: BillingDashboardProps) {
  const [selectedScope, setSelectedScope] = useState<string>("all");

  const metrics: BillingMetric[] = [
    {
      label: "Total Due",
      value: "$0.00",
      change: "+0%",
      icon: <DollarSign size={16} />,
    },
    {
      label: "Active Seats",
      value: "0",
      change: "0",
      icon: <Users size={16} />,
    },
    {
      label: "Consumption (MTD)",
      value: "0 events",
      change: "0%",
      icon: <Activity size={16} />,
    },
    {
      label: "Budget Remaining",
      value: "$0.00",
      change: "100%",
      icon: <TrendingUp size={16} />,
    },
  ];

  return (
    <div className="billing-dashboard" data-testid="billing-dashboard">
      <div className="billing-dashboard__header">
        <h2 className="billing-dashboard__title">
          <CreditCard size={20} /> Billing Dashboard
          {enterpriseName && (
            <span className="billing-dashboard__enterprise">
              {" "}
              — {enterpriseName}
            </span>
          )}
        </h2>
      </div>

      <div className="billing-dashboard__metrics" data-testid="billing-metrics">
        {metrics.map((metric) => (
          <div
            key={metric.label}
            className="billing-dashboard__metric-card"
            data-testid={`metric-${metric.label.toLowerCase().replace(/\s+/g, "-")}`}
          >
            <div className="billing-dashboard__metric-icon">{metric.icon}</div>
            <div className="billing-dashboard__metric-data">
              <span className="billing-dashboard__metric-value">
                {metric.value}
              </span>
              <span className="billing-dashboard__metric-label">
                {metric.label}
              </span>
              <span className="billing-dashboard__metric-change">
                {metric.change}
              </span>
            </div>
          </div>
        ))}
      </div>

      <div className="billing-dashboard__scopes" data-testid="billing-scopes">
        <h3>Scope Controls</h3>
        <div className="billing-dashboard__scope-controls">
          <label htmlFor="scope-select">Scope:</label>
          <select
            id="scope-select"
            value={selectedScope}
            onChange={(e) => setSelectedScope(e.target.value)}
            data-testid="scope-select"
          >
            <option value="all">All Scopes</option>
            <option value="contracts">Contracts</option>
            <option value="seats">Seats</option>
            <option value="api_calls">API Calls</option>
            <option value="storage">Storage (GB)</option>
          </select>
        </div>
        <div
          className="billing-dashboard__scope-table"
          data-testid="scope-table"
        >
          <div className="billing-dashboard__scope-row billing-dashboard__scope-row--header">
            <span>Scope</span>
            <span>Limit</span>
            <span>Used</span>
            <span>Remaining</span>
          </div>
          <div
            className="billing-dashboard__scope-row"
            data-testid="scope-row-contracts"
          >
            <span>Contracts</span>
            <span>100</span>
            <span>0</span>
            <span>100</span>
          </div>
          <div
            className="billing-dashboard__scope-row"
            data-testid="scope-row-seats"
          >
            <span>Seats</span>
            <span>50</span>
            <span>0</span>
            <span>50</span>
          </div>
        </div>
      </div>
    </div>
  );
}
