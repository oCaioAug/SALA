import { render, screen } from "@testing-library/react";
import React from "react";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "../Card";

describe("Card Component Structure", () => {
  it("renders all card segments correctly", () => {
    render(
      <Card data-testid="card">
        <CardHeader>
          <CardTitle>Card Title</CardTitle>
          <CardDescription>Card Description</CardDescription>
        </CardHeader>
        <CardContent>Content Goes Here</CardContent>
        <CardFooter>Footer Actions</CardFooter>
      </Card>
    );

    expect(screen.getByTestId("card")).toBeInTheDocument();
    expect(screen.getByText("Card Title")).toBeInTheDocument();
    expect(screen.getByText("Card Description")).toBeInTheDocument();
    expect(screen.getByText("Content Goes Here")).toBeInTheDocument();
    expect(screen.getByText("Footer Actions")).toBeInTheDocument();
  });

  it("renders correctly with different variants", () => {
    render(
      <Card variant="elevated" data-testid="elevated-card">
        Elevated
      </Card>
    );
    const card = screen.getByTestId("elevated-card");
    expect(card).toHaveClass("shadow-2xl");
  });

  it("applies hover effects when hover prop is true", () => {
    render(
      <Card hover data-testid="hover-card">
        Hoverable
      </Card>
    );
    const card = screen.getByTestId("hover-card");
    expect(card).toHaveClass("hover:shadow-2xl hover:scale-[1.02]");
  });
});
