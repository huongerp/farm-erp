/** Payload file backup: meta + data theo từng bảng (key = collection id) */
export interface BackupPayload {
  meta?: { exportedAt?: string; collections?: string[] };
  data: Record<string, unknown[]>;
}

export type ExportFormat = 'csv' | 'xlsx' | 'json';
export type RestoreMode = 'upsert' | 'replace';
export type RestoreStatus = 'idle' | 'uploading' | 'selecting' | 'restoring' | 'done' | 'error';

export interface DataCollection {
  id: string;
  label: string;
  description: string;
  icon: string; // lucide icon name
  recordCount: number;
}

export interface ExportHistoryRecord {
  id: string;
  ten_file: string;
  collections: string[];      // e.g. ['nhan_vien', 'phong_ban']
  format: ExportFormat;
  dung_luong: string;
  tg_tao: string;
  nguoi_thuc_hien: string;
  loai: 'export' | 'import' | 'restore';
  trang_thai: 0 | 1 | 2;     // 0=fail, 1=success, 2=processing
  ghi_chu?: string;
}
