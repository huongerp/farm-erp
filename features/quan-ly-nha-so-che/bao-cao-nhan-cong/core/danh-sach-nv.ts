/**
 * Danh sách tên nhân viên theo chuyền (giống tờ chấm công giấy).
 * Chuyền có tên thì số công KHÔNG gõ tay nữa: dòng sub (CN ngày / CN nửa / tăng ca) sinh từ danh sách,
 * gom người cùng số giờ vào một dòng → bảng _ct / _ct_sub, KPI, thống kê, in, xuất giữ nguyên.
 */
import { gonTen, khoaTen } from '../../danh-gia-dau-vao/core/chuan-hoa-ten';
import { padSubToRowCount, subAlignedRowCount, type ChiTietSubFormByLoai, type CtSubFormRow } from './ct-sub';
import type { ChamCong, FarmBaoCaoNhanCongNv, LoaiChuyen, VarNhanVienSoChe } from './types';

/** Giờ mặc định khi thêm người — dữ liệu đã nhập: cả ngày luôn 7,5h; nửa ngày hay gặp 4–4,5h. */
export const GIO_CONG_MAC_DINH: Record<ChamCong, number> = { CA_NGAY: 7.5, NUA_NGAY: 4 };

/** Một người được tính bao nhiêu công (cả ngày 1, nửa ngày ½). */
export const CONG_THEO_CHAM_CONG: Record<ChamCong, number> = { CA_NGAY: 1, NUA_NGAY: 0.5 };

export interface NvFormRow {
  ho_ten: string;
  vi_tri: string | null;
  cham_cong: ChamCong;
  so_gio_cong: number;
  so_gio_tc: number;
  ghi_chu: string | null;
}

const num = (v: unknown) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};

export function nvFormRowMoi(nv?: Pick<VarNhanVienSoChe, 'ho_ten' | 'vi_tri'>): NvFormRow {
  return {
    ho_ten: nv?.ho_ten ?? '',
    vi_tri: nv?.vi_tri ?? null,
    cham_cong: 'CA_NGAY',
    so_gio_cong: GIO_CONG_MAC_DINH.CA_NGAY,
    so_gio_tc: 0,
    ghi_chu: null,
  };
}

/** Dòng có tên (bỏ dòng vừa thêm chưa gõ tên). */
export function nvCoTen(ds: readonly NvFormRow[] | undefined): NvFormRow[] {
  return (ds ?? []).filter((r) => gonTen(r.ho_ten) != null);
}

/** Gom số giờ thành dòng sub: mỗi mức giờ một dòng, sl = số người (giữ thứ tự gặp đầu). */
function gomTheoGio(gios: number[]): CtSubFormRow[] {
  const dem = new Map<number, number>();
  for (const g of gios) dem.set(g, (dem.get(g) ?? 0) + 1);
  return [...dem].map(([so_gio, sl_cong]) => ({ sl_cong, so_gio, ghi_chu: null }));
}

/** Sinh sub của một chuyền từ danh sách tên (3 mảng cùng độ dài, tối thiểu 1 dòng như form). */
export function subTuDanhSachNv(ds: readonly NvFormRow[] | undefined): ChiTietSubFormByLoai {
  const co = nvCoTen(ds);
  const gioCong = (cc: ChamCong) => co.filter((r) => r.cham_cong === cc).map((r) => num(r.so_gio_cong));
  const sub: ChiTietSubFormByLoai = {
    CN_NGAY: gomTheoGio(gioCong('CA_NGAY')),
    CN_NUA: gomTheoGio(gioCong('NUA_NGAY')),
    TANG_CA: gomTheoGio(co.map((r) => num(r.so_gio_tc)).filter((g) => g > 0)),
  };
  return padSubToRowCount(sub, Math.max(1, subAlignedRowCount(sub)));
}

export interface ViTriNv {
  chiTietIdx: number;
  idx: number;
}

/**
 * Người có tổng công trong phiếu > 1 (vd. cả ngày ở hai chuyền, hoặc cả ngày + nửa ngày).
 * Nửa ngày chuyền này + nửa ngày chuyền kia là hợp lệ.
 */
export function nguoiVuotMotCong(chiTiet: readonly { nhan_vien?: readonly NvFormRow[] }[]): ViTriNv[] {
  const tong = new Map<string, number>();
  const viTri = new Map<string, ViTriNv[]>();
  chiTiet.forEach((ct, chiTietIdx) => {
    (ct.nhan_vien ?? []).forEach((r, idx) => {
      const k = khoaTen(r.ho_ten);
      if (!k) return;
      tong.set(k, (tong.get(k) ?? 0) + CONG_THEO_CHAM_CONG[r.cham_cong]);
      viTri.set(k, [...(viTri.get(k) ?? []), { chiTietIdx, idx }]);
    });
  });
  return [...tong].filter(([, cong]) => cong > 1).flatMap(([k]) => viTri.get(k) ?? []);
}

/**
 * Người đang dùng của chuyền trong danh mục mà phiếu chưa có (ở bất kỳ chuyền nào) —
 * cho nút «Lấy cả nhóm của chuyền».
 */
export function nhomCuaChuyenChuaCo(
  danhMuc: readonly VarNhanVienSoChe[],
  loaiChuyen: LoaiChuyen,
  chiTiet: readonly { nhan_vien?: readonly NvFormRow[] }[]
): VarNhanVienSoChe[] {
  const daCo = new Set(chiTiet.flatMap((ct) => (ct.nhan_vien ?? []).map((r) => khoaTen(r.ho_ten))));
  return danhMuc
    .filter((nv) => nv.dang_dung && nv.loai_chuyen === loaiChuyen && !daCo.has(khoaTen(nv.ho_ten)))
    .sort((a, b) => a.thu_tu - b.thu_tu || a.ho_ten.localeCompare(b.ho_ten, 'vi'));
}

export function nvModelsToForm(rows: readonly FarmBaoCaoNhanCongNv[] | undefined): NvFormRow[] {
  return [...(rows ?? [])]
    .sort((a, b) => a.thu_tu - b.thu_tu)
    .map((r) => ({
      ho_ten: r.ho_ten,
      vi_tri: r.vi_tri,
      cham_cong: r.cham_cong,
      so_gio_cong: num(r.so_gio_cong),
      so_gio_tc: num(r.so_gio_tc),
      ghi_chu: r.ghi_chu,
    }));
}

/** Copy sang ngày kế: giữ người, vị trí, cả/nửa ngày; tăng ca và ghi chú là của riêng hôm đó. */
export function nvChoNgayKe(ds: readonly NvFormRow[] | undefined): NvFormRow[] {
  return nvCoTen(ds).map((r) => ({ ...r, so_gio_tc: 0, ghi_chu: null }));
}
