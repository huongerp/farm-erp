import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Building2, Calendar, Download, Hash, Plus, Settings, ToggleLeft, Upload } from 'lucide-react';
import Button from '../../../../components/ui/Button';
import Tooltip from '../../../../components/ui/Tooltip';
import DateRangePicker, { type DateRangeValue } from '../../../../components/ui/DateRangePicker';
import { MobileFilterField } from '../../../../components/ui/MobileFilterSheet';
import GenericToolbar from '../../../../components/shared/GenericToolbar';
import ResponsiveFilterChips, { type FilterChipItem } from '../../../../components/shared/ResponsiveFilterChips';
import { useGenericToolbarSearch } from '../../../../lib/hooks/use-generic-toolbar-search';
import { getDateRangeFromPreset, getPresetFromDates } from '../../../../lib/date-presets';
import type { Branch } from '../../../he-thong/chi-nhanh/core/types';
import type { DgdvTomTat } from '../services/danh-gia-dau-vao-db.service';
import { useDanhGiaDauVaoStore } from '../store/useDanhGiaDauVaoStore';
import { khoaTuanFarm, nhanTuanFarm } from '../core/tuan';

const KY_CUSTOM = 'custom';
/** Tuần ở preset = T2–CN, trùng tuần farm. */
const KY_PRESET_IDS = ['all', 'thisWeek', 'lastWeek', 'thisMonth', 'lastMonth', KY_CUSTOM] as const;

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
  const resetFilters = useDanhGiaDauVaoStore((s) => s.resetFilters);
  const clearSelection = useDanhGiaDauVaoStore((s) => s.clearSelection);
  const columns = useDanhGiaDauVaoStore((s) => s.columns);
  const toggleColumn = useDanhGiaDauVaoStore((s) => s.toggleColumn);
  const reorderColumns = useDanhGiaDauVaoStore((s) => s.reorderColumns);
  const resetColumns = useDanhGiaDauVaoStore((s) => s.resetColumns);
  const resetColumnWidths = useDanhGiaDauVaoStore((s) => s.resetColumnWidths);

  // Preset giữ ở state cục bộ (như ky-loc-chip của Bảo trì): suy ngược từ ngày thì bấm «Tuỳ chọn» lúc
  // chưa có ngày sẽ bị hiểu thành «Tất cả» và ô chọn khoảng biến mất.
  const [preset, setPreset] = useState(() => getPresetFromDates(filters.tu_ngay, filters.den_ngay));
  const kyPresets = useMemo(() => KY_PRESET_IDS.map((id) => ({ id, label: t(`danhGiaDauVao.toolbar.preset.${id}`) })), [t]);
  const coKy = !!(filters.tu_ngay || filters.den_ngay);
  const kyValue = useMemo(
    () => ({ preset: !coKy && preset !== KY_CUSTOM ? 'all' : preset, customStart: filters.tu_ngay, customEnd: filters.den_ngay }),
    [coKy, preset, filters.tu_ngay, filters.den_ngay]
  );
  const onKyChange = (v: DateRangeValue) => {
    setPreset(v.preset);
    const r = v.preset === KY_CUSTOM ? { dateFrom: v.customStart, dateTo: v.customEnd } : getDateRangeFromPreset(v.preset);
    setFilter('tu_ngay', r.dateFrom);
    setFilter('den_ngay', r.dateTo);
  };

  const filterGroups = useMemo(() => {
    const dem = (fn: (d: DgdvTomTat) => boolean) => data.filter(fn).length;
    const tuanSet = new Map<string, { nam: number; tuan: number }>();
    for (const d of data) tuanSet.set(khoaTuanFarm(d), { nam: d.nam, tuan: d.tuan });
    const dsTuan = [...tuanSet.entries()].sort((a, b) => b[0].localeCompare(a[0]));
    const nhieuNam = new Set(data.map((d) => d.nam)).size > 1;
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
        key: 'tuan_farm',
        label: t('danhGiaDauVao.toolbar.filterTuan'),
        icon: Hash,
        options: dsTuan.map(([k, tf]) => ({
          value: k,
          label: nhanTuanFarm(tf),
          subLabel: nhieuNam ? String(tf.nam) : undefined,
          count: dem((d) => d.nam === tf.nam && d.tuan === tf.tuan),
        })),
        value: filters.tuan_farm ?? [],
        onChange: (v: string[]) => setFilter('tuan_farm', v),
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
  }, [t, data, branches, filters.id_chi_nhanh, filters.tuan_farm, filters.trang_thai, setFilter]);

  const kyPicker = (inline: boolean) => (
    <DateRangePicker
      inline={inline}
      presets={kyPresets}
      value={kyValue}
      onChange={onKyChange}
      placeholder={inline ? undefined : t('danhGiaDauVao.toolbar.filterNgay')}
      customPresetId={KY_CUSTOM}
      className={inline ? undefined : 'w-full sm:w-auto shrink-0'}
    />
  );
  const filterItems: FilterChipItem[] = [
    { kind: 'custom', key: 'ky', node: kyPicker(false) },
    { kind: 'group', group: filterGroups[1], className: 'w-full sm:w-[200px]' },
    { kind: 'group', group: filterGroups[0], className: 'w-full sm:w-[200px]' },
    { kind: 'group', group: filterGroups[2], className: 'w-full sm:w-[140px]' },
  ];
  // Điện thoại không có hàng chip → chọn khoảng ngày hiện thẳng trong bảng lọc.
  const mobileFilterExtra = (
    <MobileFilterField label={t('danhGiaDauVao.toolbar.filterNgay')} icon={Calendar} active={coKy}>
      {kyPicker(true)}
    </MobileFilterField>
  );

  const activeFilterCount =
    (searchInput.trim() ? 1 : 0) +
    (filters.id_chi_nhanh?.length ?? 0) +
    (filters.tuan_farm?.length ?? 0) +
    (filters.trang_thai?.length ?? 0) +
    (coKy ? 1 : 0);

  const handleClearAllFilters = () => {
    commitSearchTerm('');
    setPreset('all');
    resetFilters();
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

export default DgdvToolbar;
