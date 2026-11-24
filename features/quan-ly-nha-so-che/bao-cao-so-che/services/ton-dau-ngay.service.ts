import { db, throwDbError } from '../../../../lib/db';
import { docBcscTonDauNgay, type BcscTonDauNgay } from '../core/ton-dau-ngay';

const RPC_TON_DAU_NGAY = 'fn_bcsc_ton_dau_ngay';

/** Tồn đầu ngày = tồn cuối phiếu liền trước cùng chi nhánh (migration 100). */
export async function getBcscTonDauNgayDb(ngay: string, idChiNhanh: number): Promise<BcscTonDauNgay> {
  const { data, error } = await db.rpc(RPC_TON_DAU_NGAY, { p_ngay: ngay, p_id_chi_nhanh: idChiNhanh });
  if (error) throwDbError(error);
  return docBcscTonDauNgay(data);
}
