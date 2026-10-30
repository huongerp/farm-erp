/**
 * Tab «Tổng hợp tuần» — CHỈ XEM, khuôn list chuẩn: `DashboardToolbar` (chip Kỳ — mặc định «Tất cả» + chip Chi nhánh
 * đa chọn / Có KSC / Tổ trưởng, In, Xuất Excel) + `GenericTable` mỗi dòng = tuần farm × chi nhánh (số ngày có số,
 * số chuyến, T2→CN, tổng tuần, KSC, % huỷ, sơ chế theo Báo cáo sơ chế, % BC cuối ngày; dòng tổng trên đầu bảng) →
 * bấm dòng mở Detail tổng tuần (`tong-hop/TongTuanDetail`: tổ trưởng → lô × ngày, theo dây / tuần thu hoạch — tải
 * view tổng ngày × dây của riêng tuần đó). Nguồn bảng: view `v_fp_farm_dgdv_tong_chuyen` (gom `tongHopTuanTuChuyen`);
 * lọc tổ trưởng → tổng lấy từ view tổng ngày × dây đã lọc ở server. In: trang in tuần — chỉ khi mọi dòng cùng một tuần.
 */
import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AnimatePresence } from 'framer-motion';
import { AlertTriangle, Building2, CalendarRange, FileSpreadsheet, Printer, UserRound } from 'lucide-react';
import DashboardToolbar from '../../../../components/shared/DashboardToolbar';
import ResponsiveFilterChips, { type FilterChipItem } from '../../../../components/shared/ResponsiveFilterChips';
import GenericTable from '../../../../components/shared/GenericTable';
import ExportDialog from '../../../../components/shared/LazyExportDialog';
import DateRangePicker from '../../../../components/ui/DateRangePicker';
import { MobileFilterField, type FilterGroup } from '../../../../components/ui/MobileFilterSheet';
import Button from '../../../../components/ui/Button';
import Tooltip from '../../../../components/ui/Tooltip';
import { cn, formatNumberVN } from '../../../../lib/utils';
import { cacNgayCuaTuanFarm, nhanTuanFarm } from '../core/tuan';
import { khoaTen } from '../core/chuan-hoa-ten';
import { LOC_KSC, dsToTruong, khopLocKsc, tongHopTuanTuChuyen, tongTheoNgayChiNhanh, type DgdvTuanKyDong } from '../core/tong-hop';
import { useBcscSoChe, useDgdvTenToTruong, useDgdvTongChuyen, useDgdvTongNgayDay } from '../hooks/use-dgdv-tong-ngay';
import { useDgdvChiNhanhXem } from '../hooks/use-dgdv-chi-nhanh-xem';
import { useKyDgdv } from '../hooks/use-ky-dgdv';
import type { DgdvPhamViTong } from '../services/danh-gia-dau-vao-tong-ngay.service';
import { useDgdvTongTuanStore } from '../store/useDgdvTongHopStore';
import { nhanTiLeKsc } from '../utils/export-danh-sach';
import { cotXuatTuanKy, dongXuatTuanKy } from '../utils/export-tong-hop';
import { getDgdvInTuanUrl } from '../utils/preview-url';
import { fmtO } from './tong-hop/bang-tong-hop';
import TongTuanDetail from './tong-hop/TongTuanDetail';

const KHONG_CHON = new Set<string>();
const boQua = () => undefined;

/** Detail tổng tuần: tải dòng tổng ngày × dây của riêng (tuần, chi nhánh) được bấm. */
const TongTuanDetailTai: React.FC<{
  dong: DgdvTuanKyDong;
  phamVi: DgdvPhamViTong;
  /** tên tổ trưởng gốc đang lọc; null = không lọc */
  tenGocLoc: readonly string[] | null;
  tenChiNhanh: string;
  tenToTruongLoc: string[];
  toTruong: string[];
  ksc: string[];
  onClose: () => void;
}> = ({ dong, phamVi, tenGocLoc, ...rest }) => {
  const tuan = useMemo(() => ({ nam: dong.nam, tuan: dong.tuan }), [dong.nam, dong.tuan]);
  const ngays = useMemo(() => cacNgayCuaTuanFarm(dong.nam, dong.tuan), [dong.nam, dong.tuan]);
  const pv = useMemo(() => ({ ...phamVi, idChiNhanh: dong.id_chi_nhanh }), [phamVi, dong.id_chi_nhanh]);
  const q = useDgdvTongNgayDay(ngays[0], ngays[6], pv, true, tenGocLoc ?? undefined);
  if (!q.data) return null;
  return <TongTuanDetail tuan={tuan} ngays={ngays} dong={dong} rows={q.data} {...rest} />;
};

const TongHopTuanTab: React.FC = () => {
  const { t } = useTranslation();
  const [moXuat, setMoXuat] = useState(false);
  const [xemKhoa, setXemKhoa] = useState<string | null>(null);
  const { filters, setFilter, resetFilters, columns, resizeColumn, pagination, setPage, setPageSize } = useDgdvTongTuanStore();
  const ky = useKyDgdv(() => setPage(1));
  const khoang = ky.khoang;
  const chonCn = filters.id_chi_nhanh;

  // Một chi nhánh → lọc ở server; nhiều / tất cả → tải cả phạm vi rồi lọc tại chỗ.
  const { dsChiNhanh, tenCn, phamVi, thuTuCn, dangTaiPhamVi } = useDgdvChiNhanhXem(chonCn.length === 1 ? chonCn[0] : null);
  const q = useDgdvTongChuyen(khoang.tu, khoang.den, phamVi, !dangTaiPhamVi);
  const qSoChe = useBcscSoChe(khoang.tu, khoang.den, phamVi, !dangTaiPhamVi);

  // Tổ trưởng: tuỳ chọn từ mọi tên đã nhập ở lô; đang lọc → tổng lấy từ view tổng ngày × dây của các tên đó.
  const qTen = useDgdvTenToTruong();
  const toTruongTuyChon = useMemo(() => dsToTruong(qTen.data ?? []), [qTen.data]);
  const locToTruong = filters.to_truong.length > 0;
  const tenGocLoc = useMemo(() => {
    const cho = new Set(filters.to_truong);
    return (qTen.data ?? []).filter((x) => cho.has(khoaTen(x)));
  }, [qTen.data, filters.to_truong]);
  const qLoc = useDgdvTongNgayDay(khoang.tu, khoang.den, phamVi, !dangTaiPhamVi && locToTruong && !!qTen.data, tenGocLoc, true);
  const tongLoc = useMemo(() => (locToTruong ? tongTheoNgayChiNhanh(qLoc.data ?? []) : null), [locToTruong, qLoc.data]);

  const tatCaDong = useMemo(() => {
    const ds = q.data ?? [];
    const cho = chonCn.length > 1 ? new Set(chonCn) : null;
    return tongHopTuanTuChuyen(cho ? ds.filter((c) => cho.has(c.id_chi_nhanh)) : ds, { thuTuCn, soChe: qSoChe.data, tongLoc });
  }, [q.data, chonCn, thuTuCn, qSoChe.data, tongLoc]);
  const dsDong = useMemo(() => tatCaDong.filter((r) => khopLocKsc(r.ksc, filters.ksc)), [tatCaDong, filters.ksc]);
  const tong = useMemo(
    () =>
      dsDong.reduce(
        (s, r) => ({
          tongThu: s.tongThu + r.tongThu,
          ksc: s.ksc + r.ksc,
          soChuyen: s.soChuyen + r.soChuyen,
          theoNgay: s.theoNgay.map((v, i) => v + r.theoNgay[i]),
          soChe: s.soChe + (r.soChe ?? 0),
          thuCoBc: s.thuCoBc + r.thuCoBc,
          coBc: s.coBc || r.soChe != null,
        }),
        { tongThu: 0, ksc: 0, soChuyen: 0, theoNgay: [0, 0, 0, 0, 0, 0, 0], soChe: 0, thuCoBc: 0, coBc: false }
      ),
    [dsDong]
  );
  const tenToTruongLoc = toTruongTuyChon.filter((x) => filters.to_truong.includes(x.khoa)).map((x) => x.ten);
  const coSo = dsDong.length > 0;
  const dangTai = q.isPending || dangTaiPhamVi || (locToTruong && (qTen.isPending || qLoc.isPending));
  /** Trang in tuần in một tuần: chỉ bật khi mọi dòng đang hiện cùng một tuần. */
  const tuanIn = coSo && dsDong.every((r) => r.nam === dsDong[0].nam && r.tuan === dsDong[0].tuan) ? dsDong[0] : null;

  const exportColumns = useMemo(() => cotXuatTuanKy(t), [t]);
  const exportData = useMemo(() => (moXuat ? dongXuatTuanKy(dsDong, tenCn) : []), [moXuat, dsDong, tenCn]);

  const chonKy = (inline: boolean) => (
    <DateRangePicker
      inline={inline}
      presets={ky.presets}
      value={ky.value}
      onChange={ky.onChange}
      customPresetId="custom"
      displayLabel={inline ? undefined : ky.displayLabel}
      className={inline ? undefined : 'shrink-0'}
    />
  );

  const filterGroups: FilterGroup[] = useMemo(() => {
    const dem = (fn: (r: DgdvTuanKyDong) => boolean) => tatCaDong.filter(fn).length;
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
      <Tooltip content={tuanIn ? t('danhGiaDauVao.bang.in') : t('danhGiaDauVao.tuan.inMotTuan')} placement="bottom">
        <Button
          variant="outline"
          size="sm"
          className={iconBtn}
          disabled={!tuanIn}
          onClick={() =>
            tuanIn && window.open(getDgdvInTuanUrl(tuanIn.nam, tuanIn.tuan, chonCn, filters.to_truong, filters.ksc), '_blank', 'noopener,noreferrer')
          }
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

  const renderCell = (colId: string, r: DgdvTuanKyDong) => {
    const m = /^n(\d)$/.exec(colId);
    if (m) return <span className="text-sm tabular-nums">{fmtO(r.theoNgay[Number(m[1])] ?? 0)}</span>;
    switch (colId) {
      case 'tuan':
        return <span className="text-sm tabular-nums whitespace-nowrap">{nhanTuanFarm(r)}</span>;
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
      case 'so_che':
        return <span className="text-sm tabular-nums">{r.soChe == null ? '–' : formatNumberVN(r.soChe)}</span>;
      case 'ti_le_so_che':
        return <span className="text-sm tabular-nums text-muted-foreground">{r.soChe == null ? '–' : nhanTiLeKsc(r.soChe, r.thuCoBc)}</span>;
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
      case 'so_che':
        return <span className="text-xs font-semibold tabular-nums">{tong.coBc ? formatNumberVN(tong.soChe) : '–'}</span>;
      case 'ti_le_so_che':
        return <span className="text-xs font-semibold tabular-nums">{tong.coBc ? nhanTiLeKsc(tong.soChe, tong.thuCoBc) : '–'}</span>;
      default:
        return null;
    }
  };
  const renderMobileCard = (r: DgdvTuanKyDong) => (
    <div
      role="button"
      tabIndex={0}
      onClick={() => setXemKhoa(r.khoa)}
      onKeyDown={(e) => e.key === 'Enter' && setXemKhoa(r.khoa)}
      className="bg-card rounded-xl border border-border p-3.5 shadow-sm"
    >
      <h4 className="font-semibold text-foreground text-sm truncate">{tenCn(r.id_chi_nhanh)}</h4>
      <p className="text-xs text-muted-foreground truncate mt-0.5 tabular-nums">
        {nhanTuanFarm(r)} · {t('danhGiaDauVao.tongHop.ngayChuyenGiaTri', { ngay: r.soNgayCoSo, chuyen: r.soChuyen })}
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
      {r.soChe != null && (
        <p className="mt-2 text-xs text-muted-foreground tabular-nums">
          {t('danhGiaDauVao.store.colSoChe')}: <span className="font-medium text-foreground">{formatNumberVN(r.soChe)}</span> ·{' '}
          {t('danhGiaDauVao.store.colTiLeSoChe')}: <span className="font-medium text-foreground">{nhanTiLeKsc(r.soChe, r.thuCoBc)}</span>
        </p>
      )}
    </div>
  );

  const dongXem = xemKhoa ? tatCaDong.find((r) => r.khoa === xemKhoa) : undefined;

  return (
    <div className="flex-1 min-h-0 flex flex-col rounded-xl border border-border bg-card shadow-sm overflow-hidden">
      <DashboardToolbar
        hideBack
        filters={<ResponsiveFilterChips items={filterItems} />}
        filterGroups={filterGroups}
        mobileFilterExtra={
          <MobileFilterField label={ky.nhan || t('danhGiaDauVao.tuan.chonTuan')} icon={CalendarRange} active>
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
        <GenericTable<DgdvTuanKyDong>
          data={dsDong}
          columns={columns}
          onResizeColumn={resizeColumn}
          isLoading={dangTai}
          isError={q.isError || qLoc.isError}
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
          keyExtractor={(r) => r.khoa}
          onRowClick={(r) => setXemKhoa(r.khoa)}
          showActionsColumn={false}
          emptyTitle={t('danhGiaDauVao.tuan.khongCoDuLieu')}
          emptyDescription={t('danhGiaDauVao.bang.khongCoDuLieuHint')}
        />
      </div>

      <AnimatePresence>
        {dongXem && (
          <TongTuanDetailTai
            key={dongXem.khoa}
            dong={dongXem}
            phamVi={phamVi}
            tenGocLoc={locToTruong ? tenGocLoc : null}
            tenChiNhanh={tenCn(dongXem.id_chi_nhanh)}
            tenToTruongLoc={tenToTruongLoc}
            toTruong={filters.to_truong}
            ksc={filters.ksc}
            onClose={() => setXemKhoa(null)}
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
            fileName="danh-gia-dau-vao-tong-hop-tuan"
            sheetName={t('danhGiaDauVao.tabs.tongHopTuan')}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default TongHopTuanTab;
