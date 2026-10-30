/**
 * Tab «Tổng hợp ngày» (id `bang` — giữ cho link `DGDV_BANG_DANH_GIA_URL` từ Báo cáo sơ chế / Dự báo), CHỈ XEM.
 * Khuôn list chuẩn: `DashboardToolbar` (chip Kỳ — mặc định «Tất cả» + chip Chi nhánh / Trạng thái / Có KSC / Tổ trưởng,
 * In, Xuất Excel lưới đã gộp) + `GenericTable` mỗi dòng = ngày × chi nhánh (cộng mọi chuyến, dòng tổng trên đầu
 * bảng) → bấm dòng mở Detail tổng ngày (`tong-hop/TongNgayDetail`, tải phiếu đầy đủ của riêng ngày đó).
 * Dữ liệu bảng: view tổng chuyến (nhẹ, đủ cho kỳ dài) + Tổng buồng sơ chế của Báo cáo sơ chế (cột % BC cuối ngày);
 * lọc tổ trưởng → tổng lấy từ view tổng ngày × dây đã lọc ở server. In / Xuất lưới cần phiếu đầy đủ → chỉ khi kỳ
 * ≤ `SO_NGAY_TOI_DA` ngày. Nhập / sửa số ở Detail phiếu chuyến.
 */
import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { AlertTriangle, Building2, Calendar, FileSpreadsheet, Printer, ToggleLeft, UserRound } from 'lucide-react';
import DashboardToolbar from '../../../../components/shared/DashboardToolbar';
import ResponsiveFilterChips, { type FilterChipItem } from '../../../../components/shared/ResponsiveFilterChips';
import GenericTable from '../../../../components/shared/GenericTable';
import DateRangePicker from '../../../../components/ui/DateRangePicker';
import { MobileFilterField, type FilterGroup } from '../../../../components/ui/MobileFilterSheet';
import Button from '../../../../components/ui/Button';
import Tooltip from '../../../../components/ui/Tooltip';
import { cn, formatNumberVN, formatYmdToDisplay } from '../../../../lib/utils';
import { TRANG_THAI } from '../../../../lib/constants';
import { useBranches } from '../../../he-thong/chi-nhanh/hooks/use-chi-nhanh';
import { useDgdvTheoKhoang } from '../hooks/use-danh-gia-dau-vao';
import { useDgdvViewScope } from '../hooks/use-danh-gia-dau-vao-permissions';
import { useMauDay } from '../hooks/use-danh-muc-dgdv';
import { useBcscSoChe, useDgdvTenToTruong, useDgdvTongChuyen, useDgdvTongNgayDay } from '../hooks/use-dgdv-tong-ngay';
import { useKyDgdv } from '../hooks/use-ky-dgdv';
import { getDgdvTheoKhoangNgay } from '../services/danh-gia-dau-vao-service';
import type { DgdvPhamViTong } from '../services/danh-gia-dau-vao-tong-ngay.service';
import { dungLuoiKhoangNgay } from '../core/bang-tinh';
import { khoaTen } from '../core/chuan-hoa-ten';
import { nhanTuanFarm } from '../core/tuan';
import {
  LOC_KSC,
  LOC_TRANG_THAI_NGAY,
  dsToTruong,
  locNgayChiNhanh,
  locPhieuTheoToTruong,
  tongHopNgayTuChuyen,
  tongTheoNgayChiNhanh,
  type DgdvNgayChiNhanh,
} from '../core/tong-hop';
import type { DgdvPhieuDayDu } from '../core/types';
import { useDgdvTongNgayStore } from '../store/useDgdvTongHopStore';
import { nhanTiLeKsc } from '../utils/export-danh-sach';
import { SO_NGAY_TOI_DA, soNgayCuaKhoang } from '../utils/khoang-ngay';
import { getDgdvPreviewUrl } from '../utils/preview-url';
import { taiXlsxLuoi } from '../utils/export-luoi';
import { TrangThaiDgdvBadge } from './DgdvList';
import TongNgayDetail from './tong-hop/TongNgayDetail';

const KHONG_CHON = new Set<string>();
const boQua = () => undefined;

/** Detail tổng ngày: tải phiếu đầy đủ của riêng (ngày, chi nhánh) được bấm rồi mới mở drawer. */
const TongNgayDetailTai: React.FC<{
  dong: DgdvNgayChiNhanh;
  phamVi: DgdvPhamViTong;
  toTruong: readonly string[];
  tenToTruongLoc: string[];
  onClose: () => void;
}> = ({ dong, phamVi, toTruong, tenToTruongLoc, onClose }) => {
  const q = useDgdvTheoKhoang(dong.ngay, dong.ngay, dong.id_chi_nhanh, phamVi.viewAll, phamVi.allowedBranchIds);
  const goc = useMemo(() => (q.data ?? []).filter((p) => p.id_chi_nhanh === dong.id_chi_nhanh), [q.data, dong.id_chi_nhanh]);
  const loc = useMemo(() => locPhieuTheoToTruong(goc, toTruong), [goc, toTruong]);
  if (!q.data) return null;
  return <TongNgayDetail dong={dong} dsPhieu={loc} dsPhieuGoc={goc} tenToTruongLoc={tenToTruongLoc} onClose={onClose} />;
};

const BangDanhGiaTab: React.FC = () => {
  const { t } = useTranslation();
  const [dangXuat, setDangXuat] = useState(false);
  const [xemKhoa, setXemKhoa] = useState<string | null>(null);
  const { filters, setFilter, resetFilters, columns, resizeColumn, pagination, setPage, setPageSize } = useDgdvTongNgayStore();
  const ky = useKyDgdv(() => setPage(1));
  const khoang = ky.khoang;
  const chonCn = filters.id_chi_nhanh;

  const viewScope = useDgdvViewScope();
  const { data: branches = [] } = useBranches();
  const { mauTheoId } = useMauDay();

  /** Chi nhánh trong phạm vi xem (đang dùng). */
  const dsChiNhanh = useMemo(() => {
    const dangDung = branches.filter((b) => b.trang_thai === TRANG_THAI.DANG_DUNG);
    if (viewScope.viewAll) return dangDung;
    const cho = new Set(viewScope.allowedBranchIds.map(String));
    return dangDung.filter((b) => cho.has(String(b.id)));
  }, [branches, viewScope.viewAll, viewScope.allowedBranchIds]);
  const thuTuCn = useMemo(() => dsChiNhanh.map((b) => String(b.id)), [dsChiNhanh]);
  const tenTheoId = useMemo(() => new Map(branches.map((b) => [String(b.id), b.ten_chi_nhanh])), [branches]);

  // Một chi nhánh → lọc ở server; nhiều / tất cả → tải cả phạm vi rồi lọc tại chỗ.
  const phamVi: DgdvPhamViTong = useMemo(
    () => ({ idChiNhanh: chonCn.length === 1 ? chonCn[0] : null, viewAll: viewScope.viewAll, allowedBranchIds: viewScope.allowedBranchIds }),
    [chonCn, viewScope.viewAll, viewScope.allowedBranchIds]
  );
  const sanSang = !viewScope.isLoading;
  const q = useDgdvTongChuyen(khoang.tu, khoang.den, phamVi, sanSang);
  const qSoChe = useBcscSoChe(khoang.tu, khoang.den, phamVi, sanSang);

  // Tổ trưởng: tuỳ chọn từ mọi tên đã nhập ở lô; đang lọc → tải dòng tổng ngày × dây của các tên đó (lọc ở server).
  const qTen = useDgdvTenToTruong();
  const toTruongTuyChon = useMemo(() => dsToTruong(qTen.data ?? []), [qTen.data]);
  const locToTruong = filters.to_truong.length > 0;
  const tenGocLoc = useMemo(() => {
    const cho = new Set(filters.to_truong);
    return (qTen.data ?? []).filter((x) => cho.has(khoaTen(x)));
  }, [qTen.data, filters.to_truong]);
  const qLoc = useDgdvTongNgayDay(khoang.tu, khoang.den, phamVi, sanSang && locToTruong && !!qTen.data, tenGocLoc, true);
  const tongLoc = useMemo(() => (locToTruong ? tongTheoNgayChiNhanh(qLoc.data ?? []) : null), [locToTruong, qLoc.data]);

  const tatCaDong = useMemo(() => {
    const ds = q.data ?? [];
    const cho = chonCn.length > 1 ? new Set(chonCn) : null;
    return tongHopNgayTuChuyen(cho ? ds.filter((c) => cho.has(c.id_chi_nhanh)) : ds, { thuTuCn, soChe: qSoChe.data, tongLoc }).map((r) => ({
      ...r,
      ten_chi_nhanh: tenTheoId.get(r.id_chi_nhanh) ?? `#${r.id_chi_nhanh}`,
    }));
  }, [q.data, chonCn, thuTuCn, qSoChe.data, tongLoc, tenTheoId]);
  const dsDong = useMemo(
    () => locNgayChiNhanh(tatCaDong, { trangThai: filters.trang_thai, ksc: filters.ksc }),
    [tatCaDong, filters.trang_thai, filters.ksc]
  );
  const tong = useMemo(
    () =>
      dsDong.reduce(
        (s, r) => ({
          tongThu: s.tongThu + r.tongThu,
          ksc: s.ksc + r.ksc,
          soChuyen: s.soChuyen + r.soChuyen,
          // Tỉ lệ dòng tổng chỉ tính trên các ngày có Báo cáo sơ chế.
          soChe: s.soChe + (r.soChe ?? 0),
          thuCoBc: s.thuCoBc + (r.soChe != null ? r.tongThu : 0),
        }),
        { tongThu: 0, ksc: 0, soChuyen: 0, soChe: 0, thuCoBc: 0 }
      ),
    [dsDong]
  );
  const coSo = dsDong.length > 0;
  const dangTai = q.isPending || viewScope.isLoading || (locToTruong && (qTen.isPending || qLoc.isPending));

  // ---- Toolbar ----
  /** In / Xuất lưới: mỗi ngày một khối lưới từ phiếu đầy đủ → chỉ khi kỳ có giới hạn và ≤ 31 ngày. */
  const inDuoc = soNgayCuaKhoang(khoang.tu, khoang.den) <= SO_NGAY_TOI_DA;
  const nhanKhoaIn = t('danhGiaDauVao.bang.chonKyIn', { n: SO_NGAY_TOI_DA });

  const filterGroups: FilterGroup[] = useMemo(() => {
    const dem = (fn: (r: DgdvNgayChiNhanh) => boolean) => tatCaDong.filter(fn).length;
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
        key: 'trang_thai',
        label: t('danhGiaDauVao.toolbar.filterTrangThai'),
        icon: ToggleLeft,
        options: [
          { value: LOC_TRANG_THAI_NGAY.KHOA, label: t('danhGiaDauVao.tongHop.daKhoaHet'), count: dem((r) => r.daKhoaHet) },
          { value: LOC_TRANG_THAI_NGAY.MO, label: t('danhGiaDauVao.tongHop.conPhieuMo'), count: dem((r) => !r.daKhoaHet) },
        ],
        value: filters.trang_thai,
        onChange: (v: string[]) => setFilter('trang_thai', v),
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

  const chonKhoang = (inline: boolean) => (
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
  const filterItems: FilterChipItem[] = [
    { kind: 'custom', key: 'khoang', node: chonKhoang(false) },
    { kind: 'group', group: filterGroups[0], className: 'w-full sm:w-[200px]' },
    { kind: 'group', group: filterGroups[1], className: 'w-full sm:w-[150px]' },
    { kind: 'group', group: filterGroups[2], className: 'w-full sm:w-[140px]' },
    { kind: 'group', group: filterGroups[3], className: 'w-full sm:w-[180px]' },
  ];
  const activeFilterCount = filters.id_chi_nhanh.length + filters.trang_thai.length + filters.ksc.length + filters.to_truong.length;

  /** Phiếu (lọc tổ trưởng ở mức lô) thuộc các dòng đang hiện — cho Xuất Excel lưới. */
  const phieuCuaDong = (dsPhieu: DgdvPhieuDayDu[], ds: readonly DgdvNgayChiNhanh[]) => {
    const khoa = new Set(ds.map((r) => r.khoa));
    return locPhieuTheoToTruong(dsPhieu, filters.to_truong).filter((p) => khoa.has(`${p.ngay}|${p.id_chi_nhanh}`));
  };

  const xuatExcel = async () => {
    setDangXuat(true);
    try {
      const dsPhieu = await getDgdvTheoKhoangNgay(khoang.tu, khoang.den, phamVi.idChiNhanh, phamVi.viewAll, phamVi.allowedBranchIds);
      const dsKhoi = dungLuoiKhoangNgay(phieuCuaDong(dsPhieu, dsDong), khoang.tu, khoang.den, mauTheoId, {
        nhanXeDoi: t('danhGiaDauVao.luoi.xeDoi'),
        gopChuyen: true,
      });
      const co = await taiXlsxLuoi(dsKhoi, khoang.tu, khoang.den, t);
      if (!co) toast.warning(t('danhGiaDauVao.bang.khongCoDuLieu'));
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setDangXuat(false);
    }
  };
  const moIn = () =>
    window.open(getDgdvPreviewUrl(khoang.tu, khoang.den, chonCn.length === 1 ? chonCn[0] : null), '_blank', 'noopener,noreferrer');

  const iconBtn = 'h-9 w-9 p-0 inline-flex items-center justify-center border-border text-muted-foreground hover:bg-muted/50';
  const actions = (
    <div className="flex items-center gap-2">
      <Tooltip content={inDuoc ? t('danhGiaDauVao.bang.in') : nhanKhoaIn} placement="bottom">
        <Button variant="outline" size="sm" className={iconBtn} disabled={!coSo || !inDuoc} onClick={moIn} aria-label={t('danhGiaDauVao.bang.in')}>
          <Printer className="w-4 h-4" />
        </Button>
      </Tooltip>
      <Tooltip content={inDuoc ? t('danhGiaDauVao.bang.xuatExcel') : nhanKhoaIn} placement="bottom">
        <Button
          variant="outline"
          size="sm"
          className={iconBtn}
          disabled={!coSo || dangXuat || !inDuoc}
          onClick={() => void xuatExcel()}
          aria-label={t('danhGiaDauVao.bang.xuatExcel')}
        >
          <FileSpreadsheet className="w-4 h-4" />
        </Button>
      </Tooltip>
    </div>
  );

  // ---- Bảng ----
  const renderCell = (colId: string, r: DgdvNgayChiNhanh) => {
    switch (colId) {
      case 'ngay':
        return <span className="text-sm font-medium tabular-nums whitespace-nowrap">{formatYmdToDisplay(r.ngay)}</span>;
      case 'tuan':
        return <span className="text-sm tabular-nums whitespace-nowrap">{nhanTuanFarm({ nam: r.nam, tuan: r.tuan })}</span>;
      case 'id_chi_nhanh':
        return <span className="text-sm text-muted-foreground">{r.ten_chi_nhanh ?? '—'}</span>;
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
        return <span className="text-sm tabular-nums text-muted-foreground">{r.soChe == null ? '–' : nhanTiLeKsc(r.soChe, r.tongThu)}</span>;
      case 'trang_thai':
        return <TrangThaiDgdvBadge trangThai={r.daKhoaHet ? 'khoa' : 'mo'} />;
      default:
        return null;
    }
  };
  const renderTong = (colId: string) => {
    switch (colId) {
      case 'ngay':
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
        return <span className="text-xs font-semibold tabular-nums">{tong.thuCoBc > 0 ? formatNumberVN(tong.soChe) : '–'}</span>;
      case 'ti_le_so_che':
        return <span className="text-xs font-semibold tabular-nums">{tong.thuCoBc > 0 ? nhanTiLeKsc(tong.soChe, tong.thuCoBc) : '–'}</span>;
      default:
        return null;
    }
  };
  const renderMobileCard = (r: DgdvNgayChiNhanh) => (
    <div role="button" tabIndex={0} onClick={() => setXemKhoa(r.khoa)} onKeyDown={(e) => e.key === 'Enter' && setXemKhoa(r.khoa)} className="bg-card rounded-xl border border-border p-3.5 shadow-sm">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h4 className="font-semibold text-foreground text-sm truncate">
            {formatYmdToDisplay(r.ngay)} · {r.ten_chi_nhanh ?? '—'}
          </h4>
          <p className="text-xs text-muted-foreground truncate mt-0.5 tabular-nums">
            {nhanTuanFarm({ nam: r.nam, tuan: r.tuan })} · {t('danhGiaDauVao.tongHop.soChuyen', { n: r.soChuyen })}
          </p>
        </div>
        <TrangThaiDgdvBadge trangThai={r.daKhoaHet ? 'khoa' : 'mo'} />
      </div>
      <div className="mt-2 grid grid-cols-3 gap-2 text-sm tabular-nums">
        <div className="rounded-lg bg-muted/40 px-2.5 py-2">
          <div className="text-xs text-muted-foreground">{t('danhGiaDauVao.store.colTongThu')}</div>
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
          {t('danhGiaDauVao.store.colTiLeSoChe')}: <span className="font-medium text-foreground">{nhanTiLeKsc(r.soChe, r.tongThu)}</span>
        </p>
      )}
    </div>
  );

  const dongXem = xemKhoa ? tatCaDong.find((r) => r.khoa === xemKhoa) : undefined;
  const tenToTruongLoc = toTruongTuyChon.filter((x) => filters.to_truong.includes(x.khoa)).map((x) => x.ten);

  return (
    <div className="flex-1 min-h-0 flex flex-col rounded-xl border border-border bg-card shadow-sm overflow-hidden">
      <DashboardToolbar
        hideBack
        filters={<ResponsiveFilterChips items={filterItems} />}
        filterGroups={filterGroups}
        mobileFilterExtra={
          <MobileFilterField label={ky.nhan || t('danhGiaDauVao.bang.khoangNgay')} icon={Calendar} active>
            {chonKhoang(true)}
          </MobileFilterField>
        }
        mobileFilterExtraCount={1}
        activeFilterCount={activeFilterCount}
        onClearFilters={resetFilters}
        actions={actions}
        // Điện thoại: In / Xuất và khoảng ngày hiện ngay trên toolbar (không phải mở bảng lọc mới thấy).
        mobileActions={actions}
        mobileRow2Content={chonKhoang(false)}
        className="static z-auto border-b border-border"
      />

      <div className="flex-1 min-h-0 flex flex-col px-4 pb-4 pt-1">
        <GenericTable<DgdvNgayChiNhanh>
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
          emptyTitle={t('danhGiaDauVao.bang.khongCoDuLieu')}
          emptyDescription={t('danhGiaDauVao.bang.khongCoDuLieuHint')}
        />
      </div>

      <AnimatePresence>
        {dongXem && (
          <TongNgayDetailTai
            key={dongXem.khoa}
            dong={dongXem}
            phamVi={phamVi}
            toTruong={filters.to_truong}
            tenToTruongLoc={tenToTruongLoc}
            onClose={() => setXemKhoa(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default BangDanhGiaTab;
