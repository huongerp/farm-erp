import { describe, expect, it } from 'vitest';
import { danhGiaQuetCayHang, type DauVaoQuet } from './quet-cay-hang';

const vao = (p: Partial<DauVaoQuet> = {}): DauVaoQuet => ({
  laTemQc: true,
  phieuQc: { trang_thai: 'da_nop', ket_luan: 'dat' },
  daCoTrenXeNay: false,
  xeKhac: [],
  ...p,
});

describe('danhGiaQuetCayHang', () => {
  it('phiếu đã nộp, đạt, chưa lên xe nào → ghi', () => {
    expect(danhGiaQuetCayHang(vao())).toEqual({ ghi: true, muc: 'ok', canhBao: [] });
  });

  it('mã không phải tem QC / không tìm thấy → lỗi', () => {
    expect(danhGiaQuetCayHang(vao({ laTemQc: false }))).toMatchObject({ ghi: false, lyDo: 'khong_phai_tem' });
    expect(danhGiaQuetCayHang(vao({ phieuQc: null }))).toMatchObject({ ghi: false, lyDo: 'khong_tim_thay' });
  });

  it('phiếu chưa nộp (đang kiểm / chờ nộp / huỷ) → không ghi', () => {
    for (const tt of ['dang_kiem', 'hoan_thanh', 'huy'] as const) {
      expect(danhGiaQuetCayHang(vao({ phieuQc: { trang_thai: tt, ket_luan: null } }))).toMatchObject({
        ghi: false,
        lyDo: 'chua_nop',
      });
    }
  });

  it('đã có trên chính xe này → không ghi thêm', () => {
    expect(danhGiaQuetCayHang(vao({ daCoTrenXeNay: true }))).toEqual({ ghi: false, muc: 'da_co' });
  });

  it('không đạt và / hoặc đã trên xe khác → vẫn ghi, kèm cảnh báo', () => {
    expect(danhGiaQuetCayHang(vao({ phieuQc: { trang_thai: 'da_nop', ket_luan: 'khong_dat' }, xeKhac: ['81C-1'] }))).toEqual({
      ghi: true,
      muc: 'canh_bao',
      canhBao: ['khong_dat', 'xe_khac'],
    });
  });
});
