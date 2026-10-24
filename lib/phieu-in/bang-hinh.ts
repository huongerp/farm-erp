/**
 * Băng hình «hàng cây chuối + logo fp ForPeasantz» in trên cùng đầu phiếu — phía TRÊN dòng logo +
 * tên công ty (không thay). Ảnh tĩnh ở `public/phieu-in/bang-hinh-fp.png` (ghép từ 2 ảnh trong mẫu
 * Excel «Bảng xác nhận đầu vào lô clip»), dùng chung cho phiếu in React, PDF dựng từ HTML, trang in
 * báo cáo và file Excel tải về.
 */

/** Kích thước gốc của ảnh (px) — tính chiều rộng theo chiều cao muốn in. */
export const BANG_HINH_RONG = 789;
export const BANG_HINH_CAO = 86;

/** Đường dẫn tương đối theo BASE_URL của app (dùng trong trang của app). */
export const BANG_HINH_URL = `${import.meta.env.BASE_URL.replace(/\/?$/, '/')}phieu-in/bang-hinh-fp.png`;

/** Đường dẫn tuyệt đối — cho cửa sổ `about:blank` / iframe `srcdoc`, nơi đường dẫn tương đối không chạy. */
export function bangHinhUrlTuyetDoi(): string {
  return new URL(BANG_HINH_URL, window.location.origin).href;
}

/** Khối HTML căn giữa cho các template chuỗi HTML (PDF/in báo cáo). */
export function bangHinhHtml(caoPx = 40, cachDuoiPx = 6): string {
  return `<div style="text-align:center;margin:0 0 ${cachDuoiPx}px 0;line-height:0"><img src="${bangHinhUrlTuyetDoi()}" alt="" style="height:${caoPx}px;width:auto;max-width:100%;display:inline-block" /></div>`;
}

let base64Promise: Promise<string | null> | null = null;

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  const chunk = 0x8000;
  let binary = '';
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode.apply(null, bytes.subarray(i, i + chunk) as unknown as number[]);
  }
  return btoa(binary);
}

/**
 * Tải ảnh dạng base64 (cache cả phiên) để nhúng vào file Excel. Lỗi mạng / file thiếu → `null` để
 * nơi gọi vẫn xuất được file, chỉ thiếu băng hình. Kiểm content-type vì nginx trả index.html (200)
 * cho đường dẫn không có file.
 */
export function taiBangHinhBase64(): Promise<string | null> {
  if (!base64Promise) {
    base64Promise = (async () => {
      try {
        const res = await fetch(BANG_HINH_URL);
        if (!res.ok || !(res.headers.get('content-type') ?? '').startsWith('image/')) return null;
        return arrayBufferToBase64(await res.arrayBuffer());
      } catch {
        return null;
      }
    })().then((b64) => {
      if (!b64) base64Promise = null; // lỗi thì lần sau thử lại
      return b64;
    });
  }
  return base64Promise;
}

/**
 * Chờ mọi `<img>` trong tài liệu tải xong (hoặc lỗi) — gọi trước khi chụp html2canvas / print.
 * Có trần thời gian để ảnh treo (logo ở máy chủ ngoài) không chặn việc xuất.
 */
export async function choAnhTai(root: Document | HTMLElement, toiDaMs = 8000): Promise<void> {
  const imgs = Array.from(root.querySelectorAll('img'));
  const tatCa = Promise.all(
    imgs.map((img) =>
      img.complete
        ? Promise.resolve()
        : new Promise<void>((resolve) => {
            img.addEventListener('load', () => resolve(), { once: true });
            img.addEventListener('error', () => resolve(), { once: true });
          }),
    ),
  );
  await Promise.race([tatCa, new Promise<void>((resolve) => setTimeout(resolve, toiDaMs))]);
}
