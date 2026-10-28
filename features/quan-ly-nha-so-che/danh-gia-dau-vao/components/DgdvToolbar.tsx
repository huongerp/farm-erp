import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Building2, Calendar, Download, Hash, Plus, Settings, ToggleLeft, Upload } from 'lucide-react';
import Button from '../../../../components/ui/Button';
import Tooltip from '../../../../components/ui/Tooltip';
import GenericToolbar from '../../../../components/shared/GenericToolbar';
import ResponsiveFilterChips, { type FilterChipItem } from '../../../../components/shared/ResponsiveFilterChips';
import { useGenericToolbarSearch } from '../../../../lib/hooks/use-generic-toolbar-search';
import type { Branch } from '../../../he-thong/chi-nhanh/core/types';
import type { DgdvTomTat } from '../services/danh-gia-dau-vao-db.service';
import { useDanhGiaDauVaoStore } from '../store/useDanhGiaDauVaoStore';

interface Props {
  /** Tóm tắt TOÀN BỘ phiếu trong phạm vi (không phải trang đang xem) — chip đếm trên toàn bộ. */
  data: DgdvTomTat[];
  branches: Branch[];
  selectedCount: number;
  onAdd: () => void;
  onDeleteMany?: () => void;
  onExport: () => void;
  /** Mở Import Excel dòng chi tiết — chỉ truyền khi được tạo phiếu. */
  onImport?: () => void;
  /** Mở dialog Cài đặt — chỉ truyền khi được ghi danh mục. */
  onCaiDat?: () => void;
  canCreate?: boolean;
  canDelete?: boolean;
  bulkActions?: React.ReactNode;
}

const DgdvToolbar: React.FC<Props> = ({
  data,
  branches,
  selectedCount,
  onAdd,
  onDeleteMany,
  onExport,
  onImport,
  onCaiDat,
  canCreate = true,
  canDelete = true,
  bulkActions,
}) => {
  const { t } = useTranslation();
  const { searchInput, setSearchInput, commitSearchTerm } = useGenericToolbarSearch(useDanhGiaDauVaoStore);
  const filters = useDanhGiaDauVaoStore((s) => s.filters);
  const setFilter = useDanhGiaDauVaoStore((s) => s.setFilter);
  const clearSelection = useDanhGiaDauVaoStore((s) => s.clearSelection);
  const columns = useDanhGiaDauVaoStore((s) => s.columns);
  const toggleColumn = useDanhGiaDauVaoStore((s) => s.toggleColumn);
  const reorderColumns = useDanhGiaDauVaoStore((s) => s.reorderColumns);
  const resetColumns = useDanhGiaDauVaoStore((s) => s.resetColumns);
  const resetColumnWidths = useDanhGiaDauVaoStore((s) => s.resetColumnWidths);

  const filterGroups = useMemo(() => {
    const dem = (fn: (d: DgdvTomTat) => boolean) => data.filter(fn).length;
    const namSet = [...new Set(data.map((d) => d.nam))].sort((a, b) => b - a);
    const tuanSet = [...new Set(data.map((d) => d.tuan))].sort((a, b) => b - a);
    const idsCo = new Set(data.map((d) => d.id_chi_nhanh));
    return [
      {
        key: 'branch',
        label: t('danhGiaDauVao.toolbar.filterBranch'),
        icon: Building2,
        options: branches
          .filter((b) => idsCo.has(String(b.id)))
          .map((b) => ({ value: String(b.id), label: `${b.ma_chi_nhanh} — ${b.ten_chi_nhanh}`, count: dem((d) => d.id_chi_nhanh === String(b.id)) })),
        value: filters.id_chi_nhanh ?? [],
        onChange: (v: string[]) => setFilter('id_chi_nhanh', v),
      },
      {
        key: 'nam',
        label: t('danhGiaDauVao.toolbar.filterNam'),
        icon: Calendar,
        options: namSet.map((n) => ({ value: String(n), label: String(n), count: dem((d) => d.nam === n) })),
        value: filters.nam ?? [],
        onChange: (v: string[]) => setFilter('nam', v),
      },
      {
        key: 'tuan',
        label: t('danhGiaDauVao.toolbar.filterTuan'),
        icon: Hash,
        options: tuanSet.map((n) => ({
          value: String(n),
          label: t('danhGiaDauVao.luoi.tuan', { tuan: n }),
          count: dem((d) => d.tuan === n),
        })),
        value: filters.tuan ?? [],
        onChange: (v: string[]) => setFilter('tuan', v),
      },
      {
        key: 'trang_thai',
        label: t('danhGiaDauVao.toolbar.filterTrangThai'),
        icon: ToggleLeft,
        options: (['mo', 'khoa'] as const).map((v) => ({
          value: v,
          label: t(`danhGiaDauVao.trangThai.${v}`),
          count: dem((d) => d.trang_thai === v),
        })),
        value: filters.trang_thai ?? [],
        onChange: (v: string[]) => setFilter('trang_thai', v),
      },
    ];
  }, [t, data, branches, filters.id_chi_nhanh, filters.nam, filters.tuan, filters.trang_thai, setFilter]);

  const chipWidths = ['sm:w-[200px]', 'sm:w-[110px]', 'sm:w-[120px]', 'sm:w-[140px]'];
  const filterItems: FilterChipItem[] = filterGroups.map((g, i) => ({ kind: 'group', group: g, className: `w-full ${chipWidths[i]}` }));

  const activeFilterCount =
    (searchInput.trim() ? 1 : 0) +
    (filters.id_chi_nhanh?.length ?? 0) +
    (filters.nam?.length ?? 0) +
    (filters.tuan?.length ?? 0) +
    (filters.trang_thai?.length ?? 0);

  const handleClearAllFilters = () => {
    commitSearchTerm('');
    setFilter('id_chi_nhanh', []);
    setFilter('nam', []);
    setFilter('tuan', []);
    setFilter('trang_thai', []);
  };

  const mobileActions = useMemo(
    () => [
      ...(onImport ? [{ key: 'import', label: t('danhGiaDauVao.import.nut'), icon: Upload, onClick: onImport, description: '' }] : []),
      { key: 'export', label: t('common.export'), icon: Download, onClick: onExport, description: '' },
      ...(onCaiDat ? [{ key: 'cai-dat', label: t('danhGiaDauVao.caiDat.title'), icon: Settings, onClick: onCaiDat, description: '' }] : []),
    ],
    [onExport, onImport, onCaiDat, t]
  );

  const iconBtn =
    'inline-flex min-h-[44px] min-w-[44px] md:min-h-0 md:min-w-0 h-9 w-9 p-0 items-center justify-center border-border text-muted-foreground hover:bg-muted/50';

  const renderActions = (
    <>
      <div className="hidden sm:flex items-center gap-2">
        {onCaiDat && (
          <Tooltip content={t('danhGiaDauVao.caiDat.title')} placement="bottom">
            <Button variant="outline" size="sm" onClick={onCaiDat} className={iconBtn} aria-label={t('danhGiaDauVao.caiDat.title')}>
              <Settings className="w-4 h-4" />
            </Button>
          </Tooltip>
        )}
        {onImport && (
          <Tooltip content={t('danhGiaDauVao.import.nut')} placement="bottom">
            <Button variant="outline" size="sm" onClick={onImport} className={iconBtn} aria-label={t('danhGiaDauVao.import.nut')}>
              <Upload className="w-4 h-4" />
            </Button>
          </Tooltip>
        )}
        <Tooltip content={t('common.export')} placement="bottom">
          <Button variant="outline" size="sm" onClick={onExport} className={iconBtn} aria-label={t('common.export')}>
            <Download className="w-4 h-4" />
          </Button>
        </Tooltip>
      </div>
      {canCreate ? (
        <Button onClick={onAdd} size="sm" className="bg-primary text-white hover:bg-primary/90 shadow-md shadow-primary/20 h-9 px-3 sm:px-4">
          <Plus className="w-5 h-5 sm:w-4 sm:h-4 sm:mr-2" />
          <span className="hidden sm:inline">{t('danhGiaDauVao.toolbar.add')}</span>
        </Button>
      ) : null}
    </>
  );

  return (
    <GenericToolbar
      selectedCount={selectedCount}
      bulkActions={bulkActions}
      onDeleteMany={canDelete ? onDeleteMany : undefined}
      searchTerm={searchInput}
      onSearchChange={setSearchInput}
      onClearSelection={clearSelection}
      actions={renderActions}
      filters={<ResponsiveFilterChips items={filterItems} />}
      filterGroups={filterGroups}
      mobileActions={mobileActions}
      onAdd={canCreate ? onAdd : undefined}
      showBack
      activeFilterCount={activeFilterCount}
      onClearAllFilters={handleClearAllFilters}
      columns={columns}
      onToggleColumn={toggleColumn}
      onReorderColumns={reorderColumns}
      onResetColumns={resetColumns}
      onResetColumnWidths={resetColumnWidths}
    />
  );
};

export default DgdvToolbar;
