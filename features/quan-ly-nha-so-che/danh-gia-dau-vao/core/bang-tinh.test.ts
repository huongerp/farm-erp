import { describe, expect, it } from 'vitest';
import {
  congPhieuTheoNgay,
  dungLuoiKhoangNgay,
  dungLuoiNgay,
  dungPhieuSaoChep,
  kiemTraSoLuongLoi,
  taoMapMau,
  tongCot,
  tongNgay,
  tongPhieu,
  tongToTruong,
} from './bang-tinh';
import type { DgdvLoDayDu, DgdvPhieuDayDu, FarmDgdvCot, FarmDgdvDong, VarMauDay } from './types';

// Số mẫu báo cáo FP5, phiếu chuyến 1 ngày 21/10/2026 (tuần farm 43).
const NGAY = '2026-10-21';
const NGAY_KHAC = '2026-10-22';

const TEN_MAU = ['Đen', 'Trắng', 'Đỏ', 'Vàng', 'Xanh dương', 'Xanh lá', 'Xanh bộ đôi', 'Tím', 'Cam', 'Nâu'];
const dsMau: VarMauDay[] = TEN_MAU.map((ten, i) => ({
  id: `m${i + 1}`,
  ten,
  ma_mau: `#00000${i}`,
  thu_tu: i + 1,
  dang_dung: true,
  tg_tao: '',
  tg_cap_nhat: '',
}));
const mauTheoId = taoMapMau(dsMau);

/** 9 cột: c1 thu trễ tuần 42, c2–c8 tuần 43, c9 tuần 45 (Tím - Cam, xé đôi). */
function cot(i: number, idPhieu = 'p1'): FarmDgdvCot {
  return {
    id: `${idPhieu}-c${i}`,
    id_phieu: idPhieu,
    stt: i,
    th_nam: 2026,
    th_tuan: i === 1 ? 42 : i === 9 ? 45 : 43,
    chich_bap_tu: null,
    chich_bap_den: null,
    thu_hoach_tu: null,
    thu_hoach_den: null,
    id_mau_1: i === 9 ? 'm8' : `m${i}`,
    id_mau_2: i === 9 ? 'm9' : null,
    xe_doi: i === 9,
  };
}

let soId = 0;
function o(idLo: string, idCot: string, so_luong: number, extra: Partial<FarmDgdvDong> = {}): FarmDgdvDong {
  return {
    id: `d${++soId}`,
    id_phieu_lo: idLo,
    id_cot: idCot,
    ngay: NGAY,
    stt_dong: 1,
    so_luong,
    danh_gia: null,
    so_luong_huy: 0,
    ly_do_huy: null,
    ...extra,
  };
}

/** nv1b = cùng người với nv1 nhưng gõ khác hoa thường / khoảng trắng. */
const TO_TRUONG: Record<string, string> = { nv1: 'Tổ trưởng A', nv1b: ' tổ trưởng  a ', nv2: 'Tổ trưởng B' };

function lo(id: string, ten: string, stt: number, toTruong: string, dutDay: number, dong: FarmDgdvDong[]): DgdvLoDayDu {
  return {
    id,
    id_phieu: 'p1',
    id_lo: `lo-${ten.toLowerCase()}`,
    to_truong: TO_TRUONG[toTruong],
    ghi_chu: `ghi chú ${ten}`,
    stt,
    ten_lo: ten,
    lo_ngay: dutDay > 0 ? [{ id: `n-${id}`, id_phieu_lo: id, ngay: NGAY, dut_day: dutDay }] : [],
    dong,
  };
}

const SO_A32 = [13, 30, 32, 53, 83, 42, 7, 12, 1];
const C = (i: number) => `p1-c${i}`;

function phieuMau(): DgdvPhieuDayDu {
  const a32 = lo('L1', 'A3-2', 1, 'nv1', 9, [
    // dây 1 chia 2 dòng: 10 + 3 = 13
    o('L1', C(1), 10),
    o('L1', C(1), 3, { stt_dong: 2 }),
    ...SO_A32.slice(1).map((sl, i) => o('L1', C(i + 2), sl, i + 2 === 5 ? { so_luong_huy: 2, ly_do_huy: 'Chín bệnh' } : {})),
  ]);
  return {
    id: 'p1',
    ngay: NGAY,
    chuyen: 1,
    nam: 2026,
    tuan: 43,
    id_chi_nhanh: 'cn1',
    ghi_chu: 'ghi chú phiếu',
    trang_thai: 'mo',
    id_nguoi_tao: null,
    tg_tao: '2026-10-21T01:00:00Z',
    tg_cap_nhat: '2026-10-21T02:00:00Z',
    cot: Array.from({ length: 9 }, (_, i) => cot(i + 1)),
    // stt xen kẽ tổ trưởng để thử gom nhóm
    lo: [
      lo('L4', 'A3-3', 4, 'nv1b', 1, [o('L4', C(1), 24)]),
      a32,
      lo('L2', 'a2-3', 2, 'nv2', 2, [o('L2', C(2), 41)]),
      lo('L3', 'a2-4', 3, 'nv2', 0, [o('L3', C(3), 50, { so_luong_huy: 1 })]),
    ],
  };
}

/**
 * Chuyến 2 cùng ngày: dây Đen tuần 42 (trùng c1 của chuyến 1) + dây Đen tuần 44 (khác tuần → dây mới);
 * lô A3-2 (trùng) và lô mới B1; A3-2 có 2 dòng ở dây Đen 42 và đứt dây 4.
 */
function phieuChuyen2(): DgdvPhieuDayDu {
  const den42: FarmDgdvCot = { ...cot(1, 'p2'), stt: 2 };
  const den44: FarmDgdvCot = { ...cot(1, 'p2'), id: 'p2-c44', stt: 1, th_tuan: 44 };
  const a32: DgdvLoDayDu = {
    ...lo('M1', 'A3-2', 1, 'nv2', 4, [
      o('M1', 'p2-c1', 20, { stt_dong: 1, danh_gia: 'Thiếu lá' }),
      o('M1', 'p2-c1', 5, { stt_dong: 3 }),
      o('M1', 'p2-c44', 7),
    ]),
    id_phieu: 'p2',
    ghi_chu: null,
  };
  const b1: DgdvLoDayDu = { ...lo('M2', 'B1', 2, 'nv2', 0, [o('M2', 'p2-c44', 11, { so_luong_huy: 2 })]), id_phieu: 'p2' };
  return {
    ...phieuMau(),
    id: 'p2',
    chuyen: 2,
    trang_thai: 'khoa',
    tg_tao: '2026-10-21T00:30:00Z',
    tg_cap_nhat: '2026-10-21T05:00:00Z',
    cot: [den44, den42],
    lo: [b1, a32],
  };
}

describe('tổng theo ngày (khớp fn_dgdv_tong_ngay)', () => {
  it('FP5: A3-2 = 273 + 9 = 282, a2-3 = 43, a2-4 = 50, A3-3 = 25 → tổng thu 400, KSC 3', () => {
    const p = phieuMau();
    const luoi = dungLuoiNgay(p, mauTheoId, { nhanXeDoi: 'xé đôi' });
    const slTheoLo = Object.fromEntries(luoi.nhomToTruong.flatMap((g) => g.lo).map((l) => [l.ten_lo, l.slBuong]));
    expect(slTheoLo).toEqual({ 'A3-2': 282, 'a2-3': 43, 'a2-4': 50, 'A3-3': 25 });
    expect(luoi.tongThu).toBe(400);
    expect(luoi.ksc).toBe(3);
    expect([luoi.chuyen, luoi.ids_phieu]).toEqual([1, ['p1']]);
    expect(tongNgay([p], NGAY, 'cn1')).toEqual({ tongThu: 400, ksc: 3 });
  });

  it('cộng mọi chuyến cùng ngày + chi nhánh; khác chi nhánh / khác ngày không cộng', () => {
    const p1 = phieuMau();
    const p2 = phieuChuyen2();
    expect(tongPhieu(p2)).toEqual({ tongThu: 20 + 5 + 7 + 4 + 11, ksc: 2 });
    expect(tongNgay([p1, p2], NGAY, 'cn1')).toEqual({ tongThu: 447, ksc: 5 });
    expect(tongNgay([p1, p2], NGAY, 'cn2')).toEqual({ tongThu: 0, ksc: 0 });
    expect(tongNgay([p1, { ...p2, ngay: NGAY_KHAC }], NGAY_KHAC)).toEqual({ tongThu: 47, ksc: 2 });
  });

  it('tổng theo cột dây', () => {
    const t = tongCot(phieuMau());
    expect(t[C(1)]).toBe(13 + 24);
    expect(t[C(2)]).toBe(30 + 41);
    expect(t[C(3)]).toBe(32 + 50);
    expect(t[C(9)]).toBe(1);
  });

  it('dòng tổ trưởng gom lô theo tên tổ trưởng (không phân biệt hoa thường), xếp theo stt', () => {
    const g = tongToTruong(phieuMau());
    expect(g.map((x) => [x.ten_to_truong, x.ids_phieu_lo, x.slBuong, x.soLuongLoi])).toEqual([
      ['Tổ trưởng A', ['L1', 'L4'], 307, 2],
      ['Tổ trưởng B', ['L2', 'L3'], 93, 1],
    ]);
    expect(g[0].tongTheoCot[C(1)]).toBe(37);
  });
});

describe('cộng nhiều chuyến thành lưới tổng ngày', () => {
  it('gom dây theo (màu, xé đôi, tuần thu hoạch), lô theo id_lo; số khớp tổng ngày', () => {
    const [tong, ...thua] = congPhieuTheoNgay([phieuChuyen2(), phieuMau()]);
    expect(thua).toEqual([]);
    expect([tong.chuyen, tong.so_chuyen, tong.ids_phieu, tong.trang_thai]).toEqual([0, 2, ['p1', 'p2'], 'mo']);
    expect([tong.tg_tao, tong.tg_cap_nhat]).toEqual(['2026-10-21T00:30:00Z', '2026-10-21T05:00:00Z']);

    // 9 dây của chuyến 1 + dây Đen tuần 44 của chuyến 2 (Đen 42 trùng c1)
    expect(tong.cot).toHaveLength(10);
    expect(tong.cot.map((c) => c.stt)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
    expect(tong.cot[9]).toMatchObject({ id_mau_1: 'm1', th_tuan: 44 });
    // lô: 4 lô chuyến 1 (theo stt) + B1
    expect(tong.lo.map((l) => l.ten_lo)).toEqual(['A3-2', 'a2-3', 'a2-4', 'A3-3', 'B1']);

    const luoi = dungLuoiNgay(tong, mauTheoId, { nhanXeDoi: 'xé đôi' });
    expect({ tongThu: luoi.tongThu, ksc: luoi.ksc }).toEqual(tongNgay([phieuMau(), phieuChuyen2()], NGAY, 'cn1'));
    expect(luoi.ids_phieu).toEqual(['p1', 'p2']);
    // tổng từng chuyến (đầu khối «C1: … · C2: …») cộng lại đúng tổng ngày
    expect(luoi.dsChuyen.map((c) => [c.id_phieu, c.chuyen])).toEqual([['p1', 1], ['p2', 2]]);
    expect(luoi.dsChuyen[0]).toMatchObject(tongPhieu(phieuMau()));
    expect(luoi.dsChuyen.reduce((s, c) => s + c.tongThu, 0)).toBe(luoi.tongThu);

    const a32 = luoi.nhomToTruong.flatMap((g) => g.lo).find((l) => l.ten_lo === 'A3-2')!;
    // 273 + 9 (chuyến 1) + 20 + 5 + 7 + 4 (chuyến 2)
    expect(a32.slBuong).toBe(318);
    expect(a32.dutDay).toBe(13);
    // dây Đen 42: dòng 10, 3 (chuyến 1) rồi 20, 5 (chuyến 2) → stt 1..4, giữ đánh giá từng dòng
    const den42 = tong.cot[0].id;
    expect(a32.dong.map((d) => d.o[den42]?.so_luong)).toEqual([10, 3, 20, 5]);
    expect(a32.dong[2].o[den42].danh_gia).toBe('Thiếu lá');
    expect(a32.tongTheoCot[den42]).toBe(38);
    // tổ trưởng lấy bản đầu tiên có chữ (chuyến 1)
    expect(tong.lo[0].to_truong).toBe('Tổ trưởng A');
  });

  it('khác ngày hoặc chi nhánh → nhóm riêng; mọi chuyến đã khoá → tổng khoá', () => {
    const p2 = phieuChuyen2();
    const ds = congPhieuTheoNgay([phieuMau(), { ...p2, id_chi_nhanh: 'cn2' }, { ...p2, id: 'p3', ngay: NGAY_KHAC }]);
    expect(ds.map((p) => [p.ngay, p.id_chi_nhanh, p.ids_phieu, p.trang_thai])).toEqual([
      [NGAY, 'cn1', ['p1'], 'mo'],
      [NGAY, 'cn2', ['p2'], 'khoa'],
      [NGAY_KHAC, 'cn1', ['p3'], 'khoa'],
    ]);
  });
});

describe('mô hình lưới', () => {
  it('cột gom theo tuần thu hoạch, nhãn màu 1 - màu 2 + xé đôi; lô nhiều dòng', () => {
    const luoi = dungLuoiNgay(phieuMau(), mauTheoId, { nhanXeDoi: 'xé đôi' });
    expect(luoi.tuanThuHoach).toEqual([
      { nam: 2026, tuan: 42 },
      { nam: 2026, tuan: 43 },
      { nam: 2026, tuan: 45 },
    ]);
    expect(luoi.nhomCot.map((g) => g.cot.map((c) => c.stt))).toEqual([[1], [2, 3, 4, 5, 6, 7, 8], [9]]);
    expect(luoi.cot[0].nhan).toBe('Đen');
    expect(luoi.cot[8].nhan).toBe('Tím - Cam xé đôi');
    expect(luoi.cot[8].ma_mau_2).toBe('#000008');

    const a32 = luoi.nhomToTruong[0].lo[0];
    expect(a32.dong.map((d) => d.stt_dong)).toEqual([1, 2]);
    expect(a32.dong[1].o[C(1)].so_luong).toBe(3);
    expect(a32.tongTheoCot[C(1)]).toBe(13);
    // lô chỉ có 1 dòng vẫn đủ số dòng tối thiểu
    expect(luoi.nhomToTruong[1].lo[0].dong).toHaveLength(1);
  });

  it('khoảng ngày: mỗi ngày một khối, mỗi chuyến một lưới hoặc gộp chuyến', () => {
    const ds = [phieuChuyen2(), phieuMau()];
    const khoi = dungLuoiKhoangNgay(ds, NGAY, NGAY_KHAC, mauTheoId, { nhanXeDoi: 'xé đôi' });
    expect(khoi.map((k) => [k.ngay, k.luoi.map((l) => l.chuyen)])).toEqual([
      [NGAY, [1, 2]],
      [NGAY_KHAC, []],
    ]);
    const gop = dungLuoiKhoangNgay(ds, NGAY, NGAY, mauTheoId, { nhanXeDoi: 'xé đôi', gopChuyen: true });
    expect(gop[0].luoi.map((l) => [l.chuyen, l.tongThu])).toEqual([[0, 447]]);
  });
});

describe('sao chép sang chuyến mới', () => {
  it('mặc định cùng ngày, chuyến kế tiếp; giữ lô + tổ trưởng + ghi chú lô, dây giữ tuần thu hoạch, không chép số', () => {
    const f = dungPhieuSaoChep(phieuMau());
    expect([f.ngay, f.chuyen, f.id_chi_nhanh, f.ghi_chu]).toEqual([NGAY, 2, 'cn1', null]);
    expect(f.lo).toEqual([
      { ten_lo: 'A3-2', to_truong: 'Tổ trưởng A', ghi_chu: 'ghi chú A3-2' },
      { ten_lo: 'a2-3', to_truong: 'Tổ trưởng B', ghi_chu: 'ghi chú a2-3' },
      { ten_lo: 'a2-4', to_truong: 'Tổ trưởng B', ghi_chu: 'ghi chú a2-4' },
      { ten_lo: 'A3-3', to_truong: ' tổ trưởng  a ', ghi_chu: 'ghi chú A3-3' },
    ]);
    expect(f.cot).toHaveLength(9);
    expect(f.cot[0]).toEqual({ th_nam: 2026, th_tuan: 42, id_mau_1: 'm1', id_mau_2: null, xe_doi: false });
    expect(f.cot[8]).toMatchObject({ id_mau_1: 'm8', id_mau_2: 'm9', xe_doi: true });
    expect(f.cot.some((c) => 'id' in c)).toBe(false);
    expect(dungPhieuSaoChep(phieuMau(), { ngay: NGAY_KHAC, chuyen: 1 })).toMatchObject({ ngay: NGAY_KHAC, chuyen: 1 });
  });
});

describe('kiểm tra số lượng lỗi', () => {
  it('cảnh báo ô có số lỗi > số lượng, không ném lỗi', () => {
    const p = phieuMau();
    expect(kiemTraSoLuongLoi(p)).toEqual([]);
    p.lo[0].dong[0].so_luong_huy = 30;
    expect(kiemTraSoLuongLoi(p)).toEqual([
      { id_phieu_lo: 'L4', id_cot: C(1), ngay: NGAY, stt_dong: 1, so_luong: 24, so_luong_huy: 30 },
    ]);
  });
});
