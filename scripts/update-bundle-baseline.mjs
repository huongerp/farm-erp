#!/usr/bin/env node
/**
 * Cập nhật scripts/bundle-baseline.json từ dist/assets sau build.
 * Chạy: npm run build && node scripts/update-bundle-baseline.mjs
 */
import { readFileSync, writeFileSync, readdirSync, statSync } from 'node:fs';
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

const files = readdirSync(DIST_ASSETS).filter((f) => f.endsWith('.js'));
const main = findLargestMatching(files, /^index-.*\.js$/);
const xlsx = findLargestMatching(files, /vendor-xlsx-.*\.js$/);
const jspdf = findLargestMatching(files, /vendor-jspdf-.*\.js$/);
const html2canvas = findLargestMatching(files, /vendor-html2canvas-.*\.js$/);
const recharts = findLargestMatching(files, /^recharts-.*\.js$/);
const framer = findLargestMatching(files, /^framer-motion-.*\.js$/);
const sentry = findLargestMatching(files, /^sentry-.*\.js$/);

let prev = {};
try {
  prev = JSON.parse(readFileSync(BASELINE_PATH, 'utf8'));
} catch {
  /* first run */
}

const baseline = {
  updatedAt: new Date().toISOString().slice(0, 10),
  note: 'Raw KB from dist/assets after vite build. Regenerate: npm run build && node scripts/update-bundle-baseline.mjs',
  chunks: {
    main: {
      rawKb: main ? kb(main.size) : prev.chunks?.main?.rawKb ?? 0,
      warnKb: prev.chunks?.main?.warnKb ?? 900,
      maxIncreasePct: prev.chunks?.main?.maxIncreasePct ?? 5,
    },
    vendorXlsx: {
      rawKb: xlsx ? kb(xlsx.size) : prev.chunks?.vendorXlsx?.rawKb ?? 0,
      warnKb: prev.chunks?.vendorXlsx?.warnKb ?? 400,
    },
    vendorJspdf: {
      rawKb: jspdf ? kb(jspdf.size) : prev.chunks?.vendorJspdf?.rawKb ?? 0,
      warnKb: prev.chunks?.vendorJspdf?.warnKb ?? 400,
    },
    vendorHtml2canvas: {
      rawKb: html2canvas ? kb(html2canvas.size) : prev.chunks?.vendorHtml2canvas?.rawKb ?? 0,
      warnKb: prev.chunks?.vendorHtml2canvas?.warnKb ?? 300,
    },
    recharts: {
      rawKb: recharts ? kb(recharts.size) : prev.chunks?.recharts?.rawKb ?? 0,
      warnKb: prev.chunks?.recharts?.warnKb ?? 450,
    },
    framerMotion: {
      rawKb: framer ? kb(framer.size) : prev.chunks?.framerMotion?.rawKb ?? 0,
      warnKb: prev.chunks?.framerMotion?.warnKb ?? 150,
    },
    sentry: {
      rawKb: sentry ? kb(sentry.size) : prev.chunks?.sentry?.rawKb ?? 0,
      warnKb: prev.chunks?.sentry?.warnKb ?? 50,
    },
  },
};

writeFileSync(BASELINE_PATH, `${JSON.stringify(baseline, null, 2)}\n`);
console.log('Updated', BASELINE_PATH);
console.log(JSON.stringify(baseline.chunks, null, 2));
