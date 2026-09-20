import nextConfig from "eslint-config-next";
import prettierConfig from "eslint-config-prettier";

const config = [
  ...nextConfig,
  prettierConfig,
  {
    // .codex-tmp/.codex-work/outputs are gitignored scratch directories left
    // by tools running against this repo (see .gitignore); deliverables/ is
    // committed office artifacts (docx/xlsx/pdf), never lint targets. None
    // of the four contain JS/TS source, but without an explicit ignore
    // ESLint still walks their (sometimes hundreds-of-MB) binary content on
    // every `eslint .` run - the 2026-09-14 audit's "lint tries to enter an
    // inaccessible temp folder" finding.
    ignores: [
      ".next/**",
      "node_modules/**",
      "src/generated/**",
      ".codex-tmp/**",
      ".codex-work/**",
      "outputs/**",
      "deliverables/**",
    ],
  },
];

export default config;
