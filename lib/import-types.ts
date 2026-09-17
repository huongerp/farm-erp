/**
 * Kiểu + hằng dùng chung cho luồng import Excel.
 *
 * Tách khỏi `components/shared/ImportDialog.tsx` để service/util nhập được mà không
 * kéo React và cả component vào bundle chính (dialog vẫn phải lazy — xem LazyImportDialog).
 */

/**
 * Khoá dành riêng: ImportDialog gắn số dòng Excel thật vào từng record trước khi gọi `onImport`.
 * Service dùng `row[IMPORT_ROW_KEY]` để báo lỗi đúng dòng — không suy ra từ index mảng
 * (index đã lệch vì các dòng hỏng bị loại ngay ở client).
 */
export const IMPORT_ROW_KEY = '__row';

/** `create`: chỉ thêm mới, trùng thì báo lỗi. `upsert`: thêm mới + ghi đè dòng đã có. */
export type ImportMode = 'create' | 'upsert';

/** Cột dùng để nhận diện dòng đã tồn tại trong hệ thống. */
export interface ImportRefColumn {
  key: string;
  label: string;
}

export interface ImportErrorRow {
  row: number;
  msg: string;
  /** Dữ liệu gốc của dòng → file báo lỗi tải về import lại được. */
  values?: Record<string, unknown>;
  /** Giữ tương thích với caller cũ (chưa truyền `values`). */
  ma_hang_hoa?: string;
  ten_hang_hoa?: string;
}

export interface ImportSummary {
  created?: number;
  updated?: number;
  skipped?: number;
}

export interface ImportOptions {
  mode: ImportMode;
  refColumn?: string;
}
