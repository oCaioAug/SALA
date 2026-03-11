import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";

import { ToastProvider, useToast } from "../Toast";

// Dummy component to consume the toast context
const ToastTestComponent = () => {
  const { addToast } = useToast();
  return (
    <div>
      <button
        onClick={() =>
          addToast({
            title: "Success Toast",
            type: "success",
            message: "It worked",
          })
        }
      >
        Show Success
      </button>
      <button onClick={() => addToast({ title: "Error Toast", type: "error" })}>
        Show Error
      </button>
    </div>
  );
};

describe("Toast Component & Context", () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.restoreAllMocks();
    jest.useRealTimers();
  });

  it("renders a toast when addToast is called", async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    render(
      <ToastProvider>
        <ToastTestComponent />
      </ToastProvider>
    );

    // Trigger success toast
    await user.click(screen.getByText("Show Success"));

    expect(screen.getByText("Success Toast")).toBeInTheDocument();
    expect(screen.getByText("It worked")).toBeInTheDocument();
  });

  it("can render multiple toasts", async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    render(
      <ToastProvider>
        <ToastTestComponent />
      </ToastProvider>
    );

    await user.click(screen.getByText("Show Success"));
    await user.click(screen.getByText("Show Error"));

    expect(screen.getByText("Success Toast")).toBeInTheDocument();
    expect(screen.getByText("Error Toast")).toBeInTheDocument();
  });

  it("removes toast when close button is clicked", async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    render(
      <ToastProvider>
        <ToastTestComponent />
      </ToastProvider>
    );

    await user.click(screen.getByText("Show Success"));
    expect(screen.getByText("Success Toast")).toBeInTheDocument();

    // Find and click the close button inside the toast
    // The close button has an SVG X icon, but we can query by role
    const closeButtons = screen
      .getAllByRole("button")
      .filter(b => !b.textContent);
    expect(closeButtons.length).toBeGreaterThan(0);

    await user.click(closeButtons[0]);

    expect(screen.queryByText("Success Toast")).not.toBeInTheDocument();
  });

  it("auto removes toast after duration", async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    render(
      <ToastProvider>
        <ToastTestComponent />
      </ToastProvider>
    );

    await user.click(screen.getByText("Show Success"));
    expect(screen.getByText("Success Toast")).toBeInTheDocument();

    // Default duration is 5000ms
    act(() => {
      jest.advanceTimersByTime(5000);
    });

    expect(screen.queryByText("Success Toast")).not.toBeInTheDocument();
  });
});
