/**
 * Nhóm thông báo theo ngày: Hôm nay / Hôm qua / Trước đó.
 *
 * Tách khỏi component để test được — so ngày là chỗ dễ sai nhất khi chuỗi ISO
 * mang giờ UTC còn người dùng đọc theo giờ Việt Nam.
 */

import type { ThongBao } from './types';

export type NhomNgay = 'homNay' | 'homQua' | 'truocDo';

export interface NhomThongBao {
  nhom: NhomNgay;
  items: ThongBao[];
}

/** Số ngày lịch giữa hai mốc, tính theo ngày ĐỊA PHƯƠNG chứ không phải chênh lệch giờ. */
function cachMayNgay(moc: Date, soVoi: Date): number {
  const a = new Date(moc.getFullYear(), moc.getMonth(), moc.getDate());
  const b = new Date(soVoi.getFullYear(), soVoi.getMonth(), soVoi.getDate());
  return Math.round((b.getTime() - a.getTime()) / 86_400_000);
}

export function nhomNgayCua(tgTao: string, bayGio: Date = new Date()): NhomNgay {
  const luc = new Date(tgTao);
  if (Number.isNaN(luc.getTime())) return 'truocDo';

  const cach = cachMayNgay(luc, bayGio);
  if (cach <= 0) return 'homNay';
  if (cach === 1) return 'homQua';
  return 'truocDo';
}

/**
 * Giữ nguyên thứ tự đầu vào (đã sắp mới nhất trước) và bỏ nhóm rỗng, để giao
 * diện không phải kiểm tra rỗng ở từng chỗ.
 */
export function nhomTheoNgay(items: readonly ThongBao[], bayGio: Date = new Date()): NhomThongBao[] {
  const thu: Record<NhomNgay, ThongBao[]> = { homNay: [], homQua: [], truocDo: [] };
  for (const tb of items) thu[nhomNgayCua(tb.tgTao, bayGio)].push(tb);

  const thuTu: NhomNgay[] = ['homNay', 'homQua', 'truocDo'];
  return thuTu.filter((n) => thu[n].length > 0).map((n) => ({ nhom: n, items: thu[n] }));
}

/** Nhãn thời gian tương đối ngắn gọn: "5 phút", "3 giờ", "2 ngày". */
export function nhanThoiGian(
  tgTao: string,
  t: (key: string, opts?: Record<string, unknown>) => string,
  bayGio: Date = new Date()
): string {
  const luc = new Date(tgTao);
  if (Number.isNaN(luc.getTime())) return '';

  const giay = Math.floor((bayGio.getTime() - luc.getTime()) / 1000);
  if (giay < 60) return t('notification.time.justNow');
  if (giay < 3600) return t('notification.time.minutes', { count: Math.floor(giay / 60) });
  if (giay < 86_400) return t('notification.time.hours', { count: Math.floor(giay / 3600) });
  return t('notification.time.days', { count: Math.floor(giay / 86_400) });
}
