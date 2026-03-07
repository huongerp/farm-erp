/**
 * Báo cáo tuyển dụng – trang tổng hợp số liệu từ Đề xuất, Ứng viên, Lịch PV, Thư, Hợp đồng.
 */
import React, { useMemo, useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Calendar, Briefcase, Share2 } from 'lucide-react';
import { useDeXuatTuyenDungWithCounts } from '@/features/nhan-su/de-xuat-tuyen-dung/hooks/use-de-xuat-tuyen-dung-with-counts';
import { useUngViens } from '@/features/nhan-su/ung-vien/hooks/use-ung-vien';
import { useLichPhongVans } from '@/features/nhan-su/lich-phong-van/hooks/use-lich-phong-van';
import { useThuGuiUngViens } from '@/features/nhan-su/thu-gui-ung-vien/hooks/use-thu-gui-ung-vien';
import { useHopDongs, usePhieuThanhLyList } from '@/features/nhan-su/hop-dong/hooks/use-hop-dong';
import { useKenhTuyenDungs } from '@/features/nhan-su/thiet-lap-tuyen-dung/hooks/use-kenh-tuyen-dung';
import { useBaoCaoTuyenDungStats } from './hooks/useBaoCaoTuyenDungStats';
import { exportBaoCaoTuyenDungToExcel } from './utils/export-bao-cao';
import LoadingSpinnerWithText from '../../../components/shared/LoadingSpinnerWithText';
import EmptyState from '../../../components/shared/EmptyState';
import FilterChipMultiSelect from '../../../components/shared/FilterChipMultiSelect';
import StatsToolbar from './components/StatsToolbar';
import StatsCards from './components/StatsCards';
import StatsCharts from './components/StatsCharts';
import StatsTables from './components/StatsTables';

function inDateRange(value: string, ngayTu: string, ngayDen: string): boolean {
  if (ngayTu && value < ngayTu) return false;
  if (ngayDen && value > ngayDen) return false;
  return true;
}

const BaoCaoTuyenDungPage: React.FC = () => {
  const { t } = useTranslation();
  const [ngayTu, setNgayTu] = useState('');
  const [ngayDen, setNgayDen] = useState('');
  const [filterViTri, setFilterViTri] = useState<string[]>([]);
  const [filterNguon, setFilterNguon] = useState<string[]>([]);

  const { data: dexuatList = [], isLoading: loadingDx, isError: errorDx } = useDeXuatTuyenDungWithCounts();
  const { data: ungVienList = [], isLoading: loadingUv, isError: errorUv } = useUngViens();
  const { data: lichPVList = [], isLoading: loadingLpv } = useLichPhongVans();
  const { data: thuList = [], isLoading: loadingThu } = useThuGuiUngViens();
  const { data: hopDongList = [], isLoading: loadingHd } = useHopDongs();
  const { data: phieuThanhLyList = [] } = usePhieuThanhLyList();
  const { data: kenhList = [] } = useKenhTuyenDungs();

  const filteredDexuat = useMemo(() => {
    return dexuatList.filter((d) => {
      const dateStr = (d.tg_tao || '').slice(0, 10);
      if (!inDateRange(dateStr, ngayTu, ngayDen)) return false;
      if (filterViTri.length > 0 && !filterViTri.includes(d.id)) return false;
      return true;
    });
  }, [dexuatList, ngayTu, ngayDen, filterViTri]);

  const filteredUngVien = useMemo(() => {
    return ungVienList.filter((u) => {
      const dateStr = (u.tg_tao || '').slice(0, 10);
      if (!inDateRange(dateStr, ngayTu, ngayDen)) return false;
      if (filterViTri.length > 0 && !filterViTri.includes(u.id_de_xuat_tuyen_dung)) return false;
      if (filterNguon.length > 0) {
        if (!u.id_kenh_tuyen_dung) return false;
        if (!filterNguon.includes(u.id_kenh_tuyen_dung)) return false;
      }
      return true;
    });
  }, [ungVienList, ngayTu, ngayDen, filterViTri, filterNguon]);

  const filteredLichPV = useMemo(() => {
    return lichPVList.filter((p) => {
      if (!inDateRange(p.ngay || '', ngayTu, ngayDen)) return false;
      const uv = ungVienList.find((u) => u.id === p.id_ung_vien);
      if (filterViTri.length > 0 && uv && !filterViTri.includes(uv.id_de_xuat_tuyen_dung)) return false;
      if (filterNguon.length > 0 && uv?.id_kenh_tuyen_dung && !filterNguon.includes(uv.id_kenh_tuyen_dung)) return false;
      return true;
    });
  }, [lichPVList, ungVienList, ngayTu, ngayDen, filterViTri, filterNguon]);

  const filteredThu = useMemo(() => {
    return thuList.filter((thu) => {
      const dateStr = (thu.tg_tao || '').slice(0, 10);
      if (!inDateRange(dateStr, ngayTu, ngayDen)) return false;
      const uv = ungVienList.find((u) => u.id === thu.id_ung_vien);
      if (filterViTri.length > 0 && uv && !filterViTri.includes(uv.id_de_xuat_tuyen_dung)) return false;
      if (filterNguon.length > 0 && uv?.id_kenh_tuyen_dung && !filterNguon.includes(uv.id_kenh_tuyen_dung)) return false;
      return true;
    });
  }, [thuList, ungVienList, ngayTu, ngayDen, filterViTri, filterNguon]);

  const filteredHopDong = useMemo(() => {
    return hopDongList.filter((h) => {
      const dateStr = (h.tg_tao || '').slice(0, 10);
      if (!inDateRange(dateStr, ngayTu, ngayDen)) return false;
      const uv = ungVienList.find((u) => u.id === h.id_ung_vien);
      if (filterViTri.length > 0 && uv && !filterViTri.includes(uv.id_de_xuat_tuyen_dung)) return false;
      if (filterNguon.length > 0 && uv?.id_kenh_tuyen_dung && !filterNguon.includes(uv.id_kenh_tuyen_dung)) return false;
      return true;
    });
  }, [hopDongList, ungVienList, ngayTu, ngayDen, filterViTri, filterNguon]);

  const filteredPhieuThanhLy = useMemo(() => {
    const hdIds = new Set(filteredHopDong.map((h) => h.id));
    return phieuThanhLyList.filter((p) => hdIds.has(p.id_hop_dong));
  }, [phieuThanhLyList, filteredHopDong]);

  const stats = useBaoCaoTuyenDungStats({
    dexuat: filteredDexuat,
    ungVien: filteredUngVien,
    lichPV: filteredLichPV,
    thu: filteredThu,
    hopDong: filteredHopDong,
    phieuThanhLy: filteredPhieuThanhLy,
  });

  const viTriOptions = useMemo(
    () =>
      dexuatList.map((d) => ({
        label: d.ma_de_xuat ? (d.ten_chuc_vu ? `${d.ma_de_xuat} · ${d.ten_chuc_vu}` : d.ma_de_xuat) : d.id,
        value: d.id,
        count: dexuatList.filter((x) => x.id === d.id).length,
      })),
    [dexuatList]
  );
  const nguonOptions = useMemo(
    () =>
      kenhList.map((k) => ({
        label: k.ten,
        value: k.id,
        count: ungVienList.filter((u) => u.id_kenh_tuyen_dung === k.id).length,
      })),
    [kenhList, ungVienList]
  );

  const activeFilterCount =
    (ngayTu ? 1 : 0) + (ngayDen ? 1 : 0) + filterViTri.length + filterNguon.length;
  const handleClearFilters = useCallback(() => {
    setNgayTu('');
    setNgayDen('');
    setFilterViTri([]);
    setFilterNguon([]);
  }, []);

  const filterGroups = useMemo(
    () => [
      {
        key: 'viTri',
        label: t('baoCaoTuyenDung.filterViTri'),
        icon: Briefcase,
        options: viTriOptions,
        value: filterViTri,
        onChange: (val: string[]) => setFilterViTri(val),
      },
      {
        key: 'nguon',
        label: t('baoCaoTuyenDung.filterNguon'),
        icon: Share2,
        options: nguonOptions,
        value: filterNguon,
        onChange: (val: string[]) => setFilterNguon(val),
      },
    ],
    [viTriOptions, nguonOptions, filterViTri, filterNguon, t]
  );

  const renderFilters = (
    <>
      <div className="relative w-full sm:w-[140px]">
        <Calendar className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
        <input
          type="date"
          value={ngayTu}
          onChange={(e) => setNgayTu(e.target.value)}
          className="w-full h-9 pl-8 pr-2 bg-muted/40 border border-border/60 rounded-lg text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40"
          placeholder={t('baoCaoTuyenDung.filterFromDate')}
        />
      </div>
      <div className="relative w-full sm:w-[140px]">
        <Calendar className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
        <input
          type="date"
          value={ngayDen}
          onChange={(e) => setNgayDen(e.target.value)}
          className="w-full h-9 pl-8 pr-2 bg-muted/40 border border-border/60 rounded-lg text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40"
          placeholder={t('baoCaoTuyenDung.filterToDate')}
        />
      </div>
      <FilterChipMultiSelect
        options={viTriOptions}
        value={filterViTri}
        onChange={setFilterViTri}
        placeholder={t('baoCaoTuyenDung.filterViTri')}
        icon={Briefcase}
        className="w-full sm:w-[160px]"
      />
      <FilterChipMultiSelect
        options={nguonOptions}
        value={filterNguon}
        onChange={setFilterNguon}
        placeholder={t('baoCaoTuyenDung.filterNguon')}
        icon={Share2}
        className="w-full sm:w-[140px]"
      />
    </>
  );

  const hasData =
    stats.summary.deXuatDaDuyet > 0 ||
    stats.summary.ungVien > 0 ||
    stats.summary.lichPVDaDienRa > 0 ||
    stats.summary.thuMoiNhanViec > 0 ||
    stats.summary.hopDong > 0;
  const handleExportReport = useCallback(async () => {
    if (!hasData) {
      toast.info(t('baoCaoTuyenDung.noData'));
      return;
    }
    try {
      await exportBaoCaoTuyenDungToExcel(stats, t);
      toast.success(t('baoCaoTuyenDung.exportSuccess'));
    } catch (e) {
      toast.error((e as Error).message);
    }
  }, [stats, t, hasData]);

  const handlePrintReport = useCallback(() => {
    window.print();
  }, []);

  const isLoading = loadingDx || loadingUv || loadingLpv || loadingThu || loadingHd;
  const isError = errorDx || errorUv;

  if (isError) {
    return (
      <div className="flex-1 flex items-center justify-center p-4">
        <p className="text-sm text-destructive">{t('baoCaoTuyenDung.errorLoad')}</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex flex-col h-full">
        <div className="shrink-0 py-3 px-3 sm:px-4 border-b border-border/50 bg-muted/20">
          <LoadingSpinnerWithText text={t('baoCaoTuyenDung.loading')} centered />
        </div>
        <div className="flex-1 p-3 sm:p-4 space-y-3">
          <div className="grid grid-cols-2 sm:grid-cols-6 gap-2.5">
            {[1, 2, 3, 4, 5, 6].map((i) => (
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

  const isEmpty = !hasData;

  return (
    <div className="flex flex-col h-[calc(100dvh-3.75rem)] md:h-[calc(100dvh-4.5rem)] print:h-auto">
      <StatsToolbar
        className="static z-auto print:hidden"
        filters={renderFilters}
        filterGroups={filterGroups}
        activeFilterCount={activeFilterCount}
        onClearFilters={handleClearFilters}
        onExportReport={handleExportReport}
        onPrintReport={handlePrintReport}
        canExport={hasData}
      />

      <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar print:overflow-visible">
        <div className="p-3 sm:p-4 pb-4 space-y-4 print:p-4">
          {isEmpty ? (
            <EmptyState
              title={t('baoCaoTuyenDung.noData')}
              description={t('baoCaoTuyenDung.noDataHint')}
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
              <StatsCards summary={stats.summary} />
              <StatsCharts
                chartFunnel={stats.chartFunnel}
                chartByViTri={stats.chartByViTri}
                chartByNguon={stats.chartByNguon}
              />
              <StatsTables byViTri={stats.byViTri} byNguon={stats.byNguon} />
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default BaoCaoTuyenDungPage;
