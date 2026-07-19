/** @jest-environment jsdom */
import { render, screen, fireEvent } from "@testing-library/react";
// Jest globals available via ts-jest
import DisputeTimeline from "./DisputeTimeline";
import type { EvidenceNode } from "./DisputeTimeline";

const mockEvidence: EvidenceNode[] = [
  {
    id: "e1",
    timestamp: new Date("2026-05-01T10:00:00Z"),
    type: "ATTESTATION",
    actorId: "u1",
    actorName: "Alice",
    summary: "Day 30 attestation submitted",
  },
  {
    id: "e2",
    timestamp: new Date("2026-05-02T10:00:00Z"),
    type: "DISPUTE",
    actorId: "u1",
    actorName: "Alice",
    summary: "Disputed Day 31 verdict",
    verdict: "PENDING",
    metadata: { reason: "technical_issue" },
  },
  {
    id: "e3",
    timestamp: new Date("2026-05-03T10:00:00Z"),
    type: "RESOLUTION",
    actorId: "u2",
    actorName: "Fury",
    summary: "Resolution upheld",
    verdict: "ACCEPTED",
  },
];

describe("DisputeTimeline", () => {
  it("renders the timeline with evidence nodes", () => {
    render(<DisputeTimeline evidence={mockEvidence} contractId="c1" />);
    expect(screen.getByTestId("dispute-timeline")).toBeDefined();
    expect(screen.getByTestId("dispute-node-e1")).toBeDefined();
    expect(screen.getByTestId("dispute-node-e2")).toBeDefined();
    expect(screen.getByTestId("dispute-node-e3")).toBeDefined();
  });

  it("shows empty state when no evidence", () => {
    render(<DisputeTimeline evidence={[]} contractId="c1" />);
    expect(screen.getByTestId("dispute-timeline-empty")).toBeDefined();
  });

  it("zooms in and out", () => {
    render(<DisputeTimeline evidence={mockEvidence} contractId="c1" />);
    const zoomIn = screen.getByLabelText("Zoom in");
    const zoomOut = screen.getByLabelText("Zoom out");
    fireEvent.click(zoomIn);
    fireEvent.click(zoomOut);
  });

  it("filters by type", () => {
    render(<DisputeTimeline evidence={mockEvidence} contractId="c1" />);
    const filterSelect = screen.getByLabelText("Filter by type");
    fireEvent.change(filterSelect, { target: { value: "ATTESTATION" } });
    expect(screen.queryByTestId("dispute-node-e2")).toBeNull();
    expect(screen.getByTestId("dispute-node-e1")).toBeDefined();
  });

  it("shows detail panel on node click", () => {
    render(<DisputeTimeline evidence={mockEvidence} contractId="c1" />);
    fireEvent.click(screen.getByTestId("dispute-node-e2"));
    expect(screen.getByTestId("detail-e2")).toBeDefined();
  });

  it("toggles detail panel off on second click", () => {
    render(<DisputeTimeline evidence={mockEvidence} contractId="c1" />);
    fireEvent.click(screen.getByTestId("dispute-node-e2"));
    expect(screen.getByTestId("detail-e2")).toBeDefined();
    fireEvent.click(screen.getByTestId("dispute-node-e2"));
    expect(screen.queryByTestId("detail-e2")).toBeNull();
  });
});
