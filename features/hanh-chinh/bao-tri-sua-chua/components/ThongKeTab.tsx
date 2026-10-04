import React, { useMemo, useState, lazy, Suspense } from 'react';
import { useTranslation } from 'react-i18next';
import { Wrench, MapPin, Tag, Calendar } from 'lucide-react';
import DateRangePicker from '../../../../components/ui/DateRangePicker';
import { MobileFilterField } from '../../../../components/ui/MobileFilterSheet';
import { KY_CUSTOM, useKyChip } from './ky-loc-chip';
import { toast } from 'sonner';
import { usePhieuBaoTriList } from '../hooks/use-bao-tri-sua-chua';
import { useBaoTriSuaChuaViewScope } from '../hooks/use-bao-tri-sua-chua-view-scope';
import { useAuthStore } from '../../../../store/useStore';
import { useTaiSanTomTat } from '../../danh-muc-tai-san/hooks/use-danh-muc-tai-san';
import { useLoaiChiPhiList } from '../../thiet-lap-tai-san/hooks/use-loai-chi-phi';
import { useBranches } from '../../../he-thong/chi-nhanh/hooks/use-chi-nhanh';
import { TRANG_THAI_HOAT_DONG } from '../../../../lib/constants';
import { getTrangThaiLabel, getHangMucLabel, TRANG_THAI_OPTIONS } from '../core/constants';
import LoadingSpinnerWithText from '../../../../components/shared/LoadingSpinnerWithText';
import EmptyState from '../../../../components/shared/EmptyState';
import FilterChipMultiSelect from '../../../../components/shared/FilterChipMultiSelect';
import StatsToolbar from './stats/StatsToolbar';
import StatsCards from './stats/StatsCards';
const StatsCharts = lazy(() => import('./stats/StatsCharts'));
import StatsTables from './stats/StatsTables';
import { usePhieuBaoTriStats } from './stats/usePhieuBaoTriStats';
import { exportToExcel, formatDate } from '../../../../lib/utils';
import { buildTaiSanChiNhanhMap, filterPhieuChiPhi, getChiNhanhCuaPhieu } from '../utils/filter-phieu-chi-phi';
import type { BaoTriSuaChuaFilters } from '../store/useBaoTriSuaChuaStore';
import type { PhieuBaoTriSuaChua } from '../core/types';
import type { TFunction } from 'i18next';

/** Dòng xuất báo cáo: số tiền để dạng SỐ (Excel cộng được), ngày dd/mm/yyyy. */
function phieuToExportRow(p: PhieuBaoTriSuaChua, t: TFunction): Record<string, string | number> {
  return {
    ma_phieu: p.ma_phieu,
    ngay: formatDate(p.ngay),
    chi_nhanh: p.ten_chi_nhanh || '',
    hang_muc: p.ten_hang_muc || getHangMucLabel(p.id_hang_muc, t),
    tai_san: [p.ma_tai_san, p.ten_tai_san].filter(Boolean).join(' – '),
    mo_ta: p.mo_ta || '',
    nha_cung_cap: p.ten_nha_cung_cap || '',
    so_tien: Number(p.so_tien) || 0,
    trang_thai: getTrangThaiLabel(p.trang_thai, t),
    nguoi_tao: p.ten_nguoi_tao || '',
    nguoi_duyet: p.nguoi_duyet || '',
  };
}

const ThongKeTab: React.FC = () => {
  const { t } = useTranslation();
  const user = useAuthStore((s) => s.user);
  const { viewAll } = useBaoTriSuaChuaViewScope();
  const { data: taiSanList = [] } = useTaiSanTomTat();
  const { data: loaiChiPhi = [] } = useLoaiChiPhiList();
  const { data: branches = [] } = useBranches();
  const [filterDateFrom, setFilterDateFrom] = useState('');
  const [filterDateTo, setFilterDateTo] = useState('');
  // Lọc kỳ ở server; các chip còn lại lọc trên tập đã thu hẹp theo kỳ.
  const { data: list = [], isLoading, isError } = usePhieuBaoTriList({
    dateFrom: filterDateFrom || undefined,
    dateTo: filterDateTo || undefined,
  });
  const kyChip = useKyChip(filterDateFrom, filterDateTo, (from, to) => {
    setFilterDateFrom(from);
    setFilterDateTo(to);
  });

  const activeLoai = useMemo(
    () => loaiChiPhi.filter((l) => l.trang_thai === TRANG_THAI_HOAT_DONG.DANG_HOAT_DONG),
    [loaiChiPhi]
  );

  const viewableList = useMemo(() => {
    if (viewAll) return list;
    const myId = user?.id ?? '';
    const assetIdsHeldByUser = new Set(
      taiSanList.filter((a) => String(a.id_nhan_vien_dang_giu) === String(myId)).map((a) => a.id)
    );
    return list.filter(
      (p) => String(p.id_nguoi_tao) === String(myId) || assetIdsHeldByUser.has(p.id_tai_san)
    );
  }, [list, viewAll, user?.id, taiSanList]);

  const [filterHangMuc, setFilterHangMuc] = useState<string[]>([]);
  const [filterChiNhanh, setFilterChiNhanh] = useState<string[]>([]);
  const [filterTrangThai, setFilterTrangThai] = useState<string[]>([]);

  const branchMap = useMemo(() => buildTaiSanChiNhanhMap(taiSanList), [taiSanList]);

  const statsFilters: BaoTriSuaChuaFilters = useMemo(
    () => ({
      hang_muc: filterHangMuc,
      dateFrom: filterDateFrom,
      dateTo: filterDateTo,
      id_tai_san: [],
      id_chi_nhanh: filterChiNhanh,
      trang_thai: filterTrangThai,
      id_nguoi_tao: [],
    }),
    [filterHangMuc, filterDateFrom, filterDateTo, filterChiNhanh, filterTrangThai]
  );

  const filteredList = useMemo(
    () => filterPhieuChiPhi(viewableList, statsFilters, branchMap),
    [viewableList, statsFilters, branchMap]
  );

  const stats = usePhieuBaoTriStats(filteredList, loaiChiPhi);

  const countByHangMuc = useMemo(() => {
    const m: Record<string, number> = {};
    viewableList.forEach((p) => { m[p.id_hang_muc] = (m[p.id_hang_muc] ?? 0) + 1; });
    return m;
  }, [viewableList]);

  const hangMucOptions = useMemo(() => {
    const idsSeen = new Set<string>();
    const fromLoai = activeLoai.map((l) => {
      idsSeen.add(l.id);
      return { label: `${l.ten} (${l.ma})`, value: l.id, count: countByHangMuc[l.id] ?? 0 };
    });
    const legacyExtras = Object.keys(countByHangMuc)
      .filter((id) => !idsSeen.has(id))
      .map((id) => ({
        label: getHangMucLabel(id, t),
        value: id,
        count: countByHangMuc[id] ?? 0,
      }));
    return [...fromLoai, ...legacyExtras];
  }, [activeLoai, countByHangMuc, t]);

  const chiNhanhOptions = useMemo(() => {
    const countByBranch: Record<string, number> = {};
    for (const p of viewableList) {
      const id = getChiNhanhCuaPhieu(p, branchMap);
      if (id) countByBranch[id] = (countByBranch[id] ?? 0) + 1;
    }
    return branches.map((b) => ({
      label: b.ten_chi_nhanh,
      value: b.id,
      subLabel: b.ma_chi_nhanh,
      count: countByBranch[b.id] ?? 0,
    }));
  }, [branches, viewableList, branchMap]);

  const trangThaiOptions = useMemo(() => {
    const countByTrangThai: Record<string, number> = {};
    for (const p of viewableList) {
      countByTrangThai[p.trang_thai] = (countByTrangThai[p.trang_thai] ?? 0) + 1;
    }
    return TRANG_THAI_OPTIONS.map((o) => ({
      label: t(o.labelKey),
      value: o.value,
      count: countByTrangThai[o.value] ?? 0,
    }));
  }, [viewableList, t]);

  const activeFilterCount =
    filterHangMuc.length +
    filterChiNhanh.length +
    filterTrangThai.length +
    (filterDateFrom || filterDateTo ? 1 : 0);
  const handleClearFilters = () => {
    setFilterHangMuc([]);
    setFilterDateFrom('');
    setFilterDateTo('');
    setFilterChiNhanh([]);
    setFilterTrangThai([]);
  };

  const filterGroups = useMemo(
    () => [
      { key: 'hang_muc', label: t('baoTriSuaChua.store.hangMucCol'), icon: Wrench, options: hangMucOptions, value: filterHangMuc, onChange: setFilterHangMuc },
      { key: 'id_chi_nhanh', label: t('baoTriSuaChua.store.chiNhanhCol'), icon: MapPin, options: chiNhanhOptions, value: filterChiNhanh, onChange: setFilterChiNhanh },
      { key: 'trang_thai', label: t('baoTriSuaChua.store.trangThaiCol'), icon: Tag, options: trangThaiOptions, value: filterTrangThai, onChange: setFilterTrangThai },
    ],
    [hangMucOptions, filterHangMuc, chiNhanhOptions, filterChiNhanh, trangThaiOptions, filterTrangThai, t]
  );

  const renderFilters = (
    <>
      <FilterChipMultiSelect
        options={hangMucOptions}
        value={filterHangMuc}
        onChange={setFilterHangMuc}
        placeholder={t('baoTriSuaChua.store.hangMucCol')}
        icon={Wrench}
        className="w-full sm:w-[160px]"
        size="md"
      />
      <DateRangePicker
        presets={kyChip.presets}
        value={kyChip.value}
        onChange={kyChip.onChange}
        placeholder={t('baoTriSuaChua.filter.period')}
        customPresetId={KY_CUSTOM}
        className="w-full sm:w-auto shrink-0"
      />
      <FilterChipMultiSelect
        options={chiNhanhOptions}
        value={filterChiNhanh}
        onChange={setFilterChiNhanh}
        placeholder={t('baoTriSuaChua.store.chiNhanhCol')}
        icon={MapPin}
        className="w-full sm:w-[170px]"
        size="md"
      />
      <FilterChipMultiSelect
        options={trangThaiOptions}
        value={filterTrangThai}
        onChange={setFilterTrangThai}
        placeholder={t('baoTriSuaChua.store.trangThaiCol')}
        icon={Tag}
        className="w-full sm:w-[150px]"
        size="md"
      />
    </>
  );

  const coKy = !!(filterDateFrom || filterDateTo);
  // Điện thoại ẩn hàng chip → chip kỳ hiện thẳng trong bảng lọc mobile.
  const mobileFilterExtra = (
    <MobileFilterField label={t('baoTriSuaChua.filter.period')} icon={Calendar} active={coKy}>
      <DateRangePicker
        inline
        presets={kyChip.presets}
        value={kyChip.value}
        onChange={kyChip.onChange}
        customPresetId={KY_CUSTOM}
      />
    </MobileFilterField>
  );

  const handleExportReport = () => {
    if (filteredList.length === 0) {
      toast.info(t('baoTriSuaChua.stats.noData'));
      return;
    }
    const headers = {
      ma_phieu: t('baoTriSuaChua.store.maPhieuCol'),
      ngay: t('baoTriSuaChua.store.ngayCol'),
      chi_nhanh: t('baoTriSuaChua.store.chiNhanhCol'),
      hang_muc: t('baoTriSuaChua.store.hangMucCol'),
      tai_san: t('baoTriSuaChua.store.taiSanCol'),
      mo_ta: t('baoTriSuaChua.store.moTaCol'),
      nha_cung_cap: t('baoTriSuaChua.store.nhaCungCapCol'),
      so_tien: t('baoTriSuaChua.store.soTienCol'),
      trang_thai: t('baoTriSuaChua.store.trangThaiCol'),
      nguoi_tao: t('baoTriSuaChua.store.nguoiTaoCol'),
      nguoi_duyet: t('baoTriSuaChua.store.nguoiDuyetCol'),
    };
    const dataForExport = filteredList.map((p) => {
      const row = phieuToExportRow(p, t);
      const out: Record<string, string | number> = {};
      Object.keys(headers).forEach((k) => { out[headers[k as keyof typeof headers]] = row[k] ?? ''; });
      return out;
    });
    exportToExcel(dataForExport, t('baoTriSuaChua.export.fileName'));
    toast.success(t('baoTriSuaChua.stats.exportDone'));
  };

  const handlePrintReport = () => {
    window.print();
  };

  if (isError) {
    return (
      <div className="flex-1 flex items-center justify-center p-4">
        <p className="text-sm text-destructive">
          {t('baoTriSuaChua.stats.loadError')}
        </p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex flex-col h-full">
        <div className="shrink-0 py-3 px-3 sm:px-4 border-b border-border/50 bg-muted/20">
          <LoadingSpinnerWithText
            text={t('baoTriSuaChua.stats.loading')}
            centered
          />
        </div>
        <div className="flex-1 p-3 sm:p-4 space-y-3">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
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

  const isEmpty = filteredList.length === 0;

  return (
    <div className="flex flex-col h-full">
      <StatsToolbar
        className="static z-auto"
        filters={renderFilters}
        filterGroups={filterGroups}
        mobileFilterExtra={mobileFilterExtra}
        mobileFilterExtraCount={coKy ? 1 : 0}
        activeFilterCount={activeFilterCount}
        onClearFilters={handleClearFilters}
        onExportReport={handleExportReport}
        onPrintReport={handlePrintReport}
      />
      <div className="bao-tri-sua-chua-stats-content flex-1 min-h-0 overflow-y-auto custom-scrollbar print:overflow-visible">
        <div className="p-3 sm:p-4 pb-4 space-y-4">
          {isEmpty ? (
            <EmptyState
              title={t('baoTriSuaChua.stats.noData')}
              description={
                activeFilterCount > 0
                  ? t('baoTriSuaChua.stats.noDataFilterHint')
                  : t('baoTriSuaChua.stats.noDataHint')
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
              <StatsCards summary={stats.tongQuan} />
              <Suspense fallback={<LoadingSpinnerWithText text={t('common.loading')} className="py-8" centered />}>
                <StatsCharts byHangMuc={stats.theoHangMuc} byThang={stats.theoThang} byTaiSan={stats.theoTaiSan} />
              </Suspense>
              <StatsTables
                byHangMuc={stats.theoHangMuc}
                byChiNhanh={stats.theoChiNhanh}
                byNhaCungCap={stats.theoNhaCungCap}
                byTaiSan={stats.theoTaiSan}
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ThongKeTab;
