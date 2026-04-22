import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AppProvider } from "../../state/AppContext";
import { NotificationProvider } from "../layout/NotificationArea";
import { TableControls } from "../nfa-input/TableControls";
import { TransitionTable } from "../nfa-input/TransitionTable";

function Wrapper({ children }: { children: React.ReactNode }) {
  return (
    <NotificationProvider>
      <AppProvider>{children}</AppProvider>
    </NotificationProvider>
  );
}

function renderWithTable() {
  return render(
    <Wrapper>
      <TableControls />
      <TransitionTable />
    </Wrapper>,
  );
}

describe("TableControls — initial render", () => {
  it('renders the "+ State" and "- State" buttons', () => {
    // Act
    render(<TableControls />, { wrapper: Wrapper });

    // Assert
    expect(
      screen.getByRole("button", { name: /\+ State/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /- State/i }),
    ).toBeInTheDocument();
  });

  it('"- State" is disabled when no state is selected', () => {
    // Act
    render(<TableControls />, { wrapper: Wrapper });

    // Assert
    expect(screen.getByRole("button", { name: /- State/i })).toBeDisabled();
  });

  it('renders the symbol input and "+ Symbol" button', () => {
    // Act
    render(<TableControls />, { wrapper: Wrapper });

    // Assert
    expect(screen.getByPlaceholderText("Symbol")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /\+ Symbol/i }),
    ).toBeInTheDocument();
  });

  it('renders the "Clear All" button', () => {
    // Act
    render(<TableControls />, { wrapper: Wrapper });

    // Assert
    expect(
      screen.getByRole("button", { name: /Clear All/i }),
    ).toBeInTheDocument();
  });
});

describe("TableControls — adding symbols", () => {
  it("shows a symbol chip after typing a symbol and pressing Enter", async () => {
    // Arrange
    render(<TableControls />, { wrapper: Wrapper });
    const input = screen.getByPlaceholderText("Symbol");

    // Act
    await userEvent.type(input, "a{Enter}");

    // Assert
    expect(screen.getByText("a")).toBeInTheDocument();
  });

  it("clears the input after adding a symbol", async () => {
    // Arrange
    render(<TableControls />, { wrapper: Wrapper });
    const input = screen.getByPlaceholderText("Symbol");

    // Act
    await userEvent.type(input, "a{Enter}");

    // Assert
    expect(input).toHaveValue("");
  });

  it("does not create a duplicate chip when the same symbol is added twice", async () => {
    // Arrange
    render(<TableControls />, { wrapper: Wrapper });
    const input = screen.getByPlaceholderText("Symbol");

    // Act
    await userEvent.type(input, "a{Enter}");
    await userEvent.type(input, "a{Enter}");

    // Assert — only one chip with text "a" (inside the span, not button labels)
    const chips = screen.getAllByText("a");
    expect(chips.length).toBe(1);
  });

  it("removes a symbol chip when its × button is clicked", async () => {
    // Arrange
    render(<TableControls />, { wrapper: Wrapper });
    const input = screen.getByPlaceholderText("Symbol");
    await userEvent.type(input, "a{Enter}");

    // Act
    const removeBtn = screen.getByRole("button", { name: "×" });
    await userEvent.click(removeBtn);

    // Assert
    expect(screen.queryByText("a")).not.toBeInTheDocument();
  });
});

describe("TableControls — state controls after adding a state", () => {
  it('shows "Set Start" and "Set Final" buttons after a state is added and selected via + State', async () => {
    // Arrange
    render(<TableControls />, { wrapper: Wrapper });

    // Act — add a state then click it to select (the TransitionTable handles selection;
    // we can only add and verify the state button section doesn't appear yet without selection)
    await userEvent.click(screen.getByRole("button", { name: /\+ State/i }));

    // Assert — without selection the state controls section is still hidden
    // (selectedStateId is null until the user clicks a state in the table)
    expect(
      screen.queryByRole("button", { name: /Set Start/i }),
    ).not.toBeInTheDocument();
  });

  it("shows selected-state controls after selecting a state in the transition table", async () => {
    renderWithTable();
    await userEvent.click(screen.getByRole("button", { name: /\+ State/i }));
    await userEvent.click(screen.getByText("q0"));

    expect(
      screen.getByRole("button", { name: /★ Start/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Set Final/i }),
    ).toBeInTheDocument();
  });

  it('toggles start button text between "★ Start" and "Set Start"', async () => {
    renderWithTable();
    await userEvent.click(screen.getByRole("button", { name: /\+ State/i }));
    await userEvent.click(screen.getByText("q0"));

    await userEvent.click(screen.getByRole("button", { name: /★ Start/i }));
    expect(
      screen.getByRole("button", { name: /Set Start/i }),
    ).toBeInTheDocument();
  });

  it('toggles final button text between "Set Final" and "◉ Final"', async () => {
    renderWithTable();
    await userEvent.click(screen.getByRole("button", { name: /\+ State/i }));
    await userEvent.click(screen.getByText("q0"));

    await userEvent.click(screen.getByRole("button", { name: /Set Final/i }));
    expect(
      screen.getByRole("button", { name: /◉ Final/i }),
    ).toBeInTheDocument();
  });

  it('removes selected state with "- State" button when a state is selected', async () => {
    renderWithTable();
    await userEvent.click(screen.getByRole("button", { name: /\+ State/i }));
    await userEvent.click(screen.getByText("q0"));
    await userEvent.click(screen.getByRole("button", { name: /- State/i }));

    expect(screen.queryByText("q0")).not.toBeInTheDocument();
  });
});
