import pg from "pg";

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });

// Known Chinese meta-instruction templates -> English translations. These
// only translate the INSTRUCTION wrapper (what task to perform), never the
// underlying Chinese practice sentence itself - that stays exactly as
// authored, appropriately in Chinese at every level.
const PREFIX_MAP = [
  ["选择正确的翻译：", "Choose the correct translation: "],
  ["选择正确的词填空：", "Choose the correct word for the blank: "],
  ["选择正确的量词填空：", "Choose the correct measure word for the blank: "],
  ["选择语序正确的句子：", "Choose the sentence with the correct word order: "],
  ["选择正确的句子：", "Choose the correct sentence: "],
];

function translatePrompt(prompt) {
  for (const [zh, en] of PREFIX_MAP) {
    if (prompt.startsWith(zh)) {
      return en + prompt.slice(zh.length);
    }
  }
  // "<quoted Chinese>"最恰当的翻译是： -> What is the best translation of "<quoted Chinese>"?
  const suffixMatch = prompt.match(/^(.+)最恰当的翻译是：?$/);
  if (suffixMatch) {
    return `What is the best translation of ${suffixMatch[1].trim()}?`;
  }
  // Bare fill-in-the-blank sentence with no instruction at all (advanced-tier outliers)
  if (/[a-zA-Z]/.test(prompt) === false && prompt.includes("___")) {
    return `Choose the word that completes this sentence: ${prompt}`;
  }
  return null;
}

try {
  const rows = await pool.query(`
    SELECT e.id, e.prompt
    FROM "Exercise" e
    WHERE e.status = 'PUBLISHED' AND e."grammarPointId" IS NOT NULL
      AND e.prompt !~ '^[A-Za-z]'
  `);
  console.log("Candidate grammar exercises:", rows.rows.length);

  let updated = 0;
  let skipped = 0;
  const skippedSamples = [];
  for (const row of rows.rows) {
    const translated = translatePrompt(row.prompt);
    if (!translated) {
      skipped++;
      if (skippedSamples.length < 20) skippedSamples.push(row.prompt);
      continue;
    }
    await pool.query(`UPDATE "Exercise" SET prompt = $1 WHERE id = $2`, [
      translated,
      row.id,
    ]);
    updated++;
  }
  console.log("Updated:", updated);
  console.log("Skipped (no known pattern matched):", skipped);
  if (skippedSamples.length) {
    console.log("Skipped samples:");
    skippedSamples.forEach((s) => console.log("  " + s));
  }
} catch (e) {
  console.error("ERR", e);
} finally {
  await pool.end();
}
