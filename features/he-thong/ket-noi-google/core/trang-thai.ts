/**
 * Suy tình trạng hiển thị của kết nối / lịch — luật thuần, có test.
 * Thứ tự ưu tiên quyết định quản trị thấy vấn đề nào trước, nên đặt ở đây thay vì rải trong JSX.
 */
import type { KetNoiGoogle, LichDongBoQt } from './types';

/** Khớp giá trị trạng thái nhân viên nghỉ việc ở DB (rpc_dang_nhap, rpc_sheets_nguoi_tao). */
const NGHI_VIEC = 'Nghỉ việc';

export type TinhTrangKetNoi = 'hong' | 'nghi_viec' | 'co_loi' | 'hoat_dong';

/**
 * - `hong`: Google đã thu hồi token → mọi lịch của người này đứng.
 * - `nghi_viec`: kết nối còn nhưng nhân viên đã nghỉ → lịch tự dừng ở lần chạy kế, nên ngắt kết nối.
 * - `co_loi`: còn ít nhất một lịch có lần chạy cuối lỗi.
 */
export function tinhTrangKetNoi(k: Pick<KetNoiGoogle, 'trang_thai' | 'trang_thai_nhan_vien' | 'so_lich_loi'>): TinhTrangKetNoi {
  if (k.trang_thai === 'hong') return 'hong';
  if ((k.trang_thai_nhan_vien ?? '').trim() === NGHI_VIEC) return 'nghi_viec';
  if (k.so_lich_loi > 0) return 'co_loi';
  return 'hoat_dong';
}

export type TinhTrangLich = 'da_dung' | 'tam_dung' | 'loi' | 'cho_ghi' | 'binh_thuong';

/**
 * - `da_dung`: lịch bị TẮT kèm lỗi → hệ thống tự dừng (lỗi vĩnh viễn / quá nhiều lần).
 * - `tam_dung`: bị tắt tay, không lỗi.
 * - `loi`: đang bật nhưng lần cuối lỗi, đang thử lại.
 * - `cho_ghi`: có thay đổi, đang chờ hết cửa sổ gộp 5 phút.
 */
export function tinhTrangLich(l: Pick<LichDongBoQt, 'bat' | 'ket_qua_cuoi' | 'can_chay'>): TinhTrangLich {
  if (!l.bat) return l.ket_qua_cuoi === 'loi' ? 'da_dung' : 'tam_dung';
  if (l.ket_qua_cuoi === 'loi') return 'loi';
  if (l.can_chay) return 'cho_ghi';
  return 'binh_thuong';
}
