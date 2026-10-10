import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Building2, Calendar, CalendarDays, CircleDot, Download, FileText, Plus, Target } from 'lucide-react';
import Button from '../../../../components/ui/Button';
import Tooltip from '../../../../components/ui/Tooltip';
import GenericToolbar from '../../../../components/shared/GenericToolbar';
import ResponsiveFilterChips, { type FilterChipItem } from '../../../../components/shared/ResponsiveFilterChips';
import { useGenericToolbarSearch } from '../../../../lib/hooks/use-generic-toolbar-search';
import type { Branch } from '../../../he-thong/chi-nhanh/core/types';
import { MUC_DICH_THAM_QUAN, TRANG_THAI_DKTQ } from '../core/types';
import type { DkTqTomTat } from '../services/dang-ky-tham-quan-service';
import { useDangKyThamQuanStore } from '../store/useDangKyThamQuanStore';

interface Props {
  /** TÓM TẮT toàn bộ phiếu — chip lọc đếm trên toàn bộ dữ liệu, không phải trang đang xem. */
  data: DkTqTomTat[];
  branches: Branch[];
  selectedCount: number;
  onAdd: () => void;
  onDeleteMany: () => void;
  onExport: () => void;
  onInPhieuTrang: () => void;
  canCreate?: boolean;
  canDelete?: boolean;
}

const DangKyThamQuanToolbar: React.FC<Props> = ({
  data,
  branches,
  selectedCount,
  onAdd,
  onDeleteMany,
  onExport,
  onInPhieuTrang,
  canCreate = true,
  canDelete = true,
}) => {
  const { t } = useTranslation();
  const { searchInput, setSearchInput, commitSearchTerm } = useGenericToolbarSearch(useDangKyThamQuanStore);
  const filters = useDangKyThamQuanStore((s) => s.filters);
  const setFilter = useDangKyThamQuanStore((s) => s.setFilter);
  const clearSelection = useDangKyThamQuanStore((s) => s.clearSelection);
  const columns = useDangKyThamQuanStore((s) => s.columns);
  const toggleColumn = useDangKyThamQuanStore((s) => s.toggleColumn);
  const reorderColumns = useDangKyThamQuanStore((s) => s.reorderColumns);
  const resetColumns = useDangKyThamQuanStore((s) => s.resetColumns);
  const resetColumnWidths = useDangKyThamQuanStore((s) => s.resetColumnWidths);

  const options = useMemo(() => {
    const dem = (keys: (r: DkTqTomTat) => string[]) => {
      const m = new Map<string, number>();
      data.forEach((r) => keys(r).forEach((k) => m.set(k, (m.get(k) ?? 0) + 1)));
      return m;
    };
    const nam = dem((r) => [r.ngay_dang_ky.slice(0, 4)]);
    const thang = dem((r) => [r.ngay_dang_ky.slice(0, 7)]);
    const tt = dem((r) => [r.trang_thai]);
    const cn = dem((r) => (r.id_chi_nhanh ? [r.id_chi_nhanh] : []));
    const md = dem((r) => r.muc_dich);
    return {
      nam: [...nam.entries()].sort((a, b) => b[0].localeCompare(a[0])).map(([v, count]) => ({ value: v, label: v, count })),
      thang: [...thang.entries()]
        .sort((a, b) => b[0].localeCompare(a[0]))
        .map(([v, count]) => {
          const [y, mo] = v.split('-');
          return { value: v, label: `${mo}/${y}`, count };
        }),
      trang_thai: TRANG_THAI_DKTQ.map((v) => ({ value: v, label: t(`dangKyThamQuan.trangThai.${v}`), count: tt.get(v) ?? 0 })),
      id_chi_nhanh: branches
        .filter((b) => cn.has(b.id))
        .map((b) => ({ value: b.id, label: b.ten_chi_nhanh, subLabel: b.ma_chi_nhanh, count: cn.get(b.id) ?? 0 })),
      muc_dich: MUC_DICH_THAM_QUAN.map((v) => ({ value: v, label: t(`dangKyThamQuan.mucDich.${v}`), count: md.get(v) ?? 0 })),
    };
  }, [data, branches, t]);

  const groups = [
    { key: 'trang_thai', label: t('dangKyThamQuan.col.trangThai'), icon: CircleDot, width: 'sm:w-[150px]' },
    { key: 'nam', label: t('dangKyThamQuan.toolbar.filterNam'), icon: Calendar, width: 'sm:w-[110px]' },
    { key: 'thang', label: t('dangKyThamQuan.toolbar.filterThang'), icon: CalendarDays, width: 'sm:w-[130px]' },
    { key: 'muc_dich', label: t('dangKyThamQuan.col.mucDich'), icon: Target, width: 'sm:w-[160px]' },
    { key: 'id_chi_nhanh', label: t('dangKyThamQuan.col.chiNhanh'), icon: Building2, width: 'sm:w-[170px]' },
  ] as const;

  const filterGroups = groups.map((g) => ({
    key: g.key,
    label: g.label,
    icon: g.icon,
    options: options[g.key],
    value: filters[g.key] ?? [],
    onChange: (v: string[]) => setFilter(g.key, v),
  }));

  const filterItems: FilterChipItem[] = filterGroups.map((g, i) => ({
    kind: 'group',
    group: g,
    className: `w-full ${groups[i].width}`,
  }));

  const activeFilterCount =
    (searchInput.trim() ? 1 : 0) + groups.reduce((s, g) => s + (filters[g.key]?.length ?? 0), 0);

  const handleClearAllFilters = () => {
    commitSearchTerm('');
    groups.forEach((g) => setFilter(g.key, []));
  };

  const renderActions = (
    <>
      <div className="hidden sm:flex items-center gap-2">
        <Tooltip content={t('dangKyThamQuan.toolbar.inPhieuTrang')} placement="bottom">
          <Button
            variant="outline"
            size="sm"
            onClick={onInPhieuTrang}
            className="inline-flex h-9 w-9 p-0 items-center justify-center border-border text-muted-foreground hover:bg-muted/50"
          >
            <FileText className="w-4 h-4" />
          </Button>
        </Tooltip>
        <Tooltip content={t('common.export')} placement="bottom">
          <Button
            variant="outline"
            size="sm"
            onClick={onExport}
            className="inline-flex h-9 w-9 p-0 items-center justify-center border-border text-muted-foreground hover:bg-muted/50"
          >
            <Download className="w-4 h-4" />
          </Button>
        </Tooltip>
      </div>
      {canCreate ? (
        <Button
          onClick={onAdd}
          size="sm"
          className="bg-primary text-white hover:bg-primary/90 shadow-md shadow-primary/20 h-9 px-3 sm:px-4"
        >
          <Plus className="w-5 h-5 sm:w-4 sm:h-4 sm:mr-2" />
          <span className="hidden sm:inline">{t('common.addNew')}</span>
        </Button>
      ) : null}
    </>
  );

  return (
    <GenericToolbar
      selectedCount={selectedCount}
      onDeleteMany={canDelete ? onDeleteMany : undefined}
      searchTerm={searchInput}
      onSearchChange={setSearchInput}
      onClearSelection={clearSelection}
      actions={renderActions}
      filters={<ResponsiveFilterChips items={filterItems} />}
      filterGroups={filterGroups}
      mobileActions={[
        { key: 'in-trang', label: t('dangKyThamQuan.toolbar.inPhieuTrang'), icon: FileText, onClick: onInPhieuTrang, description: '' },
        { key: 'export', label: t('common.export'), icon: Download, onClick: onExport, description: '' },
      ]}
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

export default DangKyThamQuanToolbar;
