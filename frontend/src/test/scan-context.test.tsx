import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, expect, it, beforeEach, vi } from "vitest";
import { ScanProvider, useScan } from "@/context/ScanContext";

vi.mock("@/lib/firebase", () => ({
  getFirebaseAuthToken: vi.fn(async () => null),
}));

const ScanProbe = () => {
  const { addScanResult, scanHistory } = useScan();
  return (
    <div>
      <button
        onClick={() =>
          addScanResult({
            id: "s1",
            url: "https://example.com",
            isPhishing: false,
            score: 12,
            explanation: "safe",
            category: "Other",
            checkedAt: new Date(),
            isBlocked: false,
            domain: "example.com",
          })
        }
      >
        add
      </button>
      <div data-testid="history-size">{scanHistory.length}</div>
    </div>
  );
};

describe("ScanContext privacy behavior", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
    vi.stubEnv("VITE_API_BASE_URL", "http://localhost:4000");
  });

  it("does not store scans when saveHistory is disabled", async () => {
    localStorage.setItem(
      "phishguard_settings",
      JSON.stringify({ saveHistory: false, doNotStoreUrls: false })
    );

    render(
      <ScanProvider>
        <ScanProbe />
      </ScanProvider>
    );

    await waitFor(() => expect(screen.getByTestId("history-size").textContent).toBe("0"));
    fireEvent.click(screen.getByText("add"));
    await waitFor(() => expect(screen.getByTestId("history-size").textContent).toBe("0"));
  });
});
