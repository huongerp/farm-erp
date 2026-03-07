import { getTodayISODate } from '../../../../lib/utils';
import type { BaoCaoTuyenDungStatsResult } from '../hooks/useBaoCaoTuyenDungStats';
import type { TFunction } from 'i18next';

const FILENAME_PREFIX = 'bao_cao_tuyen_dung';

export function buildFunnelRows(stats: BaoCaoTuyenDungStatsResult, t: TFunction): Record<string, string | number>[] {
  const s = stats.summary;
  return [
    { [t('baoCaoTuyenDung.cardDeXuat')]: s.deXuatDaDuyet },
    { [t('baoCaoTuyenDung.cardUngVien')]: s.ungVien },
    { [t('baoCaoTuyenDung.cardPhongVan')]: s.lichPVDaDienRa },
    { [t('baoCaoTuyenDung.cardThuMoi')]: s.thuMoiNhanViec },
    { [t('baoCaoTuyenDung.cardHopDong')]: s.hopDong },
    { [t('baoCaoTuyenDung.cardHopDongThanhLy')]: s.hopDongThanhLy },
  ];
}

export function buildByViTriRows(stats: BaoCaoTuyenDungStatsResult, t: TFunction): Record<string, string | number>[] {
  return stats.byViTri.map((r) => ({
    [t('baoCaoTuyenDung.tableViTri')]: r.label,
    [t('baoCaoTuyenDung.tableSoUngVien')]: r.so_ung_vien,
    [t('baoCaoTuyenDung.tableSoPV')]: r.so_pv,
    [t('baoCaoTuyenDung.tableSoThuMoi')]: r.so_thu_moi,
    [t('baoCaoTuyenDung.tableSoHopDong')]: r.so_hop_dong,
  }));
}

export function buildByNguonRows(stats: BaoCaoTuyenDungStatsResult, t: TFunction): Record<string, string | number>[] {
  return stats.byNguon.map((r) => ({
    [t('baoCaoTuyenDung.tableNguon')]: r.label || r.id,
    [t('baoCaoTuyenDung.tableSoUngVien')]: r.so_ung_vien,
  }));
}

export async function exportBaoCaoTuyenDungToExcel(
  stats: BaoCaoTuyenDungStatsResult,
  t: TFunction
): Promise<void> {
  const XLSX = await import('xlsx');
  const wb = XLSX.utils.book_new();

  const funnelRows = buildFunnelRows(stats, t);
  const wsFunnel = XLSX.utils.json_to_sheet(funnelRows);
  XLSX.utils.book_append_sheet(wb, wsFunnel, 'TongQuan');

  const byViTriRows = buildByViTriRows(stats, t);
  if (byViTriRows.length > 0) {
    const wsViTri = XLSX.utils.json_to_sheet(byViTriRows);
    XLSX.utils.book_append_sheet(wb, wsViTri, 'TheoViTri');
  }

  const byNguonRows = buildByNguonRows(stats, t);
  if (byNguonRows.length > 0) {
    const wsNguon = XLSX.utils.json_to_sheet(byNguonRows);
    XLSX.utils.book_append_sheet(wb, wsNguon, 'TheoNguon');
  }

  XLSX.writeFile(wb, `${FILENAME_PREFIX}_${getTodayISODate()}.xlsx`);
}
