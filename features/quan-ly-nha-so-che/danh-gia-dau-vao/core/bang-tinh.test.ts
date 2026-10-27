import { describe, expect, it } from 'vitest';
import {
  dungLuoiKhoangNgay,
  dungLuoiNgay,
  dungPhieuSaoChep,
  kiemTraSoLuongLoi,
  taoMapMau,
  tongCotNgay,
  tongNgay,
  tongToTruongNgay,
} from './bang-tinh';
import type { DgdvLoDayDu, DgdvPhieuDayDu, FarmDgdvCot, FarmDgdvDong, VarMauDay } from './types';

// Số mẫu báo cáo FP5, phiếu tuần 43/2026 (19/10 – 25/10), ngày 21/10.
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
function cot(i: number): FarmDgdvCot {
  const thu = i === 1 ? '2026-10-12' : i === 9 ? '2026-11-02' : '2026-10-19';
  return {
    id: `c${i}`,
    id_phieu: 'p1',
    stt: i,
    chich_bap_tu: null,
    chich_bap_den: null,
    thu_hoach_tu: thu,
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
    so_luong_loi: 0,
    ly_do_loi: null,
    ...extra,
  };
}

function lo(id: string, ten: string, stt: number, toTruong: string, dutDay: number, dong: FarmDgdvDong[]): DgdvLoDayDu {
  return {
    id,
    id_phieu: 'p1',
    id_lo: `lo-${id}`,
    id_to_truong: toTruong,
    ten_to_truong: toTruong === 'nv1' ? 'Tổ trưởng A' : 'Tổ trưởng B',
    ghi_chu: `ghi chú ${ten}`,
    stt,
    ten_lo: ten,
    lo_ngay: [{ id: `n-${id}`, id_phieu_lo: id, ngay: NGAY, dut_day: dutDay }],
    dong,
  };
}

const SO_A32 = [13, 30, 32, 53, 83, 42, 7, 12, 1];

function phieuMau(): DgdvPhieuDayDu {
  const a32 = lo('L1', 'A3-2', 1, 'nv1', 9, [
    // dây 1 chia 2 dòng: 10 + 3 = 13
    o('L1', 'c1', 10),
    o('L1', 'c1', 3, { stt_dong: 2 }),
    ...SO_A32.slice(1).map((sl, i) => o('L1', `c${i + 2}`, sl, i + 2 === 5 ? { so_luong_loi: 2, ly_do_loi: 'Chín bệnh' } : {})),
    // ngày khác — không được cộng vào 21/10
    o('L1', 'c1', 100, { ngay: NGAY_KHAC }),
  ]);
  a32.lo_ngay.push({ id: 'n-L1-b', id_phieu_lo: 'L1', ngay: NGAY_KHAC, dut_day: 5 });
  return {
    id: 'p1',
    nam: 2026,
    tuan: 43,
    id_chi_nhanh: 'cn1',
    ghi_chu: 'ghi chú phiếu',
    trang_thai: 'mo',
    id_nguoi_tao: null,
    tg_tao: '',
    tg_cap_nhat: '',
    cot: Array.from({ length: 9 }, (_, i) => cot(i + 1)),
    // stt xen kẽ tổ trưởng để thử gom nhóm
    lo: [
      lo('L4', 'A3-3', 4, 'nv1', 1, [o('L4', 'c1', 24)]),
      a32,
      lo('L2', 'a2-3', 2, 'nv2', 2, [o('L2', 'c2', 41)]),
      lo('L3', 'a2-4', 3, 'nv2', 0, [o('L3', 'c3', 50, { so_luong_loi: 1 })]),
    ],
  };
}

describe('tổng theo ngày (khớp fn_dgdv_tong_ngay)', () => {
  it('FP5: A3-2 = 273 + 9 = 282, a2-3 = 43, a2-4 = 50, A3-3 = 25 → tổng thu 400, KSC 3', () => {
    const p = phieuMau();
    const luoi = dungLuoiNgay(p, NGAY, mauTheoId, { nhanXeDoi: 'xé đôi' });
    const slTheoLo = Object.fromEntries(luoi.nhomToTruong.flatMap((g) => g.lo).map((l) => [l.ten_lo, l.slBuong]));
    expect(slTheoLo).toEqual({ 'A3-2': 282, 'a2-3': 43, 'a2-4': 50, 'A3-3': 25 });
    expect(luoi.tongThu).toBe(400);
    expect(luoi.ksc).toBe(3);
    expect(tongNgay([p], NGAY, 'cn1')).toEqual({ tongThu: 400, ksc: 3 });
  });

  it('chỉ cộng phiếu đúng chi nhánh và đúng tuần chứa ngày', () => {
    const p = phieuMau();
    expect(tongNgay([p], NGAY, 'cn2')).toEqual({ tongThu: 0, ksc: 0 });
    expect(tongNgay([{ ...p, tuan: 44 }], NGAY, 'cn1')).toEqual({ tongThu: 0, ksc: 0 });
    expect(tongNgay([p], NGAY_KHAC, 'cn1')).toEqual({ tongThu: 105, ksc: 0 });
  });

  it('tổng theo cột dây × ngày', () => {
    const t = tongCotNgay(phieuMau(), NGAY);
    expect(t.c1).toBe(13 + 24);
    expect(t.c2).toBe(30 + 41);
    expect(t.c3).toBe(32 + 50);
    expect(t.c9).toBe(1);
  });

  it('dòng tổ trưởng gom lô theo id_to_truong, xếp theo stt', () => {
    const g = tongToTruongNgay(phieuMau(), NGAY);
    expect(g.map((x) => [x.ten_to_truong, x.ids_phieu_lo, x.slBuong, x.soLuongLoi])).toEqual([
      ['Tổ trưởng A', ['L1', 'L4'], 307, 2],
      ['Tổ trưởng B', ['L2', 'L3'], 93, 1],
    ]);
    expect(g[0].tongTheoCot.c1).toBe(37);
  });
});

describe('mô hình lưới', () => {
  it('cột gom theo tuần thu hoạch, nhãn màu 1 - màu 2 + xé đôi; lô nhiều dòng', () => {
    const luoi = dungLuoiNgay(phieuMau(), NGAY, mauTheoId, { nhanXeDoi: 'xé đôi' });
    expect(luoi.tuanThuHoach).toEqual([
      { nam: 2026, tuan: 42 },
      { nam: 2026, tuan: 43 },
      { nam: 2026, tuan: 45 },
    ]);
    expect(luoi.nhomCot.map((g) => g.cot.map((c) => c.id))).toEqual([
      ['c1'],
      ['c2', 'c3', 'c4', 'c5', 'c6', 'c7', 'c8'],
      ['c9'],
    ]);
    expect(luoi.cot[0].nhan).toBe('Đen');
    expect(luoi.cot[8].nhan).toBe('Tím - Cam xé đôi');
    expect(luoi.cot[8].ma_mau_2).toBe('#000008');

    const a32 = luoi.nhomToTruong[0].lo[0];
    expect(a32.dong.map((d) => d.stt_dong)).toEqual([1, 2]);
    expect(a32.dong[1].o.c1.so_luong).toBe(3);
    expect(a32.tongTheoCot.c1).toBe(13);
    // lô chỉ có 1 dòng vẫn đủ số dòng tối thiểu
    expect(luoi.nhomToTruong[1].lo[0].dong).toHaveLength(1);
  });

  it('khoảng ngày: mỗi ngày một khối, ngày ngoài tuần phiếu thì rỗng', () => {
    const khoi = dungLuoiKhoangNgay([phieuMau()], '2026-10-25', '2026-10-26', mauTheoId, { nhanXeDoi: 'xé đôi' });
    expect(khoi.map((k) => [k.ngay, k.luoi.length])).toEqual([
      ['2026-10-25', 1],
      ['2026-10-26', 0],
    ]);
  });
});

describe('sao chép sang tuần mới', () => {
  it('tuần 53/2026 → 1/2027; giữ lô + tổ trưởng + ghi chú lô, dời ngày dây +7, không chép số', () => {
    const f = dungPhieuSaoChep({ ...phieuMau(), tuan: 53 });
    expect([f.nam, f.tuan, f.id_chi_nhanh, f.ghi_chu]).toEqual([2027, 1, 'cn1', null]);
    expect(f.lo).toEqual([
      { id_lo: 'lo-L1', id_to_truong: 'nv1', ghi_chu: 'ghi chú A3-2' },
      { id_lo: 'lo-L2', id_to_truong: 'nv2', ghi_chu: 'ghi chú a2-3' },
      { id_lo: 'lo-L3', id_to_truong: 'nv2', ghi_chu: 'ghi chú a2-4' },
      { id_lo: 'lo-L4', id_to_truong: 'nv1', ghi_chu: 'ghi chú A3-3' },
    ]);
    expect(f.cot).toHaveLength(9);
    expect(f.cot[0]).toEqual({
      chich_bap_tu: null,
      chich_bap_den: null,
      thu_hoach_tu: '2026-10-19',
      thu_hoach_den: null,
      id_mau_1: 'm1',
      id_mau_2: null,
      xe_doi: false,
    });
    expect(f.cot[8]).toMatchObject({ id_mau_1: 'm8', id_mau_2: 'm9', xe_doi: true });
    expect(f.cot.some((c) => 'id' in c)).toBe(false);
  });
});

describe('kiểm tra số lượng lỗi', () => {
  it('cảnh báo ô có số lỗi > số lượng, không ném lỗi', () => {
    const p = phieuMau();
    expect(kiemTraSoLuongLoi(p)).toEqual([]);
    p.lo[0].dong[0].so_luong_loi = 30;
    expect(kiemTraSoLuongLoi(p)).toEqual([
      { id_phieu_lo: 'L4', id_cot: 'c1', ngay: NGAY, stt_dong: 1, so_luong: 24, so_luong_loi: 30 },
    ]);
  });
});
