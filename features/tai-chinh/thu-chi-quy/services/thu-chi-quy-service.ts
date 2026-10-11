/** Façade — UI và hook chỉ import file này (đổi backend không phải sửa component). */
export {
  getThuChiQuyPage,
  getThuChiQuyAll,
  getThuChiQuyById,
  getThuChiQuyByChungTu,
  getPhieuGanNhatCuaToi,
  getQuySoDu,
  getChungTuRefList,
  getNextSoPhieu,
  getSoPhieuBatch,
  createThuChiQuy,
  updateThuChiQuy,
  deleteThuChiQuyList,
  insertThuChiQuyBulk,
  duyetThuChiQuy,
  getThuChiQuyTrangThaiByIds,
  duyetThuChiQuyMany,
} from './thu-chi-quy-db.service';
export type {
  ChungTuRef,
  ThuChiQuyTrangThaiRow,
  DuyetThuChiQuyExtra,
  HanhDongDuyetThuChiQuy,
} from './thu-chi-quy-db.service';
