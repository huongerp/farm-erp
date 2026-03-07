import { createGenericStore, type ColumnConfig } from '../../../../store/createGenericStore';
import i18n from '../../../../lib/i18n';

export interface TheoDoiDanhGiaFilters {
  id_tieu_chi: string | null;
  id_phong_ban: string | null;
  ky_nam: number | null;
  ky_quy: number | null;
  ky_thang: number | null;
  trang_thai: string | null;
}

const DEFAULT_COLUMNS: ColumnConfig[] = [
  { id: 'ky', label: i18n.t('theoDoiDanhGia.col.ky'), visible: true, minWidth: 100, maxWidth: 140, order: 0 },
  { id: 'phong_ban', label: i18n.t('theoDoiDanhGia.col.phongBan'), visible: true, minWidth: 140, maxWidth: 220, order: 1 },
  { id: 'tieu_chi', label: i18n.t('theoDoiDanhGia.col.tieuChi'), visible: true, minWidth: 180, maxWidth: 280, order: 2 },
  { id: 'muc_tieu', label: i18n.t('theoDoiDanhGia.col.mucTieu'), visible: true, minWidth: 90, maxWidth: 120, order: 3 },
  { id: 'thuc_te', label: i18n.t('theoDoiDanhGia.col.thucTe'), visible: true, minWidth: 90, maxWidth: 120, order: 4 },
  { id: 'diem', label: i18n.t('theoDoiDanhGia.col.diem'), visible: true, minWidth: 70, maxWidth: 90, order: 5 },
  { id: 'trang_thai', label: i18n.t('theoDoiDanhGia.col.trangThai'), visible: true, minWidth: 100, maxWidth: 140, order: 6 },
  { id: 'tg_cap_nhat', label: i18n.t('theoDoiDanhGia.col.tgCapNhat'), visible: true, minWidth: 100, maxWidth: 130, order: 7 },
];

const initialFilters: TheoDoiDanhGiaFilters = {
  id_tieu_chi: null,
  id_phong_ban: null,
  ky_nam: null,
  ky_quy: null,
  ky_thang: null,
  trang_thai: null,
};

export const useTheoDoiDanhGiaStore = createGenericStore<TheoDoiDanhGiaFilters>(
  initialFilters,
  DEFAULT_COLUMNS
);
