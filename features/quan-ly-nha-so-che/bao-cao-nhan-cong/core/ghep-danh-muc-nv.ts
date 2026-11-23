/**
 * Danh sách chọn tên của Báo cáo nhân công sau migration 099: TÊN + trạng thái lấy từ Danh sách
 * nhân viên (`fp_var_nhan_vien`), còn `fp_var_nhan_vien_so_che` chỉ còn là thiết lập theo
 * (chi nhánh, nhân viên) — vị trí / nhóm / chuyền / thứ tự.
 *
 * Một dòng kết quả là một người trong chi nhánh:
 * - Người chưa có dòng thiết lập → `id` null (chưa có gì để sửa), mặc định trống.
 * - Người đã nghỉ việc ở bảng chính → `dang_dung` false (ẩn khỏi gợi ý tên, phiếu cũ vẫn khớp).
 * - Dòng thiết lập còn lại nhưng không khớp ai trong danh sách chính của chi nhánh (người chuyển
 *   chi nhánh, xoá hồ sơ, hoặc dòng cũ chưa gắn `id_nv`) → giữ lại với tên cũ và `dang_dung` false
 *   để phiếu cũ vẫn hiện đúng tên.
 */
import { TRANG_THAI_NV } from '../../../../lib/constants';
import type { VarNhanVienSoChe } from './types';

/** Một dòng của `fp_var_nhan_vien` thuộc chi nhánh (chỉ các cột cần cho danh sách chọn tên). */
export interface NvChinhRef {
  id: string;
  ho_ten: string;
  trang_thai: string | null;
}

const theoThuTuRoiTen = (a: VarNhanVienSoChe, b: VarNhanVienSoChe): number =>
  a.thu_tu - b.thu_tu || a.ho_ten.localeCompare(b.ho_ten, 'vi');

export function ghepDanhMucNv(
  idChiNhanh: string,
  nvChinh: readonly NvChinhRef[],
  thietLap: readonly VarNhanVienSoChe[]
): VarNhanVienSoChe[] {
  const thietLapTheoNv = new Map<string, VarNhanVienSoChe>();
  for (const tl of thietLap) if (tl.id_nv) thietLapTheoNv.set(tl.id_nv, tl);

  const daGhep = new Set<string>();
  const rows: VarNhanVienSoChe[] = nvChinh.map((nv) => {
    const tl = thietLapTheoNv.get(nv.id);
    if (tl) daGhep.add(nv.id);
    return {
      id: tl?.id ?? null,
      id_nv: nv.id,
      id_chi_nhanh: idChiNhanh,
      ho_ten: nv.ho_ten,
      vi_tri: tl?.vi_tri ?? null,
      so_nhom: tl?.so_nhom ?? null,
      loai_chuyen: tl?.loai_chuyen ?? null,
      dang_dung: nv.trang_thai !== TRANG_THAI_NV.NGHI_VIEC,
      thu_tu: tl?.thu_tu ?? 0,
    };
  });

  for (const tl of thietLap) {
    if (tl.id_nv && daGhep.has(tl.id_nv)) continue;
    rows.push({ ...tl, id_chi_nhanh: idChiNhanh, dang_dung: false });
  }

  return rows.sort(theoThuTuRoiTen);
}
