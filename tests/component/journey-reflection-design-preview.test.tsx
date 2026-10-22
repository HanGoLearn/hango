// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { axe } from "jest-axe";
import { JourneyReflectionDesignPreview } from "@/components/lesson/journey-reflection-design-preview";
afterEach(cleanup);

describe("isolated reflection design proposal", () => {
  it("makes fictional data and all six dimensions visible", () => {
    render(<JourneyReflectionDesignPreview locale="es" />);
    expect(
      screen.getByText("PROPUESTA VISUAL · DATOS FICTICIOS"),
    ).toBeInTheDocument();
    expect(screen.getByText(/No es tu resultado/)).toBeInTheDocument();
    for (const name of [
      "Comunicación",
      "Vocabulario en conversación",
      "Gramática en conversación",
      "Pronunciación y tonos",
      "Interacción y autonomía",
      "Fluidez funcional",
    ])
      expect(screen.getByText(name)).toBeInTheDocument();
    expect(
      screen.getByText("5/6 respuestas · 20% de la lección"),
    ).toBeInTheDocument();
  });
  it("shows actionable fictional corrections without audio playback controls", () => {
    render(<JourneyReflectionDesignPreview locale="es" />);
    expect(screen.getByText("我叫是小林。")).toBeInTheDocument();
    expect(screen.getByText("我叫小林。")).toBeInTheDocument();
    expect(
      screen.getByText(/Corrección acústica simulada/),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /^(reproducir|grabar|evaluar)\b/i }),
    ).not.toBeInTheDocument();
  });
  it("does not manufacture an acoustic error or global grade in a partial example", () => {
    render(<JourneyReflectionDesignPreview locale="es" />);
    fireEvent.click(screen.getByRole("button", { name: "Audio sin evaluar" }));
    expect(screen.getAllByText("Sin evaluar")).toHaveLength(2);
    expect(screen.getByText(/No hay grabación evaluada/)).toBeInTheDocument();
    expect(screen.getByText("pendiente")).toBeInTheDocument();
    expect(
      screen.queryByText(/Corrección acústica simulada/),
    ).not.toBeInTheDocument();
    expect(screen.getByLabelText("Estrellas pendientes")).toBeInTheDocument();
  });
  it("offers an extension instead of inventing a grammar error in the strong example", () => {
    render(<JourneyReflectionDesignPreview locale="es" />);
    fireEvent.click(screen.getByRole("button", { name: "Buen desempeño" }));
    expect(screen.getByText("Un pequeño reto para seguir")).toBeInTheDocument();
    expect(screen.queryByText("我叫是小林。")).not.toBeInTheDocument();
  });
  it("supports pinyin toggling and does not issue AI/network calls", () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch");
    render(<JourneyReflectionDesignPreview locale="en" />);
    expect(screen.getByText("Wǒ jiào Xiǎolín.")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Show pinyin" }));
    expect(screen.queryByText("Wǒ jiào Xiǎolín.")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Audio not assessed" }));
    expect(fetchSpy).not.toHaveBeenCalled();
    fetchSpy.mockRestore();
  });
  it("has no detectable accessibility violations in the Spanish proposal", async () => {
    const { container } = render(
      <JourneyReflectionDesignPreview locale="es" />,
    );
    const result = await axe(container);
    expect(result.violations).toEqual([]);
  });
  it("scopes the light palette and localizes fractional contributions", async () => {
    const { container } = render(
      <JourneyReflectionDesignPreview locale="es" palette="light" />,
    );
    expect(screen.getByRole("main")).toHaveAttribute("data-theme", "light");
    expect(screen.getByText("11,25 de 15 puntos")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Audio sin evaluar" }));
    expect((await axe(container)).violations).toEqual([]);
  });
});
