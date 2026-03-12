/**
 * Service phiếu đề xuất vật tư – sử dụng Supabase (fp_mh_phieu_de_xuat_vat_tu, fp_mh_phieu_de_xuat_vat_tu_chi_tiet).
 */
import type { PhieuDeXuatVatTuFormValues } from '../core/schema';
import {
  getAllPhieuDeXuatVatTuSupabase,
  getPhieuDeXuatVatTuByIdSupabase,
  createPhieuDeXuatVatTuSupabase,
  updatePhieuDeXuatVatTuSupabase,
  deletePhieuDeXuatVatTuSupabase,
  deletePhieuDeXuatVatTuManySupabase,
} from './phieu-de-xuat-vat-tu-supabase.service';

export const getAllPhieuDeXuatVatTu = getAllPhieuDeXuatVatTuSupabase;
export const getPhieuDeXuatVatTuById = getPhieuDeXuatVatTuByIdSupabase;
export const createPhieuDeXuatVatTu = (data: PhieuDeXuatVatTuFormValues) => createPhieuDeXuatVatTuSupabase(data);
export const updatePhieuDeXuatVatTu = updatePhieuDeXuatVatTuSupabase;
export const deletePhieuDeXuatVatTu = deletePhieuDeXuatVatTuSupabase;
export const deletePhieuDeXuatVatTuMany = deletePhieuDeXuatVatTuManySupabase;
