import { db, throwDbError } from '../../../../lib/db';
import { buildHeSoGoiY, parseHeSo, type HeSoGoiY, type HeSoLichSuRow } from '../core/he-so-quy-doi';
import { normalizePhamCapKey } from '../core/pham-cap';
import type { HeSoCaiDatRow } from '../core/he-so-cai-dat';

const TABLE_PCAP = 'fp_farm_bao_cao_so_che_pham_cap';
const TABLE_CAI_DAT = 'fp_var_bcsc_he_so_quy_doi';
/** Đủ để có mọi hệ số đang dùng (vài dòng / phiếu × vài trăm phiếu gần nhất). */
const LICH_SU_LIMIT = 1000;

/** Hệ số quy đổi đã lưu trên các phiếu trước → danh sách để chọn + hệ số gần nhất theo phẩm cấp. */
export async function fetchHeSoQuyDoiGoiY(): Promise<HeSoGoiY> {
  const { data, error } = await db
    .from(TABLE_PCAP)
    .select('ten_pham_cap,he_so_quy_doi')
    .not('he_so_quy_doi', 'is', null)
    .order('id', { ascending: false })
    .limit(LICH_SU_LIMIT);
  if (error) throwDbError(error, { resource: `${TABLE_PCAP}.heSoQuyDoi` });
  return buildHeSoGoiY((data ?? []) as HeSoLichSuRow[]);
}

/** Toàn bộ cài đặt hệ số theo farm × phẩm cấp (bảng nhỏ, một farm vài dòng). */
export async function fetchCaiDatHeSo(): Promise<HeSoCaiDatRow[]> {
  const { data, error } = await db
    .from(TABLE_CAI_DAT)
    .select('id,id_chi_nhanh,ten_pham_cap,he_so_quy_doi')
    .order('id_chi_nhanh', { ascending: true })
    .order('ten_pham_cap', { ascending: true });
  if (error) throwDbError(error, { resource: `${TABLE_CAI_DAT}.list` });
  return ((data ?? []) as HeSoCaiDatRow[]).map((r) => ({
    ...r,
    he_so_quy_doi: Number(r.he_so_quy_doi),
  }));
}

export interface CaiDatHeSoDong {
  ten_pham_cap: string;
  /** `null` = bỏ cài đặt dòng này (xoá dòng trong DB). */
  he_so_quy_doi: number | null;
}

/**
 * Lưu cài đặt của MỘT farm: đọc dòng hiện có rồi update / insert / delete từng dòng.
 * Không dùng upsert vì unique index là biểu thức `lower(btrim(ten_pham_cap))` — PostgREST
 * không nhận onConflict theo biểu thức. Chỉ admin gọi được (RLS).
 */
export async function luuCaiDatHeSo(
  idChiNhanh: string | number,
  rows: CaiDatHeSoDong[]
): Promise<void> {
  const id = Number(idChiNhanh);
  if (!Number.isFinite(id)) throw new Error(`id chi nhánh không hợp lệ: ${idChiNhanh}`);

  const { data: hienCo, error: eDoc } = await db
    .from(TABLE_CAI_DAT)
    .select('id,ten_pham_cap')
    .eq('id_chi_nhanh', id);
  if (eDoc) throwDbError(eDoc, { resource: `${TABLE_CAI_DAT}.list` });

  const theoKey = new Map<string, { id: string | number; ten_pham_cap: string }>();
  for (const r of (hienCo ?? []) as { id: string | number; ten_pham_cap: string }[]) {
    const key = normalizePhamCapKey(r.ten_pham_cap);
    if (key && !theoKey.has(key)) theoKey.set(key, r);
  }

  const canChen: { id_chi_nhanh: number; ten_pham_cap: string; he_so_quy_doi: number }[] = [];
  const canXoa: (string | number)[] = [];
  for (const row of rows) {
    const ten = typeof row.ten_pham_cap === 'string' ? row.ten_pham_cap.trim() : '';
    if (!ten) continue;
    const heSo = parseHeSo(row.he_so_quy_doi);
    const daCo = theoKey.get(normalizePhamCapKey(ten));
    if (heSo == null) {
      if (daCo) canXoa.push(daCo.id);
      continue;
    }
    if (daCo) {
      const { error } = await db
        .from(TABLE_CAI_DAT)
        .update({ he_so_quy_doi: heSo })
        .eq('id', daCo.id);
      if (error) throwDbError(error, { resource: `${TABLE_CAI_DAT}.update` });
    } else {
      canChen.push({ id_chi_nhanh: id, ten_pham_cap: ten, he_so_quy_doi: heSo });
    }
  }

  if (canChen.length > 0) {
    const { error } = await db.from(TABLE_CAI_DAT).insert(canChen);
    if (error) throwDbError(error, { resource: `${TABLE_CAI_DAT}.insert` });
  }
  if (canXoa.length > 0) {
    const { error } = await db.from(TABLE_CAI_DAT).delete().in('id', canXoa);
    if (error) throwDbError(error, { resource: `${TABLE_CAI_DAT}.delete` });
  }
}
