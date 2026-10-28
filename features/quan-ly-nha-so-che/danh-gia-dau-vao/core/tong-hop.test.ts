import { describe, expect, it } from 'vitest';
import {
  KHOA_DUT_DAY,
  cacThangKetThuc,
  congThang,
  khoangTaiThang,
  ngayCuoiThang,
  tiLeKsc,
  dsToTruong,
  khopLocKsc,
  locDongTheoToTruong,
  locNgayChiNhanh,
  locPhieuTheoToTruong,
  tongHopNgayChiNhanh,
  tongHopThang,
  tongHopTuanChiNhanh,
  tongHopTuanTheoChiNhanh,
  tongHopTuanTheoDay,
  tongHopTuanTheoLo,
  type DgdvDongChuyen,
  type DgdvDongNgayDay,
} from './tong-hop';
import { cacNgayCuaTuanFarm } from './tuan';
import type { DgdvPhieuDayDu } from './types';

// Tuần farm 44/2026: T2 26/10 → CN 01/11.
const NGAYS = cacNgayCuaTuanFarm(2026, 44);

function dong(p: Partial<DgdvDongNgayDay>): DgdvDongNgayDay {
  return {
    ngay: NGAYS[0],
    id_chi_nhanh: '1',
    id_lo: 'l1',
    ten_lo: 'Lô 1',
    to_truong: 'Võ Thị Cưng',
    id_mau_1: 'm1',
    id_mau_2: null,
    xe_doi: false,
    th_nam: 2026,
    th_tuan: 44,
    so_luong: 0,
    so_luong_loi: 0,
    ...p,
  };
}

describe('tongHopTuanTheoLo', () => {
  const rows = [
    dong({ so_luong: 100, so_luong_loi: 5 }),
    dong({ ngay: NGAYS[2], so_luong: 50, so_luong_loi: 1 }),
    dong({ ngay: NGAYS[2], id_mau_1: null, th_nam: null, th_tuan: null, so_luong: 4 }), // đứt dây
    dong({ id_lo: 'l10', ten_lo: 'Lô 10', to_truong: ' võ thị  cưng ', so_luong: 30 }),
    dong({ id_lo: 'l2', ten_lo: 'Lô 2', to_truong: null, ngay: NGAYS[1], so_luong: 20 }),
    dong({ id_lo: 'l2', ten_lo: 'Lô 2', to_truong: 'Trần Văn A', ngay: NGAYS[6], so_luong: 10, so_luong_loi: 2 }),
    dong({ ngay: '2026-11-02', so_luong: 999 }), // ngoài tuần
  ];
  const kq = tongHopTuanTheoLo(rows, NGAYS);

  it('cộng theo ngày, đứt dây vào tổng thu, bỏ ngày ngoài tuần', () => {
    expect(kq.tongThu).toBe(214);
    expect(kq.ksc).toBe(8);
    expect(kq.theoNgay).toEqual([130, 20, 54, 0, 0, 0, 10]);
  });

  it('gom tổ trưởng không phân biệt hoa thường; lô xếp số tự nhiên; tổ trưởng lấy ngày gần nhất', () => {
    expect(kq.toTruong.map((g) => [g.ten_to_truong, g.lo.map((l) => l.ten_lo)])).toEqual([
      ['Võ Thị Cưng', ['Lô 1', 'Lô 10']],
      ['Trần Văn A', ['Lô 2']],
    ]);
    const [cung, a] = kq.toTruong;
    expect(cung.tongThu).toBe(184);
    expect(cung.lo[0].theoNgay).toEqual([100, 0, 54, 0, 0, 0, 0]);
    expect(a.ksc).toBe(2);
  });

  it('cùng tên tổ trưởng ở hai chi nhánh là hai nhóm, xếp theo thứ tự chi nhánh', () => {
    const r = tongHopTuanTheoLo([dong({ so_luong: 1 }), dong({ id_chi_nhanh: '2', id_lo: 'x', so_luong: 2 })], NGAYS, ['2', '1']);
    expect(r.toTruong.map((g) => [g.id_chi_nhanh, g.tongThu])).toEqual([
      ['2', 2],
      ['1', 1],
    ]);
  });
});

describe('tongHopTuanTheoDay', () => {
  it('gom màu + xé đôi + tuần thu hoạch qua lô / ngày; xếp theo tuần, đứt dây cuối; tính tuần chích bắp', () => {
    const ds = tongHopTuanTheoDay([
      dong({ id_mau_1: null, th_nam: null, th_tuan: null, so_luong: 3 }),
      dong({ th_tuan: 45, so_luong: 10 }),
      dong({ so_luong: 20, so_luong_loi: 2 }),
      dong({ id_lo: 'l2', ngay: NGAYS[3], so_luong: 5 }),
      dong({ xe_doi: true, so_luong: 7 }),
    ]);
    expect(ds.map((d) => [d.tuanThuHoach?.tuan ?? null, d.xe_doi, d.tongThu, d.ksc])).toEqual([
      [44, false, 25, 2],
      [44, true, 7, 0],
      [45, false, 10, 0],
      [null, false, 3, 0],
    ]);
    expect(ds[0].tuanChichBap).toEqual({ nam: 2026, tuan: 35 });
    expect(ds[3].khoa).toBe(KHOA_DUT_DAY);
  });
});

describe('tongHopTuanTheoChiNhanh', () => {
  it('chỉ chi nhánh có số trong tuần mới có dòng', () => {
    const ds = tongHopTuanTheoChiNhanh([dong({ so_luong: 8, so_luong_loi: 1 })], NGAYS, ['1', '2']);
    expect(ds.map((c) => [c.id_chi_nhanh, c.tongThu, c.ksc, c.theoNgay[0]])).toEqual([['1', 8, 1, 8]]);
  });
});

describe('tháng', () => {
  it('congThang / cacThangKetThuc qua năm, ngày cuối tháng, khoảng tải gồm tháng trước', () => {
    expect(congThang('2026-01', -1)).toBe('2025-12');
    expect(congThang('2026-11', 2)).toBe('2027-01');
    expect(cacThangKetThuc('2026-02', 3)).toEqual(['2025-12', '2026-01', '2026-02']);
    expect(ngayCuoiThang('2028-02')).toBe('2028-02-29');
    expect(khoangTaiThang(['2026-09', '2026-10'])).toEqual({ tu: '2026-08-01', den: '2026-10-31' });
  });

  it('tiLeKsc: tổng thu 0 → null', () => {
    expect(tiLeKsc(5, 0)).toBeNull();
    expect(tiLeKsc(5, 200)).toBe(2.5);
  });
});

describe('tongHopThang', () => {
  const ch = (ngay: string, id_chi_nhanh: string, tong_thu: number, ksc = 0): DgdvDongChuyen => ({ ngay, id_chi_nhanh, tong_thu, ksc });
  const rows = [
    ch('2026-08-10', '1', 400), // tháng trước tháng đầu — chỉ để so
    ch('2026-09-01', '1', 300, 6),
    ch('2026-09-01', '1', 200, 4), // chuyến 2 cùng ngày
    ch('2026-09-15', '1', 100),
    ch('2026-10-03', '2', 50, 5),
  ];
  const kq = tongHopThang(rows, ['2026-09', '2026-10'], ['1', '2']);
  const lay = (thang: string, cn: string | null) =>
    (cn == null ? kq.tongThang : kq.theoChiNhanh).find((d) => d.thang === thang && d.id_chi_nhanh === cn)!;

  it('mỗi tháng × chi nhánh một dòng, tháng không có phiếu là dòng 0', () => {
    expect(kq.theoChiNhanh.map((d) => `${d.thang}|${d.id_chi_nhanh}`)).toEqual(['2026-09|1', '2026-09|2', '2026-10|1', '2026-10|2']);
    expect(lay('2026-10', '1')).toMatchObject({ tongThu: 0, ksc: 0, soChuyen: 0, soNgayCoNhap: 0, tbThuNgay: null });
  });

  it('cộng chuyến, đếm ngày có nhập, TB thu/ngày', () => {
    expect(lay('2026-09', '1')).toMatchObject({ tongThu: 600, ksc: 10, soChuyen: 3, soNgayCoNhap: 2, tbThuNgay: 300 });
  });

  it('chênh so tháng trước; tháng trước 0 → null', () => {
    expect(lay('2026-09', '1')).toMatchObject({ chenh: 200, chenhPt: 50 });
    expect(lay('2026-10', '1')).toMatchObject({ chenh: -600, chenhPt: -100 });
    expect(lay('2026-09', '2')).toMatchObject({ chenh: null, chenhPt: null });
    expect(lay('2026-10', '2')).toMatchObject({ chenh: null, chenhPt: null });
  });

  it('dòng tổng tháng cộng mọi chi nhánh', () => {
    expect(lay('2026-10', null)).toMatchObject({ tongThu: 50, ksc: 5, soChuyen: 1, chenh: -550 });
  });

  it('chỉ chi nhánh có số; chi nhánh lạ xếp sau các chi nhánh đã biết', () => {
    const ds = tongHopThang([ch('2026-10-01', '9', 1), ch('2026-10-02', '2', 1)], ['2026-10'], ['1', '2']).dsChiNhanh;
    expect(ds).toEqual(['2', '9']);
  });
});

// ---- Danh sách tổng hợp ngày / tuần ----

/** Phiếu tối giản: mỗi lô [tổ trưởng, SL, SL lỗi, đứt dây]. */
function phieu(id: string, ngay: string, cn: string, chuyen: number, lo: [string | null, number, number, number][], khoa = false): DgdvPhieuDayDu {
  return {
    id,
    ngay,
    chuyen,
    nam: 2026,
    tuan: 44,
    id_chi_nhanh: cn,
    ten_chi_nhanh: `CN ${cn}`,
    ghi_chu: null,
    trang_thai: khoa ? 'khoa' : 'mo',
    id_nguoi_tao: null,
    tg_tao: '',
    tg_cap_nhat: '',
    cot: [],
    lo: lo.map(([toTruong, sl, loi, dut], i) => ({
      id: `${id}-l${i}`,
      id_phieu: id,
      id_lo: `x${i}`,
      to_truong: toTruong,
      ghi_chu: null,
      stt: i + 1,
      ten_lo: `Lô ${i}`,
      lo_ngay: dut ? [{ id: `${id}-n${i}`, id_phieu_lo: `${id}-l${i}`, ngay, dut_day: dut }] : [],
      dong: [{ id: `${id}-d${i}`, id_phieu_lo: `${id}-l${i}`, id_cot: 'c', ngay, stt_dong: 1, so_luong: sl, danh_gia: null, so_luong_loi: loi, ly_do_loi: null }],
    })),
  };
}

describe('tongHopNgayChiNhanh + lọc', () => {
  const ds = [
    phieu('p2', NGAYS[0], '1', 2, [['An', 50, 0, 0]], true),
    phieu('p1', NGAYS[0], '1', 1, [['An', 100, 5, 4], ['Bình', 30, 0, 0]], true),
    phieu('p3', NGAYS[0], '2', 1, [['bình', 20, 0, 0]]),
    phieu('p4', NGAYS[1], '1', 1, [[null, 10, 0, 0]]),
  ];
  const rows = tongHopNgayChiNhanh(ds, ['2', '1']);

  it('gom (ngày, chi nhánh) cộng mọi chuyến; ngày mới trước, chi nhánh theo thứ tự; chuyến theo số', () => {
    expect(rows.map((r) => [r.ngay, r.id_chi_nhanh, r.soChuyen, r.tongThu, r.ksc, r.daKhoaHet, r.ids_phieu])).toEqual([
      [NGAYS[1], '1', 1, 10, 0, false, ['p4']],
      [NGAYS[0], '2', 1, 20, 0, false, ['p3']],
      [NGAYS[0], '1', 2, 184, 5, true, ['p1', 'p2']],
    ]);
  });

  it('lọc trạng thái + KSC; rỗng / chọn cả hai = không lọc', () => {
    expect(locNgayChiNhanh(rows, { trangThai: ['khoa'], ksc: [] }).map((r) => r.khoa)).toEqual([`${NGAYS[0]}|1`]);
    expect(locNgayChiNhanh(rows, { trangThai: ['mo'], ksc: ['khong'] })).toHaveLength(2);
    expect(locNgayChiNhanh(rows, { trangThai: [], ksc: ['co', 'khong'] })).toHaveLength(3);
  });

  it('tổ trưởng: lọc lô, bỏ phiếu không còn lô; tuỳ chọn gom hoa thường, bỏ trống', () => {
    const loc = locPhieuTheoToTruong(ds, ['bình']);
    expect(loc.map((p) => [p.id, p.lo.length])).toEqual([
      ['p1', 1],
      ['p3', 1],
    ]);
    expect(tongHopNgayChiNhanh(loc).map((r) => [r.id_chi_nhanh, r.tongThu])).toEqual([
      ['1', 30],
      ['2', 20],
    ]);
    expect(dsToTruong(ds.flatMap((p) => p.lo.map((l) => l.to_truong)))).toEqual([
      { khoa: 'an', ten: 'An' },
      { khoa: 'bình', ten: 'Bình' },
    ]);
    expect(locPhieuTheoToTruong(ds, [])).toBe(ds);
  });
});

describe('tongHopTuanChiNhanh', () => {
  it('cột T2→CN + số ngày có số + số chuyến trong tuần; lọc tổ trưởng trên dòng view; khopLocKsc', () => {
    const rows = [
      dong({ so_luong: 100, so_luong_loi: 2 }),
      dong({ ngay: NGAYS[3], so_luong: 40, to_truong: 'Bình' }),
      dong({ id_chi_nhanh: '2', so_luong: 7 }),
    ];
    const chuyen = [
      { ngay: NGAYS[0], id_chi_nhanh: '1' },
      { ngay: NGAYS[0], id_chi_nhanh: '1' },
      { ngay: NGAYS[3], id_chi_nhanh: '1' },
      { ngay: '2026-11-02', id_chi_nhanh: '1' },
    ];
    const ds = tongHopTuanChiNhanh(rows, NGAYS, ['1', '2'], chuyen);
    expect(ds.map((c) => [c.id_chi_nhanh, c.tongThu, c.ksc, c.soNgayCoSo, c.soChuyen])).toEqual([
      ['1', 140, 2, 2, 3],
      ['2', 7, 0, 1, 0],
    ]);
    expect(locDongTheoToTruong(rows, ['bình'])).toHaveLength(1);
    expect([khopLocKsc(2, ['co']), khopLocKsc(0, ['co']), khopLocKsc(0, [])]).toEqual([true, false, true]);
  });
});
