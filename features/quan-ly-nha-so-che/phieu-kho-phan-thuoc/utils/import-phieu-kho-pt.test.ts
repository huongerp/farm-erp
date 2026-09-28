import { describe, it, expect, beforeAll } from 'vitest';
import i18n from '../../../../lib/i18n';
import viFeature from '../locales/vi.json';

// Locale feature nạp lazy — test tự nạp để assert được nội dung thông báo lỗi.
beforeAll(() => {
  i18n.addResourceBundle('vi', 'translation', viFeature, true, true);
});
import { parseLoaiPhieu, planPhieuKhoPTImport } from './import-phieu-kho-pt';
import type { ExistingSoPhieu, HangHoaRefLite, KhoRefLite } from './import-phieu-kho-pt';

const KHO: KhoRefLite[] = [
  { id: '1', ma_kho: 'K01', ten_kho: 'Kho tổng' },
  { id: '2', ma_kho: 'K02', ten_kho: 'Kho vườn' },
  { id: '3', ma_kho: 'K03', ten_kho: 'Kho vườn' },
];

const HANG: HangHoaRefLite[] = [
  { id: '10', ma_hang_hoa: 'HH-001', ten_hang_hoa: 'Ure Phú Mỹ', dvt: 'Bao', pham_cap: 'Loại 1', don_gia: 250000 },
  { id: '11', ma_hang_hoa: 'HH-002', ten_hang_hoa: 'Kali', dvt: 'Kg', pham_cap: null, don_gia: null },
];

let nextRow = 2;
const row = (over: Record<string, unknown> = {}) => ({
  __row: nextRow++,
  so_phieu: '',
  loai: 'Nhập',
  ngay: '15/09/2026',
  kho: 'K01',
  kho_den: '',
  mo_ta: '',
  ma_hang: 'HH-001',
  so_luong: '10',
  don_gia: '',
  pham_cap: '',
  so_lot: '',
  ghi_chu: '',
  ...over,
});

const plan = (rows: Record<string, unknown>[], existingSoPhieu: ExistingSoPhieu[] = []) =>
  planPhieuKhoPTImport(rows, { khoList: KHO, hangHoaList: HANG, existingSoPhieu });

describe('parseLoaiPhieu', () => {
  it('nhận có dấu / không dấu / kèm chữ "kho"', () => {
    expect(parseLoaiPhieu('Nhập')).toBe('nhập');
    expect(parseLoaiPhieu('XUAT KHO')).toBe('xuất');
    expect(parseLoaiPhieu('luân chuyển')).toBe('chuyển');
    expect(parseLoaiPhieu('trả hàng')).toBeNull();
  });
});

describe('planPhieuKhoPTImport', () => {
  it('không có số phiếu: gộp các dòng cùng loại + ngày + kho + mô tả thành một phiếu', () => {
    const { phieus, errors } = plan([row(), row({ ma_hang: 'HH-002' }), row({ ngay: '16/09/2026' })]);
    expect(errors).toEqual([]);
    expect(phieus).toHaveLength(2);
    expect(phieus[0].lines).toHaveLength(2);
    expect(phieus[0].so_phieu).toBeNull();
    expect(phieus[0].ngay).toBe('2026-09-15');
  });

  it('có số phiếu: gộp theo số phiếu, lệch thông tin phiếu thì báo lỗi và bỏ cả phiếu', () => {
    const r1 = row({ so_phieu: 'FNK-9001' });
    const r2 = row({ so_phieu: 'FNK-9001', kho: 'K02' });
    const { phieus, errors } = plan([r1, r2]);
    expect(phieus).toHaveLength(0);
    expect(errors.map((e) => e.row)).toEqual([r1.__row, r2.__row]);
    expect(errors[1].msg).toContain(`dòng ${r1.__row}`);
    expect(errors[0].msg).toContain('không được tạo');
  });

  it('một dòng lỗi thì cả phiếu bị loại, phiếu khác vẫn tạo', () => {
    const bad = row({ ma_hang: 'KHONG-CO' });
    const { phieus, errors } = plan([row(), bad, row({ loai: 'Xuất' })]);
    expect(phieus).toHaveLength(1);
    expect(phieus[0].loai).toBe('xuất');
    expect(errors).toHaveLength(2);
    expect(errors.find((e) => e.row === bad.__row)?.msg).toContain('Không tìm thấy hàng hoá');
    expect(errors[0].values).not.toHaveProperty('__row');
  });

  it('phiếu chuyển: bắt buộc kho đến và phải khác kho', () => {
    expect(plan([row({ loai: 'Chuyển' })]).errors[0].msg).toContain('Kho đến');
    expect(plan([row({ loai: 'Chuyển', kho_den: 'K01' })]).errors[0].msg).toContain('phải khác');
    const ok = plan([row({ loai: 'Chuyển', kho_den: 'K02' })]);
    expect(ok.errors).toEqual([]);
    expect(ok.phieus[0].kho_den_id).toBe(2);
  });

  it('loại khác chuyển: kho đến có điền cũng bỏ qua', () => {
    const { phieus } = plan([row({ kho_den: 'K02' })]);
    expect(phieus[0].kho_den_id).toBeNull();
  });

  it('kho theo tên: trùng tên thì không đoán', () => {
    expect(plan([row({ kho: 'kho tổng' })]).phieus[0].kho_id).toBe(1);
    expect(plan([row({ kho: 'Kho vườn' })]).errors[0].msg).toContain('nhiều kho cùng tên');
  });

  it('số phiếu đã tồn tại cùng loại → lỗi; khác loại thì hợp lệ', () => {
    const existing = [{ so_phieu: 'FNK-0001', loai: 'nhập' }];
    expect(plan([row({ so_phieu: 'FNK-0001' })], existing).errors[0].msg).toContain('đã tồn tại');
    expect(plan([row({ so_phieu: 'FNK-0001', loai: 'Xuất' })], existing).errors).toEqual([]);
  });

  it('số lượng phải > 0 và đúng định dạng', () => {
    expect(plan([row({ so_luong: '0' })]).errors).toHaveLength(1);
    expect(plan([row({ so_luong: 'abc' })]).errors).toHaveLength(1);
    expect(plan([row({ so_luong: '' })]).errors).toHaveLength(1);
    expect(plan([row({ so_luong: '1,5' })]).phieus[0].lines[0].so_luong).toBe(1.5);
  });

  it('ngày không tồn tại bị chặn', () => {
    expect(plan([row({ ngay: '31/02/2026' })]).errors[0].msg).toContain('Ngày không hợp lệ');
  });

  it('đơn giá và phẩm cấp trống → lấy theo danh mục; có điền thì dùng giá trị file', () => {
    const [a, b] = plan([row(), row({ ma_hang: 'HH-002', don_gia: '12.500', pham_cap: 'Loại 2' })]).phieus[0].lines;
    expect(a).toMatchObject({ don_gia: 250000, pham_cap: 'Loại 1', don_vi_tinh: 'Bao', ten_hang_hoa: 'Ure Phú Mỹ' });
    expect(b).toMatchObject({ don_gia: 12500, pham_cap: 'Loại 2' });
  });
});
