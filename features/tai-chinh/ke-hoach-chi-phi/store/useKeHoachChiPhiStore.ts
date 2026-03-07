import { createGenericStore, type ColumnConfig } from '../../../../store/createGenericStore';
import i18n from '../../../../lib/i18n';
import type { KeHoachChiPhiTabId } from '../core/constants';

export interface KeHoachChiPhiFilters {
  nam: number;
  trang_thai: string[];
}

const currentYear = new Date().getFullYear();

/** Cột cho bảng phẳng: Khoản mục, Mô tả (sticky trái), Năm, Phòng, Tổng cộng, Tổng SL, T1..T12, Thao tác (sticky phải). */
const DEFAULT_COLUMNS: ColumnConfig[] = [
  { id: 'ten_danh_muc', label: i18n.t('keHoachChiPhi.columns.khoanMuc'), visible: true, minWidth: 160, maxWidth: 240, order: 0 },
  { id: 'mo_ta', label: i18n.t('keHoachChiPhi.columns.moTa'), visible: true, minWidth: 140, maxWidth: 220, order: 1 },
  { id: 'nam', label: i18n.t('keHoachChiPhi.columns.nam'), visible: true, minWidth: 72, maxWidth: 90, order: 2 },
  { id: 'ten_phong_ban', label: i18n.t('keHoachChiPhi.columns.phongBan'), visible: true, minWidth: 140, maxWidth: 200, order: 3 },
  { id: 'tong_cong', label: i18n.t('keHoachChiPhi.columns.tongCong'), visible: true, minWidth: 110, maxWidth: 140, order: 4 },
  { id: 'tong_sl', label: i18n.t('keHoachChiPhi.columns.tongSl'), visible: true, minWidth: 80, maxWidth: 100, order: 5 },
  ...Array.from({ length: 12 }, (_, i) => ({
    id: `thang_${i + 1}`,
    label: i18n.t('keHoachChiPhi.monthShort', { n: i + 1 }),
    visible: true,
    minWidth: 118,
    maxWidth: 140,
    order: 6 + i,
  })),
  { id: 'actions', label: i18n.t('common.actions'), visible: true, minWidth: 88, maxWidth: 100, order: 18 },
];

const initialFilters: KeHoachChiPhiFilters = {
  nam: currentYear,
  trang_thai: [],
};

export const useKeHoachChiPhiStore = createGenericStore<KeHoachChiPhiFilters>(
  initialFilters,
  DEFAULT_COLUMNS
);

export type { KeHoachChiPhiTabId };
