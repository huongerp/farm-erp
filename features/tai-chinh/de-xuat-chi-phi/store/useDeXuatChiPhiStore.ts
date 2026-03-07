import { createGenericStore, type ColumnConfig } from '../../../../store/createGenericStore';
import i18n from '../../../../lib/i18n';

export interface DeXuatChiPhiFilters {
  status: string[];
  loai: '' | 'thu' | 'chi';
}

const DEFAULT_COLUMNS: ColumnConfig[] = [
  { id: 'so_phieu', label: i18n.t('deXuatChiPhi.columns.soPhieu'), visible: true, minWidth: 120, maxWidth: 160, order: 0 },
  { id: 'ngay', label: i18n.t('deXuatChiPhi.columns.ngay'), visible: true, minWidth: 100, maxWidth: 120, order: 1 },
  { id: 'loai', label: i18n.t('deXuatChiPhi.columns.loai'), visible: true, minWidth: 80, maxWidth: 100, order: 2 },
  { id: 'ten_nguoi_de_xuat', label: i18n.t('deXuatChiPhi.columns.nguoiDeXuat'), visible: true, minWidth: 140, maxWidth: 200, order: 3 },
  { id: 'ten_tai_khoan', label: i18n.t('deXuatChiPhi.columns.taiKhoan'), visible: true, minWidth: 140, maxWidth: 200, order: 4 },
  { id: 'tong_tien', label: i18n.t('deXuatChiPhi.columns.tongTien'), visible: true, minWidth: 120, maxWidth: 160, order: 5 },
  { id: 'trang_thai', label: i18n.t('deXuatChiPhi.columns.trangThai'), visible: true, minWidth: 100, maxWidth: 140, order: 6 },
  { id: 'tg_cap_nhat', label: i18n.t('deXuatChiPhi.columns.tgCapNhat'), visible: true, minWidth: 100, maxWidth: 140, order: 7 },
  { id: 'actions', label: '', visible: true, minWidth: 90, maxWidth: 100, order: 8 },
];

const initialFilters: DeXuatChiPhiFilters = {
  status: [],
  loai: '',
};

export const useDeXuatChiPhiStore = createGenericStore<DeXuatChiPhiFilters>(
  initialFilters,
  DEFAULT_COLUMNS
);
