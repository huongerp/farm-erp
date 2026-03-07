import { supabase } from '../../../../lib/supabase';
import {
  COLLECTION_TO_TABLE,
  RESTORE_ORDER,
  DELETE_ORDER,
  FK_BY_COLLECTION,
  isSupportedCollection,
} from '../core/backup-config';
import type { BackupPayload } from '../core/types';
import { DataCollection, ExportHistoryRecord, ExportFormat, RestoreMode } from '../core/types';

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/** Bảng lịch sử sao lưu/khôi phục trên Supabase */
const TABLE_BACKUP = 'fp_var_backup';

// === Collections: chỉ những bảng có Supabase mới export/restore được ===
export const SYSTEM_COLLECTIONS: DataCollection[] = [
  { id: 'chi_nhanh', label: 'Chi nhánh', description: 'Danh sách chi nhánh công ty', icon: 'Building2', recordCount: 0 },
  { id: 'phong_ban', label: 'Phòng ban', description: 'Cơ cấu tổ chức, sơ đồ phòng ban', icon: 'Building2', recordCount: 0 },
  { id: 'chuc_vu', label: 'Chức vụ', description: 'Danh mục chức danh, vị trí công việc', icon: 'Briefcase', recordCount: 0 },
  { id: 'cap_bac', label: 'Cấp bậc', description: 'Hệ thống thang bảng lương/level', icon: 'Award', recordCount: 0 },
  { id: 'nhan_vien', label: 'Nhân viên', description: 'Hồ sơ nhân sự, thông tin cá nhân, liên hệ', icon: 'Users', recordCount: 0 },
  { id: 'phan_quyen', label: 'Phân quyền', description: 'Ma trận quyền hạn theo chức vụ', icon: 'Shield', recordCount: 0 },
  { id: 'cau_hinh', label: 'Cấu hình hệ thống', description: 'Thiết lập chung, thông tin công ty', icon: 'Settings', recordCount: 0 },
  // Các bảng chưa có trên Supabase – giữ trong danh sách nhưng không export/restore
  { id: 'hop_dong', label: 'Hợp đồng LĐ', description: 'Hợp đồng lao động, phụ lục', icon: 'FileText', recordCount: 0 },
  { id: 'cham_cong', label: 'Chấm công', description: 'Dữ liệu chấm công vân tay, lịch sử', icon: 'Clock', recordCount: 0 },
  { id: 'luong', label: 'Bảng lương', description: 'Tính lương, thuế, bảo hiểm', icon: 'Wallet', recordCount: 0 },
  { id: 'don_tu', label: 'Đơn từ / Nghỉ phép', description: 'Đơn xin nghỉ, đơn công tác', icon: 'Mail', recordCount: 0 },
];

/** Chuyển dòng fp_var_backup từ DB sang ExportHistoryRecord */
function rowToHistoryRecord(row: Record<string, unknown>): ExportHistoryRecord {
  const collections = row.collections;
  return {
    id: String(row.id),
    ten_file: String(row.ten_file ?? ''),
    collections: Array.isArray(collections) ? collections.map(String) : [],
    format: (row.format as ExportFormat) ?? 'json',
    dung_luong: String(row.dung_luong ?? ''),
    tg_tao: row.tg_tao ? new Date(row.tg_tao as string).toISOString() : new Date().toISOString(),
    nguoi_thuc_hien: String(row.nguoi_thuc_hien ?? ''),
    loai: (row.loai as 'export' | 'import' | 'restore') ?? 'export',
    trang_thai: Number(row.trang_thai) === 2 ? 2 : Number(row.trang_thai) === 0 ? 0 : 1,
    ghi_chu: row.ghi_chu != null ? String(row.ghi_chu) : undefined,
  };
}

/** Ghi bản ghi lịch sử lên Supabase (fp_var_backup) */
async function insertHistoryRecord(record: ExportHistoryRecord): Promise<void> {
  const { error } = await supabase.from(TABLE_BACKUP).insert({
    id: record.id,
    ten_file: record.ten_file,
    collections: record.collections,
    format: record.format,
    dung_luong: record.dung_luong,
    tg_tao: record.tg_tao,
    nguoi_thuc_hien: record.nguoi_thuc_hien,
    loai: record.loai,
    trang_thai: record.trang_thai,
    ghi_chu: record.ghi_chu ?? null,
  });
  if (error) throw new Error(`Lưu lịch sử backup: ${error.message}`);
}

/** Lấy toàn bộ dữ liệu từ một bảng Supabase (có phân trang nếu > 1000 dòng) */
async function fetchTableFromSupabase(tableName: string): Promise<unknown[]> {
  const pageSize = 1000;
  let from = 0;
  const all: unknown[] = [];
  let hasMore = true;
  while (hasMore) {
    const { data, error } = await supabase
      .from(tableName)
      .select('*')
      .range(from, from + pageSize - 1);
    if (error) throw new Error(`${tableName}: ${error.message}`);
    const rows = data ?? [];
    all.push(...rows);
    hasMore = rows.length === pageSize;
    from += pageSize;
  }
  return all;
}

/** Export: lấy dữ liệu từ Supabase cho các collection được hỗ trợ, trả về payload + kích thước gần đúng */
async function fetchBackupPayload(collections: string[]): Promise<{ payload: BackupPayload; sizeBytes: number }> {
  const data: Record<string, unknown[]> = {};
  const toFetch = collections.filter(isSupportedCollection);
  if (toFetch.length === 0) {
    throw new Error('Không có bộ dữ liệu nào được hỗ trợ sao lưu. Chọn Chi nhánh, Phòng ban, Chức vụ, Cấp bậc, Nhân viên, Phân quyền hoặc Cấu hình.');
  }
  for (const collId of toFetch) {
    const table = COLLECTION_TO_TABLE[collId];
    if (!table) continue;
    const rows = await fetchTableFromSupabase(table);
    data[collId] = rows;
  }
  const payload: BackupPayload = {
    meta: { exportedAt: new Date().toISOString(), collections: toFetch },
    data,
  };
  const json = JSON.stringify(payload);
  return { payload, sizeBytes: new Blob([json]).size };
}

/** Tạo file và kích hoạt tải xuống */
function downloadBlob(blob: Blob, fileName: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  a.click();
  URL.revokeObjectURL(url);
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// === Service functions ===

export const getHistory = async (): Promise<ExportHistoryRecord[]> => {
  const { data, error } = await supabase
    .from(TABLE_BACKUP)
    .select('*')
    .order('tg_tao', { ascending: false });
  if (error) throw new Error(`Đọc lịch sử backup: ${error.message}`);
  return (data ?? []).map((row) => rowToHistoryRecord(row as Record<string, unknown>));
};

export const exportData = async (
  collections: string[],
  format: ExportFormat,
  ghi_chu?: string
): Promise<ExportHistoryRecord> => {
  const supported = collections.filter(isSupportedCollection);
  if (supported.length === 0) {
    throw new Error('Không có bộ dữ liệu nào được hỗ trợ. Chọn ít nhất một trong: Chi nhánh, Phòng ban, Chức vụ, Cấp bậc, Nhân viên, Phân quyền, Cấu hình.');
  }
  const { payload, sizeBytes } = await fetchBackupPayload(supported);
  const fileName = `backup_${supported.join('_')}_${new Date().toISOString().slice(0, 10)}.json`;
  const collectionLabels = supported.map((id) => SYSTEM_COLLECTIONS.find((c) => c.id === id)?.label ?? id);

  if (format === 'json') {
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    downloadBlob(blob, fileName);
  } else {
    // CSV/XLSX: chỉ xuất JSON để đơn giản; có thể mở rộng dùng thư viện xlsx sau
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    downloadBlob(blob, fileName.replace(/\.(csv|xlsx)$/, '.json'));
  }

  const record: ExportHistoryRecord = {
    id: `EXP-${Date.now()}`,
    ten_file: fileName,
    collections: supported,
    format: 'json',
    dung_luong: formatSize(sizeBytes),
    tg_tao: new Date().toISOString(),
    nguoi_thuc_hien: 'Hệ thống',
    loai: 'export',
    trang_thai: 1,
    ghi_chu: ghi_chu ?? `Xuất ${collectionLabels.join(', ')}`,
  };
  await insertHistoryRecord(record);
  return record;
};

/** Map id cũ → id mới sau khi insert (thứ tự hàng giữ nguyên) */
type IdMap = Record<string, Record<number | string, number>>;

function applyIdMap(
  row: Record<string, unknown>,
  fkMap: Record<string, string>,
  idMap: IdMap
): Record<string, unknown> {
  const out = { ...row };
  for (const [col, parentColl] of Object.entries(fkMap)) {
    const parentMap = idMap[parentColl];
    if (!parentMap) continue;
    const oldFk = out[col];
    if (oldFk != null && parentMap[oldFk as number] != null) {
      out[col] = parentMap[oldFk as number];
    }
  }
  return out;
}

/** Xóa cột id để DB tự sinh (tránh lỗi GENERATED ALWAYS AS IDENTITY) */
function stripId(row: Record<string, unknown>): Record<string, unknown> {
  const { id: _id, ...rest } = row;
  return rest;
}

export const restoreData = async (
  fileName: string,
  payloadOrJson: BackupPayload | string,
  collections: string[],
  mode: RestoreMode,
  ghi_chu?: string
): Promise<ExportHistoryRecord> => {
  const payload: BackupPayload =
    typeof payloadOrJson === 'string'
      ? (JSON.parse(payloadOrJson) as BackupPayload)
      : payloadOrJson;

  if (!payload?.data || typeof payload.data !== 'object') {
    throw new Error('File backup không đúng định dạng (thiếu data).');
  }

  const toRestore = collections.filter(isSupportedCollection);
  if (toRestore.length === 0) {
    throw new Error('Không có bộ dữ liệu nào được hỗ trợ khôi phục.');
  }

  const hasData = toRestore.some((c) => Array.isArray(payload.data[c]) && payload.data[c].length > 0);
  if (!hasData) {
    throw new Error('File backup không chứa dữ liệu cho bộ đã chọn. Kiểm tra định dạng file (cần trường data với key trùng tên bộ dữ liệu).');
  }

  const idMap: IdMap = {};

  if (mode === 'replace') {
    const toDelete = toRestore
      .filter((c) => (payload.data[c]?.length ?? 0) > 0)
      .sort((a, b) => DELETE_ORDER.indexOf(a) - DELETE_ORDER.indexOf(b));
    for (const collId of toDelete) {
      const table = COLLECTION_TO_TABLE[collId];
      if (!table) continue;
      const { error } = await supabase.from(table).delete().gte('id', 0);
      if (error) throw new Error(`${table}: ${error.message}`);
    }
  }

  const insertOrder = RESTORE_ORDER.filter((c) => toRestore.includes(c));
  for (const collId of insertOrder) {
    const rows = payload.data[collId];
    if (!Array.isArray(rows) || rows.length === 0) continue;

    const table = COLLECTION_TO_TABLE[collId];
    if (!table) continue;

    const fkMap = FK_BY_COLLECTION[collId] ?? {};
    const mappedRows = rows.map((r) => {
      let row = typeof r === 'object' && r != null ? { ...(r as Record<string, unknown>) } : {};
      if (mode === 'replace' && Object.keys(fkMap).length > 0) {
        row = applyIdMap(row as Record<string, unknown>, fkMap, idMap);
      }
      if (mode === 'replace') {
        row = stripId(row as Record<string, unknown>);
      }
      return row;
    });

    if (mode === 'upsert') {
      const { data: upserted, error } = await supabase
        .from(table)
        .upsert(mappedRows, { onConflict: 'id', ignoreDuplicates: false });
      if (error) throw new Error(`${table} (upsert): ${error.message}`);
      if (upserted && collId in FK_BY_COLLECTION) {
        idMap[collId] = {};
        upserted.forEach((row: unknown, i: number) => {
          const r = row as { id?: number };
          const old = mappedRows[i] as { id?: number };
          if (r?.id != null && old?.id != null) idMap[collId][old.id] = r.id;
        });
      }
    } else {
      const { data: inserted, error } = await supabase.from(table).insert(mappedRows).select('id');
      if (error) throw new Error(`${table} (insert): ${error.message}`);
      const insertedIds = (inserted ?? []).map((r: { id: number }) => r.id);
      idMap[collId] = {};
      rows.forEach((r: unknown, i: number) => {
        const oldId = r != null && typeof r === 'object' && 'id' in r ? (r as { id: number }).id : undefined;
        if (oldId != null && insertedIds[i] != null) idMap[collId][oldId] = insertedIds[i];
      });
    }
  }

  const record: ExportHistoryRecord = {
    id: `RST-${Date.now()}`,
    ten_file: fileName,
    collections: toRestore,
    format: 'json',
    dung_luong: '—',
    tg_tao: new Date().toISOString(),
    nguoi_thuc_hien: 'Hệ thống',
    loai: 'restore',
    trang_thai: 1,
    ghi_chu:
      ghi_chu ??
      `Khôi phục ${mode === 'upsert' ? '(cập nhật/thêm mới)' : '(thay thế toàn bộ)'}`,
  };
  await insertHistoryRecord(record);
  return record;
};

export const deleteHistory = async (ids: string[]): Promise<void> => {
  if (ids.length === 0) return;
  const { error } = await supabase.from(TABLE_BACKUP).delete().in('id', ids);
  if (error) throw new Error(`Xóa lịch sử backup: ${error.message}`);
};
