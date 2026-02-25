#!/usr/bin/env node

/**
 * Convert .resx files to Fluent .ftl format
 * Maps language codes: fo -> sma, is -> smj, kl -> sms
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { parseStringPromise } from "xml2js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const RESX_DIR = path.join(__dirname, "../../Recorder.Maui/ResX");
const OUTPUT_DIR = path.join(__dirname, "../src/locales");

// Language code mapping
const LANGUAGE_MAP = {
  fo: "sma", // Faroese placeholder -> Southern Sami
  is: "smj", // Icelandic placeholder -> Lule Sami
  kl: "sms", // Greenlandic placeholder -> Skolt Sami
};

// Extract language code from filename (e.g., AppResources.nb.resx -> nb)
function getLanguageCode(filename) {
  const match = filename.match(/AppResources\.([a-z]{2,3})\.resx$/);
  if (match) {
    const code = match[1];
    return LANGUAGE_MAP[code] || code;
  }
  // Default language (AppResources.resx -> fi)
  if (filename === "AppResources.resx") {
    return "fi";
  }
  return null;
}

// Convert a single data entry to Fluent format
function convertToFluent(key, value) {
  // Convert C# placeholders {0}, {1}, etc. to Fluent placeholders {$param0}, {$param1}, etc.
  let fluentValue = value.replace(
    /\{(\d+)\}/g,
    (match, num) => `{ $param${num} }`,
  );

  // Check if multiline
  if (fluentValue.includes("\n")) {
    const lines = fluentValue.split("\n");
    const fluentLines = lines.map((line, i) =>
      i === 0 ? `${key} =` : `    ${line.trim()}`,
    );
    return fluentLines.join("\n");
  }

  return `${key} = ${fluentValue}`;
}

// Parse a .resx file and convert to .ftl
async function convertResxToFtl(resxPath, outputPath) {
  console.log(
    `Converting ${path.basename(resxPath)} -> ${path.basename(outputPath)}`,
  );

  const xml = fs.readFileSync(resxPath, "utf-8");
  const result = await parseStringPromise(xml);

  const entries = [];

  if (result.root && result.root.data) {
    for (const data of result.root.data) {
      const key = data.$.name;
      const value = data.value[0];

      if (key && value) {
        entries.push(convertToFluent(key, value));
      }
    }
  }

  // Add header comment
  const header = `# Generated from ${path.basename(resxPath)}
# Do not edit manually - use convert-resx-to-ftl.js script

`;

  const ftlContent = header + entries.join("\n\n") + "\n";
  fs.writeFileSync(outputPath, ftlContent, "utf-8");
  console.log(`  ✓ Written ${entries.length} entries`);
}

// Main conversion function
async function main() {
  // Create output directory
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  // Read all .resx files
  const files = fs
    .readdirSync(RESX_DIR)
    .filter((f) => f.endsWith(".resx") && f.startsWith("AppResources"));

  console.log(`Found ${files.length} .resx files\n`);

  for (const file of files) {
    const langCode = getLanguageCode(file);
    if (!langCode) {
      console.log(`Skipping ${file} - unknown language`);
      continue;
    }

    const resxPath = path.join(RESX_DIR, file);
    const ftlPath = path.join(OUTPUT_DIR, `${langCode}.ftl`);

    await convertResxToFtl(resxPath, ftlPath);
  }

  console.log("\n✓ Conversion complete!");
  console.log(`\nLanguage mappings applied:`);
  console.log(`  fo (Faroese) -> sma (Southern Sami)`);
  console.log(`  is (Icelandic) -> smj (Lule Sami)`);
  console.log(`  kl (Greenlandic) -> sms (Skolt Sami)`);
}

// Run the conversion
main().catch(console.error);
