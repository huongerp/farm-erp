#!/usr/bin/env node
/**
 * Kiểm tra kích thước chunk sau build — cảnh báo nếu vượt ngưỡng.
 * Chạy: npm run build && node scripts/check-bundle-size.mjs
 */
import { readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const DIST_ASSETS = join(process.cwd(), 'dist', 'assets');

/** Ngưỡng gzip ước lượng (raw size / ~3) — chỉ cảnh báo, không fail CI trừ main chunk. */
const WARN_RAW_KB = {
  main: 900,
  vendorXlsx: 400,
  vendorJspdf: 400,
  vendorHtml2canvas: 300,
  recharts: 450,
};

function kb(bytes) {
  return Math.round(bytes / 1024);
}

function findLargestMatching(files, pattern) {
  const matched = files.filter((f) => pattern.test(f));
  if (matched.length === 0) return null;
  return matched
    .map((f) => ({ name: f, size: statSync(join(DIST_ASSETS, f)).size }))
    .sort((a, b) => b.size - a.size)[0];
}

const files = readdirSync(DIST_ASSETS).filter((f) => f.endsWith('.js'));
const main = findLargestMatching(files, /^index-.*\.js$/);
const xlsx = findLargestMatching(files, /vendor-xlsx-.*\.js$/);
const jspdf = findLargestMatching(files, /vendor-jspdf-.*\.js$/);
const html2canvas = findLargestMatching(files, /vendor-html2canvas-.*\.js$/);
const recharts = findLargestMatching(files, /^recharts-.*\.js$/);

const rows = [
  ['Main (index-*.js)', main, WARN_RAW_KB.main],
  ['vendor-xlsx', xlsx, WARN_RAW_KB.vendorXlsx],
  ['vendor-jspdf', jspdf, WARN_RAW_KB.vendorJspdf],
  ['vendor-html2canvas', html2canvas, WARN_RAW_KB.vendorHtml2canvas],
  ['recharts', recharts, WARN_RAW_KB.recharts],
];

console.log('Bundle size check (raw KB):\n');
let failed = false;
for (const [label, entry, limitKb] of rows) {
  if (!entry) {
    console.log(`  ${label}: (not found)`);
    continue;
  }
  const sizeKb = kb(entry.size);
  const warn = sizeKb > limitKb;
  if (warn && label.startsWith('Main')) failed = true;
  console.log(`  ${label}: ${sizeKb} KB${warn ? ` ⚠ exceeds ${limitKb} KB` : ''}  (${entry.name})`);
}

if (failed) {
  console.error('\nMain chunk exceeds threshold. Run npm run build:analyze and see docs/BUNDLE_OPTIMIZATION.md');
  process.exit(1);
}

console.log('\nOK');
