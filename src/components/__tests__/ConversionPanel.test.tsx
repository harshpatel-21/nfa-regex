import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AppProvider } from "../../state/AppContext";
import { NotificationProvider } from "../layout/NotificationArea";
import { StateEliminationPanel } from "../conversion/StateEliminationPanel";
import { NFAInputPanel } from "../nfa-input/NFAInputPanel";
import { examples } from "../../data/examples";

function Wrapper({ children }: { children: React.ReactNode }) {
  return (
    <NotificationProvider>
      <AppProvider>{children}</AppProvider>
    </NotificationProvider>
  );
}

describe("StateEliminationPanel — idle phase (initial render)", () => {
  it('renders the "State Elimination" heading', () => {
    render(<StateEliminationPanel />, { wrapper: Wrapper });
    expect(
      screen.getByRole("heading", { name: /State Elimination/i }),
    ).toBeInTheDocument();
  });

  it('shows "← Back" button when phase is idle', () => {
    render(<StateEliminationPanel />, { wrapper: Wrapper });
    expect(screen.getByRole("button", { name: /Back/i })).toBeInTheDocument();
  });

  it('does not show the "Complete Elimination" button when idle', () => {
    render(<StateEliminationPanel />, { wrapper: Wrapper });
    expect(
      screen.queryByRole("button", { name: /Complete Elimination/i }),
    ).not.toBeInTheDocument();
  });

  it("does not show the final regex section when idle", () => {
    render(<StateEliminationPanel />, { wrapper: Wrapper });
    expect(
      screen.queryByText(/Final Regular Expression/i),
    ).not.toBeInTheDocument();
  });
});

describe("StateEliminationPanel — after starting conversion from an example NFA", () => {
  async function startConversionFromExample() {
    render(
      <Wrapper>
        <NFAInputPanel />
        <StateEliminationPanel />
      </Wrapper>,
    );
    // Load a valid example NFA
    await userEvent.click(
      screen.getByRole("button", { name: /Load Examples/i }),
    );
    const firstExample = examples[0]!;
    await userEvent.click(screen.getByText(firstExample.name));
    // Start conversion
    await userEvent.click(
      screen.getByRole("button", { name: /Convert to Regex/i }),
    );
  }

  it('shows the "← Back to Input" button once conversion is active', async () => {
    await startConversionFromExample();
    expect(
      screen.getByRole("button", { name: /Back to Input/i }),
    ).toBeInTheDocument();
  });

  it("shows the state selector with eliminable states", async () => {
    await startConversionFromExample();
    expect(
      screen.getByText(/Select a state to eliminate/i),
    ).toBeInTheDocument();
  });

  it('shows the "Auto-pick" button in the selecting-state phase', async () => {
    await startConversionFromExample();
    expect(
      screen.getByRole("button", { name: /Auto-pick/i }),
    ).toBeInTheDocument();
  });
});

describe("StateEliminationPanel — updating-paths phase", () => {
  async function advanceToPathUpdates() {
    render(
      <Wrapper>
        <NFAInputPanel />
        <StateEliminationPanel />
      </Wrapper>,
    );
    await userEvent.click(
      screen.getByRole("button", { name: /Load Examples/i }),
    );
    await userEvent.click(screen.getByText(examples[0]!.name));
    await userEvent.click(
      screen.getByRole("button", { name: /Convert to Regex/i }),
    );
    // Auto-pick a state to trigger path-update computation
    await userEvent.click(screen.getByRole("button", { name: /Auto-pick/i }));
  }

  it('shows the "Eliminating state" banner after auto-picking', async () => {
    // Arrange + Act
    await advanceToPathUpdates();

    // Assert
    expect(screen.getByText(/Eliminating state/i)).toBeInTheDocument();
  });

  it("shows the path update form with a Check Answer button", async () => {
    // Arrange + Act
    await advanceToPathUpdates();

    // Assert
    expect(
      screen.getByRole("button", { name: /Check Answer/i }),
    ).toBeInTheDocument();
  });

  it('shows "← Back" (not "← Back to Input") while updating paths', async () => {
    // Arrange + Act
    await advanceToPathUpdates();

    // Assert
    expect(
      screen.getByRole("button", { name: /← Back$/i }),
    ).toBeInTheDocument();
  });
});

describe("StateEliminationPanel — step-complete phase", () => {
  async function advanceToStepComplete() {
    render(
      <Wrapper>
        <NFAInputPanel />
        <StateEliminationPanel />
      </Wrapper>,
    );
    await userEvent.click(
      screen.getByRole("button", { name: /Load Examples/i }),
    );
    await userEvent.click(screen.getByText(examples[0]!.name));
    await userEvent.click(
      screen.getByRole("button", { name: /Convert to Regex/i }),
    );
    await userEvent.click(screen.getByRole("button", { name: /Auto-pick/i }));

    // Auto-complete every path form and advance until step-complete
    let keepGoing = true;
    while (keepGoing) {
      const autoBtn = screen.queryByRole("button", { name: /Auto-complete/i });
      const nextBtn = screen.queryByRole("button", { name: /Next Path/i });
      const completeBtn = screen.queryByRole("button", {
        name: /Complete Elimination/i,
      });
      if (completeBtn) {
        keepGoing = false;
        break;
      }
      if (autoBtn) await userEvent.click(autoBtn);
      if (nextBtn) await userEvent.click(nextBtn);
      if (!autoBtn && !nextBtn && !completeBtn) {
        keepGoing = false;
      }
    }
  }

  it('shows the "Complete Elimination & Continue" button when all paths are done', async () => {
    // Arrange + Act
    await advanceToStepComplete();

    // Assert
    expect(
      screen.getByRole("button", { name: /Complete Elimination/i }),
    ).toBeInTheDocument();
  });
});

describe("StateEliminationPanel — finished phase", () => {
  async function runFullElimination() {
    render(
      <Wrapper>
        <NFAInputPanel />
        <StateEliminationPanel />
      </Wrapper>,
    );
    await userEvent.click(
      screen.getByRole("button", { name: /Load Examples/i }),
    );
    await userEvent.click(screen.getByText(examples[0]!.name));
    await userEvent.click(
      screen.getByRole("button", { name: /Convert to Regex/i }),
    );

    // Drive the elimination to completion: auto-pick, auto-complete each path,
    // advance paths, complete each state in turn.
    // NOTE: Check Next Path before Auto-complete because Auto-complete is
    // disabled (but still in the DOM) once the answer has been submitted.
    let iterations = 0;
    while (iterations < 40) {
      iterations++;
      if (screen.queryByText(/Final Regular Expression/i)) break;

      const autoPickBtn = screen.queryByRole("button", { name: /Auto-pick/i });
      if (autoPickBtn) {
        await userEvent.click(autoPickBtn);
        continue;
      }

      const nextPathBtn = screen.queryByRole("button", { name: /Next Path/i });
      if (nextPathBtn) {
        await userEvent.click(nextPathBtn);
        continue;
      }

      const autoCompleteBtn = screen.queryByRole("button", {
        name: /Auto-complete/i,
      });
      if (autoCompleteBtn && !(autoCompleteBtn as HTMLButtonElement).disabled) {
        await userEvent.click(autoCompleteBtn);
        continue;
      }

      const completeEliminationBtn = screen.queryByRole("button", {
        name: /Complete Elimination/i,
      });
      if (completeEliminationBtn) {
        await userEvent.click(completeEliminationBtn);
        continue;
      }

      break;
    }
  }

  it("shows the Final Regular Expression section after full elimination", async () => {
    // Arrange + Act
    await runFullElimination();

    // Assert
    expect(screen.getByText(/Final Regular Expression/i)).toBeInTheDocument();
  });

  it('shows the "Start Over" button in the finished phase', async () => {
    // Arrange + Act
    await runFullElimination();

    // Assert
    expect(
      screen.getByRole("button", { name: /Start Over/i }),
    ).toBeInTheDocument();
  });
});
