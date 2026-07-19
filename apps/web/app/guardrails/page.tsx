"use client";

import React, { Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import CrisisIntervention from "../../components/guardrails/CrisisIntervention";
import { useAuth } from "../../contexts/AuthContext";

const VALID_SEVERITIES = new Set(["info", "warning", "critical"]);

function GuardrailsContent() {
  const { user, isLoading: authLoading } = useAuth();
  const searchParams = useSearchParams();
  const router = useRouter();

  const severityRaw = searchParams.get("severity");
  const severity = VALID_SEVERITIES.has(severityRaw ?? "")
    ? (severityRaw as "info" | "warning" | "critical")
    : "warning";
  const trigger = searchParams.get("trigger");
  const cooldownParam = searchParams.get("cooldown");

  const cooldownMinutes = cooldownParam ? parseInt(cooldownParam, 10) : 15;

  const handleDismiss = () => {
    router.push("/dashboard");
  };

  if (authLoading) return null;

  return (
    <CrisisIntervention
      severity={severity}
      trigger={trigger || undefined}
      cooldownMinutes={cooldownMinutes}
      onDismiss={handleDismiss}
      userId={user?.id}
    />
  );
}

export default function GuardrailsPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-black text-white flex items-center justify-center">
          <Loader2 className="animate-spin mr-3" size={24} />
          <span className="text-neutral-400 font-bold">Loading...</span>
        </div>
      }
    >
      <GuardrailsContent />
    </Suspense>
  );
}
