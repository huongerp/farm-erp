import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Briefcase, Tag, Share2 } from 'lucide-react';
import { useUngViens } from '../hooks/use-ung-vien';
import { useDeXuatTuyenDungs } from '@/features/nhan-su/de-xuat-tuyen-dung/hooks/use-de-xuat-tuyen-dung';
import { useTrangThaiUngViens } from '@/features/nhan-su/thiet-lap-tuyen-dung/hooks/use-trang-thai-ung-vien';
import { useKenhTuyenDungs } from '@/features/nhan-su/thiet-lap-tuyen-dung/hooks/use-kenh-tuyen-dung';
import { exportToExcel } from '../../../../lib/utils';
import {
  ungVienToExportRow,
  UNG_VIEN_EXPORT_FILENAME,
} from '../utils/export-thong-ke';
import { useUngVienStats } from './stats/useUngVienStats';
import LoadingSpinnerWithText from '../../../../components/shared/LoadingSpinnerWithText';
import EmptyState from '../../../../components/shared/EmptyState';
import FilterChipMultiSelect from '../../../../components/shared/FilterChipMultiSelect';
import StatsToolbar from './stats/StatsToolbar';
import StatsCards from './stats/StatsCards';
import StatsCharts from './stats/StatsCharts';
import StatsTables from './stats/StatsTables';
import type { UngVien } from '../core/types';

const ThongKeTab: React.FC = () => {
  const { t } = useTranslation();
  const [filterTrangThai, setFilterTrangThai] = useState<string[]>([]);
  const [filterViTri, setFilterViTri] = useState<string[]>([]);
  const [filterNguon, setFilterNguon] = useState<string[]>([]);

  const { data: list = [], isLoading, isError } = useUngViens();
  const { data: deXuatList = [] } = useDeXuatTuyenDungs();
  const { data: trangThaiList = [] } = useTrangThaiUngViens();
  const { data: kenhList = [] } = useKenhTuyenDungs();

  const filteredList = useMemo(() => {
    return list.filter((item: UngVien) => {
      const matchTrangThai =
        filterTrangThai.length === 0 ||
        filterTrangThai.includes(item.id_trang_thai_ung_vien);
      const matchViTri =
        filterViTri.length === 0 ||
        filterViTri.includes(item.id_de_xuat_tuyen_dung);
      const matchNguon =
        filterNguon.length === 0 ||
        (item.id_kenh_tuyen_dung && filterNguon.includes(item.id_kenh_tuyen_dung));
      return matchTrangThai && matchViTri && matchNguon;
    });
  }, [list, filterTrangThai, filterViTri, filterNguon]);

  const stats = useUngVienStats(filteredList);

  const trangThaiOptions = useMemo(
    () =>
      trangThaiList.map((s) => ({
        label: s.ten,
        value: s.id,
        count: list.filter((i) => i.id_trang_thai_ung_vien === s.id).length,
      })),
    [trangThaiList, list]
  );
  const viTriOptions = useMemo(
    () =>
      deXuatList.map((d) => ({
        label: `${d.ma_de_xuat}${d.ten_chuc_vu ? ` · ${d.ten_chuc_vu}` : ''}`,
        value: d.id,
        count: list.filter((i) => i.id_de_xuat_tuyen_dung === d.id).length,
      })),
    [deXuatList, list]
  );
  const nguonOptions = useMemo(
    () =>
      kenhList.map((k) => ({
        label: k.ten,
        value: k.id,
        count: list.filter((i) => i.id_kenh_tuyen_dung === k.id).length,
      })),
    [kenhList, list]
  );

  const activeFilterCount =
    filterTrangThai.length + filterViTri.length + filterNguon.length;
  const handleClearFilters = () => {
    setFilterTrangThai([]);
    setFilterViTri([]);
    setFilterNguon([]);
  };

  const filterGroups = useMemo(
    () => [
      {
        key: 'trangThai',
        label: t('ungVien.stats.statusLabel'),
        icon: Tag,
        options: trangThaiOptions,
        value: filterTrangThai,
        onChange: setFilterTrangThai,
      },
      {
        key: 'viTri',
        label: t('ungVien.stats.viTriLabel'),
        icon: Briefcase,
        options: viTriOptions,
        value: filterViTri,
        onChange: setFilterViTri,
      },
      {
        key: 'nguon',
        label: t('ungVien.stats.nguonLabel'),
        icon: Share2,
        options: nguonOptions,
        value: filterNguon,
        onChange: setFilterNguon,
      },
    ],
    [
      trangThaiOptions,
      viTriOptions,
      nguonOptions,
      filterTrangThai,
      filterViTri,
      filterNguon,
      t,
    ]
  );

  const renderFilters = (
    <>
      <FilterChipMultiSelect
        options={trangThaiOptions}
        value={filterTrangThai}
        onChange={setFilterTrangThai}
        placeholder={t('ungVien.stats.statusLabel')}
        icon={Tag}
        className="w-full sm:w-[140px]"
        size="md"
      />
      <FilterChipMultiSelect
        options={viTriOptions}
        value={filterViTri}
        onChange={setFilterViTri}
        placeholder={t('ungVien.stats.viTriLabel')}
        icon={Briefcase}
        className="w-full sm:w-[160px]"
        size="md"
      />
      <FilterChipMultiSelect
        options={nguonOptions}
        value={filterNguon}
        onChange={setFilterNguon}
        placeholder={t('ungVien.stats.nguonLabel')}
        icon={Share2}
        className="w-full sm:w-[140px]"
        size="md"
      />
    </>
  );

  const handleExportReport = () => {
    if (filteredList.length === 0) {
      toast.info(t('ungVien.stats.noData'));
      return;
    }
    const rows = filteredList.map(ungVienToExportRow);
    exportToExcel(rows, UNG_VIEN_EXPORT_FILENAME);
    toast.success(t('ungVien.stats.exportReport'));
  };

  const handlePrintReport = () => {
    window.print();
  };

  if (isError) {
    return (
      <div className="flex-1 flex items-center justify-center p-4">
        <p className="text-sm text-destructive">
          {t('ungVien.errorLoad')}
        </p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex flex-col h-full">
        <div className="shrink-0 py-3 px-3 sm:px-4 border-b border-border/50 bg-muted/20">
          <LoadingSpinnerWithText
            text={t('ungVien.stats.loading')}
            centered
          />
        </div>
        <div className="flex-1 p-3 sm:p-4 space-y-3">
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
            {[1, 2, 3, 4, 5].map((i) => (
              <div
                key={i}
                className="bg-card rounded-lg border border-border p-2.5 animate-pulse"
              >
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
              title={t('ungVien.stats.noData')}
              description={
                activeFilterCount > 0
                  ? (t('ungVien.stats.noDataHint') || 'Thử xóa bộ lọc.')
                  : t('ungVien.stats.noDataHint')
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
              <StatsCards
                summary={stats.summary}
                byStatusList={stats.byStatusList}
              />
              <StatsCharts
                chartByStatus={stats.chartByStatus}
                chartByViTri={stats.chartByViTri}
                chartByNguon={stats.chartByNguon}
              />
              <StatsTables
                byStatus={stats.byStatusList}
                byViTri={stats.byViTriList}
                byNguon={stats.byNguonList}
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ThongKeTab;
