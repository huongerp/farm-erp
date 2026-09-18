/**
 * Locale feature nạp lazy, nên hai thứ phải luôn đúng, nếu sai thì UI lặng lẽ hiện
 * tên key thay vì tiếng Việt — không crash, không log, rất khó phát hiện:
 *   1. Mọi feature có locale đều phải khai loader.
 *   2. Feature nào import CODE của feature khác thì phải khai vào bảng phụ thuộc.
 * Test đọc thẳng cây nguồn nên module mới thêm sẽ tự bị soi.
 */
import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative, resolve, dirname } from 'node:path';

const ROOT = resolve(__dirname, '..');
const FEATURES = join(ROOT, 'features');
const SRC = readFileSync(join(ROOT, 'lib/feature-i18n.ts'), 'utf8');

function block(marker: string): string {
  const start = SRC.indexOf(marker);
  if (start === -1) throw new Error(`không thấy ${marker} trong feature-i18n.ts`);
  return SRC.slice(start, SRC.indexOf('\n};', start));
}

const LOADERS = block('const FEATURE_I18N_LOADERS');
const DEPS_BLOCK = block('const FEATURE_I18N_DEPS');

function walk(dir: string, out: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p, out);
    else out.push(p);
  }
  return out;
}

const ALL_FILES = walk(FEATURES);

/** features/<nhóm>/<module>/... → <module> */
function moduleOf(file: string): string | null {
  const parts = relative(FEATURES, file).split('/');
  return parts.length >= 2 ? parts[1] : null;
}

const MODULES_WITH_LOCALE = [
  ...new Set(
    ALL_FILES.filter((f) => f.endsWith(`locales${'/'}vi.json`))
      .map(moduleOf)
      .filter((m): m is string => m != null)
  ),
];

describe('FEATURE_I18N_LOADERS', () => {
  it('có ít nhất một module (tự bảo vệ khỏi test rỗng)', () => {
    expect(MODULES_WITH_LOCALE.length).toBeGreaterThan(20);
  });

  it('mọi feature có locales/vi.json đều được khai loader', () => {
    const thieu = MODULES_WITH_LOCALE.filter((m) => !LOADERS.includes(`'${m}':`));
    expect(thieu).toEqual([]);
  });

  it('mọi key trong FEATURE_I18N_KEYS đều có loader', () => {
    const keys = [...SRC.matchAll(/^ {2}\| '([a-z0-9-]+)'$/gm)].map((m) => m[1]);
    expect(keys.length).toBeGreaterThan(20);
    expect(keys.filter((k) => !LOADERS.includes(`'${k}':`))).toEqual([]);
  });
});

describe('FEATURE_I18N_DEPS khớp đồ thị import thật', () => {
  /** Import GIÁ TRỊ giữa hai feature khác nhau (bỏ `import type`, thứ bị xoá khi biên dịch). */
  const edges = new Map<string, Set<string>>();

  for (const file of ALL_FILES) {
    if (!/\.tsx?$/.test(file) || file.includes('.test.')) continue;
    const from = moduleOf(file);
    if (!from) continue;
    for (const line of readFileSync(file, 'utf8').split('\n')) {
      if (/^\s*(import|export)\s+type\s/.test(line)) continue;
      const m = line.match(/\bfrom\s+['"]([^'"]+)['"]/);
      if (!m) continue;
      const spec = m[1];
      let target: string | null = null;
      if (spec.startsWith('@/features/')) {
        target = spec.slice('@/features/'.length).split('/')[1] ?? null;
      } else if (spec.startsWith('.')) {
        const abs = resolve(dirname(file), spec);
        if (abs.startsWith(FEATURES)) target = moduleOf(abs);
      }
      if (!target || target === from) continue;
      if (!MODULES_WITH_LOCALE.includes(target)) continue; // locale đích nằm ở core
      if (!edges.has(from)) edges.set(from, new Set());
      edges.get(from)!.add(target);
    }
  }

  it('phát hiện được import chéo (tự bảo vệ khỏi regex hỏng)', () => {
    expect(edges.size).toBeGreaterThan(10);
  });

  it('mọi phụ thuộc chéo đều đã khai — thiếu là locale sẽ nạp hụt', () => {
    const thieu: string[] = [];
    for (const [from, targets] of edges) {
      if (!MODULES_WITH_LOCALE.includes(from)) continue; // nhánh shared/, xử lý riêng
      const declared = DEPS_BLOCK.match(new RegExp(`'${from}':\\s*\\[([^\\]]*)\\]`));
      const list = declared ? declared[1] : '';
      for (const t of targets) {
        if (!list.includes(`'${t}'`)) thieu.push(`${from} -> ${t}`);
      }
    }
    expect(thieu).toEqual([]);
  });

  it('bảng phụ thuộc không khai thừa module không tồn tại', () => {
    const referenced = [...DEPS_BLOCK.matchAll(/'([a-z0-9-]+)'/g)].map((m) => m[1]);
    expect(referenced.filter((r) => !MODULES_WITH_LOCALE.includes(r))).toEqual([]);
  });
});
