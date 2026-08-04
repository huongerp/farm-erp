import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronDown, ChevronRight, CheckCircle2, Minus } from 'lucide-react';
import { cn } from '../../../../lib/utils';
import { formatDateShort, formatNumberVN } from '../../../../lib/utils';
import {
  normalizeChiTietForDisplay,
  chuyenTtLabelByThuTu,
  tongCongQuyDoiNgayVaNua,
  tongGioTangCaTichMotDong,
} from '../../bao-cao-nhan-cong/core/types';
import { displayLoaiTotalsOnCt } from '../../bao-cao-nhan-cong/core/ct-sub';
import type { ThongKeSanXuatRow } from '../core/types';
import { kpiThucTeDisplay } from '../core/kpi-display';

// ─── helpers ─────────────────────────────────────────────────────────────────

const n = (v: unknown, d = 0) =>
  v == null || !Number.isFinite(Number(v))
    ? '—'
    : formatNumberVN(Number(v), { maxFractionDigits: d, minFractionDigits: 0 });

const pct = (v: number | null) =>
  v == null ? '—' : `${formatNumberVN(v * 100, { maxFractionDigits: 1 })}%`;

const pctDirect = (v: number | null) =>
  v == null ? '—' : `${formatNumberVN(v, { maxFractionDigits: 1 })}%`;

const currency = (v: number) =>
  v === 0
    ? '0'
    : v >= 1_000_000
    ? `${formatNumberVN(v / 1_000_000, { maxFractionDigits: 2 })}tr`
    : formatNumberVN(v, { maxFractionDigits: 0 });

const KPI_BADGE: Record<string, { label: string; cls: string }> = {
  Đạt: { label: 'Đạt', cls: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' },
  Tốt: { label: 'Tốt', cls: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400' },
  'Không đạt': { label: 'K.đạt', cls: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' },
  Kém: { label: 'Kém', cls: 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400' },
};

// ─── Th / Td helpers ─────────────────────────────────────────────────────────

function Th({
  children,
  className,
  colSpan,
  rowSpan,
  title,
}: {
  children?: React.ReactNode;
  className?: string;
  colSpan?: number;
  rowSpan?: number;
  title?: string;
}) {
  return (
    <th
      colSpan={colSpan}
      rowSpan={rowSpan}
      title={title}
      className={cn(
        'px-2 py-1.5 text-[11px] font-semibold text-muted-foreground whitespace-nowrap border-b border-border/60 bg-muted/40',
        className
      )}
    >
      {children}
    </th>
  );
}

function Td({
  children,
  className,
}: {
  children?: React.ReactNode;
  className?: string;
}) {
  return (
    <td
      className={cn(
        'px-2 py-1.5 text-xs text-foreground whitespace-nowrap border-b border-border/40',
        className
      )}
    >
      {children}
    </td>
  );
}

// ─── BC badge ────────────────────────────────────────────────────────────────

function BcBadge({ has, label }: { has: boolean; label: string }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-0.5 rounded px-1 py-0.5 text-[10px] font-medium',
        has
          ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
          : 'bg-muted text-muted-foreground/50'
      )}
    >
      {has ? <CheckCircle2 size={9} /> : <Minus size={9} />}
      {label}
    </span>
  );
}

// ─── KPI badges ──────────────────────────────────────────────────────────────

function KpiBadges({ kpiSnapshot }: { kpiSnapshot: ThongKeSanXuatRow['kpiSnapshot'] }) {
  if (!kpiSnapshot || kpiSnapshot.tongKpi === 0) return <span className="text-muted-foreground/40">—</span>;
  return (
    <div className="flex flex-wrap gap-0.5">
      {kpiSnapshot.rows.slice(0, 3).map((r, i) => {
        const badge = r.danh_gia ? KPI_BADGE[r.danh_gia] : null;
        return badge ? (
          <span
            key={i}
            title={r.ten_hang_muc}
            className={cn('inline-block rounded px-1 py-0.5 text-[10px] font-medium', badge.cls)}
          >
            {badge.label}
          </span>
        ) : (
          <span key={i} className="inline-block rounded px-1 py-0.5 text-[10px] bg-muted text-muted-foreground/50">
            —
          </span>
        );
      })}
    </div>
  );
}

// ─── Expanded row: chi tiết chuyền ───────────────────────────────────────────

function ExpandedBcncDetail({ row }: { row: ThongKeSanXuatRow }) {
  const { t } = useTranslation();
  if (!row.bcnc) return null;
  const { production, vRow } = normalizeChiTietForDisplay(row.bcnc.chi_tiet ?? []);
  const allRows = [...production, vRow];

  return (
    <tr>
      <td colSpan={100} className="bg-muted/20 border-b border-border/40 p-0">
        <div className="px-4 py-3">
          <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">
            {t('thongKeSanXuat.table.detailTitle')} — {t('thongKeSanXuat.table.groupNhanCong')}
          </p>
          <div className="overflow-x-auto">
            <table className="text-xs border-collapse w-auto min-w-[480px]">
              <thead>
                <tr>
                  <th className="px-2 py-1 text-left text-[11px] font-semibold text-muted-foreground border border-border/40 bg-muted/60">
                    {t('thongKeSanXuat.table.chuyen')}
                  </th>
                  <th className="px-2 py-1 text-right text-[11px] font-semibold text-muted-foreground border border-border/40 bg-muted/60">
                    {t('thongKeSanXuat.table.colCnNgay')}
                  </th>
                  <th className="px-2 py-1 text-right text-[11px] font-semibold text-muted-foreground border border-border/40 bg-muted/60">
                    {t('thongKeSanXuat.table.colCnNua')}
                  </th>
                  <th className="px-2 py-1 text-right text-[11px] font-semibold text-muted-foreground border border-border/40 bg-muted/60">
                    {t('thongKeSanXuat.table.colTangCa')}
                  </th>
                  <th className="px-2 py-1 text-right text-[11px] font-semibold text-muted-foreground border border-border/40 bg-muted/60">
                    {t('thongKeSanXuat.table.colCongQD')}
                  </th>
                  <th className="px-2 py-1 text-right text-[11px] font-semibold text-muted-foreground border border-border/40 bg-muted/60">
                    {t('thongKeSanXuat.table.colGioTC')}
                  </th>
                </tr>
              </thead>
              <tbody>
                {allRows.map((ct, idx) => {
                  const isV = ct.loai_chuyen === 'CONG_DINH_BIEN_KHONG_SAN_XUAT';
                  const label = isV ? 'V (Định biên)' : `${chuyenTtLabelByThuTu(ct.thu_tu)}`;
                  const congQD = tongCongQuyDoiNgayVaNua(ct);
                  const gioTC = tongGioTangCaTichMotDong(ct);
                  const cnNgay = displayLoaiTotalsOnCt(ct, 'CN_NGAY').nhanSu;
                  const cnNua = displayLoaiTotalsOnCt(ct, 'CN_NUA').nhanSu;
                  const cnTC = displayLoaiTotalsOnCt(ct, 'TANG_CA').nhanSu;
                  return (
                    <tr
                      key={idx}
                      className={cn(
                        isV && 'bg-amber-50/50 dark:bg-amber-900/10 font-medium'
                      )}
                    >
                      <td className="px-2 py-1 border border-border/40 text-foreground">{label}</td>
                      <td className="px-2 py-1 border border-border/40 text-right tabular-nums">{cnNgay || '—'}</td>
                      <td className="px-2 py-1 border border-border/40 text-right tabular-nums">{cnNua || '—'}</td>
                      <td className="px-2 py-1 border border-border/40 text-right tabular-nums">{cnTC || '—'}</td>
                      <td className="px-2 py-1 border border-border/40 text-right tabular-nums">
                        {formatNumberVN(congQD, { maxFractionDigits: 1 })}
                      </td>
                      <td className="px-2 py-1 border border-border/40 text-right tabular-nums">
                        {gioTC > 0 ? formatNumberVN(gioTC, { maxFractionDigits: 1 }) : '—'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* KPI detail */}
          {row.kpiSnapshot && row.kpiSnapshot.tongKpi > 0 && (
            <div className="mt-3">
              <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
                {t('thongKeSanXuat.table.kpi')} — {t('thongKeSanXuat.table.groupSoChe')}
              </p>
              <div className="overflow-x-auto">
                <table className="text-xs border-collapse w-auto min-w-[500px]">
                  <thead>
                    <tr>
                      <th className="px-2 py-1 text-left text-[11px] font-semibold text-muted-foreground border border-border/40 bg-muted/60">Hạng mục</th>
                      <th className="px-2 py-1 text-right text-[11px] font-semibold text-muted-foreground border border-border/40 bg-muted/60">ĐVT</th>
                      <th className="px-2 py-1 text-right text-[11px] font-semibold text-muted-foreground border border-border/40 bg-muted/60">Mục tiêu</th>
                      <th className="px-2 py-1 text-right text-[11px] font-semibold text-muted-foreground border border-border/40 bg-muted/60">Thực tế</th>
                      <th className="px-2 py-1 text-right text-[11px] font-semibold text-muted-foreground border border-border/40 bg-muted/60">%</th>
                      <th className="px-2 py-1 text-center text-[11px] font-semibold text-muted-foreground border border-border/40 bg-muted/60">Đánh giá</th>
                      <th className="px-2 py-1 text-right text-[11px] font-semibold text-muted-foreground border border-border/40 bg-muted/60">Tiền thưởng</th>
                    </tr>
                  </thead>
                  <tbody>
                    {row.kpiSnapshot.rows.map((r, idx) => {
                      const badge = r.danh_gia ? KPI_BADGE[r.danh_gia] : null;
                      return (
                        <tr key={idx}>
                          <td className="px-2 py-1 border border-border/40">{r.ten_hang_muc}</td>
                          <td className="px-2 py-1 border border-border/40 text-right tabular-nums text-muted-foreground">{r.don_vi_tinh ?? '—'}</td>
                          <td className="px-2 py-1 border border-border/40 text-right tabular-nums">{r.muc_tieu ?? '—'}</td>
                          <td className="px-2 py-1 border border-border/40 text-right tabular-nums">{r.thuc_te ?? '—'}</td>
                          <td className="px-2 py-1 border border-border/40 text-right tabular-nums">
                            {r.phan_tram != null ? `${formatNumberVN(r.phan_tram, { maxFractionDigits: 1 })}%` : '—'}
                          </td>
                          <td className="px-2 py-1 border border-border/40 text-center">
                            {badge ? (
                              <span className={cn('rounded px-1.5 py-0.5 text-[10px] font-medium', badge.cls)}>
                                {r.danh_gia}
                              </span>
                            ) : '—'}
                          </td>
                          <td className="px-2 py-1 border border-border/40 text-right tabular-nums">
                            {r.tien_thuong !== 0 ? (
                              <span
                                className={cn(
                                  r.tien_thuong > 0
                                    ? 'text-emerald-600 dark:text-emerald-400'
                                    : 'text-rose-600 dark:text-rose-400'
                                )}
                              >
                                {currency(r.tien_thuong)}
                              </span>
                            ) : '—'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Phẩm cấp */}
          {row.bcsc && (row.bcsc.pham_cap ?? []).some((p) => p.so_thung > 0) && (
            <div className="mt-3">
              <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
                Phẩm cấp — {t('thongKeSanXuat.table.groupSoChe')}
              </p>
              <div className="flex flex-wrap gap-2">
                {(row.bcsc.pham_cap ?? [])
                  .filter((p) => p.so_thung > 0)
                  .map((p, i) => (
                    <div
                      key={i}
                      className="bg-muted/40 rounded-lg px-3 py-1.5 text-xs border border-border/40 tabular-nums"
                    >
                      <span className="font-medium text-foreground">{p.ten_pham_cap}</span>
                      <span className="text-muted-foreground ml-1.5">
                        {formatNumberVN(p.so_thung, { maxFractionDigits: 0 })} thùng
                        {p.so_tham_chieu > 0 && ` × ${p.so_tham_chieu}kg`}
                      </span>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </div>
      </td>
    </tr>
  );
}

// ─── Main table row ───────────────────────────────────────────────────────────

function TableRow({
  row,
  expanded,
  onToggle,
}: {
  row: ThongKeSanXuatRow;
  expanded: boolean;
  onToggle: () => void;
}) {
  const { t } = useTranslation();
  const s = row.bcncSnapshot;
  const k = row.kpiSnapshot;
  const d = row.dbdtKpi;
  const bcsc = row.bcsc;
  const dbdt = row.dbdt;

  const hasBcnc = !!row.bcnc;
  const hasBcsc = !!row.bcsc;
  const hasDbdt = !!row.dbdt;

  return (
    <>
      <tr
        className={cn(
          'group cursor-pointer transition-colors',
          expanded ? 'bg-primary/5' : 'hover:bg-muted/40'
        )}
        onClick={onToggle}
      >
        {/* Expand toggle */}
        <Td className="sticky left-0 z-10 bg-inherit w-8 pr-1">
          <span className="text-muted-foreground group-hover:text-foreground">
            {expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          </span>
        </Td>

        {/* Ngày */}
        <Td className="sticky left-8 z-10 bg-inherit font-medium tabular-nums">
          {formatDateShort(row.ngay)}
        </Td>

        {/* Chi nhánh */}
        <Td className="sticky left-28 z-10 bg-inherit max-w-[120px] truncate">
          {row.ten_chi_nhanh}
        </Td>

        {/* BC badges */}
        <Td>
          <div className="flex gap-0.5">
            <BcBadge has={hasBcnc} label={t('thongKeSanXuat.badge.bcnc')} />
            <BcBadge has={hasBcsc} label={t('thongKeSanXuat.badge.bcsc')} />
            <BcBadge has={hasDbdt} label={t('thongKeSanXuat.badge.dbdt')} />
          </div>
        </Td>

        {/* ── Nhân công ── */}
        <Td className="text-right tabular-nums">{s ? n(s.cnSanXuatNgay) : '—'}</Td>
        <Td className="text-right tabular-nums">{s ? n(s.cnSanXuatNua) : '—'}</Td>
        <Td className="text-right tabular-nums">{s ? n(s.cnTangCa) : '—'}</Td>
        <Td className="text-right tabular-nums font-medium">{s ? n(s.tongCongQuyDoi, 1) : '—'}</Td>
        <Td className="text-right tabular-nums">
          {s ? (
            <span className={cn(s.cnDinhBien > 0 ? 'text-amber-600 dark:text-amber-400 font-medium' : '')}>
              {n(s.cnDinhBien)}
            </span>
          ) : '—'}
        </Td>
        <Td className="text-right tabular-nums">
          {s?.kDinhBien != null ? (
            <span className={cn(s.kDinhBien >= 5 ? 'text-emerald-600 dark:text-emerald-400 font-semibold' : s.kDinhBien >= 3 ? '' : 'text-amber-600')}>
              {n(s.kDinhBien, 2)}
            </span>
          ) : '—'}
        </Td>
        <Td className="text-right tabular-nums">
          {s && s.tongGioTangCaTich > 0 ? (
            <span className="text-orange-600 dark:text-orange-400">{n(s.tongGioTangCaTich, 1)}</span>
          ) : s ? '0' : '—'}
        </Td>

        {/* ── Sơ chế ── */}
        <Td className="text-right tabular-nums">{bcsc ? n(bcsc.tong_buong_thu_hoach) : '—'}</Td>
        <Td className="text-right tabular-nums font-medium">{bcsc ? n(bcsc.tong_buong_so_che) : '—'}</Td>
        <Td className="text-right tabular-nums">{bcsc ? n(bcsc.sl_buong_ton_cuoi_ngay) : '—'}</Td>
        <Td className="text-right tabular-nums">
          {bcsc ? (
            <span className={cn(bcsc.danh_gia_loi_qc_pct > 0 ? 'text-red-600 dark:text-red-400' : 'text-muted-foreground')}>
              {pctDirect(bcsc.danh_gia_loi_qc_pct)}
            </span>
          ) : '—'}
        </Td>
        <Td className="text-right tabular-nums">{kpiThucTeDisplay(k, 0)}</Td>
        <Td className="text-right tabular-nums">{kpiThucTeDisplay(k, 1)}</Td>
        <Td className="text-right tabular-nums">{kpiThucTeDisplay(k, 2)}</Td>
        <Td>
          <KpiBadges kpiSnapshot={k} />
        </Td>
        <Td className="text-right tabular-nums">
          {k && k.tongTienThuong !== 0 ? (
            <span
              className={cn(
                'font-medium',
                k.tongTienThuong > 0
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : 'text-rose-600 dark:text-rose-400'
              )}
            >
              {currency(k.tongTienThuong)}
            </span>
          ) : k ? '0' : '—'}
        </Td>

        {/* ── Đóng thùng ── */}
        <Td className="text-right tabular-nums">
          {d?.can_nang_binh_quan_buong != null
            ? n(d.can_nang_binh_quan_buong * 1000, 0)
            : '—'}
        </Td>
        <Td className="text-right tabular-nums">{dbdt ? n(dbdt.tong_buong_nhap_ke_hoach) : '—'}</Td>
        <Td className="text-right tabular-nums">{dbdt ? n(dbdt.tong_buong_nhap_thuc_te) : '—'}</Td>
        <Td className="text-right tabular-nums font-medium">{d ? n(d.tong_so_thung_ke_hoach) : '—'}</Td>
        <Td className="text-right tabular-nums font-medium">
          {d ? (
            <span className="text-indigo-600 dark:text-indigo-400">{n(d.tong_so_thung_thuc_te)}</span>
          ) : '—'}
        </Td>
        <Td className="text-right tabular-nums">{dbdt ? pct(dbdt.ty_le_thu_hoi_ke_hoach) : '—'}</Td>
        <Td className="text-right tabular-nums">{dbdt ? pct(dbdt.ty_le_thu_hoi_thuc_te) : '—'}</Td>
      </tr>

      {expanded && <ExpandedBcncDetail row={row} />}
    </>
  );
}

// ─── Main table ───────────────────────────────────────────────────────────────

interface Props {
  rows: ThongKeSanXuatRow[];
}

const ThongKeSanXuatTable: React.FC<Props> = ({ rows }) => {
  const { t } = useTranslation();
  const [expandedKeys, setExpandedKeys] = useState<Set<string>>(new Set());

  const toggle = (key: string) => {
    setExpandedKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  if (rows.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-muted-foreground gap-2">
        <Minus size={32} className="opacity-30" />
        <p className="text-sm">{t('thongKeSanXuat.table.empty')}</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-border/60 shadow-sm">
      <table className="w-max min-w-full text-xs border-collapse">
        <thead>
          {/* Row 1: group headers */}
          <tr>
            <Th rowSpan={2} className="sticky left-0 z-20 w-8" />
            <Th rowSpan={2} className="sticky left-8 z-20 text-left min-w-[80px]">
              {t('thongKeSanXuat.table.ngay')}
            </Th>
            <Th rowSpan={2} className="sticky left-28 z-20 text-left min-w-[100px]">
              {t('thongKeSanXuat.table.chiNhanh')}
            </Th>
            <Th rowSpan={2} className="text-left min-w-[110px]">
              {t('thongKeSanXuat.table.bc')}
            </Th>

            {/* Nhân công group */}
            <Th
              colSpan={7}
              className="text-center border-l border-blue-200/60 dark:border-blue-900/40 bg-blue-50/50 dark:bg-blue-950/20 text-blue-700 dark:text-blue-400"
            >
              {t('thongKeSanXuat.table.groupNhanCong')}
            </Th>

            {/* Sơ chế group */}
            <Th
              colSpan={9}
              className="text-center border-l border-sky-200/60 dark:border-sky-900/40 bg-sky-50/50 dark:bg-sky-950/20 text-sky-700 dark:text-sky-400"
            >
              {t('thongKeSanXuat.table.groupSoChe')}
            </Th>

            {/* Đóng thùng group */}
            <Th
              colSpan={7}
              className="text-center border-l border-indigo-200/60 dark:border-indigo-900/40 bg-indigo-50/50 dark:bg-indigo-950/20 text-indigo-700 dark:text-indigo-400"
            >
              {t('thongKeSanXuat.table.groupDongThung')}
            </Th>
          </tr>

          {/* Row 2: individual column headers */}
          <tr>
            {/* Nhân công */}
            <Th className="border-l border-blue-200/60 dark:border-blue-900/40 text-right">{t('thongKeSanXuat.table.cnNgay')}</Th>
            <Th className="text-right">{t('thongKeSanXuat.table.cnNua')}</Th>
            <Th className="text-right">{t('thongKeSanXuat.table.cnTangCa')}</Th>
            <Th className="text-right">{t('thongKeSanXuat.table.congQD')}</Th>
            <Th className="text-right" title="CN định biên (dòng V)">{t('thongKeSanXuat.table.cnDinhBien')}</Th>
            <Th className="text-right" title="K định biên = Công SX quy đổi / CN định biên">{t('thongKeSanXuat.table.kDinhBien')}</Th>
            <Th className="text-right" title="Giờ tăng ca tích Σ(sl × giờ)">{t('thongKeSanXuat.table.gioTangCa')}</Th>

            {/* Sơ chế */}
            <Th className="border-l border-sky-200/60 dark:border-sky-900/40 text-right">{t('thongKeSanXuat.table.buongThuHoach')}</Th>
            <Th className="text-right">{t('thongKeSanXuat.table.buongSoChe')}</Th>
            <Th className="text-right" title="Buồng tồn cuối ngày">{t('thongKeSanXuat.table.buongTonCuoi')}</Th>
            <Th className="text-right">{t('thongKeSanXuat.table.loiQcPct')}</Th>
            <Th className="text-right" title={t('thongKeSanXuat.table.kpiNsSoCheTitle')}>
              {t('thongKeSanXuat.table.kpiNsSoChe')}
            </Th>
            <Th className="text-right" title={t('thongKeSanXuat.table.kpiLoiNaiChuoiTitle')}>
              {t('thongKeSanXuat.table.kpiLoiNaiChuoi')}
            </Th>
            <Th className="text-right" title={t('thongKeSanXuat.table.kpiTyLeThuHoiTitle')}>
              {t('thongKeSanXuat.table.kpiTyLeThuHoi')}
            </Th>
            <Th className="text-left" title="Đánh giá KPI từng hạng mục">{t('thongKeSanXuat.table.kpi')}</Th>
            <Th className="text-right">{t('thongKeSanXuat.table.tienThuong')}</Th>

            {/* Đóng thùng */}
            <Th className="border-l border-indigo-200/60 dark:border-indigo-900/40 text-right" title="Cân nặng BQ buồng (gram)">{t('thongKeSanXuat.table.canBqBuong')}</Th>
            <Th className="text-right" title="Buồng nhập kế hoạch">{t('thongKeSanXuat.table.buongNhapKH')}</Th>
            <Th className="text-right" title="Buồng nhập thực tế">{t('thongKeSanXuat.table.buongNhapTT')}</Th>
            <Th className="text-right">{t('thongKeSanXuat.table.thungKH')}</Th>
            <Th className="text-right">{t('thongKeSanXuat.table.thungTT')}</Th>
            <Th className="text-right" title="Tỷ lệ thu hồi kế hoạch">{t('thongKeSanXuat.table.tlThuHoiKH')}</Th>
            <Th className="text-right" title="Tỷ lệ thu hồi thực tế">{t('thongKeSanXuat.table.tlThuHoiTT')}</Th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <TableRow
              key={row.key}
              row={row}
              expanded={expandedKeys.has(row.key)}
              onToggle={() => toggle(row.key)}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default ThongKeSanXuatTable;
