/** Mảnh dựng chung cho 3 mẫu in (khung giấy + header công ty, dòng chấm, ô ký, bảng hàng). */
import React from 'react';
import { useTranslation } from 'react-i18next';
import { cn, formatDateTime, formatNumberVN } from '../../../../../lib/utils';
import { useUIStore } from '../../../../../store/useStore';
import type { NhomHangHoa } from '../../core/gop-hang-hoa';
import { kichThuocGiay, leTrang, type HuongGiay, type KhoGiay } from '../../core/mau-in';

interface KhungProps {
  kho: KhoGiay;
  huong: HuongGiay;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}

/** Tờ giấy đúng khổ: header công ty, tiêu đề, nội dung, chân "In lúc". */
export const KhungPhieu: React.FC<KhungProps> = ({ kho, huong, title, subtitle, children }) => {
  const { t } = useTranslation();
  const company = useUIStore((s) => s.companyInfo);
  const { wMm, hMm } = kichThuocGiay(kho, huong);
  const nho = kho === 'a5';
  return (
    <div
      className="dknh-preview-content bg-white text-gray-900 font-sans box-border flex flex-col p-[var(--le)] print:p-0"
      style={
        {
          '--le': `${leTrang(kho)}mm`,
          width: `${wMm}mm`,
          minHeight: `${hMm}mm`,
          fontSize: nho ? '9pt' : '10.5pt',
        } as React.CSSProperties
      }
    >
      <div className={cn('flex items-center gap-3 border-b-2 border-gray-300', nho ? 'pb-2 mb-2' : 'pb-3 mb-3')}>
        {company.appLogo && (
          <img src={company.appLogo} alt="" className={cn('object-contain shrink-0', nho ? 'w-10 h-10' : 'w-14 h-14')} />
        )}
        <div className="min-w-0 flex-1">
          <h2 className={cn('font-bold uppercase tracking-tight leading-tight', nho ? 'text-[9.5pt]' : 'text-[12pt]')}>
            {company.companyName}
          </h2>
          {company.address && (
            <p className={cn('text-gray-600 mt-0.5', nho ? 'text-[7pt]' : 'text-[8pt]')}>
              {t('company.address')}: {company.address}
            </p>
          )}
        </div>
      </div>

      <h1 className={cn('text-center font-bold uppercase', nho ? 'text-[12pt] mb-0.5' : 'text-[15pt] mb-1')}>{title}</h1>
      {subtitle && <p className="text-center text-[0.85em] text-gray-500 mb-3">{subtitle}</p>}
      {!subtitle && <div className={nho ? 'mb-2' : 'mb-3'} />}

      <div className="flex-1 flex flex-col">{children}</div>

      <footer className="mt-3 pt-2 border-t border-gray-200">
        <p className="text-[7pt] text-gray-500 m-0">
          {t('dangKyNhanHang.preview.inLuc')} {formatDateTime(new Date())}
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
      {value || ' '}
    </span>
  </div>
);

export const TieuDeMuc: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <h3 className="text-[1em] font-bold uppercase mt-2.5 mb-1 text-gray-900">{children}</h3>
);

/** Lưới 2 cột nhãn–giá trị (dạng bảng viền) cho mẫu kiểm hàng / tổng hợp. */
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

export const BangHangHoa: React.FC<{ nhom: NhomHangHoa[] }> = ({ nhom }) => {
  const { t } = useTranslation();
  const tong = nhom.reduce((s, n) => s + n.so_luong, 0);
  const th = 'border border-gray-400 bg-gray-100 px-2 py-1 font-semibold';
  const td = 'border border-gray-300 px-2 py-1';
  return (
    <table className="w-full border-collapse text-[0.95em]">
      <thead>
        <tr>
          <th className={cn(th, 'w-[8%] text-center')}>STT</th>
          <th className={cn(th, 'w-[20%] text-left')}>{t('dangKyNhanHang.preview.maHang')}</th>
          <th className={cn(th, 'text-left')}>{t('dangKyNhanHang.preview.tenHang')}</th>
          <th className={cn(th, 'w-[12%] text-center')}>{t('dangKyNhanHang.hangHoa.dvt')}</th>
          <th className={cn(th, 'w-[14%] text-right')}>{t('dangKyNhanHang.hangHoa.soLuong')}</th>
        </tr>
      </thead>
      <tbody>
        {nhom.length === 0 ? (
          <tr>
            <td className={cn(td, 'text-center text-gray-500 italic py-3')} colSpan={5}>
              {t('dangKyNhanHang.hangHoa.empty')}
            </td>
          </tr>
        ) : (
          nhom.map((n, i) => (
            <tr key={n.id_hang_hoa}>
              <td className={cn(td, 'text-center')}>{i + 1}</td>
              <td className={cn(td, 'font-mono')}>{n.ma_hang_hoa}</td>
              <td className={td}>{n.ten_hang_hoa}</td>
              <td className={cn(td, 'text-center')}>{n.dvt}</td>
              <td className={cn(td, 'text-right tabular-nums')}>{formatNumberVN(n.so_luong)}</td>
            </tr>
          ))
        )}
      </tbody>
      {nhom.length > 0 && (
        <tfoot>
          <tr>
            <td className={cn(td, 'text-right font-bold')} colSpan={4}>
              {t('dangKyNhanHang.preview.tong')}
            </td>
            <td className={cn(td, 'text-right font-bold tabular-nums')}>{formatNumberVN(tong)}</td>
          </tr>
        </tfoot>
      )}
    </table>
  );
};

/** Hàng ô ký: tiêu đề + "(Ký, ghi rõ họ tên)" + khoảng trống ký. */
export const HangKyTen: React.FC<{ labels: string[]; className?: string }> = ({ labels, className }) => {
  const { t } = useTranslation();
  return (
    <div
      className={cn('grid gap-2 mt-4 text-center break-inside-avoid', className)}
      style={{ gridTemplateColumns: `repeat(${labels.length}, minmax(0, 1fr))` }}
    >
      {labels.map((l) => (
        <div key={l}>
          <p className="font-bold m-0">{l}</p>
          <p className="text-[0.8em] italic text-gray-500 m-0">{t('dangKyNhanHang.preview.kyHint')}</p>
          <div className="h-[15mm]" />
        </div>
      ))}
    </div>
  );
};
