import { describe, expect, it } from 'vitest';
import type { DgdvPhieuDayDu, FarmDgdvDong } from './types';
import {
  KHOA_HANG_DUT_DAY,
  congTongLo,
  dongPhangCuaPhieu,
  hangNhapCuaLo,
  keHoachLuuCaLo,
  keHoachLuuDong,
  keHoachXoaDong,
  loiHangNhap,
  sttDongKeTiep,
  themHangChoDay,
  tongDongPhang,
  tongTheoLo,
  type DgdvHangNhapLo,
} from './chi-tiet-dong';

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
  so_luong_huy: loi,
  ly_do_huy: null,
});

function phieu(): Pick<DgdvPhieuDayDu, 'lo' | 'cot'> {
  return {
    cot: [
      { id: 'c2', id_phieu: 'p', stt: 2, th_nam: 2026, th_tuan: 43, chich_bap_tu: null, chich_bap_den: null, thu_hoach_tu: null, thu_hoach_den: null, id_mau_1: '1', id_mau_2: null, xe_doi: false },
      { id: 'c1', id_phieu: 'p', stt: 1, th_nam: 2026, th_tuan: 43, chich_bap_tu: null, chich_bap_den: null, thu_hoach_tu: null, thu_hoach_den: null, id_mau_1: '2', id_mau_2: null, xe_doi: false },
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
  const gtRong = { danh_gia: null, so_luong_huy: 0, ly_do_huy: null };

  it('thêm dây mới → stt kế tiếp của (lô, dây, ngày)', () => {
    expect(sttDongKeTiep(p, 'L1', 'c1', N1)).toBe(3);
    expect(keHoachLuuDong(p, null, { id_phieu_lo: 'L1', id_cot: 'c1', ngay: N1, so_luong: 4, ...gtRong })).toEqual([
      { op: 'ghiDong', khoa: { id_phieu_lo: 'L1', id_cot: 'c1', ngay: N1, stt_dong: 3 }, gt: { so_luong: 4, ...gtRong } },
    ]);
  });

  it('sửa giữ khoá → ghi đè đúng dòng; đổi dây → xoá cũ + ghi mới', () => {
    const d3 = ds.find((r) => r.key === 'd:d3')!;
    expect(keHoachLuuDong(p, d3, { id_phieu_lo: 'L1', id_cot: 'c1', ngay: N1, so_luong: 21, danh_gia: ' Thiếu lá ', so_luong_huy: 0, ly_do_huy: '' })).toEqual([
      { op: 'ghiDong', khoa: { id_phieu_lo: 'L1', id_cot: 'c1', ngay: N1, stt_dong: 1 }, gt: { so_luong: 21, danh_gia: 'Thiếu lá', so_luong_huy: 0, ly_do_huy: null } },
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

describe('tongTheoLo', () => {
  it('mỗi lô một dòng theo stt; SL buồng = dây + đứt dây; cảnh báo khi SL lỗi > SL', () => {
    const p = phieu();
    p.lo[1].dong.push(o('d5', 'L1', 'c2', N1, 2, 1, 3));
    const ds = tongTheoLo(p);
    expect(ds.map((r) => [r.ten_lo, r.soLuong, r.dutDay, r.slBuong, r.ksc, r.soDong, r.coCanhBao])).toEqual([
      ['A1-1', 38, 0, 38, 5, 4, true],
      ['A1-2', 5, 3, 8, 0, 1, false],
    ]);
    expect(congTongLo(ds)).toEqual({ soLuong: 43, dutDay: 3, slBuong: 46, ksc: 5, soDong: 5 });
  });
});

describe('nhập theo lô', () => {
  const p = phieu();
  const sua = (ds: DgdvHangNhapLo[], key: string, gt: Partial<DgdvHangNhapLo>) => ds.map((h) => (h.key === key ? { ...h, ...gt } : h));

  it('hàng nhập: dây theo stt cột, dòng đã lưu điền sẵn, dây chưa có số một hàng trống, đứt dây cuối', () => {
    expect(hangNhapCuaLo(p, 'L1', N1).map((h) => [h.key, h.stt_dong, h.so_luong])).toEqual([
      ['c:c1:1', 1, 20],
      ['c:c1:2', 2, 7],
      ['c:c2:1', 1, 10],
      [KHOA_HANG_DUT_DAY, null, 0],
    ]);
    expect(hangNhapCuaLo(p, 'L2', N1).map((h) => [h.key, h.so_luong])).toEqual([
      ['c:c1:1', 5],
      ['c:c2:m1', 0],
      [KHOA_HANG_DUT_DAY, 3],
    ]);
  });

  it('thêm hàng cho dây: chèn sau hàng cuối của dây, khoá không trùng', () => {
    const ds = themHangChoDay(hangNhapCuaLo(p, 'L2', N1), 'c2');
    expect(ds.map((h) => h.key)).toEqual(['c:c1:1', 'c:c2:m1', 'c:c2:m2', KHOA_HANG_DUT_DAY]);
  });

  it('không đổi gì → không ghi', () => {
    expect(keHoachLuuCaLo(p, 'L1', N1, hangNhapCuaLo(p, 'L1', N1))).toEqual([]);
  });

  it('xoá (SL = 0) → sửa → thêm (stt nối tiếp) → đứt dây', () => {
    let ds = hangNhapCuaLo(p, 'L1', N1);
    ds = sua(ds, 'c:c1:2', { so_luong: 0 });
    ds = sua(ds, 'c:c2:1', { so_luong: 12, danh_gia: ' Thiếu lá ' });
    ds = themHangChoDay(ds, 'c1');
    ds = themHangChoDay(ds, 'c1');
    ds = sua(ds, 'c:c1:m1', { so_luong: 4 });
    ds = sua(ds, 'c:c1:m2', { so_luong: 6, so_luong_huy: 1, ly_do_huy: 'Chín' });
    ds = sua(ds, KHOA_HANG_DUT_DAY, { so_luong: 2 });
    const k = (cot: string, stt: number) => ({ id_phieu_lo: 'L1', id_cot: cot, ngay: N1, stt_dong: stt });
    expect(keHoachLuuCaLo(p, 'L1', N1, ds)).toEqual([
      { op: 'xoaDong', khoa: k('c1', 2) },
      { op: 'ghiDong', khoa: k('c2', 1), gt: { so_luong: 12, danh_gia: 'Thiếu lá', so_luong_huy: 2, ly_do_huy: null } },
      { op: 'ghiDong', khoa: k('c1', 3), gt: { so_luong: 4, danh_gia: null, so_luong_huy: 0, ly_do_huy: null } },
      { op: 'ghiDong', khoa: k('c1', 4), gt: { so_luong: 6, danh_gia: null, so_luong_huy: 1, ly_do_huy: 'Chín' } },
      { op: 'ghiDutDay', id_phieu_lo: 'L1', ngay: N1, dutDay: 2 },
    ]);
  });

  it('đứt dây về 0 → xoá; hàng mới trống bỏ qua', () => {
    const ds = sua(hangNhapCuaLo(p, 'L2', N1), KHOA_HANG_DUT_DAY, { so_luong: 0 });
    expect(keHoachLuuCaLo(p, 'L2', N1, ds)).toEqual([{ op: 'ghiDutDay', id_phieu_lo: 'L2', ngay: N1, dutDay: 0 }]);
  });

  it('lỗi hàng: thiếu SL khi có chữ / SL lỗi; SL lỗi > SL; đứt dây không kiểm', () => {
    const h = hangNhapCuaLo(p, 'L2', N1)[1];
    expect(loiHangNhap(h)).toBeNull();
    expect(loiHangNhap({ ...h, danh_gia: 'Thiếu lá' })).toBe('thieuSoLuong');
    expect(loiHangNhap({ ...h, so_luong_huy: 2 })).toBe('thieuSoLuong');
    expect(loiHangNhap({ ...h, so_luong: 3, so_luong_huy: 4 })).toBe('slLoiLonHon');
    expect(loiHangNhap({ ...h, so_luong: 3, so_luong_huy: 3 })).toBeNull();
    expect(loiHangNhap({ ...h, id_cot: null, so_luong_huy: 9 })).toBeNull();
  });
});
