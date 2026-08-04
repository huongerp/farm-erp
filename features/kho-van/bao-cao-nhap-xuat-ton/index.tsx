import React, { useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'react-router-dom';
import { BarChart3, FileText, Package } from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import TabGroup from '../../../components/ui/TabGroup';
import BaoCaoNXTToolbar from './components/BaoCaoNXTToolbar';
import TongHopNXTKyTab from './components/TongHopNXTKyTab';
import ChiTietPhieuTab from './components/ChiTietPhieuTab';
import TonTaiThoiDiemTab from './components/TonTaiThoiDiemTab';
import type { NXTReportFilters } from './core/types';
import { getDateRangeFromPreset } from './core/datePresets';
import { usePhieuKhoViewScope } from '../phieu-kho/hooks/use-phieu-kho-view-scope';
import { getKhoList } from '../danh-sach-kho/services/kho-service';

/** Kỳ mặc định: Tháng này. */
const DEFAULT_FILTERS: NXTReportFilters = {
  ...getDateRangeFromPreset('thisMonth'),
  warehouseIds: [],
  loaiPhieu: [],
  trangThaiPhieu: [],
  hangHoaIds: [],
  categoryIds: [],
};

const VALID_TABS = ['tongHop', 'chiTietPhieu', 'tonThoiDiem'] as const;
type TabId = (typeof VALID_TABS)[number];

const BaoCaoNhapXuatTonPage: React.FC = () => {
  const { t } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState<NXTReportFilters>(DEFAULT_FILTERS);
  const [activeTab, setActiveTab] = useState<TabId>('tongHop');
  const viewScope = usePhieuKhoViewScope();

  const effectiveFilters = useMemo((): NXTReportFilters => {
    if (viewScope.viewAll) return filters;
    return {
      ...filters,
      allowedBranchIds: viewScope.allowedBranchIds,
      allowedCreatorUserId: viewScope.ownPhieuCreatorId ?? undefined,
    };
  }, [filters, viewScope.viewAll, viewScope.allowedBranchIds, viewScope.ownPhieuCreatorId]);

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

  const activeFilterCount = useMemo(() => {
    return (
      filters.warehouseIds.length +
      filters.loaiPhieu.length +
      filters.trangThaiPhieu.length +
      filters.hangHoaIds.length +
      filters.categoryIds.length
    );
  }, [filters]);

  const handleClearAllFilters = useCallback(() => {
    setFilters({
      ...getDateRangeFromPreset('thisMonth'),
      warehouseIds: [],
      loaiPhieu: [],
      trangThaiPhieu: [],
      hangHoaIds: [],
      categoryIds: [],
    });
  }, []);

  const handleRefresh = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['baoCaonhapXuatTon'] });
  }, [queryClient]);

  const handleExportExcel = useCallback(async () => {
    try {
      const { exportBaoCaoNXTToExcel } = await import('./utils/export-bao-cao-nxt-excel');
      await exportBaoCaoNXTToExcel(effectiveFilters, t);
      toast.success(t('baoCaonhapXuatTon.exportSuccess'));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Export failed');
    }
  }, [effectiveFilters, t]);

  const handleExportPdf = useCallback(async () => {
    try {
      const { exportBaoCaoNXTToPdf } = await import('./utils/export-bao-cao-nxt-pdf');
      await exportBaoCaoNXTToPdf(effectiveFilters, t);
      toast.success(t('baoCaonhapXuatTon.exportSuccess'));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Export failed');
    }
  }, [effectiveFilters, t]);

  const handlePrint = useCallback(() => {
    window.print();
  }, []);

  const tabs = useMemo(
    () => [
      { id: 'tongHop', label: t('baoCaonhapXuatTon.tabs.tongHop'), icon: BarChart3 },
      { id: 'chiTietPhieu', label: t('baoCaonhapXuatTon.tabs.chiTietPhieu'), icon: FileText },
      { id: 'tonThoiDiem', label: t('baoCaonhapXuatTon.tabs.tonTaiThoiDiem'), icon: Package },
    ],
    [t]
  );

  return (
    <div className="flex flex-col h-[calc(100dvh-3.75rem)] md:h-[calc(100dvh-4.5rem)] relative">
      <div className="shrink-0 relative z-0 print:hidden">
        <TabGroup tabs={tabs} activeTab={activeTab} onChange={handleTabChange} />
      </div>
      <div className="shrink-0 print:hidden mt-2">
        <BaoCaoNXTToolbar
          filters={filters}
          onFiltersChange={setFilters}
          khoList={khoList}
          activeFilterCount={activeFilterCount}
          onClearAllFilters={handleClearAllFilters}
          onExportExcel={handleExportExcel}
          onExportPdf={handleExportPdf}
          onPrint={handlePrint}
          onRefresh={handleRefresh}
        />
      </div>
      <div className="bao-cao-nxt-stats-content flex-1 min-h-0 flex flex-col mt-1.5 overflow-hidden print:overflow-visible">
        {activeTab === 'tongHop' && <TongHopNXTKyTab filters={effectiveFilters} onClearFilters={handleClearAllFilters} />}
        {activeTab === 'chiTietPhieu' && <ChiTietPhieuTab filters={effectiveFilters} />}
        {activeTab === 'tonThoiDiem' && <TonTaiThoiDiemTab filters={effectiveFilters} />}
      </div>
    </div>
  );
};

export default BaoCaoNhapXuatTonPage;
