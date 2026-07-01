import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { parse } from 'csv-parse/sync';

const OFFICIAL_ISTAT_CSV = 'https://www.istat.it/storage/codici-unita-amministrative/Elenco-comuni-italiani.csv';
const outputPath = resolve('public/data/comuni-italiani.json');
const sourceArgIndex = process.argv.indexOf('--source');
const source = sourceArgIndex >= 0 ? process.argv[sourceArgIndex + 1] : OFFICIAL_ISTAT_CSV;

if (!source) throw new Error('Specifica un file o URL dopo --source.');

async function loadSource(value) {
  if (/^https?:\/\//i.test(value)) {
    const response = await fetch(value, { headers: { 'user-agent': 'instaMax municipality updater' } });
    if (!response.ok) throw new Error(`Download ISTAT non riuscito: HTTP ${response.status}`);
    return Buffer.from(await response.arrayBuffer());
  }
  return readFile(resolve(value));
}

const normalizeHeader = value => String(value ?? '').replace(/\s+/g, ' ').trim();
const normalizeValue = value => String(value ?? '').normalize('NFC').replace(/\s+/g, ' ').trim();
const sourceBuffer = await loadSource(source);
// The official CSV is currently distributed as Windows-1252.
const sourceText = new TextDecoder('windows-1252').decode(sourceBuffer);
const records = parse(sourceText, {
  bom: true,
  columns: headers => headers.map(normalizeHeader),
  delimiter: ';',
  relax_column_count: true,
  relax_quotes: true,
  skip_empty_lines: true,
  trim: true,
});

const byCode = new Map();
for (const row of records) {
  const municipality = {
    code: normalizeValue(row['Codice Comune formato alfanumerico']).padStart(6, '0'),
    name: normalizeValue(row['Denominazione in italiano'] || row['Denominazione (Italiana e straniera)']),
    provinceCode: normalizeValue(row['Sigla automobilistica']).toUpperCase(),
    provinceName: normalizeValue(row["Denominazione dell'Unità territoriale sovracomunale (valida a fini statistici)"]),
    regionCode: normalizeValue(row['Codice Regione']).padStart(2, '0'),
    regionName: normalizeValue(row['Denominazione Regione']),
  };
  if (!/^\d{6}$/.test(municipality.code) || !municipality.name || !municipality.provinceName || !municipality.regionName) continue;
  byCode.set(municipality.code, municipality);
}

const municipalities = [...byCode.values()].sort((a, b) =>
  a.name.localeCompare(b.name, 'it', { sensitivity: 'base' }) || a.code.localeCompare(b.code),
);

if (municipalities.length < 7_000) throw new Error(`Elenco incompleto: trovati soltanto ${municipalities.length} comuni.`);
await mkdir(resolve('public/data'), { recursive: true });
await writeFile(outputPath, `${JSON.stringify(municipalities)}\n`, 'utf8');
console.log(`Creato ${outputPath} con ${municipalities.length} comuni. Fonte: ${source}`);
