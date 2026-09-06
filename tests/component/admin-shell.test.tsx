// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({
  usePathname: () => "/admin/analytics",
}));

import { AdminShell } from "@/components/admin/admin-shell";

afterEach(cleanup);

describe("AdminShell", () => {
  it("exposes the product analytics area without learner navigation", () => {
    render(
      <AdminShell administratorName="Arean">
        <p>Contenido analítico</p>
      </AdminShell>,
    );

    expect(screen.getByText("HanGo Admin")).toBeInTheDocument();
    expect(screen.getByText("Contenido analítico")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Analítica" })).toHaveAttribute(
      "href",
      "/admin/analytics",
    );
    expect(screen.getByRole("link", { name: "Analítica" })).toHaveClass(
      "bg-primary-500",
    );
    expect(
      screen.queryByRole("link", { name: "Speaking Lab" }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Volver a HanGo" }),
    ).toHaveAttribute("href", "/dashboard");
  });
});
