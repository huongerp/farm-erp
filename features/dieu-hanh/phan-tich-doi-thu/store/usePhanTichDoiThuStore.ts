import { createGenericStore, type ColumnConfig } from '../../../../store/createGenericStore';
import i18n from '../../../../lib/i18n';

export interface PhanTichDoiThuFilters {
  phan_loai: string[];
}

const DEFAULT_COLUMNS: ColumnConfig[] = [
  { id: 'ten_doi_thu', label: i18n.t('phanTichDoiThu.col.tenDoiThu'), visible: true, minWidth: 180, maxWidth: 280, order: 0 },
  { id: 'phan_loai', label: i18n.t('phanTichDoiThu.col.phanLoai'), visible: true, minWidth: 110, maxWidth: 140, order: 1 },
  { id: 'diem_manh_nhat', label: i18n.t('phanTichDoiThu.col.diemManhNhat'), visible: true, minWidth: 160, maxWidth: 260, order: 2 },
  { id: 'link', label: i18n.t('phanTichDoiThu.col.link'), visible: true, minWidth: 120, maxWidth: 180, order: 3 },
  { id: 'ngay_cap_nhat', label: i18n.t('phanTichDoiThu.col.ngayCapNhat'), visible: true, minWidth: 110, maxWidth: 140, order: 4 },
];

const initialFilters: PhanTichDoiThuFilters = {
  phan_loai: [],
};

export const usePhanTichDoiThuStore = createGenericStore<PhanTichDoiThuFilters>(
  initialFilters,
  DEFAULT_COLUMNS
);
