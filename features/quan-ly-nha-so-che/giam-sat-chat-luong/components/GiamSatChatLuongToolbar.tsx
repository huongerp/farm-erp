import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { AlertTriangle, BadgeCheck, Building2, Calendar, CircleDot, Package, Plus, ScanLine, Settings } from 'lucide-react';
import Button from '../../../../components/ui/Button';
import Tooltip from '../../../../components/ui/Tooltip';
import DateRangePicker from '../../../../components/ui/DateRangePicker';
import { MobileFilterField } from '../../../../components/ui/MobileFilterSheet';
import GenericToolbar from '../../../../components/shared/GenericToolbar';
import ResponsiveFilterChips, { type FilterChipItem } from '../../../../components/shared/ResponsiveFilterChips';
import { useGenericToolbarSearch } from '../../../../lib/hooks/use-generic-toolbar-search';
import type { Branch } from '../../../he-thong/chi-nhanh/core/types';
import { CO_LOI_GSCL, KET_LUAN_GSCL, TRANG_THAI_GSCL } from '../core/types';
import { KY_CUSTOM } from '../core/ky-loc';
import { useKyChip } from '../hooks/use-ky-chip';
import type { GsclTomTat } from '../services/giam-sat-chat-luong-service';
import { useGiamSatChatLuongStore } from '../store/useGiamSatChatLuongStore';

interface Props {
  /** TÓM TẮT toàn bộ phiếu — chip lọc đếm trên toàn bộ dữ liệu, không phải trang đang xem. */
  data: GsclTomTat[];
  branches: Branch[];
  /** id → tên thành phẩm (danh mục hàng hoá). */
  tenHangHoa: Map<string, string>;
  selectedCount: number;
  onAdd: () => void;
  onDeleteMany: () => void;
  onScan: () => void;
  onSettings: () => void;
  canCreate?: boolean;
  canDelete?: boolean;
  canScan?: boolean;
}

const GiamSatChatLuongToolbar: React.FC<Props> = ({
  data,
  branches,
  tenHangHoa,
  selectedCount,
  onAdd,
  onDeleteMany,
  onScan,
  onSettings,
  canCreate = true,
  canDelete = true,
  canScan = true,
}) => {
  const { t } = useTranslation();
  const { searchInput, setSearchInput, commitSearchTerm } = useGenericToolbarSearch(useGiamSatChatLuongStore);
  const filters = useGiamSatChatLuongStore((s) => s.filters);
  const setFilter = useGiamSatChatLuongStore((s) => s.setFilter);
  const clearSelection = useGiamSatChatLuongStore((s) => s.clearSelection);
  const columns = useGiamSatChatLuongStore((s) => s.columns);
  const toggleColumn = useGiamSatChatLuongStore((s) => s.toggleColumn);
  const reorderColumns = useGiamSatChatLuongStore((s) => s.reorderColumns);
  const resetColumns = useGiamSatChatLuongStore((s) => s.resetColumns);
  const resetColumnWidths = useGiamSatChatLuongStore((s) => s.resetColumnWidths);

  const options = useMemo(() => {
    const dem = (keyOf: (r: GsclTomTat) => string | null) => {
      const m = new Map<string, number>();
      data.forEach((r) => {
        const k = keyOf(r);
        if (k != null) m.set(k, (m.get(k) ?? 0) + 1);
      });
      return m;
    };
    const tt = dem((r) => r.trang_thai);
    const kl = dem((r) => r.ket_luan);
    const loi = dem((r) => r.co_loi);
    const cn = dem((r) => r.id_chi_nhanh);
    const hh = dem((r) => r.id_hang_hoa);
    return {
      trang_thai: TRANG_THAI_GSCL.map((v) => ({ value: v, label: t(`giamSatChatLuong.trangThai.${v}`), count: tt.get(v) ?? 0 })),
      ket_luan: KET_LUAN_GSCL.map((v) => ({ value: v, label: t(`giamSatChatLuong.ketLuan.${v}`), count: kl.get(v) ?? 0 })),
      co_loi: CO_LOI_GSCL.map((v) => ({ value: v, label: t(`giamSatChatLuong.coLoi.${v}`), count: loi.get(v) ?? 0 })),
      id_chi_nhanh: branches
        .filter((b) => cn.has(b.id))
        .map((b) => ({ value: b.id, label: b.ten_chi_nhanh, subLabel: b.ma_chi_nhanh, count: cn.get(b.id) ?? 0 })),
      id_hang_hoa: [...hh.entries()]
        .map(([v, count]) => ({ value: v, label: tenHangHoa.get(v) ?? `#${v}`, count }))
        .sort((a, b) => a.label.localeCompare(b.label, 'vi')),
    };
  }, [data, branches, tenHangHoa, t]);

  const groups = [
    { key: 'trang_thai', label: t('giamSatChatLuong.col.trangThai'), icon: CircleDot, width: 'sm:w-[140px]' },
    { key: 'ket_luan', label: t('giamSatChatLuong.col.ketLuan'), icon: BadgeCheck, width: 'sm:w-[130px]' },
    { key: 'co_loi', label: t('giamSatChatLuong.col.loi'), icon: AlertTriangle, width: 'sm:w-[120px]' },
    { key: 'id_chi_nhanh', label: t('giamSatChatLuong.col.farm'), icon: Building2, width: 'sm:w-[160px]' },
    { key: 'id_hang_hoa', label: t('giamSatChatLuong.col.thanhPham'), icon: Package, width: 'sm:w-[170px]' },
  ] as const;

  const kyChip = useKyChip(filters.dateFrom, filters.dateTo, (from, to) => {
    setFilter('dateFrom', from);
    setFilter('dateTo', to);
  });
  const coKy = !!(filters.dateFrom || filters.dateTo);

  const activeFilterCount =
    (searchInput.trim() ? 1 : 0) + (coKy ? 1 : 0) + groups.reduce((n, g) => n + (filters[g.key]?.length ?? 0), 0);

  const handleClearAllFilters = () => {
    commitSearchTerm('');
    setFilter('dateFrom', '');
    setFilter('dateTo', '');
    groups.forEach((g) => setFilter(g.key, []));
  };

  const filterGroups = groups.map((g) => ({
    key: g.key,
    label: g.label,
    icon: g.icon,
    options: options[g.key],
    value: filters[g.key] ?? [],
    onChange: (v: string[]) => setFilter(g.key, v),
  }));

  const filterItems: FilterChipItem[] = [
    {
      kind: 'custom',
      key: 'ky',
      node: (
        <DateRangePicker
          presets={kyChip.presets}
          value={kyChip.value}
          onChange={kyChip.onChange}
          placeholder={t('giamSatChatLuong.toolbar.filterThoiGian')}
          customPresetId={KY_CUSTOM}
          className="w-full sm:w-auto shrink-0"
        />
      ),
    },
    ...filterGroups.map(
      (g, i): FilterChipItem => ({ kind: 'group', group: g, className: `w-full ${groups[i].width}` })
    ),
  ];

  // Điện thoại không có hàng chip → chip thời gian hiện thẳng trong bảng lọc.
  const mobileFilterExtra = (
    <MobileFilterField label={t('giamSatChatLuong.toolbar.filterThoiGian')} icon={Calendar} active={coKy}>
      <DateRangePicker
        inline
        presets={kyChip.presets}
        value={kyChip.value}
        onChange={kyChip.onChange}
        customPresetId={KY_CUSTOM}
      />
    </MobileFilterField>
  );

  const iconBtn = 'h-8 w-8 flex items-center justify-center border rounded-lg transition-all bg-background border-border text-muted-foreground hover:bg-muted hover:text-foreground';

  const leading = (
    <Tooltip content={t('giamSatChatLuong.caiDat.title')} placement="bottom">
      <button type="button" onClick={onSettings} className={iconBtn} aria-label={t('giamSatChatLuong.caiDat.title')}>
        <Settings size={15} />
      </button>
    </Tooltip>
  );

  const renderActions = (
    <>
      {canScan && (
        <Tooltip content={t('giamSatChatLuong.toolbar.quetTem')} placement="bottom">
          <Button
            variant="outline"
            size="sm"
            onClick={onScan}
            className="hidden sm:inline-flex h-9 w-9 lg:w-auto p-0 lg:px-3 items-center justify-center gap-1.5 border-border"
          >
            <ScanLine className="w-4 h-4" />
            <span className="hidden lg:inline">{t('giamSatChatLuong.toolbar.quetTem')}</span>
          </Button>
        </Tooltip>
      )}
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

  const mobileActions = [
    ...(canScan
      ? [{ key: 'scan', label: t('giamSatChatLuong.toolbar.quetTem'), icon: ScanLine, onClick: onScan, description: '' }]
      : []),
    { key: 'settings', label: t('giamSatChatLuong.caiDat.title'), icon: Settings, onClick: onSettings, description: '' },
  ];

  return (
    <GenericToolbar
      selectedCount={selectedCount}
      onDeleteMany={canDelete ? onDeleteMany : undefined}
      searchTerm={searchInput}
      onSearchChange={setSearchInput}
      onClearSelection={clearSelection}
      leadingActions={leading}
      actions={renderActions}
      filters={<ResponsiveFilterChips items={filterItems} />}
      filterGroups={filterGroups}
      mobileFilterExtra={mobileFilterExtra}
      mobileFilterExtraCount={coKy ? 1 : 0}
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

export default GiamSatChatLuongToolbar;
