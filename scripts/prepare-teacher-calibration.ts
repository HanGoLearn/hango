/** Generate only fictional reviewer materials. No provider, env, database or
 * real learner recordings/transcripts. Never submit externally automatically. */
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import { createHash } from "node:crypto";
import { EDITORIAL_CALIBRATION_ANCHORS } from "../project/speaking-quality/calibration/editorial-anchors";
import {
  makeBlindTeacherPacket,
  TEACHER_CALIBRATION_VERSION,
} from "../src/lib/journey-speaking-teacher-calibration";

async function main() {
  let blockedNetworkAttempts = 0;
  globalThis.fetch = async () => {
    blockedNetworkAttempts++;
    throw new Error("OFFLINE_ONLY");
  };
  const packet = makeBlindTeacherPacket(EDITORIAL_CALIBRATION_ANCHORS);
  const parent = resolve(".storage/journey-teacher-calibration");
  await mkdir(parent, { recursive: true, mode: 0o700 });
  const root = join(parent, TEACHER_CALIBRATION_VERSION);
  await mkdir(root, { mode: 0o700 }); // Exclusive version directory; never overwrite.
  const markdown = [
    "# Ficha de revisión docente — HanGo",
    "Casos ficticios. No son alumnos ni grabaciones reales. Este paquete no incluye las valoraciones de la clave editorial.",
    "Revisor/a: __________________ · Experiencia docente/evaluadora: __________________ · Fecha: __________",
    "No consultes la clave editorial antes de valorar. Propón 0–4 solo con evidencia y una explicación; usa no evaluable cuando falten datos. No hay audio: pronunciación y fluidez quedan sin nota.",
    "Lee también el protocolo y la rúbrica editorial v2 sin abrir el archivo de referencias. No es un examen HSK oficial ni una certificación nativa.",
    ...packet.cases.map((entry, index) =>
      [
        `## Caso ${index + 1} · ${entry.id}`,
        "",
        `Lección: ${entry.lessonSlug}`,
        "",
        `Tarea: ${entry.task}`,
        "",
        ...entry.turns.map(
          (turn) =>
            `- ${turn.id} · ${turn.role === "user" ? "Estudiante" : "Personaje"}: ${turn.content}`,
        ),
        "",
        "| Criterio | Nivel 0–4 o no evaluable | Citas exactas e IDs | Justificación |",
        "| --- | --- | --- | --- |",
        ...entry.ratings.map(
          (rating) =>
            `| ${rating.dimension} | ${["pronunciation", "fluency"].includes(rating.dimension) ? "No evaluable: sin audio" : ""} | | |`,
        ),
        "",
        "¿Hubo ayuda instructiva, error confirmado, autocorrección, forma requerida ausente o problema de diseño? __________________",
        "",
        "¿Qué comentario/práctica darías al estudiante sin inventar un error? __________________",
      ].join("\n"),
    ),
  ].join("\n\n");
  const sourcePaths = [
    "project/speaking-quality/calibration/editorial-anchors.ts",
    "project/speaking-quality/calibration/editorial-rubric-v2.md",
    "scripts/prepare-teacher-calibration.ts",
  ];
  const sources = await Promise.all(
    sourcePaths.map(async (path) => ({
      path,
      sha256: createHash("sha256")
        .update(await readFile(path))
        .digest("hex"),
    })),
  );
  const files: Record<string, string> = {
    "reviewer-packet.json": JSON.stringify(packet, null, 2),
    "reviewer-packet.md": markdown,
    "editorial-reference.private.json": JSON.stringify(
      {
        version: TEACHER_CALIBRATION_VERSION,
        provenance: "CODEX_AI_ASSISTED_DRAFT",
        cases: EDITORIAL_CALIBRATION_ANCHORS,
      },
      null,
      2,
    ),
    "manifest.json": JSON.stringify(
      {
        version: TEACHER_CALIBRATION_VERSION,
        createdAt: new Date().toISOString(),
        fictionalCases: packet.cases.length,
        independentTeacherReviews: 0,
        humanStudents: 0,
        audioRecordings: 0,
        blockedNetworkAttempts,
        providerRequests: 0,
        deploymentEligible: false,
        sources,
      },
      null,
      2,
    ),
  };
  for (const [file, text] of Object.entries(files))
    await writeFile(join(root, file), text, { flag: "wx", mode: 0o600 });
  console.log(
    JSON.stringify({
      generated: true,
      fictionalCases: packet.cases.length,
      independentTeacherReviews: 0,
      audioRecordings: 0,
      blockedNetworkAttempts,
      providerRequests: 0,
      deploymentEligible: false,
    }),
  );
}
main().catch(() => {
  console.error(
    "Preparation stopped; existing packets are never overwritten. No provider/DB operation.",
  );
  process.exitCode = 1;
});
