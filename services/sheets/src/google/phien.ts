/**
 * Lấy access token còn hạn cho một nhân viên: dùng bản cache trong DB nếu còn > 60s,
 * không thì refresh. Refresh bị Google từ chối (invalid_grant) → đánh dấu kết nối hỏng.
 */
import * as db from '../db.ts';
import { KetNoiHongLoi, lamMoiAccessToken } from './oauth.ts';

export class ChuaKetNoiLoi extends Error {}

export async function layAccessToken(nhanVienId: number): Promise<{ accessToken: string; email: string }> {
  const kn = await db.layKetNoi(nhanVienId);
  if (!kn) throw new ChuaKetNoiLoi('Chưa kết nối tài khoản Google.');
  if (kn.trangThai === 'hong') throw new KetNoiHongLoi('Kết nối Google đã hết hiệu lực — hãy kết nối lại.');

  if (kn.accessToken && kn.hetHan && kn.hetHan.getTime() - Date.now() > 60_000) {
    return { accessToken: kn.accessToken, email: kn.email };
  }
  try {
    const moi = await lamMoiAccessToken(kn.refreshToken);
    await db.capNhatAccessToken(nhanVienId, moi.accessToken, moi.hetHan);
    return { accessToken: moi.accessToken, email: kn.email };
  } catch (e) {
    if (e instanceof KetNoiHongLoi) await db.danhDauHong(nhanVienId);
    throw e;
  }
}
