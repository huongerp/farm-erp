import { describe, it, expect } from 'vitest';
import { planFarmHangHoaImport } from './import-hang-hoa';
import type { DanhMucRefLite, ExistingHangHoaLite } from './import-hang-hoa';

const DANH_MUC: DanhMucRefLite[] = [
  { id: '1', ma_danh_muc: 'PHAN', ten_danh_muc: 'Phân bón', id_cha: null },
  { id: '2', ma_danh_muc: 'PHAN_HC', ten_danh_muc: 'Phân hữu cơ', id_cha: '1' },
  { id: '3', ma_danh_muc: 'THUOC', ten_danh_muc: 'Thuốc', id_cha: null },
  { id: '4', ma_danh_muc: 'THUOC_SAU', ten_danh_muc: 'Thuốc sâu', id_cha: '3' },
];

const EXISTING: ExistingHangHoaLite[] = [
  { id: '10', ma_hang_hoa: 'HH-001', ten_hang_hoa: 'Ure Phú Mỹ' },
  { id: '11', ma_hang_hoa: 'HH-002', ten_hang_hoa: 'Kali' },
];

const row = (over: Record<string, unknown> = {}) => ({
  __row: 2,
  ma_hang_hoa: 'HH-100',
  ten_hang_hoa: 'Phân gà ủ',
  danh_muc: 'PHAN_HC',
  dvt: 'Bao',
  pham_cap: 'Loại 1',
  don_gia: '120.000',
  mo_ta: '',
  ...over,
});

const plan = (rows: Record<string, unknown>[], over: Partial<Parameters<typeof planFarmHangHoaImport>[1]> = {}) =>
  planFarmHangHoaImport(rows, { danhMuc: DANH_MUC, existing: EXISTING, mode: 'create', refColumn: 'ma_hang_hoa', ...over });

describe('planFarmHangHoaImport — dòng hợp lệ', () => {
  it('chuẩn hóa mã, parse đơn giá VN, suy ra danh mục cha', () => {
    const { toInsert, toUpdate, errors } = plan([row({ ma_hang_hoa: ' hh-100 ' })]);
    expect(errors).toEqual([]);
    expect(toUpdate).toEqual([]);
    expect(toInsert).toHaveLength(1);
    expect(toInsert[0].payload).toEqual({
      danh_muc_id: 2,
      danh_muc_cha_id: 1,
      ma_hang_hoa: 'HH-100',
      ten_hang_hoa: 'Phân gà ủ',
      dvt: 'Bao',
      pham_cap: 'Loại 1',
      don_gia: 120000,
      mo_ta: null,
    });
  });

  it('nhận danh mục theo tên cấp 2, không phân biệt hoa thường', () => {
    const { toInsert, errors } = plan([row({ danh_muc: '  thuốc SÂU ' })]);
    expect(errors).toEqual([]);
    expect(toInsert[0].payload.danh_muc_id).toBe(4);
    expect(toInsert[0].payload.danh_muc_cha_id).toBe(3);
  });

  it('giữ đúng số dòng Excel do ImportDialog gắn, không suy từ index mảng', () => {
    const { toInsert } = plan([row({ __row: 27 })]);
    expect(toInsert[0].row).toBe(27);
  });
});

describe('planFarmHangHoaImport — validate', () => {
  it('mã sai định dạng / thiếu trường bắt buộc', () => {
    const { toInsert, errors } = plan([
      row({ ma_hang_hoa: 'hh 100!', __row: 2 }),
      row({ ten_hang_hoa: '  ', __row: 3 }),
      row({ dvt: '', __row: 4 }),
    ]);
    expect(toInsert).toEqual([]);
    expect(errors.map((e) => e.row)).toEqual([2, 3, 4]);
  });

  it('danh mục không tồn tại → lỗi, không tự tạo', () => {
    const { toInsert, errors } = plan([row({ danh_muc: 'KHONG_CO' })]);
    expect(toInsert).toEqual([]);
    expect(errors).toHaveLength(1);
    expect(errors[0].msg).toContain('KHONG_CO');
  });

  it('danh mục cấp 1 không gắn được hàng hóa', () => {
    const { toInsert, errors } = plan([row({ danh_muc: 'PHAN' })]);
    expect(toInsert).toEqual([]);
    expect(errors).toHaveLength(1);
  });

  it('đơn giá rác báo lỗi thay vì âm thầm về 0', () => {
    const { toInsert, errors } = plan([row({ don_gia: '120.000đ' })]);
    expect(toInsert).toEqual([]);
    expect(errors[0].msg).toContain('120.000đ');
  });

  it('đơn giá trống → null', () => {
    const { toInsert, errors } = plan([row({ don_gia: '' })]);
    expect(errors).toEqual([]);
    expect(toInsert[0].payload.don_gia).toBeNull();
  });

  it('trùng mã ngay trong file → dòng sau báo lỗi, dòng đầu vẫn chạy', () => {
    const { toInsert, errors } = plan([row({ __row: 2 }), row({ __row: 5 })]);
    expect(toInsert).toHaveLength(1);
    expect(toInsert[0].row).toBe(2);
    expect(errors).toHaveLength(1);
    expect(errors[0].row).toBe(5);
  });

  it('dòng lỗi mang theo dữ liệu gốc để xuất file sửa lại, không kèm khóa nội bộ', () => {
    const { errors } = plan([row({ danh_muc: 'KHONG_CO' })]);
    expect(errors[0].values).toMatchObject({ ma_hang_hoa: 'HH-100', danh_muc: 'KHONG_CO' });
    expect(errors[0].values).not.toHaveProperty('__row');
  });
});

describe('planFarmHangHoaImport — chế độ create vs upsert (ref = mã)', () => {
  it('create: mã đã tồn tại → lỗi, không ghi đè', () => {
    const { toInsert, toUpdate, errors } = plan([row({ ma_hang_hoa: 'HH-001' })]);
    expect(toInsert).toEqual([]);
    expect(toUpdate).toEqual([]);
    expect(errors).toHaveLength(1);
  });

  it('upsert: mã đã tồn tại → cập nhật đúng id', () => {
    const { toInsert, toUpdate, errors } = plan([row({ ma_hang_hoa: 'HH-001' })], { mode: 'upsert' });
    expect(errors).toEqual([]);
    expect(toInsert).toEqual([]);
    expect(toUpdate).toHaveLength(1);
    expect(toUpdate[0].id).toBe('10');
    expect(toUpdate[0].payload.ten_hang_hoa).toBe('Phân gà ủ');
  });

  it('upsert: mã chưa có → vẫn là thêm mới', () => {
    const { toInsert, toUpdate } = plan([row()], { mode: 'upsert' });
    expect(toUpdate).toEqual([]);
    expect(toInsert).toHaveLength(1);
  });
});

describe('planFarmHangHoaImport — ref = tên hàng hóa', () => {
  const byTen = { refColumn: 'ten_hang_hoa' as const, mode: 'upsert' as const };

  it('khớp theo tên, bỏ qua hoa thường và khoảng trắng', () => {
    const { toUpdate, errors } = plan([row({ ma_hang_hoa: 'HH-001', ten_hang_hoa: '  ure   phú mỹ ' })], byTen);
    expect(errors).toEqual([]);
    expect(toUpdate).toHaveLength(1);
    expect(toUpdate[0].id).toBe('10');
  });

  it('tên trùng nhau trong DB → báo lỗi, không ghi bừa', () => {
    const existing: ExistingHangHoaLite[] = [
      { id: '10', ma_hang_hoa: 'HH-001', ten_hang_hoa: 'Ure' },
      { id: '11', ma_hang_hoa: 'HH-002', ten_hang_hoa: 'Ure' },
    ];
    const { toUpdate, errors } = plan([row({ ma_hang_hoa: 'HH-001', ten_hang_hoa: 'Ure' })], { ...byTen, existing });
    expect(toUpdate).toEqual([]);
    expect(errors).toHaveLength(1);
  });

  it('dòng mới mà mã đã thuộc hàng hóa khác → lỗi, không tạo mã trùng', () => {
    const { toInsert, errors } = plan([row({ ma_hang_hoa: 'HH-001', ten_hang_hoa: 'Tên hoàn toàn mới' })], byTen);
    expect(toInsert).toEqual([]);
    expect(errors[0].msg).toContain('HH-001');
  });

  it('ghi đè mà mã mới đang thuộc bản ghi khác → lỗi', () => {
    const { toUpdate, errors } = plan([row({ ma_hang_hoa: 'HH-002', ten_hang_hoa: 'Ure Phú Mỹ' })], byTen);
    expect(toUpdate).toEqual([]);
    expect(errors).toHaveLength(1);
  });
});
