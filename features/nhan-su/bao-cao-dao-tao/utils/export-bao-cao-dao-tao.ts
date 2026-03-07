import { getTodayISODate } from '../../../../lib/utils';
import type { BaoCaoDaoTaoStatsResult } from '../hooks/useBaoCaoDaoTaoStats';
import type { TFunction } from 'i18next';

const FILENAME_PREFIX = 'bao_cao_dao_tao';

export function buildSummaryRows(
  stats: BaoCaoDaoTaoStatsResult,
  t: TFunction
): Record<string, string | number>[] {
  const s = stats.summary;
  const k1 = t('baoCaoDaoTao.cardTongDangKy');
  const k2 = t('baoCaoDaoTao.cardDangHoc');
  const k3 = t('baoCaoDaoTao.cardHoanThanh');
  const k4 = t('baoCaoDaoTao.cardTyLeHoanThanh');
  const k5 = t('baoCaoDaoTao.cardHuy');
  return [
    { [k1]: s.tongDangKy },
    { [k2]: s.dangHoc },
    { [k3]: s.hoanThanh },
    { [k4]: `${s.tyLeHoanThanh.toFixed(1)}%` },
    { [k5]: s.huy },
  ];
}

export function buildByKhoaRows(
  stats: BaoCaoDaoTaoStatsResult,
  t: TFunction
): Record<string, string | number>[] {
  const colKhoa = t('baoCaoDaoTao.tableKhoa');
  const colSoDangKy = t('baoCaoDaoTao.tableSoDangKy');
  const colSoDangHoc = t('baoCaoDaoTao.tableSoDangHoc');
  const colSoHoanThanh = t('baoCaoDaoTao.tableSoHoanThanh');
  const colTyLe = t('baoCaoDaoTao.tableTyLe');
  return stats.byKhoa.map((r) => ({
    [colKhoa]: `${r.ma_khoa_hoc} - ${r.ten_khoa_hoc}`,
    [colSoDangKy]: r.so_dang_ky,
    [colSoDangHoc]: r.so_dang_hoc,
    [colSoHoanThanh]: r.so_hoan_thanh,
    [colTyLe]: `${r.ty_le_hoan_thanh.toFixed(1)}%`,
  }));
}

export async function exportBaoCaoDaoTaoToExcel(
  stats: BaoCaoDaoTaoStatsResult,
  t: TFunction
): Promise<void> {
  const XLSX = await import('xlsx');
  const wb = XLSX.utils.book_new();

  const summaryRows = buildSummaryRows(stats, t);
  const wsSummary = XLSX.utils.json_to_sheet(summaryRows);
  XLSX.utils.book_append_sheet(wb, wsSummary, 'TongQuan');

  const byKhoaRows = buildByKhoaRows(stats, t);
  if (byKhoaRows.length > 0) {
    const wsKhoa = XLSX.utils.json_to_sheet(byKhoaRows);
    XLSX.utils.book_append_sheet(wb, wsKhoa, 'TheoKhoa');
  }

  XLSX.writeFile(wb, `${FILENAME_PREFIX}_${getTodayISODate()}.xlsx`);
}
