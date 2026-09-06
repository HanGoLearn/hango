// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { axe, toHaveNoViolations } from "jest-axe";

expect.extend(toHaveNoViolations);

vi.mock("@/components/ui/han-mascot", () => ({
  HanMascot: ({ pose }: { pose: string }) => (
    <div role="img" aria-label={`Han, pose ${pose}`} />
  ),
}));

import { HomeHero } from "@/components/marketing/home-hero";

afterEach(() => {
  cleanup();
});

describe("HanGo public landing page", () => {
  it("communicates the audience, outcome, method, and account actions", () => {
    render(<HomeHero />);

    expect(
      screen.getByRole("heading", {
        level: 1,
        name: /empieza desde cero. lleva tu chino hasta donde quieras/i,
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/mandarín desde cero hasta nivel avanzado/i),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", {
        name: /una ruta que termina en comunicación/i,
      }),
    ).toBeInTheDocument();

    expect(
      screen.getAllByRole("link", { name: /crear (mi )?cuenta/i })[0],
    ).toHaveAttribute("href", "/register");
    expect(
      screen.getAllByRole("link", { name: /iniciar sesión/i })[0],
    ).toHaveAttribute("href", "/login");
    expect(
      screen.getByRole("heading", { name: /crea tu personaje/i }),
    ).toBeInTheDocument();
    expect(screen.getByText("Han Vocabulary")).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: /compite en el leaderboard/i }),
    ).toBeInTheDocument();
  });

  it("keeps Chinese, pinyin, and translation together in the product example", () => {
    render(<HomeHero />);

    expect(screen.getByText("我想要这个，可以少放辣吗？")).toHaveAttribute(
      "lang",
      "zh-Hans",
    );
    expect(
      screen.getByText("Wǒ xiǎng yào zhège, kěyǐ shǎo fàng là ma?"),
    ).toHaveAttribute("lang", "zh-Latn-pinyin");
    expect(
      screen.getByText("Quiero esto. ¿Podría ponerle menos picante?"),
    ).toBeInTheDocument();
  });

  it("has no automatically detectable accessibility violations", async () => {
    const { container } = render(<HomeHero />);
    expect(await axe(container)).toHaveNoViolations();
  });
});
