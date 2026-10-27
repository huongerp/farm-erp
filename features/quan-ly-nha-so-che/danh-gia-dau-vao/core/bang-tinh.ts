/**
 * Logic lưới Đánh giá đầu vào — thuần, không React, không gọi db.
 *
 * Công thức (PHẢI khớp `fn_dgdv_tong_ngay`, migration 052):
 *   SL buồng (lô × ngày) = Σ so_luong các dây (mọi dòng) + dut_day
 *   Tổng thu ngày        = Σ SL buồng các lô
 *   KSC ngày             = Σ so_luong_loi
 */
import type { DgdvFormValues } from './schema';
import type {
  DgdvLoDayDu,
  DgdvPhieuDayDu,
  FarmDgdvCot,
  FarmDgdvDong,
  TrangThaiDgdvPhieu,
  TuanIso,
  VarMauDay,
} from './types';
import { cacNgayTrongKhoang, congNgay, ngayThuocTuan, soSanhTuan, tuanIsoCuaNgay, tuanKeTiep } from './tuan';

// ---- Tổng theo ô / lô / ngày ----------------------------------------------------

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

/** Tổng của một lô trong một ngày. */
export function tongLoNgay(lo: Pick<DgdvLoDayDu, 'dong' | 'lo_ngay'>, ngay: string): DgdvTongLoNgay {
  let soLuong = 0;
  let soLuongLoi = 0;
  for (const d of lo.dong) {
    if (d.ngay !== ngay) continue;
    soLuong += d.so_luong;
    soLuongLoi += d.so_luong_loi;
  }
  const dutDay = lo.lo_ngay.reduce((s, n) => (n.ngay === ngay ? s + n.dut_day : s), 0);
  return { soLuong, dutDay, slBuong: soLuong + dutDay, soLuongLoi };
}

/** Tổng thu + KSC của một phiếu trong một ngày. */
export function tongPhieuNgay(phieu: Pick<DgdvPhieuDayDu, 'lo'>, ngay: string): DgdvTongNgay {
  let tongThu = 0;
  let ksc = 0;
  for (const lo of phieu.lo) {
    const t = tongLoNgay(lo, ngay);
    tongThu += t.slBuong;
    ksc += t.soLuongLoi;
  }
  return { tongThu, ksc };
}

/**
 * Tổng thu + KSC của (ngày, chi nhánh) như `fn_dgdv_tong_ngay`: chỉ cộng phiếu của chi nhánh
 * có tuần ISO chứa ngày. Bỏ `idChiNhanh` = cộng mọi chi nhánh.
 */
export function tongNgay(dsPhieu: DgdvPhieuDayDu[], ngay: string, idChiNhanh?: string): DgdvTongNgay {
  let tongThu = 0;
  let ksc = 0;
  for (const p of dsPhieu) {
    if (idChiNhanh != null && p.id_chi_nhanh !== idChiNhanh) continue;
    if (!ngayThuocTuan(ngay, p.nam, p.tuan)) continue;
    const t = tongPhieuNgay(p, ngay);
    tongThu += t.tongThu;
    ksc += t.ksc;
  }
  return { tongThu, ksc };
}

/** Σ so_luong theo cột dây trong một ngày: id_cot → số. Cột không có ô = 0. */
export function tongCotNgay(phieu: Pick<DgdvPhieuDayDu, 'cot' | 'lo'>, ngay: string): Record<string, number> {
  const kq: Record<string, number> = {};
  for (const c of phieu.cot) kq[c.id] = 0;
  for (const lo of phieu.lo) congDongVaoCot(kq, lo.dong, ngay);
  return kq;
}

function congDongVaoCot(kq: Record<string, number>, dong: FarmDgdvDong[], ngay: string): void {
  for (const d of dong) {
    if (d.ngay !== ngay || !(d.id_cot in kq)) continue;
    kq[d.id_cot] += d.so_luong;
  }
}

export interface DgdvTongToTruongNgay extends DgdvTongLoNgay {
  id_to_truong: string | null;
  ten_to_truong: string | null;
  /** id fp_farm_dgdv_lo theo stt */
  ids_phieu_lo: string[];
  tongTheoCot: Record<string, number>;
}

/** Lô theo stt (cùng stt thì theo id) — không đổi mảng gốc. */
function loTheoStt<T extends { stt: number; id: string }>(ds: T[]): T[] {
  return [...ds].sort((a, b) => a.stt - b.stt || a.id.localeCompare(b.id));
}

/** Gom lô theo id_to_truong (null là một nhóm riêng); nhóm xếp theo lô có stt nhỏ nhất. */
function gomTheoToTruong(dsLo: DgdvLoDayDu[]): DgdvLoDayDu[][] {
  const nhom = new Map<string, DgdvLoDayDu[]>();
  for (const lo of loTheoStt(dsLo)) {
    const k = lo.id_to_truong ?? '';
    const ds = nhom.get(k);
    if (ds) ds.push(lo);
    else nhom.set(k, [lo]);
  }
  return [...nhom.values()];
}

/** Dòng nhóm tổ trưởng của một ngày: tự cộng các lô của người đó. */
export function tongToTruongNgay(phieu: Pick<DgdvPhieuDayDu, 'cot' | 'lo'>, ngay: string): DgdvTongToTruongNgay[] {
  return gomTheoToTruong(phieu.lo).map((dsLo) => {
    const tongTheoCot: Record<string, number> = {};
    for (const c of phieu.cot) tongTheoCot[c.id] = 0;
    const t: DgdvTongLoNgay = { soLuong: 0, dutDay: 0, slBuong: 0, soLuongLoi: 0 };
    for (const lo of dsLo) {
      const x = tongLoNgay(lo, ngay);
      t.soLuong += x.soLuong;
      t.dutDay += x.dutDay;
      t.slBuong += x.slBuong;
      t.soLuongLoi += x.soLuongLoi;
      congDongVaoCot(tongTheoCot, lo.dong, ngay);
    }
    return {
      ...t,
      id_to_truong: dsLo[0].id_to_truong,
      ten_to_truong: dsLo.find((l) => l.ten_to_truong)?.ten_to_truong ?? null,
      ids_phieu_lo: dsLo.map((l) => l.id),
      tongTheoCot,
    };
  });
}

// ---- Cột dây --------------------------------------------------------------------

/** Tuần thu hoạch của dây: tuần ISO của thu_hoach_tu (thiếu thì thu_hoach_den), chưa nhập = null. */
export function tuanThuHoachCuaCot(cot: Pick<FarmDgdvCot, 'thu_hoach_tu' | 'thu_hoach_den'>): TuanIso | null {
  const ngay = cot.thu_hoach_tu ?? cot.thu_hoach_den;
  return ngay ? tuanIsoCuaNgay(ngay) : null;
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

// ---- Mô hình hiển thị lưới -------------------------------------------------------

export interface DgdvCotHienThi extends FarmDgdvCot {
  nhan: string;
  ma_mau_1: string | null;
  ma_mau_2: string | null;
  tuanThuHoach: TuanIso | null;
}

export interface DgdvNhomCot {
  /** null = dây chưa nhập ngày thu hoạch (xếp cuối) */
  tuanThuHoach: TuanIso | null;
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
  id_phieu: string;
  id_chi_nhanh: string;
  ten_chi_nhanh: string | null;
  nam: number;
  tuan: number;
  trang_thai: TrangThaiDgdvPhieu;
  nhomCot: DgdvNhomCot[];
  /** cột theo thứ tự hiển thị (đã gom nhóm) */
  cot: DgdvCotHienThi[];
  /** các tuần thu hoạch có trong phiếu (đầu khối «Tuần thu hoạch») */
  tuanThuHoach: TuanIso[];
  nhomToTruong: DgdvNhomToTruongLuoi[];
  tongTheoCot: Record<string, number>;
}

export interface DgdvTuyChonLuoi {
  /** chữ «xé đôi» (i18n) */
  nhanXeDoi: string;
  /** số dòng tối thiểu mỗi lô (để có ô trống mà nhập), mặc định 1 */
  soDongToiThieu?: number;
}

const khoaTuan = (t: TuanIso | null) => (t ? `${t.nam}-${t.tuan}` : '');

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

function dungLoNgay(lo: DgdvLoDayDu, ngay: string, idsCot: string[], soDongToiThieu: number): DgdvLoNgay {
  const theoDong = new Map<number, Record<string, FarmDgdvDong>>();
  for (let i = 1; i <= soDongToiThieu; i++) theoDong.set(i, {});
  for (const d of lo.dong) {
    if (d.ngay !== ngay) continue;
    let o = theoDong.get(d.stt_dong);
    if (!o) {
      o = {};
      theoDong.set(d.stt_dong, o);
    }
    o[d.id_cot] = d;
  }
  const tongTheoCot: Record<string, number> = {};
  for (const id of idsCot) tongTheoCot[id] = 0;
  congDongVaoCot(tongTheoCot, lo.dong, ngay);
  return {
    ...tongLoNgay(lo, ngay),
    id_phieu_lo: lo.id,
    id_lo: lo.id_lo,
    ten_lo: lo.ten_lo,
    ghi_chu: lo.ghi_chu,
    tongTheoCot,
    dong: [...theoDong.entries()].sort(([a], [b]) => a - b).map(([stt_dong, o]) => ({ stt_dong, o })),
  };
}

/** Mô hình lưới của một phiếu trong một ngày: cột gom theo tuần thu hoạch, dòng tổ trưởng → lô → dòng. */
export function dungLuoiNgay(
  phieu: DgdvPhieuDayDu,
  ngay: string,
  mauTheoId: ReadonlyMap<string, VarMauDay>,
  tuyChon: DgdvTuyChonLuoi
): DgdvLuoiNgay {
  const nhomCot = dungCotHienThi(phieu.cot, mauTheoId, tuyChon.nhanXeDoi);
  const cot = nhomCot.flatMap((g) => g.cot);
  const idsCot = cot.map((c) => c.id);
  const soDongToiThieu = tuyChon.soDongToiThieu ?? 1;
  const loTheoId = new Map(phieu.lo.map((l) => [l.id, l]));

  const nhomToTruong = tongToTruongNgay(phieu, ngay).map((g) => ({
    ...g,
    lo: g.ids_phieu_lo.map((id) => dungLoNgay(loTheoId.get(id)!, ngay, idsCot, soDongToiThieu)),
  }));

  return {
    ...tongPhieuNgay(phieu, ngay),
    ngay,
    id_phieu: phieu.id,
    id_chi_nhanh: phieu.id_chi_nhanh,
    ten_chi_nhanh: phieu.ten_chi_nhanh ?? null,
    nam: phieu.nam,
    tuan: phieu.tuan,
    trang_thai: phieu.trang_thai,
    nhomCot,
    cot,
    tuanThuHoach: nhomCot.flatMap((g) => (g.tuanThuHoach ? [g.tuanThuHoach] : [])),
    nhomToTruong,
    tongTheoCot: tongCotNgay(phieu, ngay),
  };
}

export interface DgdvKhoiNgay {
  ngay: string;
  /** mỗi phiếu (chi nhánh) có tuần chứa ngày một lưới; rỗng = ngày chưa có phiếu */
  luoi: DgdvLuoiNgay[];
}

/** Khoảng ngày: mỗi ngày một khối, lấy đúng phiếu có tuần ISO chứa ngày đó (giữ thứ tự `dsPhieu`). */
export function dungLuoiKhoangNgay(
  dsPhieu: DgdvPhieuDayDu[],
  tu: string,
  den: string,
  mauTheoId: ReadonlyMap<string, VarMauDay>,
  tuyChon: DgdvTuyChonLuoi
): DgdvKhoiNgay[] {
  return cacNgayTrongKhoang(tu, den).map((ngay) => ({
    ngay,
    luoi: dsPhieu
      .filter((p) => ngayThuocTuan(ngay, p.nam, p.tuan))
      .map((p) => dungLuoiNgay(p, ngay, mauTheoId, tuyChon)),
  }));
}

// ---- Sao chép sang tuần mới ------------------------------------------------------

const doi7Ngay = (ymd: string | null) => (ymd ? congNgay(ymd, 7) : null);

/**
 * Giá trị form cho phiếu tuần kế tiếp: cùng chi nhánh; giữ lô + tổ trưởng + ghi chú lô;
 * giữ cột dây nhưng dời chích bắp / thu hoạch +7 ngày. KHÔNG chép ô số, đứt dây, đánh giá,
 * ghi chú phiếu; không mang id cũ (đều là bản ghi mới).
 */
export function dungPhieuSaoChep(phieu: DgdvPhieuDayDu): DgdvFormValues {
  const { nam, tuan } = tuanKeTiep(phieu);
  return {
    nam,
    tuan,
    id_chi_nhanh: phieu.id_chi_nhanh,
    ghi_chu: null,
    cot: loTheoStt(phieu.cot).map((c) => ({
      chich_bap_tu: doi7Ngay(c.chich_bap_tu),
      chich_bap_den: doi7Ngay(c.chich_bap_den),
      thu_hoach_tu: doi7Ngay(c.thu_hoach_tu),
      thu_hoach_den: doi7Ngay(c.thu_hoach_den),
      id_mau_1: c.id_mau_1,
      id_mau_2: c.id_mau_2,
      xe_doi: c.xe_doi,
    })),
    lo: loTheoStt(phieu.lo).map((l) => ({
      id_lo: l.id_lo,
      id_to_truong: l.id_to_truong,
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
