import { describe, it, expect } from 'vitest';
import { IMPORT_ROW_KEY } from '../../../../lib/import-types';
import { planKhoImport } from './import-kho';

const chiNhanh = [
  { id: '1', ma: 'FA', ten: 'Farm A' },
  { id: '2', ma: 'FB', ten: 'Farm B' },
];
const row = (r: number, over: Record<string, unknown> = {}) => ({
  [IMPORT_ROW_KEY]: r,
  ma_kho: 'k01',
  ten_kho: 'Kho tổng',
  chi_nhanh: 'FA',
  ...over,
});

describe('planKhoImport', () => {
  it('chi nhánh theo mã hoặc tên (không còn phải ghi id DB); mặc định đang hoạt động, thứ tự 1', () => {
    const plan = planKhoImport([row(2), row(3, { ma_kho: 'K02', chi_nhanh: 'farm b', trang_thai: 'ngừng', thu_tu: '3' })], chiNhanh);
    expect(plan.errors).toEqual([]);
    expect(plan.toCreate[0].data).toMatchObject({ ma_kho: 'K01', id_chi_nhanh: '1', trang_thai: 'Đang hoạt động', thu_tu: 1 });
    expect(plan.toCreate[1].data).toMatchObject({ id_chi_nhanh: '2', trang_thai: 'Ngừng hoạt động', thu_tu: 3 });
  });

  it('chi nhánh không có / trạng thái lạ / mã sai định dạng / mã trùng trong file → lỗi đúng dòng', () => {
    const plan = planKhoImport(
      [row(2, { chi_nhanh: 'FZ' }), row(3, { ma_kho: 'K 03', trang_thai: 'tạm dừng' }), row(4, { ma_kho: 'K04' }), row(5, { ma_kho: 'K04' })],
      chiNhanh
    );
    expect(plan.errors.map((e) => e.row)).toEqual([2, 3, 5]);
    expect(plan.errors[1].msg.split('; ')).toHaveLength(2);
    expect(plan.errors[0].values).not.toHaveProperty(IMPORT_ROW_KEY);
  });

  it('thiếu chi nhánh → báo đúng lỗi bắt buộc của form', () => {
    const plan = planKhoImport([row(2, { chi_nhanh: '' })], chiNhanh);
    expect(plan.errors).toHaveLength(1);
  });
});
