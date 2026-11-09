import { describe, expect, it } from 'vitest';
import { tinhThongKeGscl } from './thong-ke';
import type { GiamSatChatLuong } from './types';

let seq = 0;
const p = (o: Partial<GiamSatChatLuong>): GiamSatChatLuong => ({
  id: String(++seq),
  so_phieu: `P${seq}`,
  ngay: '2026-11-07',
  id_chi_nhanh: '1',
  ten_chi_nhanh: 'NSC fp1',
  id_hang_hoa: '10',
  ma_hang_hoa: 'HQ1',
  ten_hang_hoa: 'HQ1 (25CP)',
  ma_cay_hang: null,
  so_thung_cay: 60,
  so_thung_mau: 10,
  tieu_chi: [],
  trang_thai: 'da_nop',
  ket_luan: 'dat',
  ghi_chu: null,
  id_nguoi_tao: '100',
  ten_nguoi_tao: 'Hương',
  tg_tao: '2026-11-07T08:00:00Z',
  tg_cap_nhat: '2026-11-07T08:00:00Z',
  tg_nop: null,
  id_nguoi_nop: null,
  ten_nguoi_nop: null,
  tg_xuat: null,
  id_nguoi_xuat: null,
  ten_nguoi_xuat: null,
  so_thung_da_kiem: 10,
  ...o,
});

const fp2 = { id_chi_nhanh: '2', ten_chi_nhanh: 'NSC fp2' };

describe('tinhThongKeGscl', () => {
  it('phiếu huỷ không tính vào tổng, đếm riêng', () => {
    const tk = tinhThongKeGscl([p({}), p({ trang_thai: 'huy', ket_luan: null })]);
    expect(tk.kpi.tong).toBe(1);
    expect(tk.kpi.huy).toBe(1);
    expect(tk.theoNgay[0].tong).toBe(1);
  });

  it('gom đúng ngày × farm, ngày mới nhất lên đầu, có tổng từng ô', () => {
    const tk = tinhThongKeGscl([
      p({ ngay: '2026-11-06' }),
      p({ ngay: '2026-11-07' }),
      p({ ngay: '2026-11-07' }),
      p({ ngay: '2026-11-07', ...fp2, ket_luan: 'khong_dat' }),
    ]);
    expect(tk.theoNgay.map((d) => d.ngay)).toEqual(['2026-11-07', '2026-11-06']);
    const n7 = tk.theoNgay[0];
    expect(n7.tong).toBe(3);
    expect(n7.theoFarm['1']).toEqual({ tong: 2, dat: 2, khongDat: 0 });
    expect(n7.theoFarm['2']).toEqual({ tong: 1, dat: 0, khongDat: 1 });
    expect(tk.theoNgay[1].theoFarm['2']).toBeUndefined();
    expect(tk.farms.map((f) => f.id)).toEqual(['1', '2']); // nhiều phiếu trước
  });

  it('theo farm: số ngày làm, TB phiếu/ngày, tỉ lệ đạt', () => {
    const tk = tinhThongKeGscl([
      p({ ngay: '2026-11-06' }),
      p({ ngay: '2026-11-07' }),
      p({ ngay: '2026-11-07', ket_luan: 'khong_dat' }),
      p({ ngay: '2026-11-07', ket_luan: null, trang_thai: 'dang_kiem' }),
    ]);
    const f1 = tk.theoFarm.find((f) => f.key === '1')!;
    expect(f1.tong).toBe(4);
    expect(f1.soNgay).toBe(2);
    expect(f1.tbPhieuNgay).toBe(2);
    expect(f1.dat).toBe(2);
    expect(f1.khongDat).toBe(1);
    expect(f1.tiLeDat).toBeCloseTo(66.7, 1); // 2 / 3 phiếu có kết luận
    expect(tk.kpi.dangKiem).toBe(1);
    expect(tk.kpi.soNgay).toBe(2);
    expect(tk.kpi.tbPhieuNgay).toBe(2);
  });

  it('chưa phiếu nào có kết luận → tỉ lệ đạt null, không chia 0', () => {
    const tk = tinhThongKeGscl([p({ ket_luan: null, trang_thai: 'dang_kiem' })]);
    expect(tk.kpi.tiLeDat).toBeNull();
    expect(tk.theoFarm[0].tiLeDat).toBeNull();
  });

  it('danh sách rỗng → số 0, mảng rỗng', () => {
    const tk = tinhThongKeGscl([]);
    expect(tk.kpi.tong).toBe(0);
    expect(tk.kpi.tbPhieuNgay).toBe(0);
    expect(tk.theoNgay).toEqual([]);
    expect(tk.theoThanhPham).toEqual([]);
    expect(tk.theoNguoiTao).toEqual([]);
  });
});
