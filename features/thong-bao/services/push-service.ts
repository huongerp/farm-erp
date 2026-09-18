/**
 * Đăng ký / gỡ Web Push ở phía trình duyệt.
 *
 * Khoá VAPID công khai nhúng sẵn trong bundle; phần ký payload nằm ở service
 * notify. Không phụ thuộc Firebase hay SDK bên thứ ba nào.
 */

import { NOTIFY_URL, VAPID_PUBLIC_KEY } from '../../../lib/api-config';
import { layAccessToken } from '../../../lib/token-store';

export type TrangThaiPush =
  | 'khong_ho_tro'
  | 'ios_chua_cai_pwa'
  | 'chua_cau_hinh'
  | 'chua_cap_quyen'
  | 'bi_chan'
  | 'da_bat';

/**
 * Chuyển khoá VAPID từ base64url sang byte array — dạng duy nhất mà
 * `PushManager.subscribe` chấp nhận. Base64url dùng '-' và '_' thay cho '+' và
 * '/', và bỏ padding, nên phải hoàn nguyên trước khi atob.
 */
export function base64UrlSangUint8Array(base64Url: string): Uint8Array<ArrayBuffer> {
  const dem = '='.repeat((4 - (base64Url.length % 4)) % 4);
  const base64 = (base64Url + dem).replace(/-/g, '+').replace(/_/g, '/');
  const chuoi = atob(base64);
  // Cấp phát qua ArrayBuffer tường minh: PushManager.subscribe nhận BufferSource,
  // mà Uint8Array<ArrayBufferLike> (kiểu suy ra mặc định) không khớp BufferSource.
  const mang = new Uint8Array(new ArrayBuffer(chuoi.length));
  for (let i = 0; i < chuoi.length; i += 1) mang[i] = chuoi.charCodeAt(i);
  return mang;
}

export function hoTroPush(): boolean {
  return (
    typeof navigator !== 'undefined' &&
    'serviceWorker' in navigator &&
    typeof window !== 'undefined' &&
    'PushManager' in window &&
    'Notification' in window
  );
}

/**
 * Safari trên iPhone/iPad chỉ cho phép Web Push khi trang đã được "Thêm vào màn
 * hình chính". Chưa cài thì công tắc bật cũng vô nghĩa, nên phải phát hiện để
 * hiện hướng dẫn thay vì để người dùng bấm mãi không lên.
 */
export function laIosChuaCaiPwa(): boolean {
  if (typeof navigator === 'undefined' || typeof window === 'undefined') return false;
  const ua = navigator.userAgent;
  const laIos = /iPhone|iPad|iPod/.test(ua);
  if (!laIos) return false;

  const nav = navigator as Navigator & { standalone?: boolean };
  const daCai = nav.standalone === true || window.matchMedia('(display-mode: standalone)').matches;
  return !daCai;
}

export function trangThaiPushHienTai(): TrangThaiPush {
  if (!hoTroPush()) return laIosChuaCaiPwa() ? 'ios_chua_cai_pwa' : 'khong_ho_tro';
  if (laIosChuaCaiPwa()) return 'ios_chua_cai_pwa';
  if (!VAPID_PUBLIC_KEY) return 'chua_cau_hinh';

  switch (Notification.permission) {
    case 'granted':
      return 'da_bat';
    case 'denied':
      return 'bi_chan';
    default:
      return 'chua_cap_quyen';
  }
}

async function goiNotify(duongDan: string, body: unknown): Promise<Response> {
  const token = await layAccessToken();
  return fetch(`${NOTIFY_URL}${duongDan}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(body),
  });
}

export interface KetQuaBatPush {
  ok: boolean;
  trangThai: TrangThaiPush;
}

/**
 * Bật push trên thiết bị hiện tại.
 *
 * PHẢI gọi từ một cú bấm của người dùng: Safari iOS từ chối thẳng nếu
 * requestPermission() chạy tự động, còn Chrome ghi nhận "chặn vĩnh viễn" khi
 * người dùng bấm Chặn theo phản xạ — sau đó không có cách nào bật lại từ trong
 * app nữa.
 */
export async function batPush(): Promise<KetQuaBatPush> {
  const truoc = trangThaiPushHienTai();
  if (truoc === 'khong_ho_tro' || truoc === 'ios_chua_cai_pwa' || truoc === 'chua_cau_hinh') {
    return { ok: false, trangThai: truoc };
  }

  const quyen = Notification.permission === 'granted' ? 'granted' : await Notification.requestPermission();
  if (quyen !== 'granted') {
    return { ok: false, trangThai: quyen === 'denied' ? 'bi_chan' : 'chua_cap_quyen' };
  }

  const dangKy = await navigator.serviceWorker.ready;
  const sub =
    (await dangKy.pushManager.getSubscription()) ??
    (await dangKy.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: base64UrlSangUint8Array(VAPID_PUBLIC_KEY),
    }));

  const res = await goiNotify('/subscribe', sub.toJSON());
  return { ok: res.ok, trangThai: res.ok ? 'da_bat' : 'chua_cap_quyen' };
}

export async function tatPushTrenThietBiNay(): Promise<void> {
  if (!hoTroPush()) return;

  const dangKy = await navigator.serviceWorker.ready;
  const sub = await dangKy.pushManager.getSubscription();
  if (!sub) return;

  // Báo server trước rồi mới huỷ ở client: huỷ trước mà request lỗi thì server
  // còn giữ một endpoint chết và cứ gửi push vào hư không.
  await goiNotify('/unsubscribe', { endpoint: sub.endpoint });
  await sub.unsubscribe();
}

/**
 * Đăng ký lại sau khi service worker được thay mới.
 *
 * SW_UNREGISTER_BUSTER trong components/shared/PwaRegister.tsx gỡ toàn bộ service
 * worker và xoá cache khi chuỗi đó đổi — thao tác đó xoá luôn push subscription.
 * Hàm này chạy im lặng lúc khởi động để dựng lại đăng ký mà người dùng không
 * phải làm gì.
 */
export async function dongBoLaiDangKy(): Promise<void> {
  if (!hoTroPush() || !VAPID_PUBLIC_KEY) return;
  if (Notification.permission !== 'granted') return;

  try {
    const dangKy = await navigator.serviceWorker.ready;
    const sub =
      (await dangKy.pushManager.getSubscription()) ??
      (await dangKy.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: base64UrlSangUint8Array(VAPID_PUBLIC_KEY),
      }));
    await goiNotify('/subscribe', sub.toJSON());
  } catch {
    // Đồng bộ nền — hỏng thì im lặng, người dùng vẫn bật lại được trong Cài đặt.
  }
}

export async function guiThuPush(): Promise<boolean> {
  const res = await goiNotify('/test', {});
  if (!res.ok) return false;
  const kq = (await res.json()) as { ok?: boolean };
  return kq.ok === true;
}
