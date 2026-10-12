/**
 * Cột `trao_doi` (text) dạng log: mỗi mục mở đầu bằng `[thời điểm]`, nội dung có thể nhiều dòng,
 * mục mới nối xuống cuối. Thời điểm nhận cả ISO (log "Chuyển tiến độ" cũ) lẫn `dd/mm/yyyy HH:mm`
 * (trao đổi gõ tay qua popup).
 *
 *   [2026-09-17T07:30:00.000Z] Chuyển tiến độ sang: Đã đặt hàng. Ghi chú: —
 *   [12/10/2026 14:30] Chị Hà: mua loại 70%,
 *   không lấy loại 50%
 */
export interface MucTraoDoi {
  /** Chuỗi trong ngoặc vuông đầu mục; null với phần đầu log không có thời điểm. */
  thoiDiem: string | null;
  /** Nội dung sau thời điểm (giữ nguyên xuống dòng). */
  noiDung: string;
}

const DAU_MUC = /^\[([^\]]+)\]\s?(.*)$/;
const NGAY_GIO_VN = /^\d{1,2}\/\d{1,2}\/\d{4}(?: \d{1,2}:\d{2})?$/;
const NGAY_ISO = /^\d{4}-\d{2}-\d{2}/;

/** Thời điểm dạng ISO (`2026-09-17T07:30:00Z`) — hiển thị cần đổi múi giờ; dạng `dd/mm/yyyy HH:mm` thì in nguyên. */
export function laThoiDiemIso(raw: string): boolean {
  return NGAY_ISO.test(raw) && !Number.isNaN(Date.parse(raw));
}

function laThoiDiem(raw: string): boolean {
  const s = raw.trim();
  return NGAY_GIO_VN.test(s) || laThoiDiemIso(s);
}

/** Tách log thành các mục; bỏ mục rỗng. */
export function tachTraoDoi(log: string | null | undefined): MucTraoDoi[] {
  if (log == null) return [];
  const muc: { thoiDiem: string | null; dong: string[] }[] = [];
  for (const line of log.replace(/\r\n?/g, '\n').split('\n')) {
    const m = DAU_MUC.exec(line.trim());
    if (m && laThoiDiem(m[1])) {
      muc.push({ thoiDiem: m[1].trim(), dong: [m[2]] });
    } else if (muc.length > 0) {
      muc[muc.length - 1].dong.push(line);
    } else {
      muc.push({ thoiDiem: null, dong: [line] });
    }
  }
  return muc
    .map((x) => ({ thoiDiem: x.thoiDiem, noiDung: x.dong.join('\n').trim() }))
    .filter((x) => x.thoiDiem != null || x.noiDung !== '');
}

/** Dòng tự thêm cuối ô khi mở popup: `[12/10/2026 14:30] Tên: `. */
export function dongMoiTraoDoi(thoiDiem: string, ten: string | null | undefined): string {
  const t = ten?.trim();
  return t ? `[${thoiDiem}] ${t}: ` : `[${thoiDiem}] `;
}

/** Nội dung điền sẵn trong popup: log cũ + dòng mới ở cuối. */
export function soanSanTraoDoi(cu: string | null | undefined, dongMoi: string): string {
  const c = (cu ?? '').trimEnd();
  return c ? `${c}\n${dongMoi}` : dongMoi;
}

/**
 * Giá trị lưu từ ô trong popup: bỏ dòng tự thêm nếu chưa gõ gì sau nó, cắt khoảng trắng hai đầu;
 * rỗng → null (xoá hết trao đổi).
 */
export function chotTraoDoi(text: string, dongMoi: string): string | null {
  let s = text.trimEnd();
  const dauDong = dongMoi.trimEnd();
  if (s.endsWith(dauDong)) s = s.slice(0, s.length - dauDong.length);
  s = s.trim();
  return s === '' ? null : s;
}

/** Dòng chi tiết gửi lên khi lưu lại cả phiếu (xoá + chèn lại toàn bộ dòng). */
export interface DongLuuLaiTraoDoi {
  /** Id dòng chi tiết đang có trong DB; trống với dòng mới thêm / phiếu sao chép. */
  id_chi_tiet?: string | null;
  /** Chỉ dùng cho dòng KHÔNG có `id_chi_tiet`. */
  trao_doi?: string | null;
  /** Mục log nối thêm vào cuối (vd "Chuyển tiến độ"). */
  trao_doi_them?: string | null;
}

/**
 * Trao đổi ghi lại cho một dòng khi lưu cả phiếu. Dòng đã có (`id_chi_tiet` còn trong DB) lấy
 * giá trị ĐANG LƯU trong DB — không lấy bản form mở từ trước, tránh đè mất tin cấp cao vừa ghi
 * (và đường sửa phiếu không đổi được trao đổi). `trao_doi_them` nối vào cuối.
 */
export function traoDoiKhiLuuLai(dong: DongLuuLaiTraoDoi, dangLuu: ReadonlyMap<string, string | null>): string | null {
  const id = dong.id_chi_tiet ? String(dong.id_chi_tiet) : null;
  const goc = (id && dangLuu.has(id) ? dangLuu.get(id) : dong.trao_doi)?.trim() || null;
  const them = dong.trao_doi_them?.trim();
  if (!them) return goc;
  return goc ? `${goc}\n${them}` : them;
}
