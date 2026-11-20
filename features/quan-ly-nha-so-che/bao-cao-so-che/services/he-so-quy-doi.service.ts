import { db, throwDbError } from '../../../../lib/db';
import { buildHeSoGoiY, type HeSoGoiY, type HeSoLichSuRow } from '../core/he-so-quy-doi';

const TABLE_PCAP = 'fp_farm_bao_cao_so_che_pham_cap';
/** Đủ để có mọi hệ số đang dùng (vài dòng / phiếu × vài trăm phiếu gần nhất). */
const LICH_SU_LIMIT = 1000;

/** Hệ số quy đổi đã lưu trên các phiếu trước → danh sách để chọn + hệ số gần nhất theo phẩm cấp. */
export async function fetchHeSoQuyDoiGoiY(): Promise<HeSoGoiY> {
  const { data, error } = await db
    .from(TABLE_PCAP)
    .select('ten_pham_cap,he_so_quy_doi')
    .not('he_so_quy_doi', 'is', null)
    .order('id', { ascending: false })
    .limit(LICH_SU_LIMIT);
  if (error) throwDbError(error, { resource: `${TABLE_PCAP}.heSoQuyDoi` });
  return buildHeSoGoiY((data ?? []) as HeSoLichSuRow[]);
}
