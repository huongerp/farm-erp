import { describe, it, expect } from 'vitest';
import { tinhTienDoNhapDon } from './tien-do-nhap-don';
import { TRANG_THAI_CHO_DUYET, TRANG_THAI_DA_DUYET, TRANG_THAI_KHONG_DUYET } from './constants';

describe('tinhTienDoNhapDon', () => {
  it('chưa có phiếu / đơn chưa có chi tiết → 0', () => {
    expect(tinhTienDoNhapDon([], undefined)).toEqual({ daNhap: 0, dat: 0 });
    expect(tinhTienDoNhapDon([], [{ so_luong: 5 }, { so_luong: 7 }])).toEqual({ daNhap: 0, dat: 12 });
  });

  it('bỏ phiếu Không duyệt, vẫn tính phiếu chờ duyệt', () => {
    const phieu = [
      { trang_thai: TRANG_THAI_DA_DUYET, tong_so_luong: 4 },
      { trang_thai: TRANG_THAI_KHONG_DUYET, tong_so_luong: 100 },
      { trang_thai: TRANG_THAI_CHO_DUYET, tong_so_luong: 3 },
    ];
    expect(tinhTienDoNhapDon(phieu, [{ so_luong: 10 }])).toEqual({ daNhap: 7, dat: 10 });
  });

  it('nhập dư hơn đặt vẫn giữ nguyên số, null coi là 0', () => {
    const phieu = [
      { trang_thai: TRANG_THAI_DA_DUYET, tong_so_luong: 12 },
      { trang_thai: TRANG_THAI_DA_DUYET, tong_so_luong: null },
    ];
    expect(tinhTienDoNhapDon(phieu, [{ so_luong: 10 }, { so_luong: null }])).toEqual({ daNhap: 12, dat: 10 });
  });
});
