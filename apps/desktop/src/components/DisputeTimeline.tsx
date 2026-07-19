import { useState, useCallback, useMemo } from "react";
import {
  Clock,
  ZoomIn,
  ZoomOut,
  AlertCircle,
  CheckCircle,
  XCircle,
  ArrowRight,
} from "lucide-react";

export interface EvidenceNode {
  id: string;
  timestamp: Date;
  type: "ATTESTATION" | "PROOF" | "DISPUTE" | "RESOLUTION" | "COSIGN";
  actorId: string;
  actorName: string;
  summary: string;
  verdict?: "ACCEPTED" | "REJECTED" | "PENDING";
  metadata?: Record<string, unknown>;
}

interface DisputeTimelineProps {
  evidence: EvidenceNode[];
  contractId: string;
}

export default function DisputeTimeline({
  evidence,
  contractId,
}: DisputeTimelineProps) {
  const [zoom, setZoom] = useState(1);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [filter, setFilter] = useState<string | null>(null);

  const handleZoomIn = useCallback(
    () => setZoom((z) => Math.min(z + 0.25, 2)),
    [],
  );
  const handleZoomOut = useCallback(
    () => setZoom((z) => Math.max(z - 0.25, 0.5)),
    [],
  );

  const filteredEvidence = useMemo(() => {
    if (!filter) return evidence;
    return evidence.filter((n) => n.type === filter);
  }, [evidence, filter]);

  const sortedEvidence = useMemo(
    () =>
      [...filteredEvidence].sort(
        (a, b) =>
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
      ),
    [filteredEvidence],
  );

  const typeIcon = (
    type: EvidenceNode["type"],
    verdict?: EvidenceNode["verdict"],
  ) => {
    if (verdict === "ACCEPTED")
      return (
        <CheckCircle className="dispute-timeline__icon--accepted" size={16} />
      );
    if (verdict === "REJECTED")
      return <XCircle className="dispute-timeline__icon--rejected" size={16} />;
    switch (type) {
      case "DISPUTE":
        return (
          <AlertCircle className="dispute-timeline__icon--dispute" size={16} />
        );
      case "RESOLUTION":
        return (
          <ArrowRight
            className="dispute-timeline__icon--resolution"
            size={16}
          />
        );
      default:
        return <Clock className="dispute-timeline__icon--default" size={16} />;
    }
  };

  const nodeTypes = Array.from(new Set(evidence.map((n) => n.type)));

  return (
    <div className="dispute-timeline" data-testid="dispute-timeline">
      <div className="dispute-timeline__toolbar">
        <h3 className="dispute-timeline__title">
          Dispute Timeline — {contractId}
        </h3>
        <div className="dispute-timeline__controls">
          <button onClick={handleZoomIn} aria-label="Zoom in" title="Zoom in">
            <ZoomIn size={16} />
          </button>
          <span className="dispute-timeline__zoom-level">
            {Math.round(zoom * 100)}%
          </span>
          <button
            onClick={handleZoomOut}
            aria-label="Zoom out"
            title="Zoom out"
          >
            <ZoomOut size={16} />
          </button>
          <select
            value={filter || ""}
            onChange={(e) => setFilter(e.target.value || null)}
            className="dispute-timeline__filter-select"
            aria-label="Filter by type"
          >
            <option value="">All types</option>
            {nodeTypes.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div
        className="dispute-timeline__track"
        style={{ transform: `scale(${zoom})`, transformOrigin: "top left" }}
      >
        {sortedEvidence.length === 0 && (
          <div
            className="dispute-timeline__empty"
            data-testid="dispute-timeline-empty"
          >
            <Clock size={24} /> No evidence recorded
          </div>
        )}
        {sortedEvidence.map((node, idx) => (
          <div
            key={node.id}
            className={`dispute-timeline__node ${selectedNode === node.id ? "dispute-timeline__node--selected" : ""}`}
            data-testid={`dispute-node-${node.id}`}
            onClick={() =>
              setSelectedNode(selectedNode === node.id ? null : node.id)
            }
          >
            <div className="dispute-timeline__node-connector">
              {idx < sortedEvidence.length - 1 && (
                <div className="dispute-timeline__line" />
              )}
              <div
                className={`dispute-timeline__dot dispute-timeline__dot--${node.type.toLowerCase()}`}
              />
            </div>
            <div className="dispute-timeline__node-content">
              <div className="dispute-timeline__node-header">
                {typeIcon(node.type, node.verdict)}
                <span className="dispute-timeline__node-type">{node.type}</span>
                <span className="dispute-timeline__node-time">
                  {new Date(node.timestamp).toLocaleString()}
                </span>
              </div>
              <p className="dispute-timeline__node-summary">{node.summary}</p>
              <span className="dispute-timeline__node-actor">
                — {node.actorName}
              </span>
              {selectedNode === node.id && node.metadata && (
                <div
                  className="dispute-timeline__detail-panel"
                  data-testid={`detail-${node.id}`}
                >
                  <h4>Details</h4>
                  <pre>{JSON.stringify(node.metadata, null, 2)}</pre>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
