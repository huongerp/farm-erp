import { describe, it, expect } from 'vitest';
import { thuChiQuySchema } from './schema';

const base = {
  ngay: '2026-07-25',
  id_chi_nhanh: '1',
  loai: 'chi' as const,
  so_tien: 280000,
  id_hang_muc: '3',
  dien_giai: '1 mũi khoan sôi 60',
};

describe('thuChiQuySchema', () => {
  it('chấp nhận phiếu hợp lệ không liên kết chứng từ', () => {
    const res = thuChiQuySchema.safeParse(base);
    expect(res.success).toBe(true);
  });

  it('coerce số tiền dạng chuỗi Việt Nam', () => {
    const res = thuChiQuySchema.safeParse({ ...base, so_tien: '1.500.000' });
    expect(res.success).toBe(true);
    if (res.success) expect(res.data.so_tien).toBe(1500000);
  });

  it('chặn số tiền 0 hoặc rỗng', () => {
    expect(thuChiQuySchema.safeParse({ ...base, so_tien: 0 }).success).toBe(false);
    expect(thuChiQuySchema.safeParse({ ...base, so_tien: '' }).success).toBe(false);
  });

  it('bắt buộc ngày, chi nhánh, hạng mục, diễn giải', () => {
    expect(thuChiQuySchema.safeParse({ ...base, ngay: '' }).success).toBe(false);
    expect(thuChiQuySchema.safeParse({ ...base, id_chi_nhanh: '' }).success).toBe(false);
    expect(thuChiQuySchema.safeParse({ ...base, id_hang_muc: '' }).success).toBe(false);
    expect(thuChiQuySchema.safeParse({ ...base, dien_giai: '' }).success).toBe(false);
  });

  it('số lượng / đơn giá để trống → null, nhập chuỗi VN → number', () => {
    const res = thuChiQuySchema.safeParse({ ...base, so_luong: '', don_gia: '50.000' });
    expect(res.success).toBe(true);
    if (res.success) {
      expect(res.data.so_luong).toBeNull();
      expect(res.data.don_gia).toBe(50000);
    }
  });

  it('đã chọn module thì bắt buộc chọn phiếu', () => {
    // chọn module, bỏ trống phiếu → không lưu được
    expect(
      thuChiQuySchema.safeParse({ ...base, loai_chung_tu: 'chi_phi_tai_san', id_chung_tu: '' }).success
    ).toBe(false);
    expect(
      thuChiQuySchema.safeParse({ ...base, loai_chung_tu: 'chi_phi_tai_san', id_chung_tu: undefined }).success
    ).toBe(false);
    // không chọn module → phiếu quỹ độc lập, vẫn hợp lệ
    expect(thuChiQuySchema.safeParse({ ...base, loai_chung_tu: null, id_chung_tu: null }).success).toBe(true);
  });

  it('liên kết chứng từ phải đi theo cặp', () => {
    expect(
      thuChiQuySchema.safeParse({ ...base, loai_chung_tu: 'don_dat_hang', id_chung_tu: '12' }).success
    ).toBe(true);
    expect(
      thuChiQuySchema.safeParse({ ...base, loai_chung_tu: 'don_dat_hang', id_chung_tu: null }).success
    ).toBe(false);
    expect(thuChiQuySchema.safeParse({ ...base, loai_chung_tu: null, id_chung_tu: '12' }).success).toBe(false);
  });
});
