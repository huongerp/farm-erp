import { describe, expect, it } from 'vitest';
import { demKetQua, kyHieuKetQua, laDongLech, laLoi, loiTruocKhiChuyen, nhomTheoMuc, soDongChuaKiemTra } from './tong-hop';
import type { KetQuaCl } from './types';

const dong = (kq_thuc_hien: KetQuaCl | null, kq_kiem_tra: KetQuaCl | null = null, tinh_trang_khac_phuc: string | null = null) => ({
  kq_thuc_hien,
  kq_kiem_tra,
  tinh_trang_khac_phuc,
});

describe('demKetQua / điều kiện Chuyển, Nhận', () => {
  it('đếm Đạt, K.Đạt, chưa tích theo từng cột', () => {
    const ds = [dong('dat', 'dat'), dong('khong_dat', null, 'x'), dong(null)];
    expect(demKetQua(ds, 'kq_thuc_hien')).toEqual({ tong: 3, dat: 1, khongDat: 1, chuaTich: 1, tungKhongDat: 0, daKhacPhuc: 1 });
    expect(soDongChuaKiemTra(ds)).toBe(2);
  });

  it('chặn Chuyển khi còn dòng chưa tích, K.Đạt chưa ghi khắc phục, thiếu kết luận', () => {
    const ds = [dong(null), dong('khong_dat', null, '  ')];
    expect(loiTruocKhiChuyen(ds, { co_ket_luan_van_hanh: true, ket_luan: null })).toEqual([
      { loai: 'thieu_tich', so: 1 },
      { loai: 'thieu_khac_phuc', so: 1, stt: [] },
      { loai: 'thieu_ket_luan' },
    ]);
    expect(loiTruocKhiChuyen([dong('dat'), dong('khong_dat', null, 'Đã thay')], { co_ket_luan_van_hanh: false, ket_luan: null })).toEqual([]);
  });

  it('liệt kê STT hạng mục Không đạt thiếu khắc phục', () => {
    const ds = [
      { ...dong('khong_dat'), stt: 3 },
      { ...dong('khong_dat', null, 'Đã thay'), stt: 5 },
      { ...dong('khong_dat', null, ' '), stt: 7 },
    ];
    expect(loiTruocKhiChuyen(ds, { co_ket_luan_van_hanh: false, ket_luan: null })).toEqual([
      { loai: 'thieu_khac_phuc', so: 2, stt: [3, 7] },
    ]);
  });

  it('lỗi đã sửa rồi đổi Đạt vẫn tính là lỗi (cờ từng Không đạt)', () => {
    const daSua = { ...dong('dat', 'dat', 'Đã thay gioăng'), qlx_tung_khong_dat: true, gs_tung_khong_dat: false };
    const ds = [daSua, dong('khong_dat', 'khong_dat', 'Chờ linh kiện'), dong('dat', 'dat')];
    expect(demKetQua(ds, 'kq_thuc_hien')).toEqual({ tong: 3, dat: 2, khongDat: 1, chuaTich: 0, tungKhongDat: 1, daKhacPhuc: 2 });
    expect(laLoi(daSua, 'kq_thuc_hien')).toBe(true);
    expect(laLoi(daSua, 'kq_kiem_tra')).toBe(false);
    expect(kyHieuKetQua(daSua, 'kq_thuc_hien')).toBe('✗→✓');
    expect(kyHieuKetQua(ds[1], 'kq_thuc_hien')).toBe('✗');
    expect(kyHieuKetQua(ds[2], 'kq_kiem_tra')).toBe('✓');
    expect(kyHieuKetQua(dong(null), 'kq_thuc_hien')).toBe('');
  });

  it('cờ khâu kiểm tra còn sau khi Chuyển lại xoá trắng kết quả', () => {
    const d = { ...dong('dat', null), gs_tung_khong_dat: true };
    expect(demKetQua([d], 'kq_kiem_tra')).toMatchObject({ chuaTich: 1, tungKhongDat: 0 });
    expect(laLoi(d, 'kq_kiem_tra')).toBe(false);
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
