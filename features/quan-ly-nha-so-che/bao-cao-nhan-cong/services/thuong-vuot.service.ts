/**
 * Thưởng vượt thùng (migration 087): cài đặt đơn giá / ngưỡng / hệ số theo nhà sơ chế và
 * hệ số lỗi Ki theo tháng. Tiền tính ở `core/thuong-vuot-thung.ts`; chỉ lưu ảnh chụp khi chốt tháng (089).
 */
import { db, throwDbError } from '../../../../lib/db';
import { caiDatTuDb, docHeSo, type CaiDatThuongVuot, type DongHeSoDb, type DongThuongThang } from '../core/thuong-vuot-thung';
import { dongChotTuThuongThang, dongThuongTuChot, type DongChotDb } from '../core/chot-thuong-thang';
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

// ---------------------------------------------------------------------------
// Chốt thưởng tháng (migration 089): ảnh chụp số tiền từng người; ghi chỉ qua RPC.
// ---------------------------------------------------------------------------

const TABLE_CHOT = 'fp_farm_bcnc_chot_thang';

export interface ChotThuongThang {
  id: string;
  tgChot: string;
  nguoiChot: string | null;
  soNguoi: number;
  tongTien: number;
  donGia: number | null;
  nguongPct: number | null;
  dong: DongThuongThang[];
}

/** Ảnh chụp tháng đã chốt của một nhà sơ chế; chưa chốt → null. */
export async function getChotThang(idChiNhanh: string, thang: string): Promise<ChotThuongThang | null> {
  const { data, error } = await db
    .from(TABLE_CHOT)
    .select(
      'id,tg_chot,so_nguoi,tong_tien,don_gia_vuot,nguong_ns_pct,nguoi:fp_var_nhan_vien!nguoi_chot(ho_va_ten),' +
        'dong:fp_farm_bcnc_chot_thang_ct(thu_tu,khoa_nv,id_nhan_vien,ho_ten,vi_tri,chuyen,so_ngay,gio_cong,thung_vuot,tien_truoc_ki,ki,tien,chi_tiet_ngay)'
    )
    .eq('id_chi_nhanh', idSo(idChiNhanh))
    .eq('thang', ngayDauThang(thang))
    .maybeSingle();
  if (error) throwDbError(error, { resource: TABLE_CHOT });
  if (!data) return null;
  const r = data as unknown as {
    id: number;
    tg_chot: string;
    so_nguoi: number;
    tong_tien: number | string;
    don_gia_vuot: number | string | null;
    nguong_ns_pct: number | string | null;
    nguoi: { ho_va_ten: string | null } | null;
    dong: DongChotDb[] | null;
  };
  const soHoacNull = (v: number | string | null) => (v == null ? null : Number(v));
  return {
    id: String(r.id),
    tgChot: r.tg_chot,
    nguoiChot: r.nguoi?.ho_va_ten ?? null,
    soNguoi: Number(r.so_nguoi) || 0,
    tongTien: Number(r.tong_tien) || 0,
    donGia: soHoacNull(r.don_gia_vuot),
    nguongPct: soHoacNull(r.nguong_ns_pct),
    dong: dongThuongTuChot(r.dong ?? []),
  };
}

export interface ChotThangInput {
  idChiNhanh: string;
  thang: string;
  caiDat: CaiDatThuongVuot;
  ds: readonly DongThuongThang[];
}

export async function chotThang(p: ChotThangInput): Promise<void> {
  const { error } = await db.rpc('rpc_bcnc_chot_thang', {
    p_id_chi_nhanh: idSo(p.idChiNhanh),
    p_thang: ngayDauThang(p.thang),
    p_don_gia: p.caiDat.donGia,
    p_nguong_pct: p.caiDat.nguongPct,
    p_dong: dongChotTuThuongThang(p.ds),
  });
  if (error) throwDbError(error, { resource: 'rpc_bcnc_chot_thang' });
}

export async function moChotThang(idChiNhanh: string, thang: string): Promise<void> {
  const { error } = await db.rpc('rpc_bcnc_mo_chot_thang', { p_id_chi_nhanh: idSo(idChiNhanh), p_thang: ngayDauThang(thang) });
  if (error) throwDbError(error, { resource: 'rpc_bcnc_mo_chot_thang' });
}
