import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AppProvider } from "../../state/AppContext";
import { NotificationProvider } from "../layout/NotificationArea";
import { Sidebar } from "../layout/Sidebar";
import { Header } from "../layout/Header";
import { examples } from "../../data/examples";

function Wrapper({ children }: { children: React.ReactNode }) {
  return (
    <NotificationProvider>
      <AppProvider>{children}</AppProvider>
    </NotificationProvider>
  );
}

// Render Header + Sidebar together so mode switching is wired correctly.
function renderApp() {
  return render(
    <Wrapper>
      <Header />
      <Sidebar />
    </Wrapper>,
  );
}

describe("Sidebar — NFA-to-Regex input phase (default)", () => {
  it("renders the NFA Input panel by default", () => {
    // Act
    renderApp();

    // Assert
    expect(
      screen.getByRole("heading", { name: /NFA Input/i }),
    ).toBeInTheDocument();
  });

  it("does not render the Thompson Construction panel in the default mode", () => {
    // Act
    renderApp();

    // Assert
    expect(
      screen.queryByRole("heading", { name: /Thompson/i }),
    ).not.toBeInTheDocument();
  });
});

describe("Sidebar — Regex-to-NFA mode", () => {
  it("renders the Thompson Construction panel after switching mode", async () => {
    // Arrange
    renderApp();

    // Act
    await userEvent.click(screen.getByRole("button", { name: /Regex.*NFA/i }));

    // Assert
    expect(
      screen.getByRole("heading", { name: /Thompson/i }),
    ).toBeInTheDocument();
  });

  it("no longer shows the NFA Input panel after switching to Regex-to-NFA mode", async () => {
    // Arrange
    renderApp();

    // Act
    await userEvent.click(screen.getByRole("button", { name: /Regex.*NFA/i }));

    // Assert
    expect(
      screen.queryByRole("heading", { name: /NFA Input/i }),
    ).not.toBeInTheDocument();
  });
});

describe("Sidebar — NFA-to-Regex converting phase", () => {
  it("renders the State Elimination panel after converting an example NFA", async () => {
    // Arrange
    renderApp();
    await userEvent.click(
      screen.getByRole("button", { name: /Load Examples/i }),
    );
    await userEvent.click(screen.getByText(examples[0]!.name));

    // Act
    await userEvent.click(
      screen.getByRole("button", { name: /Convert to Regex/i }),
    );

    // Assert
    expect(
      screen.getByRole("heading", { name: /State Elimination/i }),
    ).toBeInTheDocument();
  });
});

describe("Sidebar — resize handle", () => {
  it("does not change width when pointer moves without a prior pointer-down", () => {
    const { container } = renderApp();
    const aside = container.querySelector("aside")!;
    const initialWidth = parseInt(aside.style.width);
    const handle = container.querySelector(".cursor-col-resize") as HTMLElement;
    handle.setPointerCapture = vi.fn();
    handle.releasePointerCapture = vi.fn();

    // No pointerDown first — dragging.current stays false → early return
    handle.addEventListener(
      "pointermove",
      (e) => {
        Object.defineProperty(e, "movementX", { value: 50 });
      },
      { capture: true, once: true },
    );
    fireEvent.pointerMove(handle, { pointerId: 1 });

    expect(parseInt(aside.style.width)).toBe(initialWidth);
  });

  it("adjusts sidebar width when pointer drag is performed on the resize handle", () => {
    // Arrange
    const { container } = renderApp();
    const aside = container.querySelector("aside")!;
    const initialWidth = parseInt(aside.style.width);
    const handle = container.querySelector(".cursor-col-resize") as HTMLElement;

    // Stub Pointer Capture API (not implemented in jsdom)
    handle.setPointerCapture = vi.fn();
    handle.releasePointerCapture = vi.fn();

    // Act — simulate drag right by 50px
    // jsdom doesn't compute movementX from mouse deltas, so intercept the event in
    // capture phase and set movementX before React's handler reads it.
    fireEvent.pointerDown(handle, { pointerId: 1 });
    handle.addEventListener(
      "pointermove",
      (e) => {
        Object.defineProperty(e, "movementX", { value: 50 });
      },
      { capture: true, once: true },
    );
    fireEvent.pointerMove(handle, { pointerId: 1 });
    fireEvent.pointerUp(handle, { pointerId: 1 });

    // Assert
    const newWidth = parseInt(aside.style.width);
    expect(newWidth).toBeGreaterThan(initialWidth);
  });
});
