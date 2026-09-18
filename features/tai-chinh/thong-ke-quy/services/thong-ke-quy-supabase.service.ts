/**
 * Thống kê quỹ — gom toàn bộ số liệu về MỘT lời gọi RPC (giảm egress).
 * Phạm vi chi nhánh do app truyền vào; mảng rỗng nghĩa là không có quyền xem
 * chi nhánh nào, phải trả rỗng chứ không được hiểu là "tất cả".
 */
import { db, throwSupabaseError } from '../../../../lib/db';
import { normalizeThongKeQuyStats, EMPTY_STATS } from '../utils/thong-ke-quy-aggregate';
import { IMPOSSIBLE_NUM_ID } from '../../thu-chi-quy/utils/quy-view-scope';
import type { ThongKeQuyParams, ThongKeQuyStats } from '../core/types';

const RPC_STATS = 'rpc_tc_quy_thu_chi_stats';

export async function getThongKeQuyStats(params: ThongKeQuyParams): Promise<ThongKeQuyStats> {
  const chiNhanhIds =
    params.chiNhanhIds === null
      ? null
      : params.chiNhanhIds.length > 0
        ? params.chiNhanhIds
        : [IMPOSSIBLE_NUM_ID];

  const { data, error } = await db.rpc(RPC_STATS, {
    p_tu_ngay: params.tuNgay || null,
    p_den_ngay: params.denNgay || null,
    p_chi_nhanh_ids: chiNhanhIds,
    p_loai: params.loai,
    p_hang_muc_ids: params.hangMucIds.length > 0 ? params.hangMucIds : null,
  });
  if (error) throwSupabaseError(error);
  return data ? normalizeThongKeQuyStats(data) : EMPTY_STATS;
}
