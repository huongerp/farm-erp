/** Nội dung trang in: chỉ bảng chuyền, chỉ danh sách tên, hoặc cả hai. */
export type NoiDungIn = 'chuyen' | 'nhan-vien' | 'ca-hai';

export const NOI_DUNG_IN_PARAM = 'noi-dung';

const NOI_DUNG_IN_HOP_LE: readonly NoiDungIn[] = ['chuyen', 'nhan-vien', 'ca-hai'];

/** URL trang in báo cáo nhân công (tab mới từ detail). */
export function getBaoCaoNhanCongPreviewUrl(id: string, noiDung: NoiDungIn = 'ca-hai'): string {
  return `/quan-ly-nha-so-che/bao-cao-nhan-cong/preview/${encodeURIComponent(id)}?${NOI_DUNG_IN_PARAM}=${noiDung}`;
}

/** Giá trị `?noi-dung=` lạ hoặc thiếu → in cả hai như trước. */
export function docNoiDungIn(v: string | null | undefined): NoiDungIn {
  return NOI_DUNG_IN_HOP_LE.includes(v as NoiDungIn) ? (v as NoiDungIn) : 'ca-hai';
}
