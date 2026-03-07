import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, User, FileText, Activity, Download } from 'lucide-react';
import Button from '../../../../components/ui/Button';
import GenericToolbar from '../../../../components/shared/GenericToolbar';
import Tooltip from '../../../../components/ui/Tooltip';
import FilterChipMultiSelect from '../../../../components/shared/FilterChipMultiSelect';
import { useHopDongStore } from '../store/useHopDongStore';
import { useUngViens } from '@/features/nhan-su/ung-vien/hooks/use-ung-vien';
import { getLoaiHopDongLabel, getTrangThaiHopDongLabel } from '../core/constants';
import type { HopDong } from '../core/types';
import type { LoaiHopDong, TrangThaiHopDong } from '../core/constants';

const LOAI_HOP_DONG_VALUES: LoaiHopDong[] = ['thu-viec', 'chinh-thuc'];
const TRANG_THAI_VALUES: TrangThaiHopDong[] = ['hieu_luc', 'het_han', 'thanh_ly'];

interface Props {
  items?: HopDong[];
  onAdd: () => void;
  onDeleteMany: (ids: string[]) => void;
  onExport?: () => void;
  /** Số bản ghi đang hiển thị (sau filter/sort). Nếu 0 thì nút Xuất Excel bị disable theo quy chuẩn. */
  exportableCount?: number;
}

const DanhSachToolbar: React.FC<Props> = ({ items = [], onAdd, onDeleteMany, onExport, exportableCount = 0 }) => {
  const { t } = useTranslation();
  const { data: ungVienList = [] } = useUngViens();
  const {
    searchTerm,
    setSearchTerm,
    filters,
    setFilter,
    columns,
    toggleColumn,
    reorderColumns,
    resetColumns,
    selectedIds,
    clearSelection,
  } = useHopDongStore();

  const selectedCount = selectedIds.size;
  const activeFilterCount =
    filters.id_ung_vien.length + filters.loai_hop_dong.length + filters.trang_thai.length;

  const handleClearAllFilters = () => {
    setFilter('id_ung_vien', []);
    setFilter('loai_hop_dong', []);
    setFilter('trang_thai', []);
  };

  const ungVienOptions = useMemo(
    () =>
      ungVienList.map((u) => ({
        label: u.ho_ten,
        value: u.id,
        count: items.filter((i) => i.id_ung_vien === u.id).length,
      })),
    [ungVienList, items]
  );

  const loaiHopDongOptions = useMemo(
    () =>
      LOAI_HOP_DONG_VALUES.map((value) => ({
        label: getLoaiHopDongLabel(value, t),
        value,
        count: items.filter((i) => i.loai_hop_dong === value).length,
      })),
    [t, items]
  );

  const trangThaiOptions = useMemo(
    () =>
      TRANG_THAI_VALUES.map((value) => ({
        label: getTrangThaiHopDongLabel(value, t),
        value,
        count: items.filter((i) => i.trang_thai === value).length,
      })),
    [t, items]
  );

  const renderFilters = (
    <>
      <FilterChipMultiSelect
        options={ungVienOptions}
        value={filters.id_ung_vien}
        onChange={(val) => setFilter('id_ung_vien', val)}
        placeholder={t('hopDong.filterUngVien')}
        icon={User}
        className="w-full sm:w-[160px]"
      />
      <FilterChipMultiSelect
        options={loaiHopDongOptions}
        value={filters.loai_hop_dong}
        onChange={(val) => setFilter('loai_hop_dong', val)}
        placeholder={t('hopDong.filterLoaiHopDong')}
        icon={FileText}
        className="w-full sm:w-[140px]"
      />
      <FilterChipMultiSelect
        options={trangThaiOptions}
        value={filters.trang_thai}
        onChange={(val) => setFilter('trang_thai', val)}
        placeholder={t('hopDong.table.trangThai')}
        icon={Activity}
        className="w-full sm:w-[140px]"
      />
    </>
  );

  const canExport = Boolean(onExport && exportableCount > 0);
  const renderActions = (
    <div className="flex items-center gap-2">
      {onExport && (
        <Tooltip content={t('common.export')} placement="bottom">
          <span className={!canExport ? 'inline-block' : undefined}>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onExport}
              disabled={!canExport}
              className="h-9 px-3 sm:px-4 border-border"
            >
              <Download className="w-5 h-5 sm:w-4 sm:h-4 sm:mr-2" />
              <span className="hidden sm:inline">{t('common.export')}</span>
            </Button>
          </span>
        </Tooltip>
      )}
      <Button
        onClick={onAdd}
        size="sm"
        className="bg-primary text-white hover:bg-primary/90 shadow-md shadow-primary/20 h-9 px-3 sm:px-4"
      >
        <Plus className="w-5 h-5 sm:w-4 sm:h-4 sm:mr-2" />
        <span className="hidden sm:inline">{t('hopDong.add')}</span>
      </Button>
    </div>
  );

  const filterGroups = useMemo(
    () => [
      {
        key: 'id_ung_vien',
        label: t('hopDong.filterUngVien'),
        icon: User,
        options: ungVienOptions,
        value: filters.id_ung_vien,
        onChange: (val: string[]) => setFilter('id_ung_vien', val),
      },
      {
        key: 'loai_hop_dong',
        label: t('hopDong.filterLoaiHopDong'),
        icon: FileText,
        options: loaiHopDongOptions,
        value: filters.loai_hop_dong,
        onChange: (val: string[]) => setFilter('loai_hop_dong', val),
      },
      {
        key: 'trang_thai',
        label: t('hopDong.table.trangThai'),
        icon: Activity,
        options: trangThaiOptions,
        value: filters.trang_thai,
        onChange: (val: string[]) => setFilter('trang_thai', val),
      },
    ],
    [t, ungVienOptions, loaiHopDongOptions, trangThaiOptions, filters, setFilter]
  );

  return (
    <GenericToolbar
      selectedCount={selectedCount}
      searchTerm={searchTerm}
      onSearchChange={setSearchTerm}
      onClearSelection={clearSelection}
      actions={renderActions}
      filters={renderFilters}
      filterGroups={filterGroups}
      onAdd={onAdd}
      searchPlaceholder={t('hopDong.searchPlaceholder')}
      activeFilterCount={activeFilterCount}
      onClearAllFilters={handleClearAllFilters}
      onDeleteMany={() => onDeleteMany(Array.from(selectedIds))}
      columns={columns}
      onToggleColumn={toggleColumn}
      onReorderColumns={reorderColumns}
      onResetColumns={resetColumns}
      showBack
    />
  );
};

export default DanhSachToolbar;
