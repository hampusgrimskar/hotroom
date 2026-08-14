import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { App } from "../src/app";

describe("App", () => {
  it("renders the landing page", () => {
    render(<App />);
    expect(screen.getByText("🔥 Hotroom")).toBeInTheDocument();
    expect(screen.getByText("Host a Game")).toBeInTheDocument();
    expect(screen.getByText("Join a Game")).toBeInTheDocument();
  });
});
