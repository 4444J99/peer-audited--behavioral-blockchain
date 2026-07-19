import { useState, useMemo } from "react";
import { FileSearch, Download, Eye, Calendar, Hash } from "lucide-react";

export interface AuditEntry {
  id: string;
  eventType: string;
  timestamp: Date;
  actorId: string;
  actorName: string;
  targetId?: string;
  changes: Record<string, { from: unknown; to: unknown }>;
  ipAddress?: string;
}

interface AuditTrailViewerProps {
  entries: AuditEntry[];
  title?: string;
}

export default function AuditTrailViewer({
  entries,
  title,
}: AuditTrailViewerProps) {
  const [search, setSearch] = useState("");
  const [expandedEntry, setExpandedEntry] = useState<string | null>(null);

  const filteredEntries = useMemo(() => {
    if (!search) return entries;
    const q = search.toLowerCase();
    return entries.filter(
      (e) =>
        e.eventType.toLowerCase().includes(q) ||
        e.actorName.toLowerCase().includes(q) ||
        e.actorId.toLowerCase().includes(q),
    );
  }, [entries, search]);

  const handleExport = () => {
    const blob = new Blob([JSON.stringify(entries, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `audit-trail-${new Date().toISOString().split("T")[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="audit-trail-viewer" data-testid="audit-trail-viewer">
      <div className="audit-trail-viewer__toolbar">
        <h3 className="audit-trail-viewer__title">
          <FileSearch size={18} /> {title || "Audit Trail"}
        </h3>
        <div className="audit-trail-viewer__controls">
          <input
            type="text"
            placeholder="Search events..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="audit-trail-viewer__search"
            data-testid="audit-search"
          />
          <button
            onClick={handleExport}
            className="audit-trail-viewer__export-btn"
            title="Export as JSON"
          >
            <Download size={16} /> Export
          </button>
        </div>
      </div>

      <div className="audit-trail-viewer__list">
        {filteredEntries.length === 0 && (
          <div className="audit-trail-viewer__empty" data-testid="audit-empty">
            <FileSearch size={24} /> No audit entries found
          </div>
        )}
        {filteredEntries.map((entry) => (
          <div
            key={entry.id}
            className={`audit-trail-viewer__entry ${expandedEntry === entry.id ? "audit-trail-viewer__entry--expanded" : ""}`}
            data-testid={`audit-entry-${entry.id}`}
          >
            <div
              className="audit-trail-viewer__entry-header"
              onClick={() =>
                setExpandedEntry(expandedEntry === entry.id ? null : entry.id)
              }
            >
              <span className="audit-trail-viewer__event-type">
                {entry.eventType}
              </span>
              <span className="audit-trail-viewer__actor">
                <Eye size={14} /> {entry.actorName}
              </span>
              <span className="audit-trail-viewer__timestamp">
                <Calendar size={14} />{" "}
                {new Date(entry.timestamp).toLocaleString()}
              </span>
            </div>
            {expandedEntry === entry.id && (
              <div
                className="audit-trail-viewer__entry-detail"
                data-testid={`audit-detail-${entry.id}`}
              >
                <div className="audit-trail-viewer__detail-row">
                  <span>Event ID:</span> <Hash size={12} /> {entry.id}
                </div>
                <div className="audit-trail-viewer__detail-row">
                  <span>Actor:</span> {entry.actorId} ({entry.actorName})
                </div>
                {entry.targetId && (
                  <div className="audit-trail-viewer__detail-row">
                    <span>Target:</span> {entry.targetId}
                  </div>
                )}
                {entry.ipAddress && (
                  <div className="audit-trail-viewer__detail-row">
                    <span>IP:</span> {entry.ipAddress}
                  </div>
                )}
                <div className="audit-trail-viewer__changes">
                  <h4>Changes</h4>
                  {Object.entries(entry.changes).map(([field, change]) => (
                    <div key={field} className="audit-trail-viewer__change">
                      <strong>{field}:</strong>{" "}
                      <span className="audit-trail-viewer__change-from">
                        {JSON.stringify(change.from)}
                      </span>
                      {" → "}
                      <span className="audit-trail-viewer__change-to">
                        {JSON.stringify(change.to)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
