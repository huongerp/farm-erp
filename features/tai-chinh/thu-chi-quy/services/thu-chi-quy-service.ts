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
  khoaThuChiQuy,
  xinMoThuChiQuy,
  xuLyMoThuChiQuy,
  getThuChiQuyTrangThaiByIds,
  khoaThuChiQuyMany,
  xinMoThuChiQuyMany,
  xuLyMoThuChiQuyMany,
} from './thu-chi-quy-db.service';
export type {
  ChungTuRef,
  ThuChiQuyTrangThaiRow,
  XinMoThuChiQuyExtra,
  XuLyMoThuChiQuyExtra,
} from './thu-chi-quy-db.service';
