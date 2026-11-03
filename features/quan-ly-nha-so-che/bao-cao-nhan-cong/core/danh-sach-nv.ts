/**
 * Danh sách tên nhân viên theo chuyền (giống tờ chấm công giấy).
 * Chuyền có tên thì số công KHÔNG gõ tay nữa: dòng sub (CN ngày / CN nửa / tăng ca) sinh từ danh sách,
 * gom người cùng số giờ vào một dòng → bảng _ct / _ct_sub, KPI, thống kê, in, xuất giữ nguyên.
 */
import { gonTen, khoaTen } from '../../danh-gia-dau-vao/core/chuan-hoa-ten';
import { padSubToRowCount, subAlignedRowCount, type ChiTietSubFormByLoai, type CtSubFormRow } from './ct-sub';
import type { ChamCong, FarmBaoCaoNhanCong, FarmBaoCaoNhanCongCt, FarmBaoCaoNhanCongNv, LoaiChuyen, VarNhanVienSoChe } from './types';
import { chuyenTtLabelByThuTu, normalizeChiTietForDisplay, NGOAI_LE_CODE } from './types';

/** Giờ mặc định khi thêm người — cả ngày 7,5h = sáng 3,75h + chiều 3,75h; nghỉ 0h; NUA_NGAY là mã cũ (4h). */
export const GIO_CONG_MAC_DINH: Record<ChamCong, number> = { CA_NGAY: 7.5, SANG: 3.75, CHIEU: 3.75, NUA_NGAY: 4, NGHI: 0 };

/** Một người được tính bao nhiêu công (cả ngày 1, sáng / chiều / nửa ngày ½, nghỉ 0). */
export const CONG_THEO_CHAM_CONG: Record<ChamCong, number> = { CA_NGAY: 1, SANG: 0.5, CHIEU: 0.5, NUA_NGAY: 0.5, NGHI: 0 };

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

/** Buổi của một mã chấm công. NUA_NGAY (phiếu cũ) và NGHI không gán buổi nào → cả hai false. */
export function buoiCuaChamCong(cc: ChamCong): { sang: boolean; chieu: boolean } {
  return { sang: cc === 'SANG' || cc === 'CA_NGAY', chieu: cc === 'CHIEU' || cc === 'CA_NGAY' };
}

/** Ngược lại của buoiCuaChamCong: không buổi nào → null. */
export function chamCongTuBuoi(sang: boolean, chieu: boolean): ChamCong | null {
  if (sang && chieu) return 'CA_NGAY';
  if (sang) return 'SANG';
  if (chieu) return 'CHIEU';
  return null;
}

/** Mặc định khi thêm người: trước 12h (giờ địa phương) chỉ chấm Sáng, từ 12h chấm cả ngày. */
export function chamCongMacDinh(now: Date = new Date()): ChamCong {
  return now.getHours() < 12 ? 'SANG' : 'CA_NGAY';
}

/** Đổi mã chấm công: giờ còn là mặc định của mã cũ thì đổi theo mặc định mã mới; giờ đã sửa tay thì giữ. */
function doiChamCong(row: NvFormRow, cc: ChamCong): NvFormRow {
  if (row.cham_cong === cc) return row;
  const gio = row.so_gio_cong === GIO_CONG_MAC_DINH[row.cham_cong] ? GIO_CONG_MAC_DINH[cc] : row.so_gio_cong;
  return { ...row, cham_cong: cc, so_gio_cong: gio };
}

/**
 * Bật/tắt một buổi. Tắt buổi cuối cùng thì giữ nguyên dòng (nghỉ cả ngày = nút Nghỉ).
 * NUA_NGAY (không rõ buổi) / NGHI bấm buổi nào thành đúng buổi đó.
 */
export function doiBuoi(row: NvFormRow, buoi: 'sang' | 'chieu'): NvFormRow {
  if (row.cham_cong === 'NUA_NGAY' || row.cham_cong === 'NGHI') return doiChamCong(row, buoi === 'sang' ? 'SANG' : 'CHIEU');
  const cur = buoiCuaChamCong(row.cham_cong);
  const cc = chamCongTuBuoi(buoi === 'sang' ? !cur.sang : cur.sang, buoi === 'chieu' ? !cur.chieu : cur.chieu);
  return cc ? doiChamCong(row, cc) : row;
}

/** Bật/tắt Nghỉ cả ngày: bật thì ép 0 giờ công + 0 giờ TC (kể cả giờ đã sửa tay); tắt thì về mặc định theo giờ. */
export function doiNghi(row: NvFormRow, now: Date = new Date()): NvFormRow {
  if (row.cham_cong !== 'NGHI') return { ...row, cham_cong: 'NGHI', so_gio_cong: 0, so_gio_tc: 0 };
  const cc = chamCongMacDinh(now);
  return { ...row, cham_cong: cc, so_gio_cong: GIO_CONG_MAC_DINH[cc] };
}

/** «Chấm chiều cả chuyền»: dòng chỉ có Sáng thành Cả ngày, dòng khác giữ nguyên. */
export function chamChieuCaChuyen(ds: readonly NvFormRow[]): NvFormRow[] {
  return ds.map((r) => (r.cham_cong === 'SANG' ? doiChamCong(r, 'CA_NGAY') : r));
}

export function nvFormRowMoi(nv?: Pick<VarNhanVienSoChe, 'ho_ten' | 'vi_tri'>, now: Date = new Date()): NvFormRow {
  const cham_cong = chamCongMacDinh(now);
  return {
    ho_ten: nv?.ho_ten ?? '',
    vi_tri: nv?.vi_tri ?? null,
    cham_cong,
    so_gio_cong: GIO_CONG_MAC_DINH[cham_cong],
    so_gio_tc: 0,
    ghi_chu: null,
  };
}

/** Dòng có tên (bỏ dòng vừa thêm chưa gõ tên). */
export function nvCoTen(ds: readonly NvFormRow[] | undefined): NvFormRow[] {
  return (ds ?? []).filter((r) => gonTen(r.ho_ten) != null);
}

/** Ngoại lệ giữ buổi đi làm, tuyệt đối không quy đổi thành giờ hay đầu vào KPI. */
export function nvKhongTinhGio(ds: readonly NvFormRow[]): NvFormRow[] {
  return ds.map((r) => ({ ...r, so_gio_cong: 0, so_gio_tc: 0 }));
}

export function tongHopNgoaiLe(ds: readonly Pick<NvFormRow, 'ho_ten' | 'cham_cong'>[]) {
  const coTen = ds.filter((r) => gonTen(r.ho_ten) != null);
  return {
    soNguoi: coTen.length,
    sang: coTen.filter((r) => buoiCuaChamCong(r.cham_cong).sang).length,
    chieu: coTen.filter((r) => buoiCuaChamCong(r.cham_cong).chieu).length,
    cong: coTen.reduce((s, r) => s + CONG_THEO_CHAM_CONG[r.cham_cong], 0),
  };
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
    CN_NUA: gomTheoGio([...gioCong('SANG'), ...gioCong('CHIEU'), ...gioCong('NUA_NGAY')]),
    TANG_CA: gomTheoGio(co.map((r) => num(r.so_gio_tc)).filter((g) => g > 0)),
  };
  return padSubToRowCount(sub, Math.max(1, subAlignedRowCount(sub)));
}

export interface ViTriNv {
  chiTietIdx: number;
  idx: number;
}

/**
 * Người bị chấm sai trong phiếu: tổng công > 1 (vd. cả ngày + nửa ngày), HOẶC cùng một buổi
 * (sáng / chiều) xuất hiện 2 lần (vd. Sáng chuyền A + Sáng chuyền B). Sáng chuyền A + Chiều chuyền B
 * là hợp lệ. NUA_NGAY không gán buổi, chỉ tính ½ công.
 */
export function nguoiVuotMotCong(chiTiet: readonly { nhan_vien?: readonly NvFormRow[] }[]): ViTriNv[] {
  const tong = new Map<string, number>();
  const demBuoi = new Map<string, { sang: number; chieu: number }>();
  const viTri = new Map<string, ViTriNv[]>();
  chiTiet.forEach((ct, chiTietIdx) => {
    (ct.nhan_vien ?? []).forEach((r, idx) => {
      const k = khoaTen(r.ho_ten);
      if (!k) return;
      tong.set(k, (tong.get(k) ?? 0) + CONG_THEO_CHAM_CONG[r.cham_cong]);
      const b = buoiCuaChamCong(r.cham_cong);
      const d = demBuoi.get(k) ?? { sang: 0, chieu: 0 };
      demBuoi.set(k, { sang: d.sang + (b.sang ? 1 : 0), chieu: d.chieu + (b.chieu ? 1 : 0) });
      viTri.set(k, [...(viTri.get(k) ?? []), { chiTietIdx, idx }]);
    });
  });
  return [...tong]
    .filter(([k, cong]) => cong > 1 || (demBuoi.get(k)?.sang ?? 0) > 1 || (demBuoi.get(k)?.chieu ?? 0) > 1)
    .flatMap(([k]) => viTri.get(k) ?? []);
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

/** Copy sang ngày kế: giữ người + vị trí, chấm công đặt lại mặc định theo giờ (không kế thừa «cả ngày»); tăng ca và ghi chú là của riêng hôm đó. */
export function nvChoNgayKe(ds: readonly NvFormRow[] | undefined, now: Date = new Date()): NvFormRow[] {
  const cham_cong = chamCongMacDinh(now);
  return nvCoTen(ds).map((r) => ({ ...r, cham_cong, so_gio_cong: GIO_CONG_MAC_DINH[cham_cong], so_gio_tc: 0, ghi_chu: null }));
}

export interface NhomNvTheoChuyen {
  /** Nhãn TT của chuyền trên phiếu (I…IV, V). */
  tt: string;
  /** Thứ tự chuyền trên phiếu (0 = đầu) — để sắp khi gộp nhiều phiếu. */
  thuTuChuyen: number;
  ct: FarmBaoCaoNhanCongCt;
  nhanVien: FarmBaoCaoNhanCongNv[];
}

/** Tên theo chuyền đúng thứ tự trên phiếu (chuyền SX, dòng V, Ngoại lệ), bỏ chuyền không có tên. */
export function nhomNhanVienTheoChuyen(data: Pick<FarmBaoCaoNhanCong, 'chi_tiet'>): NhomNvTheoChuyen[] {
  const { production, vRow } = normalizeChiTietForDisplay(data.chi_tiet ?? []);
  const ngoaiLe = (data.chi_tiet ?? []).find((ct) => ct.loai_chuyen === NGOAI_LE_CODE);
  return [
    ...production.map((ct, i) => ({ ct, tt: chuyenTtLabelByThuTu(i + 1), thuTuChuyen: i })),
    { ct: vRow, tt: 'V', thuTuChuyen: production.length },
    ...(ngoaiLe ? [{ ct: ngoaiLe, tt: 'VI', thuTuChuyen: production.length + 1 }] : []),
  ]
    .map((g) => ({ ...g, nhanVien: [...(g.ct.nhan_vien ?? [])].sort((a, b) => a.thu_tu - b.thu_tu) }))
    .filter((g) => g.nhanVien.length > 0);
}
