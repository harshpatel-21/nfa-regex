import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AppProvider } from "../../state/AppContext";
import { NotificationProvider } from "../layout/NotificationArea";
import { NFAInputPanel } from "../nfa-input/NFAInputPanel";

function Wrapper({ children }: { children: React.ReactNode }) {
  return (
    <NotificationProvider>
      <AppProvider>{children}</AppProvider>
    </NotificationProvider>
  );
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe("NFAInputPanel — NFA-to-Regex input mode buttons", () => {
  it('renders the "+ Symbol" button', () => {
    render(<NFAInputPanel />, { wrapper: Wrapper });
    expect(
      screen.getByRole("button", { name: /\+ Symbol/i }),
    ).toBeInTheDocument();
  });

  it('renders the "+ State" button', () => {
    render(<NFAInputPanel />, { wrapper: Wrapper });
    expect(
      screen.getByRole("button", { name: /\+ State/i }),
    ).toBeInTheDocument();
  });

  it('renders the "- State" button', () => {
    render(<NFAInputPanel />, { wrapper: Wrapper });
    expect(
      screen.getByRole("button", { name: /- State/i }),
    ).toBeInTheDocument();
  });

  it('renders the "Clear All" button', () => {
    render(<NFAInputPanel />, { wrapper: Wrapper });
    expect(
      screen.getByRole("button", { name: /Clear All/i }),
    ).toBeInTheDocument();
  });

  it('renders the "Load Examples" toggle button', () => {
    render(<NFAInputPanel />, { wrapper: Wrapper });
    expect(
      screen.getByRole("button", { name: /Load Examples/i }),
    ).toBeInTheDocument();
  });

  it("renders the export NFA button", () => {
    render(<NFAInputPanel />, { wrapper: Wrapper });
    expect(
      screen.getByRole("button", { name: /Export NFA/i }),
    ).toBeInTheDocument();
  });

  it("renders the import NFA button", () => {
    render(<NFAInputPanel />, { wrapper: Wrapper });
    expect(
      screen.getByRole("button", { name: /Import NFA/i }),
    ).toBeInTheDocument();
  });

  it('renders the "Convert to Regex" button', () => {
    render(<NFAInputPanel />, { wrapper: Wrapper });
    expect(
      screen.getByRole("button", { name: /Convert to Regex/i }),
    ).toBeInTheDocument();
  });

  it('"- State" button is disabled when no state is selected', () => {
    render(<NFAInputPanel />, { wrapper: Wrapper });
    const removeBtn = screen.getByRole("button", { name: /- State/i });
    expect(removeBtn).toBeDisabled();
  });

  it('"Convert to Regex" button is disabled when no states exist', () => {
    render(<NFAInputPanel />, { wrapper: Wrapper });
    expect(
      screen.getByRole("button", { name: /Convert to Regex/i }),
    ).toBeDisabled();
  });

  it("renders the symbol input placeholder", () => {
    render(<NFAInputPanel />, { wrapper: Wrapper });
    expect(screen.getByPlaceholderText(/Add symbol/i)).toBeInTheDocument();
  });
});

describe("NFAInputPanel — adding states", () => {
  it('clicking "+ State" makes "Convert to Regex" button enabled', async () => {
    render(<NFAInputPanel />, { wrapper: Wrapper });
    expect(
      screen.getByRole("button", { name: /Convert to Regex/i }),
    ).toBeDisabled();
    await userEvent.click(screen.getByRole("button", { name: /\+ State/i }));
    expect(
      screen.getByRole("button", { name: /Convert to Regex/i }),
    ).not.toBeDisabled();
  });

  it('clicking "+ State" twice keeps "Convert to Regex" enabled', async () => {
    render(<NFAInputPanel />, { wrapper: Wrapper });
    await userEvent.click(screen.getByRole("button", { name: /\+ State/i }));
    await userEvent.click(screen.getByRole("button", { name: /\+ State/i }));
    expect(
      screen.getByRole("button", { name: /Convert to Regex/i }),
    ).not.toBeDisabled();
  });

  it("shows validation errors when attempting to convert an NFA with no final state", async () => {
    render(<NFAInputPanel />, { wrapper: Wrapper });
    await userEvent.click(screen.getByRole("button", { name: /\+ State/i }));
    await userEvent.click(
      screen.getByRole("button", { name: /Convert to Regex/i }),
    );
    // Multiple elements may contain "final" (error message + notification) — at least one must exist
    expect(
      screen.getAllByText(/NFA must have at least one final/i).length,
    ).toBeGreaterThan(0);
  });
});

describe("NFAInputPanel — symbol management", () => {
  it("typing a symbol and pressing Enter clears the input field", async () => {
    render(<NFAInputPanel />, { wrapper: Wrapper });
    const input = screen.getByPlaceholderText(/Add symbol/i);
    await userEvent.type(input, "a{Enter}");
    expect(input).toHaveValue("");
  });

  it("typing a symbol and pressing Enter shows a remove (×) button for the chip", async () => {
    render(<NFAInputPanel />, { wrapper: Wrapper });
    const input = screen.getByPlaceholderText(/Add symbol/i);
    await userEvent.type(input, "a{Enter}");
    expect(screen.getByTitle(/Remove symbol/i)).toBeInTheDocument();
  });

  it('clicking "+ Symbol" button adds the symbol and clears the input', async () => {
    render(<NFAInputPanel />, { wrapper: Wrapper });
    const input = screen.getByPlaceholderText(/Add symbol/i);
    await userEvent.type(input, "b");
    await userEvent.click(screen.getByRole("button", { name: /\+ Symbol/i }));
    expect(input).toHaveValue("");
    expect(screen.getByTitle(/Remove symbol/i)).toBeInTheDocument();
  });

  it("adding the same symbol twice does not create a duplicate chip", async () => {
    render(<NFAInputPanel />, { wrapper: Wrapper });
    const input = screen.getByPlaceholderText(/Add symbol/i);
    await userEvent.type(input, "a{Enter}");
    await userEvent.type(input, "a{Enter}");
    expect(screen.getAllByTitle(/Remove symbol/i)).toHaveLength(1);
  });

  it("clicking the × button removes the symbol chip", async () => {
    render(<NFAInputPanel />, { wrapper: Wrapper });
    const input = screen.getByPlaceholderText(/Add symbol/i);
    await userEvent.type(input, "a{Enter}");
    await userEvent.click(screen.getByTitle(/Remove symbol/i));
    expect(screen.queryByTitle(/Remove symbol/i)).not.toBeInTheDocument();
  });
});

describe("NFAInputPanel — examples panel", () => {
  it('clicking "Load Examples" changes button label to "Hide Examples"', async () => {
    render(<NFAInputPanel />, { wrapper: Wrapper });
    await userEvent.click(
      screen.getByRole("button", { name: /Load Examples/i }),
    );
    expect(
      screen.getByRole("button", { name: /Hide Examples/i }),
    ).toBeInTheDocument();
  });

  it('clicking "Hide Examples" hides the panel again', async () => {
    render(<NFAInputPanel />, { wrapper: Wrapper });
    await userEvent.click(
      screen.getByRole("button", { name: /Load Examples/i }),
    );
    await userEvent.click(
      screen.getByRole("button", { name: /Hide Examples/i }),
    );
    expect(
      screen.getByRole("button", { name: /Load Examples/i }),
    ).toBeInTheDocument();
  });
});

describe("NFAInputPanel — selected state panel", () => {
  it("shows Set Start and Set Final buttons after clicking a state row in the table", async () => {
    // Arrange
    render(<NFAInputPanel />, { wrapper: Wrapper });
    await userEvent.click(screen.getByRole("button", { name: /\+ State/i }));

    // Act — click the state row in the transition table to select it
    await userEvent.click(screen.getByText("q0"));

    // Assert
    expect(
      screen.getByRole("button", { name: /★ Start|Set Start/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /◉ Final|Set Final/i }),
    ).toBeInTheDocument();
  });

  it('toggles isFinal when "Set Final" is clicked', async () => {
    // Arrange
    render(<NFAInputPanel />, { wrapper: Wrapper });
    await userEvent.click(screen.getByRole("button", { name: /\+ State/i }));
    await userEvent.click(screen.getByText("q0"));

    // Act
    await userEvent.click(screen.getByRole("button", { name: /Set Final/i }));

    // Assert — button text changes to ◉ Final after toggle
    expect(
      screen.getByRole("button", { name: /◉ Final/i }),
    ).toBeInTheDocument();
  });

  it('toggles start state label from "★ Start" to "Set Start" when clicked', async () => {
    render(<NFAInputPanel />, { wrapper: Wrapper });
    await userEvent.click(screen.getByRole("button", { name: /\+ State/i }));
    await userEvent.click(screen.getByText("q0"));

    expect(
      screen.getByRole("button", { name: /★ Start/i }),
    ).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: /★ Start/i }));
    expect(
      screen.getByRole("button", { name: /Set Start/i }),
    ).toBeInTheDocument();
  });

  it('removes the selected state when "- State" is clicked', async () => {
    render(<NFAInputPanel />, { wrapper: Wrapper });
    await userEvent.click(screen.getByRole("button", { name: /\+ State/i }));
    await userEvent.click(screen.getByText("q0"));

    await userEvent.click(screen.getByRole("button", { name: /- State/i }));
    expect(screen.queryByText("q0")).not.toBeInTheDocument();
  });
});

describe("NFAInputPanel — import/export handlers", () => {
  it("runs export flow and revokes object URL", async () => {
    const createObjectURL = vi.fn(() => "blob:nfa-url");
    const revokeObjectURL = vi.fn();
    Object.defineProperty(URL, "createObjectURL", {
      value: createObjectURL,
      configurable: true,
    });
    Object.defineProperty(URL, "revokeObjectURL", {
      value: revokeObjectURL,
      configurable: true,
    });
    const clickSpy = vi.fn();
    const originalCreateElement = document.createElement.bind(document);

    vi.spyOn(document, "createElement").mockImplementation(
      (tagName: string) => {
        if (tagName.toLowerCase() === "a") {
          return {
            href: "",
            download: "",
            click: clickSpy,
          } as unknown as HTMLAnchorElement;
        }
        return originalCreateElement(tagName);
      },
    );

    render(<NFAInputPanel />, { wrapper: Wrapper });
    await userEvent.click(screen.getByRole("button", { name: /\+ State/i }));
    await userEvent.click(screen.getByRole("button", { name: /Export NFA/i }));

    expect(createObjectURL).toHaveBeenCalledTimes(1);
    expect(clickSpy).toHaveBeenCalledTimes(1);
    expect(revokeObjectURL).toHaveBeenCalledWith("blob:nfa-url");
  });

  it('clicking "Import NFA" triggers hidden file input click', async () => {
    const clickSpy = vi.spyOn(HTMLInputElement.prototype, "click");
    render(<NFAInputPanel />, { wrapper: Wrapper });

    await userEvent.click(screen.getByRole("button", { name: /Import NFA/i }));
    expect(clickSpy).toHaveBeenCalled();
  });

  it("imports a valid NFA JSON file successfully", async () => {
    class FileReaderMock {
      onload: ((event: { target: { result: string } }) => void) | null = null;
      readAsText() {
        this.onload?.({
          target: {
            result: JSON.stringify({
              states: [{ id: "q0", label: "q0", isStart: true, isFinal: true }],
              transitions: [],
              alphabet: [],
            }),
          },
        });
      }
    }

    vi.stubGlobal("FileReader", FileReaderMock);
    render(<NFAInputPanel />, { wrapper: Wrapper });

    const fileInput = document.querySelector(
      'input[type="file"]',
    ) as HTMLInputElement;
    const file = new File(["{}"], "nfa.json", { type: "application/json" });
    fireEvent.change(fileInput, { target: { files: [file] } });

    expect(
      await screen.findByText(/NFA imported successfully/i),
    ).toBeInTheDocument();
  });

  it("shows an error for malformed imported JSON", async () => {
    class FileReaderMock {
      onload: ((event: { target: { result: string } }) => void) | null = null;
      readAsText() {
        this.onload?.({ target: { result: "{invalid json}" } });
      }
    }

    vi.stubGlobal("FileReader", FileReaderMock);
    render(<NFAInputPanel />, { wrapper: Wrapper });

    const fileInput = document.querySelector(
      'input[type="file"]',
    ) as HTMLInputElement;
    const file = new File(["{}"], "broken.json", { type: "application/json" });
    fireEvent.change(fileInput, { target: { files: [file] } });

    expect(
      await screen.findByText(/Failed to parse NFA file/i),
    ).toBeInTheDocument();
  });

  it("does nothing when the file input fires with no file selected", () => {
    render(<NFAInputPanel />, { wrapper: Wrapper });
    const fileInput = document.querySelector(
      'input[type="file"]',
    ) as HTMLInputElement;
    fireEvent.change(fileInput, { target: { files: [] } });
    expect(screen.queryByText(/imported/i)).not.toBeInTheDocument();
  });

  it("shows an error for imported JSON missing required fields", async () => {
    class FileReaderMock {
      onload: ((event: { target: { result: string } }) => void) | null = null;
      readAsText() {
        this.onload?.({ target: { result: JSON.stringify({ states: [] }) } });
      }
    }

    vi.stubGlobal("FileReader", FileReaderMock);
    render(<NFAInputPanel />, { wrapper: Wrapper });

    const fileInput = document.querySelector(
      'input[type="file"]',
    ) as HTMLInputElement;
    const file = new File(["{}"], "missing.json", { type: "application/json" });
    fireEvent.change(fileInput, { target: { files: [file] } });

    expect(
      await screen.findByText(/Invalid NFA file — missing required fields/i),
    ).toBeInTheDocument();
  });
});
