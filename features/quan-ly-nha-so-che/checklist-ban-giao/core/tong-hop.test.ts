import { describe, expect, it } from 'vitest';
import { demKetQua, laDongLech, loiTruocKhiChuyen, nhomTheoMuc, soDongChuaKiemTra } from './tong-hop';
import type { KetQuaCl } from './types';

const dong = (kq_thuc_hien: KetQuaCl | null, kq_kiem_tra: KetQuaCl | null = null, tinh_trang_khac_phuc: string | null = null) => ({
  kq_thuc_hien,
  kq_kiem_tra,
  tinh_trang_khac_phuc,
});

describe('demKetQua / điều kiện Chuyển, Nhận', () => {
  it('đếm Đạt, K.Đạt, chưa tích theo từng cột', () => {
    const ds = [dong('dat', 'dat'), dong('khong_dat', null, 'x'), dong(null)];
    expect(demKetQua(ds, 'kq_thuc_hien')).toEqual({ tong: 3, dat: 1, khongDat: 1, chuaTich: 1 });
    expect(soDongChuaKiemTra(ds)).toBe(2);
  });

  it('chặn Chuyển khi còn dòng chưa tích, K.Đạt chưa ghi khắc phục, thiếu kết luận', () => {
    const ds = [dong(null), dong('khong_dat', null, '  ')];
    expect(loiTruocKhiChuyen(ds, { co_ket_luan_van_hanh: true, ket_luan: null })).toEqual([
      { loai: 'thieu_tich', so: 1 },
      { loai: 'thieu_khac_phuc', so: 1 },
      { loai: 'thieu_ket_luan' },
    ]);
    expect(loiTruocKhiChuyen([dong('dat'), dong('khong_dat', null, 'Đã thay')], { co_ket_luan_van_hanh: false, ket_luan: null })).toEqual([]);
  });

  it('dòng lệch = khâu sau đánh khác khâu làm', () => {
    expect(laDongLech(dong('dat', 'khong_dat'))).toBe(true);
    expect(laDongLech(dong('dat', 'dat'))).toBe(false);
    expect(laDongLech(dong('dat', null))).toBe(false);
  });
});

describe('nhomTheoMuc', () => {
  it('giữ thứ tự mục rồi stt', () => {
    const ds = [
      { ten_muc: 'II', thu_tu_muc: 2, stt: 3 },
      { ten_muc: 'I', thu_tu_muc: 1, stt: 2 },
      { ten_muc: 'I', thu_tu_muc: 1, stt: 1 },
    ];
    const kq = nhomTheoMuc(ds);
    expect(kq.map((n) => n.tenMuc)).toEqual(['I', 'II']);
    expect(kq[0].dong.map((d) => d.stt)).toEqual([1, 2]);
  });
});
