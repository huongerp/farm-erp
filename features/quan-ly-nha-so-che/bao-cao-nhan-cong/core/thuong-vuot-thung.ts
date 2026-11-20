/**
 * Thưởng vượt thùng cho công nhân (chốt với NSC 20/11/2026, migration 087).
 *
 *   Giờ nhóm    = tổng giờ công (KHÔNG cộng giờ TC) của công nhân trong nhóm — bỏ vị trí nhóm trưởng / QL
 *                 (`khong_thuong_vuot` trong danh mục Vị trí).
 *   Ngưỡng thùng = ngưỡng% × mục tiêu NS phiếu × giờ nhóm   (90% × 3 = 2,7 thùng/giờ-người)
 *   Thùng vượt   = max(0, số thùng nhóm − ngưỡng thùng)
 *   Thùng vượt quy đổi = thùng vượt × hệ số chuyền × hệ số nhóm;  tiền = quy đổi × đơn giá (1.000đ)
 *   Chia trong nhóm theo giờ công; cuối tháng cộng các ngày × hệ số lỗi Ki rồi mới làm tròn.
 *
 * Nhóm đông người → ngưỡng cao, vượt ít, chia nhiều phần → mỗi người ít (đúng ý «bố trí nhiều thì nhận ít»).
 * Chỉ 5 chuyền sản xuất; dòng V (định biên) và Ngoài lô không tính. Tiền KHÔNG lưu DB.
 */
import { gonTen, khoaTen } from '../../danh-gia-dau-vao/core/chuan-hoa-ten';
import { mucTieuNsNhom, soThungCuaNhom, type SoThungNhom } from './nang-suat-nhom';
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

export interface KetQuaVuotNhom {
  nguongThung: number;
  thungVuot: number;
  thungVuotQuyDoi: number;
  tien: number;
}

/** Thưởng vượt của một nhóm; chưa nhập số thùng / không có giờ công nhân → null. */
export function thuongVuotNhom(p: {
  soThung: number | null;
  gioCong: number;
  mucTieu: number;
  nguongPct: number;
  heSoChuyen: number;
  heSoNhom: number;
  donGia: number;
}): KetQuaVuotNhom | null {
  if (p.soThung == null || !(p.gioCong > 0)) return null;
  const nguongThung = (p.nguongPct / 100) * p.mucTieu * p.gioCong;
  const thungVuot = Math.max(0, p.soThung - nguongThung);
  const thungVuotQuyDoi = thungVuot * p.heSoChuyen * p.heSoNhom;
  return { nguongThung, thungVuot, thungVuotQuyDoi, tien: thungVuotQuyDoi * p.donGia };
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
  id_nhan_vien?: string | number | null;
};

export interface NguoiThuongVuot<T extends DongNvVuot = DongNvVuot> {
  nv: T;
  gioCong: number;
  /** Phần thùng vượt quy đổi của người này (chưa làm tròn). */
  thungVuotQuyDoi: number;
  /** Tiền ngày (chưa làm tròn). */
  tien: number;
}

export interface NhomThuongVuot<T extends DongNvVuot = DongNvVuot> {
  soNhom: number;
  soThung: number | null;
  soCongNhan: number;
  /** Giờ công của công nhân (đã bỏ nhóm trưởng / QL). */
  gioCong: number;
  heSoChuyen: number;
  heSoNhom: number;
  nhomTuPhieu: boolean;
  /** null = chưa nhập số thùng hoặc không có giờ công nhân. */
  ketQua: KetQuaVuotNhom | null;
  /** Tiền của một công nhân làm 7,5h (hiện nhanh trên phiếu). */
  tienMoiGio: number;
  nguoi: NguoiThuongVuot<T>[];
}

/** Thưởng vượt từng nhóm của một chuyền (bỏ người chưa chia nhóm / không tên / vị trí loại trừ). */
export function tinhThuongVuotChuyen<T extends DongNvVuot>(
  chuyen: { loai_chuyen: LoaiChuyen; nhanVien: readonly T[]; soThungNhom: SoThungNhom | null | undefined; heSoNhom: HeSoNhom | null | undefined },
  mucTieu: number,
  caiDat: CaiDatThuongVuot,
  viTriLoai: ReadonlySet<string>
): NhomThuongVuot<T>[] {
  if (!(CHUYEN_PRODUCTION_CODES as readonly string[]).includes(chuyen.loai_chuyen)) return [];
  const theoNhom = new Map<number, T[]>();
  for (const r of chuyen.nhanVien) {
    if (r.so_nhom == null || gonTen(r.ho_ten) == null || !laNguoiNhanThuongVuot(r.vi_tri, viTriLoai)) continue;
    theoNhom.set(r.so_nhom, [...(theoNhom.get(r.so_nhom) ?? []), r]);
  }
  return [...theoNhom.entries()]
    .sort(([a], [b]) => a - b)
    .map(([soNhom, ds]) => {
      const gioCong = ds.reduce((s, r) => s + num(r.so_gio_cong), 0);
      const soThung = soThungCuaNhom(chuyen.soThungNhom, soNhom);
      const hs = heSoHieuLuc(caiDat, chuyen.loai_chuyen, soNhom, chuyen.heSoNhom);
      const ketQua = thuongVuotNhom({
        soThung,
        gioCong,
        mucTieu,
        nguongPct: caiDat.nguongPct,
        heSoChuyen: hs.heSoChuyen,
        heSoNhom: hs.heSoNhom,
        donGia: caiDat.donGia,
      });
      const phan = (gio: number) => (ketQua && gioCong > 0 ? gio / gioCong : 0);
      return {
        soNhom,
        soThung,
        soCongNhan: ds.length,
        gioCong,
        heSoChuyen: hs.heSoChuyen,
        heSoNhom: hs.heSoNhom,
        nhomTuPhieu: hs.nhomTuPhieu,
        ketQua,
        tienMoiGio: ketQua && gioCong > 0 ? ketQua.tien / gioCong : 0,
        nguoi: ds.map((nv) => {
          const g = num(nv.so_gio_cong);
          return { nv, gioCong: g, thungVuotQuyDoi: (ketQua?.thungVuotQuyDoi ?? 0) * phan(g), tien: (ketQua?.tien ?? 0) * phan(g) };
        }),
      };
    });
}

/** Khoá gộp một người qua các ngày: id danh mục, chưa gắn danh mục thì theo tên chuẩn hoá. */
export function khoaNguoi(nv: { id_nhan_vien?: string | number | null; ho_ten: string }): string {
  return nv.id_nhan_vien != null && String(nv.id_nhan_vien) !== '' ? `nv:${nv.id_nhan_vien}` : `ten:${khoaTen(nv.ho_ten)}`;
}

type PhieuVuot = Pick<FarmBaoCaoNhanCong, 'ngay' | 'chi_tiet' | 'muc_tieu_ns_nhom'>;

export interface ChuyenThuongVuot {
  loai_chuyen: LoaiChuyen;
  nhom: NhomThuongVuot[];
}

/** Thưởng vượt mọi chuyền sản xuất của một phiếu (chỉ chuyền có nhóm). */
export function thuongVuotCuaPhieu(phieu: PhieuVuot, caiDat: CaiDatThuongVuot, viTriLoai: ReadonlySet<string>): ChuyenThuongVuot[] {
  const mucTieu = mucTieuNsNhom(phieu.muc_tieu_ns_nhom);
  return (phieu.chi_tiet ?? []).flatMap((ct) => {
    const nhom = tinhThuongVuotChuyen(
      { loai_chuyen: ct.loai_chuyen, nhanVien: ct.nhan_vien ?? [], soThungNhom: ct.so_thung_nhom, heSoNhom: ct.he_so_nhom },
      mucTieu,
      caiDat,
      viTriLoai
    );
    return nhom.length > 0 ? [{ loai_chuyen: ct.loai_chuyen, nhom }] : [];
  });
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
  caiDat: CaiDatThuongVuot,
  viTriLoai: ReadonlySet<string>,
  heSoLoi: Readonly<Record<string, number>> = {}
): DongThuongThang[] {
  const theoNguoi = new Map<string, DongThuongThang & { _ngay: Set<string>; _ngayGanNhat: string }>();
  for (const phieu of [...phieus].sort((a, b) => a.ngay.localeCompare(b.ngay))) {
    for (const c of thuongVuotCuaPhieu(phieu, caiDat, viTriLoai)) {
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

/** Tra nhanh kết quả vượt theo chuyền → số nhóm (bảng tổng hợp nhóm của bản in / Excel). */
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
