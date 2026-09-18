import { describe, it, expect } from 'vitest';
import { EMPTY_STATS, normalizeThongKeQuyStats, tyTrongChiTheoHangMuc } from './thong-ke-quy-aggregate';

describe('normalizeThongKeQuyStats', () => {
  it('numeric dạng chuỗi của Postgres về number, giữ cân đối kỳ', () => {
    const stats = normalizeThongKeQuyStats({
      ton_dau_ky: '21885000',
      tong_thu: '20000000',
      tong_chi: '36328000',
      ton_cuoi_ky: '999',
      so_phieu: '37',
      theo_hang_muc: [{ id: '3', ten: 'Vật tư', thu: '0', chi: '5000000', so_phieu: '20' }],
      theo_thang: [{ thang: '2026-07', thu: '20000000', chi: '3000000' }],
      theo_chi_nhanh: [],
      theo_nguon_chung_tu: [{ nguon: 'khong_lien_ket', thu: '0', chi: '1000' }],
    });

    expect(stats.ton_dau_ky).toBe(21885000);
    // ton_cuoi_ky luôn suy lại từ đầu kỳ + thu − chi, bỏ giá trị sai của payload
    expect(stats.ton_cuoi_ky).toBe(21885000 + 20000000 - 36328000);
    expect(stats.ton_dau_ky + stats.tong_thu - stats.tong_chi).toBe(stats.ton_cuoi_ky);
    expect(stats.so_phieu).toBe(37);
    expect(stats.theo_hang_muc[0]).toEqual({
      id: '3',
      ten: 'Vật tư',
      thang: undefined,
      nguon: undefined,
      thu: 0,
      chi: 5000000,
      so_phieu: 20,
    });
    expect(stats.theo_thang[0].thang).toBe('2026-07');
  });

  it('payload rỗng / sai kiểu → thống kê rỗng', () => {
    expect(normalizeThongKeQuyStats(null)).toEqual(EMPTY_STATS);
    expect(normalizeThongKeQuyStats('x')).toEqual(EMPTY_STATS);
    const stats = normalizeThongKeQuyStats({ theo_hang_muc: 'không phải mảng' });
    expect(stats.theo_hang_muc).toEqual([]);
    expect(stats.ton_cuoi_ky).toBe(0);
  });
});

describe('tyTrongChiTheoHangMuc', () => {
  it('tính tỷ trọng và sắp xếp giảm dần', () => {
    const res = tyTrongChiTheoHangMuc([
      { ten: 'Vật tư', thu: 0, chi: 75 },
      { ten: 'Chi khác', thu: 0, chi: 25 },
      { ten: 'Tạm ứng', thu: 100, chi: 0 },
    ]);
    expect(res.map((r) => r.ten)).toEqual(['Vật tư', 'Chi khác']);
    expect(res[0].tyLe).toBeCloseTo(0.75);
    expect(res[1].tyLe).toBeCloseTo(0.25);
  });

  it('kỳ không có chi → mảng rỗng (tránh chia 0)', () => {
    expect(tyTrongChiTheoHangMuc([{ ten: 'Tạm ứng', thu: 100, chi: 0 }])).toEqual([]);
    expect(tyTrongChiTheoHangMuc([])).toEqual([]);
  });
});
