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
} from './thu-chi-quy-supabase.service';
export type { ChungTuRef } from './thu-chi-quy-supabase.service';
