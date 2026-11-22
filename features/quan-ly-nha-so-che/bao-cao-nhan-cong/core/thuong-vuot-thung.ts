/**
 * Thưởng vượt thùng cho công nhân (chốt với NSC 21/11/2026, thay bản 20/11).
 *
 *   Thùng vượt ngày = max(0, thu hồi thực tế − mục tiêu) — dòng KPI «Tỷ lệ thu hồi» của Báo cáo sơ chế
 *                     cùng ngày + nhà sơ chế (vd 211 − 196 = 15).
 *   Quỹ ngày        = thùng vượt × đơn giá (1.000đ), CHỈ khi KPI «Năng suất sơ chế» ≥ ngưỡng% mục tiêu
 *                     (`nguongPct`, mặc định 90); không đạt → 0.
 *   Giờ một người   = giờ công + giờ TC. Nhóm có người tăng ca → người không tăng ca («xuống sớm») không tính.
 *                     Bỏ vị trí nhóm trưởng / QL (`khong_thuong_vuot` trong danh mục Vị trí).
 *   Chia quỹ        = về từng nhóm (5 chuyền) theo giờ nhóm × hệ số chuyền × hệ số nhóm, trong nhóm theo giờ.
 *   Cuối tháng cộng các ngày × hệ số lỗi Ki rồi mới làm tròn. Tiền KHÔNG lưu DB (trừ ảnh chụp khi chốt tháng).
 */
import { gonTen, khoaTen } from '../../danh-gia-dau-vao/core/chuan-hoa-ten';
import { SO_NHOM_TOI_DA } from './tong-hop-nhom';
import { CHUYEN_PRODUCTION_CODES, type FarmBaoCaoNhanCong, type LoaiChuyen } from './types';

export const DON_GIA_VUOT_MAC_DINH = 1000;
export const NGUONG_NS_PCT_MAC_DINH = 90;
export const HE_SO_MAC_DINH = 1;
/** Trần hệ số (khớp CHECK 0–100 của migration 087). */
export const HE_SO_TOI_DA = 100;

/** Hệ số nhóm theo khoá "1".."9". */
export type HeSoNhom = Record<string, number>;

export interface CaiDatThuongVuot {
  donGia: number;
  /** % của mục tiêu NS phiếu. */
  nguongPct: number;
  heSoChuyen: Partial<Record<LoaiChuyen, number>>;
  /** Hệ số nhóm mặc định theo chuyền. */
  heSoNhom: Partial<Record<LoaiChuyen, HeSoNhom>>;
}

export const caiDatThuongVuotMacDinh = (): CaiDatThuongVuot => ({
  donGia: DON_GIA_VUOT_MAC_DINH,
  nguongPct: NGUONG_NS_PCT_MAC_DINH,
  heSoChuyen: {},
  heSoNhom: {},
});

const soHopLe = (v: unknown, min: number, max: number): number | null => {
  const n = typeof v === 'string' && v.trim() !== '' ? Number(v.trim().replace(',', '.')) : v;
  return typeof n === 'number' && Number.isFinite(n) && n >= min && n <= max ? n : null;
};

/** Hệ số gõ tay / đọc DB: "1,2" | 1.2 → số 0–100; trống / sai → null. */
export const docHeSo = (v: unknown): number | null => soHopLe(v, 0, HE_SO_TOI_DA);

/** Chuẩn hoá jsonb `he_so_nhom` (DB / form): chỉ giữ khoá 1–9 có hệ số hợp lệ. */
export function chuanHoaHeSoNhom(raw: unknown): HeSoNhom {
  const out: HeSoNhom = {};
  if (raw == null || typeof raw !== 'object' || Array.isArray(raw)) return out;
  for (let n = 1; n <= SO_NHOM_TOI_DA; n++) {
    const v = docHeSo((raw as Record<string, unknown>)[String(n)]);
    if (v != null) out[String(n)] = v;
  }
  return out;
}

/** Ô nhập hệ số nhóm trên phiếu: trống / sai → bỏ khoá (= dùng mặc định Cài đặt), KHÔNG thành 0. */
export function ganHeSoNhom(heSoNhom: HeSoNhom | null | undefined, soNhom: number, raw: string): HeSoNhom {
  const out = { ...chuanHoaHeSoNhom(heSoNhom) };
  const v = docHeSo(raw);
  if (v != null) out[String(soNhom)] = v;
  else delete out[String(soNhom)];
  return out;
}

export interface DongHeSoDb {
  loai_chuyen: string;
  so_nhom: number | null;
  he_so: number | string;
}

/** Ghép cài đặt từ 2 bảng Cài đặt (chưa có dòng = mặc định). */
export function caiDatTuDb(
  caiDat: { don_gia_vuot: number | string; nguong_ns_pct: number | string } | null | undefined,
  heSo: readonly DongHeSoDb[]
): CaiDatThuongVuot {
  const kq = caiDatThuongVuotMacDinh();
  kq.donGia = soHopLe(caiDat?.don_gia_vuot, 0, Number.MAX_SAFE_INTEGER) ?? DON_GIA_VUOT_MAC_DINH;
  const nguong = soHopLe(caiDat?.nguong_ns_pct, 0, 200);
  kq.nguongPct = nguong != null && nguong > 0 ? nguong : NGUONG_NS_PCT_MAC_DINH;
  const laChuyen = (s: string): s is LoaiChuyen => (CHUYEN_PRODUCTION_CODES as readonly string[]).includes(s);
  for (const r of heSo) {
    const hs = docHeSo(r.he_so);
    if (hs == null || !laChuyen(r.loai_chuyen)) continue;
    if (r.so_nhom == null) kq.heSoChuyen[r.loai_chuyen] = hs;
    else if (r.so_nhom >= 1 && r.so_nhom <= SO_NHOM_TOI_DA) {
      kq.heSoNhom[r.loai_chuyen] = { ...kq.heSoNhom[r.loai_chuyen], [String(r.so_nhom)]: hs };
    }
  }
  return kq;
}

/** Hệ số chuyền + hệ số nhóm đang áp: nhóm sửa trên phiếu → mặc định Cài đặt → 1. */
export function heSoHieuLuc(
  caiDat: CaiDatThuongVuot,
  loai: LoaiChuyen,
  soNhom: number,
  heSoNhomPhieu?: HeSoNhom | null
): { heSoChuyen: number; heSoNhom: number; nhomTuPhieu: boolean } {
  const k = String(soNhom);
  const tuPhieu = docHeSo(heSoNhomPhieu?.[k]);
  return {
    heSoChuyen: caiDat.heSoChuyen[loai] ?? HE_SO_MAC_DINH,
    heSoNhom: tuPhieu ?? caiDat.heSoNhom[loai]?.[k] ?? HE_SO_MAC_DINH,
    nhomTuPhieu: tuPhieu != null,
  };
}

/** Tập vị trí (khoá tên chuẩn hoá) không nhận thưởng vượt. */
export function viTriKhongThuongVuot(danhMuc: readonly { ten: string; khong_thuong_vuot?: boolean | null }[]): Set<string> {
  return new Set(danhMuc.filter((v) => v.khong_thuong_vuot).map((v) => khoaTen(v.ten)));
}

export const laNguoiNhanThuongVuot = (viTri: string | null | undefined, viTriLoai: ReadonlySet<string>) =>
  !viTriLoai.has(khoaTen(viTri));

/** KPI của Báo cáo sơ chế cùng ngày + nhà sơ chế (lấy từ dòng đã lưu). */
export interface KpiSoCheNgay {
  thuHoiThucTe: number | null;
  thuHoiMucTieu: number | null;
  nsThucTe: number | null;
  nsMucTieu: number | null;
}

/** Quỹ thưởng vượt của một ngày (cả nhà sơ chế). */
export interface QuyVuotNgay {
  thuHoiThucTe: number;
  thuHoiMucTieu: number;
  /** max(0, thu hồi thực tế − mục tiêu). */
  thungVuot: number;
  /** NS sơ chế thực tế ÷ mục tiêu × 100; null = Báo cáo sơ chế chưa có NS. */
  nsTyLe: number | null;
  datNs: boolean;
  /** datNs ? thùng vượt × đơn giá : 0. */
  quy: number;
}

const docSoKpi = (v: unknown): number | null => {
  if (v == null) return null;
  const s = String(v).trim().replace(/\s/g, '').replace(',', '.');
  if (s === '') return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
};

const TEN_KPI_NS = khoaTen('Năng suất sơ chế');
const TEN_KPI_THU_HOI = khoaTen('Tỷ lệ thu hồi');

/** Dòng KPI đã lưu của Báo cáo sơ chế → số cần cho thưởng vượt (khớp theo tên hạng mục, không theo thứ tự). */
export function kpiSoCheTuDong(
  rows: readonly { ten_hang_muc: string | null; muc_tieu: unknown; thuc_te: unknown }[] | null | undefined
): KpiSoCheNgay | null {
  if (!rows || rows.length === 0) return null;
  const tim = (ten: string) => rows.find((r) => khoaTen(r.ten_hang_muc) === ten);
  const ns = tim(TEN_KPI_NS);
  const th = tim(TEN_KPI_THU_HOI);
  return {
    thuHoiThucTe: docSoKpi(th?.thuc_te),
    thuHoiMucTieu: docSoKpi(th?.muc_tieu),
    nsThucTe: docSoKpi(ns?.thuc_te),
    nsMucTieu: docSoKpi(ns?.muc_tieu),
  };
}

/** Quỹ ngày; null = chưa có Báo cáo sơ chế hoặc thiếu số thu hồi (thực tế / mục tiêu > 0). */
export function quyVuotNgay(kpi: KpiSoCheNgay | null | undefined, caiDat: Pick<CaiDatThuongVuot, 'donGia' | 'nguongPct'>): QuyVuotNgay | null {
  if (!kpi || kpi.thuHoiThucTe == null || kpi.thuHoiMucTieu == null || !(kpi.thuHoiMucTieu > 0)) return null;
  const thungVuot = Math.max(0, kpi.thuHoiThucTe - kpi.thuHoiMucTieu);
  const nsTyLe = kpi.nsThucTe != null && kpi.nsMucTieu != null && kpi.nsMucTieu > 0 ? (kpi.nsThucTe / kpi.nsMucTieu) * 100 : null;
  const datNs = nsTyLe != null && nsTyLe >= caiDat.nguongPct;
  return { thuHoiThucTe: kpi.thuHoiThucTe, thuHoiMucTieu: kpi.thuHoiMucTieu, thungVuot, nsTyLe, datNs, quy: datNs ? thungVuot * caiDat.donGia : 0 };
}

const num = (v: unknown) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};

type DongNvVuot = {
  ho_ten: string;
  vi_tri: string | null;
  so_nhom: number | null;
  so_gio_cong: number;
  so_gio_tc: number;
  id_nhan_vien?: string | number | null;
};

/**
 * Giờ tính thưởng của từng người trong một nhóm (đã bỏ nhóm trưởng / QL): giờ công + giờ TC.
 * Nhóm có người tăng ca → người đi làm mà không tăng ca («xuống sớm») = 0 giờ, không nhận.
 * Nhóm không ai tăng ca → tính đủ.
 */
export function gioTinhThuong<T extends Pick<DongNvVuot, 'so_gio_cong' | 'so_gio_tc'>>(ds: readonly T[]): { nv: T; gio: number; xuongSom: boolean }[] {
  const nhomCoTc = ds.some((r) => num(r.so_gio_tc) > 0);
  return ds.map((nv) => {
    const cong = num(nv.so_gio_cong);
    const tc = num(nv.so_gio_tc);
    const xuongSom = nhomCoTc && tc <= 0 && cong > 0;
    return { nv, gio: xuongSom ? 0 : cong + tc, xuongSom };
  });
}

export interface NguoiThuongVuot<T extends DongNvVuot = DongNvVuot> {
  nv: T;
  /** Giờ tính thưởng (công + TC; xuống sớm = 0). */
  gioCong: number;
  xuongSom: boolean;
  /** Phần thùng vượt quy đổi của người này = tiền ÷ đơn giá (chưa làm tròn). */
  thungVuotQuyDoi: number;
  /** Tiền ngày (chưa làm tròn). */
  tien: number;
}

export interface NhomThuongVuot<T extends DongNvVuot = DongNvVuot> {
  soNhom: number;
  soCongNhan: number;
  soXuongSom: number;
  /** Tổng giờ tính thưởng của công nhân (công + TC, đã bỏ NT / QL / xuống sớm). */
  gioCong: number;
  heSoChuyen: number;
  heSoNhom: number;
  nhomTuPhieu: boolean;
  /** gio × hệ số chuyền × hệ số nhóm — phần của nhóm trong quỹ ngày. */
  trongSo: number;
  /** Tiền của nhóm (chưa làm tròn); 0 khi quỹ 0 / chưa có quỹ. */
  tien: number;
  /** Tiền của một công nhân làm 7,5h (hiện nhanh trên phiếu). */
  tienMoiGio: number;
  nguoi: NguoiThuongVuot<T>[];
}

type PhieuVuot = Pick<FarmBaoCaoNhanCong, 'ngay' | 'chi_tiet'>;

export interface ChuyenThuongVuot<T extends DongNvVuot = DongNvVuot> {
  /** Vị trí trong `chi_tiet` của phiếu (form tra theo chỉ số dòng). */
  idx: number;
  loai_chuyen: LoaiChuyen;
  nhom: NhomThuongVuot<T>[];
}

export interface ThuongVuotPhieu<T extends DongNvVuot = DongNvVuot> {
  /** null = chưa có Báo cáo sơ chế / thiếu số thu hồi → chưa tính được. */
  quy: QuyVuotNgay | null;
  chuyen: ChuyenThuongVuot<T>[];
}

/**
 * Thưởng vượt của một phiếu: quỹ ngày (từ Báo cáo sơ chế) chia cho mọi nhóm của 5 chuyền sản xuất theo
 * giờ × hệ số chuyền × hệ số nhóm, rồi trong nhóm chia theo giờ. Bỏ người chưa chia nhóm / không tên /
 * vị trí loại trừ; dòng V và Ngoài lô không tính.
 */
export function thuongVuotCuaPhieu<T extends DongNvVuot>(
  phieu: { chi_tiet?: readonly { loai_chuyen: LoaiChuyen; nhan_vien?: readonly T[] | null; he_so_nhom?: HeSoNhom | null }[] | null },
  kpi: KpiSoCheNgay | null | undefined,
  caiDat: CaiDatThuongVuot,
  viTriLoai: ReadonlySet<string>
): ThuongVuotPhieu<T> {
  const quy = quyVuotNgay(kpi, caiDat);
  const chuyen = (phieu.chi_tiet ?? []).flatMap((ct, idx) => {
    if (!(CHUYEN_PRODUCTION_CODES as readonly string[]).includes(ct.loai_chuyen)) return [];
    const theoNhom = new Map<number, T[]>();
    for (const r of ct.nhan_vien ?? []) {
      if (r.so_nhom == null || gonTen(r.ho_ten) == null || !laNguoiNhanThuongVuot(r.vi_tri, viTriLoai)) continue;
      theoNhom.set(r.so_nhom, [...(theoNhom.get(r.so_nhom) ?? []), r]);
    }
    if (theoNhom.size === 0) return [];
    const nhom = [...theoNhom.entries()]
      .sort(([a], [b]) => a - b)
      .map(([soNhom, ds]) => {
        const gio = gioTinhThuong(ds);
        const gioCong = gio.reduce((s, p) => s + p.gio, 0);
        const hs = heSoHieuLuc(caiDat, ct.loai_chuyen, soNhom, ct.he_so_nhom);
        return { soNhom, gio, gioCong, hs, trongSo: gioCong * hs.heSoChuyen * hs.heSoNhom };
      });
    return [{ idx, loai_chuyen: ct.loai_chuyen, nhom }];
  });
  const tongTrongSo = chuyen.reduce((s, c) => s + c.nhom.reduce((s2, g) => s2 + g.trongSo, 0), 0);
  const tienQuy = quy?.quy ?? 0;
  const donGia = caiDat.donGia > 0 ? caiDat.donGia : 0;
  return {
    quy,
    chuyen: chuyen.map((c) => ({
      idx: c.idx,
      loai_chuyen: c.loai_chuyen,
      nhom: c.nhom.map((g) => {
        const tien = tongTrongSo > 0 ? (tienQuy * g.trongSo) / tongTrongSo : 0;
        const phan = (h: number) => (g.gioCong > 0 ? h / g.gioCong : 0);
        return {
          soNhom: g.soNhom,
          soCongNhan: g.gio.length,
          soXuongSom: g.gio.filter((p) => p.xuongSom).length,
          gioCong: g.gioCong,
          heSoChuyen: g.hs.heSoChuyen,
          heSoNhom: g.hs.heSoNhom,
          nhomTuPhieu: g.hs.nhomTuPhieu,
          trongSo: g.trongSo,
          tien,
          tienMoiGio: g.gioCong > 0 ? tien / g.gioCong : 0,
          nguoi: g.gio.map((p) => {
            const tienNguoi = tien * phan(p.gio);
            return { nv: p.nv, gioCong: p.gio, xuongSom: p.xuongSom, tien: tienNguoi, thungVuotQuyDoi: donGia > 0 ? tienNguoi / donGia : 0 };
          }),
        };
      }),
    })),
  };
}

/** Khoá gộp một người qua các ngày: id danh mục, chưa gắn danh mục thì theo tên chuẩn hoá. */
export function khoaNguoi(nv: { id_nhan_vien?: string | number | null; ho_ten: string }): string {
  return nv.id_nhan_vien != null && String(nv.id_nhan_vien) !== '' ? `nv:${nv.id_nhan_vien}` : `ten:${khoaTen(nv.ho_ten)}`;
}

export interface NgayThuongVuot {
  ngay: string;
  loai_chuyen: LoaiChuyen;
  soNhom: number;
  gioCong: number;
  thungVuotQuyDoi: number;
  tien: number;
}

export interface DongThuongThang {
  khoa: string;
  ho_ten: string;
  id_nhan_vien: string | null;
  /** Vị trí ở ngày gần nhất. */
  vi_tri: string | null;
  /** Các chuyền đã làm, theo thứ tự chuyền. */
  chuyen: LoaiChuyen[];
  soNgay: number;
  gioCong: number;
  thungVuotQuyDoi: number;
  tienTruocKi: number;
  ki: number;
  /** round(tiền trước Ki × Ki). */
  tien: number;
  ngay: NgayThuongVuot[];
}

/**
 * Bảng thưởng vượt tháng của một nhà sơ chế: mỗi công nhân một dòng, gộp qua các ngày/chuyền.
 * `heSoLoi` theo khoá người; thiếu = 1. Người có tên trong nhóm nhưng thưởng 0 vẫn có dòng (để thấy đã tính).
 */
export function tongHopThuongThang(
  phieus: readonly PhieuVuot[],
  kpiTheoNgay: ReadonlyMap<string, KpiSoCheNgay>,
  caiDat: CaiDatThuongVuot,
  viTriLoai: ReadonlySet<string>,
  heSoLoi: Readonly<Record<string, number>> = {}
): DongThuongThang[] {
  const theoNguoi = new Map<string, DongThuongThang & { _ngay: Set<string>; _ngayGanNhat: string }>();
  for (const phieu of [...phieus].sort((a, b) => a.ngay.localeCompare(b.ngay))) {
    for (const c of thuongVuotCuaPhieu(phieu, kpiTheoNgay.get(phieu.ngay), caiDat, viTriLoai).chuyen) {
      for (const g of c.nhom) {
        for (const p of g.nguoi) {
          const khoa = khoaNguoi(p.nv);
          let d = theoNguoi.get(khoa);
          if (!d) {
            d = {
              khoa,
              ho_ten: gonTen(p.nv.ho_ten) ?? p.nv.ho_ten,
              id_nhan_vien: p.nv.id_nhan_vien != null ? String(p.nv.id_nhan_vien) : null,
              vi_tri: p.nv.vi_tri,
              chuyen: [],
              soNgay: 0,
              gioCong: 0,
              thungVuotQuyDoi: 0,
              tienTruocKi: 0,
              ki: 1,
              tien: 0,
              ngay: [],
              _ngay: new Set(),
              _ngayGanNhat: '',
            };
            theoNguoi.set(khoa, d);
          }
          if (phieu.ngay >= d._ngayGanNhat) {
            d._ngayGanNhat = phieu.ngay;
            d.vi_tri = p.nv.vi_tri;
            d.ho_ten = gonTen(p.nv.ho_ten) ?? d.ho_ten;
          }
          if (p.gioCong > 0) d._ngay.add(phieu.ngay);
          if (!d.chuyen.includes(c.loai_chuyen)) d.chuyen.push(c.loai_chuyen);
          d.gioCong += p.gioCong;
          d.thungVuotQuyDoi += p.thungVuotQuyDoi;
          d.tienTruocKi += p.tien;
          d.ngay.push({ ngay: phieu.ngay, loai_chuyen: c.loai_chuyen, soNhom: g.soNhom, gioCong: p.gioCong, thungVuotQuyDoi: p.thungVuotQuyDoi, tien: p.tien });
        }
      }
    }
  }
  const thuTu = (l: LoaiChuyen) => (CHUYEN_PRODUCTION_CODES as readonly string[]).indexOf(l);
  return [...theoNguoi.values()]
    .map(({ _ngay, _ngayGanNhat: _bo, ...d }) => {
      const ki = docHeSo(heSoLoi[d.khoa]) ?? 1;
      return { ...d, chuyen: [...d.chuyen].sort((a, b) => thuTu(a) - thuTu(b)), soNgay: _ngay.size, ki, tien: Math.round(d.tienTruocKi * ki) };
    })
    .sort((a, b) => thuTu(a.chuyen[0]) - thuTu(b.chuyen[0]) || a.ho_ten.localeCompare(b.ho_ten, 'vi'));
}

/** Tra nhanh kết quả vượt theo chuyền → số nhóm (bảng tổng hợp nhóm của bản in / Excel; phiếu đã lưu mỗi chuyền một dòng). */
export function vuotTheoChuyenNhom(ds: readonly ChuyenThuongVuot[]): Map<LoaiChuyen, Map<number, NhomThuongVuot>> {
  return new Map(ds.map((c) => [c.loai_chuyen, new Map(c.nhom.map((g) => [g.soNhom, g]))]));
}

export interface DongThuongVuotPhieu {
  ho_ten: string;
  loai_chuyen: LoaiChuyen;
  soNhom: number;
  gioCong: number;
  /** Đã làm tròn đồng. */
  tien: number;
}

/** Công nhân có thưởng vượt (> 0) trong một phiếu, theo thứ tự chuyền → nhóm → danh sách. */
export function dsThuongVuotPhieu(ds: readonly ChuyenThuongVuot[]): DongThuongVuotPhieu[] {
  return ds.flatMap((c) =>
    c.nhom.flatMap((g) =>
      g.nguoi
        .map((p) => ({ ho_ten: p.nv.ho_ten, loai_chuyen: c.loai_chuyen, soNhom: g.soNhom, gioCong: p.gioCong, tien: Math.round(p.tien) }))
        .filter((p) => p.tien > 0)
    )
  );
}
