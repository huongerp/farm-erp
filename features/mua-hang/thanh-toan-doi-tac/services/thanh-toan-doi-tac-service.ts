/**
 * Service thanh toán đối tác – đọc/ghi DB (fp_mh_thanh_toan_doi_tac).
 */
import type { ThanhToanDoiTacFormValues } from '../core/schema';
import {
  getAllThanhToanDoiTac as getAllDb,
  getThanhToanDoiTacById as getByIdDb,
  createThanhToanDoiTac as createDb,
  updateThanhToanDoiTac as updateDb,
  deleteThanhToanDoiTac as deleteDb,
  deleteThanhToanDoiTacMany as deleteManyDb,
  chuyenTrangThaiThanhToanManyDb,
} from './thanh-toan-doi-tac-db.service';

export const getAllThanhToanDoiTac = getAllDb;
export {
  getThanhToanDoiTacPage,
  fetchAllThanhToanDoiTacForListQuery,
  getThanhToanDoiTacTomTat,
  type ThanhToanDoiTacTomTat,
} from './thanh-toan-doi-tac-db.service';
export const getThanhToanDoiTacById = getByIdDb;
export const createThanhToanDoiTac = (data: ThanhToanDoiTacFormValues) => createDb(data);
export const updateThanhToanDoiTac = updateDb;
export const deleteThanhToanDoiTac = deleteDb;
export const deleteThanhToanDoiTacMany = deleteManyDb;
export const chuyenTrangThaiThanhToanMany = chuyenTrangThaiThanhToanManyDb;
