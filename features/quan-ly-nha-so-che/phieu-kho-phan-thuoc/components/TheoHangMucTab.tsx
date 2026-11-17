/**
 * Tab "Theo hạng mục" — giá trị xuất + luân chuyển (RPC `rpc_*_gia_tri_xuat_chuyen`, migration 082).
 * Giá mỗi dòng suy như báo cáo NXT: dòng phiếu → phiếu nhập gần nhất → danh mục hàng hoá → danh mục Mua hàng.
 * Gồm: KPI, bảng hạng mục (bấm dòng → tab Chi tiết đã lọc sẵn), tuyến farm đi → farm đến,
 * theo farm (xuất / chuyển đi / nhận về) và hàng chưa có giá. Cột tiền ẩn với người không được xem giá nhập.
 */
import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'react-router-dom';
import { ArrowLeftRight, Coins, Download, Layers, PackageX, Warehouse, TrendingUp, type LucideIcon } from 'lucide-react';
import { cn, formatNumberVN } from '../../../../lib/utils';
import Button from '../../../../components/ui/Button';
import MultiSelect from '../../../../components/ui/MultiSelect';
import DateRangePicker, { type DateRangeValue } from '../../../../components/ui/DateRangePicker';
import EmptyState from '../../../../components/shared/EmptyState';
import ErrorState from '../../../../components/shared/ErrorState';
import LazyExportDialog from '../../../../components/shared/LazyExportDialog';
import { StatsKpiGrid, type StatsKpiCardItem } from '../../../../components/shared/stats';
import type { ExportColumn } from '../../../../lib/export/dinh-dang-o';
import { getDateRangeFromPreset } from '../../../../lib/date-presets';
import { useKhoList } from '../../../kho-van/danh-sach-kho/hooks/use-kho';
import { usePhieuKhoPTViewScope } from '../hooks/use-phieu-kho-pt-view-scope';
import { buildPhieuKhoPTPhamVi } from '../services/phieu-kho-pt-list-query';
import { useGiaTriXuatChuyen } from '../hooks/use-phieu-kho-pt';
import { useXemGiaNhap } from '../../../he-thong/phan-quyen/hooks/use-xem-gia-nhap';
import { useChiTietPhieuKhoPTStore } from '../store/useChiTietPhieuKhoPTStore';

const KY_CUSTOM = 'custom';
const KY_PRESET_IDS = ['thisMonth', 'lastMonth', 'thisQuarter', 'thisYear', 'all', KY_CUSTOM] as const;
const tien = (v: number) => formatNumberVN(v, { maxFractionDigits: 0 });

/** Một cột của bảng nhỏ trong lưới. */
interface CotBang {
  label: string;
  phai?: boolean;
}

/** Bảng nhỏ nhiều cột, cùng khung với StatsTableCard (StatsTableCard chỉ có 2 cột). */
const BangNho: React.FC<{
  title: string;
  icon: LucideIcon;
  cot: CotBang[];
  dong: { id: string; o: React.ReactNode[] }[];
  ghiChu?: string;
  rong: string;
}> = ({ title, icon: Icon, cot, dong, ghiChu, rong }) => (
  <div className="bg-card rounded-xl border border-border overflow-hidden flex flex-col">
    <div className="px-4 py-3 border-b border-border flex items-center gap-2">
      <Icon size={18} className="text-muted-foreground shrink-0" />
      <span className="font-medium text-foreground text-sm">{title}</span>
    </div>
    {ghiChu && <p className="px-4 pt-3 text-xs text-muted-foreground">{ghiChu}</p>}
    <div className="p-4 overflow-auto max-h-[320px]">
      {dong.length === 0 ? (
        <p className="text-sm text-muted-foreground">{rong}</p>
      ) : (
        <table className="w-full text-sm">
          <thead>
            <tr className="text-muted-foreground border-b border-border">
              {cot.map((c) => (
                <th key={c.label} className={cn('pb-2 font-medium whitespace-nowrap', c.phai ? 'text-right pl-3' : 'text-left')}>
                  {c.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {dong.map((d) => (
              <tr key={d.id} className="border-b border-border/50 last:border-0">
                {d.o.map((o, i) => (
                  <td
                    key={cot[i]?.label ?? i}
                    className={cn('py-2', cot[i]?.phai ? 'text-right tabular-nums pl-3 whitespace-nowrap' : 'text-foreground')}
                  >
                    {o}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  </div>
);

const TheoHangMucTab: React.FC = () => {
  const { t } = useTranslation();
  const [, setSearchParams] = useSearchParams();
  const xemGia = useXemGiaNhap();

  // Mặc định năm nay.
  const [ky, setKy] = useState<DateRangeValue>(() => {
    const r = getDateRangeFromPreset('thisYear');
    return { preset: 'thisYear', customStart: r.dateFrom, customEnd: r.dateTo };
  });
  const presets = useMemo(
    () => KY_PRESET_IDS.map((id) => ({ id, label: t(`phieuKhoPhanThuoc.theoHangMuc.preset.${id}`) })),
    [t]
  );
  const handleKyChange = (v: DateRangeValue) => {
    if (v.preset === KY_CUSTOM) {
      setKy(v);
      return;
    }
    const r = getDateRangeFromPreset(v.preset);
    setKy({ preset: v.preset, customStart: r.dateFrom, customEnd: r.dateTo });
  };
  const tu = ky.customStart;
  const den = ky.customEnd;

  const [khoIds, setKhoIds] = useState<string[]>([]);
  const [showExport, setShowExport] = useState(false);

  const { data: khoListAll = [], isPending: khoPending } = useKhoList();
  const viewScope = usePhieuKhoPTViewScope();
  const phamVi = useMemo(() => buildPhieuKhoPTPhamVi(viewScope, khoListAll), [viewScope, khoListAll]);
  /** Kho trong phạm vi — trống nghĩa là toàn phạm vi (RPC nhận null). */
  const khoList = useMemo(() => {
    if (phamVi.viewAll) return khoListAll;
    const allowed = new Set(phamVi.allowedKhoIds.map(String));
    return khoListAll.filter((k) => allowed.has(String(k.id)));
  }, [khoListAll, phamVi]);

  const khoOptions = useMemo(() => khoList.map((k) => ({ value: String(k.id), label: k.ten_kho })), [khoList]);

  /**
   * Kho gửi RPC: chọn kho thì theo lựa chọn; không chọn thì cấp cao = mọi kho (null),
   * người khác = đúng các kho trong phạm vi ('0' = không kho nào → RPC trả rỗng).
   */
  const khoIdsGui = useMemo(() => {
    if (khoIds.length > 0) return khoIds;
    if (phamVi.viewAll) return [];
    return phamVi.allowedKhoIds.length > 0 ? phamVi.allowedKhoIds.map(String) : ['0'];
  }, [khoIds, phamVi]);
  const scopeReady = !viewScope.isLoading && (phamVi.viewAll || !khoPending);
  // Tuỳ chọn mà chưa chọn đủ hai mốc thì chưa gọi.
  const kyHopLe = ky.preset !== KY_CUSTOM || (!!tu && !!den);

  const query = useGiaTriXuatChuyen({ tu, den, khoIds: khoIdsGui }, scopeReady && kyHopLe);
  const giaTri = query.data;
  const tongHop = giaTri?.hangMuc;

  const setFilter = useChiTietPhieuKhoPTStore((s) => s.setFilter);

  /** Bấm dòng → nhảy tab Chi tiết đã lọc sẵn hạng mục + khoảng ngày + kho. */
  const handleRowClick = (hangMuc: string | null) => {
    setFilter('hangMuc', hangMuc == null ? ['__none__'] : [hangMuc]);
    if (tu || den) {
      setFilter('datePreset', 'custom');
      setFilter('customDateFrom', tu);
      setFilter('customDateEnd', den);
    } else {
      setFilter('datePreset', 'all');
    }
    setFilter('khoIds', khoIds);
    setFilter('khoDenIds', []);
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set('tab', 'chiTiet');
      return next;
    });
  };

  const exportColumns = useMemo<ExportColumn[]>(
    () => [
      { key: 'hang_muc', label: t('phieuKhoPhanThuoc.theoHangMuc.colHangMuc'), type: 'text' },
      ...(xemGia
        ? ([
            { key: 'tien_xuat', label: t('phieuKhoPhanThuoc.theoHangMuc.colTienXuat'), type: 'money' as const },
            { key: 'tien_chuyen', label: t('phieuKhoPhanThuoc.theoHangMuc.colTienChuyen'), type: 'money' as const },
            { key: 'tong', label: t('phieuKhoPhanThuoc.theoHangMuc.colTong'), type: 'money' as const },
          ] as ExportColumn[])
        : []),
      { key: 'so_dong', label: t('phieuKhoPhanThuoc.theoHangMuc.colSoDong'), type: 'number' },
    ],
    [t, xemGia]
  );

  const exportRows = useMemo(
    () =>
      (tongHop?.dong ?? []).map((d) => ({
        hang_muc: d.hangMuc ?? t('phieuKhoPhanThuoc.theoHangMuc.chuaPhanHangMuc'),
        tien_xuat: d.tienXuat,
        tien_chuyen: d.tienChuyen,
        tong: d.tong,
        so_dong: d.soDong,
      })),
    [tongHop, t]
  );

  const coDuLieu = (tongHop?.dong.length ?? 0) > 0;

  const kpis: StatsKpiCardItem[] = giaTri
    ? [
        ...(xemGia
          ? [
              {
                id: 'tienXuat',
                label: t('phieuKhoPhanThuoc.theoHangMuc.kpiTienXuat'),
                value: tien(giaTri.tong.tienXuat),
                icon: Coins,
                color: 'text-emerald-600 dark:text-emerald-400',
                bg: 'bg-emerald-500/10',
              },
              {
                id: 'tienChuyen',
                label: t('phieuKhoPhanThuoc.theoHangMuc.kpiTienChuyen'),
                value: tien(giaTri.tong.tienChuyen),
                icon: TrendingUp,
                color: 'text-sky-600 dark:text-sky-400',
                bg: 'bg-sky-500/10',
              },
            ]
          : []),
        {
          id: 'soDong',
          label: t('phieuKhoPhanThuoc.theoHangMuc.kpiSoDong'),
          value: tien(giaTri.tong.soDong),
          icon: Layers,
          color: 'text-violet-600 dark:text-violet-400',
          bg: 'bg-violet-500/10',
        },
        {
          id: 'soDongChuaGia',
          label: t('phieuKhoPhanThuoc.theoHangMuc.kpiSoDongChuaGia'),
          value: tien(giaTri.tong.soDongChuaGia),
          icon: PackageX,
          color: 'text-amber-600 dark:text-amber-400',
          bg: 'bg-amber-500/10',
        },
      ]
    : [];

  const rong = t('phieuKhoPhanThuoc.theoHangMuc.bangRong');
  const dongLabel = t('phieuKhoPhanThuoc.theoHangMuc.colSoDong');

  const thStyle = 'px-4 py-2.5 text-xs font-semibold text-foreground/80 whitespace-nowrap';

  return (
    <div className="flex-1 min-h-0 flex flex-col mt-1.5 rounded-xl border border-border bg-card shadow-sm overflow-hidden">
      {/* Bộ lọc */}
      <div className="shrink-0 flex flex-wrap items-center gap-2 px-3 py-2.5 border-b border-border">
        <DateRangePicker
          presets={presets}
          value={ky}
          onChange={handleKyChange}
          placeholder={t('phieuKhoPhanThuoc.theoHangMuc.ky')}
          customPresetId={KY_CUSTOM}
          className="w-full sm:w-auto shrink-0"
        />
        <MultiSelect
          options={khoOptions}
          value={khoIds}
          onChange={setKhoIds}
          placeholder={t('phieuKhoPhanThuoc.theoHangMuc.khoPlaceholder')}
          size="md"
          className="w-full sm:w-56"
        />
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowExport(true)}
          disabled={!coDuLieu}
          className="sm:ml-auto h-8 gap-1.5"
        >
          <Download className="w-4 h-4" />
          {t('common.export')}
        </Button>
      </div>

      <div className="flex-1 min-h-0 overflow-auto p-3 space-y-3">
        {query.isError ? (
          <ErrorState onRetry={() => query.refetch()} />
        ) : !giaTri || khoPending ? (
          <div className="flex flex-1 min-h-[200px] items-center justify-center">
            <div className="h-10 w-10 rounded-full border-2 border-primary/30 border-t-primary animate-spin" aria-label={t('common.loading')} />
          </div>
        ) : !coDuLieu ? (
          <EmptyState
            icon={<Layers size={48} className="text-muted-foreground/50" />}
            title={t('phieuKhoPhanThuoc.theoHangMuc.empty')}
            description={t('phieuKhoPhanThuoc.theoHangMuc.emptyHint')}
          />
        ) : (
          <div className={cn('space-y-3 transition-opacity', query.isFetching && 'opacity-60')}>
            <StatsKpiGrid items={kpis} columns={kpis.length === 4 ? 4 : 2} />

            {/* Bảng hạng mục */}
            <div className="rounded-xl border border-border overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead className="bg-muted/60 border-b border-border">
                    <tr>
                      <th className={cn(thStyle, 'text-left')}>{t('phieuKhoPhanThuoc.theoHangMuc.colHangMuc')}</th>
                      {xemGia && (
                        <>
                          <th className={cn(thStyle, 'text-right')}>{t('phieuKhoPhanThuoc.theoHangMuc.colTienXuat')}</th>
                          <th className={cn(thStyle, 'text-right')}>{t('phieuKhoPhanThuoc.theoHangMuc.colTienChuyen')}</th>
                          <th className={cn(thStyle, 'text-right')}>{t('phieuKhoPhanThuoc.theoHangMuc.colTong')}</th>
                        </>
                      )}
                      <th className={cn(thStyle, 'text-right')}>{dongLabel}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tongHop!.dong.map((d) => (
                      <tr
                        key={d.hangMuc ?? '__none__'}
                        className="border-b border-border/50 hover:bg-muted/50 cursor-pointer transition-colors"
                        onClick={() => handleRowClick(d.hangMuc)}
                        title={t('phieuKhoPhanThuoc.theoHangMuc.xemChiTiet')}
                      >
                        <td className="px-4 py-2.5 text-sm min-w-[160px]">
                          <span className={d.hangMuc == null ? 'italic text-muted-foreground' : undefined}>
                            {d.hangMuc ?? t('phieuKhoPhanThuoc.theoHangMuc.chuaPhanHangMuc')}
                          </span>
                        </td>
                        {xemGia && (
                          <>
                            <td className="px-4 py-2.5 tabular-nums text-sm text-right">{tien(d.tienXuat)}</td>
                            <td className="px-4 py-2.5 tabular-nums text-sm text-right">{tien(d.tienChuyen)}</td>
                            <td className="px-4 py-2.5 tabular-nums text-sm text-right font-medium">{tien(d.tong)}</td>
                          </>
                        )}
                        <td className="px-4 py-2.5 tabular-nums text-sm text-right text-muted-foreground">{tien(d.soDong)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="bg-muted/50 font-semibold">
                      <td className="px-4 py-2.5 text-sm">{t('phieuKhoPhanThuoc.theoHangMuc.tongCong')}</td>
                      {xemGia && (
                        <>
                          <td className="px-4 py-2.5 tabular-nums text-sm text-right">{tien(tongHop!.tongCong.tienXuat)}</td>
                          <td className="px-4 py-2.5 tabular-nums text-sm text-right">{tien(tongHop!.tongCong.tienChuyen)}</td>
                          <td className="px-4 py-2.5 tabular-nums text-sm text-right">{tien(tongHop!.tongCong.tong)}</td>
                        </>
                      )}
                      <td className="px-4 py-2.5 tabular-nums text-sm text-right">{tien(tongHop!.tongCong.soDong)}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
              <BangNho
                title={t('phieuKhoPhanThuoc.theoHangMuc.luanChuyen.title')}
                icon={ArrowLeftRight}
                rong={t('phieuKhoPhanThuoc.theoHangMuc.luanChuyen.rong')}
                cot={[
                  { label: t('phieuKhoPhanThuoc.theoHangMuc.luanChuyen.colTuyen') },
                  { label: dongLabel, phai: true },
                  ...(xemGia ? [{ label: t('phieuKhoPhanThuoc.theoHangMuc.luanChuyen.colTien'), phai: true }] : []),
                ]}
                dong={giaTri.luanChuyen.map((d) => ({
                  id: d.id,
                  o: [
                    <span key="tuyen" className="inline-flex flex-wrap items-center gap-1.5">
                      <span>{d.tenKhoDi}</span>
                      <span className="text-muted-foreground">→</span>
                      <span>{d.tenKhoDen}</span>
                    </span>,
                    <span key="dong" className="text-muted-foreground">{tien(d.soDong)}</span>,
                    ...(xemGia ? [<span key="tien" className="font-medium">{tien(d.tien)}</span>] : []),
                  ],
                }))}
              />

              {/* Theo farm chỉ có số tiền → ẩn cả khối với người không được xem giá. */}
              {xemGia && (
                <BangNho
                  title={t('phieuKhoPhanThuoc.theoHangMuc.theoKho.title')}
                  icon={Warehouse}
                  rong={rong}
                  cot={[
                    { label: t('phieuKhoPhanThuoc.theoHangMuc.theoKho.colKho') },
                    { label: t('phieuKhoPhanThuoc.theoHangMuc.theoKho.colXuat'), phai: true },
                    { label: t('phieuKhoPhanThuoc.theoHangMuc.theoKho.colChuyenDi'), phai: true },
                    { label: t('phieuKhoPhanThuoc.theoHangMuc.theoKho.colNhanVe'), phai: true },
                  ]}
                  dong={giaTri.theoKho.map((k) => ({
                    id: k.id,
                    o: [k.tenKho, tien(k.tienXuat), tien(k.tienChuyenDi), tien(k.tienNhanVe)],
                  }))}
                />
              )}

              {giaTri.chuaCoGia.length > 0 && (
                <BangNho
                  title={t('phieuKhoPhanThuoc.theoHangMuc.chuaCoGia.title')}
                  icon={PackageX}
                  rong={rong}
                  ghiChu={t('phieuKhoPhanThuoc.theoHangMuc.chuaCoGia.hint')}
                  cot={[
                    { label: t('phieuKhoPhanThuoc.theoHangMuc.chuaCoGia.colHang') },
                    { label: dongLabel, phai: true },
                  ]}
                  dong={giaTri.chuaCoGia.map((h) => ({
                    id: h.id,
                    o: [
                      <span key="hang">
                        {h.tenHang} <span className="font-mono text-xs text-muted-foreground">({h.maHang})</span>
                      </span>,
                      <span key="dong" className="text-muted-foreground">{tien(h.soDong)}</span>,
                    ],
                  }))}
                />
              )}
            </div>

            <p className="text-xs text-muted-foreground px-1">{t('phieuKhoPhanThuoc.theoHangMuc.footnote')}</p>
          </div>
        )}
      </div>

      <LazyExportDialog
        open={showExport}
        onClose={() => setShowExport(false)}
        columns={exportColumns}
        data={exportRows}
        fileName="Tong_hop_hang_muc"
      />
    </div>
  );
};

export default TheoHangMucTab;
