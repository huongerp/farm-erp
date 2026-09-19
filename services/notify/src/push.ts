/**
 * Gửi Web Push theo chuẩn VAPID — không phụ thuộc Firebase hay dịch vụ bên thứ ba.
 *
 * Trình duyệt tự chọn push service của nó (FCM với Chrome, Mozilla autopush với
 * Firefox, Apple Push với Safari); ta chỉ ký payload bằng khoá VAPID nên không
 * phải đăng ký tài khoản ở đâu cả.
 */

import webpush from 'web-push';
import { config } from './config.ts';
import { xoaSubscriptionTheoEndpoint, danhDauDaDungSubscription, tangLoiSubscription } from './db.ts';
import type { DongSubscription } from './db.ts';

if (config.pushBat) {
  webpush.setVapidDetails(config.vapidSubject, config.vapidPublicKey, config.vapidPrivateKey);
} else {
  console.warn('[notify/push] Thiếu VAPID_PUBLIC_KEY hoặc VAPID_PRIVATE_KEY — chỉ ghi chuông, không đẩy push.');
}

export interface NoiDungPush {
  tieuDe: string;
  noiDung: string | null;
  link: string | null;
  /** Gom thông báo cùng một bản ghi vào một chỗ trên màn hình khoá. */
  tag: string;
  muc: 'cao' | 'thuong';
  /** Tổng số chưa đọc sau sự kiện này — service worker dùng để đặt badge trên icon app. */
  soChuaDoc?: number;
}

/**
 * Gửi tới một thiết bị.
 * 404/410 = endpoint đã chết (gỡ app, xoá dữ liệu trình duyệt) → xoá thẳng dòng
 * subscription, nếu không hàng đợi sẽ mãi thử lại một địa chỉ không còn tồn tại.
 */
export async function guiToiMotThietBi(sub: DongSubscription, nd: NoiDungPush): Promise<boolean> {
  if (!config.pushBat) return false;

  try {
    await webpush.sendNotification(
      { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.authKey } },
      JSON.stringify(nd),
      { TTL: nd.muc === 'cao' ? 60 * 60 * 24 : 60 * 60 * 6, urgency: nd.muc === 'cao' ? 'high' : 'normal' }
    );
    await danhDauDaDungSubscription(sub.id);
    return true;
  } catch (e) {
    const status = (e as { statusCode?: number }).statusCode;
    if (status === 404 || status === 410) {
      await xoaSubscriptionTheoEndpoint(sub.endpoint);
      return false;
    }
    await tangLoiSubscription(sub.id);
    console.error(`[notify/push] gửi thất bại (${status ?? 'không rõ'}):`, (e as Error).message);
    return false;
  }
}

export async function guiToiTatCaThietBi(
  dsSub: readonly DongSubscription[],
  nd: NoiDungPush
): Promise<number> {
  const ketQua = await Promise.all(dsSub.map((s) => guiToiMotThietBi(s, nd)));
  return ketQua.filter(Boolean).length;
}
