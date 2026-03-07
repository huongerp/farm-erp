import React, { useState, useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Download } from 'lucide-react';
import Button from '../../../components/ui/Button';
import LoadingSpinnerWithText from '../../../components/shared/LoadingSpinnerWithText';
import DashboardToolbar from '../../../components/shared/DashboardToolbar';
import ErrorBoundary from '../../../components/shared/ErrorBoundary';
import { exportToExcel } from '../../../lib/utils';
import { useCongViecList } from '../cong-viec/hooks/use-cong-viec';
import { useDuAnList } from '../du-an/hooks/use-du-an';
import { useBaoCaoCongViecData } from './hooks/use-bao-cao-cong-viec';
import type { BaoCaoCongViecFilters } from './core/types';
import { BaoCaoToolbarFilters, useBaoCaoFilterGroups } from './components/bao-cao-toolbar';
import BaoCaoStats from './components/bao-cao-stats';

const INITIAL_FILTERS: BaoCaoCongViecFilters = {
  dateFrom: '',
  dateTo: '',
  id_du_an: [],
  id_phong_ban: [],
  nguoi_ids: [],
};

const BaoCaoPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [filters, setFilters] = useState<BaoCaoCongViecFilters>(INITIAL_FILTERS);

  const { data: congViecList = [], isLoading: loadingCV } = useCongViecList();
  const { data: duAnList = [] } = useDuAnList();

  const {
    filtered,
    byTrangThai,
    byUuTien,
    byDuAn,
    byPhongBan,
    summary,
  } = useBaoCaoCongViecData(congViecList, duAnList, filters);

  const filterGroups = useBaoCaoFilterGroups(filters, setFilters);
  const activeFilterCount =
    (filters.dateFrom ? 1 : 0) +
    (filters.dateTo ? 1 : 0) +
    (filters.id_du_an.length > 0 ? 1 : 0) +
    (filters.id_phong_ban.length > 0 ? 1 : 0) +
    (filters.nguoi_ids.length > 0 ? 1 : 0);

  const handleClearFilters = useCallback(() => {
    setFilters(INITIAL_FILTERS);
  }, []);

  const exportData = useMemo(
    () =>
      filtered.map((c) => ({
        [t('congViec.form.maCongViec')]: c.ma_cong_viec,
        [t('congViec.form.tieuDe')]: c.tieu_de,
        [t('congViec.form.duAn')]: c.ten_du_an ?? '—',
        [t('congViec.store.uuTienCol')]: c.uu_tien,
        [t('congViec.store.trangThaiCol')]: c.trang_thai,
        [t('congViec.store.ngayHetHanCol')]: c.ngay_het_han,
        [t('congViec.store.tienDoCol')]: c.phan_tram_hoan_thanh,
      })),
    [filtered, t]
  );

  const handleExport = () => {
    exportToExcel(exportData, 'bao_cao_cong_viec');
  };

  if (loadingCV) {
    return (
      <div className="flex flex-col h-[calc(100dvh-3.75rem)] md:h-[calc(100dvh-4.5rem)] items-center justify-center">
        <LoadingSpinnerWithText text={t('baoCao.loading')} />
      </div>
    );
  }

  return (
    <ErrorBoundary>
    <div className="flex flex-col h-[calc(100dvh-3.75rem)] md:h-[calc(100dvh-4.5rem)]">
      <DashboardToolbar
        filters={
          <BaoCaoToolbarFilters filters={filters} onFiltersChange={setFilters} />
        }
        actions={
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleExport}
            className="gap-2 h-8"
          >
            <Download size={16} />
            {t('baoCao.export')}
          </Button>
        }
        filterGroups={filterGroups}
        activeFilterCount={activeFilterCount}
        onClearFilters={handleClearFilters}
        onBack={() => navigate(-1)}
      />

      <div className="flex-1 min-h-0 overflow-auto custom-scrollbar">
        <div className="p-3 sm:p-4 pb-4">
          <BaoCaoStats
            summary={summary}
            byTrangThai={byTrangThai}
            byUuTien={byUuTien}
            byDuAn={byDuAn}
            byPhongBan={byPhongBan}
          />
        </div>
      </div>
    </div>
    </ErrorBoundary>
  );
};

export default BaoCaoPage;
