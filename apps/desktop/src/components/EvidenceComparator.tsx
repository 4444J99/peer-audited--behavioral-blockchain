import { useState, useMemo } from "react";
import { GitCompare, ThumbsUp, ThumbsDown, Equal } from "lucide-react";

interface EvidenceItem {
  id: string;
  contractId: string;
  type: "PROOF" | "ATTESTATION" | "DISPUTE";
  submittedBy: string;
  submittedAt: Date;
  mediaUri?: string;
  verdict?: string;
  accuracy?: number;
  hash?: string;
}

interface EvidenceComparatorProps {
  left: EvidenceItem[];
  right: EvidenceItem[];
  leftLabel?: string;
  rightLabel?: string;
}

export default function EvidenceComparator({
  left,
  right,
  leftLabel,
  rightLabel,
}: EvidenceComparatorProps) {
  const [sortKey, setSortKey] = useState<keyof EvidenceItem>("submittedAt");
  const [sortAsc, setSortAsc] = useState(false);

  const matchedItems = useMemo(() => {
    const matches: {
      left: EvidenceItem;
      right: EvidenceItem | null;
      similarity: string;
    }[] = [];
    const rightMap = new Map(right.map((r) => [r.hash || r.id, r]));

    for (const item of left) {
      const match = rightMap.get(item.hash || item.id);
      matches.push({
        left: item,
        right: match || null,
        similarity: match
          ? item.accuracy && match.accuracy
            ? `${Math.round(((item.accuracy + match.accuracy) / 2) * 100)}%`
            : "Match"
          : "No match",
      });
    }

    for (const item of right) {
      if (!matches.some((m) => m.right?.id === item.id)) {
        matches.push({ left: item, right: null, similarity: "Unmatched (R)" });
      }
    }

    return matches.sort((a, b) => {
      const aVal = a.left[sortKey];
      const bVal = b.left[sortKey];
      if (aVal == null) return sortAsc ? -1 : 1;
      if (bVal == null) return sortAsc ? 1 : -1;
      return sortAsc
        ? String(aVal).localeCompare(String(bVal))
        : String(bVal).localeCompare(String(aVal));
    });
  }, [left, right, sortKey, sortAsc]);

  return (
    <div className="evidence-comparator" data-testid="evidence-comparator">
      <div className="evidence-comparator__toolbar">
        <h3 className="evidence-comparator__title">
          <GitCompare size={18} /> Evidence Comparison
        </h3>
        <div className="evidence-comparator__sort">
          <label>Sort by:</label>
          <select
            value={sortKey}
            onChange={(e) => setSortKey(e.target.value as keyof EvidenceItem)}
          >
            <option value="submittedAt">Date</option>
            <option value="type">Type</option>
            <option value="submittedBy">Submitter</option>
            <option value="accuracy">Accuracy</option>
          </select>
          <button
            onClick={() => setSortAsc(!sortAsc)}
            title={sortAsc ? "Ascending" : "Descending"}
          >
            {sortAsc ? "↑" : "↓"}
          </button>
        </div>
      </div>

      <div className="evidence-comparator__grid">
        {matchedItems.length === 0 && (
          <div
            className="evidence-comparator__empty"
            data-testid="comparator-empty"
          >
            <Equal size={24} /> No evidence to compare
          </div>
        )}
        {matchedItems.map(({ left: item, right: match, similarity }) => (
          <div
            key={item.id}
            className="evidence-comparator__row"
            data-testid={`comparator-row-${item.id}`}
          >
            <div className="evidence-comparator__column evidence-comparator__column--left">
              <span className="evidence-comparator__label">
                {leftLabel || "Left"}
              </span>
              <div className="evidence-comparator__item">
                <span className="evidence-comparator__type">{item.type}</span>
                <span className="evidence-comparator__submitter">
                  {item.submittedBy}
                </span>
                <span className="evidence-comparator__date">
                  {new Date(item.submittedAt).toLocaleDateString()}
                </span>
                {item.verdict && (
                  <span
                    className={`evidence-comparator__verdict evidence-comparator__verdict--${item.verdict.toLowerCase()}`}
                  >
                    {item.verdict}
                  </span>
                )}
              </div>
            </div>
            <div className="evidence-comparator__match-indicator">
              {match ? (
                similarity === "Match" ? (
                  <ThumbsUp
                    size={16}
                    className="evidence-comparator__match--yes"
                  />
                ) : (
                  <Equal size={16} />
                )
              ) : (
                <ThumbsDown
                  size={16}
                  className="evidence-comparator__match--no"
                />
              )}
              <span className="evidence-comparator__similarity">
                {similarity}
              </span>
            </div>
            <div className="evidence-comparator__column evidence-comparator__column--right">
              <span className="evidence-comparator__label">
                {rightLabel || "Right"}
              </span>
              {match ? (
                <div className="evidence-comparator__item">
                  <span className="evidence-comparator__type">
                    {match.type}
                  </span>
                  <span className="evidence-comparator__submitter">
                    {match.submittedBy}
                  </span>
                  <span className="evidence-comparator__date">
                    {new Date(match.submittedAt).toLocaleDateString()}
                  </span>
                  {match.verdict && (
                    <span
                      className={`evidence-comparator__verdict evidence-comparator__verdict--${match.verdict.toLowerCase()}`}
                    >
                      {match.verdict}
                    </span>
                  )}
                </div>
              ) : (
                <span className="evidence-comparator__no-match">—</span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
