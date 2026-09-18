import { describe, it, expect } from 'vitest';
import { computeRunningBalance, tongHopThuChi, type RunningBalanceInput } from './quy-running-balance';

const row = (
  id: string,
  ngay: string,
  loai: 'thu' | 'chi',
  so_tien: number,
  id_chi_nhanh = '1'
): RunningBalanceInput => ({ id, ngay, loai, so_tien, id_chi_nhanh });

describe('computeRunningBalance', () => {
  it('khớp cột TỒN QUỸ của sổ Excel (tạm ứng rồi chi dần)', () => {
    const rows = [
      row('1', '2026-07-22', 'thu', 21885000),
      row('2', '2026-07-25', 'chi', 280000),
      row('3', '2026-07-25', 'chi', 49000),
      row('4', '2026-07-25', 'chi', 1080000),
    ];
    const res = computeRunningBalance(rows);
    expect(res.map((r) => r.ton_quy)).toEqual([21885000, 21605000, 21556000, 20476000]);
  });

  it('chèn phiếu LÙI NGÀY làm dời tồn của mọi dòng phát sinh sau', () => {
    const rows = [
      row('1', '2026-07-22', 'thu', 20000000),
      row('2', '2026-07-25', 'chi', 500000),
      // nhập sau (id lớn) nhưng ngày nằm giữa
      row('3', '2026-07-23', 'chi', 1000000),
    ];
    const res = computeRunningBalance(rows);
    const byId = new Map(res.map((r) => [r.id, r.ton_quy]));
    expect(byId.get('1')).toBe(20000000);
    expect(byId.get('3')).toBe(19000000);
    expect(byId.get('2')).toBe(18500000);
  });

  it('cùng ngày thì xếp theo id (thứ tự nhập)', () => {
    const rows = [
      row('2', '2026-08-08', 'chi', 100000),
      row('1', '2026-08-08', 'thu', 1000000),
    ];
    const res = computeRunningBalance(rows);
    const byId = new Map(res.map((r) => [r.id, r.ton_quy]));
    expect(byId.get('1')).toBe(1000000);
    expect(byId.get('2')).toBe(900000);
  });

  it('mỗi chi nhánh lũy kế độc lập', () => {
    const rows = [
      row('1', '2026-07-01', 'thu', 1000000, 'A'),
      row('2', '2026-07-02', 'thu', 500000, 'B'),
      row('3', '2026-07-03', 'chi', 200000, 'A'),
      row('4', '2026-07-04', 'chi', 100000, 'B'),
    ];
    const byId = new Map(computeRunningBalance(rows).map((r) => [r.id, r.ton_quy]));
    expect(byId.get('1')).toBe(1000000);
    expect(byId.get('3')).toBe(800000);
    expect(byId.get('2')).toBe(500000);
    expect(byId.get('4')).toBe(400000);
  });

  it('giữ nguyên thứ tự mảng đầu vào và cho phép tồn âm', () => {
    const rows = [row('2', '2026-07-05', 'chi', 300000), row('1', '2026-07-01', 'thu', 100000)];
    const res = computeRunningBalance(rows);
    expect(res.map((r) => r.id)).toEqual(['2', '1']);
    expect(res[0].ton_quy).toBe(-200000);
  });

  it('danh sách rỗng → mảng rỗng', () => {
    expect(computeRunningBalance([])).toEqual([]);
  });
});

describe('tongHopThuChi', () => {
  it('cộng riêng thu và chi', () => {
    const res = tongHopThuChi([
      { loai: 'thu', so_tien: 20000000 },
      { loai: 'chi', so_tien: 280000 },
      { loai: 'chi', so_tien: 720000 },
    ]);
    expect(res).toEqual({ tongThu: 20000000, tongChi: 1000000, chenhLech: 19000000 });
  });
});
