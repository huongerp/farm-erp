/** Nội dung trang in: chỉ bảng chuyền, chỉ danh sách tên, cả hai, hoặc danh sách tên chia theo nhóm. */
export type NoiDungIn = 'chuyen' | 'nhan-vien' | 'ca-hai' | 'theo-nhom';

export const NOI_DUNG_IN_PARAM = 'noi-dung';

const NOI_DUNG_IN_HOP_LE: readonly NoiDungIn[] = ['chuyen', 'nhan-vien', 'ca-hai', 'theo-nhom'];

/** URL trang in báo cáo nhân công (tab mới từ detail). */
export function getBaoCaoNhanCongPreviewUrl(id: string, noiDung: NoiDungIn = 'ca-hai'): string {
  return `/quan-ly-nha-so-che/bao-cao-nhan-cong/preview/${encodeURIComponent(id)}?${NOI_DUNG_IN_PARAM}=${noiDung}`;
}

/** Giá trị `?noi-dung=` lạ hoặc thiếu → in cả hai như trước. */
export function docNoiDungIn(v: string | null | undefined): NoiDungIn {
  return NOI_DUNG_IN_HOP_LE.includes(v as NoiDungIn) ? (v as NoiDungIn) : 'ca-hai';
}

/** Route trang in bảng thưởng vượt tháng (đăng ký ở App.tsx). */
export const DUONG_DAN_IN_THUONG_THANG = '/quan-ly-nha-so-che/bao-cao-nhan-cong/thuong-vuot-thang/in';

/** URL trang in bảng thưởng vượt tháng của một nhà sơ chế ("yyyy-mm"). */
export function duongDanInThuongThang(idChiNhanh: string, thang: string): string {
  return `${DUONG_DAN_IN_THUONG_THANG}?cn=${encodeURIComponent(idChiNhanh)}&thang=${encodeURIComponent(thang)}`;
}
