/**
 * Năng suất và thưởng theo nhóm trong chuyền.
 * NS nhóm = số thùng ÷ tổng giờ công (giờ-người, KHÔNG cộng giờ TC); tỷ lệ đạt = NS ÷ mục tiêu × 100.
 * Thưởng chỉ cho chuyền Tỉa, tính khi hiển thị (không lưu DB): đạt ≥ 85% → min(tỷ lệ,100)% × mức × công.
 */
import { formatNumberVN } from '../../../../lib/utils';
import { BCSC_MUC_THUONG_NGAY } from '../../bao-cao-so-che/core/kpi-thuong-cong-thuc';
import { CONG_THEO_CHAM_CONG, nhomNhanVienTheoChuyen, type NvFormRow } from './danh-sach-nv';
import { SO_NHOM_TOI_DA, tongHopTheoNhom } from './tong-hop-nhom';
import type { ChamCong, FarmBaoCaoNhanCong, LoaiChuyen } from './types';

/** Mục tiêu mặc định (thùng / giờ-người) khi tạo phiếu. */
export const MUC_TIEU_NS_NHOM_MAC_DINH = 3;
/** Chuyền duy nhất được thưởng năng suất nhóm. */
export const CHUYEN_THUONG_NS_NHOM: LoaiChuyen = 'TIA_DANH_GIA';
const NGUONG_THUONG = 85;

/** Số thùng theo nhóm của một chuyền: khoá "1".."9" → số ≥ 0; thiếu khoá = chưa nhập. */
export type SoThungNhom = Record<string, number>;

type DongNsNhom = Pick<NvFormRow, 'ho_ten' | 'cham_cong' | 'so_gio_cong' | 'so_gio_tc'> & { so_nhom: number | null };

export interface NguoiThuongNhom {
  ho_ten: string;
  cham_cong: ChamCong;
  /** Công quy đổi (cả ngày 1, nửa ngày ½, nghỉ 0). */
  cong: number;
  thuong: number;
}

export interface NangSuatNhom {
  soNhom: number;
  soNguoi: number;
  soNguoiDiLam: number;
  cong: number;
  /** null = chưa nhập số thùng. */
  soThung: number | null;
  gioCong: number;
  ns: number | null;
  tyLe: number | null;
  /** Thưởng của một người làm cả ngày (0 nếu chuyền không thưởng / chưa đạt). */
  thuongCaNgay: number;
  tongThuong: number;
  nguoi: NguoiThuongNhom[];
}

export function nangSuatNhom(soThung: number | null | undefined, gioCong: number): number | null {
  if (soThung == null || !Number.isFinite(soThung) || !(gioCong > 0)) return null;
  return soThung / gioCong;
}

export function tyLeDatNs(ns: number | null | undefined, mucTieu: number): number | null {
  if (ns == null || !Number.isFinite(ns) || !(mucTieu > 0)) return null;
  return (ns / mucTieu) * 100;
}

/** Thưởng một người: đạt ≥ 85% → round(min(tỷ lệ,100)/100 × mức × công), làm tròn một lần. */
export function thuongNguoiTheoNhom(tyLe: number | null | undefined, chamCong: ChamCong, muc: number): number {
  if (tyLe == null || !(tyLe >= NGUONG_THUONG)) return 0;
  return Math.round((Math.min(tyLe, 100) / 100) * muc * CONG_THEO_CHAM_CONG[chamCong]);
}

/** Số thùng hợp lệ của một nhóm (số hữu hạn ≥ 0), không có → null. */
export function soThungCuaNhom(soThungNhom: SoThungNhom | null | undefined, soNhom: number): number | null {
  const v = soThungNhom?.[String(soNhom)];
  return typeof v === 'number' && Number.isFinite(v) && v >= 0 ? v : null;
}

/** Chuẩn hoá jsonb `so_thung_nhom` từ DB / form: chỉ giữ khoá 1–9 có số ≥ 0. */
export function chuanHoaSoThungNhom(raw: unknown): SoThungNhom {
  const out: SoThungNhom = {};
  if (raw == null || typeof raw !== 'object' || Array.isArray(raw)) return out;
  for (let n = 1; n <= SO_NHOM_TOI_DA; n++) {
    const v = (raw as Record<string, unknown>)[String(n)];
    const so = typeof v === 'string' && v.trim() !== '' ? Number(v) : v;
    if (typeof so === 'number' && Number.isFinite(so) && so >= 0) out[String(n)] = so;
  }
  return out;
}

/** Ô nhập số thùng: trống / không phải số ≥ 0 → bỏ khoá (= chưa nhập), KHÔNG thành 0. */
export function ganSoThungNhom(soThungNhom: SoThungNhom | null | undefined, soNhom: number, raw: string): SoThungNhom {
  const out = { ...chuanHoaSoThungNhom(soThungNhom) };
  const s = raw.trim().replace(',', '.');
  const v = s === '' ? NaN : Number(s);
  if (Number.isFinite(v) && v >= 0) out[String(soNhom)] = v;
  else delete out[String(soNhom)];
  return out;
}

/** NS + thưởng từng nhóm của một chuyền; bỏ người chưa chia nhóm. */
export function tinhNangSuatChuyen(
  chuyen: { loai_chuyen: LoaiChuyen; nhanVien: readonly DongNsNhom[]; soThungNhom: SoThungNhom | null | undefined },
  mucTieu: number,
  muc: number = BCSC_MUC_THUONG_NGAY.tia.nangSuat
): NangSuatNhom[] {
  const coThuong = chuyen.loai_chuyen === CHUYEN_THUONG_NS_NHOM;
  return tongHopTheoNhom(chuyen.nhanVien).flatMap((g) => {
    if (g.soNhom == null) return [];
    const soThung = soThungCuaNhom(chuyen.soThungNhom, g.soNhom);
    const ns = nangSuatNhom(soThung, g.gioCong);
    const tyLe = tyLeDatNs(ns, mucTieu);
    const thuong = (cc: ChamCong) => (coThuong ? thuongNguoiTheoNhom(tyLe, cc, muc) : 0);
    const nguoi = g.nhanVien.map((r) => ({ ho_ten: r.ho_ten, cham_cong: r.cham_cong, cong: CONG_THEO_CHAM_CONG[r.cham_cong], thuong: thuong(r.cham_cong) }));
    return [
      {
        soNhom: g.soNhom,
        soNguoi: g.soNguoi,
        soNguoiDiLam: g.soNguoiDiLam,
        cong: g.cong,
        soThung,
        gioCong: g.gioCong,
        ns,
        tyLe,
        thuongCaNgay: thuong('CA_NGAY'),
        tongThuong: nguoi.reduce((s, p) => s + p.thuong, 0),
        nguoi,
      },
    ];
  });
}

/** Mục tiêu của phiếu (dữ liệu cũ / sai → mặc định 3). */
export function mucTieuNsNhom(v: unknown): number {
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? n : MUC_TIEU_NS_NHOM_MAC_DINH;
}

export interface NangSuatNhomTheoChuyen {
  tt: string;
  loai_chuyen: LoaiChuyen;
  /** Theo số nhóm — tra nhanh khi vẽ khối nhóm / bảng tổng hợp. */
  theoNhom: Map<number, NangSuatNhom>;
}

/** NS từng chuyền của một phiếu (thứ tự như danh sách in), chỉ chuyền có người đã chia nhóm. */
export function nangSuatNhomCuaPhieu(data: Pick<FarmBaoCaoNhanCong, 'chi_tiet' | 'muc_tieu_ns_nhom'>): NangSuatNhomTheoChuyen[] {
  const mucTieu = mucTieuNsNhom(data.muc_tieu_ns_nhom);
  return nhomNhanVienTheoChuyen(data).flatMap(({ ct, tt, nhanVien }) => {
    const ds = tinhNangSuatChuyen({ loai_chuyen: ct.loai_chuyen, nhanVien, soThungNhom: ct.so_thung_nhom }, mucTieu);
    return ds.length > 0 ? [{ tt, loai_chuyen: ct.loai_chuyen, theoNhom: new Map(ds.map((g) => [g.soNhom, g])) }] : [];
  });
}

/** Phiếu có ít nhất một nhóm đã nhập số thùng. */
export function phieuCoSoThungNhom(ds: readonly NangSuatNhomTheoChuyen[]): boolean {
  return ds.some((c) => [...c.theoNhom.values()].some((g) => g.soThung != null));
}

export interface DongThuongNhom extends NguoiThuongNhom {
  tt: string;
  loai_chuyen: LoaiChuyen;
  soNhom: number;
}

/** Người được thưởng năng suất nhóm (thưởng > 0), theo thứ tự chuyền → nhóm → danh sách. */
export function dsThuongNhom(ds: readonly NangSuatNhomTheoChuyen[]): DongThuongNhom[] {
  return ds.flatMap((c) =>
    [...c.theoNhom.values()].flatMap((g) =>
      g.nguoi.filter((p) => p.thuong > 0).map((p) => ({ ...p, tt: c.tt, loai_chuyen: c.loai_chuyen, soNhom: g.soNhom }))
    )
  );
}

/** Mức màu của % đạt: ≥ 100 đạt, 85–99 gần đạt, < 85 chưa đạt. */
export function mucDatNs(tyLe: number | null | undefined): 'dat' | 'gan-dat' | 'chua-dat' | null {
  if (tyLe == null) return null;
  if (tyLe >= 100) return 'dat';
  return tyLe >= NGUONG_THUONG ? 'gan-dat' : 'chua-dat';
}

/** Lớp màu chữ của % đạt (cùng bộ màu với bảng KPI thưởng); chưa có tỷ lệ → ''. */
export function lopMauTyLeNs(tyLe: number | null | undefined): string {
  const muc = mucDatNs(tyLe);
  if (muc === 'dat') return 'text-emerald-600 dark:text-emerald-400';
  if (muc === 'gan-dat') return 'text-amber-600 dark:text-amber-400';
  return muc === 'chua-dat' ? 'text-rose-600 dark:text-rose-400' : '';
}

/** NS hiển thị 2 chữ số thập phân; null → «—». */
export const fmtNsNhom = (ns: number | null | undefined) => formatNumberVN(ns, { minFractionDigits: 2, maxFractionDigits: 2 });
/** % đạt hiển thị tối đa 1 chữ số thập phân (không kèm «%»); null → «—». */
export const fmtTyLeNs = (tyLe: number | null | undefined) => formatNumberVN(tyLe, { maxFractionDigits: 1 });
