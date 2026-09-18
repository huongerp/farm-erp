import { db, fetchAllRows } from '../../../../lib/db';
import type { FarmDanhMuc } from '../core/types';
import type { FarmDanhMucFormValues } from '../core/schema';
import i18n from '../../../../lib/i18n';
import { bulkInsert, bulkUpdateById, bulkUpsert } from '../../../../lib/import-bulk';
import type { ImportErrorRow, ImportMode } from '../../../../lib/import-types';
import { planFarmDanhMucImport } from '../utils/import-danh-muc';

const TABLE = 'fp_farm_danh_muc_hang_hoa';
const TABLE_HANG_HOA = 'fp_farm_danh_sach_hang_hoa';

async function assertNoHangHoaReferences(idNums: number[]): Promise<void> {
  if (idNums.length === 0) return;
  const { data: byDm, error: e1 } = await db.from(TABLE_HANG_HOA).select('id').in('danh_muc_id', idNums).limit(1);
  if (e1) throw new Error(e1.message);
  if (byDm && byDm.length > 0) throw new Error(i18n.t('farmHangHoaPhanThuoc.danhMuc.service.hasHangHoa'));
  const { data: byCha, error: e2 } = await db.from(TABLE_HANG_HOA).select('id').in('danh_muc_cha_id', idNums).limit(1);
  if (e2) throw new Error(e2.message);
  if (byCha && byCha.length > 0) throw new Error(i18n.t('farmHangHoaPhanThuoc.danhMuc.service.hasHangHoa'));
}

const DM_COLUMNS = 'id,ma_danh_muc,ten_danh_muc,danh_muc_cha_id,thu_tu,mo_ta,tg_tao,tg_cap_nhat';

interface FarmDanhMucRow {
  id: number;
  ma_danh_muc: string | null;
  ten_danh_muc: string | null;
  danh_muc_cha_id: number | null;
  thu_tu: number | null;
  mo_ta: string | null;
  tg_tao: string | null;
  tg_cap_nhat: string | null;
}

function rowToFarmDanhMuc(row: FarmDanhMucRow): FarmDanhMuc {
  return {
    id: String(row.id),
    ma_danh_muc: row.ma_danh_muc ?? '',
    ten_danh_muc: row.ten_danh_muc ?? '',
    id_cha: row.danh_muc_cha_id != null ? String(row.danh_muc_cha_id) : null,
    thu_tu: row.thu_tu != null ? Math.max(1, row.thu_tu) : 1,
    mo_ta: row.mo_ta ?? undefined,
    tg_tao: row.tg_tao ?? new Date().toISOString(),
    tg_cap_nhat: row.tg_cap_nhat ?? new Date().toISOString(),
  };
}

export async function getAllFarmDanhMuc(): Promise<FarmDanhMuc[]> {
  const data = await fetchAllRows<FarmDanhMucRow>((from, to) =>
    db
      .from(TABLE)
      .select(DM_COLUMNS)
      .order('thu_tu', { ascending: true })
      .order('ma_danh_muc', { ascending: true })
      .range(from, to)
  );
  return data.map(rowToFarmDanhMuc);
}

export interface FarmDanhMucCap2WithParent {
  id: string;
  ten_danh_muc: string;
  id_cha: string | null;
  ten_danh_muc_cha: string;
}

export const getFarmDanhMucCap2WithParent = async (): Promise<FarmDanhMucCap2WithParent[]> => {
  const all = await getAllFarmDanhMuc();
  const byId: Record<string, string> = {};
  all.forEach((d) => {
    byId[d.id] = d.ten_danh_muc;
  });
  return all
    .filter((d) => d.id_cha != null && d.id_cha.trim() !== '')
    .map((d) => ({
      id: d.id,
      ten_danh_muc: d.ten_danh_muc,
      id_cha: d.id_cha,
      ten_danh_muc_cha: (d.id_cha && byId[d.id_cha]) ?? '',
    }));
};

export const getFarmDanhMucById = async (id: string): Promise<FarmDanhMuc | null> => {
  const idNum = Number(id);
  if (Number.isNaN(idNum)) return null;
  const { data: row, error } = await db.from(TABLE).select(DM_COLUMNS).eq('id', idNum).maybeSingle();
  if (error) throw new Error(error.message);
  if (!row) return null;
  return rowToFarmDanhMuc(row as FarmDanhMucRow);
};

export const createFarmDanhMuc = async (data: FarmDanhMucFormValues): Promise<FarmDanhMuc> => {
  const payload = {
    ma_danh_muc: data.ma_danh_muc.trim().toUpperCase(),
    ten_danh_muc: data.ten_danh_muc.trim(),
    danh_muc_cha_id: data.id_cha && data.id_cha.trim() ? Number(data.id_cha) : null,
    thu_tu: Math.max(1, data.thu_tu ?? 1),
    mo_ta: data.mo_ta?.trim() || null,
  };
  const { data: inserted, error } = await db.from(TABLE).insert(payload).select(DM_COLUMNS).single();
  if (error) throw new Error(error.message);
  return rowToFarmDanhMuc(inserted as FarmDanhMucRow);
};

export const updateFarmDanhMuc = async (id: string, data: FarmDanhMucFormValues): Promise<FarmDanhMuc> => {
  const idNum = Number(id);
  if (Number.isNaN(idNum)) throw new Error(i18n.t('farmHangHoaPhanThuoc.danhMuc.service.notFound'));
  const payload = {
    ma_danh_muc: data.ma_danh_muc.trim().toUpperCase(),
    ten_danh_muc: data.ten_danh_muc.trim(),
    danh_muc_cha_id: data.id_cha && data.id_cha.trim() ? Number(data.id_cha) : null,
    thu_tu: Math.max(1, data.thu_tu ?? 1),
    mo_ta: data.mo_ta?.trim() || null,
    tg_cap_nhat: new Date().toISOString(),
  };
  const { data: updated, error } = await db
    .from(TABLE)
    .update(payload)
    .eq('id', idNum)
    .select(DM_COLUMNS)
    .single();
  if (error) throw new Error(error.message ?? i18n.t('farmHangHoaPhanThuoc.danhMuc.service.notFound'));
  return rowToFarmDanhMuc(updated as FarmDanhMucRow);
};

export const deleteFarmDanhMuc = async (id: string): Promise<void> => {
  const idNum = Number(id);
  if (Number.isNaN(idNum)) throw new Error(i18n.t('farmHangHoaPhanThuoc.danhMuc.service.notFound'));
  const { data: children, error: errSelect } = await db
    .from(TABLE)
    .select('id')
    .eq('danh_muc_cha_id', idNum)
    .limit(1);
  if (errSelect) throw new Error(errSelect.message);
  if (children && children.length > 0) throw new Error(i18n.t('farmHangHoaPhanThuoc.danhMuc.service.hasChildren'));
  await assertNoHangHoaReferences([idNum]);
  const { error } = await db.from(TABLE).delete().eq('id', idNum);
  if (error) throw new Error(error.message ?? i18n.t('farmHangHoaPhanThuoc.danhMuc.service.notFound'));
};

export const deleteFarmDanhMucMany = async (ids: string[]): Promise<void> => {
  if (ids.length === 0) return;
  const idNums = ids.map(Number).filter((n) => !Number.isNaN(n));
  if (idNums.length === 0) return;
  const { data: children } = await db
    .from(TABLE)
    .select('id, danh_muc_cha_id')
    .in('danh_muc_cha_id', idNums)
    .limit(1);
  if (children && children.length > 0) throw new Error(i18n.t('farmHangHoaPhanThuoc.danhMuc.service.hasChildren'));
  await assertNoHangHoaReferences(idNums);
  const { error } = await db.from(TABLE).delete().in('id', idNums);
  if (error) throw new Error(error.message ?? i18n.t('farmHangHoaPhanThuoc.danhMuc.service.notFound'));
};

// ---------------------------------------------------------------------------
// Import hàng loạt
// ---------------------------------------------------------------------------

export interface FarmDanhMucImportResult {
  created: number;
  updated: number;
  errors: ImportErrorRow[];
}

interface DanhMucWriteItem {
  row: number;
  values: Record<string, unknown>;
  existingId: string | null;
  payload: Record<string, unknown>;
}

function toError(item: { row: number; values: Record<string, unknown> }, msg: string): ImportErrorRow {
  return { row: item.row, msg, values: item.values };
}

/** Ghi một nhóm dòng đã chốt đủ `danh_muc_cha_id`. Trả về số thêm mới / cập nhật + lỗi. */
async function writeDanhMucGroup(
  items: DanhMucWriteItem[],
  mode: ImportMode
): Promise<{ created: number; updated: number; errors: ImportErrorRow[] }> {
  const errors: ImportErrorRow[] = [];
  let created = 0;
  let updated = 0;
  if (items.length === 0) return { created, updated, errors };

  const toInsert = items.filter((i) => i.existingId == null);
  const toUpdate = items.filter((i) => i.existingId != null) as (DanhMucWriteItem & { existingId: string })[];

  if (mode === 'upsert' && toUpdate.length > 0) {
    const tagged = items.map((i) => ({ ...i, isUpdate: i.existingId != null }));
    const res = await bulkUpsert(TABLE, tagged, 'ma_danh_muc');
    if (!res.unsupported) {
      res.done.forEach((item) => {
        if (item.isUpdate) updated++;
        else created++;
      });
      res.failed.forEach(({ item, msg }) => errors.push(toError(item, msg)));
      return { created, updated, errors };
    }
  }

  if (toInsert.length > 0) {
    const res = await bulkInsert(TABLE, toInsert);
    created = res.done.length;
    res.failed.forEach(({ item, msg }) => errors.push(toError(item, msg)));
  }
  if (toUpdate.length > 0) {
    const res = await bulkUpdateById(
      TABLE,
      toUpdate.map((i) => ({ ...i, id: i.existingId }))
    );
    updated = res.done.length;
    res.failed.forEach(({ item, msg }) => errors.push(toError(item, msg)));
  }
  return { created, updated, errors };
}

/**
 * Import hàng loạt danh mục farm (cây 2 cấp).
 *
 * Ghi cấp 1 trước rồi mới cấp 2: dòng cấp 2 được phép trỏ tới danh mục cha nằm ngay
 * trong cùng file, id của cha chỉ có sau khi cha đã được ghi.
 */
export const importFarmDanhMuc = async (
  rows: Record<string, unknown>[],
  { mode }: { mode: ImportMode }
): Promise<FarmDanhMucImportResult> => {
  const existingAll = await getAllFarmDanhMuc();
  const plan = planFarmDanhMucImport(
    rows,
    {
      existing: existingAll.map((d) => ({
        id: d.id,
        ma_danh_muc: d.ma_danh_muc,
        ten_danh_muc: d.ten_danh_muc,
        id_cha: d.id_cha,
      })),
      mode,
    }
  );

  const errors: ImportErrorRow[] = [...plan.errors];
  const now = new Date().toISOString();
  const thuTuById = new Map(existingAll.map((d) => [d.id, d.thu_tu]));
  let nextThuTu = existingAll.reduce((max, d) => Math.max(max, d.thu_tu ?? 0), 0) + 1;

  const build = (r: (typeof plan.rows)[number], danhMucChaId: number | null): DanhMucWriteItem => {
    const thuTu =
      r.payload.thu_tu ??
      (r.existingId != null ? thuTuById.get(r.existingId) ?? 1 : nextThuTu++);
    return {
      row: r.row,
      values: r.values,
      existingId: r.existingId,
      payload: {
        ma_danh_muc: r.payload.ma_danh_muc,
        ten_danh_muc: r.payload.ten_danh_muc,
        danh_muc_cha_id: danhMucChaId,
        thu_tu: Math.max(1, thuTu),
        mo_ta: r.payload.mo_ta,
        tg_cap_nhat: now,
      },
    };
  };

  const cap1 = plan.rows.filter((r) => r.parentCode === null);
  const cap2 = plan.rows.filter((r) => r.parentCode !== null);

  const r1 = await writeDanhMucGroup(cap1.map((r) => build(r, null)), mode);
  errors.push(...r1.errors);
  let created = r1.created;
  let updated = r1.updated;

  if (cap2.length > 0) {
    // Cha vừa được tạo trong lượt trên → phải tra lại id theo mã.
    const missingParents = [...new Set(cap2.filter((r) => r.parentId == null).map((r) => r.parentCode!))];
    const parentIdByCode = new Map<string, number>();
    if (missingParents.length > 0) {
      const { data, error } = await db.from(TABLE).select('id,ma_danh_muc').in('ma_danh_muc', missingParents);
      if (error) throw new Error(error.message);
      (data ?? []).forEach((d: { id: number; ma_danh_muc: string | null }) => {
        if (d.ma_danh_muc) parentIdByCode.set(d.ma_danh_muc.trim().toUpperCase(), d.id);
      });
    }

    const ready: DanhMucWriteItem[] = [];
    cap2.forEach((r) => {
      const parentId = r.parentId ?? parentIdByCode.get(r.parentCode!) ?? null;
      if (parentId == null) {
        errors.push(toError(r, i18n.t('farmHangHoaPhanThuoc.danhMuc.import.errParentNotFound', { value: r.parentCode })));
        return;
      }
      ready.push(build(r, parentId));
    });

    const r2 = await writeDanhMucGroup(ready, mode);
    errors.push(...r2.errors);
    created += r2.created;
    updated += r2.updated;
  }

  return { created, updated, errors: errors.sort((a, b) => a.row - b.row) };
};
