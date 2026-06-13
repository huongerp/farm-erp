#!/usr/bin/env node
/**
 * Kiểm tra kích thước chunk sau build — so với scripts/bundle-baseline.json.
 * Chạy: npm run build && npm run check:bundle
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const DIST_ASSETS = join(process.cwd(), 'dist', 'assets');
const BASELINE_PATH = join(process.cwd(), 'scripts', 'bundle-baseline.json');

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

function loadBaseline() {
  try {
    return JSON.parse(readFileSync(BASELINE_PATH, 'utf8'));
  } catch {
    return null;
  }
}

const baseline = loadBaseline();
const files = readdirSync(DIST_ASSETS).filter((f) => f.endsWith('.js'));

const entries = [
  { label: 'Main (index-*.js)', key: 'main', pattern: /^index-.*\.js$/, failOnExceed: true },
  { label: 'vendor-xlsx', key: 'vendorXlsx', pattern: /vendor-xlsx-.*\.js$/ },
  { label: 'vendor-jspdf', key: 'vendorJspdf', pattern: /vendor-jspdf-.*\.js$/ },
  { label: 'vendor-html2canvas', key: 'vendorHtml2canvas', pattern: /vendor-html2canvas-.*\.js$/ },
  { label: 'recharts', key: 'recharts', pattern: /^recharts-.*\.js$/ },
  { label: 'framer-motion', key: 'framerMotion', pattern: /^framer-motion-.*\.js$/ },
  { label: 'sentry', key: 'sentry', pattern: /^sentry-.*\.js$/ },
];

console.log('Bundle size check (raw KB):\n');
let failed = false;

for (const { label, key, pattern, failOnExceed } of entries) {
  const entry = findLargestMatching(files, pattern);
  if (!entry) {
    console.log(`  ${label}: (not found)`);
    continue;
  }
  const sizeKb = kb(entry.size);
  const b = baseline?.chunks?.[key];
  const warnKb = b?.warnKb ?? 900;
  const baselineKb = b?.rawKb;
  const maxIncreasePct = b?.maxIncreasePct ?? 5;

  let flags = '';
  if (sizeKb > warnKb) flags += ` ⚠ exceeds warn ${warnKb} KB`;

  if (baselineKb != null && key === 'main') {
    const maxAllowed = Math.ceil(baselineKb * (1 + maxIncreasePct / 100));
    if (sizeKb > maxAllowed) {
      flags += ` ⚠ main +${maxIncreasePct}% over baseline (${baselineKb} KB → max ${maxAllowed} KB)`;
      if (failOnExceed) failed = true;
    } else if (sizeKb > baselineKb) {
      flags += ` (baseline ${baselineKb} KB, +${sizeKb - baselineKb} KB)`;
    } else {
      flags += ` (baseline ${baselineKb} KB, ${sizeKb - baselineKb} KB)`;
    }
  }

  console.log(`  ${label}: ${sizeKb} KB${flags}  (${entry.name})`);
}

if (failed) {
  console.error('\nMain chunk exceeds baseline threshold. Run npm run build:analyze and see docs/BUNDLE_OPTIMIZATION.md');
  process.exit(1);
}

console.log('\nOK');
