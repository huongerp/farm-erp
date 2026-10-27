/**
 * Tổng của một ngày + chi nhánh theo phiếu Đánh giá đầu vào (RPC `fn_dgdv_tong_ngay`, migration 052).
 * Báo cáo sơ chế và Dự báo SL đóng thùng dùng để hiện ô khoá — DB ghi đè đúng số này bằng trigger.
 */
import { db, throwDbError } from '../../../../lib/db';

export interface DgdvTongNgay {
  /** Σ số lượng các dây + Σ đứt dây. */
  tong_thu: number;
  /** Σ số lượng lỗi (không sơ chế). */
  ksc: number;
}

const RPC_TONG_NGAY = 'fn_dgdv_tong_ngay';

/** Id chi nhánh hợp lệ cho RPC (bigint dương), không hợp lệ → null. */
export function idChiNhanhChoRpc(idChiNhanh: string | number | null | undefined): number | null {
  if (idChiNhanh == null || String(idChiNhanh).trim() === '') return null;
  const n = Number(idChiNhanh);
  return Number.isSafeInteger(n) && n > 0 ? n : null;
}

/** RPC trả TABLE → PostgREST trả mảng 1 dòng; bigint có thể về dạng chuỗi. Không có dòng = 0. */
export function docDgdvTongNgay(data: unknown): DgdvTongNgay {
  const dong = Array.isArray(data) ? data[0] : data;
  const o = dong && typeof dong === 'object' ? (dong as Record<string, unknown>) : {};
  const so = (v: unknown) => {
    const n = Number(v);
    return Number.isFinite(n) && n > 0 ? n : 0;
  };
  return { tong_thu: so(o.tong_thu), ksc: so(o.ksc) };
}

export async function getDgdvTongNgayDb(ngay: string, idChiNhanh: number): Promise<DgdvTongNgay> {
  const { data, error } = await db.rpc(RPC_TONG_NGAY, { p_ngay: ngay, p_id_chi_nhanh: idChiNhanh });
  if (error) throwDbError(error);
  return docDgdvTongNgay(data);
}
