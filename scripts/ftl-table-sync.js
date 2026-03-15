#!/usr/bin/env node

/**
 * Export/import Fluent .ftl locale files to/from CSV/TSV.
 *
 * Usage:
 *   node scripts/ftl-table-sync.js export --out locales.csv
 *   node scripts/ftl-table-sync.js export --out locales.tsv
 *   node scripts/ftl-table-sync.js import --in locales.csv
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, "..");
const DEFAULT_LOCALES_DIR = path.join(PROJECT_ROOT, "src", "locales");

function printHelp() {
  console.log(`
FTL table sync

Commands:
  export    Create CSV/TSV from src/locales/*.ftl
  import    Update src/locales/*.ftl from CSV/TSV

Options:
  --dir <path>      Locales directory (default: src/locales)
  --out <path>      Export file path (default: locales.csv)
  --in <path>       Input CSV/TSV path (required for import)
  --format <type>   csv|tsv (optional, inferred from file extension)
  --help            Show this help

Examples:
  node scripts/ftl-table-sync.js export --out locales.csv
  node scripts/ftl-table-sync.js export --out locales.tsv
  node scripts/ftl-table-sync.js import --in locales.csv
`);
}

function parseArgs(argv) {
  const [command, ...rest] = argv;
  const options = {};

  for (let i = 0; i < rest.length; i += 1) {
    const token = rest[i];
    if (!token.startsWith("--")) {
      continue;
    }
    const key = token.slice(2);
    const next = rest[i + 1];
    if (next && !next.startsWith("--")) {
      options[key] = next;
      i += 1;
    } else {
      options[key] = "true";
    }
  }

  return { command, options };
}

function resolveMaybeRelativePath(inputPath) {
  if (!inputPath) {
    return null;
  }
  return path.isAbsolute(inputPath)
    ? inputPath
    : path.resolve(PROJECT_ROOT, inputPath);
}

function normalizeLineEndings(text) {
  return text.replace(/\r\n/g, "\n");
}

function parseFtl(content) {
  const lines = normalizeLineEndings(content).split("\n");
  const map = new Map();
  const order = [];

  let index = 0;
  while (index < lines.length) {
    const line = lines[index];

    if (!line || line.trim() === "" || line.trimStart().startsWith("#")) {
      index += 1;
      continue;
    }

    const keyMatch = line.match(/^([A-Za-z][A-Za-z0-9_-]*)\s*=\s?(.*)$/);
    if (!keyMatch) {
      index += 1;
      continue;
    }

    const key = keyMatch[1];
    const valueLines = [keyMatch[2] ?? ""];
    index += 1;

    while (index < lines.length) {
      const nextLine = lines[index];
      if (!nextLine.startsWith(" ") && !nextLine.startsWith("\t")) {
        break;
      }

      if (nextLine.startsWith("    ")) {
        valueLines.push(nextLine.slice(4));
      } else {
        valueLines.push(nextLine.trimStart());
      }

      index += 1;
    }

    map.set(key, valueLines.join("\n"));
    order.push(key);
  }

  return { map, order };
}

function getHeaderComment(filePath) {
  if (!fs.existsSync(filePath)) {
    return "";
  }

  const lines = normalizeLineEndings(fs.readFileSync(filePath, "utf-8")).split(
    "\n",
  );

  const commentLines = [];
  for (const line of lines) {
    if (line.startsWith("#")) {
      commentLines.push(line);
      continue;
    }
    break;
  }

  if (commentLines.length === 0) {
    return "";
  }

  return `${commentLines.join("\n")}\n\n`;
}

function serializeFtlEntry(key, value) {
  const normalized = normalizeLineEndings(value ?? "");
  if (!normalized.includes("\n")) {
    return `${key} = ${normalized}`;
  }

  const lines = normalized.split("\n");
  const [firstLine, ...restLines] = lines;
  const serializedRest = restLines.map((line) => `    ${line}`).join("\n");
  return `${key} = ${firstLine}\n${serializedRest}`;
}

function quoteField(value, delimiter) {
  const normalized = String(value ?? "");
  const escaped = normalized.replace(/"/g, '""');
  const requiresQuoting =
    escaped.includes(delimiter) ||
    escaped.includes("\n") ||
    escaped.includes("\r") ||
    escaped.includes('"');
  return requiresQuoting ? `"${escaped}"` : escaped;
}

function stringifyTable(rows, delimiter) {
  const body = rows
    .map((row) =>
      row.map((cell) => quoteField(cell, delimiter)).join(delimiter),
    )
    .join("\n");
  return `${body}\n`;
}

function parseTable(content, delimiter) {
  const rows = [];
  const text = normalizeLineEndings(content).replace(/^\uFEFF/, "");

  let row = [];
  let field = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];

    if (inQuotes) {
      if (char === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i += 1;
        } else {
          inQuotes = false;
        }
      } else {
        field += char;
      }
      continue;
    }

    if (char === '"') {
      inQuotes = true;
      continue;
    }

    if (char === delimiter) {
      row.push(field);
      field = "";
      continue;
    }

    if (char === "\n") {
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
      continue;
    }

    field += char;
  }

  if (inQuotes) {
    throw new Error("Malformed table input: missing closing quote.");
  }

  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }

  return rows;
}

function detectDelimiter(filePath, formatOption) {
  if (formatOption) {
    if (formatOption === "csv") {
      return ",";
    }
    if (formatOption === "tsv") {
      return "\t";
    }
    throw new Error(`Unsupported format '${formatOption}'. Use csv or tsv.`);
  }

  const ext = path.extname(filePath).toLowerCase();
  if (ext === ".tsv") {
    return "\t";
  }
  return ",";
}

function languageSort(a, b) {
  if (a === "fi") {
    return -1;
  }
  if (b === "fi") {
    return 1;
  }
  return a.localeCompare(b);
}

function exportTable(localesDir, outputFile, formatOption) {
  if (!fs.existsSync(localesDir)) {
    throw new Error(`Locales directory not found: ${localesDir}`);
  }

  const ftlFiles = fs
    .readdirSync(localesDir)
    .filter((name) => name.endsWith(".ftl"))
    .sort((a, b) => a.localeCompare(b));

  if (ftlFiles.length === 0) {
    throw new Error(`No .ftl files found in: ${localesDir}`);
  }

  const locales = ftlFiles
    .map((fileName) => path.basename(fileName, ".ftl"))
    .sort(languageSort);

  const parsedByLocale = new Map();
  for (const locale of locales) {
    const filePath = path.join(localesDir, `${locale}.ftl`);
    const content = fs.readFileSync(filePath, "utf-8");
    parsedByLocale.set(locale, parseFtl(content));
  }

  const baseLocale = locales.includes("fi") ? "fi" : locales[0];
  const keyOrder = [...parsedByLocale.get(baseLocale).order];
  const knownKeys = new Set(keyOrder);

  for (const locale of locales) {
    if (locale === baseLocale) {
      continue;
    }

    const extraKeys = parsedByLocale
      .get(locale)
      .order.filter((key) => !knownKeys.has(key));

    if (extraKeys.length > 0) {
      console.warn(
        `Warning: ${locale}.ftl has ${extraKeys.length} key(s) not present in ${baseLocale}.ftl. They are ignored in export.`,
      );
    }
  }

  const delimiter = detectDelimiter(outputFile, formatOption);
  const header = ["key", ...locales];
  const rows = [header];

  for (const key of keyOrder) {
    const row = [key];
    for (const locale of locales) {
      row.push(parsedByLocale.get(locale).map.get(key) ?? "");
    }
    rows.push(row);
  }

  const tableContent = stringifyTable(rows, delimiter);
  fs.mkdirSync(path.dirname(outputFile), { recursive: true });
  fs.writeFileSync(outputFile, tableContent, "utf-8");

  console.log(
    `✓ Exported ${keyOrder.length} keys from ${locales.length} locales`,
  );
  console.log(`  Output: ${outputFile}`);
}

function importTable(localesDir, inputFile, formatOption) {
  if (!fs.existsSync(inputFile)) {
    throw new Error(`Input table not found: ${inputFile}`);
  }

  const delimiter = detectDelimiter(inputFile, formatOption);
  const rows = parseTable(fs.readFileSync(inputFile, "utf-8"), delimiter);

  if (rows.length === 0) {
    throw new Error("Input table is empty.");
  }

  const header = rows[0].map((cell) => (cell ?? "").trim());
  if (header.length < 2) {
    throw new Error(
      "Input table must contain at least 'key' and one locale column.",
    );
  }

  if (header[0].toLowerCase() !== "key") {
    throw new Error("First column must be named 'key'.");
  }

  const locales = header.slice(1).filter(Boolean);
  if (locales.length === 0) {
    throw new Error("No locale columns found in input table.");
  }

  const keyOrder = [];
  const valuesByLocale = new Map(locales.map((locale) => [locale, new Map()]));

  for (let rowIndex = 1; rowIndex < rows.length; rowIndex += 1) {
    const row = rows[rowIndex];
    const key = (row[0] ?? "").trim();
    if (!key) {
      continue;
    }

    keyOrder.push(key);

    for (let i = 0; i < locales.length; i += 1) {
      const locale = locales[i];
      valuesByLocale.get(locale).set(key, row[i + 1] ?? "");
    }
  }

  if (keyOrder.length === 0) {
    throw new Error("No keys found in input table.");
  }

  fs.mkdirSync(localesDir, { recursive: true });

  for (const locale of locales) {
    const targetFile = path.join(localesDir, `${locale}.ftl`);
    const headerComment = getHeaderComment(targetFile);
    const values = valuesByLocale.get(locale);

    const entries = keyOrder.map((key) =>
      serializeFtlEntry(key, values.get(key)),
    );
    const body = `${entries.join("\n\n")}\n`;
    fs.writeFileSync(targetFile, `${headerComment}${body}`, "utf-8");
  }

  console.log(
    `✓ Imported ${keyOrder.length} keys to ${locales.length} locales`,
  );
  console.log(`  Directory: ${localesDir}`);
}

function main() {
  const { command, options } = parseArgs(process.argv.slice(2));

  if (!command || command === "--help" || options.help === "true") {
    printHelp();
    process.exit(0);
  }

  const localesDir =
    resolveMaybeRelativePath(options.dir) ?? DEFAULT_LOCALES_DIR;

  if (command === "export") {
    const outputFile =
      resolveMaybeRelativePath(options.out) ??
      path.join(PROJECT_ROOT, "locales.csv");
    exportTable(localesDir, outputFile, options.format);
    return;
  }

  if (command === "import") {
    const inputFile = resolveMaybeRelativePath(options.in);
    if (!inputFile) {
      throw new Error("Missing --in <path> for import command.");
    }
    importTable(localesDir, inputFile, options.format);
    return;
  }

  throw new Error(`Unknown command '${command}'. Use export or import.`);
}

try {
  main();
} catch (error) {
  console.error(`Error: ${error.message}`);
  process.exit(1);
}
