import React from "react";
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { Badge } from "../components/ui/Badge";
import { StatCard } from "../components/ui/StatCard";
import { Breadcrumbs } from "../components/layout/Breadcrumbs";
import { PageHeader } from "../components/ui/PageHeader";

describe("Phase 3 UI Components", () => {
  it("renders Button with accessible text and handles states", () => {
    render(<Button variant="primary">Create New Script</Button>);
    const button = screen.getByRole("button", { name: /create new script/i });
    expect(button).toBeInTheDocument();
    expect(button).toHaveClass("bg-gradient-to-r");
  });

  it("renders Card compound components with title and content", () => {
    render(
      <Card>
        <Card.Header>
          <Card.Title>Script Studio</Card.Title>
          <Card.Description>Two-column screenplay generator</Card.Description>
        </Card.Header>
        <Card.Content>
          <p>Main content area</p>
        </Card.Content>
      </Card>
    );

    expect(screen.getByText("Script Studio")).toBeInTheDocument();
    expect(screen.getByText("Two-column screenplay generator")).toBeInTheDocument();
    expect(screen.getByText("Main content area")).toBeInTheDocument();
  });

  it("renders Badge with correct variant styling", () => {
    render(<Badge variant="accent">100 MB</Badge>);
    const badge = screen.getByText("100 MB");
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveClass("text-indigo-300");
  });

  it("renders StatCard with demo label and value", () => {
    render(
      <StatCard
        title="Scripts Created"
        value="24"
        change="+8 this month"
        icon={<span data-testid="test-icon">icon</span>}
        isDemo={true}
      />
    );

    expect(screen.getByText("Scripts Created")).toBeInTheDocument();
    expect(screen.getByText("24")).toBeInTheDocument();
    expect(screen.getByText("+8 this month")).toBeInTheDocument();
    expect(screen.getByText("Prototype Metric")).toBeInTheDocument();
  });

  it("renders Breadcrumbs with semantic navigation", () => {
    render(
      <Breadcrumbs
        items={[{ label: "Video Analysis", href: "/video-analysis" }]}
      />
    );

    const nav = screen.getByRole("navigation", { name: /breadcrumb/i });
    expect(nav).toBeInTheDocument();
    expect(screen.getByText("Video Analysis")).toBeInTheDocument();
  });

  it("renders PageHeader with title and description", () => {
    render(
      <PageHeader
        title="Hook Generator"
        description="9-taxonomy high retention openings"
      />
    );

    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
      "Hook Generator"
    );
    expect(
      screen.getByText("9-taxonomy high retention openings")
    ).toBeInTheDocument();
  });
});
