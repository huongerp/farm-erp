import { describe, it, expect } from 'vitest';
import { planFarmDanhMucImport } from './import-danh-muc';
import type { ExistingDanhMucLite } from './import-danh-muc';

const EXISTING: ExistingDanhMucLite[] = [
  { id: '1', ma_danh_muc: 'PHAN', ten_danh_muc: 'Phân bón', id_cha: null },
  { id: '2', ma_danh_muc: 'PHAN_HC', ten_danh_muc: 'Phân hữu cơ', id_cha: '1' },
];

const row = (over: Record<string, unknown> = {}) => ({
  __row: 2,
  ma_danh_muc: 'THUOC',
  ten_danh_muc: 'Thuốc BVTV',
  danh_muc_cha: '',
  thu_tu: '3',
  mo_ta: '',
  ...over,
});

const plan = (rows: Record<string, unknown>[], over: Partial<Parameters<typeof planFarmDanhMucImport>[1]> = {}) =>
  planFarmDanhMucImport(rows, { existing: EXISTING, mode: 'create', ...over });

describe('planFarmDanhMucImport — cây 2 cấp', () => {
  it('dòng không có cha là cấp 1', () => {
    const { rows, errors } = plan([row()]);
    expect(errors).toEqual([]);
    expect(rows).toHaveLength(1);
    expect(rows[0].parentCode).toBeNull();
    expect(rows[0].parentId).toBeNull();
    expect(rows[0].payload).toEqual({ ma_danh_muc: 'THUOC', ten_danh_muc: 'Thuốc BVTV', thu_tu: 3, mo_ta: null });
  });

  it('cha đã có trong DB → lấy được id ngay', () => {
    const { rows, errors } = plan([row({ ma_danh_muc: 'PHAN_VS', danh_muc_cha: 'PHAN' })]);
    expect(errors).toEqual([]);
    expect(rows[0].parentId).toBe(1);
    expect(rows[0].parentCode).toBe('PHAN');
  });

  it('cha là dòng cấp 1 nằm ngay trong cùng file → chưa có id, chỉ giữ mã', () => {
    const { rows, errors } = plan([
      row({ ma_danh_muc: 'THUOC', danh_muc_cha: '', __row: 2 }),
      row({ ma_danh_muc: 'THUOC_SAU', ten_danh_muc: 'Thuốc sâu', danh_muc_cha: 'THUOC', __row: 3 }),
    ]);
    expect(errors).toEqual([]);
    expect(rows[1].parentCode).toBe('THUOC');
    expect(rows[1].parentId).toBeNull();
  });

  it('cha ghi bằng tên thay vì mã vẫn nhận, kể cả cha nằm trong cùng file', () => {
    const fromDb = plan([row({ ma_danh_muc: 'PHAN_VS', danh_muc_cha: '  phân BÓN ' })]);
    expect(fromDb.errors).toEqual([]);
    expect(fromDb.rows[0].parentId).toBe(1);

    const fromFile = plan([
      row({ ma_danh_muc: 'THUOC', ten_danh_muc: 'Thuốc BVTV', __row: 2 }),
      row({ ma_danh_muc: 'THUOC_SAU', ten_danh_muc: 'Thuốc sâu', danh_muc_cha: 'Thuốc BVTV', __row: 3 }),
    ]);
    expect(fromFile.errors).toEqual([]);
    expect(fromFile.rows[1].parentCode).toBe('THUOC');
  });

  it('cha không tồn tại → lỗi dòng', () => {
    const { rows, errors } = plan([row({ danh_muc_cha: 'KHONG_CO' })]);
    expect(rows).toEqual([]);
    expect(errors[0].msg).toContain('KHONG_CO');
  });

  it('cha là danh mục cấp 2 → lỗi vì cây chỉ 2 cấp', () => {
    const { rows, errors } = plan([row({ danh_muc_cha: 'PHAN_HC' })]);
    expect(rows).toEqual([]);
    expect(errors).toHaveLength(1);
  });

  it('cha trỏ vào chính nó → lỗi', () => {
    const { rows, errors } = plan([row({ ma_danh_muc: 'THUOC', danh_muc_cha: 'THUOC' })]);
    expect(rows).toEqual([]);
    expect(errors).toHaveLength(1);
  });
});

describe('planFarmDanhMucImport — validate & chế độ', () => {
  it('thiếu mã / tên, mã sai định dạng, thứ tự không hợp lệ', () => {
    const { rows, errors } = plan([
      row({ ma_danh_muc: '', __row: 2 }),
      row({ ma_danh_muc: 'A', ten_danh_muc: '', __row: 3 }),
      row({ ma_danh_muc: 'co dau', __row: 4 }),
      row({ ma_danh_muc: 'B', thu_tu: '0', __row: 5 }),
      row({ ma_danh_muc: 'C', thu_tu: 'x', __row: 6 }),
    ]);
    expect(rows).toEqual([]);
    expect(errors.map((e) => e.row)).toEqual([2, 3, 4, 5, 6]);
  });

  it('thứ tự trống → null để service tự đánh số tiếp', () => {
    const { rows, errors } = plan([row({ thu_tu: '' })]);
    expect(errors).toEqual([]);
    expect(rows[0].payload.thu_tu).toBeNull();
  });

  it('trùng mã trong file → dòng sau báo lỗi', () => {
    const { rows, errors } = plan([row({ __row: 2 }), row({ __row: 7 })]);
    expect(rows).toHaveLength(1);
    expect(errors[0].row).toBe(7);
  });

  it('create: mã đã tồn tại → lỗi; upsert: cập nhật đúng id', () => {
    const created = plan([row({ ma_danh_muc: 'PHAN' })]);
    expect(created.rows).toEqual([]);
    expect(created.errors).toHaveLength(1);

    const upserted = plan([row({ ma_danh_muc: 'PHAN' })], { mode: 'upsert' });
    expect(upserted.errors).toEqual([]);
    expect(upserted.rows[0].existingId).toBe('1');
  });

  it('dòng lỗi kèm dữ liệu gốc, không kèm khóa nội bộ', () => {
    const { errors } = plan([row({ danh_muc_cha: 'KHONG_CO' })]);
    expect(errors[0].values).toMatchObject({ ma_danh_muc: 'THUOC', danh_muc_cha: 'KHONG_CO' });
    expect(errors[0].values).not.toHaveProperty('__row');
  });
});
