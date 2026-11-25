/**
 * Mục tiêu KPI theo farm × ngày hiệu lực (`fp_var_bcsc_kpi_muc_tieu`, migration 103) + tính lại phiếu đã lưu.
 * Ghi bảng cài đặt chỉ super admin (RLS `fn_la_super_admin`).
 */
import { db, throwDbError } from '../../../../lib/db';
import type { FarmBaoCaoKpiThuongRow } from '../../shared/kpi-thuong/types';
import {
  khoangApDung,
  tinhLaiDongKpiPreset,
  BCSC_SO_DONG_MUC_TIEU_CAI_DAT,
  type KpiMucTieuCaiDatRow,
} from '../core/kpi-muc-tieu-cai-dat';

const TABLE_CAI_DAT = 'fp_var_bcsc_kpi_muc_tieu';
const TABLE_PHIEU = 'fp_farm_bao_cao_so_che';
const TABLE_KPI = 'fp_farm_bao_cao_so_che_kpi';
const TRANG = 1000;
const LO_ID = 200;
const LO_GHI = 500;

export async function fetchKpiMucTieuCaiDat(): Promise<KpiMucTieuCaiDatRow[]> {
  const { data, error } = await db
    .from(TABLE_CAI_DAT)
    .select('id,id_chi_nhanh,ap_dung_tu,muc_tieu_nang_suat,muc_tieu_loi')
    .order('id_chi_nhanh', { ascending: true })
    .order('ap_dung_tu', { ascending: true });
  if (error) throwDbError(error, { resource: `${TABLE_CAI_DAT}.list` });
  return (data ?? []) as KpiMucTieuCaiDatRow[];
}

type Khoang = { idChiNhanh: number; tu: string; denTruoc: string | null };

function khoangTheoFarm(caiDat: KpiMucTieuCaiDatRow[], idChiNhanhList: (string | number)[], apDungTu: string): Khoang[] {
  return idChiNhanhList.map((id) => {
    const n = Number(id);
    if (!Number.isFinite(n)) throw new Error(`id chi nhánh không hợp lệ: ${id}`);
    return { idChiNhanh: n, ...khoangApDung(caiDat, n, apDungTu) };
  });
}

/** Số phiếu đã lưu sẽ bị tính lại nếu lưu bản `apDungTu` cho các farm này. */
export async function demPhieuAnhHuong(
  caiDat: KpiMucTieuCaiDatRow[],
  idChiNhanhList: (string | number)[],
  apDungTu: string
): Promise<number> {
  let tong = 0;
  for (const k of khoangTheoFarm(caiDat, idChiNhanhList, apDungTu)) {
    let q = db
      .from(TABLE_PHIEU)
      .select('id', { count: 'exact', head: true })
      .eq('id_chi_nhanh', k.idChiNhanh)
      .gte('ngay', k.tu);
    if (k.denTruoc) q = q.lt('ngay', k.denTruoc);
    const { count, error } = await q;
    if (error) throwDbError(error, { resource: `${TABLE_PHIEU}.count` });
    tong += count ?? 0;
  }
  return tong;
}

async function idPhieuTrongKhoang(k: Khoang): Promise<number[]> {
  const ids: number[] = [];
  for (let from = 0; ; from += TRANG) {
    let q = db.from(TABLE_PHIEU).select('id').eq('id_chi_nhanh', k.idChiNhanh).gte('ngay', k.tu);
    if (k.denTruoc) q = q.lt('ngay', k.denTruoc);
    const { data, error } = await q.order('id', { ascending: true }).range(from, from + TRANG - 1);
    if (error) throwDbError(error, { resource: `${TABLE_PHIEU}.list` });
    const lo = (data ?? []) as { id: number }[];
    ids.push(...lo.map((r) => Number(r.id)));
    if (lo.length < TRANG) return ids;
  }
}

type DongKpiDb = Pick<
  FarmBaoCaoKpiThuongRow,
  'id' | 'id_bao_cao' | 'thu_tu' | 'ten_hang_muc' | 'thuc_te' | 'danh_gia'
>;

export interface LuuKpiMucTieuInput {
  /** Danh sách cài đặt hiện có (để tìm mốc kế tiếp của từng farm). */
  caiDat: KpiMucTieuCaiDatRow[];
  idChiNhanhList: (string | number)[];
  /** `yyyy-mm-dd` */
  apDungTu: string;
  nangSuat: number | null;
  loi: number | null;
}

/**
 * Lưu bản mục tiêu cho các farm (ghi đè nếu trùng ngày hiệu lực) rồi tính lại 2 dòng preset
 * (Năng suất, Lỗi) của mọi phiếu farm đó có ngày trong khoảng hiệu lực. Trả số phiếu đã tính lại.
 */
export async function luuKpiMucTieu(input: LuuKpiMucTieuInput): Promise<number> {
  const { caiDat, idChiNhanhList, apDungTu, nangSuat, loi } = input;
  if (nangSuat == null && loi == null) throw new Error('Chưa nhập mục tiêu nào');
  const khoang = khoangTheoFarm(caiDat, idChiNhanhList, apDungTu);

  const banGhi = khoang.map((k) => ({
    id_chi_nhanh: k.idChiNhanh,
    ap_dung_tu: k.tu,
    muc_tieu_nang_suat: nangSuat,
    muc_tieu_loi: loi,
  }));
  const { error: eLuu } = await db
    .from(TABLE_CAI_DAT)
    .upsert(banGhi, { onConflict: 'id_chi_nhanh,ap_dung_tu' });
  if (eLuu) throwDbError(eLuu, { resource: `${TABLE_CAI_DAT}.upsert` });

  const mucTieuTheoDong = [nangSuat, loi];
  let soPhieu = 0;
  for (const k of khoang) {
    const ids = await idPhieuTrongKhoang(k);
    soPhieu += ids.length;
    for (let i = 0; i < ids.length; i += LO_ID) {
      const { data, error } = await db
        .from(TABLE_KPI)
        .select('id,id_bao_cao,thu_tu,ten_hang_muc,thuc_te,danh_gia')
        .in('id_bao_cao', ids.slice(i, i + LO_ID))
        .order('id_bao_cao', { ascending: true })
        .order('thu_tu', { ascending: true })
        .order('id', { ascending: true });
      if (error) throwDbError(error, { resource: `${TABLE_KPI}.list` });

      // Vị trí dòng trong phiếu (theo thu_tu) — giống cách form / chi tiết gán preset theo index.
      const viTri = new Map<string, number>();
      const capNhat: Record<string, unknown>[] = [];
      for (const r of (data ?? []) as DongKpiDb[]) {
        const key = String(r.id_bao_cao);
        const index = viTri.get(key) ?? 0;
        viTri.set(key, index + 1);
        if (index >= BCSC_SO_DONG_MUC_TIEU_CAI_DAT) continue;
        const patch = tinhLaiDongKpiPreset(r, index, mucTieuTheoDong[index]);
        if (!patch) continue;
        capNhat.push({ id: r.id, id_bao_cao: r.id_bao_cao, thu_tu: r.thu_tu, ten_hang_muc: r.ten_hang_muc, ...patch });
      }
      for (let j = 0; j < capNhat.length; j += LO_GHI) {
        const { error: eGhi } = await db
          .from(TABLE_KPI)
          .upsert(capNhat.slice(j, j + LO_GHI), { onConflict: 'id' });
        if (eGhi) throwDbError(eGhi, { resource: `${TABLE_KPI}.tinhLai` });
      }
    }
  }
  return soPhieu;
}
