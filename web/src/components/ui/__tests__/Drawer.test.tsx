import { fireEvent, render, screen } from "@testing-library/react";
import React from "react";

import { Drawer } from "../Drawer";

describe("Drawer Component", () => {
  it("does not render when isOpen is false", () => {
    const { container } = render(
      <Drawer isOpen={false} onClose={jest.fn()} title="Test Drawer">
        Drawer Content
      </Drawer>
    );
    expect(container).toBeEmptyDOMElement();
  });

  it("renders correctly when isOpen is true", () => {
    render(
      <Drawer isOpen={true} onClose={jest.fn()} title="Test Title">
        Body Content
      </Drawer>
    );

    expect(screen.getByText("Test Title")).toBeInTheDocument();
    expect(screen.getByText("Body Content")).toBeInTheDocument();
  });

  it("calls onClose when clicking the close button", () => {
    const handleClose = jest.fn();
    render(
      <Drawer isOpen={true} onClose={handleClose} title="Test Title">
        Content
      </Drawer>
    );

    const closeButton = screen.getByRole("button", { name: "Fechar" });
    fireEvent.click(closeButton);

    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  it("applies size classes correctly", () => {
    const { container } = render(
      <Drawer isOpen={true} onClose={jest.fn()} title="Test" size="lg">
        Content
      </Drawer>
    );

    const dialog = container.querySelector('[role="dialog"]');
    expect(dialog).toHaveClass("lg:max-w-2xl");
  });

  it("passThrough lets events reach behind the overlay", () => {
    const { container } = render(
      <Drawer
        isOpen={true}
        passThrough
        onClose={jest.fn()}
        title="Test"
        side="right"
      >
        Content
      </Drawer>
    );

    const root = container.firstElementChild;
    expect(root).toHaveClass("pointer-events-none");

    const dialog = container.querySelector('[role="dialog"]');
    expect(dialog).toHaveClass("translate-x-full");
    expect(dialog).toHaveClass("pointer-events-none");
  });
});
