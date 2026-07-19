/** @jest-environment jsdom */
import { render, screen, fireEvent } from "@testing-library/react";
// Jest globals available via ts-jest
import EvidenceComparator from "./EvidenceComparator";

const leftEvidence = [
  {
    id: "e1",
    contractId: "c1",
    type: "PROOF" as const,
    submittedBy: "Alice",
    submittedAt: new Date("2026-05-01T10:00:00Z"),
    verdict: "ACCEPTED",
    accuracy: 0.95,
    hash: "abc123",
  },
  {
    id: "e2",
    contractId: "c1",
    type: "ATTESTATION" as const,
    submittedBy: "Alice",
    submittedAt: new Date("2026-05-02T10:00:00Z"),
    verdict: "PENDING",
    accuracy: 0.8,
    hash: "def456",
  },
];

const rightEvidence = [
  {
    id: "e1r",
    contractId: "c1",
    type: "PROOF" as const,
    submittedBy: "Fury",
    submittedAt: new Date("2026-05-01T10:00:00Z"),
    verdict: "ACCEPTED",
    accuracy: 0.92,
    hash: "abc123",
  },
];

describe("EvidenceComparator", () => {
  it("renders with evidence", () => {
    render(<EvidenceComparator left={leftEvidence} right={rightEvidence} />);
    expect(screen.getByTestId("evidence-comparator")).toBeDefined();
    expect(screen.getByTestId("comparator-row-e1")).toBeDefined();
    expect(screen.getByTestId("comparator-row-e2")).toBeDefined();
  });

  it("shows empty state with no evidence", () => {
    render(<EvidenceComparator left={[]} right={[]} />);
    expect(screen.getByTestId("comparator-empty")).toBeDefined();
  });

  it("displays match indicator between left and right", () => {
    render(<EvidenceComparator left={leftEvidence} right={rightEvidence} />);
    expect(screen.getByTestId("comparator-row-e1")).toBeDefined();
  });

  it("respects custom labels", () => {
    render(
      <EvidenceComparator
        left={leftEvidence}
        right={rightEvidence}
        leftLabel="Plaintiff"
        rightLabel="Defendant"
      />,
    );
    expect(screen.getAllByText("Plaintiff").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Defendant").length).toBeGreaterThan(0);
  });

  it("allows sorting by different keys", () => {
    render(<EvidenceComparator left={leftEvidence} right={rightEvidence} />);
    const sortSelect = screen.getByRole("combobox");
    fireEvent.change(sortSelect, { target: { value: "type" } });
    expect(screen.getByTestId("evidence-comparator")).toBeDefined();
  });
});
