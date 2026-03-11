import { fireEvent, render, screen } from "@testing-library/react";
import React from "react";

import { Modal } from "../Modal";

describe("Modal Component", () => {
  it("does not render when isOpen is false", () => {
    const { container } = render(
      <Modal isOpen={false} onClose={jest.fn()} title="Test Modal">
        Modal Content
      </Modal>
    );
    expect(container).toBeEmptyDOMElement();
  });

  it("renders correctly when isOpen is true", () => {
    render(
      <Modal isOpen={true} onClose={jest.fn()} title="Test Title">
        Body Content
      </Modal>
    );

    expect(screen.getByText("Test Title")).toBeInTheDocument();
    expect(screen.getByText("Body Content")).toBeInTheDocument();
  });

  it("calls onClose when clicking the close button", () => {
    const handleClose = jest.fn();
    render(
      <Modal isOpen={true} onClose={handleClose} title="Test Title">
        Content
      </Modal>
    );

    // There is an SVG button to close
    const closeButton = screen.getByRole("button");
    fireEvent.click(closeButton);

    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  it("applies size classes correctly", () => {
    render(
      <Modal isOpen={true} onClose={jest.fn()} title="Test" size="lg">
        Content
      </Modal>
    );

    // The modal content wrapper
    const title = screen.getByText("Test");
    const modalContent = title.closest("div")?.parentElement; // Parent is the actual modal card

    expect(modalContent).toHaveClass("max-w-2xl");
  });
});
