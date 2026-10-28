/**
 * Logic lưới Đánh giá đầu vào — thuần, không React, không gọi db.
 *
 * Mô hình (migration 057): 1 phiếu = 1 CHUYẾN của một ngày + chi nhánh → lưới của một phiếu là
 * lưới MỘT ngày (lô × dây). Một ngày có nhiều chuyến: `congPhieuTheoNgay` cộng các chuyến thành
 * lưới tổng ngày.
 *
 * Công thức (PHẢI khớp `fn_dgdv_tong_ngay`, migration 057):
 *   SL buồng (lô)  = Σ so_luong các dây (mọi dòng) + dut_day
 *   Tổng thu ngày  = Σ SL buồng các lô của MỌI chuyến trong ngày
 *   KSC ngày       = Σ so_luong_loi
 */
import type { DgdvFormValues } from './schema';
import type {
  DgdvLoDayDu,
  DgdvPhieuDayDu,
  FarmDgdvCot,
  FarmDgdvDong,
  FarmDgdvLoNgay,
  TrangThaiDgdvPhieu,
  TuanFarm,
  VarMauDay,
} from './types';
import { TRANG_THAI_DGDV } from './types';
import { cacNgayTrongKhoang, soSanhTuan } from './tuan';
import { gonTen, khoaTen } from './chuan-hoa-ten';

// ---- Tổng theo ô / lô / phiếu / ngày ---------------------------------------------

export interface DgdvTongLoNgay {
  /** Σ so_luong các dây */
  soLuong: number;
  dutDay: number;
  /** soLuong + dutDay */
  slBuong: number;
  /** Σ so_luong_loi (KSC) */
  soLuongLoi: number;
}

export interface DgdvTongNgay {
  tongThu: number;
  ksc: number;
}

/** Tổng của một lô trong phiếu (mọi ô của lô đều cùng ngày phiếu). */
export function tongLo(lo: Pick<DgdvLoDayDu, 'dong' | 'lo_ngay'>): DgdvTongLoNgay {
  let soLuong = 0;
  let soLuongLoi = 0;
  for (const d of lo.dong) {
    soLuong += d.so_luong;
    soLuongLoi += d.so_luong_loi;
  }
  const dutDay = lo.lo_ngay.reduce((s, n) => s + n.dut_day, 0);
  return { soLuong, dutDay, slBuong: soLuong + dutDay, soLuongLoi };
}

/** Tổng thu + KSC của một phiếu (một chuyến). */
export function tongPhieu(phieu: Pick<DgdvPhieuDayDu, 'lo'>): DgdvTongNgay {
  let tongThu = 0;
  let ksc = 0;
  for (const lo of phieu.lo) {
    const t = tongLo(lo);
    tongThu += t.slBuong;
    ksc += t.soLuongLoi;
  }
  return { tongThu, ksc };
}

/**
 * Tổng thu + KSC của (ngày, chi nhánh) như `fn_dgdv_tong_ngay`: cộng MỌI chuyến có `ngay` trùng.
 * Bỏ `idChiNhanh` = cộng mọi chi nhánh.
 */
export function tongNgay(dsPhieu: DgdvPhieuDayDu[], ngay: string, idChiNhanh?: string): DgdvTongNgay {
  let tongThu = 0;
  let ksc = 0;
  for (const p of dsPhieu) {
    if (idChiNhanh != null && p.id_chi_nhanh !== idChiNhanh) continue;
    if (p.ngay !== ngay) continue;
    const t = tongPhieu(p);
    tongThu += t.tongThu;
    ksc += t.ksc;
  }
  return { tongThu, ksc };
}

/** Σ so_luong theo cột dây của phiếu: id_cot → số. Cột không có ô = 0. */
export function tongCot(phieu: Pick<DgdvPhieuDayDu, 'cot' | 'lo'>): Record<string, number> {
  const kq: Record<string, number> = {};
  for (const c of phieu.cot) kq[c.id] = 0;
  for (const lo of phieu.lo) congDongVaoCot(kq, lo.dong);
  return kq;
}

function congDongVaoCot(kq: Record<string, number>, dong: FarmDgdvDong[]): void {
  for (const d of dong) {
    if (!(d.id_cot in kq)) continue;
    kq[d.id_cot] += d.so_luong;
  }
}

export interface DgdvTongToTruongNgay extends DgdvTongLoNgay {
  ten_to_truong: string | null;
  /** id fp_farm_dgdv_lo theo stt */
  ids_phieu_lo: string[];
  tongTheoCot: Record<string, number>;
}

/** Lô theo stt (cùng stt thì theo id) — không đổi mảng gốc. */
function loTheoStt<T extends { stt: number; id: string }>(ds: T[]): T[] {
  return [...ds].sort((a, b) => a.stt - b.stt || a.id.localeCompare(b.id));
}

/** Gom lô theo tên tổ trưởng (khoaTen — không phân biệt hoa thường; trống là một nhóm riêng); nhóm xếp theo lô có stt nhỏ nhất. */
function gomTheoToTruong(dsLo: DgdvLoDayDu[]): DgdvLoDayDu[][] {
  const nhom = new Map<string, DgdvLoDayDu[]>();
  for (const lo of loTheoStt(dsLo)) {
    const k = khoaTen(lo.to_truong);
    const ds = nhom.get(k);
    if (ds) ds.push(lo);
    else nhom.set(k, [lo]);
  }
  return [...nhom.values()];
}

/** Dòng nhóm tổ trưởng của phiếu: tự cộng các lô của người đó. */
export function tongToTruong(phieu: Pick<DgdvPhieuDayDu, 'cot' | 'lo'>): DgdvTongToTruongNgay[] {
  return gomTheoToTruong(phieu.lo).map((dsLo) => {
    const tongTheoCot: Record<string, number> = {};
    for (const c of phieu.cot) tongTheoCot[c.id] = 0;
    const t: DgdvTongLoNgay = { soLuong: 0, dutDay: 0, slBuong: 0, soLuongLoi: 0 };
    for (const lo of dsLo) {
      const x = tongLo(lo);
      t.soLuong += x.soLuong;
      t.dutDay += x.dutDay;
      t.slBuong += x.slBuong;
      t.soLuongLoi += x.soLuongLoi;
      congDongVaoCot(tongTheoCot, lo.dong);
    }
    return {
      ...t,
      ten_to_truong: gonTen(dsLo.find((l) => gonTen(l.to_truong))?.to_truong),
      ids_phieu_lo: dsLo.map((l) => l.id),
      tongTheoCot,
    };
  });
}

// ---- Cột dây --------------------------------------------------------------------

/** Tuần thu hoạch farm của dây; thiếu (form chưa chọn) = null. */
export function tuanThuHoachCuaCot(cot: Pick<FarmDgdvCot, 'th_nam' | 'th_tuan'>): TuanFarm | null {
  return cot.th_nam && cot.th_tuan ? { nam: cot.th_nam, tuan: cot.th_tuan } : null;
}

/** Khoá gom dây giữa các chuyến: cùng màu 1, màu 2, xé đôi, tuần thu hoạch = cùng một dây. */
export function khoaDay(cot: Pick<FarmDgdvCot, 'id_mau_1' | 'id_mau_2' | 'xe_doi' | 'th_nam' | 'th_tuan'>): string {
  return [cot.id_mau_1, cot.id_mau_2 ?? '', cot.xe_doi ? 1 : 0, cot.th_nam, cot.th_tuan].join('|');
}

/**
 * Nhãn cột = tên màu 1 [- tên màu 2] [+ « <nhanXeDoi>»]. `nhanXeDoi` do UI truyền từ i18n.
 * Màu không có trong danh mục (chưa tải) → hiện id để dễ phát hiện.
 */
export function nhanCotDay(
  cot: Pick<FarmDgdvCot, 'id_mau_1' | 'id_mau_2' | 'xe_doi'>,
  mauTheoId: ReadonlyMap<string, VarMauDay>,
  nhanXeDoi: string
): string {
  const ten = (id: string) => mauTheoId.get(id)?.ten ?? `#${id}`;
  let nhan = ten(cot.id_mau_1);
  if (cot.id_mau_2) nhan += ` - ${ten(cot.id_mau_2)}`;
  if (cot.xe_doi) nhan += ` ${nhanXeDoi}`;
  return nhan;
}

export function taoMapMau(dsMau: VarMauDay[]): Map<string, VarMauDay> {
  return new Map(dsMau.map((m) => [m.id, m]));
}

// ---- Cộng nhiều chuyến thành tổng ngày ------------------------------------------

/** Tổng một chuyến trong lưới (dòng đầu khối tổng ngày: «C1: 320 · C2: 410»). */
export interface DgdvTongMotChuyen extends DgdvTongNgay {
  id_phieu: string;
  chuyen: number;
}

/** Phiếu ảo = tổng mọi chuyến của một (ngày, chi nhánh). `chuyen` = 0. Chỉ để xem / in, không sửa. */
export interface DgdvPhieuTongNgay extends DgdvPhieuDayDu {
  /** id các phiếu (chuyến) đã cộng, theo số chuyến */
  ids_phieu: string[];
  so_chuyen: number;
  /** tổng thu + KSC từng chuyến, theo số chuyến */
  ds_chuyen: DgdvTongMotChuyen[];
}

/**
 * Cộng các phiếu (chuyến) thành lưới tổng theo (ngày, chi nhánh) — giữ thứ tự nhóm xuất hiện đầu tiên.
 * - Dây gom theo `khoaDay` (màu 1, màu 2, xé đôi, tuần thu hoạch); id cột ảo = `k:<khoá>`.
 * - Lô gom theo `id_lo` (danh mục); id ảo = `lo:<id_lo>`; tổ trưởng / ghi chú lấy bản đầu tiên có chữ.
 * - Ô giữ nguyên từng dòng (không cộng dồn, để còn đánh giá của từng dòng), đánh lại `stt_dong`
 *   1..n theo (chuyến, stt_dong cũ) trong mỗi lô × dây. Đứt dây cộng thành một số / lô.
 * Thứ tự cột / lô: lần xuất hiện đầu tiên khi duyệt chuyến tăng dần, trong chuyến theo stt.
 */
export function congPhieuTheoNgay(dsPhieu: DgdvPhieuDayDu[]): DgdvPhieuTongNgay[] {
  const nhom = new Map<string, DgdvPhieuDayDu[]>();
  for (const p of dsPhieu) {
    const k = `${p.ngay}|${p.id_chi_nhanh}`;
    const ds = nhom.get(k);
    if (ds) ds.push(p);
    else nhom.set(k, [p]);
  }
  return [...nhom.values()].map(congMotNgay);
}

function congMotNgay(dsGoc: DgdvPhieuDayDu[]): DgdvPhieuTongNgay {
  const ds = [...dsGoc].sort((a, b) => a.chuyen - b.chuyen || a.id.localeCompare(b.id));
  const dau = ds[0];
  const idPhieu = `tong:${dau.ngay}:${dau.id_chi_nhanh}`;

  const cotTheoKhoa = new Map<string, FarmDgdvCot>();
  const loTheoIdLo = new Map<string, DgdvLoDayDu>();
  const sttDong = new Map<string, number>();

  for (const p of ds) {
    const khoaCotTheoId = new Map<string, string>();
    for (const c of loTheoStt(p.cot)) {
      const k = khoaDay(c);
      khoaCotTheoId.set(c.id, k);
      if (!cotTheoKhoa.has(k)) {
        cotTheoKhoa.set(k, { ...c, id: `k:${k}`, id_phieu: idPhieu, stt: cotTheoKhoa.size + 1 });
      }
    }
    for (const l of loTheoStt(p.lo)) {
      const idLo = `lo:${l.id_lo}`;
      let g = loTheoIdLo.get(l.id_lo);
      if (!g) {
        g = { ...l, id: idLo, id_phieu: idPhieu, stt: loTheoIdLo.size + 1, lo_ngay: [], dong: [] };
        loTheoIdLo.set(l.id_lo, g);
      }
      if (!gonTen(g.to_truong) && gonTen(l.to_truong)) g.to_truong = l.to_truong;
      if (!g.ghi_chu && l.ghi_chu) g.ghi_chu = l.ghi_chu;
      if (!g.ten_lo && l.ten_lo) g.ten_lo = l.ten_lo;

      const dut = l.lo_ngay.reduce((s, n) => s + n.dut_day, 0);
      if (dut > 0) {
        const n: FarmDgdvLoNgay = g.lo_ngay[0] ?? { id: `n:${l.id_lo}`, id_phieu_lo: idLo, ngay: dau.ngay, dut_day: 0 };
        n.dut_day += dut;
        g.lo_ngay = [n];
      }

      for (const d of [...l.dong].sort((a, b) => a.stt_dong - b.stt_dong || a.id.localeCompare(b.id))) {
        const kCot = khoaCotTheoId.get(d.id_cot);
        if (kCot == null) continue; // ô trỏ cột không thuộc phiếu — DB đã chặn, phòng dữ liệu lệch
        const kDong = `${idLo}|${kCot}`;
        const stt = (sttDong.get(kDong) ?? 0) + 1;
        sttDong.set(kDong, stt);
        g.dong.push({ ...d, id_phieu_lo: idLo, id_cot: `k:${kCot}`, stt_dong: stt });
      }
    }
  }

  const tatCaKhoa = ds.every((p) => p.trang_thai === TRANG_THAI_DGDV.KHOA);
  return {
    id: idPhieu,
    ngay: dau.ngay,
    chuyen: 0,
    nam: dau.nam,
    tuan: dau.tuan,
    id_chi_nhanh: dau.id_chi_nhanh,
    ten_chi_nhanh: dau.ten_chi_nhanh ?? null,
    ghi_chu: null,
    trang_thai: tatCaKhoa ? TRANG_THAI_DGDV.KHOA : TRANG_THAI_DGDV.MO,
    id_nguoi_tao: null,
    ten_nguoi_tao: null,
    tg_tao: ds.reduce((m, p) => (p.tg_tao < m ? p.tg_tao : m), dau.tg_tao),
    tg_cap_nhat: ds.reduce((m, p) => (p.tg_cap_nhat > m ? p.tg_cap_nhat : m), dau.tg_cap_nhat),
    cot: [...cotTheoKhoa.values()],
    lo: [...loTheoIdLo.values()],
    ids_phieu: ds.map((p) => p.id),
    so_chuyen: ds.length,
    ds_chuyen: ds.map((p) => ({ id_phieu: p.id, chuyen: p.chuyen, ...tongPhieu(p) })),
  };
}

// ---- Mô hình hiển thị lưới -------------------------------------------------------

export interface DgdvCotHienThi extends FarmDgdvCot {
  nhan: string;
  ma_mau_1: string | null;
  ma_mau_2: string | null;
  tuanThuHoach: TuanFarm | null;
}

export interface DgdvNhomCot {
  /** null = dây chưa có tuần thu hoạch (xếp cuối) */
  tuanThuHoach: TuanFarm | null;
  cot: DgdvCotHienThi[];
}

export interface DgdvDongNgay {
  stt_dong: number;
  /** id_cot → ô; ô chưa nhập thì không có khoá */
  o: Record<string, FarmDgdvDong>;
}

export interface DgdvLoNgay extends DgdvTongLoNgay {
  id_phieu_lo: string;
  id_lo: string;
  ten_lo: string | null;
  ghi_chu: string | null;
  tongTheoCot: Record<string, number>;
  dong: DgdvDongNgay[];
}

export interface DgdvNhomToTruongLuoi extends DgdvTongToTruongNgay {
  lo: DgdvLoNgay[];
}

export interface DgdvLuoiNgay extends DgdvTongNgay {
  ngay: string;
  /** id phiếu; lưới tổng ngày thì là id ảo `tong:…` */
  id_phieu: string;
  /** số chuyến; 0 = lưới tổng nhiều chuyến */
  chuyen: number;
  /** id các phiếu thật tạo nên lưới (1 phần tử nếu là lưới một chuyến) */
  ids_phieu: string[];
  /** tổng từng chuyến tạo nên lưới, theo số chuyến (1 phần tử nếu là lưới một chuyến) */
  dsChuyen: DgdvTongMotChuyen[];
  id_chi_nhanh: string;
  ten_chi_nhanh: string | null;
  nam: number;
  tuan: number;
  trang_thai: TrangThaiDgdvPhieu;
  nhomCot: DgdvNhomCot[];
  /** cột theo thứ tự hiển thị (đã gom nhóm) */
  cot: DgdvCotHienThi[];
  /** các tuần thu hoạch có trong phiếu (đầu khối «Tuần thu hoạch») */
  tuanThuHoach: TuanFarm[];
  nhomToTruong: DgdvNhomToTruongLuoi[];
  tongTheoCot: Record<string, number>;
}

export interface DgdvTuyChonLuoi {
  /** chữ «xé đôi» (i18n) */
  nhanXeDoi: string;
  /** số dòng tối thiểu mỗi lô (để có ô trống mà nhập), mặc định 1 */
  soDongToiThieu?: number;
}

const khoaTuan = (t: TuanFarm | null) => (t ? `${t.nam}-${t.tuan}` : '');

function dungCotHienThi(
  dsCot: FarmDgdvCot[],
  mauTheoId: ReadonlyMap<string, VarMauDay>,
  nhanXeDoi: string
): DgdvNhomCot[] {
  const nhom = new Map<string, DgdvNhomCot>();
  for (const c of loTheoStt(dsCot)) {
    const tuanThuHoach = tuanThuHoachCuaCot(c);
    const k = khoaTuan(tuanThuHoach);
    let g = nhom.get(k);
    if (!g) {
      g = { tuanThuHoach, cot: [] };
      nhom.set(k, g);
    }
    g.cot.push({
      ...c,
      nhan: nhanCotDay(c, mauTheoId, nhanXeDoi),
      ma_mau_1: mauTheoId.get(c.id_mau_1)?.ma_mau ?? null,
      ma_mau_2: c.id_mau_2 ? (mauTheoId.get(c.id_mau_2)?.ma_mau ?? null) : null,
      tuanThuHoach,
    });
  }
  return [...nhom.values()].sort((a, b) => {
    if (!a.tuanThuHoach) return b.tuanThuHoach ? 1 : 0;
    if (!b.tuanThuHoach) return -1;
    return soSanhTuan(a.tuanThuHoach, b.tuanThuHoach);
  });
}

function dungLo(lo: DgdvLoDayDu, idsCot: string[], soDongToiThieu: number): DgdvLoNgay {
  const theoDong = new Map<number, Record<string, FarmDgdvDong>>();
  for (let i = 1; i <= soDongToiThieu; i++) theoDong.set(i, {});
  for (const d of lo.dong) {
    let o = theoDong.get(d.stt_dong);
    if (!o) {
      o = {};
      theoDong.set(d.stt_dong, o);
    }
    o[d.id_cot] = d;
  }
  const tongTheoCot: Record<string, number> = {};
  for (const id of idsCot) tongTheoCot[id] = 0;
  congDongVaoCot(tongTheoCot, lo.dong);
  return {
    ...tongLo(lo),
    id_phieu_lo: lo.id,
    id_lo: lo.id_lo,
    ten_lo: lo.ten_lo,
    ghi_chu: lo.ghi_chu,
    tongTheoCot,
    dong: [...theoDong.entries()].sort(([a], [b]) => a - b).map(([stt_dong, o]) => ({ stt_dong, o })),
  };
}

/**
 * Mô hình lưới của một phiếu (một ngày): cột gom theo tuần thu hoạch, dòng tổ trưởng → lô → dòng.
 * Nhận cả phiếu tổng ngày (`congPhieuTheoNgay`).
 */
export function dungLuoiNgay(
  phieu: DgdvPhieuDayDu | DgdvPhieuTongNgay,
  mauTheoId: ReadonlyMap<string, VarMauDay>,
  tuyChon: DgdvTuyChonLuoi
): DgdvLuoiNgay {
  const nhomCot = dungCotHienThi(phieu.cot, mauTheoId, tuyChon.nhanXeDoi);
  const cot = nhomCot.flatMap((g) => g.cot);
  const idsCot = cot.map((c) => c.id);
  const soDongToiThieu = tuyChon.soDongToiThieu ?? 1;
  const loTheoId = new Map(phieu.lo.map((l) => [l.id, l]));

  const nhomToTruong = tongToTruong(phieu).map((g) => ({
    ...g,
    lo: g.ids_phieu_lo.map((id) => dungLo(loTheoId.get(id)!, idsCot, soDongToiThieu)),
  }));

  const tong = tongPhieu(phieu);
  return {
    ...tong,
    ngay: phieu.ngay,
    id_phieu: phieu.id,
    chuyen: phieu.chuyen,
    ids_phieu: 'ids_phieu' in phieu ? phieu.ids_phieu : [phieu.id],
    dsChuyen: 'ds_chuyen' in phieu ? phieu.ds_chuyen : [{ id_phieu: phieu.id, chuyen: phieu.chuyen, ...tong }],
    id_chi_nhanh: phieu.id_chi_nhanh,
    ten_chi_nhanh: phieu.ten_chi_nhanh ?? null,
    nam: phieu.nam,
    tuan: phieu.tuan,
    trang_thai: phieu.trang_thai,
    nhomCot,
    cot,
    tuanThuHoach: nhomCot.flatMap((g) => (g.tuanThuHoach ? [g.tuanThuHoach] : [])),
    nhomToTruong,
    tongTheoCot: tongCot(phieu),
  };
}

export interface DgdvKhoiNgay {
  ngay: string;
  /** mỗi phiếu (chuyến) của ngày một lưới — hoặc mỗi chi nhánh một lưới tổng khi gộp chuyến; rỗng = chưa có phiếu */
  luoi: DgdvLuoiNgay[];
}

/**
 * Khoảng ngày: mỗi ngày một khối gồm các phiếu có `ngay` trùng (giữ thứ tự `dsPhieu`, trong một chi
 * nhánh theo số chuyến). `gopChuyen` = cộng các chuyến của cùng chi nhánh thành một lưới tổng ngày.
 */
export function dungLuoiKhoangNgay(
  dsPhieu: DgdvPhieuDayDu[],
  tu: string,
  den: string,
  mauTheoId: ReadonlyMap<string, VarMauDay>,
  tuyChon: DgdvTuyChonLuoi & { gopChuyen?: boolean }
): DgdvKhoiNgay[] {
  return cacNgayTrongKhoang(tu, den).map((ngay) => {
    const trongNgay = dsPhieu.filter((p) => p.ngay === ngay);
    const ds = tuyChon.gopChuyen ? congPhieuTheoNgay(trongNgay) : theoChiNhanhRoiChuyen(trongNgay);
    return { ngay, luoi: ds.map((p) => dungLuoiNgay(p, mauTheoId, tuyChon)) };
  });
}

/** Giữ thứ tự chi nhánh xuất hiện đầu tiên, trong chi nhánh xếp theo chuyến. */
function theoChiNhanhRoiChuyen(ds: DgdvPhieuDayDu[]): DgdvPhieuDayDu[] {
  const thuTuCn = new Map<string, number>();
  ds.forEach((p) => {
    if (!thuTuCn.has(p.id_chi_nhanh)) thuTuCn.set(p.id_chi_nhanh, thuTuCn.size);
  });
  return [...ds].sort(
    (a, b) => thuTuCn.get(a.id_chi_nhanh)! - thuTuCn.get(b.id_chi_nhanh)! || a.chuyen - b.chuyen
  );
}

// ---- Sao chép sang chuyến mới ----------------------------------------------------

/**
 * Giá trị form cho phiếu chuyến mới (mặc định: cùng ngày, chuyến kế tiếp): cùng chi nhánh; giữ lô +
 * tổ trưởng + ghi chú lô; giữ cột dây cùng tuần thu hoạch. KHÔNG chép ô số, đứt dây, đánh giá, ghi chú
 * phiếu; không mang id cũ (đều là bản ghi mới).
 */
export function dungPhieuSaoChep(
  phieu: DgdvPhieuDayDu,
  dich: { ngay: string; chuyen: number } = { ngay: phieu.ngay, chuyen: phieu.chuyen + 1 }
): DgdvFormValues {
  return {
    ngay: dich.ngay,
    chuyen: dich.chuyen,
    id_chi_nhanh: phieu.id_chi_nhanh,
    ghi_chu: null,
    cot: loTheoStt(phieu.cot).map((c) => ({
      th_nam: c.th_nam,
      th_tuan: c.th_tuan,
      id_mau_1: c.id_mau_1,
      id_mau_2: c.id_mau_2,
      xe_doi: c.xe_doi,
    })),
    lo: loTheoStt(phieu.lo).map((l) => ({
      ten_lo: l.ten_lo ?? '',
      to_truong: l.to_truong,
      ghi_chu: l.ghi_chu,
    })),
  };
}

// ---- Kiểm tra --------------------------------------------------------------------

export interface DgdvCanhBaoLoi {
  id_phieu_lo: string;
  id_cot: string;
  ngay: string;
  stt_dong: number;
  so_luong: number;
  so_luong_loi: number;
}

/** Ô có số lượng lỗi > số lượng (cảnh báo, không chặn lưu). */
export function kiemTraSoLuongLoi(phieu: Pick<DgdvPhieuDayDu, 'lo'>): DgdvCanhBaoLoi[] {
  const kq: DgdvCanhBaoLoi[] = [];
  for (const lo of phieu.lo) {
    for (const d of lo.dong) {
      if (d.so_luong_loi > d.so_luong) {
        kq.push({
          id_phieu_lo: d.id_phieu_lo,
          id_cot: d.id_cot,
          ngay: d.ngay,
          stt_dong: d.stt_dong,
          so_luong: d.so_luong,
          so_luong_loi: d.so_luong_loi,
        });
      }
    }
  }
  return kq;
}
