/**
 * Thưởng vượt thùng (migration 087): cài đặt đơn giá / ngưỡng / hệ số theo nhà sơ chế và
 * hệ số lỗi Ki theo tháng. Tiền tính ở `core/thuong-vuot-thung.ts`, không lưu DB.
 */
import { db, throwDbError } from '../../../../lib/db';
import { caiDatTuDb, docHeSo, type CaiDatThuongVuot, type DongHeSoDb } from '../core/thuong-vuot-thung';
import { CHUYEN_PRODUCTION_CODES } from '../core/types';
import { SO_NHOM_TOI_DA } from '../core/tong-hop-nhom';

const TABLE_CAI_DAT = 'fp_var_bcnc_cai_dat_thuong';
const TABLE_HE_SO = 'fp_var_bcnc_he_so_ns';
const TABLE_KI = 'fp_farm_bcnc_he_so_loi_thang';

const idSo = (idChiNhanh: string) => {
  const n = Number(idChiNhanh);
  if (!Number.isFinite(n)) throw new Error(`id chi nhánh không hợp lệ: ${idChiNhanh}`);
  return n;
};

export async function getCaiDatThuongVuot(idChiNhanh: string): Promise<CaiDatThuongVuot> {
  const id = idSo(idChiNhanh);
  const [cd, hs] = await Promise.all([
    db.from(TABLE_CAI_DAT).select('don_gia_vuot,nguong_ns_pct').eq('id_chi_nhanh', id).maybeSingle(),
    db.from(TABLE_HE_SO).select('loai_chuyen,so_nhom,he_so').eq('id_chi_nhanh', id),
  ]);
  if (cd.error) throwDbError(cd.error, { resource: TABLE_CAI_DAT });
  if (hs.error) throwDbError(hs.error, { resource: TABLE_HE_SO });
  return caiDatTuDb(cd.data as { don_gia_vuot: number; nguong_ns_pct: number } | null, (hs.data ?? []) as DongHeSoDb[]);
}

/** Lưu cả bộ cài đặt: upsert đơn giá + ngưỡng, thay toàn bộ hệ số của nhà sơ chế (ô trống = xoá dòng = 1). */
export async function luuCaiDatThuongVuot(idChiNhanh: string, caiDat: CaiDatThuongVuot): Promise<void> {
  const id = idSo(idChiNhanh);
  const { error: e1 } = await db
    .from(TABLE_CAI_DAT)
    .upsert({ id_chi_nhanh: id, don_gia_vuot: caiDat.donGia, nguong_ns_pct: caiDat.nguongPct }, { onConflict: 'id_chi_nhanh' });
  if (e1) throwDbError(e1, { resource: `${TABLE_CAI_DAT}.upsert` });

  const dong: { id_chi_nhanh: number; loai_chuyen: string; so_nhom: number | null; he_so: number }[] = [];
  for (const loai of CHUYEN_PRODUCTION_CODES) {
    const hsChuyen = docHeSo(caiDat.heSoChuyen[loai]);
    if (hsChuyen != null) dong.push({ id_chi_nhanh: id, loai_chuyen: loai, so_nhom: null, he_so: hsChuyen });
    for (let n = 1; n <= SO_NHOM_TOI_DA; n++) {
      const hs = docHeSo(caiDat.heSoNhom[loai]?.[String(n)]);
      if (hs != null) dong.push({ id_chi_nhanh: id, loai_chuyen: loai, so_nhom: n, he_so: hs });
    }
  }
  // Index unique dùng biểu thức coalesce(so_nhom,0) nên không upsert được → xoá rồi chèn lại.
  const { error: e2 } = await db.from(TABLE_HE_SO).delete().eq('id_chi_nhanh', id);
  if (e2) throwDbError(e2, { resource: `${TABLE_HE_SO}.delete` });
  if (dong.length > 0) {
    const { error: e3 } = await db.from(TABLE_HE_SO).insert(dong);
    if (e3) throwDbError(e3, { resource: `${TABLE_HE_SO}.insert` });
  }
}

/** Ngày đầu tháng từ "yyyy-mm". */
export const ngayDauThang = (thang: string) => `${thang.slice(0, 7)}-01`;

/** Hệ số lỗi Ki của tháng: khoá người → Ki. */
export async function getHeSoLoiThang(idChiNhanh: string, thang: string): Promise<Record<string, number>> {
  const { data, error } = await db
    .from(TABLE_KI)
    .select('khoa_nv,he_so_loi')
    .eq('id_chi_nhanh', idSo(idChiNhanh))
    .eq('thang', ngayDauThang(thang));
  if (error) throwDbError(error, { resource: TABLE_KI });
  const out: Record<string, number> = {};
  for (const r of (data ?? []) as { khoa_nv: string; he_so_loi: number | string }[]) {
    const v = docHeSo(r.he_so_loi);
    if (v != null) out[r.khoa_nv] = v;
  }
  return out;
}

export interface LuuHeSoLoi {
  idChiNhanh: string;
  thang: string;
  khoa: string;
  hoTen: string;
  idNhanVien: string | null;
  /** null = về mặc định 1 (xoá dòng). */
  heSoLoi: number | null;
}

export async function luuHeSoLoiThang(p: LuuHeSoLoi): Promise<void> {
  const id = idSo(p.idChiNhanh);
  const thang = ngayDauThang(p.thang);
  if (p.heSoLoi == null || p.heSoLoi === 1) {
    const { error } = await db.from(TABLE_KI).delete().eq('id_chi_nhanh', id).eq('thang', thang).eq('khoa_nv', p.khoa);
    if (error) throwDbError(error, { resource: `${TABLE_KI}.delete` });
    return;
  }
  const idNv = p.idNhanVien != null && Number.isFinite(Number(p.idNhanVien)) ? Number(p.idNhanVien) : null;
  const { error } = await db
    .from(TABLE_KI)
    .upsert(
      { id_chi_nhanh: id, thang, khoa_nv: p.khoa, id_nhan_vien: idNv, ho_ten: p.hoTen, he_so_loi: p.heSoLoi },
      { onConflict: 'id_chi_nhanh,thang,khoa_nv' }
    );
  if (error) throwDbError(error, { resource: `${TABLE_KI}.upsert` });
}
