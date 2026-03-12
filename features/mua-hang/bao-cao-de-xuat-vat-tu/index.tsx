import React, { useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import BaoCaoDeXuatVatTuToolbar from './components/BaoCaoDeXuatVatTuToolbar';
import TongHopDayDuTab from './components/TongHopDayDuTab';
import type { BaoCaoDeXuatVatTuFilters } from './core/types';
import { getKhoList } from '../../kho-van/danh-sach-kho/services/kho-service';
import { getEmployees } from '../../he-thong/nhan-vien/services/nhan-vien-service';

/** Mặc định kỳ = Tất cả (không giới hạn thời gian), giống module nhân viên. */
function getDefaultDateRange(): { dateFrom: string; dateTo: string } {
  return { dateFrom: '', dateTo: '' };
}

const DEFAULT_FILTERS: BaoCaoDeXuatVatTuFilters = {
  ...getDefaultDateRange(),
  trangThaiIds: [],
  noiDeXuatIds: [],
  nguoiDeXuatIds: [],
  nguoiDuyetIds: [],
};

const BaoCaoDeXuatVatTuPage: React.FC = () => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState<BaoCaoDeXuatVatTuFilters>(DEFAULT_FILTERS);

  const { data: khoList = [] } = useQuery({ queryKey: ['kho'], queryFn: getKhoList });
  const { data: employees = [] } = useQuery({
    queryKey: ['employees'],
    queryFn: getEmployees,
  });

  const activeFilterCount = useMemo(
    () =>
      filters.trangThaiIds.length +
      filters.noiDeXuatIds.length +
      filters.nguoiDeXuatIds.length +
      filters.nguoiDuyetIds.length,
    [filters]
  );

  const handleClearAllFilters = useCallback(() => {
    setFilters({
      ...getDefaultDateRange(),
      trangThaiIds: [],
      noiDeXuatIds: [],
      nguoiDeXuatIds: [],
      nguoiDuyetIds: [],
    });
  }, []);

  const handleExport = useCallback(
    async (format: 'excel' | 'pdf') => {
      try {
        if (format === 'excel') {
          const { exportBaoCaoDeXuatVatTuToExcel } = await import('./utils/export-bao-cao-de-xuat-vat-tu-excel');
          await exportBaoCaoDeXuatVatTuToExcel(filters, t);
        } else {
          const { exportBaoCaoDeXuatVatTuToPdf } = await import('./utils/export-bao-cao-de-xuat-vat-tu-pdf');
          await exportBaoCaoDeXuatVatTuToPdf(filters, t);
        }
        toast.success(t('baoCaodeXuatVatTu.export.success'));
      } catch (e) {
        toast.error(e instanceof Error ? e.message : 'Export failed');
      }
    },
    [filters, t]
  );

  return (
    <div className="flex flex-col h-[calc(100dvh-3.75rem)] md:h-[calc(100dvh-4.5rem)] relative">
      <div className="shrink-0 print:hidden">
        <BaoCaoDeXuatVatTuToolbar
          filters={filters}
          onFiltersChange={setFilters}
          khoList={khoList}
          employees={employees}
          activeFilterCount={activeFilterCount}
          onClearAllFilters={handleClearAllFilters}
          onExport={handleExport}
        />
      </div>
      <div className="flex-1 min-h-0 flex flex-col mt-1.5 overflow-hidden">
        <TongHopDayDuTab filters={filters} onClearFilters={handleClearAllFilters} />
      </div>
    </div>
  );
};

export default BaoCaoDeXuatVatTuPage;
