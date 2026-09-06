import fs from "node:fs/promises";
import { FileBlob, SpreadsheetFile } from "@oai/artifact-tool";

const [inputPath, outputDir] = process.argv.slice(2);
await fs.mkdir(outputDir, { recursive: true });

const input = await FileBlob.load(inputPath);
const workbook = await SpreadsheetFile.importXlsx(input);

const overview = await workbook.inspect({
  kind: "workbook,sheet,table,definedName,drawing",
  maxChars: 20000,
  tableMaxRows: 12,
  tableMaxCols: 12,
  tableMaxCellChars: 150,
});
await fs.writeFile(`${outputDir}/overview.ndjson`, overview.ndjson, "utf8");

const sheets = [];
for (let index = 0; index < workbook.worksheets.items.length; index += 1) {
  const sheet = workbook.worksheets.getItemAt(index);
  const used = sheet.getUsedRange();
  const usedAddress = used?.address ?? null;
  const inspect = usedAddress
    ? await workbook.inspect({
        kind: "table,formula,computedStyle",
        sheetId: sheet.name,
        range: usedAddress,
        maxChars: 30000,
        tableMaxRows: 200,
        tableMaxCols: 30,
        tableMaxCellChars: 250,
        options: { maxResults: 500 },
      })
    : { ndjson: "" };
  await fs.writeFile(`${outputDir}/sheet-${index + 1}-${sheet.name.replaceAll(/[^a-zA-Z0-9_-]/g, "_")}.ndjson`, inspect.ndjson, "utf8");

  if (usedAddress) {
    const preview = await workbook.render({
      sheetName: sheet.name,
      range: usedAddress,
      scale: 1.5,
      format: "png",
    });
    await fs.writeFile(
      `${outputDir}/sheet-${index + 1}-${sheet.name.replaceAll(/[^a-zA-Z0-9_-]/g, "_")}.png`,
      new Uint8Array(await preview.arrayBuffer()),
    );
  }
  sheets.push({ index, name: sheet.name, usedAddress });
}

await fs.writeFile(`${outputDir}/sheets.json`, JSON.stringify(sheets, null, 2), "utf8");
