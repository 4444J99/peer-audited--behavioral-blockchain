"use client";

import React, { useState, useEffect } from "react";
import {
  AlertTriangle,
  Heart,
  Phone,
  Clock,
  Shield,
  ArrowLeft,
  ExternalLink,
  Loader2,
} from "lucide-react";
import Link from "next/link";
import { api } from "../../services/api-client";

interface SupportResource {
  name: string;
  contact: string;
  instructions: string;
}

interface CrisisInterventionProps {
  severity?: "info" | "warning" | "critical";
  trigger?: string;
  resources?: SupportResource[];
  cooldownMinutes?: number;
  onDismiss?: () => void;
  onContactSupport?: () => void;
  embedded?: boolean;
  userId?: string;
}

const SEVERITY_STYLES = {
  info: {
    border: "border-blue-800",
    bg: "bg-blue-950/30",
    badge: "bg-blue-900/50 text-blue-400 border-blue-700",
    icon: "text-blue-500",
    gradient: "from-blue-600 to-blue-800",
  },
  warning: {
    border: "border-yellow-800",
    bg: "bg-yellow-950/30",
    badge: "bg-yellow-900/50 text-yellow-400 border-yellow-700",
    icon: "text-yellow-500",
    gradient: "from-yellow-600 to-yellow-800",
  },
  critical: {
    border: "border-red-800",
    bg: "bg-red-950/30",
    badge: "bg-red-900/50 text-red-400 border-red-700",
    icon: "text-red-500",
    gradient: "from-red-600 to-red-800",
  },
};

const DEFAULT_RESOURCES: SupportResource[] = [
  {
    name: "National Crisis Hotline",
    contact: "988",
    instructions: "Call or text 988. Available 24/7 for emotional support.",
  },
  {
    name: "Crisis Text Line",
    contact: "Text HOME to 741741",
    instructions: "Free crisis counseling via text message. Available 24/7.",
  },
  {
    name: "SAMHSA Helpline",
    contact: "1-800-662-4357",
    instructions:
      "Confidential referral for mental health and substance use treatment.",
  },
];

export default function CrisisIntervention({
  severity = "warning",
  trigger,
  resources,
  cooldownMinutes = 15,
  onDismiss,
  onContactSupport,
  embedded = false,
  userId,
}: CrisisInterventionProps) {
  const [cooldownRemaining, setCooldownRemaining] = useState(
    cooldownMinutes * 60,
  );
  const [escalating, setEscalating] = useState(false);
  const [escalationResult, setEscalationResult] = useState<string | null>(null);
  const style = SEVERITY_STYLES[severity];

  useEffect(() => {
    if (cooldownRemaining <= 0) return;
    const interval = setInterval(() => {
      setCooldownRemaining((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(interval);
  }, [cooldownRemaining]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  const handleEscalate = async () => {
    if (!userId) return;
    setEscalating(true);
    try {
      const result = await api.escalateCrisis(userId, trigger || "self-report");
      setEscalationResult(
        `Support resources dispatched. An escort will follow up.`,
      );
      if (onContactSupport) onContactSupport();
    } catch (err) {
      setEscalationResult(
        err instanceof Error ? err.message : "Failed to escalate",
      );
    } finally {
      setEscalating(false);
    }
  };

  const displayResources = resources || DEFAULT_RESOURCES;

  const content = (
    <div className={`space-y-6 ${embedded ? "" : "max-w-2xl mx-auto"}`}>
      <div
        className={`p-6 rounded-2xl border ${style.border} ${style.bg} space-y-4`}
      >
        <div className="flex items-start gap-4">
          <div className={`shrink-0 mt-1 ${style.icon}`}>
            {severity === "critical" ? (
              <AlertTriangle size={28} />
            ) : (
              <Heart size={28} />
            )}
          </div>
          <div className="space-y-2 flex-1">
            <div className="flex items-center gap-3 flex-wrap">
              <h2 className="text-lg font-black text-white uppercase tracking-tight">
                {severity === "critical"
                  ? "Action Paused — Support Available"
                  : "Pause — Check In With Yourself"}
              </h2>
              <span
                className={`px-2 py-0.5 rounded text-xs font-bold uppercase tracking-wider border ${style.badge}`}
              >
                {severity}
              </span>
            </div>
            <p className="text-sm text-neutral-300 leading-relaxed">
              {trigger
                ? `Your activity was paused because: "${trigger}". This is a protective measure.`
                : "Your activity has been temporarily paused by Styx safety guardrails. This is a protective measure to ensure your wellbeing."}
            </p>
          </div>
        </div>

        {cooldownRemaining > 0 && (
          <div className="flex items-center gap-3 p-3 rounded-xl bg-black/40 border border-neutral-800">
            <Clock className={`shrink-0 ${style.icon}`} size={20} />
            <div className="flex-1">
              <p className="text-xs text-neutral-500 uppercase tracking-widest font-bold">
                Cooldown Remaining
              </p>
              <p className="text-xl font-mono font-bold text-white tabular-nums">
                {formatTime(cooldownRemaining)}
              </p>
            </div>
            <div className="w-24 h-2 rounded-full bg-neutral-800 overflow-hidden">
              <div
                className={`h-full rounded-full bg-gradient-to-r ${style.gradient} transition-all duration-1000`}
                style={{
                  width: `${(cooldownRemaining / (cooldownMinutes * 60)) * 100}%`,
                }}
              />
            </div>
          </div>
        )}
      </div>

      <div className="p-6 rounded-2xl border border-neutral-800 bg-neutral-900/50 space-y-4">
        <div className="flex items-center gap-2">
          <Phone className="text-green-500" size={20} />
          <h3 className="font-bold text-white uppercase tracking-widest text-sm">
            Support Resources
          </h3>
        </div>
        <p className="text-xs text-neutral-500 leading-relaxed">
          These resources are available 24/7 — reaching out is always the right
          call. Styx will never penalize you for seeking help.
        </p>
        <div className="grid gap-3">
          {displayResources.map((resource, i) => (
            <div
              key={i}
              className="p-4 rounded-xl bg-black/40 border border-neutral-800 space-y-1.5"
            >
              <div className="flex items-center justify-between">
                <p className="text-sm font-bold text-white">{resource.name}</p>
                <span className="text-xs font-mono text-green-400 bg-green-950/50 px-2 py-0.5 rounded border border-green-900/50">
                  {resource.contact}
                </span>
              </div>
              <p className="text-xs text-neutral-500">
                {resource.instructions}
              </p>
            </div>
          ))}
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        {userId && (
          <button
            onClick={handleEscalate}
            disabled={escalating}
            className="flex-1 py-3 bg-red-700 hover:bg-red-600 disabled:opacity-50 text-white font-bold rounded-xl transition-colors flex items-center justify-center gap-2 uppercase tracking-wider text-sm"
          >
            {escalating ? (
              <Loader2 className="animate-spin" size={16} />
            ) : (
              <Shield size={16} />
            )}
            {escalating ? "Escalating..." : "Request Support Escalation"}
          </button>
        )}
        {onDismiss && (
          <button
            onClick={onDismiss}
            className="flex-1 py-3 bg-neutral-800 hover:bg-neutral-700 text-white font-bold rounded-xl transition-colors flex items-center justify-center gap-2 uppercase tracking-wider text-sm"
          >
            <ArrowLeft size={16} />
            Return to Dashboard
          </button>
        )}
      </div>

      {escalationResult && (
        <p className="text-xs text-neutral-500 text-center">
          {escalationResult}
        </p>
      )}
    </div>
  );

  if (embedded) return content;

  return (
    <div className="min-h-screen bg-black text-white font-sans p-6 md:p-12">
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-2 text-neutral-400 hover:text-white transition-colors mb-8"
      >
        <ArrowLeft size={18} />
        <span className="text-sm font-bold uppercase tracking-wider">
          Dashboard
        </span>
      </Link>
      {content}
    </div>
  );
}
