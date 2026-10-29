/**
 * Tab «Tổng hợp tuần» — CHỈ XEM, khuôn list chuẩn: `DashboardToolbar` (tuần farm ‹ › + chip Chi nhánh đa chọn /
 * Có KSC / Tổ trưởng, Xuất Excel) + `GenericTable` mỗi dòng = tuần × chi nhánh (số ngày có số, số chuyến, T2→CN,
 * tổng tuần, KSC, % KSC; dòng tổng trên đầu bảng) → bấm dòng mở Detail tổng tuần (`tong-hop/TongTuanDetail`:
 * tổ trưởng → lô × ngày, theo dây / tuần thu hoạch). Nguồn: view `v_fp_farm_dgdv_tong_ngay_day` (đã cộng mọi
 * chuyến) + `v_fp_farm_dgdv_tong_chuyen` (đếm chuyến); gom / lọc ở core/tong-hop. Xuất Excel: bảng tổ trưởng → lô
 * dạng phẳng của các chi nhánh đang hiện (`cotXuatTuan`, `dongXuatTuan`).
 */
import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AnimatePresence } from 'framer-motion';
import { AlertTriangle, Building2, CalendarRange, ChevronLeft, ChevronRight, FileSpreadsheet, Printer, UserRound } from 'lucide-react';
import DashboardToolbar from '../../../../components/shared/DashboardToolbar';
import ResponsiveFilterChips, { type FilterChipItem } from '../../../../components/shared/ResponsiveFilterChips';
import GenericTable from '../../../../components/shared/GenericTable';
import ExportDialog from '../../../../components/shared/LazyExportDialog';
import { MobileFilterField, type FilterGroup } from '../../../../components/ui/MobileFilterSheet';
import Button from '../../../../components/ui/Button';
import Tooltip from '../../../../components/ui/Tooltip';
import { cn, formatNumberVN, formatYmdToDisplay, getTodayISO } from '../../../../lib/utils';
import { cacNgayCuaTuanFarm, nhanTuanFarm, soSanhTuan, tuanFarmCuaNgay, tuanKeTiep } from '../core/tuan';
import {
  LOC_KSC,
  dsToTruong,
  khopLocKsc,
  locDongTheoToTruong,
  tongHopTuanChiNhanh,
  tongHopTuanTheoLo,
  type DgdvTuanChiNhanhDong,
} from '../core/tong-hop';
import { useDgdvTongChuyen, useDgdvTongNgayDay } from '../hooks/use-dgdv-tong-ngay';
import { useDgdvChiNhanhXem } from '../hooks/use-dgdv-chi-nhanh-xem';
import { useDgdvTongTuanStore } from '../store/useDgdvTongHopStore';
import { nhanTiLeKsc } from '../utils/export-danh-sach';
import { cotXuatTuan, dongXuatTuan } from '../utils/export-tong-hop';
import { getDgdvInTuanUrl } from '../utils/preview-url';
import { fmtO } from './tong-hop/bang-tong-hop';
import TongTuanDetail from './tong-hop/TongTuanDetail';

const KHONG_CHON = new Set<string>();
const boQua = () => undefined;

const TongHopTuanTab: React.FC = () => {
  const { t } = useTranslation();
  const homNay = getTodayISO();
  const tuanNay = useMemo(() => tuanFarmCuaNgay(homNay), [homNay]);
  const [tuan, setTuan] = useState(tuanNay);
  const [moXuat, setMoXuat] = useState(false);
  const [xemCn, setXemCn] = useState<string | null>(null);
  const { filters, setFilter, resetFilters, columns, resizeColumn, pagination, setPage, setPageSize } = useDgdvTongTuanStore();
  const chonCn = filters.id_chi_nhanh;

  // Một chi nhánh → lọc ở server; nhiều / tất cả → tải cả phạm vi rồi lọc tại chỗ.
  const { dsChiNhanh, tenCn, phamVi, thuTuCn, dangTaiPhamVi } = useDgdvChiNhanhXem(chonCn.length === 1 ? chonCn[0] : null);
  const ngays = useMemo(() => cacNgayCuaTuanFarm(tuan.nam, tuan.tuan), [tuan]);
  const q = useDgdvTongNgayDay(ngays[0], ngays[6], phamVi, !dangTaiPhamVi);
  const qChuyen = useDgdvTongChuyen(ngays[0], ngays[6], phamVi, !dangTaiPhamVi);
  /** Cột T2→CN kèm ngày dd/mm của tuần đang xem. */
  const cotHien = useMemo(
    () =>
      columns.map((c) => {
        const m = /^n(\d)$/.exec(c.id);
        return m ? { ...c, label: `${t(`danhGiaDauVao.thu.${m[1]}`)} ${formatYmdToDisplay(ngays[Number(m[1])]).slice(0, 5)}` } : c;
      }),
    [columns, ngays, t]
  );

  /** Dòng view của các chi nhánh đang chọn. */
  const rowsCn = useMemo(() => {
    const ds = q.data ?? [];
    if (chonCn.length <= 1) return ds;
    const cho = new Set(chonCn);
    return ds.filter((r) => cho.has(r.id_chi_nhanh));
  }, [q.data, chonCn]);
  const rows = useMemo(() => locDongTheoToTruong(rowsCn, filters.to_truong), [rowsCn, filters.to_truong]);
  const tatCaDong = useMemo(() => tongHopTuanChiNhanh(rows, ngays, thuTuCn, qChuyen.data ?? []), [rows, ngays, thuTuCn, qChuyen.data]);
  const dsDong = useMemo(() => tatCaDong.filter((r) => khopLocKsc(r.ksc, filters.ksc)), [tatCaDong, filters.ksc]);
  const tong = useMemo(
    () =>
      dsDong.reduce(
        (s, r) => ({
          tongThu: s.tongThu + r.tongThu,
          ksc: s.ksc + r.ksc,
          soChuyen: s.soChuyen + r.soChuyen,
          theoNgay: s.theoNgay.map((v, i) => v + r.theoNgay[i]),
        }),
        { tongThu: 0, ksc: 0, soChuyen: 0, theoNgay: ngays.map(() => 0) }
      ),
    [dsDong, ngays]
  );
  const toTruongTuyChon = useMemo(() => dsToTruong(rowsCn.map((r) => r.to_truong)), [rowsCn]);
  const tenToTruongLoc = toTruongTuyChon.filter((x) => filters.to_truong.includes(x.khoa)).map((x) => x.ten);
  const coSo = dsDong.length > 0;

  /** Dòng view của các chi nhánh đang hiện trong bảng (sau chip KSC). */
  const rowsHien = useMemo(() => {
    const cn = new Set(dsDong.map((r) => r.id_chi_nhanh));
    return rows.filter((r) => cn.has(r.id_chi_nhanh));
  }, [rows, dsDong]);
  const exportColumns = useMemo(() => cotXuatTuan(ngays, t), [ngays, t]);
  const exportData = useMemo(
    () => (moXuat ? dongXuatTuan(tongHopTuanTheoLo(rowsHien, ngays, thuTuCn), tenCn, t) : []),
    [moXuat, rowsHien, ngays, thuTuCn, tenCn, t]
  );

  const doiTuan = (tf: typeof tuan) => {
    setTuan(tf);
    setPage(1);
  };
  const chonKy = (inline: boolean) => (
    <div className={cn('inline-flex items-center gap-1', inline ? 'w-full' : 'shrink-0')}>
      <Button variant="outline" size="sm" className="h-9 w-9 p-0 shrink-0" onClick={() => doiTuan(tuanKeTiep(tuan, -1))} aria-label={t('danhGiaDauVao.tuan.tuanTruoc')}>
        <ChevronLeft className="w-4 h-4" />
      </Button>
      <button
        type="button"
        className={cn('h-9 rounded-md border border-border px-2.5 text-sm font-medium tabular-nums whitespace-nowrap hover:bg-muted/50', inline && 'flex-1')}
        title={t('danhGiaDauVao.tuan.veTuanNay')}
        onClick={() => doiTuan(tuanNay)}
      >
        {nhanTuanFarm(tuan)}
        {soSanhTuan(tuan, tuanNay) === 0 && <span className="ml-1 text-caption text-primary">· {t('danhGiaDauVao.bang.tuanNay')}</span>}
      </button>
      <Button variant="outline" size="sm" className="h-9 w-9 p-0 shrink-0" onClick={() => doiTuan(tuanKeTiep(tuan, 1))} aria-label={t('danhGiaDauVao.tuan.tuanSau')}>
        <ChevronRight className="w-4 h-4" />
      </Button>
    </div>
  );

  const filterGroups: FilterGroup[] = useMemo(() => {
    const dem = (fn: (r: DgdvTuanChiNhanhDong) => boolean) => tatCaDong.filter(fn).length;
    return [
      {
        key: 'branch',
        label: t('danhGiaDauVao.toolbar.filterBranch'),
        icon: Building2,
        options: dsChiNhanh.map((b) => ({ value: String(b.id), label: `${b.ma_chi_nhanh} — ${b.ten_chi_nhanh}` })),
        value: filters.id_chi_nhanh,
        onChange: (v: string[]) => setFilter('id_chi_nhanh', v),
      },
      {
        key: 'ksc',
        label: t('danhGiaDauVao.tongHop.filterKsc'),
        icon: AlertTriangle,
        options: [
          { value: LOC_KSC.CO, label: t('danhGiaDauVao.tongHop.coLoi'), count: dem((r) => r.ksc > 0) },
          { value: LOC_KSC.KHONG, label: t('danhGiaDauVao.tongHop.khongLoi'), count: dem((r) => r.ksc === 0) },
        ],
        value: filters.ksc,
        onChange: (v: string[]) => setFilter('ksc', v),
      },
      {
        key: 'to_truong',
        label: t('danhGiaDauVao.form.toTruong'),
        icon: UserRound,
        options: toTruongTuyChon.map((x) => ({ value: x.khoa, label: x.ten })),
        value: filters.to_truong,
        onChange: (v: string[]) => setFilter('to_truong', v),
      },
    ];
  }, [t, tatCaDong, dsChiNhanh, toTruongTuyChon, filters, setFilter]);
  const filterItems: FilterChipItem[] = [
    { kind: 'custom', key: 'ky', node: chonKy(false) },
    { kind: 'group', group: filterGroups[0], className: 'w-full sm:w-[200px]' },
    { kind: 'group', group: filterGroups[1], className: 'w-full sm:w-[140px]' },
    { kind: 'group', group: filterGroups[2], className: 'w-full sm:w-[180px]' },
  ];

  const iconBtn = 'h-9 w-9 p-0 inline-flex items-center justify-center border-border text-muted-foreground hover:bg-muted/50';
  const actions = (
    <div className="flex items-center gap-2">
      <Tooltip content={t('danhGiaDauVao.bang.in')} placement="bottom">
        <Button
          variant="outline"
          size="sm"
          className={iconBtn}
          disabled={!coSo}
          onClick={() => window.open(getDgdvInTuanUrl(tuan.nam, tuan.tuan, chonCn, filters.to_truong, filters.ksc), '_blank', 'noopener,noreferrer')}
          aria-label={t('danhGiaDauVao.bang.in')}
        >
          <Printer className="w-4 h-4" />
        </Button>
      </Tooltip>
      <Tooltip content={t('danhGiaDauVao.bang.xuatExcel')} placement="bottom">
        <Button variant="outline" size="sm" className={iconBtn} disabled={!coSo} onClick={() => setMoXuat(true)} aria-label={t('danhGiaDauVao.bang.xuatExcel')}>
          <FileSpreadsheet className="w-4 h-4" />
        </Button>
      </Tooltip>
    </div>
  );

  const renderCell = (colId: string, r: DgdvTuanChiNhanhDong) => {
    const m = /^n(\d)$/.exec(colId);
    if (m) return <span className="text-sm tabular-nums">{fmtO(r.theoNgay[Number(m[1])] ?? 0)}</span>;
    switch (colId) {
      case 'tuan':
        return <span className="text-sm tabular-nums whitespace-nowrap">{nhanTuanFarm(tuan)}</span>;
      case 'id_chi_nhanh':
        return <span className="text-sm font-medium">{tenCn(r.id_chi_nhanh)}</span>;
      case 'so_ngay':
        return <span className="text-sm tabular-nums">{r.soNgayCoSo}</span>;
      case 'so_chuyen':
        return <span className="text-sm tabular-nums">{r.soChuyen}</span>;
      case 'tong_thu':
        return <span className="text-sm tabular-nums font-semibold text-primary">{formatNumberVN(r.tongThu)}</span>;
      case 'ksc':
        return <span className={cn('text-sm tabular-nums', r.ksc > 0 && 'text-rose-600 font-medium')}>{formatNumberVN(r.ksc)}</span>;
      case 'ti_le_ksc':
        return <span className="text-sm tabular-nums text-muted-foreground">{nhanTiLeKsc(r.ksc, r.tongThu)}</span>;
      default:
        return null;
    }
  };
  const renderTong = (colId: string) => {
    const m = /^n(\d)$/.exec(colId);
    if (m) return <span className="text-xs font-semibold tabular-nums">{fmtO(tong.theoNgay[Number(m[1])] ?? 0)}</span>;
    switch (colId) {
      case 'tuan':
        return <span className="text-xs font-semibold">{t('danhGiaDauVao.luoi.tongCong')}</span>;
      case 'so_chuyen':
        return <span className="text-xs font-semibold tabular-nums">{tong.soChuyen}</span>;
      case 'tong_thu':
        return <span className="text-xs font-bold tabular-nums text-primary">{formatNumberVN(tong.tongThu)}</span>;
      case 'ksc':
        return <span className="text-xs font-bold tabular-nums text-rose-600">{formatNumberVN(tong.ksc)}</span>;
      case 'ti_le_ksc':
        return <span className="text-xs font-semibold tabular-nums">{nhanTiLeKsc(tong.ksc, tong.tongThu)}</span>;
      default:
        return null;
    }
  };
  const renderMobileCard = (r: DgdvTuanChiNhanhDong) => (
    <div
      role="button"
      tabIndex={0}
      onClick={() => setXemCn(r.id_chi_nhanh)}
      onKeyDown={(e) => e.key === 'Enter' && setXemCn(r.id_chi_nhanh)}
      className="bg-card rounded-xl border border-border p-3.5 shadow-sm"
    >
      <h4 className="font-semibold text-foreground text-sm truncate">{tenCn(r.id_chi_nhanh)}</h4>
      <p className="text-xs text-muted-foreground truncate mt-0.5 tabular-nums">
        {nhanTuanFarm(tuan)} · {t('danhGiaDauVao.tongHop.ngayChuyenGiaTri', { ngay: r.soNgayCoSo, chuyen: r.soChuyen })}
      </p>
      <div className="mt-2 grid grid-cols-3 gap-2 text-sm tabular-nums">
        <div className="rounded-lg bg-muted/40 px-2.5 py-2">
          <div className="text-xs text-muted-foreground">{t('danhGiaDauVao.tuan.colTongTuan')}</div>
          <div className="font-semibold text-primary">{formatNumberVN(r.tongThu)}</div>
        </div>
        <div className="rounded-lg bg-muted/40 px-2.5 py-2">
          <div className="text-xs text-muted-foreground">{t('danhGiaDauVao.store.colKsc')}</div>
          <div className="font-semibold">{formatNumberVN(r.ksc)}</div>
        </div>
        <div className="rounded-lg bg-muted/40 px-2.5 py-2">
          <div className="text-xs text-muted-foreground">{t('danhGiaDauVao.store.colTiLeKsc')}</div>
          <div className="font-semibold">{nhanTiLeKsc(r.ksc, r.tongThu)}</div>
        </div>
      </div>
    </div>
  );

  const dongXem = xemCn ? tatCaDong.find((r) => r.id_chi_nhanh === xemCn) : undefined;
  const rowsXem = useMemo(() => (xemCn ? rows.filter((r) => r.id_chi_nhanh === xemCn) : []), [rows, xemCn]);

  return (
    <div className="flex-1 min-h-0 flex flex-col rounded-xl border border-border bg-card shadow-sm overflow-hidden">
      <DashboardToolbar
        hideBack
        filters={<ResponsiveFilterChips items={filterItems} />}
        filterGroups={filterGroups}
        mobileFilterExtra={
          <MobileFilterField label={t('danhGiaDauVao.tuan.chonTuan')} icon={CalendarRange} active>
            {chonKy(true)}
          </MobileFilterField>
        }
        mobileFilterExtraCount={1}
        activeFilterCount={filters.id_chi_nhanh.length + filters.ksc.length + filters.to_truong.length}
        onClearFilters={resetFilters}
        actions={actions}
        mobileActions={actions}
        mobileRow2Content={chonKy(true)}
        className="static z-auto border-b border-border"
      />

      <div className="flex-1 min-h-0 flex flex-col px-4 pb-4 pt-1">
        <GenericTable<DgdvTuanChiNhanhDong>
          data={dsDong}
          columns={cotHien}
          onResizeColumn={resizeColumn}
          isLoading={q.isPending || dangTaiPhamVi}
          isError={q.isError}
          onRetry={() => void q.refetch()}
          loadingText={t('danhGiaDauVao.loading')}
          selectedIds={KHONG_CHON}
          onToggleSelection={boQua}
          onToggleAll={boQua}
          page={pagination.page}
          pageSize={pagination.pageSize}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
          renderCell={renderCell}
          renderMobileCard={renderMobileCard}
          renderSummaryRow={coSo ? renderTong : undefined}
          keyExtractor={(r) => r.id_chi_nhanh}
          onRowClick={(r) => setXemCn(r.id_chi_nhanh)}
          showActionsColumn={false}
          emptyTitle={t('danhGiaDauVao.tuan.khongCoDuLieu')}
          emptyDescription={t('danhGiaDauVao.bang.khongCoDuLieuHint')}
        />
      </div>

      <AnimatePresence>
        {dongXem && (
          <TongTuanDetail
            tuan={tuan}
            ngays={ngays}
            dong={dongXem}
            tenChiNhanh={tenCn(dongXem.id_chi_nhanh)}
            rows={rowsXem}
            tenToTruongLoc={tenToTruongLoc}
            toTruong={filters.to_truong}
            ksc={filters.ksc}
            onClose={() => setXemCn(null)}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {moXuat && (
          <ExportDialog
            open={moXuat}
            onClose={() => setMoXuat(false)}
            columns={exportColumns}
            data={exportData}
            fileName={`danh-gia-dau-vao-tuan-${tuan.nam}-${String(tuan.tuan).padStart(2, '0')}`}
            sheetName={t('danhGiaDauVao.tabs.tongHopTuan')}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default TongHopTuanTab;
