/**
 * Wrapper mỏng re-export hàm DB — hook dùng qua file này thay vì gọi db.service trực tiếp.
 */
export {
  getThietBiListDb as getThietBiList,
  getThietBiByIdDb as getThietBiById,
  createThietBiDb as createThietBi,
  updateThietBiDb as updateThietBi,
  deleteThietBiDb as deleteThietBi,
  saoChepThietBiDb as saoChepThietBi,
  getViecDangDungDb as getViecDangDung,
  getViecTheoThietBiDb as getViecTheoThietBi,
  createViecDb as createViec,
  updateViecDb as updateViec,
  deleteViecDb as deleteViec,
  sapXepViecDb as sapXepViec,
  getNhatKyTheoViecDb as getNhatKyTheoViec,
  createNhatKyDb as createNhatKy,
  getTaiSanRefDb as getTaiSanRef,
  type TaiSanRef,
  type ViecInput,
  type NhatKyInput,
} from './bao-duong-thiet-bi-db.service';
