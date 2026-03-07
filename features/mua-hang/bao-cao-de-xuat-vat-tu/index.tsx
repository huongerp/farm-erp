import React, { useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'react-router-dom';
import { BarChart3, FileText, Link2 } from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import TabGroup from '../../../components/ui/TabGroup';
import BaoCaoDeXuatVatTuToolbar from './components/BaoCaoDeXuatVatTuToolbar';
import TongHopKyTab from './components/TongHopKyTab';
import ChiTietPhieuTab from './components/ChiTietPhieuTab';
import LienKetDonHangTab from './components/LienKetDonHangTab';
import type { BaoCaoDeXuatVatTuFilters } from './core/types';
import { getKhoList } from '../../kho-van/danh-sach-kho/services/kho-service';
import { getEmployees } from '../../he-thong/nhan-vien/services/nhan-vien-service';

/**
 * Kỳ mặc định: tháng 3/2024 để trùng với dữ liệu mẫu phiếu đề xuất & đơn đặt hàng (seed).
 * Khi có API thật, có thể đổi thành getDateRangeFromPreset('thisMonth').
 */
function getDefaultDateRange(): { dateFrom: string; dateTo: string } {
  return { dateFrom: '2024-03-01', dateTo: '2024-03-31' };
}

const DEFAULT_FILTERS: BaoCaoDeXuatVatTuFilters = {
  ...getDefaultDateRange(),
  trangThaiIds: [],
  noiDeXuatIds: [],
  nguoiDeXuatIds: [],
  nguoiDuyetIds: [],
};

const VALID_TABS = ['tongHop', 'chiTietPhieu', 'lienKetDonHang'] as const;
type TabId = (typeof VALID_TABS)[number];

const BaoCaoDeXuatVatTuPage: React.FC = () => {
  const { t } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState<BaoCaoDeXuatVatTuFilters>(DEFAULT_FILTERS);
  const [activeTab, setActiveTab] = useState<TabId>('tongHop');

  const tabFromUrl = searchParams.get('tab');
  React.useEffect(() => {
    if (VALID_TABS.includes(tabFromUrl as TabId)) setActiveTab(tabFromUrl as TabId);
  }, [tabFromUrl]);

  const handleTabChange = (id: string) => {
    if (VALID_TABS.includes(id as TabId)) {
      setActiveTab(id as TabId);
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev);
        next.set('tab', id);
        return next;
      });
    }
  };

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

  const handleRefresh = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['baoCaodeXuatVatTu'] });
  }, [queryClient]);

  const handleExportExcel = useCallback(async () => {
    try {
      const { exportBaoCaoDeXuatVatTuToExcel } = await import('./utils/export-bao-cao-de-xuat-vat-tu-excel');
      await exportBaoCaoDeXuatVatTuToExcel(filters, t);
      toast.success(t('baoCaodeXuatVatTu.export.success'));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Export failed');
    }
  }, [filters, t]);

  const handleExportPdf = useCallback(async () => {
    try {
      const { exportBaoCaoDeXuatVatTuToPdf } = await import('./utils/export-bao-cao-de-xuat-vat-tu-pdf');
      await exportBaoCaoDeXuatVatTuToPdf(filters, t);
      toast.success(t('baoCaodeXuatVatTu.export.success'));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Export failed');
    }
  }, [filters, t]);

  const handlePrint = useCallback(() => {
    window.print();
  }, []);

  const tabs = useMemo(
    () => [
      { id: 'tongHop', label: t('baoCaodeXuatVatTu.tabs.tongHop'), icon: BarChart3 },
      { id: 'chiTietPhieu', label: t('baoCaodeXuatVatTu.tabs.chiTietPhieu'), icon: FileText },
      { id: 'lienKetDonHang', label: t('baoCaodeXuatVatTu.tabs.lienKetDonHang'), icon: Link2 },
    ],
    [t]
  );

  return (
    <div className="flex flex-col h-[calc(100dvh-3.75rem)] md:h-[calc(100dvh-4.5rem)] relative">
      <div className="shrink-0 relative z-0 print:hidden">
        <TabGroup tabs={tabs} activeTab={activeTab} onChange={handleTabChange} />
      </div>
      <div className="shrink-0 print:hidden mt-2">
        <BaoCaoDeXuatVatTuToolbar
          filters={filters}
          onFiltersChange={setFilters}
          khoList={khoList}
          employees={employees}
          activeFilterCount={activeFilterCount}
          onClearAllFilters={handleClearAllFilters}
          onExportExcel={handleExportExcel}
          onExportPdf={handleExportPdf}
          onPrint={handlePrint}
          onRefresh={handleRefresh}
        />
      </div>
      <div className="flex-1 min-h-0 flex flex-col mt-1.5 overflow-hidden">
        {activeTab === 'tongHop' && <TongHopKyTab filters={filters} onClearFilters={handleClearAllFilters} />}
        {activeTab === 'chiTietPhieu' && <ChiTietPhieuTab filters={filters} onClearFilters={handleClearAllFilters} />}
        {activeTab === 'lienKetDonHang' && <LienKetDonHangTab filters={filters} onClearFilters={handleClearAllFilters} />}
      </div>
    </div>
  );
};

export default BaoCaoDeXuatVatTuPage;
