/**
 * Worker đồng bộ nền: cứ mỗi chu kỳ nhận các lịch đến hạn (lease + SKIP LOCKED) và chạy lần lượt.
 *
 * Không LISTEN: "khi có thay đổi" vốn phải chờ 5 phút (gộp loạt sửa) nên quét định kỳ đã đủ
 * nhanh; pg_notify trong trigger để dành nếu sau này cần đánh thức sớm.
 * Chạy lần lượt từng lịch (không song song): Google giới hạn ghi theo NGƯỜI, hai lịch cùng
 * người chạy song song dễ chạm quota.
 */
import { config } from '../config.ts';
import * as db from '../db.ts';
import { CUA_SO_CHO_PHUT } from '../core/lich.ts';
import { chayMotLich } from './chay-mot-lich.ts';

const CHU_KY_MS = 30_000;
const MOI_LO = 5;
/** Tối đa mấy lô mỗi chu kỳ — chừa thời gian cho lượt sau, không ôm một vòng quá lâu. */
const SO_LO_TOI_DA = 4;

export async function khoiDongWorker(): Promise<() => Promise<void>> {
  if (!config.workerBat) return async () => {};

  let dangChay: Promise<void> | null = null;
  let dung = false;

  const motLuot = async () => {
    for (let lo = 0; lo < SO_LO_TOI_DA && !dung; lo++) {
      const ds = await db.nhanLichDenHan(MOI_LO, CUA_SO_CHO_PHUT);
      if (ds.length === 0) return;
      for (const lich of ds) {
        if (dung) return;
        await chayMotLich(lich);
      }
    }
  };

  const tick = () => {
    if (dangChay || dung) return;
    dangChay = motLuot()
      .catch((e) => console.error('[sheets] worker lỗi:', (e as Error).message))
      .finally(() => {
        dangChay = null;
      });
  };

  const timer = setInterval(tick, CHU_KY_MS);
  tick();
  console.log(`[sheets] worker đồng bộ chạy, chu kỳ ${CHU_KY_MS / 1000}s`);

  return async () => {
    dung = true;
    clearInterval(timer);
    // Lịch đang dở giữ lease 15 phút — tắt ngang thì bản sau tự nhận lại khi lease hết.
    await dangChay;
  };
}
