/**
 * Khối dựng phiếu in chuẩn hệ thống: tờ giấy đúng khổ (header công ty + tiêu đề + chân
 * "In lúc"), dòng chấm, tiêu đề mục, lưới thông tin 2 cột, hàng ô ký.
 * Cỡ chữ dùng pt (theo docs/UI-CONVENTIONS.md cho bản in), không dùng token text-* của app.
 */
import React from 'react';
import { useTranslation } from 'react-i18next';
import { cn, formatDateTime } from '../../../lib/utils';
import { useUIStore } from '../../../store/useStore';

interface KhungPhieuProps {
  /** Khổ giấy (mm) theo hướng đang in. */
  wMm: number;
  hMm: number;
  /** Lề trang (mm) — trên màn hình là padding, khi in do @page lo. */
  leMm: number;
  title: string;
  subtitle?: string;
  /** Khổ nhỏ (A5): chữ và header thu nhỏ. */
  compact?: boolean;
  /**
   * Class gốc của tờ giấy — CSS in (`@media print` trong index.css) và hàm xuất file tìm
   * nút theo class này. Mặc định `phieu-in-content` (khung trang PhieuInPage).
   */
  className?: string;
  children: React.ReactNode;
}

/** Tờ giấy đúng khổ: header công ty, tiêu đề, nội dung, chân "In lúc". */
export const KhungPhieu: React.FC<KhungPhieuProps> = ({
  wMm,
  hMm,
  leMm,
  title,
  subtitle,
  compact = false,
  className = 'phieu-in-content',
  children,
}) => {
  const { t } = useTranslation();
  const company = useUIStore((s) => s.companyInfo);
  return (
    <div
      className={cn(className, 'bg-white text-gray-900 font-sans box-border flex flex-col p-[var(--le)] print:p-0')}
      style={
        {
          '--le': `${leMm}mm`,
          width: `${wMm}mm`,
          minHeight: `${hMm}mm`,
          fontSize: compact ? '9pt' : '10.5pt',
        } as React.CSSProperties
      }
    >
      <div className={cn('flex items-center gap-3 border-b-2 border-gray-300', compact ? 'pb-2 mb-2' : 'pb-3 mb-3')}>
        {company.appLogo && (
          <img src={company.appLogo} alt="" className={cn('object-contain shrink-0', compact ? 'w-10 h-10' : 'w-14 h-14')} />
        )}
        <div className="min-w-0 flex-1">
          <h2 className={cn('font-bold uppercase tracking-tight leading-tight', compact ? 'text-[9.5pt]' : 'text-[12pt]')}>
            {company.companyName}
          </h2>
          {company.address && (
            <p className={cn('text-gray-600 mt-0.5', compact ? 'text-[7pt]' : 'text-[8pt]')}>
              {t('company.address')}: {company.address}
            </p>
          )}
        </div>
      </div>

      <h1 className={cn('text-center font-bold uppercase', compact ? 'text-[12pt] mb-0.5' : 'text-[15pt] mb-1')}>{title}</h1>
      {subtitle && <p className="text-center text-[0.85em] text-gray-500 mb-3">{subtitle}</p>}
      {!subtitle && <div className={compact ? 'mb-2' : 'mb-3'} />}

      <div className="flex-1 flex flex-col">{children}</div>

      <footer className="mt-3 pt-2 border-t border-gray-200">
        <p className="text-[7pt] text-gray-500 m-0">
          {t('common.phieuIn.inLuc')} {formatDateTime(new Date())}
        </p>
      </footer>
    </div>
  );
};

/** Dòng "Nhãn: ........ giá trị" như phiếu giấy — giá trị trống vẫn để dòng chấm để ghi tay. */
export const DongCham: React.FC<{ label: string; value?: React.ReactNode; className?: string }> = ({
  label,
  value,
  className,
}) => (
  <div className={cn('flex items-end gap-1.5 min-w-0', className)}>
    <span className="font-semibold whitespace-nowrap shrink-0">{label}:</span>
    <span className="flex-1 min-w-[2em] border-b border-dotted border-gray-500 pb-0.5 leading-snug break-words">
      {value || ' '}
    </span>
  </div>
);

export const TieuDeMuc: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <h3 className="text-[1em] font-bold uppercase mt-2.5 mb-1 text-gray-900">{children}</h3>
);

/** Lưới 2 cột nhãn–giá trị (dạng bảng viền). */
export const BangThongTin: React.FC<{ rows: [string, React.ReactNode][] }> = ({ rows }) => (
  <table className="w-full border-collapse text-[0.95em]">
    <tbody>
      {Array.from({ length: Math.ceil(rows.length / 2) }, (_, i) => rows.slice(i * 2, i * 2 + 2)).map((pair, i) => (
        <tr key={i}>
          {pair.map(([k, v]) => (
            <React.Fragment key={k}>
              <td className="border border-gray-300 bg-gray-50 px-2 py-1 font-semibold whitespace-nowrap w-[18%]">{k}</td>
              <td className="border border-gray-300 px-2 py-1 w-[32%]">{v || '—'}</td>
            </React.Fragment>
          ))}
          {pair.length === 1 && <td className="border border-gray-300" colSpan={2} />}
        </tr>
      ))}
    </tbody>
  </table>
);

/** Hàng ô ký: tiêu đề + "(Ký, ghi rõ họ tên)" + khoảng trống ký. */
export const HangKyTen: React.FC<{ labels: string[]; className?: string; /** Khoảng trống ký (mm), mặc định 15. */ khoangKyMm?: number }> = ({
  labels,
  className,
  khoangKyMm = 15,
}) => {
  const { t } = useTranslation();
  return (
    <div
      className={cn('grid gap-2 mt-4 text-center break-inside-avoid', className)}
      style={{ gridTemplateColumns: `repeat(${labels.length}, minmax(0, 1fr))` }}
    >
      {labels.map((l) => (
        <div key={l}>
          <p className="font-bold m-0">{l}</p>
          <p className="text-[0.8em] italic text-gray-500 m-0">{t('common.phieuIn.kyHint')}</p>
          <div style={{ height: `${khoangKyMm}mm` }} />
        </div>
      ))}
    </div>
  );
};
