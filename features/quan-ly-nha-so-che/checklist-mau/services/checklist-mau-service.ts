/**
 * Wrapper mỏng re-export hàm DB — hook dùng qua file này thay vì gọi db.service trực tiếp.
 */
export {
  getMauListDb as getMauList,
  getMauByIdDb as getMauById,
  getMauChiTietDb as getMauChiTiet,
  createMauDb as createMau,
  updateMauDb as updateMau,
  deleteMauDb as deleteMau,
  getMucDb as getMuc,
  createMucDb as createMuc,
  updateMucDb as updateMuc,
  deleteMucDb as deleteMuc,
  sapXepMucDb as sapXepMuc,
  getHangMucDb as getHangMuc,
  createHangMucDb as createHangMuc,
  updateHangMucDb as updateHangMuc,
  deleteHangMucDb as deleteHangMuc,
  datDangDungHangMucDb as datDangDungHangMuc,
  sapXepHangMucDb as sapXepHangMuc,
  getThietBiDb as getThietBi,
  type MauChiTiet,
  type HangMucInput,
} from './checklist-mau-db.service';
