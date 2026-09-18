import type { PhieuKho } from '../../phieu-kho/core/types';
import type { NXTReportFilters, NXTByPeriodResult, TonTaiThoiDiemRow } from '../core/types';
import { db, throwSupabaseError } from '../../../../lib/db';

/* ────────────────────────── main report ────────────────────────── */

/**
 * Báo cáo tổng hợp NXT theo kỳ.
 *
 * Công thức cốt lõi (áp dụng cho mỗi cặp kho × hàng hóa):
 *   tồn_cuối_kỳ  = tồn_hiện_tại − nhập_sau_kỳ + xuất_sau_kỳ
 *   tồn_đầu_kỳ   = tồn_cuối_kỳ  − nhập_trong_kỳ + xuất_trong_kỳ
 *
 * Đảm bảo: Tồn đầu + Tổng nhập − Tổng xuất ≡ Tồn cuối.
 * Chỉ phiếu "Không duyệt" bị loại; "Chờ duyệt" + "Đã duyệt" đều tính.
 */
function nxtFiltersToRpcPayload(filters: NXTReportFilters): Record<string, unknown> {
  return {
    ...filters,
    trangThaiPhieu: filters.trangThaiPhieu.map((n) => TRANG_THAI_NUM_TO_TEXT[n]).filter(Boolean),
  };
}

export async function getNXTByPeriod(filters: NXTReportFilters): Promise<NXTByPeriodResult> {
  const { data, error } = await db.rpc('rpc_nxt_by_period', {
    p_filters: nxtFiltersToRpcPayload(filters),
  });
  if (error) throwSupabaseError(error, { resource: 'rpc_nxt_by_period' });
  const ket_qua = data as NXTByPeriodResult | null;
  if (!ket_qua || !Array.isArray(ket_qua.byWarehouse) || !Array.isArray(ket_qua.byCell)) {
    throw new Error(
      'RPC rpc_nxt_by_period trả về thiếu dữ liệu. Chạy docs/supabase-rpc_nxt_family.sql và docs/supabase-v_mh_nxt_movement.sql trên VPS.'
    );
  }
  return ket_qua;
}

/* ────────────────────────── other exports ────────────────────────── */

/** Map trạng thái số (UI filter) sang text DB. */
const TRANG_THAI_NUM_TO_TEXT: Record<number, string> = {
  0: 'Chờ duyệt',
  1: 'Đã duyệt',
  2: 'Không duyệt',
  3: 'Đợi duyệt',
};

/**
 * Lấy danh sách phiếu trong kỳ (không kèm chi_tiet; gọi getPhieuKhoById khi cần chi tiết).
 */
export async function getPhieuInPeriod(filters: NXTReportFilters): Promise<PhieuKho[]> {
  const { data, error } = await db.rpc('rpc_phieu_in_period', {
    p_filters: nxtFiltersToRpcPayload(filters),
  });
  if (error) throwSupabaseError(error, { resource: 'rpc_phieu_in_period' });
  if (!Array.isArray(data)) {
    throw new Error('RPC rpc_phieu_in_period trả về dữ liệu không hợp lệ. Chạy docs/supabase-rpc_nxt_family.sql trên VPS.');
  }
  return data as PhieuKho[];
}

/**
 * Lấy bảng tồn tại thời điểm (hiện tại = tồn hiện tại từ view).
 */
export async function getTonAtDate(filters: Pick<NXTReportFilters, 'warehouseIds' | 'hangHoaIds' | 'categoryIds' | 'allowedBranchIds'>): Promise<TonTaiThoiDiemRow[]> {
  const { data, error } = await db.rpc('rpc_ton_at_date', {
    p_filters: filters as unknown as Record<string, unknown>,
  });
  if (error) throwSupabaseError(error, { resource: 'rpc_ton_at_date' });
  if (!Array.isArray(data)) {
    throw new Error('RPC rpc_ton_at_date trả về dữ liệu không hợp lệ. Chạy docs/supabase-rpc_nxt_family.sql trên VPS.');
  }
  return data as TonTaiThoiDiemRow[];
}
