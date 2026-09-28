import { describe, it, expect } from 'vitest';
import { IMPORT_ROW_KEY } from '../../../../lib/import-types';
import { normalizeCccd, normalizePhone, planNhanVienImport, type NhanVienImportInput } from './import-nhan-vien';

const input: NhanVienImportInput = {
  chiNhanh: [
    { id: '1', ma: 'FA', ten: 'Farm A' },
    { id: '2', ma: 'FB', ten: 'Farm B' },
  ],
  phongBan: [
    { id: '10', ten: 'Kỹ thuật' },
    { id: '11', ten: 'Kế toán' },
  ],
  chucVu: [
    { id: '20', ten: 'Nhân viên' },
    { id: '21', ten: 'Tổ trưởng' },
    { id: '22', ten: 'Tổ trưởng' },
  ],
  capBac: [{ id: '30', ten: 'Nhân viên', cap_bac: 5 }],
  existingEmails: ['da.co@farm.vn'],
};

let n = 2;
const row = (over: Record<string, unknown> = {}) => ({
  [IMPORT_ROW_KEY]: n++,
  ho_ten: 'Nguyễn Văn An',
  email: 'An@Farm.vn',
  so_dien_thoai: '0912345678',
  gioi_tinh: 'nam',
  ngay_vao_lam: '01/09/2026',
  chi_nhanh: 'FA',
  phong_ban: 'kỹ thuật',
  chuc_vu: 'Nhân viên',
  ...over,
});

describe('normalizePhone / normalizeCccd', () => {
  it('thêm lại số 0 đầu bị Excel làm mất', () => {
    expect(normalizePhone(912345678)).toBe('0912345678');
    expect(normalizePhone('091 234.5678')).toBe('0912345678');
    expect(normalizeCccd(12345678901)).toBe('012345678901');
  });
});

describe('planNhanVienImport', () => {
  it('dòng hợp lệ → form values đúng id tra cứu, email thường, trạng thái mặc định', () => {
    const plan = planNhanVienImport([row({ chi_nhanh: 'FA, Farm B', cap_bac: '5' })], input);
    expect(plan.errors).toEqual([]);
    expect(plan.toCreate[0].data).toMatchObject({
      email: 'an@farm.vn',
      gioi_tinh: 'Nam',
      ngay_vao_lam: '2026-09-01',
      id_chi_nhanh: ['1', '2'],
      id_phong_ban: '10',
      id_chuc_vu: '20',
      id_cap_bac: '30',
      trang_thai: 'Đang làm việc',
    });
  });

  it('email đã có hoặc trùng trong file → lỗi', () => {
    const plan = planNhanVienImport([row({ email: 'da.co@farm.vn' }), row({ email: 'x@farm.vn' }), row({ email: 'X@farm.vn' })], input);
    expect(plan.toCreate).toHaveLength(1);
    expect(plan.errors).toHaveLength(2);
  });

  it('không tìm thấy / tên nhập nhằng → báo đúng một lỗi, không kèm lỗi "bắt buộc" của form', () => {
    const plan = planNhanVienImport([row({ chi_nhanh: 'FZ', chuc_vu: 'Tổ trưởng' })], input);
    const msgs = plan.errors[0].msg.split('; ');
    expect(msgs).toHaveLength(2);
  });

  it('chạy luật của form: SĐT sai, HĐ có thời hạn thiếu ngày hết hạn', () => {
    expect(planNhanVienImport([row({ so_dien_thoai: '12345' })], input).errors).toHaveLength(1);
    expect(planNhanVienImport([row({ loai_hop_dong: 'có thời hạn' })], input).errors).toHaveLength(1);
    expect(
      planNhanVienImport([row({ loai_hop_dong: 'có thời hạn', ngay_het_han_hd: '31/12/2027' })], input).toCreate[0].data
        .loai_hop_dong
    ).toBe('Có thời hạn');
  });

  it('giới tính / trạng thái / ngày sai → lỗi dòng, giữ dữ liệu gốc không có __row', () => {
    const plan = planNhanVienImport([row({ gioi_tinh: 'x', trang_thai: 'đã về hưu', ngay_vao_lam: '31/02/2026' })], input);
    expect(plan.errors[0].msg.split('; ').length).toBe(3);
    expect(plan.errors[0].values).not.toHaveProperty(IMPORT_ROW_KEY);
  });
});
