import { describe, expect, it } from 'vitest';
import { chiaChipLoc, itemKey, type FilterChipItem } from './filter-chip-split';

const g = (key: string): FilterChipItem => ({
  kind: 'group',
  group: { key, label: key, icon: () => null, options: [], value: [], onChange: () => {} },
});
const c = (key: string): FilterChipItem => ({ kind: 'custom', key, node: null });
const keys = (r: ReturnType<typeof chiaChipLoc>) => ({
  hien: r.hien.map(itemKey),
  vaoFilter: r.vaoFilter.map((x) => x.key),
});

describe('chiaChipLoc', () => {
  it('đủ chỗ → hiện hết, không có nút Filter', () => {
    expect(keys(chiaChipLoc([g('a'), g('b'), g('c'), g('d'), g('e')], 5))).toEqual({
      hien: ['a', 'b', 'c', 'd', 'e'],
      vaoFilter: [],
    });
  });

  it('quá giới hạn → chip dư (theo thứ tự) vào Filter', () => {
    expect(keys(chiaChipLoc([g('a'), g('b'), g('c'), g('d'), g('e'), g('f')], 5))).toEqual({
      hien: ['a', 'b', 'c', 'd', 'e'],
      vaoFilter: ['f'],
    });
    expect(keys(chiaChipLoc([g('a'), g('b'), g('c'), g('d'), g('e'), g('f')], 3)).vaoFilter).toEqual(['d', 'e', 'f']);
  });

  it('control custom luôn hiện, giữ vị trí và chiếm chỗ', () => {
    const r = keys(chiaChipLoc([g('tt'), c('ngay'), g('kho'), g('nguoi'), g('ncc')], 3));
    expect(r.hien).toEqual(['tt', 'ngay', 'kho']);
    expect(r.vaoFilter).toEqual(['nguoi', 'ncc']);
  });

  it('custom nhiều hơn giới hạn → vẫn hiện hết custom, mọi chip vào Filter', () => {
    const r = keys(chiaChipLoc([c('tu'), g('a'), c('den'), c('x'), c('y')], 3));
    expect(r.hien).toEqual(['tu', 'den', 'x', 'y']);
    expect(r.vaoFilter).toEqual(['a']);
  });

  it('luonVaoFilter: key ít dùng nằm trong Filter dù còn chỗ', () => {
    const r = keys(chiaChipLoc([g('a'), g('duyet'), g('b')], 5, ['duyet']));
    expect(r.hien).toEqual(['a', 'b']);
    expect(r.vaoFilter).toEqual(['duyet']);
  });
});
