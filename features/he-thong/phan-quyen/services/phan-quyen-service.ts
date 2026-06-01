import { supabase, fetchAllRows } from '../../../../lib/supabase';
import { PositionPermission, AccessLog, ModulePermission, ActionType } from '../core/types';
import { RoleFormValues } from '../core/schema';
import { TRANG_THAI_HOAT_DONG } from '../../../../lib/constants';
import {
  PERMISSION_FUNCTIONS,
  PERMISSION_ACTIONS,
  getAllPermissionModules,
  type PermissionActionType,
} from '../core/permission-modules-config';
import { getPositions } from '../../chuc-vu/services/chuc-vu-service';
import { getDepartments } from '../../phong-ban/services/phong-ban-service';
import i18n from '../../../../lib/i18n';

const TABLE_PHAN_QUYEN = 'fp_var_phan_quyen';
const TABLE_CHUC_VU = 'fp_var_chuc_vu';

/** Danh sách phẳng module: id, nameKey (UI dùng t(nameKey)), allowedActions = 6 quyền. Không gọi i18n lúc load để tránh lỗi chunk. */
export const SYSTEM_MODULES_CONFIG = getAllPermissionModules().map((m) => ({
  id: m.id,
  nameKey: m.nameKey,
  allowedActions: [...PERMISSION_ACTIONS] as ActionType[],
}));

/** Trả về nameKey của module (UI dùng t(getModuleName(id)) để hiển thị). */
export function getModuleName(moduleId: string): string {
  const m = SYSTEM_MODULES_CONFIG.find((x) => x.id === moduleId);
  return m?.nameKey ?? moduleId;
}

/** Quyền + thứ tự chức vụ cho phiên đăng nhập hiện tại (truy vấn nhẹ, không tải toàn bộ ma trận). */
export interface CurrentRoleContextData {
  quyenHan: ModulePermission[];
  thuTuChucVu: number;
}

/**
 * Chỉ đọc fp_var_phan_quyen theo chuc_vu_id và một dòng fp_var_chuc_vu (tt).
 * Dùng cho sidebar, guard module, dashboard — thay cho getRoles() toàn phần.
 */
export async function getCurrentRoleContext(chucVuId: string): Promise<CurrentRoleContextData> {
  const cvId = Number(chucVuId);
  if (Number.isNaN(cvId)) {
    return { quyenHan: [], thuTuChucVu: 999 };
  }

  const [pqRes, cvRes] = await Promise.all([
    supabase.from(TABLE_PHAN_QUYEN).select('module_id, actions').eq('chuc_vu_id', cvId),
    supabase.from(TABLE_CHUC_VU).select('tt').eq('id', cvId).maybeSingle(),
  ]);

  if (pqRes.error) throw new Error(pqRes.error.message);

  const quyenHan: ModulePermission[] = (pqRes.data ?? []).map((row: { module_id: string; actions?: string[] }) => ({
    module_id: row.module_id,
    module_name: getModuleName(row.module_id),
    actions: (row.actions ?? []) as ActionType[],
  }));

  const rawTt = cvRes.data?.tt;
  const thuTuChucVu =
    rawTt != null && !Number.isNaN(Number(rawTt)) ? Number(rawTt) : 999;

  return { quyenHan, thuTuChucVu };
}

/** Lấy danh sách chức vụ kèm quyền từ Supabase: fp_var_chuc_vu + fp_var_phan_quyen. */
export const getRoles = async (): Promise<PositionPermission[]> => {
  const [positions, departments, phanQuyenRows] = await Promise.all([
    getPositions(),
    getDepartments(),
    fetchAllRows<{ chuc_vu_id: number; module_id: string; actions: string[] }>((from, to) =>
      supabase
        .from(TABLE_PHAN_QUYEN)
        .select('id, chuc_vu_id, module_id, actions, tg_cap_nhat')
        .order('id', { ascending: true })
        .range(from, to)
    ),
  ]);

  const deptTtMap = new Map<string, number>();
  departments.forEach((d) => deptTtMap.set(d.id, d.tt ?? 0));

  const permByChucVu = new Map<string, { module_id: string; actions: ActionType[] }[]>();
  phanQuyenRows.forEach((row) => {
    const cvid = String(row.chuc_vu_id);
    if (!permByChucVu.has(cvid)) permByChucVu.set(cvid, []);
    permByChucVu.get(cvid)!.push({
      module_id: row.module_id,
      actions: (row.actions ?? []) as ActionType[],
    });
  });

  // Đếm nhân viên theo chức vụ qua RPC thay vì fetchAllRows('fp_var_nhan_vien','chuc_vu_id').
  // Trước đây kéo N dòng (có thể hàng nghìn) chỉ để GROUP BY ở client → rất tốn egress.
  // RPC trả về tối đa số chức vụ (vài chục dòng) → <1 KB. Xem docs/supabase-rpc_count_nhan_vien_by_chuc_vu.sql.
  let nhanVienCountMap: Record<string, number> = {};
  try {
    const { data: countRows, error: countErr } = await supabase.rpc('rpc_count_nhan_vien_by_chuc_vu');
    if (countErr) throw countErr;
    const typedCountRows = (countRows ?? []) as { chuc_vu_id: number | string; so_nhan_vien: number | string }[];
    nhanVienCountMap = typedCountRows.reduce<Record<string, number>>((acc, r) => {
      const id = String(r.chuc_vu_id);
      acc[id] = Number(r.so_nhan_vien) || 0;
      return acc;
    }, {});
  } catch {
    // RPC chưa được tạo hoặc quyền chưa cấp → an toàn trả 0 cho mọi chức vụ, không block getRoles.
  }

  return positions.map((pos) => {
    const quyenHanRows = permByChucVu.get(pos.id) ?? [];
    const quyen_han: ModulePermission[] = quyenHanRows.map((q) => ({
      module_id: q.module_id,
      module_name: getModuleName(q.module_id),
      actions: q.actions,
    }));

    const trangThai = pos.trang_thai === TRANG_THAI_HOAT_DONG.NGUNG_HOAT_DONG ? TRANG_THAI_HOAT_DONG.NGUNG_HOAT_DONG : TRANG_THAI_HOAT_DONG.DANG_HOAT_DONG;
    const thu_tu_phong_ban = pos.phong_ban_id ? (deptTtMap.get(pos.phong_ban_id) ?? 9999) : 9999;

    return {
      id: pos.id,
      id_chuc_vu: pos.id,
      ten_chuc_vu: pos.ten_chuc_vu ?? '',
      ma_chuc_vu: pos.ma_chuc_vu ?? `CV-${pos.id}`,
      ten_phong_ban: pos.ten_phong_ban ?? 'permission.matrix.otherDept',
      thu_tu_phong_ban: thu_tu_phong_ban,
      thu_tu_chuc_vu: pos.tt ?? 0,
      mo_ta: pos.mo_ta ?? null,
      so_nhan_vien: nhanVienCountMap[pos.id] ?? 0,
      quyen_han,
      trang_thai: trangThai,
      tg_cap_nhat: pos.tg_cap_nhat ?? new Date().toISOString(),
    };
  });
};

/** Tạo chức vụ mới và ghi quyền vào fp_var_phan_quyen. */
export const createRole = async (
  data: RoleFormValues,
  permissions: ModulePermission[],
): Promise<PositionPermission> => {
  const { data: insertedChucVu, error: errChucVu } = await supabase
    .from(TABLE_CHUC_VU)
    .insert({
      ten_chuc_vu: data.ten_vai_tro.trim(),
      phong_ban_id: null,
      cap_bac_id: null,
      mo_ta: data.mo_ta?.trim() ?? null,
      tt: 0,
      trang_thai: data.trang_thai,
    })
    .select('id, ten_chuc_vu, phong_ban_id, mo_ta, tt, trang_thai, tg_cap_nhat')
    .single();

  if (errChucVu) throw new Error(errChucVu.message ?? i18n.t('permission.matrix.loading'));
  const chucVuId = insertedChucVu.id;

  if (permissions.length > 0) {
    const rows = permissions.map((p) => ({
      chuc_vu_id: chucVuId,
      module_id: p.module_id,
      actions: p.actions,
    }));
    const { error: errPQ } = await supabase.from(TABLE_PHAN_QUYEN).insert(rows);
    if (errPQ) throw new Error(errPQ.message);
  }

  const id = String(chucVuId);
  const trangThai = insertedChucVu.trang_thai === TRANG_THAI_HOAT_DONG.NGUNG_HOAT_DONG ? TRANG_THAI_HOAT_DONG.NGUNG_HOAT_DONG : TRANG_THAI_HOAT_DONG.DANG_HOAT_DONG;
  return {
    id,
    id_chuc_vu: id,
    ten_chuc_vu: insertedChucVu.ten_chuc_vu ?? '',
    ma_chuc_vu: data.ma_vai_tro,
    ten_phong_ban: 'permission.matrix.otherDept',
    thu_tu_phong_ban: 9999,
    thu_tu_chuc_vu: insertedChucVu.tt ?? 0,
    mo_ta: insertedChucVu.mo_ta ?? null,
    so_nhan_vien: 0,
    quyen_han: permissions,
    trang_thai: trangThai,
    tg_cap_nhat: insertedChucVu.tg_cap_nhat ? new Date(insertedChucVu.tg_cap_nhat).toISOString() : new Date().toISOString(),
  };
};

/** Xóa chức vụ và toàn bộ quyền trong fp_var_phan_quyen (ids = id chức vụ). */
export const deleteRoles = async (ids: string[]): Promise<void> => {
  if (ids.length === 0) return;
  const numIds = ids.map((id) => Number(id)).filter((n) => !Number.isNaN(n));
  if (numIds.length === 0) return;

  const { error: errDelPQ } = await supabase.from(TABLE_PHAN_QUYEN).delete().in('chuc_vu_id', numIds);
  if (errDelPQ) throw new Error(errDelPQ.message);

  const { error: errDelCV } = await supabase.from(TABLE_CHUC_VU).delete().in('id', numIds);
  if (errDelCV) throw new Error(errDelCV.message);
};

/** Cập nhật quyền theo module: update/insert fp_var_phan_quyen (roleId = chuc_vu_id). */
export const updateModulePermissions = async (
  moduleId: string,
  updates: { roleId: string; actions: ActionType[] }[],
): Promise<void> => {
  if (updates.length === 0) return;

  const roleIds = updates.map((u) => Number(u.roleId)).filter((n) => !Number.isNaN(n));
  const { data: existing } = await supabase
    .from(TABLE_PHAN_QUYEN)
    .select('id, chuc_vu_id, module_id')
    .eq('module_id', moduleId)
    .in('chuc_vu_id', roleIds);

  const existingByChucVu = new Map<number, number>();
  (existing ?? []).forEach((row: { chuc_vu_id: number; id: number }) => {
    existingByChucVu.set(row.chuc_vu_id, row.id);
  });

  const toInsert: { chuc_vu_id: number; module_id: string; actions: ActionType[] }[] = [];
  const toUpdate: { id: number; actions: ActionType[] }[] = [];

  updates.forEach((u) => {
    const cvid = Number(u.roleId);
    if (Number.isNaN(cvid)) return;
    const id = existingByChucVu.get(cvid);
    if (id != null) toUpdate.push({ id, actions: u.actions });
    else toInsert.push({ chuc_vu_id: cvid, module_id: moduleId, actions: u.actions });
  });

  if (toUpdate.length > 0) {
    const results = await Promise.all(
      toUpdate.map(({ id, actions }) =>
        supabase.from(TABLE_PHAN_QUYEN).update({ actions, tg_cap_nhat: new Date().toISOString() }).eq('id', id),
      ),
    );
    const err = results.find((r) => r.error);
    if (err?.error) throw new Error(err.error.message);
  }
  if (toInsert.length > 0) {
    const { error } = await supabase.from(TABLE_PHAN_QUYEN).insert(toInsert);
    if (error) throw new Error(error.message);
  }
};

let dbLogs: AccessLog[] = [
  {
    id: 'log-1',
    id_nguoi_dung: 'user-123',
    ten_nguoi_dung: 'Nguyễn Văn Admin',
    hanh_dong: 'Phê duyệt',
    mo_ta: 'Duyệt yêu cầu sao lưu hệ thống',
    dia_chi_ip: '14.226.15.112',
    thiet_bi: 'Desktop / Chrome 122',
    trang_thai: 'Success',
    tg_thuc_hien: new Date().toISOString(),
  },
];

export const getLogs = async (): Promise<AccessLog[]> => {
  return [...dbLogs].sort(
    (a, b) => new Date(b.tg_thuc_hien).getTime() - new Date(a.tg_thuc_hien).getTime(),
  );
};

export { PERMISSION_FUNCTIONS, PERMISSION_ACTIONS, getAllPermissionModules };
export type { PermissionActionType };
