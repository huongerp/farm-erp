import React, { useCallback, useMemo, useState, lazy, Suspense } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import BaoCaoDeXuatVatTuToolbar from './components/BaoCaoDeXuatVatTuToolbar';
const TongHopDayDuTab = lazy(() => import('./components/TongHopDayDuTab'));
import type { BaoCaoDeXuatVatTuFilters } from './core/types';
import { usePhieuDeXuatVatTuViewScope } from '../../kho-van/phieu-de-xuat-vat-tu/hooks/use-phieu-de-xuat-vat-tu-view-scope';
import { getKhoList } from '../../kho-van/danh-sach-kho/services/kho-service';
import { getEmployeesRef } from '../../he-thong/nhan-vien/services/nhan-vien-service';

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
  const [filters, setFilters] = useState<BaoCaoDeXuatVatTuFilters>(DEFAULT_FILTERS);
  const viewScope = usePhieuDeXuatVatTuViewScope();

  const effectiveFilters = useMemo((): BaoCaoDeXuatVatTuFilters => {
    if (viewScope.viewAll) return filters;
    return {
      ...filters,
      allowedBranchIds: viewScope.allowedBranchIds,
      allowedCreatorUserId: viewScope.currentEmployeeId ?? undefined,
    };
  }, [filters, viewScope.viewAll, viewScope.allowedBranchIds, viewScope.currentEmployeeId]);

  const { data: khoList = [] } = useQuery({ queryKey: ['kho'], queryFn: getKhoList });
  // Dùng ref-query (id, ho_ten, email, trang_thai) — đủ cho filter "Người đề xuất/duyệt",
  // tránh trùng `queryKey: ['employees']` với trang quản trị nhân viên (gây refetch chéo).
  const { data: employees = [] } = useQuery({
    queryKey: ['employees', 'ref'],
    queryFn: getEmployeesRef,
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
          await exportBaoCaoDeXuatVatTuToExcel(effectiveFilters, t);
        } else {
          const { exportBaoCaoDeXuatVatTuToPdf } = await import('./utils/export-bao-cao-de-xuat-vat-tu-pdf');
          await exportBaoCaoDeXuatVatTuToPdf(effectiveFilters, t);
        }
        toast.success(t('baoCaodeXuatVatTu.export.success'));
      } catch (e) {
        toast.error(e instanceof Error ? e.message : 'Export failed');
      }
    },
    [effectiveFilters, t]
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
        <Suspense
          fallback={
            <div className="flex flex-1 min-h-[200px] items-center justify-center text-sm text-muted-foreground" aria-busy="true">
              {t('common.loading')}
            </div>
          }
        >
          <TongHopDayDuTab filters={effectiveFilters} onClearFilters={handleClearAllFilters} />
        </Suspense>
      </div>
    </div>
  );
};

export default BaoCaoDeXuatVatTuPage;
