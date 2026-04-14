import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { User, UserCheck, Calendar, Warehouse, Tag } from 'lucide-react';
import { toast } from 'sonner';
import { usePhieuDeXuatVatTuList } from '../hooks/use-phieu-de-xuat-vat-tu';
import { usePhieuDeXuatVatTuViewScope } from '../hooks/use-phieu-de-xuat-vat-tu-view-scope';
import { filterPhieuDeXuatListByViewScope } from '../utils/phieu-de-xuat-view-scope-filter';
import { useEmployeesRefQuery } from '../../../../lib/hooks/use-supabase-ref-queries';
import { useKhoList } from '../../danh-sach-kho/hooks/use-kho';
import LoadingSpinnerWithText from '../../../../components/shared/LoadingSpinnerWithText';
import EmptyState from '../../../../components/shared/EmptyState';
import FilterChipMultiSelect from '../../../../components/shared/FilterChipMultiSelect';
import { usePhieuDeXuatVatTuStats } from './stats/usePhieuDeXuatVatTuStats';
import StatsToolbar from './stats/StatsToolbar';
import StatsCards from './stats/StatsCards';
import StatsCharts from './stats/StatsCharts';
import StatsTables from './stats/StatsTables';
import type { PhieuDeXuatVatTu } from '../core/types';
import { trangThaiToFilterKey } from '../core/constants';

const ThongKeTab: React.FC = () => {
  const { t } = useTranslation();
  const { data: list = [], isLoading, isError } = usePhieuDeXuatVatTuList();
  const { data: employees = [] } = useEmployeesRefQuery();
  const { data: khoList = [] } = useKhoList();
  const viewScope = usePhieuDeXuatVatTuViewScope();

  const viewableList = useMemo(
    () => filterPhieuDeXuatListByViewScope(list, khoList, viewScope),
    [list, khoList, viewScope]
  );

  const statusCounts = useMemo(() => {
    const m: Record<string, number> = {};
    viewableList.forEach((d) => {
      const key = trangThaiToFilterKey(d.trang_thai);
      m[key] = (m[key] ?? 0) + 1;
    });
    return m;
  }, [viewableList]);
  const noiDeXuatCounts = useMemo(() => {
    const m: Record<string, number> = {};
    viewableList.forEach((d) => {
      m[d.id_noi_de_xuat] = (m[d.id_noi_de_xuat] ?? 0) + 1;
    });
    return m;
  }, [viewableList]);
  const nguoiDeXuatCounts = useMemo(() => {
    const m: Record<string, number> = {};
    viewableList.forEach((d) => {
      m[d.id_nguoi_de_xuat] = (m[d.id_nguoi_de_xuat] ?? 0) + 1;
    });
    return m;
  }, [viewableList]);
  const nguoiDuyetCounts = useMemo(() => {
    const m: Record<string, number> = {};
    viewableList.forEach((d) => {
      if (d.id_nguoi_duyet) m[d.id_nguoi_duyet] = (m[d.id_nguoi_duyet] ?? 0) + 1;
    });
    return m;
  }, [viewableList]);

  const [filterStatus, setFilterStatus] = useState<string[]>([]);
  const [filterNoiDeXuat, setFilterNoiDeXuat] = useState<string[]>([]);
  const [filterNguoiDeXuat, setFilterNguoiDeXuat] = useState<string[]>([]);
  const [filterNguoiDuyet, setFilterNguoiDuyet] = useState<string[]>([]);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const filteredList = useMemo(() => {
    return viewableList.filter((d: PhieuDeXuatVatTu) => {
      const statusKey = trangThaiToFilterKey(d.trang_thai);
      const matchStatus = filterStatus.length === 0 || filterStatus.includes(statusKey);
      const matchNoiDeXuat = filterNoiDeXuat.length === 0 || filterNoiDeXuat.includes(d.id_noi_de_xuat);
      const matchNguoiDeXuat = filterNguoiDeXuat.length === 0 || filterNguoiDeXuat.includes(d.id_nguoi_de_xuat);
      const matchNguoiDuyet =
        filterNguoiDuyet.length === 0 ||
        (d.id_nguoi_duyet != null && filterNguoiDuyet.includes(d.id_nguoi_duyet));
      const matchFrom = !dateFrom || (d.ngay && d.ngay >= dateFrom);
      const matchTo = !dateTo || (d.ngay && d.ngay <= dateTo);
      return matchStatus && matchNoiDeXuat && matchNguoiDeXuat && matchNguoiDuyet && matchFrom && matchTo;
    });
  }, [viewableList, filterStatus, filterNoiDeXuat, filterNguoiDeXuat, filterNguoiDuyet, dateFrom, dateTo]);

  const stats = usePhieuDeXuatVatTuStats(filteredList);

  const statusOptions = useMemo(
    () => [
      { label: t('phieuDeXuatVatTu.status.pending'), value: 'Pending', subLabel: undefined as string | undefined, count: statusCounts['Pending'] ?? 0 },
      { label: t('phieuDeXuatVatTu.status.approved'), value: 'Approved', subLabel: undefined, count: statusCounts['Approved'] ?? 0 },
      { label: t('phieuDeXuatVatTu.status.rejected'), value: 'Rejected', subLabel: undefined, count: statusCounts['Rejected'] ?? 0 },
    ],
    [t, statusCounts]
  );
  const noiDeXuatOptions = useMemo(
    () =>
      khoList.map((k) => ({
        label: k.ten_kho,
        value: k.id,
        subLabel: k.ma_kho,
        count: noiDeXuatCounts[k.id] ?? 0,
      })),
    [khoList, noiDeXuatCounts]
  );
  const nguoiDeXuatOptions = useMemo(
    () =>
      employees.map((e) => ({
        label: e.ho_ten,
        value: e.id,
        subLabel: e.ma_nhan_vien,
        count: nguoiDeXuatCounts[e.id] ?? 0,
      })),
    [employees, nguoiDeXuatCounts]
  );
  const nguoiDuyetOptions = useMemo(
    () =>
      employees.map((e) => ({
        label: e.ho_ten,
        value: e.id,
        subLabel: e.ma_nhan_vien,
        count: nguoiDuyetCounts[e.id] ?? 0,
      })),
    [employees, nguoiDuyetCounts]
  );

  const activeFilterCount =
    filterStatus.length +
    filterNoiDeXuat.length +
    filterNguoiDeXuat.length +
    filterNguoiDuyet.length +
    (dateFrom ? 1 : 0) +
    (dateTo ? 1 : 0);
  const handleClearFilters = () => {
    setFilterStatus([]);
    setFilterNoiDeXuat([]);
    setFilterNguoiDeXuat([]);
    setFilterNguoiDuyet([]);
    setDateFrom('');
    setDateTo('');
  };

  const filterGroups = useMemo(
    () => [
      { key: 'status', label: t('common.status'), icon: Tag, options: statusOptions, value: filterStatus, onChange: setFilterStatus },
      { key: 'noiDeXuat', label: t('phieuDeXuatVatTu.form.place'), icon: Warehouse, options: noiDeXuatOptions, value: filterNoiDeXuat, onChange: setFilterNoiDeXuat },
      { key: 'nguoiDeXuat', label: t('phieuDeXuatVatTu.form.requester'), icon: User, options: nguoiDeXuatOptions, value: filterNguoiDeXuat, onChange: setFilterNguoiDeXuat },
      { key: 'nguoiDuyet', label: t('phieuDeXuatVatTu.form.approver'), icon: UserCheck, options: nguoiDuyetOptions, value: filterNguoiDuyet, onChange: setFilterNguoiDuyet },
    ],
    [t, statusOptions, noiDeXuatOptions, nguoiDeXuatOptions, nguoiDuyetOptions, filterStatus, filterNoiDeXuat, filterNguoiDeXuat, filterNguoiDuyet]
  );

  const renderFilters = (
    <>
      <FilterChipMultiSelect
        options={statusOptions}
        value={filterStatus}
        onChange={setFilterStatus}
        placeholder={t('common.status')}
        icon={Tag}
        className="w-full sm:w-[160px]"
        size="md"
      />
      <div className="relative w-full sm:w-[140px]">
        <Calendar className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
        <input
          type="date"
          value={dateFrom}
          onChange={(e) => setDateFrom(e.target.value)}
          className="w-full h-9 pl-8 pr-2 bg-muted/40 border border-border/60 rounded-lg text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40"
          placeholder={t('phieuDeXuatVatTu.stats.dateFrom')}
        />
      </div>
      <div className="relative w-full sm:w-[140px]">
        <Calendar className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
        <input
          type="date"
          value={dateTo}
          onChange={(e) => setDateTo(e.target.value)}
          className="w-full h-9 pl-8 pr-2 bg-muted/40 border border-border/60 rounded-lg text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40"
          placeholder={t('phieuDeXuatVatTu.stats.dateTo')}
        />
      </div>
      <FilterChipMultiSelect
        options={noiDeXuatOptions}
        value={filterNoiDeXuat}
        onChange={setFilterNoiDeXuat}
        placeholder={t('phieuDeXuatVatTu.form.place')}
        icon={Warehouse}
        className="w-full sm:w-[160px]"
        size="md"
      />
      <FilterChipMultiSelect
        options={nguoiDeXuatOptions}
        value={filterNguoiDeXuat}
        onChange={setFilterNguoiDeXuat}
        placeholder={t('phieuDeXuatVatTu.form.requester')}
        icon={User}
        className="w-full sm:w-[180px]"
        size="md"
      />
      <FilterChipMultiSelect
        options={nguoiDuyetOptions}
        value={filterNguoiDuyet}
        onChange={setFilterNguoiDuyet}
        placeholder={t('phieuDeXuatVatTu.form.approver')}
        icon={UserCheck}
        className="w-full sm:w-[180px]"
        size="md"
      />
    </>
  );

  const handleExportReport = () => {
    toast.info(t('phieuDeXuatVatTu.stats.exportReport') + ' – Đang phát triển');
  };

  const handlePrintReport = () => {
    window.print();
  };

  if (isError) {
    return (
      <div className="flex-1 flex items-center justify-center p-4">
        <p className="text-sm text-destructive">{t('phieuDeXuatVatTu.stats.loadError')}</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex flex-col h-full">
        <div className="shrink-0 py-3 px-3 sm:px-4 border-b border-border/50 bg-muted/20">
          <LoadingSpinnerWithText text={t('phieuDeXuatVatTu.stats.loading')} centered />
        </div>
        <div className="flex-1 p-3 sm:p-4 space-y-3">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-card rounded-lg border border-border p-2.5 animate-pulse">
                <div className="h-12 bg-muted/60 rounded" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const isEmpty = filteredList.length === 0;

  return (
    <div className="flex flex-col h-full">
      <StatsToolbar
        className="static z-auto"
        filters={renderFilters}
        filterGroups={filterGroups}
        activeFilterCount={activeFilterCount}
        onClearFilters={handleClearFilters}
        onExportReport={handleExportReport}
        onPrintReport={handlePrintReport}
      />

      <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar">
        <div className="p-3 sm:p-4 pb-4 space-y-4">
          {isEmpty ? (
            <EmptyState
              title={t('phieuDeXuatVatTu.stats.noData')}
              description={
                activeFilterCount > 0
                  ? (t('phieuDeXuatVatTu.stats.noDataHint') || 'Thử xóa bộ lọc.')
                  : t('phieuDeXuatVatTu.stats.noDataHint')
              }
              action={
                activeFilterCount > 0 ? (
                  <button
                    type="button"
                    onClick={handleClearFilters}
                    className="text-sm font-medium text-primary hover:underline"
                  >
                    {t('common.clearFilters', { count: activeFilterCount })}
                  </button>
                ) : undefined
              }
            />
          ) : (
            <>
              <h3 className="text-sm font-semibold text-primary">{t('phieuDeXuatVatTu.stats.title')}</h3>
              <StatsCards summary={stats.summary} />
              <StatsCharts
                byTrangThai={stats.byTrangThai}
                byNoiDeXuat={stats.byNoiDeXuat}
                byNguoiDeXuat={stats.byNguoiDeXuat}
                byNguoiDuyet={stats.byNguoiDuyet}
                byMonth={stats.byMonth}
              />
              <StatsTables
                byTrangThai={stats.byTrangThai}
                byNoiDeXuat={stats.byNoiDeXuat}
                byNguoiDeXuat={stats.byNguoiDeXuat}
                byNguoiDuyet={stats.byNguoiDuyet}
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ThongKeTab;
