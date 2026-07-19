/** @jest-environment jsdom */
import { render, screen, fireEvent } from "@testing-library/react";
// Jest globals available via ts-jest
import NoContactRecoveryPanel from "./NoContactRecoveryPanel";

const mockTargets = [
  {
    id: "t1",
    identifier: "ex-partner-a",
    riskLevel: "HIGH" as const,
    lastContactDate: new Date("2026-04-15"),
    bypassAttempts: 3,
    activeFlag: true,
  },
  {
    id: "t2",
    identifier: "old-contact-b",
    riskLevel: "LOW" as const,
    lastContactDate: undefined,
    bypassAttempts: 0,
    activeFlag: true,
  },
  {
    id: "t3",
    identifier: "inactive-c",
    riskLevel: "MEDIUM" as const,
    bypassAttempts: 0,
    activeFlag: false,
  },
];

describe("NoContactRecoveryPanel", () => {
  it("renders with targets", () => {
    render(<NoContactRecoveryPanel targets={mockTargets} />);
    expect(screen.getByTestId("no-contact-recovery-panel")).toBeDefined();
    expect(screen.getByTestId("nc-target-t1")).toBeDefined();
    expect(screen.getByTestId("nc-target-t2")).toBeDefined();
    expect(screen.getByTestId("nc-target-t3")).toBeDefined();
  });

  it("shows alert for critical targets", () => {
    render(<NoContactRecoveryPanel targets={mockTargets} />);
    expect(screen.getByTestId("nc-alert")).toBeDefined();
  });

  it("switches to flows tab", () => {
    render(<NoContactRecoveryPanel targets={mockTargets} />);
    fireEvent.click(screen.getByText(/Flows/));
    expect(screen.getByTestId("nc-flows")).toBeDefined();
    expect(screen.getByTestId("nc-flow-f1")).toBeDefined();
    expect(screen.getByTestId("nc-flow-f2")).toBeDefined();
  });

  it("shows empty state with no targets", () => {
    render(<NoContactRecoveryPanel targets={[]} />);
    expect(screen.getByTestId("nc-targets")).toBeDefined();
  });

  it("displays all 5 recovery flows", () => {
    render(<NoContactRecoveryPanel targets={mockTargets} />);
    fireEvent.click(screen.getByText(/Flows/));
    [
      "nc-flow-f1",
      "nc-flow-f2",
      "nc-flow-f3",
      "nc-flow-f4",
      "nc-flow-f5",
    ].forEach((tid) => {
      expect(screen.getByTestId(tid)).toBeDefined();
    });
  });
});
