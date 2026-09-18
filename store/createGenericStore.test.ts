import { describe, expect, it } from 'vitest';

import {
  clampColumnWidth,
  type ColumnConfig,
  mergeColumns,
  resolveColumnWidth,
} from './createGenericStore';

const col = (over: Partial<ColumnConfig> = {}): ColumnConfig => ({
  id: 'ghi_chu',
  label: 'Ghi chú',
  visible: true,
  order: 0,
  ...over,
});

describe('clampColumnWidth', () => {
  it('kẹp theo preset của cột ghi chú (220–520)', () => {
    expect(clampColumnWidth(col(), 50)).toBe(220);
    expect(clampColumnWidth(col(), 9999)).toBe(520);
    expect(clampColumnWidth(col(), 300)).toBe(300);
  });

  it('cột không khớp preset thì dùng minWidth/maxWidth khai trong code', () => {
    const c = col({ id: 'cot_la', minWidth: 100, maxWidth: 200 });
    expect(clampColumnWidth(c, 40)).toBe(100);
    expect(clampColumnWidth(c, 500)).toBe(200);
  });
});

describe('resolveColumnWidth', () => {
  it('ưu tiên bề rộng người dùng đã kéo', () => {
    expect(resolveColumnWidth(col({ width: 333 }))).toBe(333);
  });

  it('chưa kéo thì lấy minWidth hiệu dụng của preset', () => {
    expect(resolveColumnWidth(col())).toBe(220);
  });
});

describe('mergeColumns', () => {
  const defaults: ColumnConfig[] = [
    col({ id: 'ma_hang_hoa', label: 'Mã hàng', order: 0 }),
    col({ id: 'ghi_chu', label: 'Ghi chú', order: 1 }),
  ];

  it('không có bản lưu thì trả nguyên cột mặc định', () => {
    expect(mergeColumns(defaults)).toEqual(defaults);
    expect(mergeColumns(defaults, [])).toEqual(defaults);
  });

  it('lấy visible/order/width từ bản lưu nhưng GIỮ label của code', () => {
    const merged = mergeColumns(defaults, [
      { id: 'ghi_chu', visible: false, order: 0, width: 300 },
    ]);
    const ghiChu = merged.find((c) => c.id === 'ghi_chu')!;
    expect(ghiChu.visible).toBe(false);
    expect(ghiChu.order).toBe(0);
    expect(ghiChu.width).toBe(300);
    // nhãn phải theo code, không theo bản lưu
    expect(ghiChu.label).toBe('Ghi chú');
  });

  it('kẹp lại bề rộng đã lưu khi bounds trong code đổi', () => {
    const merged = mergeColumns(defaults, [
      { id: 'ghi_chu', visible: true, order: 1, width: 5000 },
    ]);
    expect(merged.find((c) => c.id === 'ghi_chu')!.width).toBe(520);
  });

  it('bỏ qua cột lạ trong bản lưu và giữ cột mới thêm trong code', () => {
    const merged = mergeColumns(defaults, [
      { id: 'cot_da_xoa', visible: true, order: 0, width: 200 },
    ]);
    expect(merged.map((c) => c.id)).toEqual(['ma_hang_hoa', 'ghi_chu']);
  });
});
