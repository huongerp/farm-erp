import { describe, it, expect } from 'vitest';
import { IMPORT_ROW_KEY } from '../../../../lib/import-types';
import { planTaiSanImport } from './import-tai-san';

const refs = {
  nhom: [
    { id: '1', ma: 'CCDC', ten: 'Công cụ dụng cụ' },
    { id: '2', ma: 'TBMM', ten: 'Thiết bị máy móc' },
  ],
  noiLuu: [
    { id: '10', ma_noi_luu: 'NSC6', ten_noi_luu: 'NSC FP6' },
    { id: '11', ma_noi_luu: 'K1', ten_noi_luu: 'Kho' },
    { id: '12', ma_noi_luu: 'K2', ten_noi_luu: 'Kho' },
  ],
  trangThai: [{ id: '20', ma: 'DSD', ten: 'Đang sử dụng' }],
};
const row = (r: number, over: Record<string, unknown> = {}) => ({
  [IMPORT_ROW_KEY]: r,
  ma_tai_san: 'TS01-CAN01',
  ten_tai_san: 'Cân trụ 01',
  nhom: 'CCDC',
  noi_luu: 'nsc fp6',
  trang_thai: 'đang sử dụng',
  ngay_nhap: '15/03/2026',
  ...over,
});

describe('planTaiSanImport', () => {
  it('tra nhóm/nơi lưu/trạng thái theo mã hoặc tên; ngày dd/mm/yyyy; nguyên giá kiểu VN', () => {
    const plan = planTaiSanImport([row(2, { nguyen_gia: '1.500.000', ngay_bat_dau_trich_khau_hao: 46100 })], refs);
    expect(plan.errors).toEqual([]);
    expect(plan.toCreate[0].data).toMatchObject({
      ma_tai_san: 'TS01-CAN01',
      id_nhom: '1',
      id_noi_luu: '10',
      id_trang_thai: '20',
      ngay_nhap: '2026-03-15',
      nguyen_gia: 1500000,
      ngay_bat_dau_trich_khau_hao: '2026-03-19',
    });
  });

  it('danh mục không có / trùng tên / ngày sai / giá sai / mã trùng trong file → lỗi đúng dòng', () => {
    const plan = planTaiSanImport(
      [
        row(2, { nhom: 'XYZ' }),
        row(3, { ma_tai_san: 'TS02', noi_luu: 'Kho' }),
        row(4, { ma_tai_san: 'TS03', ngay_nhap: '31/02/2026', nguyen_gia: 'abc' }),
        row(5, { ma_tai_san: 'ts03' }),
      ],
      refs
    );
    expect(plan.errors.map((e) => e.row)).toEqual([2, 3, 4, 5]);
    expect(plan.errors[2].msg.split('; ')).toHaveLength(2);
    expect(plan.errors[0].values).not.toHaveProperty(IMPORT_ROW_KEY);
  });

  it('thiếu trường bắt buộc → báo lỗi của form, không tạo', () => {
    const plan = planTaiSanImport([row(2, { nhom: '', ngay_nhap: '' })], refs);
    expect(plan.toCreate).toEqual([]);
    expect(plan.errors[0].msg.split('; ')).toHaveLength(2);
  });
});
