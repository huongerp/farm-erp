import { createGenericStore, type ColumnConfig } from '../../../../store/createGenericStore';
import i18n from '../../../../lib/i18n';
import type { ThanhToanFilters } from '../core/types';

const DEFAULT_COLUMNS: ColumnConfig[] = [
  { id: 'ngay', label: i18n.t('hopDong.thanhToan.store.ngayCol'), visible: true, minWidth: 100, maxWidth: 120, order: 0 },
  {
    id: 'ma_hop_dong',
    label: i18n.t('hopDong.thanhToan.store.maHopDongCol'),
    visible: true,
    minWidth: 120,
    maxWidth: 160,
    order: 1,
  },
  { id: 'ten_dot', label: i18n.t('hopDong.thanhToan.store.tenDotCol'), visible: true, minWidth: 120, maxWidth: 200, order: 2 },
  { id: 'so_tien', label: i18n.t('hopDong.thanhToan.store.soTienCol'), visible: true, minWidth: 120, maxWidth: 140, order: 3 },
  { id: 'so_cay_thuc_nhan', label: i18n.t('hopDong.thanhToan.store.soCayCol'), visible: true, minWidth: 100, maxWidth: 120, order: 4 },
  {
    id: 'ten_chi_nhanh',
    label: i18n.t('hopDong.thanhToan.store.chiNhanhCol'),
    visible: true,
    minWidth: 120,
    maxWidth: 180,
    order: 5,
  },
  {
    id: 'ten_nha_cung_cap',
    label: i18n.t('hopDong.thanhToan.store.nccCol'),
    visible: true,
    minWidth: 140,
    maxWidth: 220,
    order: 6,
  },
  { id: 'ghi_chu', label: i18n.t('hopDong.thanhToan.store.ghiChuCol'), visible: true, minWidth: 100, maxWidth: 180, order: 7 },
];

const initialFilters: ThanhToanFilters = {
  chiNhanhIds: [],
  nccIds: [],
  hopDongIds: [],
  dateFrom: '',
  dateTo: '',
  nguoiTaoIds: [],
};

export const useThanhToanStore = createGenericStore<ThanhToanFilters>(initialFilters, DEFAULT_COLUMNS);
