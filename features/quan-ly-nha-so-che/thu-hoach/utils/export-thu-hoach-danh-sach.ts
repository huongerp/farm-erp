/**
 * Export danh sách thu hoạch (tab Nhập liệu): map phẳng + định nghĩa cột — cùng pattern phiếu kho.
 */
import type { TFunction } from 'i18next';
import type { FarmThuHoach } from '../core/types';
import { THU_HOACH_DAY_SUFFIXES } from '../core/types';
import { formatThuDuKienShort } from '../core/utils';
import type { ExportColumn } from '../../../../components/shared/LazyExportDialog';
import { DAY_FORM_LABEL_KEY } from '../core/form-mappers';

export function mapFarmThuHoachListRow(p: FarmThuHoach): Record<string, unknown> {
  const row: Record<string, unknown> = {
    id: p.id,
    nam: p.nam,
    tuan: p.tuan,
    id_chi_nhanh: p.id_chi_nhanh ?? '',
    ten_chi_nhanh: p.ten_chi_nhanh ?? '',
    du_thu_tuan: Number(p.du_thu_tuan ?? 0),
    thu_du_kien_ma: (p.thu_du_kien ?? []).join(','),
    thu_du_kien_label:
      (p.thu_du_kien ?? []).length > 0 ? formatThuDuKienShort(p.thu_du_kien ?? []) : '',
  };
  let tongKh = 0;
  let tongTt = 0;
  for (const d of THU_HOACH_DAY_SUFFIXES) {
    const kh = Number(p[`ke_hoach_${d}` as keyof FarmThuHoach] ?? 0);
    const tt = Number(p[`thuc_te_${d}` as keyof FarmThuHoach] ?? 0);
    row[`ke_hoach_${d}`] = kh;
    row[`thuc_te_${d}`] = tt;
    row[`chenh_lech_${d}`] = tt - kh;
    tongKh += kh;
    tongTt += tt;
  }
  row.tong_ke_hoach_tuan = tongKh;
  row.tong_thuc_te_tuan = tongTt;
  row.chenh_lech_tuan = tongTt - tongKh;
  row.chenh_lech_du_vs_kh = tongKh - Number(p.du_thu_tuan ?? 0);
  row.chenh_lech_tt_vs_du = tongTt - Number(p.du_thu_tuan ?? 0);
  row.ghi_chu = p.ghi_chu ?? '';
  row.trao_doi = p.trao_doi ?? '';
  row.id_nguoi_tao = p.id_nguoi_tao ?? '';
  row.ten_nguoi_tao = p.ten_nguoi_tao ?? '';
  row.tg_tao = p.tg_tao ?? '';
  row.tg_cap_nhat = p.tg_cap_nhat ?? '';
  return row;
}

export function getExportColumnsThuHoachList(t: TFunction): ExportColumn[] {
  const cols: ExportColumn[] = [
    { key: 'id', label: t('thuHoach.export.list.id') },
    { key: 'nam', label: t('thuHoach.export.list.nam') },
    { key: 'tuan', label: t('thuHoach.export.list.tuan') },
    { key: 'id_chi_nhanh', label: t('thuHoach.export.list.id_chi_nhanh') },
    { key: 'ten_chi_nhanh', label: t('thuHoach.export.list.ten_chi_nhanh') },
    { key: 'du_thu_tuan', label: t('thuHoach.export.list.du_thu_tuan') },
    { key: 'thu_du_kien_ma', label: t('thuHoach.export.list.thu_du_kien_ma') },
    { key: 'thu_du_kien_label', label: t('thuHoach.export.list.thu_du_kien_label') },
  ];
  for (const d of THU_HOACH_DAY_SUFFIXES) {
    const day = t(DAY_FORM_LABEL_KEY[d]);
    cols.push(
      { key: `ke_hoach_${d}`, label: t('thuHoach.export.list.keHoachDay', { day }) },
      { key: `thuc_te_${d}`, label: t('thuHoach.export.list.thucTeDay', { day }) },
      { key: `chenh_lech_${d}`, label: t('thuHoach.export.list.chenhLechDay', { day }) }
    );
  }
  cols.push(
    { key: 'tong_ke_hoach_tuan', label: t('thuHoach.export.list.tong_ke_hoach_tuan') },
    { key: 'tong_thuc_te_tuan', label: t('thuHoach.export.list.tong_thuc_te_tuan') },
    { key: 'chenh_lech_tuan', label: t('thuHoach.export.list.chenh_lech_tuan') },
    { key: 'chenh_lech_du_vs_kh', label: t('thuHoach.export.list.chenh_lech_du_vs_kh') },
    { key: 'chenh_lech_tt_vs_du', label: t('thuHoach.export.list.chenh_lech_tt_vs_du') },
    { key: 'ghi_chu', label: t('thuHoach.export.list.ghi_chu') },
    { key: 'trao_doi', label: t('thuHoach.export.list.trao_doi') },
    { key: 'id_nguoi_tao', label: t('thuHoach.export.list.id_nguoi_tao') },
    { key: 'ten_nguoi_tao', label: t('thuHoach.export.list.ten_nguoi_tao') },
    { key: 'tg_tao', label: t('thuHoach.export.list.tg_tao') },
    { key: 'tg_cap_nhat', label: t('thuHoach.export.list.tg_cap_nhat') }
  );
  return cols;
}

export function exportFileNameThuHoachDanhSach(): string {
  return 'Thu_hoach';
}
