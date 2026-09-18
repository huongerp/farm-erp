/**
 * Tồn quỹ lũy kế tính ở client — bản sao logic của window function trong
 * `v_tc_quy_thu_chi_summary` (PARTITION BY id_chi_nhanh ORDER BY ngay, id).
 *
 * Danh sách chính đọc thẳng `ton_quy` từ view; hàm này dùng cho các chỗ tính lại
 * trên tập dòng đã có sẵn (tab tra cứu sổ quỹ, xuất Excel, kiểm thử đối chiếu).
 */

export interface RunningBalanceInput {
  id: string;
  id_chi_nhanh: string;
  ngay: string;
  loai: 'thu' | 'chi';
  so_tien: number;
}

export type WithTonQuy<T> = T & { ton_quy: number };

/** Ký hiệu dòng: thu → +, chi → −. */
export function signedAmount(row: Pick<RunningBalanceInput, 'loai' | 'so_tien'>): number {
  return row.loai === 'thu' ? row.so_tien : -row.so_tien;
}

/** So sánh thứ tự sổ: theo ngày, cùng ngày thì theo id (thứ tự nhập). */
function compareSoSach(a: RunningBalanceInput, b: RunningBalanceInput): number {
  if (a.ngay !== b.ngay) return a.ngay < b.ngay ? -1 : 1;
  return Number(a.id) - Number(b.id);
}

/**
 * Gắn `ton_quy` lũy kế cho từng dòng. Lũy kế tính ĐỘC LẬP theo từng chi nhánh
 * (mỗi chi nhánh một quỹ), thứ tự (ngay, id) — không phụ thuộc thứ tự mảng đầu vào.
 * Mảng trả về giữ nguyên thứ tự đầu vào.
 */
export function computeRunningBalance<T extends RunningBalanceInput>(rows: T[]): WithTonQuy<T>[] {
  const sorted = [...rows].sort(compareSoSach);
  const tonById = new Map<string, number>();
  const luyKe = new Map<string, number>();

  for (const row of sorted) {
    const truoc = luyKe.get(row.id_chi_nhanh) ?? 0;
    const sau = truoc + signedAmount(row);
    luyKe.set(row.id_chi_nhanh, sau);
    tonById.set(row.id, sau);
  }

  return rows.map((row) => ({ ...row, ton_quy: tonById.get(row.id) ?? 0 }));
}

/** Tổng thu / tổng chi / chênh lệch của một tập dòng (dòng tổng ở chân bảng). */
export function tongHopThuChi(rows: Pick<RunningBalanceInput, 'loai' | 'so_tien'>[]): {
  tongThu: number;
  tongChi: number;
  chenhLech: number;
} {
  let tongThu = 0;
  let tongChi = 0;
  for (const row of rows) {
    if (row.loai === 'thu') tongThu += row.so_tien;
    else tongChi += row.so_tien;
  }
  return { tongThu, tongChi, chenhLech: tongThu - tongChi };
}
