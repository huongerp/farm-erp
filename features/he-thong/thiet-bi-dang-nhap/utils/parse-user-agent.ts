/**
 * Parse navigator.userAgent để lấy tên trình duyệt, OS và loại thiết bị (desktop/mobile/tablet).
 * Dùng khi ghi thiết bị đăng nhập lên fp_var_login_devices.
 */

export type DeviceType = 'desktop' | 'mobile' | 'tablet';

export interface ParsedDevice {
  ten_thiet_bi: string;
  loai_thiet_bi: DeviceType;
  trinh_duyet: string;
  he_dieu_hanh: string;
}

export function parseUserAgent(ua: string): ParsedDevice {
  const u = ua || '';
  let trinh_duyet = 'Trình duyệt';
  let he_dieu_hanh = 'Không xác định';
  let loai_thiet_bi: DeviceType = 'desktop';

  if (/Edg\//i.test(u)) trinh_duyet = 'Edge';
  else if (/OPR\//i.test(u) || /Opera/i.test(u)) trinh_duyet = 'Opera';
  else if (/Chrome\//i.test(u) && !/Edg/i.test(u)) trinh_duyet = 'Chrome';
  else if (/Safari\//i.test(u) && !/Chrome/i.test(u)) trinh_duyet = 'Safari';
  else if (/Firefox\//i.test(u)) trinh_duyet = 'Firefox';
  else if (/MSIE|Trident/i.test(u)) trinh_duyet = 'IE';

  if (/Windows NT/i.test(u)) he_dieu_hanh = 'Windows';
  else if (/Mac OS X/i.test(u)) he_dieu_hanh = /iPhone|iPad/.test(u) ? (ua?.includes('iPad') ? 'iPadOS' : 'iOS') : 'macOS';
  else if (/Android/i.test(u)) he_dieu_hanh = 'Android';
  else if (/Linux/i.test(u)) he_dieu_hanh = 'Linux';

  if (/Mobile/i.test(u) && !/iPad/i.test(u)) loai_thiet_bi = 'mobile';
  else if (/iPad|Tablet/i.test(u)) loai_thiet_bi = 'tablet';

  const ten_thiet_bi = `${trinh_duyet} trên ${he_dieu_hanh}`;
  return { ten_thiet_bi, loai_thiet_bi, trinh_duyet, he_dieu_hanh };
}
