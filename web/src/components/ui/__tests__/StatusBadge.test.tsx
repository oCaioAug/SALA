import { render, screen } from "@testing-library/react";
import React from "react";

import { StatusBadge } from "../StatusBadge";

// Mock next-intl
jest.mock("next-intl", () => ({
  useTranslations: () => (key: string) => {
    const messages: Record<string, string> = {
      statusFree: "Livre",
      statusInUse: "Em uso",
      statusReserved: "Reservado",
    };
    return messages[key] || key;
  },
}));

describe("StatusBadge Component", () => {
  it("renders LIVRE status correctly", () => {
    render(<StatusBadge status="LIVRE" />);
    expect(screen.getByText("Livre")).toBeInTheDocument();
    const badge = screen.getByText("Livre").closest("div");
    expect(badge).toHaveClass("bg-green-50");
  });

  it("renders EM_USO status correctly", () => {
    render(<StatusBadge status="EM_USO" />);
    expect(screen.getByText("Em uso")).toBeInTheDocument();
    const badge = screen.getByText("Em uso").closest("div");
    expect(badge).toHaveClass("bg-red-50");
  });

  it("renders RESERVADO status correctly", () => {
    render(<StatusBadge status="RESERVADO" />);
    expect(screen.getByText("Reservado")).toBeInTheDocument();
    const badge = screen.getByText("Reservado").closest("div");
    expect(badge).toHaveClass("bg-yellow-50");
  });
});
