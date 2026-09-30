/**
 * Service trạng thái thanh toán đối tác – đọc/ghi DB (fp_mh_trang_thai_thanh_toan_doi_tac).
 */
import type { TrangThaiThanhToanDoiTacFormValues } from '../core/schema';
import {
  getTrangThaiThanhToanDoiTacList as getListDb,
  createTrangThaiThanhToanDoiTac as createDb,
  updateTrangThaiThanhToanDoiTac as updateDb,
  updateTrangThaiThanhToanDoiTacStatus as updateStatusDb,
  deleteTrangThaiThanhToanDoiTacList as deleteListDb,
} from './trang-thai-thanh-toan-doi-tac-db.service';

export const getTrangThaiThanhToanDoiTacList = getListDb;
export const createTrangThaiThanhToanDoiTac = (data: TrangThaiThanhToanDoiTacFormValues) => createDb(data);
export const updateTrangThaiThanhToanDoiTac = updateDb;
export const updateTrangThaiThanhToanDoiTacStatus = updateStatusDb;
export const deleteTrangThaiThanhToanDoiTacList = deleteListDb;
