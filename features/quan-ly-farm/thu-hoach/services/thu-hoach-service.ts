import type { ThuHoachKeHoachFormValues, ThuHoachThucTeFormValues } from '../core/schema';
import {
  getAllThuHoachSupabase,
  getThuHoachByIdSupabase,
  createThuHoachSupabase,
  updateThuHoachKeHoachSupabase,
  updateThuHoachThucTeSupabase,
  deleteThuHoachSupabase,
  deleteThuHoachManySupabase,
} from './thu-hoach-supabase.service';

export const getAllThuHoach = getAllThuHoachSupabase;
export const getThuHoachById = getThuHoachByIdSupabase;
export const createThuHoach = (values: ThuHoachKeHoachFormValues, idNguoiTao: string | null) =>
  createThuHoachSupabase(values, idNguoiTao);
export const updateThuHoachKeHoach = updateThuHoachKeHoachSupabase;
export const updateThuHoachThucTe = updateThuHoachThucTeSupabase;
export const deleteThuHoach = deleteThuHoachSupabase;
export const deleteThuHoachMany = deleteThuHoachManySupabase;
