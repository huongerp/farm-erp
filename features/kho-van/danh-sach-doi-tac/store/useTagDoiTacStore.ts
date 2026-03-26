import { createGenericStore, type ColumnConfig } from '../../../../store/createGenericStore';
import i18n from '../../../../lib/i18n';

/** Bộ lọc tag đối tác; mở rộng bằng cách thêm field vào type. */
export type TagDoiTacFilters = Record<string, never>;

const DEFAULT_COLUMNS: ColumnConfig[] = [
  { id: 'ten_tag', label: i18n.t('doiTac.danhMuc.form.tenTag'), visible: true, minWidth: 160, maxWidth: 320, order: 0 },
];

const initialFilters: TagDoiTacFilters = {};

export const useTagDoiTacStore = createGenericStore<TagDoiTacFilters>(initialFilters, DEFAULT_COLUMNS);
