import { createGenericStore, type ColumnConfig } from '../../../../store/createGenericStore';
import i18n from '../../../../lib/i18n';

export interface TieuChiKpiFilters {
  id_hanh_dong: string | null;
  loai: string | null;
  cach_tinh_diem: string | null;
  tan_suat: string | null;
}

const DEFAULT_COLUMNS: ColumnConfig[] = [
  { id: 'hanh_dong', label: i18n.t('tieuChiKpi.col.hanhDong'), visible: true, minWidth: 180, maxWidth: 280, order: 0 },
  { id: 'ma', label: i18n.t('tieuChiKpi.col.ma'), visible: true, minWidth: 90, maxWidth: 120, order: 1 },
  { id: 'ten', label: i18n.t('tieuChiKpi.col.ten'), visible: true, minWidth: 180, maxWidth: 300, order: 2 },
  { id: 'don_vi_tinh', label: i18n.t('tieuChiKpi.col.donViTinh'), visible: true, minWidth: 80, maxWidth: 100, order: 3 },
  { id: 'loai', label: i18n.t('tieuChiKpi.col.loai'), visible: true, minWidth: 90, maxWidth: 120, order: 4 },
  { id: 'gia_tri_muc_tieu', label: i18n.t('tieuChiKpi.col.mucTieu'), visible: true, minWidth: 100, maxWidth: 140, order: 5 },
  { id: 'cach_tinh_diem', label: i18n.t('tieuChiKpi.col.cachTinhDiem'), visible: true, minWidth: 110, maxWidth: 160, order: 6 },
  { id: 'tan_suat', label: i18n.t('tieuChiKpi.col.tanSuat'), visible: true, minWidth: 80, maxWidth: 100, order: 7 },
  { id: 'ty_trong', label: i18n.t('tieuChiKpi.col.tyTrong'), visible: true, minWidth: 80, maxWidth: 100, order: 8 },
  { id: 'tg_cap_nhat', label: i18n.t('tieuChiKpi.col.tgCapNhat'), visible: true, minWidth: 100, maxWidth: 130, order: 9 },
];

const initialFilters: TieuChiKpiFilters = {
  id_hanh_dong: null,
  loai: null,
  cach_tinh_diem: null,
  tan_suat: null,
};

export const useTieuChiKpiStore = createGenericStore<TieuChiKpiFilters>(
  initialFilters,
  DEFAULT_COLUMNS
);
