import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { AppProvider } from "../../state/AppContext";
import { NotificationProvider } from "../layout/NotificationArea";
import { Header } from "../layout/Header";

function Wrapper({ children }: { children: React.ReactNode }) {
  return (
    <NotificationProvider>
      <AppProvider>{children}</AppProvider>
    </NotificationProvider>
  );
}

describe("Header — mode toggle buttons", () => {
  it("renders the app title", () => {
    render(<Header />, { wrapper: Wrapper });
    expect(screen.getByText(/NFA.*Regex Converter/i)).toBeInTheDocument();
  });

  it('renders the "NFA → Regex" mode button', () => {
    render(<Header />, { wrapper: Wrapper });
    expect(
      screen.getByRole("button", { name: /NFA.*Regex/i }),
    ).toBeInTheDocument();
  });

  it('renders the "Regex → NFA" mode button', () => {
    render(<Header />, { wrapper: Wrapper });
    expect(
      screen.getByRole("button", { name: /Regex.*NFA/i }),
    ).toBeInTheDocument();
  });
});
