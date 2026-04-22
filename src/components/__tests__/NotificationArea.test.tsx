import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, act, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
  NotificationProvider,
  useNotification,
} from "../layout/NotificationArea";

function Trigger({ type = "info" }: { type?: "info" | "success" | "error" }) {
  const { notify } = useNotification();
  return <button onClick={() => notify("hello", type)}>Trigger</button>;
}

function HookConsumer() {
  useNotification();
  return <div>ok</div>;
}

describe("NotificationArea", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("throws when useNotification is used outside NotificationProvider", () => {
    expect(() => render(<HookConsumer />)).toThrow(
      /useNotification must be used within NotificationProvider/i,
    );
  });

  it("renders an error notification with red styling", async () => {
    render(
      <NotificationProvider>
        <Trigger type="error" />
      </NotificationProvider>,
    );

    await userEvent.click(screen.getByRole("button", { name: /Trigger/i }));
    const notification = screen.getByText("hello");
    expect(notification).toBeInTheDocument();
    expect(notification.className).toContain("bg-red-600");
  });

  it("auto-removes notifications after 3 seconds", async () => {
    vi.useFakeTimers();
    render(
      <NotificationProvider>
        <Trigger />
      </NotificationProvider>,
    );

    fireEvent.click(screen.getByRole("button", { name: /Trigger/i }));
    expect(screen.getByText("hello")).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(3000);
    });

    expect(screen.queryByText("hello")).not.toBeInTheDocument();
  });
});
