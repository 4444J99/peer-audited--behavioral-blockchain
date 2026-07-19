/** @jest-environment jsdom */
import { render, screen, fireEvent } from "@testing-library/react";
// Jest globals available via ts-jest
import AuditTrailViewer from "./AuditTrailViewer";
import type { AuditEntry } from "./AuditTrailViewer";

const mockEntries: AuditEntry[] = [
  {
    id: "a1",
    eventType: "CONTRACT_CREATED",
    timestamp: new Date("2026-05-01T10:00:00Z"),
    actorId: "u1",
    actorName: "Alice",
    changes: { status: { from: null, to: "ACTIVE" } },
    ipAddress: "192.168.1.1",
  },
  {
    id: "a2",
    eventType: "ATTESTATION_SUBMITTED",
    timestamp: new Date("2026-05-02T10:00:00Z"),
    actorId: "u1",
    actorName: "Alice",
    targetId: "c1",
    changes: { attestation_status: { from: "PENDING", to: "ATTESTED" } },
  },
];

describe("AuditTrailViewer", () => {
  it("renders audit entries", () => {
    render(<AuditTrailViewer entries={mockEntries} />);
    expect(screen.getByTestId("audit-trail-viewer")).toBeDefined();
    expect(screen.getByTestId("audit-entry-a1")).toBeDefined();
    expect(screen.getByTestId("audit-entry-a2")).toBeDefined();
  });

  it("shows empty state when no entries", () => {
    render(<AuditTrailViewer entries={[]} />);
    expect(screen.getByTestId("audit-empty")).toBeDefined();
  });

  it("filters entries by search", () => {
    render(<AuditTrailViewer entries={mockEntries} />);
    const search = screen.getByTestId("audit-search");
    fireEvent.change(search, { target: { value: "Alice" } });
    expect(screen.getByTestId("audit-entry-a1")).toBeDefined();
    expect(screen.getByTestId("audit-entry-a2")).toBeDefined();
  });

  it("hides entries not matching search", () => {
    render(<AuditTrailViewer entries={mockEntries} />);
    const search = screen.getByTestId("audit-search");
    fireEvent.change(search, { target: { value: "zzz_nomatch" } });
    expect(screen.getByTestId("audit-empty")).toBeDefined();
  });

  it("expands entry detail on click", () => {
    render(<AuditTrailViewer entries={mockEntries} />);
    const entryEl = screen.getByTestId("audit-entry-a1");
    const headerEl = entryEl.querySelector(
      ".audit-trail-viewer__entry-header",
    )!;
    fireEvent.click(headerEl);
    expect(screen.getByTestId("audit-detail-a1")).toBeDefined();
  });
});
