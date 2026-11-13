/**
 * Chọn farm (chi nhánh) đang xem ở module Bảo dưỡng thiết bị.
 * Danh sách hợp lệ = viewAll ? mọi chi nhánh : chi nhánh được phân.
 * Thứ tự ưu tiên: farm đang chọn → farm của tôi → farm đầu danh sách → null.
 */
export interface ChonFarmInput {
  hienTai: string | null;
  viewAll: boolean;
  allowedBranchIds: string[];
  tatCaBranchIds: string[];
  farmCuaToi: string | null;
}

export function chonFarmMacDinh({
  hienTai,
  viewAll,
  allowedBranchIds,
  tatCaBranchIds,
  farmCuaToi,
}: ChonFarmInput): string | null {
  const hopLe = viewAll ? tatCaBranchIds : allowedBranchIds;
  if (hienTai && hopLe.includes(hienTai)) return hienTai;
  if (farmCuaToi && hopLe.includes(farmCuaToi)) return farmCuaToi;
  return hopLe[0] ?? null;
}
