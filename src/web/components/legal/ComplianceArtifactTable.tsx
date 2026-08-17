'use client';

import React, { useEffect, useState } from 'react';
import type { ComplianceArtifactStatus } from '@styx/shared/index';
import { api } from '../../services/api-client';

interface GatedArtifact {
  artifactType: string;
  title: string;
  repoPath: string;
}

/**
 * The release gate's required-type list is `COMPLIANCE_REQUIRED_TYPES` in
 * scripts/validation/08-compliance-artifact-check.sh (default:
 * skill_contest_whitepaper). The gate resolves a type to a file through the
 * `artifact_path` column of the database row, never from the filename — so the
 * type-to-path mapping exists nowhere in the repository. It is restated here so
 * a reader can hash the source document themselves and compare it against the
 * live digest below.
 */
const GATED_ARTIFACTS: GatedArtifact[] = [
  {
    artifactType: 'skill_contest_whitepaper',
    title: 'Skill-Based Contest Whitepaper',
    repoPath: 'docs/legal/legal--skill-based-contest-whitepaper.md',
  },
];

type LoadState = 'loading' | 'ready' | 'unavailable';

function formatTimestamp(value: string | null): string {
  if (!value) return 'Not recorded';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toISOString().replace('T', ' ').replace(/\.\d+Z$/, ' UTC');
}

export default function ComplianceArtifactTable() {
  const [artifacts, setArtifacts] = useState<ComplianceArtifactStatus[]>([]);
  const [loadState, setLoadState] = useState<LoadState>('loading');

  useEffect(() => {
    let cancelled = false;

    api
      .getComplianceArtifacts()
      .then((data) => {
        if (cancelled) return;
        setArtifacts(Array.isArray(data) ? data : []);
        setLoadState('ready');
      })
      .catch(() => {
        if (cancelled) return;
        setArtifacts([]);
        setLoadState('unavailable');
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const byType = new Map(artifacts.map((a) => [a.artifactType, a]));

  // Anything active in the database that is not on the required list still
  // belongs on this page: the register is what the estate publishes, and a
  // silently-added artifact is exactly what a public hash register exists to
  // surface.
  const extraTypes = artifacts
    .map((a) => a.artifactType)
    .filter((type) => !GATED_ARTIFACTS.some((g) => g.artifactType === type));

  const rows: GatedArtifact[] = [
    ...GATED_ARTIFACTS,
    ...extraTypes.map((artifactType) => ({
      artifactType,
      title: artifactType,
      repoPath: 'Not on the required-type list',
    })),
  ];

  return (
    <div className="space-y-6">
      {loadState === 'unavailable' && (
        <p className="text-xs text-amber-500">
          The compliance register could not be reached. The artifact set below is still accurate;
          only the live digests are missing.
        </p>
      )}

      {rows.map((row) => {
        const live = byType.get(row.artifactType);
        return (
          <div key={row.artifactType} className="border border-neutral-800 rounded p-4 space-y-3">
            <div>
              <h3 className="text-base font-bold text-white">{row.title}</h3>
              <p className="text-xs text-neutral-500 font-mono mt-1">{row.artifactType}</p>
            </div>

            <dl className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div className="sm:col-span-3">
                <dt className="text-neutral-500 uppercase tracking-wide">Source document</dt>
                <dd className="text-neutral-300 font-mono break-all">{row.repoPath}</dd>
              </div>

              <div className="sm:col-span-3">
                <dt className="text-neutral-500 uppercase tracking-wide">SHA-256 content hash</dt>
                <dd className="text-neutral-300 font-mono break-all">
                  {loadState === 'loading'
                    ? 'Checking the live register…'
                    : live?.contentHash || 'No active artifact recorded'}
                </dd>
              </div>

              <div>
                <dt className="text-neutral-500 uppercase tracking-wide">Version</dt>
                <dd className="text-neutral-300">
                  {loadState === 'loading' ? '—' : live?.version || 'None'}
                </dd>
              </div>

              <div>
                <dt className="text-neutral-500 uppercase tracking-wide">Signed by</dt>
                <dd className="text-neutral-300">
                  {loadState === 'loading' ? '—' : live?.signedBy || 'Awaiting counsel signature'}
                </dd>
              </div>

              <div>
                <dt className="text-neutral-500 uppercase tracking-wide">Signed at</dt>
                <dd className="text-neutral-300">
                  {loadState === 'loading' ? '—' : formatTimestamp(live?.signedAt ?? null)}
                </dd>
              </div>

              <div>
                <dt className="text-neutral-500 uppercase tracking-wide">Expires</dt>
                <dd className="text-neutral-300">
                  {loadState === 'loading'
                    ? '—'
                    : live?.expiresAt
                      ? formatTimestamp(live.expiresAt)
                      : 'No expiration'}
                </dd>
              </div>

              <div className="sm:col-span-2">
                <dt className="text-neutral-500 uppercase tracking-wide">Jurisdictions</dt>
                <dd className="text-neutral-300">
                  {loadState === 'loading'
                    ? '—'
                    : live?.jurisdictions?.length
                      ? live.jurisdictions.join(', ')
                      : 'Not scoped'}
                </dd>
              </div>
            </dl>
          </div>
        );
      })}
    </div>
  );
}
