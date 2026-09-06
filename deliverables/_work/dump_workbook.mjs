import fs from "node:fs/promises";
import { FileBlob, SpreadsheetFile } from "@oai/artifact-tool";

const [inputPath, outputPath] = process.argv.slice(2);
const workbook = await SpreadsheetFile.importXlsx(await FileBlob.load(inputPath));
const sheets = [];

for (let index = 0; index < workbook.worksheets.items.length; index += 1) {
  const sheet = workbook.worksheets.getItemAt(index);
  const used = sheet.getUsedRange();
  sheets.push({
    index,
    name: sheet.name,
    address: used?.address ?? null,
    values: used?.values ?? [],
    formulas: used?.formulas ?? [],
    displayFormulas: used?.displayFormulas ?? [],
  });
}

await fs.writeFile(outputPath, JSON.stringify({ sheets }, null, 2), "utf8");
