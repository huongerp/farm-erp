/**
 * Service đơn đặt hàng – sử dụng Supabase (fp_mh_don_dat_hang, fp_mh_don_dat_hang_chi_tiet).
 */
import type { DonDatHangFormValues } from '../core/schema';
import {
  getAllDonDatHangSupabase,
  getDonDatHangByIdSupabase,
  createDonDatHangSupabase,
  updateDonDatHangSupabase,
  deleteDonDatHangSupabase,
  deleteDonDatHangManySupabase,
  getNextSoPoDonDatHangSupabase,
} from './don-dat-hang-supabase.service';

/** Quy tắc số PO: PO-YYYY-NNNNN (năm + 5 chữ số). Có thể sửa mã khi tạo/sửa. */
export async function getNextSoPoFormatted(): Promise<string> {
  const n = await getNextSoPoDonDatHangSupabase();
  const year = new Date().getFullYear();
  return `PO-${year}-${String(n).padStart(5, '0')}`;
}

export const getAllDonDatHang = getAllDonDatHangSupabase;
export const getNextSoPoDonDatHang = getNextSoPoFormatted;
export const getDonDatHangById = getDonDatHangByIdSupabase;
export const createDonDatHang = (data: DonDatHangFormValues) => createDonDatHangSupabase(data);
export const updateDonDatHang = updateDonDatHangSupabase;
export const deleteDonDatHang = deleteDonDatHangSupabase;
export const deleteDonDatHangMany = deleteDonDatHangManySupabase;
