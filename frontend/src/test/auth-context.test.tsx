import { render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { AuthProvider, useAuth } from "@/context/AuthContext";

vi.mock("@/lib/firebase", () => ({
  firebaseAuth: null,
  getFirebaseAuthToken: vi.fn(async () => null),
  googleProvider: {},
  isFirebaseClientConfigured: false,
}));

const AuthProbe = () => {
  const { isAuthenticated, user } = useAuth();
  return (
    <div>
      <div data-testid="auth">{String(isAuthenticated)}</div>
      <div data-testid="email">{user?.email ?? ""}</div>
    </div>
  );
};

describe("AuthContext bootstrap", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
    vi.stubEnv("VITE_API_BASE_URL", "http://localhost:4000");
  });

  it("stays logged out when firebase client is not configured", async () => {
    render(
      <AuthProvider>
        <AuthProbe />
      </AuthProvider>
    );

    await waitFor(() => expect(screen.getByTestId("auth").textContent).toBe("false"));
    expect(screen.getByTestId("email").textContent).toBe("");
  });
});
