import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { MapPin, Printer, Tags } from 'lucide-react';
import GenericToolbar from '../../../../components/shared/GenericToolbar';
import Button from '../../../../components/ui/Button';
import ResponsiveFilterChips, { type FilterChipItem } from '../../../../components/shared/ResponsiveFilterChips';
import FilterChipSingleSelect from '../../../../components/shared/FilterChipSingleSelect';
import { useGenericToolbarSearch } from '../../../../lib/hooks/use-generic-toolbar-search';
import { cn } from '../../../../lib/utils';
import { useLichStore } from '../store/useBaoDuongThietBiStore';

export type TinhTrangLoc = 'tat_ca' | 'qua_han' | 'sap_toi';

interface Props {
  counts: { tatCa: number; quaHan: number; sapToi: number };
  khuVucOptions: { value: string; label: string; count?: number }[];
  tinhTrang: TinhTrangLoc;
  onTinhTrangChange: (v: TinhTrangLoc) => void;
  khuVuc: string | null;
  onKhuVucChange: (v: string | null) => void;
  selectedCount: number;
  onPrint?: () => void;
}

const LichBaoDuongToolbar: React.FC<Props> = ({
  counts,
  khuVucOptions,
  tinhTrang,
  onTinhTrangChange,
  khuVuc,
  onKhuVucChange,
  selectedCount,
  onPrint,
}) => {
  const { t } = useTranslation();
  const { searchInput, setSearchInput } = useGenericToolbarSearch(useLichStore);
  const clearSelection = useLichStore((s) => s.clearSelection);
  const columns = useLichStore((s) => s.columns);
  const toggleColumn = useLichStore((s) => s.toggleColumn);
  const reorderColumns = useLichStore((s) => s.reorderColumns);
  const resetColumns = useLichStore((s) => s.resetColumns);
  const resetColumnWidths = useLichStore((s) => s.resetColumnWidths);

  const tinhTrangItems: { value: TinhTrangLoc; label: string; count: number }[] = useMemo(
    () => [
      { value: 'tat_ca', label: t('baoDuongThietBi.filter.tatCa'), count: counts.tatCa },
      { value: 'qua_han', label: t('baoDuongThietBi.filter.quaHan'), count: counts.quaHan },
      { value: 'sap_toi', label: t('baoDuongThietBi.filter.sapToi'), count: counts.sapToi },
    ],
    [t, counts]
  );

  const filterGroups = [
    {
      key: 'tinh_trang',
      label: t('baoDuongThietBi.col.tinhTrang'),
      icon: Tags,
      options: tinhTrangItems
        .filter((x) => x.value !== 'tat_ca')
        .map((x) => ({ value: x.value, label: x.label, count: x.count })),
      value: tinhTrang === 'tat_ca' ? [] : [tinhTrang],
      onChange: (v: string[]) => onTinhTrangChange(v.length > 0 ? (v[v.length - 1] as TinhTrangLoc) : 'tat_ca'),
    },
    {
      key: 'khu_vuc',
      label: t('baoDuongThietBi.col.khuVuc'),
      icon: MapPin,
      options: khuVucOptions,
      value: khuVuc ? [khuVuc] : [],
      onChange: (v: string[]) => onKhuVucChange(v.length > 0 ? v[v.length - 1] : null),
    },
  ];

  const filterItems: FilterChipItem[] = [
    {
      kind: 'custom',
      key: 'tinh_trang',
      node: (
        <div className="inline-flex items-center gap-1 rounded-lg border border-border bg-muted/40 p-0.5">
          {tinhTrangItems.map((it) => {
            const active = tinhTrang === it.value;
            return (
              <button
                key={it.value}
                type="button"
                onClick={() => onTinhTrangChange(it.value)}
                className={cn(
                  'inline-flex h-7 items-center gap-1.5 rounded-md px-2.5 text-xs font-medium transition-all active:scale-95',
                  active ? 'bg-card text-primary shadow-sm border border-border' : 'text-muted-foreground hover:text-foreground'
                )}
              >
                {it.label}
                <span className={cn('tabular-nums', active ? 'text-primary' : 'text-muted-foreground')}>{it.count}</span>
              </button>
            );
          })}
        </div>
      ),
    },
    {
      kind: 'custom',
      key: 'khu_vuc',
      node: (
        <FilterChipSingleSelect
          options={khuVucOptions}
          value={khuVuc}
          onChange={onKhuVucChange}
          placeholder={t('baoDuongThietBi.filter.tatCaKhuVuc')}
          icon={MapPin}
          className="w-full sm:w-[170px]"
        />
      ),
    },
  ];

  const activeFilterCount = (tinhTrang !== 'tat_ca' ? 1 : 0) + (khuVuc ? 1 : 0);

  const clearAllFilters = () => {
    onTinhTrangChange('tat_ca');
    onKhuVucChange(null);
  };

  return (
    <GenericToolbar
      selectedCount={selectedCount}
      searchTerm={searchInput}
      onSearchChange={setSearchInput}
      onClearSelection={clearSelection}
      actions={
        onPrint ? (
          <Button size="sm" variant="outline" onClick={onPrint}>
            <Printer size={15} className="mr-1.5" />
            <span className="hidden md:inline">{t('baoDuongThietBi.hanhDong.inLich')}</span>
          </Button>
        ) : undefined
      }
      filters={<ResponsiveFilterChips items={filterItems} />}
      filterGroups={filterGroups}
      activeFilterCount={activeFilterCount}
      onClearAllFilters={clearAllFilters}
      columns={columns}
      onToggleColumn={toggleColumn}
      onReorderColumns={reorderColumns}
      onResetColumns={resetColumns}
      onResetColumnWidths={resetColumnWidths}
      showBack
    />
  );
};

export default LichBaoDuongToolbar;
