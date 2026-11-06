/**
 * «In theo khoảng trang» — đọc chuỗi kiểu hộp thoại in («2-3, 5», «7-») thành danh sách trang.
 *
 * Trả `{ trang: null }` khi chuỗi rỗng (= tất cả). Sai cú pháp hoặc không trang nào nằm trong
 * `tongTrang` thì trả `loi` (mã + phần sai) để ô nhập báo ngay thay vì in ra tờ trắng; câu chữ
 * do giao diện dịch (`common.phieuIn.khoangLoi_*`).
 */
export type KetQuaKhoangTrang =
  | { trang: number[] | null; loi?: undefined }
  | { trang?: undefined; loi: 'cu-phap'; phan: string }
  | { trang?: undefined; loi: 'ngoai-pham-vi'; tong: number };

export function docKhoangTrang(chuoi: string, tongTrang: number): KetQuaKhoangTrang {
  const s = chuoi.trim();
  if (!s) return { trang: null };
  const ds = new Set<number>();
  for (const phan of s.split(/[,;]/)) {
    const p = phan.trim();
    if (!p) continue;
    const m = /^(\d+)?\s*([-–])?\s*(\d+)?$/.exec(p);
    // Hợp lệ: «5», «2-3», «7-», «-3».
    if (!m || (!m[1] && !m[3]) || (!m[2] && (!m[1] || m[3]))) return { loi: 'cu-phap', phan: p };
    const dau = m[1] ? Number(m[1]) : 1;
    const cuoi = m[2] ? (m[3] ? Number(m[3]) : tongTrang) : dau;
    if (dau < 1 || cuoi < dau) return { loi: 'cu-phap', phan: p };
    for (let i = dau; i <= Math.min(cuoi, tongTrang); i++) ds.add(i);
  }
  if (ds.size === 0) return { loi: 'ngoai-pham-vi', tong: tongTrang };
  return { trang: [...ds].sort((a, b) => a - b) };
}
