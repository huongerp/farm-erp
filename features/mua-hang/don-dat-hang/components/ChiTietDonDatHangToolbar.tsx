import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Tag, Building2, Warehouse, User, Download } from 'lucide-react';
import Button from '../../../../components/ui/Button';
import Tooltip from '../../../../components/ui/Tooltip';
import GenericToolbar from '../../../../components/shared/GenericToolbar';
import FilterChipMultiSelect from '../../../../components/shared/FilterChipMultiSelect';
import { useSearchInputCommit } from '../../../../lib/hooks/use-search-input-commit';
import { useChiTietDonDatHangStore } from '../store/useChiTietDonDatHangStore';
import type { ChiTietDonDatHangFlat } from '../core/types';
import type { Kho } from '../../../kho-van/danh-sach-kho/core/types';
import type { DoiTacRefLite } from '../../../kho-van/danh-sach-doi-tac/services/doi-tac-service';
import type { EmployeeRef } from '../../../he-thong/nhan-vien/services/nhan-vien-service';
import { TRANG_THAI_DON_DAT_HANG, TRANG_THAI_KEY } from '../core/constants';

interface Props {
  data: ChiTietDonDatHangFlat[];
  supplierList: DoiTacRefLite[];
  khoList: Kho[];
  employees: EmployeeRef[];
  onExport: () => void;
  chipCountsMode?: 'fromRows' | 'unweighted';
}

const ChiTietDonDatHangToolbar: React.FC<Props> = ({
  data,
  supplierList,
  khoList,
  employees,
  onExport,
  chipCountsMode = 'fromRows',
}) => {
  const { t } = useTranslation();
  const unweighted = chipCountsMode === 'unweighted';
  const searchTerm = useChiTietDonDatHangStore((s) => s.searchTerm);
  const commitSearchTerm = useChiTietDonDatHangStore((s) => s.commitSearchTerm);
  const filters = useChiTietDonDatHangStore((s) => s.filters);
  const setFilter = useChiTietDonDatHangStore((s) => s.setFilter);
  const columns = useChiTietDonDatHangStore((s) => s.columns);
  const toggleColumn = useChiTietDonDatHangStore((s) => s.toggleColumn);
  const reorderColumns = useChiTietDonDatHangStore((s) => s.reorderColumns);
  const resetColumns = useChiTietDonDatHangStore((s) => s.resetColumns);

  const { inputValue: searchInput, setInputValue: setSearchInput } = useSearchInputCommit({
    committedTerm: searchTerm,
    commit: commitSearchTerm,
  });

  const statusOptions = useMemo(
    () =>
      TRANG_THAI_DON_DAT_HANG.map((s) => ({
        value: s,
        label: t(`donDatHang.status.${TRANG_THAI_KEY[s]}`),
        count: unweighted ? 1 : data.filter((d) => d.trang_thai === s).length,
      })),
    [data, t, unweighted]
  );

  const supplierOptions = useMemo(
    () =>
      supplierList.map((d) => ({
        value: d.id,
        label: d.ten_ncc,
        count: unweighted ? 1 : data.filter((x) => x.id_nha_cung_cap === d.id).length,
      })),
    [supplierList, data, unweighted]
  );

  const khoOptions = useMemo(
    () =>
      khoList.map((k) => ({
        value: k.id,
        label: k.ten_kho,
        count: unweighted ? 1 : data.filter((x) => x.id_kho_nhan === k.id).length,
      })),
    [khoList, data, unweighted]
  );

  const buyerOptions = useMemo(
    () =>
      employees.map((e) => ({
        value: e.id,
        label: e.ho_ten,
        count: unweighted ? 1 : data.filter((x) => x.id_nguoi_dat === e.id).length,
      })),
    [employees, data, unweighted]
  );

  const activeFilterCount = useMemo(
    () =>
      (searchInput.trim() ? 1 : 0) +
      (filters.status?.length ?? 0) +
      (filters.nhaCungCapIds?.length ?? 0) +
      (filters.khoNhanIds?.length ?? 0) +
      (filters.nguoiDatIds?.length ?? 0),
    [searchInput, filters.status, filters.nhaCungCapIds, filters.khoNhanIds, filters.nguoiDatIds]
  );

  const handleClearAllFilters = () => {
    commitSearchTerm('');
    setFilter('status', []);
    setFilter('nhaCungCapIds', []);
    setFilter('khoNhanIds', []);
    setFilter('nguoiDatIds', []);
  };

  const filterGroups = useMemo(
    () => [
      {
        key: 'status',
        label: t('common.status'),
        icon: Tag,
        options: statusOptions,
        value: filters.status ?? [],
        onChange: (val: string[]) => setFilter('status', val),
      },
      {
        key: 'nhaCungCapIds',
        label: t('donDatHang.form.supplier'),
        icon: Building2,
        options: supplierOptions,
        value: filters.nhaCungCapIds ?? [],
        onChange: (val: string[]) => setFilter('nhaCungCapIds', val),
      },
      {
        key: 'khoNhanIds',
        label: t('donDatHang.form.warehouse'),
        icon: Warehouse,
        options: khoOptions,
        value: filters.khoNhanIds ?? [],
        onChange: (val: string[]) => setFilter('khoNhanIds', val),
      },
      {
        key: 'nguoiDatIds',
        label: t('donDatHang.form.buyer'),
        icon: User,
        options: buyerOptions,
        value: filters.nguoiDatIds ?? [],
        onChange: (val: string[]) => setFilter('nguoiDatIds', val),
      },
    ],
    [
      t,
      statusOptions,
      supplierOptions,
      khoOptions,
      buyerOptions,
      filters.status,
      filters.nhaCungCapIds,
      filters.khoNhanIds,
      filters.nguoiDatIds,
      setFilter,
    ]
  );

  const renderFilters = (
    <>
      <FilterChipMultiSelect
        options={statusOptions}
        value={filters.status ?? []}
        onChange={(v) => setFilter('status', v)}
        placeholder={t('common.status')}
        icon={Tag}
        className="w-full sm:w-[140px]"
      />
      <FilterChipMultiSelect
        options={supplierOptions}
        value={filters.nhaCungCapIds ?? []}
        onChange={(v) => setFilter('nhaCungCapIds', v)}
        placeholder={t('donDatHang.form.supplier')}
        icon={Building2}
        className="w-full sm:w-[160px]"
      />
      <FilterChipMultiSelect
        options={khoOptions}
        value={filters.khoNhanIds ?? []}
        onChange={(v) => setFilter('khoNhanIds', v)}
        placeholder={t('donDatHang.form.warehouse')}
        icon={Warehouse}
        className="w-full sm:w-[160px]"
      />
      <FilterChipMultiSelect
        options={buyerOptions}
        value={filters.nguoiDatIds ?? []}
        onChange={(v) => setFilter('nguoiDatIds', v)}
        placeholder={t('donDatHang.form.buyer')}
        icon={User}
        className="w-full sm:w-[160px]"
      />
    </>
  );

  const mobileActions = useMemo(
    () => [
      {
        key: 'export',
        label: t('common.export'),
        icon: Download,
        onClick: onExport,
        description: '',
      },
    ],
    [onExport, t]
  );

  const renderActions = (
    <div className="hidden sm:flex items-center gap-2">
      <Tooltip content={t('common.export')} placement="bottom">
        <Button
          variant="outline"
          size="sm"
          onClick={onExport}
          className="inline-flex min-h-[44px] min-w-[44px] md:min-h-0 md:min-w-0 h-9 w-9 p-0 items-center justify-center border-border text-muted-foreground hover:bg-muted/50"
        >
          <Download className="w-4 h-4" />
        </Button>
      </Tooltip>
    </div>
  );

  return (
    <GenericToolbar
      selectedCount={0}
      searchTerm={searchInput}
      onSearchChange={setSearchInput}
      onClearSelection={() => {}}
      actions={renderActions}
      filters={renderFilters}
      filterGroups={filterGroups}
      mobileActions={mobileActions}
      showBack
      searchPlaceholder={t('donDatHang.chiTietTab.searchPlaceholder')}
      activeFilterCount={activeFilterCount}
      onClearAllFilters={handleClearAllFilters}
      columns={columns}
      onToggleColumn={toggleColumn}
      onReorderColumns={reorderColumns}
      onResetColumns={resetColumns}
    />
  );
};

export default ChiTietDonDatHangToolbar;
