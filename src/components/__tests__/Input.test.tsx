import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Input } from "../common/Input";

describe("Input — rendering", () => {
  it("renders an input element", () => {
    render(<Input />);
    expect(screen.getByRole("textbox")).toBeInTheDocument();
  });

  it("renders a label when the label prop is provided", () => {
    render(<Input label="Username" />);
    expect(screen.getByText("Username")).toBeInTheDocument();
  });

  it("does not render a label element when label prop is omitted", () => {
    const { container } = render(<Input />);
    expect(container.querySelector("label")).toBeNull();
  });

  it("renders an error message when error prop is provided", () => {
    render(<Input error="This field is required" />);
    expect(screen.getByText("This field is required")).toBeInTheDocument();
  });

  it("does not render an error message when error prop is omitted", () => {
    render(<Input />);
    expect(screen.queryByText(/required/i)).not.toBeInTheDocument();
  });
});

describe("Input — styling", () => {
  it("applies red border class when error is set", () => {
    const { container } = render(<Input error="Error!" />);
    expect(container.querySelector(".border-red-400")).not.toBeNull();
  });

  it("applies default gray border when no error", () => {
    const { container } = render(<Input />);
    expect(container.querySelector(".border-gray-300")).not.toBeNull();
  });

  it("merges a custom className onto the input element", () => {
    const { container } = render(<Input className="my-custom-class" />);
    expect(container.querySelector(".my-custom-class")).not.toBeNull();
  });
});

describe("Input — HTML attribute pass-through", () => {
  it("forwards placeholder to the underlying input", () => {
    render(<Input placeholder="Enter value" />);
    expect(screen.getByPlaceholderText("Enter value")).toBeInTheDocument();
  });

  it("forwards type to the underlying input", () => {
    render(<Input type="email" />);
    expect(screen.getByRole("textbox")).toHaveAttribute("type", "email");
  });

  it("forwards disabled to the underlying input", () => {
    render(<Input disabled />);
    expect(screen.getByRole("textbox")).toBeDisabled();
  });
});
