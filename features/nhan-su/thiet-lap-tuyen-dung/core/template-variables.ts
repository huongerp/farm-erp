/**
 * Biến mẫu dùng trong nội dung thư/email (Mẫu phản hồi).
 * Cú pháp chèn: <<[key]>>
 * Khi gửi thư, replace bằng giá trị thực từ ứng viên / lịch PV / công ty.
 */
export const TEMPLATE_VARIABLE_PREFIX = '<<[';
export const TEMPLATE_VARIABLE_SUFFIX = ']>>';

export function toTemplateVariable(key: string): string {
  return `${TEMPLATE_VARIABLE_PREFIX}${key}${TEMPLATE_VARIABLE_SUFFIX}`;
}

/** Danh sách biến hỗ trợ: id (key) và key i18n cho nhãn hiển thị */
export const TEMPLATE_VARIABLES: { id: string; labelKey: string }[] = [
  { id: 'ten_ung_vien', labelKey: 'thietLapTuyenDung.mauPhanHoi.variables.ten_ung_vien' },
  { id: 'vi_tri_ung_tuyen', labelKey: 'thietLapTuyenDung.mauPhanHoi.variables.vi_tri_ung_tuyen' },
  { id: 'ngay_phong_van', labelKey: 'thietLapTuyenDung.mauPhanHoi.variables.ngay_phong_van' },
  { id: 'gio_phong_van', labelKey: 'thietLapTuyenDung.mauPhanHoi.variables.gio_phong_van' },
  { id: 'dia_diem_phong_van', labelKey: 'thietLapTuyenDung.mauPhanHoi.variables.dia_diem_phong_van' },
  { id: 'ten_cong_ty', labelKey: 'thietLapTuyenDung.mauPhanHoi.variables.ten_cong_ty' },
  { id: 'ngay_hien_tai', labelKey: 'thietLapTuyenDung.mauPhanHoi.variables.ngay_hien_tai' },
  { id: 'so_dien_thoai_lien_he', labelKey: 'thietLapTuyenDung.mauPhanHoi.variables.so_dien_thoai_lien_he' },
  { id: 'email_lien_he', labelKey: 'thietLapTuyenDung.mauPhanHoi.variables.email_lien_he' },
  { id: 'ngay_nhan_viec', labelKey: 'thuGuiUngVien.variables.ngay_nhan_viec' },
  { id: 'bac_luong', labelKey: 'thuGuiUngVien.variables.bac_luong' },
  { id: 'muc_luong', labelKey: 'thuGuiUngVien.variables.muc_luong' },
  { id: 'co_che_khac', labelKey: 'thuGuiUngVien.variables.co_che_khac' },
  { id: 'ghi_chu_khac', labelKey: 'thuGuiUngVien.variables.ghi_chu_khac' },
];

const VAR_REGEX = /<<\[([^\]]+)\]>>/g;

/**
 * Thay thế các biến trong chuỗi (HTML hoặc text) bằng giá trị từ map.
 * Dùng khi gửi thư / preview.
 */
export function replaceTemplateVariables(
  content: string,
  values: Record<string, string>
): string {
  return content.replace(VAR_REGEX, (_, key: string) => values[key] ?? `<<[${key}]>>`);
}

/**
 * Kiểm tra nội dung có chứa ít nhất một biến mẫu không.
 */
export function hasTemplateVariables(content: string): boolean {
  VAR_REGEX.lastIndex = 0;
  return VAR_REGEX.test(content);
}

/**
 * Chuẩn bị HTML an toàn để hiển thị: bọc biến <<[key]>> trong span (để style) rồi sanitize.
 * Gọi từ component với DOMPurify (tránh import DOMPurify trong file core nếu không cần).
 */
export function wrapVariablesForDisplay(html: string): string {
  return html.replace(VAR_REGEX, (_, key: string) => {
    const safeKey = String(key).replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    return `<span class="template-variable" data-var="${safeKey}"><<[${key}]>></span>`;
  });
}
