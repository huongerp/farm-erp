/**
 * Logo công ty cho bản in / PDF dưới dạng DATA URL.
 *
 * Logo hay là URL ngoài (CORS không mở) → html2canvas không vẽ được, PDF mất logo. Đổi sang
 * data URL trước khi dựng phiếu: nhờ media-service tải hộ (`GET /media/logo`, chỉ nhận đúng URL
 * logo đang lưu ở Thông tin công ty), hỏng thì thử fetch CORS trực tiếp (vd ui-avatars có CORS).
 * Logo cùng origin (`/media/f/...`) hay đã là data URL thì dùng nguyên.
 *
 * Khung in chờ `xong` rồi mới dàn trang, và nội dung chỉ chèn logo khi đã có kết quả — tránh
 * dàn trang hai lần và chờ timeout CORS giữa chừng.
 */
import { useEffect, useState } from 'react';
import { useUIStore } from '../../store/useStore';
import { MEDIA_URL } from '../api-config';
import { layAccessToken } from '../token-store';

const cache = new Map<string, Promise<string | null>>();

function blobSangDataUrl(blob: Blob): Promise<string | null> {
  return new Promise((resolve) => {
    const r = new FileReader();
    r.onload = () => resolve(typeof r.result === 'string' ? r.result : null);
    r.onerror = () => resolve(null);
    r.readAsDataURL(blob);
  });
}

const cungOrigin = (url: string) => {
  try {
    return new URL(url, window.location.href).origin === window.location.origin;
  } catch {
    return false;
  }
};

async function quaMayChu(url: string): Promise<string | null> {
  try {
    const token = await layAccessToken();
    if (!token) return null;
    const r = await fetch(`${MEDIA_URL}/logo?url=${encodeURIComponent(url)}`, {
      headers: { Authorization: `Bearer ${token}` },
      signal: AbortSignal.timeout(10_000),
    });
    if (!r.ok) return null;
    const { dataUrl } = (await r.json()) as { dataUrl?: unknown };
    return typeof dataUrl === 'string' && dataUrl.startsWith('data:image/') ? dataUrl : null;
  } catch {
    return null;
  }
}

async function quaCors(url: string): Promise<string | null> {
  try {
    const r = await fetch(url, { mode: 'cors', credentials: 'omit', signal: AbortSignal.timeout(6_000) });
    if (!r.ok) return null;
    const blob = await r.blob();
    return blob.type.startsWith('image/') ? await blobSangDataUrl(blob) : null;
  } catch {
    return null;
  }
}

/** URL logo → URL dùng được cho in/PDF (data URL nếu đổi được; null nếu không có logo). */
export function logoChoIn(raw: string | null | undefined): Promise<string | null> {
  const url = (raw ?? '').trim();
  if (!url) return Promise.resolve(null);
  if (url.startsWith('data:') || cungOrigin(url)) return Promise.resolve(url);
  let p = cache.get(url);
  if (!p) {
    // Không đổi được thì vẫn trả URL gốc: màn hình / máy in vẫn thấy logo, chỉ PDF có thể thiếu.
    p = quaMayChu(url).then(async (d) => d ?? (await quaCors(url)) ?? url);
    cache.set(url, p);
  }
  return p;
}

/** Logo công ty cho nội dung in; `xong` = đã có kết quả cuối (khung chờ cờ này mới dàn trang). */
export function useLogoCongTyIn(): { logo: string | null; xong: boolean } {
  const raw = useUIStore((s) => s.companyInfo.appLogo);
  const [kq, setKq] = useState<{ raw: string | null | undefined; logo: string | null } | null>(null);
  useEffect(() => {
    let huy = false;
    void logoChoIn(raw).then((logo) => !huy && setKq({ raw, logo }));
    return () => {
      huy = true;
    };
  }, [raw]);
  const xong = kq !== null && kq.raw === raw;
  return { logo: xong ? kq.logo : null, xong };
}
