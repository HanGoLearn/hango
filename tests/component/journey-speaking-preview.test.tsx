// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { JourneySpeakingPreview } from "@/components/lesson/journey-speaking-preview";
import { createJourneyReportPreview } from "@/lib/journey-report-preview";
afterEach(cleanup);
describe("non-billing local Speaking preview", () => {
  it("shows the real report renderer, with example scores and no reward claim", () => {
    render(<JourneySpeakingPreview locale="es" />);
    fireEvent.click(
      screen.getByRole("button", { name: "Ver resultado y feedback" }),
    );
    expect(screen.getByText("Nota global: 93/100")).toBeInTheDocument();
    expect(screen.getByText("Conversación: 75/100")).toBeInTheDocument();
    expect(
      screen.getByText(/Resultado de ejemplo: no se guarda/),
    ).toBeInTheDocument();
    expect(
      screen.queryByText(/Resultado guardado y recompensas procesadas/),
    ).not.toBeInTheDocument();
  });
  it("does not request media or paid calls when simulating a turn/help", () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch");
    render(<JourneySpeakingPreview locale="es" />);
    const button = screen.getByRole("button", {
      name: "Mantén presionado para simular un turno",
    });
    fireEvent.keyDown(button, { key: " " });
    fireEvent.keyUp(button, { key: " " });
    expect(screen.getByText("你好，我叫安娜。")).toBeInTheDocument();
    fireEvent.click(
      screen.getByRole("button", { name: "Ver ejemplo de ayuda en español" }),
    );
    expect(
      screen.getByText(/Te pregunté si eres estudiante/),
    ).toBeInTheDocument();
    expect(fetchSpy).not.toHaveBeenCalled();
    fetchSpy.mockRestore();
  });
  it("shows missing capture without a fabricated zero or final score", () => {
    render(<JourneySpeakingPreview locale="es" />);
    fireEvent.click(
      screen.getByRole("button", { name: "Ver resultado y feedback" }),
    );
    fireEvent.click(
      screen.getByRole("button", { name: "Ejemplo sin captura oral" }),
    );
    expect(screen.getByText("Nota global: —")).toBeInTheDocument();
    expect(
      screen.getByText(/La captura oral no se completó/),
    ).toBeInTheDocument();
    expect(screen.queryByText("Nota global: 0/100")).not.toBeInTheDocument();
  });
  it("keeps the fixture synthetic and localized", () => {
    const fixture = createJourneyReportPreview("en");
    expect(fixture.attemptId).toBe("synthetic-demo");
    expect(fixture.locale).toBe("en");
    expect(fixture.rewards.settlement).toBe("NOT_SETTLED");
    expect(fixture.overall.score).toBe(93);
  });
});
