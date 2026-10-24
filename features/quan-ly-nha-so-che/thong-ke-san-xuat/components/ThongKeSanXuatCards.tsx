import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronDown, ChevronRight, Minus } from 'lucide-react';
import { cn, formatDateShort, formatNumberVN } from '../../../../lib/utils';
import {
  normalizeChiTietForDisplay,
  chuyenTtLabelByThuTu,
  tongCongQuyDoiNgayVaNua,
  tongGioTangCaTichMotDong,
} from '../../bao-cao-nhan-cong/core/types';
import { displayLoaiTotalsOnCt } from '../../bao-cao-nhan-cong/core/ct-sub';
import type { ThongKeSanXuatRow } from '../core/types';
import {
  buildKeyMetrics,
  buildRowSections,
  type CardMetric,
  type CardSectionId,
  type MetricTone,
} from '../utils/card-sections';
import { KPI_BADGE, currency } from '../utils/format-thong-ke';
import { BcBadge, KpiBadges } from './ThongKeSanXuatTable';

/**
 * Phiên bản điện thoại của bảng "Chi tiết theo ngày": mỗi hàng (ngày × chi nhánh) là 1 thẻ.
 * Thu gọn: ngày + chi nhánh + 3 chỉ số chính. Mở ra: 3 nhóm (Nhân công / Sơ chế / Đóng thùng)
 * và chi tiết chuyền, KPI, phẩm cấp — không cuộn ngang.
 */

const TONE_CLS: Record<MetricTone, string> = {
  default: 'text-foreground',
  strong: 'text-foreground',
  positive: 'text-emerald-600 dark:text-emerald-400',
  negative: 'text-rose-600 dark:text-rose-400',
  warning: 'text-amber-600 dark:text-amber-400',
  orange: 'text-orange-600 dark:text-orange-400',
  indigo: 'text-indigo-600 dark:text-indigo-400',
  muted: 'text-muted-foreground',
};

const SECTION_HEAD_CLS: Record<CardSectionId, string> = {
  nhanCong: 'text-blue-700 dark:text-blue-400',
  soChe: 'text-sky-700 dark:text-sky-400',
  dongThung: 'text-indigo-700 dark:text-indigo-400',
};

function Metric({ metric }: { metric: CardMetric }) {
  const { t } = useTranslation();
  return (
    <div className="min-w-0">
      <p className="text-xs text-muted-foreground leading-tight">{t(metric.labelKey)}</p>
      <p className={cn('text-sm font-semibold tabular-nums', TONE_CLS[metric.tone])}>{metric.value}</p>
    </div>
  );
}

function SubHeading({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <p className={cn('text-xs font-semibold uppercase tracking-wider text-muted-foreground', className)}>
      {children}
    </p>
  );
}

function ChiTietChuyen({ row }: { row: ThongKeSanXuatRow }) {
  const { t } = useTranslation();
  if (!row.bcnc) return null;
  const { production, vRow } = normalizeChiTietForDisplay(row.bcnc.chi_tiet ?? []);
  const allRows = [...production, vRow];
  return (
    <div className="space-y-1.5">
      <SubHeading className={SECTION_HEAD_CLS.nhanCong}>
        {t('thongKeSanXuat.table.detailTitle')}
      </SubHeading>
      {allRows.map((ct, idx) => {
        const isV = ct.loai_chuyen === 'CONG_DINH_BIEN_KHONG_SAN_XUAT';
        const label = isV ? `V (${t('thongKeSanXuat.mobile.dinhBien')})` : chuyenTtLabelByThuTu(ct.thu_tu);
        const gioTC = tongGioTangCaTichMotDong(ct);
        const cells: [string, string][] = [
          [t('thongKeSanXuat.mobile.cnNgay'), String(displayLoaiTotalsOnCt(ct, 'CN_NGAY').nhanSu || '—')],
          [t('thongKeSanXuat.mobile.cnNua'), String(displayLoaiTotalsOnCt(ct, 'CN_NUA').nhanSu || '—')],
          [t('thongKeSanXuat.mobile.cnTangCa'), String(displayLoaiTotalsOnCt(ct, 'TANG_CA').nhanSu || '—')],
          [t('thongKeSanXuat.mobile.congQD'), formatNumberVN(tongCongQuyDoiNgayVaNua(ct), { maxFractionDigits: 1 })],
          [t('thongKeSanXuat.mobile.gioTangCa'), gioTC > 0 ? formatNumberVN(gioTC, { maxFractionDigits: 1 }) : '—'],
        ];
        return (
          <div
            key={idx}
            className={cn(
              'rounded-lg border border-border/60 p-2',
              isV ? 'bg-amber-50/60 dark:bg-amber-900/10' : 'bg-muted/20'
            )}
          >
            <p className="text-xs font-semibold text-foreground mb-1">{label}</p>
            <div className="grid grid-cols-3 gap-x-2 gap-y-1.5">
              {cells.map(([l, v]) => (
                <div key={l} className="min-w-0">
                  <p className="text-xs text-muted-foreground leading-tight">{l}</p>
                  <p className="text-sm font-semibold tabular-nums">{v}</p>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function ChiTietKpi({ row }: { row: ThongKeSanXuatRow }) {
  const { t } = useTranslation();
  const k = row.kpiSnapshot;
  if (!k || k.tongKpi === 0) return null;
  return (
    <div className="space-y-1.5">
      <SubHeading className={SECTION_HEAD_CLS.soChe}>{t('thongKeSanXuat.mobile.chiTietKpi')}</SubHeading>
      {k.rows.map((r, idx) => {
        const badge = r.danh_gia ? KPI_BADGE[r.danh_gia] : null;
        return (
          <div key={idx} className="rounded-lg border border-border/60 bg-muted/20 p-2">
            <div className="flex items-start justify-between gap-2 mb-1">
              <p className="text-xs font-semibold text-foreground min-w-0">
                {r.ten_hang_muc}
                {r.don_vi_tinh ? <span className="font-normal text-muted-foreground"> ({r.don_vi_tinh})</span> : null}
              </p>
              {badge && (
                <span className={cn('shrink-0 rounded px-1.5 py-0.5 text-2xs font-medium', badge.cls)}>
                  {r.danh_gia}
                </span>
              )}
            </div>
            <div className="grid grid-cols-3 gap-x-2">
              <div>
                <p className="text-xs text-muted-foreground leading-tight">{t('thongKeSanXuat.mobile.mucTieu')}</p>
                <p className="text-sm font-semibold tabular-nums">{r.muc_tieu ?? '—'}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground leading-tight">{t('thongKeSanXuat.mobile.thucTe')}</p>
                <p className="text-sm font-semibold tabular-nums">{r.thuc_te ?? '—'}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground leading-tight">{t('thongKeSanXuat.mobile.tienThuong')}</p>
                <p
                  className={cn(
                    'text-sm font-semibold tabular-nums',
                    r.tien_thuong > 0
                      ? TONE_CLS.positive
                      : r.tien_thuong < 0
                      ? TONE_CLS.negative
                      : 'text-muted-foreground'
                  )}
                >
                  {r.tien_thuong !== 0 ? currency(r.tien_thuong) : '—'}
                </p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function PhamCap({ row }: { row: ThongKeSanXuatRow }) {
  const { t } = useTranslation();
  const list = (row.bcsc?.pham_cap ?? []).filter((p) => p.so_thung > 0);
  if (list.length === 0) return null;
  return (
    <div className="space-y-1.5">
      <SubHeading className={SECTION_HEAD_CLS.soChe}>{t('thongKeSanXuat.mobile.phamCap')}</SubHeading>
      <div className="flex flex-wrap gap-1.5">
        {list.map((p, i) => (
          <div key={i} className="bg-muted/40 rounded-lg px-2.5 py-1 text-xs border border-border/40 tabular-nums">
            <span className="font-medium text-foreground">{p.ten_pham_cap}</span>
            <span className="text-muted-foreground ml-1.5">
              {formatNumberVN(p.so_thung, { maxFractionDigits: 0 })} thùng
              {p.so_tham_chieu > 0 && ` × ${p.so_tham_chieu}kg`}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function DayCard({
  row,
  expanded,
  onToggle,
}: {
  row: ThongKeSanXuatRow;
  expanded: boolean;
  onToggle: () => void;
}) {
  const { t } = useTranslation();
  const keyMetrics = buildKeyMetrics(row);
  const k = row.kpiSnapshot;

  return (
    <div className={cn('bg-card rounded-xl border p-3', expanded ? 'border-primary/30' : 'border-border')}>
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={expanded}
        aria-label={expanded ? t('thongKeSanXuat.mobile.thuGon') : t('thongKeSanXuat.mobile.xemChiTiet')}
        className="w-full text-left space-y-2"
      >
        <div className="flex items-center gap-2">
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold tabular-nums text-foreground">{formatDateShort(row.ngay)}</p>
            <p className="text-xs text-muted-foreground truncate">{row.ten_chi_nhanh}</p>
          </div>
          <div className="flex gap-0.5 shrink-0">
            <BcBadge has={!!row.bcnc} label={t('thongKeSanXuat.badge.bcnc')} />
            <BcBadge has={!!row.bcsc} label={t('thongKeSanXuat.badge.bcsc')} />
            <BcBadge has={!!row.dbdt} label={t('thongKeSanXuat.badge.dbdt')} />
          </div>
          <span className="text-muted-foreground shrink-0">
            {expanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
          </span>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {keyMetrics.map((km) => (
            <Metric key={km.id} metric={km} />
          ))}
        </div>
      </button>

      {expanded && (
        <div className="mt-3 pt-3 border-t border-border/60 space-y-3">
          {buildRowSections(row).map((section) => (
            <div key={section.id} className="space-y-1.5">
              <SubHeading className={SECTION_HEAD_CLS[section.id]}>{t(section.titleKey)}</SubHeading>
              <div className="grid grid-cols-3 gap-x-2 gap-y-2">
                {section.metrics.map((mt) => (
                  <Metric key={mt.id} metric={mt} />
                ))}
              </div>
              {section.id === 'soChe' && k && k.tongKpi > 0 && (
                <div className="flex items-center gap-2 pt-0.5">
                  <span className="text-xs text-muted-foreground">{t('thongKeSanXuat.table.kpi')}</span>
                  <KpiBadges kpiSnapshot={k} />
                </div>
              )}
            </div>
          ))}
          <ChiTietChuyen row={row} />
          <ChiTietKpi row={row} />
          <PhamCap row={row} />
        </div>
      )}
    </div>
  );
}

const ThongKeSanXuatCards: React.FC<{ rows: ThongKeSanXuatRow[] }> = ({ rows }) => {
  const { t } = useTranslation();
  const [expandedKeys, setExpandedKeys] = useState<Set<string>>(new Set());

  const toggle = (key: string) =>
    setExpandedKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });

  if (rows.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-muted-foreground gap-2">
        <Minus size={32} className="opacity-30" />
        <p className="text-sm">{t('thongKeSanXuat.table.empty')}</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {rows.map((row) => (
        <DayCard key={row.key} row={row} expanded={expandedKeys.has(row.key)} onToggle={() => toggle(row.key)} />
      ))}
    </div>
  );
};

export default ThongKeSanXuatCards;
