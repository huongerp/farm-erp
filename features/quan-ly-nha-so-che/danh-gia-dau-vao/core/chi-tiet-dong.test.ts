import { describe, expect, it } from 'vitest';
import type { DgdvPhieuDayDu, FarmDgdvDong } from './types';
import { dongPhangCuaPhieu, keHoachLuuDong, keHoachXoaDong, sttDongKeTiep, tongDongPhang } from './chi-tiet-dong';

const N1 = '2026-10-19';
const N2 = '2026-10-20';

const o = (id: string, lo: string, cot: string, ngay: string, stt: number, sl: number, loi = 0): FarmDgdvDong => ({
  id,
  id_phieu_lo: lo,
  id_cot: cot,
  ngay,
  stt_dong: stt,
  so_luong: sl,
  danh_gia: null,
  so_luong_loi: loi,
  ly_do_loi: null,
});

function phieu(): Pick<DgdvPhieuDayDu, 'lo' | 'cot'> {
  return {
    cot: [
      { id: 'c2', id_phieu: 'p', stt: 2, chich_bap_tu: null, chich_bap_den: null, thu_hoach_tu: null, thu_hoach_den: null, id_mau_1: '1', id_mau_2: null, xe_doi: false },
      { id: 'c1', id_phieu: 'p', stt: 1, chich_bap_tu: null, chich_bap_den: null, thu_hoach_tu: null, thu_hoach_den: null, id_mau_1: '2', id_mau_2: null, xe_doi: false },
    ],
    lo: [
      {
        id: 'L2', id_phieu: 'p', id_lo: 'x2', to_truong: 'B', ghi_chu: null, stt: 2, ten_lo: 'A1-2',
        lo_ngay: [{ id: 'n1', id_phieu_lo: 'L2', ngay: N1, dut_day: 3 }],
        dong: [o('d4', 'L2', 'c1', N1, 1, 5)],
      },
      {
        id: 'L1', id_phieu: 'p', id_lo: 'x1', to_truong: 'A', ghi_chu: null, stt: 1, ten_lo: 'A1-1',
        lo_ngay: [{ id: 'n0', id_phieu_lo: 'L1', ngay: N2, dut_day: 0 }],
        dong: [o('d1', 'L1', 'c2', N1, 1, 10, 2), o('d2', 'L1', 'c1', N1, 2, 7), o('d3', 'L1', 'c1', N1, 1, 20)],
      },
    ],
  };
}

describe('dongPhangCuaPhieu', () => {
  it('xếp ngày → lô → dây → dòng, đứt dây cuối lô, bỏ đứt dây = 0', () => {
    const ds = dongPhangCuaPhieu(phieu());
    expect(ds.map((r) => r.key)).toEqual(['d:d3', 'd:d2', 'd:d1', 'd:d4', 'n:n1']);
    expect(ds[4]).toMatchObject({ loai: 'dut_day', id_cot: null, so_luong: 3, ten_lo: 'A1-2' });
    expect(tongDongPhang(ds)).toEqual({ soLuong: 45, soLuongLoi: 2 });
  });
});

describe('keHoachLuuDong', () => {
  const p = phieu();
  const ds = dongPhangCuaPhieu(p);
  const gtRong = { danh_gia: null, so_luong_loi: 0, ly_do_loi: null };

  it('thêm dây mới → stt kế tiếp của (lô, dây, ngày)', () => {
    expect(sttDongKeTiep(p, 'L1', 'c1', N1)).toBe(3);
    expect(keHoachLuuDong(p, null, { id_phieu_lo: 'L1', id_cot: 'c1', ngay: N1, so_luong: 4, ...gtRong })).toEqual([
      { op: 'ghiDong', khoa: { id_phieu_lo: 'L1', id_cot: 'c1', ngay: N1, stt_dong: 3 }, gt: { so_luong: 4, ...gtRong } },
    ]);
  });

  it('sửa giữ khoá → ghi đè đúng dòng; đổi dây → xoá cũ + ghi mới', () => {
    const d3 = ds.find((r) => r.key === 'd:d3')!;
    expect(keHoachLuuDong(p, d3, { id_phieu_lo: 'L1', id_cot: 'c1', ngay: N1, so_luong: 21, danh_gia: ' Thiếu lá ', so_luong_loi: 0, ly_do_loi: '' })).toEqual([
      { op: 'ghiDong', khoa: { id_phieu_lo: 'L1', id_cot: 'c1', ngay: N1, stt_dong: 1 }, gt: { so_luong: 21, danh_gia: 'Thiếu lá', so_luong_loi: 0, ly_do_loi: null } },
    ]);
    const ops = keHoachLuuDong(p, d3, { id_phieu_lo: 'L1', id_cot: 'c2', ngay: N1, so_luong: 20, ...gtRong });
    expect(ops.map((x) => x.op)).toEqual(['xoaDong', 'ghiDong']);
    expect(ops[1]).toMatchObject({ khoa: { id_cot: 'c2', stt_dong: 2 } });
  });

  it('đứt dây: thêm mới cộng dồn; sửa cùng lô-ngày đặt số mới; chuyển dây → đứt dây xoá dòng dây', () => {
    expect(keHoachLuuDong(p, null, { id_phieu_lo: 'L2', id_cot: null, ngay: N1, so_luong: 2, ...gtRong })).toEqual([
      { op: 'ghiDutDay', id_phieu_lo: 'L2', ngay: N1, dutDay: 5 },
    ]);
    const n1 = ds.find((r) => r.key === 'n:n1')!;
    expect(keHoachLuuDong(p, n1, { id_phieu_lo: 'L2', id_cot: null, ngay: N1, so_luong: 1, ...gtRong })).toEqual([
      { op: 'ghiDutDay', id_phieu_lo: 'L2', ngay: N1, dutDay: 1 },
    ]);
    const d4 = ds.find((r) => r.key === 'd:d4')!;
    expect(keHoachLuuDong(p, d4, { id_phieu_lo: 'L2', id_cot: null, ngay: N1, so_luong: 5, ...gtRong }).map((x) => x.op)).toEqual([
      'xoaDong',
      'ghiDutDay',
    ]);
  });

  it('xoá đứt dây = đặt 0', () => {
    expect(keHoachXoaDong(ds.find((r) => r.key === 'n:n1')!)).toEqual([{ op: 'ghiDutDay', id_phieu_lo: 'L2', ngay: N1, dutDay: 0 }]);
  });
});
