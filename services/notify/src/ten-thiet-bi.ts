/**
 * Đặt nhãn dễ đọc cho một thiết bị từ chuỗi user agent.
 *
 * Người dùng đăng nhập trên cả điện thoại lẫn máy tính, nên trang cài đặt phải
 * cho họ biết đang gỡ đúng thiết bị nào. "Chrome trên Windows" đọc được, chuỗi
 * user agent thô thì không.
 */

export function doanTenThietBi(userAgent: string | null): string | null {
  if (!userAgent) return null;
  const ua = userAgent;

  let trinhDuyet = 'Trình duyệt';
  // Thứ tự quan trọng: Edge và Chrome đều tự nhận là Safari trong user agent.
  if (/Edg\//.test(ua)) trinhDuyet = 'Edge';
  else if (/OPR\/|Opera/.test(ua)) trinhDuyet = 'Opera';
  else if (/Firefox\//.test(ua)) trinhDuyet = 'Firefox';
  else if (/Chrome\//.test(ua)) trinhDuyet = 'Chrome';
  else if (/Safari\//.test(ua)) trinhDuyet = 'Safari';

  let heDieuHanh = 'thiết bị không rõ';
  if (/iPhone/.test(ua)) heDieuHanh = 'iPhone';
  else if (/iPad/.test(ua)) heDieuHanh = 'iPad';
  else if (/Android/.test(ua)) heDieuHanh = 'Android';
  else if (/Windows/.test(ua)) heDieuHanh = 'Windows';
  else if (/Mac OS X|Macintosh/.test(ua)) heDieuHanh = 'macOS';
  else if (/Linux/.test(ua)) heDieuHanh = 'Linux';

  return `${trinhDuyet} trên ${heDieuHanh}`;
}
