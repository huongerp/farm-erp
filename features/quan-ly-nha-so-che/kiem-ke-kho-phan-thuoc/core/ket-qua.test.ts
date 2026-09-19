import { describe, it, expect } from 'vitest';
import {
  computeKetQuaKiemKePT,
  getLechKiemKePT,
  rowCanDieuChinhPT,
  countPendingDieuChinhPT,
  getChiTietKiemKePTStats,
} from './ket-qua';

describe('computeKetQuaKiemKePT', () => {
  it('chưa nhập thực tế → chua_kiem', () => {
    expect(computeKetQuaKiemKePT(10, null)).toBe('chua_kiem');
    expect(computeKetQuaKiemKePT(10, undefined)).toBe('chua_kiem');
  });

  it('sổ 0 và thực tế 0 → khop, không phải chua_kiem', () => {
    // 0 là falsy: dùng `!soLuongThucTe` thay cho `== null` sẽ cho ra chua_kiem.
    expect(computeKetQuaKiemKePT(0, 0)).toBe('khop');
  });

  it('bằng nhau → khop; ít hơn → thieu; nhiều hơn → thua', () => {
    expect(computeKetQuaKiemKePT(10, 10)).toBe('khop');
    expect(computeKetQuaKiemKePT(10, 9)).toBe('thieu');
    expect(computeKetQuaKiemKePT(10, 11)).toBe('thua');
  });

  it('số thập phân so sánh đúng', () => {
    expect(computeKetQuaKiemKePT(10.5, 10.5)).toBe('khop');
    expect(computeKetQuaKiemKePT(10.5, 10.25)).toBe('thieu');
  });
});

describe('getLechKiemKePT', () => {
  it('trả lệch có dấu, null khi chưa kiểm', () => {
    expect(getLechKiemKePT({ so_luong_so: 10, so_luong_thuc_te: 7 })).toBe(-3);
    expect(getLechKiemKePT({ so_luong_so: 10, so_luong_thuc_te: 12 })).toBe(2);
    expect(getLechKiemKePT({ so_luong_so: 10, so_luong_thuc_te: null })).toBeNull();
  });
});

describe('rowCanDieuChinhPT', () => {
  it('chỉ điều chỉnh khi đợt đang kiểm kê', () => {
    const dong = { so_luong_so: 10, so_luong_thuc_te: 8 };
    expect(rowCanDieuChinhPT(dong, 'dang_kiem_ke')).toBe(true);
    expect(rowCanDieuChinhPT(dong, 'draft')).toBe(false);
    expect(rowCanDieuChinhPT(dong, 'hoan_thanh')).toBe(false);
  });

  it('không điều chỉnh khi chưa nhập thực tế, không lệch, hoặc đã có phiếu', () => {
    expect(rowCanDieuChinhPT({ so_luong_so: 10, so_luong_thuc_te: null }, 'dang_kiem_ke')).toBe(false);
    expect(rowCanDieuChinhPT({ so_luong_so: 10, so_luong_thuc_te: 10 }, 'dang_kiem_ke')).toBe(false);
    expect(
      rowCanDieuChinhPT(
        { so_luong_so: 10, so_luong_thuc_te: 8, id_phieu_kho_dieu_chinh: '42' },
        'dang_kiem_ke'
      )
    ).toBe(false);
  });
});

describe('countPendingDieuChinhPT', () => {
  it('đếm đúng số dòng còn chờ điều chỉnh', () => {
    const dongs = [
      { so_luong_so: 10, so_luong_thuc_te: 8 },
      { so_luong_so: 5, so_luong_thuc_te: 5 },
      { so_luong_so: 3, so_luong_thuc_te: null },
      { so_luong_so: 7, so_luong_thuc_te: 9, id_phieu_kho_dieu_chinh: '1' },
      { so_luong_so: 2, so_luong_thuc_te: 4 },
    ];
    expect(countPendingDieuChinhPT(dongs, 'dang_kiem_ke')).toBe(2);
    expect(countPendingDieuChinhPT(dongs, 'draft')).toBe(0);
  });
});

describe('getChiTietKiemKePTStats', () => {
  it('đếm theo từng kết quả + tổng', () => {
    const stats = getChiTietKiemKePTStats([
      { ket_qua: 'khop' },
      { ket_qua: 'khop' },
      { ket_qua: 'thieu' },
      { ket_qua: 'thua' },
      { ket_qua: 'chua_kiem' },
    ]);
    expect(stats).toEqual({ total: 5, khop: 2, thieu: 1, thua: 1, chuaKiem: 1 });
  });
});
