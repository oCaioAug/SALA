import { render, screen } from "@testing-library/react";
import React from "react";

import {
  RoomActiveReservationBadge,
  RoomStatusBadges,
  StatusBadge,
} from "../StatusBadge";

jest.mock("next-intl", () => ({
  useTranslations: (namespace: string) => (key: string) => {
    const messages: Record<string, Record<string, string>> = {
      "Dashboard.filters": {
        statusFree: "Livre",
        statusInUse: "Em uso",
        statusReserved: "Reservado",
      },
      "Dashboard.card": {
        reservedTag: "Reservada",
      },
    };

    return messages[namespace]?.[key] ?? key;
  },
}));

describe("StatusBadge", () => {
  it("renders LIVRE status", () => {
    render(<StatusBadge status="LIVRE" />);
    expect(screen.getByText("Livre")).toHaveClass("bg-emerald-500/15");
  });

  it("renders EM_USO status", () => {
    render(<StatusBadge status="EM_USO" />);
    expect(screen.getByText("Em uso")).toHaveClass("bg-rose-500/15");
  });

  it("renders RESERVADO status", () => {
    render(<StatusBadge status="RESERVADO" />);
    expect(screen.getByText("Reservado")).toHaveClass("bg-amber-500/15");
  });
});

describe("RoomActiveReservationBadge", () => {
  it("renders active reservation label", () => {
    render(<RoomActiveReservationBadge />);
    expect(screen.getByText("Reservada")).toHaveClass("bg-amber-500/15");
  });
});

describe("RoomStatusBadges", () => {
  it("shows status and active reservation when room is free", () => {
    render(
      <RoomStatusBadges status="LIVRE" hasActiveReservation />
    );
    expect(screen.getByText("Livre")).toBeInTheDocument();
    expect(screen.getByText("Reservada")).toBeInTheDocument();
  });

  it("hides active reservation badge when status is already RESERVADO", () => {
    render(
      <RoomStatusBadges status="RESERVADO" hasActiveReservation />
    );
    expect(screen.getByText("Reservado")).toBeInTheDocument();
    expect(screen.queryByText("Reservada")).not.toBeInTheDocument();
  });
});
