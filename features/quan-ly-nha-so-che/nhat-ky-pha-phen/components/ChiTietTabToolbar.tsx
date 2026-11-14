import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Building2, Calendar, CalendarDays, Download } from 'lucide-react';
import Button from '../../../../components/ui/Button';
import Tooltip from '../../../../components/ui/Tooltip';
import GenericToolbar from '../../../../components/shared/GenericToolbar';
import ResponsiveFilterChips, { type FilterChipItem } from '../../../../components/shared/ResponsiveFilterChips';
import type { Branch } from '../../../he-thong/chi-nhanh/core/types';
import type { NkppTomTat } from '../services/nhat-ky-pha-phen-service';
import { useNhatKyPhaPhenChiTietStore } from '../store/useNhatKyPhaPhenChiTietStore';

interface Props {
  /** TÓM TẮT toàn bộ nhật ký — lấy các mốc năm / tháng / NSC đang có dữ liệu. */
  data: NkppTomTat[];
  branches: Branch[];
  selectedCount: number;
  onExport: () => void;
}

/** Tab Chi tiết chỉ xem: lọc năm / tháng / NSC + Xuất. Chip không kèm số đếm (tóm tắt đếm theo phiếu, không theo lần pha). */
const ChiTietTabToolbar: React.FC<Props> = ({ data, branches, selectedCount, onExport }) => {
  const { t } = useTranslation();
  const filters = useNhatKyPhaPhenChiTietStore((s) => s.filters);
  const setFilter = useNhatKyPhaPhenChiTietStore((s) => s.setFilter);
  const clearSelection = useNhatKyPhaPhenChiTietStore((s) => s.clearSelection);
  const columns = useNhatKyPhaPhenChiTietStore((s) => s.columns);
  const toggleColumn = useNhatKyPhaPhenChiTietStore((s) => s.toggleColumn);
  const reorderColumns = useNhatKyPhaPhenChiTietStore((s) => s.reorderColumns);
  const resetColumns = useNhatKyPhaPhenChiTietStore((s) => s.resetColumns);
  const resetColumnWidths = useNhatKyPhaPhenChiTietStore((s) => s.resetColumnWidths);

  const options = useMemo(() => {
    const nam = new Set<string>();
    const thang = new Set<string>();
    const cn = new Set<string>();
    data.forEach((r) => {
      nam.add(r.ngay.slice(0, 4));
      thang.add(r.ngay.slice(0, 7));
      if (r.id_chi_nhanh) cn.add(r.id_chi_nhanh);
    });
    const giam = (s: Set<string>) => [...s].sort((a, b) => b.localeCompare(a));
    return {
      nam: giam(nam).map((v) => ({ value: v, label: v })),
      thang: giam(thang).map((v) => {
        const [y, mo] = v.split('-');
        return { value: v, label: `${mo}/${y}` };
      }),
      id_chi_nhanh: branches
        .filter((b) => cn.has(b.id))
        .map((b) => ({ value: b.id, label: b.ten_chi_nhanh, subLabel: b.ma_chi_nhanh })),
    };
  }, [data, branches]);

  const groups = [
    { key: 'thang', label: t('nkpp.toolbar.filterThang'), icon: CalendarDays, width: 'sm:w-[130px]' },
    { key: 'nam', label: t('nkpp.toolbar.filterNam'), icon: Calendar, width: 'sm:w-[110px]' },
    { key: 'id_chi_nhanh', label: t('nkpp.col.chiNhanh'), icon: Building2, width: 'sm:w-[170px]' },
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

  const activeFilterCount = groups.reduce((s, g) => s + (filters[g.key]?.length ?? 0), 0);

  const renderActions = (
    <div className="hidden sm:flex items-center gap-2">
      <Tooltip content={t('common.export')} placement="bottom">
        <Button
          variant="outline"
          size="sm"
          onClick={onExport}
          aria-label={t('common.export')}
          className="inline-flex h-9 w-9 p-0 items-center justify-center border-border text-muted-foreground hover:bg-muted/50"
        >
          <Download className="w-4 h-4" />
        </Button>
      </Tooltip>
    </div>
  );

  return (
    <GenericToolbar
      selectedCount={selectedCount}
      searchTerm=""
      onSearchChange={() => undefined}
      hideSearch
      onClearSelection={clearSelection}
      actions={renderActions}
      filters={<ResponsiveFilterChips items={filterItems} />}
      filterGroups={filterGroups}
      mobileActions={[{ key: 'export', label: t('common.export'), icon: Download, onClick: onExport, description: '' }]}
      showBack
      activeFilterCount={activeFilterCount}
      onClearAllFilters={() => groups.forEach((g) => setFilter(g.key, []))}
      columns={columns}
      onToggleColumn={toggleColumn}
      onReorderColumns={reorderColumns}
      onResetColumns={resetColumns}
      onResetColumnWidths={resetColumnWidths}
    />
  );
};

export default ChiTietTabToolbar;
