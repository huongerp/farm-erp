/**
 * Service import Excel cho Thanh toán đối tác — gọi db (PostgREST).
 * Ghi tuần tự từng dòng: số phiếu tự sinh lấy từ RPC (sequence) nên không gộp lô được;
 * một dòng lỗi không làm hỏng cả file.
 */
import { db, fetchAllRows, throwDbError } from '../../../../lib/db';
import { formatDbError } from '../../../../lib/db-errors';
import {
  getNextSoPhieuThanhToanDoiTacRpc,
  type NextSoPhieuTtoConfig,
} from './thanh-toan-doi-tac-db.service';

const TABLE = 'fp_mh_thanh_toan_doi_tac';
const TABLE_DOI_TAC = 'fp_mh_danh_sach_doi_tac';

export interface DoiTacNccImportRef {
  id: string;
  ma_doi_tac: string;
  ten_doi_tac: string;
  id_nhom: string | null;
}

/** Đối tác NCC (id, mã, tên, nhóm) để tra cứu khi import và đưa vào sheet tham chiếu. */
export async function getDoiTacNccImportRef(): Promise<DoiTacNccImportRef[]> {
  const rows = await fetchAllRows<{
    id: number;
    ma_doi_tac: string | null;
    ten_doi_tac: string | null;
    id_nhom: number | null;
  }>((from, to) =>
    db
      .from(TABLE_DOI_TAC)
      .select('id, ma_doi_tac, ten_doi_tac, id_nhom')
      .eq('loai_doi_tac', 'nha_cung_cap')
      .order('ma_doi_tac', { ascending: true })
      .range(from, to)
  );
  return rows.map((r) => ({
    id: String(r.id),
    ma_doi_tac: r.ma_doi_tac ?? '',
    ten_doi_tac: r.ten_doi_tac ?? '',
    id_nhom: r.id_nhom != null ? String(r.id_nhom) : null,
  }));
}

/** Các số phiếu (trong danh sách) đã có trong DB — để báo lỗi trùng trước khi ghi. */
export async function getSoPhieuDaCo(soPhieuList: string[]): Promise<Set<string>> {
  const uniq = [...new Set(soPhieuList.filter(Boolean))];
  const found = new Set<string>();
  // Chia lô để URL `in.(...)` không quá dài.
  const CHUNK = 100;
  for (let i = 0; i < uniq.length; i += CHUNK) {
    const part = uniq.slice(i, i + CHUNK);
    const { data, error } = await db.from(TABLE).select('so_phieu').in('so_phieu', part);
    if (error) throwDbError(error);
    (data as { so_phieu: string }[] | null)?.forEach((r) => found.add(r.so_phieu));
  }
  return found;
}

export interface ImportInsertPayload {
  so_phieu: string | null;
  hang_muc_thanh_toan: string;
  noi_dung_chi_tiet: string | null;
  ngay: string;
  id_don_vi: number;
  id_doi_tac: number;
  id_trang_thai_thanh_toan: number;
  trang_thai: string;
  so_tien: number;
  ngay_xu_ly: string | null;
  ghi_chu: string | null;
  id_nguoi_tao?: number | null;
}

/** Ghi tuần tự; dòng chưa có số phiếu thì sinh bằng RPC theo cấu hình. Lỗi một dòng → `failed`, đi tiếp. */
export async function insertThanhToanDoiTacImport<T extends { payload: ImportInsertPayload }>(
  items: T[],
  opts: { config: NextSoPhieuTtoConfig }
): Promise<{ done: number; failed: { item: T; msg: string }[] }> {
  let done = 0;
  const failed: { item: T; msg: string }[] = [];
  for (const item of items) {
    try {
      const soPhieu = item.payload.so_phieu ?? (await getNextSoPhieuThanhToanDoiTacRpc(opts.config));
      const { error } = await db.from(TABLE).insert({ ...item.payload, so_phieu: soPhieu });
      if (error) throw error;
      done += 1;
    } catch (e) {
      failed.push({ item, msg: formatDbError(e) });
    }
  }
  return { done, failed };
}
