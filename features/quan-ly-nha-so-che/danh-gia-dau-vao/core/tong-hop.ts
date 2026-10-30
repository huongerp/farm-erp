/**
 * Tổng hợp ngày / tuần / so sánh tháng của Đánh giá đầu vào — thuần, không React, không gọi db.
 * Danh sách tab ngày gom từ phiếu đầy đủ (`tongHopNgayChiNhanh`), tab tuần từ view tổng ngày × dây
 * (`tongHopTuanChiNhanh`); chip lọc Trạng thái / Có KSC / Tổ trưởng lọc tại chỗ trên dữ liệu đã tải.
 *
 * Nguồn (migration 057, đã cộng mọi chuyến ở DB):
 *   - tuần: view `v_fp_farm_dgdv_tong_ngay_day` — ngày × chi nhánh × lô × dây; dòng `id_mau_1` null = đứt dây.
 *   - tháng: view `v_fp_farm_dgdv_tong_chuyen` — 1 dòng / phiếu (chuyến).
 * Tổng thu = Σ so_luong (gồm dòng đứt dây), KSC = Σ so_luong_huy — khớp `fn_dgdv_tong_ngay`.
 */
import type { DgdvPhieuDayDu, TuanFarm } from './types';
import { TRANG_THAI_DGDV } from './types';
import { khoaDay, tongPhieu } from './bang-tinh';
import { gonTen, khoaTen } from './chuan-hoa-ten';
import { soSanhTuan, tuanChichBapTuThuHoach } from './tuan';

export interface TongThuKsc {
  tongThu: number;
  ksc: number;
}

/** % KSC = KSC / Tổng thu × 100; tổng thu 0 → null. */
export function tiLeKsc(ksc: number, tongThu: number): number | null {
  return tongThu > 0 ? (ksc / tongThu) * 100 : null;
}

const soSanhTen = (a: string | null, b: string | null) =>
  (a ?? '').localeCompare(b ?? '', 'vi', { numeric: true, sensitivity: 'base' });

/** Thứ tự chi nhánh: theo `thuTuCn` trước, chi nhánh lạ xếp sau theo id. */
function hamThuTuCn(thuTuCn: readonly string[]) {
  const viTri = new Map(thuTuCn.map((id, i) => [id, i]));
  return (a: string, b: string) =>
    (viTri.get(a) ?? Infinity) - (viTri.get(b) ?? Infinity) || a.localeCompare(b, 'vi', { numeric: true });
}

// ---- Tổng hợp tuần ---------------------------------------------------------------

/** Dòng view tổng ngày × dây (các trường cần cho tổng hợp — `DgdvTongNgayDay` của service khớp). */
export interface DgdvDongNgayDay {
  ngay: string;
  id_chi_nhanh: string;
  id_lo: string;
  ten_lo: string | null;
  to_truong: string | null;
  id_mau_1: string | null;
  id_mau_2: string | null;
  xe_doi: boolean;
  th_nam: number | null;
  th_tuan: number | null;
  so_luong: number;
  so_luong_huy: number;
}

export interface DgdvTuanLo extends TongThuKsc {
  id_lo: string;
  id_chi_nhanh: string;
  ten_lo: string | null;
  /** tổng thu từng ngày, cùng thứ tự `ngays` */
  theoNgay: number[];
}

export interface DgdvTuanToTruong extends TongThuKsc {
  /** khoá nhóm: chi nhánh + tên tổ trưởng đã chuẩn hoá */
  khoa: string;
  id_chi_nhanh: string;
  ten_to_truong: string | null;
  theoNgay: number[];
  lo: DgdvTuanLo[];
}

export interface DgdvTongHopTuan extends TongThuKsc {
  ngays: string[];
  theoNgay: number[];
  toTruong: DgdvTuanToTruong[];
}

/**
 * Bảng tuần: tổ trưởng → lô × các ngày (`ngays`, thường 7 ngày T2→CN). Dòng ngoài `ngays` bị bỏ.
 * - Tổ trưởng của lô = tên có chữ ở ngày GẦN NHẤT trong tuần (người đang phụ trách).
 * - Nhóm theo (chi nhánh, tên tổ trưởng không phân biệt hoa thường); lô xếp theo chi nhánh rồi tên lô
 *   (số tự nhiên: «Lô 2» trước «Lô 10»); nhóm xếp theo lô đầu tiên của nhóm.
 */
export function tongHopTuanTheoLo(
  rows: readonly DgdvDongNgayDay[],
  ngays: readonly string[],
  thuTuCn: readonly string[] = []
): DgdvTongHopTuan {
  const viTriNgay = new Map(ngays.map((n, i) => [n, i]));
  const loTheoKhoa = new Map<string, DgdvTuanLo & { toTruong: string | null; ngayToTruong: string }>();
  const theoNgay = ngays.map(() => 0);
  let tongThu = 0;
  let ksc = 0;

  for (const r of rows) {
    const i = viTriNgay.get(r.ngay);
    if (i == null) continue;
    const k = `${r.id_chi_nhanh}|${r.id_lo}`;
    let lo = loTheoKhoa.get(k);
    if (!lo) {
      lo = {
        id_lo: r.id_lo,
        id_chi_nhanh: r.id_chi_nhanh,
        ten_lo: r.ten_lo,
        theoNgay: ngays.map(() => 0),
        tongThu: 0,
        ksc: 0,
        toTruong: null,
        ngayToTruong: '',
      };
      loTheoKhoa.set(k, lo);
    }
    if (!lo.ten_lo && r.ten_lo) lo.ten_lo = r.ten_lo;
    if (gonTen(r.to_truong) && r.ngay >= lo.ngayToTruong) {
      lo.toTruong = gonTen(r.to_truong);
      lo.ngayToTruong = r.ngay;
    }
    lo.theoNgay[i] += r.so_luong;
    lo.tongThu += r.so_luong;
    lo.ksc += r.so_luong_huy;
    theoNgay[i] += r.so_luong;
    tongThu += r.so_luong;
    ksc += r.so_luong_huy;
  }

  const soSanhCn = hamThuTuCn(thuTuCn);
  const dsLo = [...loTheoKhoa.values()].sort(
    (a, b) => soSanhCn(a.id_chi_nhanh, b.id_chi_nhanh) || soSanhTen(a.ten_lo, b.ten_lo) || a.id_lo.localeCompare(b.id_lo)
  );

  const nhom = new Map<string, DgdvTuanToTruong>();
  for (const { toTruong, ngayToTruong: _bo, ...lo } of dsLo) {
    const k = `${lo.id_chi_nhanh}|${khoaTen(toTruong)}`;
    let g = nhom.get(k);
    if (!g) {
      g = { khoa: k, id_chi_nhanh: lo.id_chi_nhanh, ten_to_truong: toTruong, theoNgay: ngays.map(() => 0), tongThu: 0, ksc: 0, lo: [] };
      nhom.set(k, g);
    }
    g.lo.push(lo);
    lo.theoNgay.forEach((v, i) => (g.theoNgay[i] += v));
    g.tongThu += lo.tongThu;
    g.ksc += lo.ksc;
  }

  return { ngays: [...ngays], theoNgay, tongThu, ksc, toTruong: [...nhom.values()] };
}

export interface DgdvTuanDay extends TongThuKsc {
  /** `khoaDay`; dòng đứt dây = 'dut-day' */
  khoa: string;
  /** null = đứt dây (không có dây / tuần thu hoạch) */
  id_mau_1: string | null;
  id_mau_2: string | null;
  xe_doi: boolean;
  tuanThuHoach: TuanFarm | null;
  /** tuần thu hoạch − 9 */
  tuanChichBap: TuanFarm | null;
}

export const KHOA_DUT_DAY = 'dut-day';

/**
 * Bảng tuần theo dây: gom màu 1 + màu 2 + xé đôi + tuần thu hoạch (như lưới), cộng mọi lô / ngày / chi nhánh.
 * Xếp theo tuần thu hoạch tăng dần (cùng tuần giữ thứ tự gặp đầu tiên); dây thiếu tuần sau cùng; đứt dây cuối.
 */
export function tongHopTuanTheoDay(rows: readonly DgdvDongNgayDay[]): DgdvTuanDay[] {
  const m = new Map<string, DgdvTuanDay>();
  for (const r of rows) {
    const laDut = r.id_mau_1 == null;
    const k = laDut
      ? KHOA_DUT_DAY
      : khoaDay({ id_mau_1: r.id_mau_1!, id_mau_2: r.id_mau_2, xe_doi: r.xe_doi, th_nam: r.th_nam ?? 0, th_tuan: r.th_tuan ?? 0 });
    let d = m.get(k);
    if (!d) {
      const tuanThuHoach = !laDut && r.th_nam && r.th_tuan ? { nam: r.th_nam, tuan: r.th_tuan } : null;
      d = {
        khoa: k,
        id_mau_1: r.id_mau_1,
        id_mau_2: laDut ? null : r.id_mau_2,
        xe_doi: !laDut && r.xe_doi,
        tuanThuHoach,
        tuanChichBap: tuanThuHoach ? tuanChichBapTuThuHoach(tuanThuHoach) : null,
        tongThu: 0,
        ksc: 0,
      };
      m.set(k, d);
    }
    d.tongThu += r.so_luong;
    d.ksc += r.so_luong_huy;
  }
  const hang = (d: DgdvTuanDay) => (d.id_mau_1 == null ? 2 : d.tuanThuHoach ? 0 : 1);
  // sort ổn định → cùng tuần giữ thứ tự gặp đầu tiên
  return [...m.values()].sort(
    (a, b) => hang(a) - hang(b) || (a.tuanThuHoach && b.tuanThuHoach ? soSanhTuan(a.tuanThuHoach, b.tuanThuHoach) : 0)
  );
}

export interface DgdvTuanChiNhanh extends TongThuKsc {
  id_chi_nhanh: string;
  theoNgay: number[];
}

/** Bảng chi nhánh × ngày (dùng khi xem tất cả chi nhánh). Chỉ chi nhánh có số trong tuần, xếp theo `thuTuCn`. */
export function tongHopTuanTheoChiNhanh(
  rows: readonly DgdvDongNgayDay[],
  ngays: readonly string[],
  thuTuCn: readonly string[] = []
): DgdvTuanChiNhanh[] {
  const viTriNgay = new Map(ngays.map((n, i) => [n, i]));
  const m = new Map<string, DgdvTuanChiNhanh>();
  const lay = (id: string) => {
    let c = m.get(id);
    if (!c) {
      c = { id_chi_nhanh: id, theoNgay: ngays.map(() => 0), tongThu: 0, ksc: 0 };
      m.set(id, c);
    }
    return c;
  };
  for (const r of rows) {
    const i = viTriNgay.get(r.ngay);
    if (i == null) continue;
    const c = lay(r.id_chi_nhanh);
    c.theoNgay[i] += r.so_luong;
    c.tongThu += r.so_luong;
    c.ksc += r.so_luong_huy;
  }
  const soSanhCn = hamThuTuCn(thuTuCn);
  return [...m.values()].sort((a, b) => soSanhCn(a.id_chi_nhanh, b.id_chi_nhanh));
}

// ---- Danh sách tổng hợp ngày / tuần (tab «Tổng hợp ngày», «Tổng hợp tuần») -------------------

/** Chip «Có KSC»: `co` = có buồng lỗi (KSC > 0), `khong` = không lỗi. */
export const LOC_KSC = { CO: 'co', KHONG: 'khong' } as const;
/** Chip «Trạng thái» của dòng ngày: `khoa` = mọi chuyến đã khoá, `mo` = còn chuyến mở. */
export const LOC_TRANG_THAI_NGAY = { KHOA: 'khoa', MO: 'mo' } as const;

/** Rỗng hoặc chọn cả hai = không lọc. */
export function khopLocKsc(ksc: number, loc: readonly string[]): boolean {
  if (loc.length === 0) return true;
  return loc.includes(ksc > 0 ? LOC_KSC.CO : LOC_KSC.KHONG);
}

export interface DgdvToTruongTuyChon {
  /** `khoaTen` của tên */
  khoa: string;
  ten: string;
}

/** Tổ trưởng có trong dữ liệu (bỏ trống), gom không phân biệt hoa thường, xếp theo tên. */
export function dsToTruong(tenCacDong: readonly (string | null | undefined)[]): DgdvToTruongTuyChon[] {
  const m = new Map<string, string>();
  for (const ten of tenCacDong) {
    const g = gonTen(ten);
    if (g && !m.has(khoaTen(g))) m.set(khoaTen(g), g);
  }
  return [...m.entries()].map(([khoa, ten]) => ({ khoa, ten })).sort((a, b) => soSanhTen(a.ten, b.ten));
}

/**
 * Lọc tổ trưởng ở mức LÔ: mỗi phiếu chỉ giữ lô có tổ trưởng thuộc `toTruong` (khoá `khoaTen`), phiếu không còn
 * lô nào thì bỏ. Rỗng = giữ nguyên mảng.
 */
export function locPhieuTheoToTruong(dsPhieu: DgdvPhieuDayDu[], toTruong: readonly string[]): DgdvPhieuDayDu[] {
  if (toTruong.length === 0) return dsPhieu;
  const cho = new Set(toTruong);
  return dsPhieu.flatMap((p) => {
    const lo = p.lo.filter((l) => cho.has(khoaTen(l.to_truong)));
    return lo.length > 0 ? [{ ...p, lo }] : [];
  });
}

/** Lọc dòng view tổng ngày × dây theo tổ trưởng (khoá `khoaTen`). Rỗng = giữ nguyên. */
export function locDongTheoToTruong<T extends { to_truong: string | null }>(rows: readonly T[], toTruong: readonly string[]): readonly T[] {
  if (toTruong.length === 0) return rows;
  const cho = new Set(toTruong);
  return rows.filter((r) => cho.has(khoaTen(r.to_truong)));
}

export interface DgdvNgayChiNhanh extends TongThuKsc {
  /** `ngay|id_chi_nhanh` */
  khoa: string;
  ngay: string;
  /** tuần farm của ngày */
  nam: number;
  tuan: number;
  id_chi_nhanh: string;
  ten_chi_nhanh: string | null;
  soChuyen: number;
  /** mọi chuyến của ngày đã khoá */
  daKhoaHet: boolean;
  /** id phiếu (chuyến) theo số chuyến */
  ids_phieu: string[];
}

/**
 * Danh sách tab «Tổng hợp ngày»: mỗi (ngày, chi nhánh) một dòng — cộng mọi chuyến như `fn_dgdv_tong_ngay`.
 * Xếp ngày mới trước, trong ngày theo `thuTuCn` (chi nhánh lạ sau, theo id).
 */
export function tongHopNgayChiNhanh(dsPhieu: readonly DgdvPhieuDayDu[], thuTuCn: readonly string[] = []): DgdvNgayChiNhanh[] {
  const m = new Map<string, DgdvNgayChiNhanh & { _chuyen: { id: string; chuyen: number }[] }>();
  for (const p of dsPhieu) {
    const k = `${p.ngay}|${p.id_chi_nhanh}`;
    let g = m.get(k);
    if (!g) {
      g = {
        khoa: k,
        ngay: p.ngay,
        nam: p.nam,
        tuan: p.tuan,
        id_chi_nhanh: p.id_chi_nhanh,
        ten_chi_nhanh: p.ten_chi_nhanh ?? null,
        soChuyen: 0,
        daKhoaHet: true,
        ids_phieu: [],
        tongThu: 0,
        ksc: 0,
        _chuyen: [],
      };
      m.set(k, g);
    }
    const tp = tongPhieu(p);
    g.tongThu += tp.tongThu;
    g.ksc += tp.ksc;
    g.soChuyen += 1;
    g.daKhoaHet = g.daKhoaHet && p.trang_thai === TRANG_THAI_DGDV.KHOA;
    g._chuyen.push({ id: p.id, chuyen: p.chuyen });
  }
  const soSanhCn = hamThuTuCn(thuTuCn);
  return [...m.values()]
    .map(({ _chuyen, ...g }) => ({ ...g, ids_phieu: [..._chuyen].sort((a, b) => a.chuyen - b.chuyen).map((c) => c.id) }))
    .sort((a, b) => b.ngay.localeCompare(a.ngay) || soSanhCn(a.id_chi_nhanh, b.id_chi_nhanh));
}

/** Chip Trạng thái + Có KSC của tab ngày (rỗng = không lọc). */
export function locNgayChiNhanh(
  rows: readonly DgdvNgayChiNhanh[],
  loc: { trangThai: readonly string[]; ksc: readonly string[] }
): DgdvNgayChiNhanh[] {
  return rows.filter(
    (r) =>
      (loc.trangThai.length === 0 || loc.trangThai.includes(r.daKhoaHet ? LOC_TRANG_THAI_NGAY.KHOA : LOC_TRANG_THAI_NGAY.MO)) &&
      khopLocKsc(r.ksc, loc.ksc)
  );
}

export interface DgdvTuanChiNhanhDong extends DgdvTuanChiNhanh {
  /** số ngày trong tuần có tổng thu > 0 */
  soNgayCoSo: number;
  /** số chuyến (phiếu) của chi nhánh trong tuần */
  soChuyen: number;
}

/**
 * Danh sách tab «Tổng hợp tuần»: mỗi chi nhánh có số trong tuần một dòng (cột T2→CN như
 * `tongHopTuanTheoChiNhanh`) + số ngày có số + số chuyến (đếm `dsChuyen` có ngày trong `ngays`).
 */
export function tongHopTuanChiNhanh(
  rows: readonly DgdvDongNgayDay[],
  ngays: readonly string[],
  thuTuCn: readonly string[] = [],
  dsChuyen: readonly Pick<DgdvDongChuyen, 'ngay' | 'id_chi_nhanh'>[] = []
): DgdvTuanChiNhanhDong[] {
  const coNgay = new Set(ngays);
  const demChuyen = new Map<string, number>();
  for (const c of dsChuyen) if (coNgay.has(c.ngay)) demChuyen.set(c.id_chi_nhanh, (demChuyen.get(c.id_chi_nhanh) ?? 0) + 1);
  return tongHopTuanTheoChiNhanh(rows, ngays, thuTuCn).map((c) => ({
    ...c,
    soNgayCoSo: c.theoNgay.filter((v) => v > 0).length,
    soChuyen: demChuyen.get(c.id_chi_nhanh) ?? 0,
  }));
}

// ---- So sánh tháng ---------------------------------------------------------------

/** Dòng view tổng chuyến (các trường cần — `DgdvTongChuyen` của service khớp). */
export interface DgdvDongChuyen {
  ngay: string;
  id_chi_nhanh: string;
  tong_thu: number;
  ksc: number;
}

const THANG_RE = /^(\d{4})-(\d{2})$/;

/** Tháng 'YYYY-MM' cách `buoc` tháng (âm = lùi). */
export function congThang(thang: string, buoc: number): string {
  const m = THANG_RE.exec(thang);
  if (!m) throw new Error(`Tháng không hợp lệ (cần YYYY-MM): ${thang}`);
  const tong = Number(m[1]) * 12 + Number(m[2]) - 1 + buoc;
  return `${Math.floor(tong / 12)}-${String((tong % 12) + 1).padStart(2, '0')}`;
}

/** `soThang` tháng liên tiếp, tăng dần, kết thúc ở `thangCuoi`. */
export function cacThangKetThuc(thangCuoi: string, soThang: number): string[] {
  return Array.from({ length: soThang }, (_, i) => congThang(thangCuoi, i - soThang + 1));
}

/** Ngày cuối tháng 'YYYY-MM-DD'. */
export function ngayCuoiThang(thang: string): string {
  const [y, m] = thang.split('-').map(Number);
  const d = new Date(Date.UTC(y, m, 0)).getUTCDate();
  return `${thang}-${String(d).padStart(2, '0')}`;
}

/** Khoảng ngày cần tải cho các tháng — gồm cả tháng liền trước tháng đầu (để tính chênh lệch). */
export function khoangTaiThang(dsThang: readonly string[]): { tu: string; den: string } {
  if (dsThang.length === 0) return { tu: '', den: '' };
  return { tu: `${congThang(dsThang[0], -1)}-01`, den: ngayCuoiThang(dsThang[dsThang.length - 1]) };
}

export interface DgdvThangChiNhanh extends TongThuKsc {
  thang: string;
  /** null = tổng mọi chi nhánh của tháng */
  id_chi_nhanh: string | null;
  soChuyen: number;
  /** số ngày có ít nhất một chuyến */
  soNgayCoNhap: number;
  /** tổng thu / số ngày có nhập; không có ngày nào → null */
  tbThuNgay: number | null;
  /** tổng thu − tổng thu tháng trước; tháng trước 0 → null */
  chenh: number | null;
  /** chênh / tổng thu tháng trước × 100; tháng trước 0 → null */
  chenhPt: number | null;
}

export interface DgdvSoSanhThang {
  /** tháng tăng dần × chi nhánh theo thứ tự */
  theoChiNhanh: DgdvThangChiNhanh[];
  /** một dòng tổng / tháng (id_chi_nhanh null) */
  tongThang: DgdvThangChiNhanh[];
  /** id chi nhánh có mặt, theo thứ tự hiển thị */
  dsChiNhanh: string[];
}

interface GioThang {
  tongThu: number;
  ksc: number;
  soChuyen: number;
  ngay: Set<string>;
}

/**
 * Gom chuyến theo tháng (theo `ngay` của chuyến) × chi nhánh. Mỗi chi nhánh có số trong kỳ (xếp theo
 * `thuTuCn`) có dòng ở mọi tháng — tháng không có phiếu là dòng 0. Chênh lệch so với tháng liền trước cùng chi nhánh: cần
 * truyền `rows` gồm cả tháng trước tháng đầu (xem `khoangTaiThang`), tháng trước 0 → «không so được» (null).
 */
export function tongHopThang(
  rows: readonly DgdvDongChuyen[],
  dsThang: readonly string[],
  thuTuCn: readonly string[] = []
): DgdvSoSanhThang {
  if (dsThang.length === 0) return { theoChiNhanh: [], tongThang: [], dsChiNhanh: [] };
  const cacThang = [congThang(dsThang[0], -1), ...dsThang];
  const coThang = new Set(cacThang);
  const gio = new Map<string, GioThang>();
  // Chỉ chi nhánh có số trong kỳ (kể cả tháng trước để so) — 16 chi nhánh toàn 0 chỉ làm loãng bảng.
  const cnCo = new Set<string>();
  const lay = (k: string) => {
    let g = gio.get(k);
    if (!g) {
      g = { tongThu: 0, ksc: 0, soChuyen: 0, ngay: new Set() };
      gio.set(k, g);
    }
    return g;
  };

  for (const r of rows) {
    const thang = r.ngay.slice(0, 7);
    if (!coThang.has(thang)) continue;
    cnCo.add(r.id_chi_nhanh);
    for (const k of [`${thang}|${r.id_chi_nhanh}`, `${thang}|`]) {
      const g = lay(k);
      g.tongThu += r.tong_thu;
      g.ksc += r.ksc;
      g.soChuyen += 1;
      g.ngay.add(r.ngay);
    }
  }

  const dsChiNhanh = [...cnCo].sort(hamThuTuCn(thuTuCn));
  const dong = (thang: string, idCn: string | null): DgdvThangChiNhanh => {
    const g = gio.get(`${thang}|${idCn ?? ''}`);
    const truoc = gio.get(`${congThang(thang, -1)}|${idCn ?? ''}`)?.tongThu ?? 0;
    const tongThu = g?.tongThu ?? 0;
    const soNgayCoNhap = g?.ngay.size ?? 0;
    const chenh = truoc > 0 ? tongThu - truoc : null;
    return {
      thang,
      id_chi_nhanh: idCn,
      tongThu,
      ksc: g?.ksc ?? 0,
      soChuyen: g?.soChuyen ?? 0,
      soNgayCoNhap,
      tbThuNgay: soNgayCoNhap > 0 ? tongThu / soNgayCoNhap : null,
      chenh,
      chenhPt: chenh != null ? (chenh / truoc) * 100 : null,
    };
  };

  return {
    theoChiNhanh: dsThang.flatMap((thang) => dsChiNhanh.map((id) => dong(thang, id))),
    tongThang: dsThang.map((thang) => dong(thang, null)),
    dsChiNhanh,
  };
}
