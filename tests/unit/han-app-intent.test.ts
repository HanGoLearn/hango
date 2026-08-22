import { describe, expect, it } from "vitest";
import {
  buildStaticHanAppContext,
  detectHanAppContextIntent,
} from "@/lib/han-app-intent";

describe("detectHanAppContextIntent", () => {
  it("does not activate app context merely because Han is open on an app page", () => {
    expect(
      detectHanAppContextIntent(
        "¿Cómo se dice hola en mandarín?",
        "Learning Journey",
      ),
    ).toBeNull();
    expect(
      detectHanAppContextIntent("Quiero practicar el uso de 吧", "Progress"),
    ).toBeNull();
    expect(
      detectHanAppContextIntent("What does 爱 mean?", "Speaking Lab"),
    ).toBeNull();
  });

  it("recognizes deictic help only for the relevant current page", () => {
    expect(
      detectHanAppContextIntent("¿Qué puedo hacer aquí?", "Speaking Lab"),
    ).toBe("SPEAKING_LAB_GUIDE");
    expect(
      detectHanAppContextIntent("How does this page work?", "Writing Lab"),
    ).toBe("WRITING_LAB_GUIDE");
    expect(
      detectHanAppContextIntent("¿Por dónde empiezo aquí?", "Dashboard"),
    ).toBeNull();
  });

  it("uses a static guide for general Learning Journey help and the catalog only for a route request", () => {
    expect(
      detectHanAppContextIntent(
        "Where do I start in Learning Journey?",
        "Dashboard",
      ),
    ).toBe("LEARNING_JOURNEY_GUIDE");
    expect(
      detectHanAppContextIntent(
        "Which Learning Journey scenario should I use to learn how to order pizza?",
        "Dashboard",
      ),
    ).toBe("LEARNING_JOURNEY_ROUTE");
    expect(
      detectHanAppContextIntent(
        "¿Dónde aprendo a pedir pizza?",
        "Learning Journey",
      ),
    ).toBe("LEARNING_JOURNEY_ROUTE");
    expect(
      detectHanAppContextIntent("¿Cómo se dice pizza?", "Learning Journey"),
    ).toBeNull();
  });

  it("selects only the requested Progress data block", () => {
    expect(
      detectHanAppContextIntent("¿Por qué mi General Level es 55?", "Progress"),
    ).toBe("PROGRESS_GENERAL");
    expect(
      detectHanAppContextIntent(
        "Why is my Speaking score low in Progress?",
        "Dashboard",
      ),
    ).toBe("PROGRESS_COMPETENCIES");
    expect(
      detectHanAppContextIntent(
        "¿Cuánto vocabulario he encontrado en Progress?",
        "Dashboard",
      ),
    ).toBe("PROGRESS_EXPOSURE");
    expect(
      detectHanAppContextIntent("¿Qué debo repasar ahora?", "Progress"),
    ).toBe("PROGRESS_REVIEW");
    expect(
      detectHanAppContextIntent(
        "Explícame todos mis puntajes y resultados de Progress",
        "Dashboard",
      ),
    ).toBe("PROGRESS_FULL");
  });
});

describe("buildStaticHanAppContext", () => {
  it("describes the Labs without confusing them with lesson Speaking or Han", () => {
    const speaking = buildStaticHanAppContext("SPEAKING_LAB_GUIDE");
    const writing = buildStaticHanAppContext("WRITING_LAB_GUIDE");
    expect(speaking).toContain("separate from the Speaking step");
    expect(speaking).toContain("separate from Han's side-panel conversation");
    expect(writing).toContain("Translation Challenge");
    expect(writing).toContain("Custom Writing");
  });
});
