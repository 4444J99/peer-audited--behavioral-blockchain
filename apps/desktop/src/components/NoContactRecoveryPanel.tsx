import { useState } from "react";
import {
  Shield,
  Phone,
  UserX,
  AlertTriangle,
  Clock,
  CheckCircle,
} from "lucide-react";

interface NoContactTarget {
  id: string;
  identifier: string;
  riskLevel: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  lastContactDate?: Date;
  bypassAttempts: number;
  activeFlag: boolean;
}

interface RecoveryFlow {
  id: string;
  name: string;
  description: string;
  status: "OK" | "WARNING" | "CRITICAL";
  lastChecked: Date;
}

interface NoContactRecoveryPanelProps {
  targets: NoContactTarget[];
  flows?: RecoveryFlow[];
}

const FLOW_DEFINITIONS: RecoveryFlow[] = [
  {
    id: "f1",
    name: "Intentional Break Queuing",
    description: "24h cooldown before any recovery break triggers",
    status: "OK",
    lastChecked: new Date(),
  },
  {
    id: "f2",
    name: "Partner Veto Window",
    description: "Accountability partner can veto within cooldown period",
    status: "OK",
    lastChecked: new Date(),
  },
  {
    id: "f3",
    name: "Isolation Risk Detection",
    description: "Checks if all contracts are no-contact (suicide risk gate)",
    status: "OK",
    lastChecked: new Date(),
  },
  {
    id: "f4",
    name: "Penalty Preview & Weekend Shields",
    description: "Previews financial impact with weekend multiplier awareness",
    status: "OK",
    lastChecked: new Date(),
  },
  {
    id: "f5",
    name: "Grace Day Distribution",
    description: "2/month, calendar-reset, CAS-guarded",
    status: "OK",
    lastChecked: new Date(),
  },
];

export default function NoContactRecoveryPanel({
  targets,
  flows = FLOW_DEFINITIONS,
}: NoContactRecoveryPanelProps) {
  const [activeTab, setActiveTab] = useState<"targets" | "flows">("targets");

  const activeTargets = targets.filter((t) => t.activeFlag);
  const criticalTargets = targets.filter(
    (t) => t.riskLevel === "CRITICAL" || t.riskLevel === "HIGH",
  );

  const flowStatusColor = (status: RecoveryFlow["status"]) => {
    switch (status) {
      case "CRITICAL":
        return "#ef4444";
      case "WARNING":
        return "#f59e0b";
      default:
        return "#22c55e";
    }
  };

  return (
    <div
      className="no-contact-recovery-panel"
      data-testid="no-contact-recovery-panel"
    >
      <div className="no-contact-recovery-panel__header">
        <h3 className="no-contact-recovery-panel__title">
          <Shield size={18} /> No-Contact Recovery Status
        </h3>
        <div className="no-contact-recovery-panel__tabs">
          <button
            className={`no-contact-recovery-panel__tab ${activeTab === "targets" ? "no-contact-recovery-panel__tab--active" : ""}`}
            onClick={() => setActiveTab("targets")}
          >
            <UserX size={14} /> Targets ({activeTargets.length})
          </button>
          <button
            className={`no-contact-recovery-panel__tab ${activeTab === "flows" ? "no-contact-recovery-panel__tab--active" : ""}`}
            onClick={() => setActiveTab("flows")}
          >
            <CheckCircle size={14} /> Flows (
            {flows.filter((f) => f.status === "OK").length}/{flows.length})
          </button>
        </div>
      </div>

      {activeTab === "targets" && (
        <div
          className="no-contact-recovery-panel__targets"
          data-testid="nc-targets"
        >
          {targets.length === 0 && (
            <div className="no-contact-recovery-panel__empty">
              <Shield size={24} /> No no-contact targets configured
            </div>
          )}
          {criticalTargets.length > 0 && (
            <div
              className="no-contact-recovery-panel__alert"
              data-testid="nc-alert"
            >
              <AlertTriangle size={16} /> {criticalTargets.length} high-risk
              target(s) detected
            </div>
          )}
          {targets.map((target) => (
            <div
              key={target.id}
              className={`no-contact-recovery-panel__target no-contact-recovery-panel__target--${target.riskLevel.toLowerCase()}`}
              data-testid={`nc-target-${target.id}`}
            >
              <div className="no-contact-recovery-panel__target-info">
                <Phone size={14} />
                <span className="no-contact-recovery-panel__target-id">
                  {target.identifier}
                </span>
                <span
                  className={`no-contact-recovery-panel__risk no-contact-recovery-panel__risk--${target.riskLevel.toLowerCase()}`}
                >
                  {target.riskLevel}
                </span>
              </div>
              <div className="no-contact-recovery-panel__target-stats">
                <span>Bypass attempts: {target.bypassAttempts}</span>
                {target.lastContactDate && (
                  <span>
                    <Clock size={12} /> Last contact:{" "}
                    {new Date(target.lastContactDate).toLocaleDateString()}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === "flows" && (
        <div
          className="no-contact-recovery-panel__flows"
          data-testid="nc-flows"
        >
          {flows.map((flow) => (
            <div
              key={flow.id}
              className={`no-contact-recovery-panel__flow no-contact-recovery-panel__flow--${flow.status.toLowerCase()}`}
              data-testid={`nc-flow-${flow.id}`}
            >
              <div className="no-contact-recovery-panel__flow-header">
                <span
                  className="no-contact-recovery-panel__flow-status"
                  style={{ color: flowStatusColor(flow.status) }}
                >
                  {flow.status === "OK" ? (
                    <CheckCircle size={14} />
                  ) : (
                    <AlertTriangle size={14} />
                  )}
                </span>
                <strong>{flow.name}</strong>
              </div>
              <p className="no-contact-recovery-panel__flow-desc">
                {flow.description}
              </p>
              <span className="no-contact-recovery-panel__flow-checked">
                <Clock size={12} /> Last checked:{" "}
                {new Date(flow.lastChecked).toLocaleString()}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
