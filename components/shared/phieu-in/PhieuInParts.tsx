/**
 * Khối dựng phiếu in chuẩn hệ thống — MỌI mẫu phiếu dùng chung để đầu phiếu, màu bảng, ô ký
 * thống nhất: tờ giấy đúng khổ (header công ty + số phiếu + tiêu đề + chân "In lúc"), ô bảng
 * `TH_IN`/`TD_IN`, dòng chấm, tiêu đề mục, lưới thông tin 2 cột, hàng ô ký.
 * Cỡ chữ dùng pt (theo docs/UI-CONVENTIONS.md cho bản in), không dùng token text-* của app.
 */
import React from 'react';
import { useTranslation } from 'react-i18next';
import { cn, formatDateTime, formatNumberVN } from '../../../lib/utils';
import { useUIStore } from '../../../store/useStore';
import { usePhieuIn } from './phieu-in-context';
import { BANG_HINH_URL } from '../../../lib/phieu-in/bang-hinh';

/**
 * Ô đầu bảng / ô dữ liệu chuẩn bản in. Màu CỐ ĐỊNH (không theo màu theme của người dùng) —
 * in trắng đen vẫn đọc rõ, phiếu của mọi người in ra giống nhau.
 */
export const TH_IN = 'border border-gray-400 bg-gray-100 text-gray-900 font-semibold';
export const TD_IN = 'border border-gray-300';

interface KhungPhieuProps {
  title: string;
  subtitle?: string;
  /** Số phiếu — in ở góc phải đầu phiếu. */
  soPhieu?: string | null;
  /** Ngày phiếu đã định dạng (dd/mm/yyyy) — in dưới số phiếu. */
  ngay?: string | null;
  /**
   * Lặp đầu phiếu (logo, công ty, số phiếu) ở mọi trang khi in — dùng cho phiếu nhiều dòng.
   * Dựng bằng bảng ngoài + `thead` (trình duyệt tự lặp), bảng ngoài không kéo cột được.
   */
  lapDauTrang?: boolean;
  /** Khổ nhỏ: chữ và header thu nhỏ. Mặc định theo khổ đang in (A5 = compact). */
  compact?: boolean;
  /**
   * Class gốc của tờ giấy — CSS in (`@media print` trong index.css) và hàm xuất file tìm
   * nút theo class này. Mặc định `phieu-in-content` (khung trang PhieuInPage).
   */
  className?: string;
  children: React.ReactNode;
}

/** Cỡ chữ gốc (pt) của KhungPhieu — truyền cho `PhieuInPage coChuGocPt`. */
export const coChuKhungPhieu = (kho: 'a4' | 'a5') => (kho === 'a5' ? 9 : 10.5);

/**
 * Băng hình «HTX NN Công Nghệ Cao fp - ForPeasantz» căn giữa trên cùng đầu phiếu, phía trên dòng công ty.
 * Phiếu tự dựng đầu riêng (không qua `KhungPhieu`) cũng đặt khối này ngay trên header của mình;
 * phiếu bó cứng 1 trang có thể truyền `rongMm` nhỏ hơn để không đẩy ô ký sang trang sau.
 */
export const BangHinhPhieuIn: React.FC<{ compact?: boolean; rongMm?: number }> = ({ compact, rongMm }) => {
  const { compact: compactKho } = usePhieuIn();
  const nho = compact ?? compactKho;
  return (
    <div className={cn('text-center leading-none', nho ? 'mb-1' : 'mb-1.5')}>
      {/* Định cỡ theo chiều rộng + h-auto: khung hẹp hơn thì max-w-full thu nhỏ mà vẫn đúng tỉ lệ
          (không dùng object-fit — html2canvas/Word không hiểu). */}
      <img
        src={BANG_HINH_URL}
        alt=""
        className={cn('inline-block h-auto max-w-full', rongMm == null && (nho ? 'w-[70mm]' : 'w-[140mm]'))}
        style={rongMm == null ? undefined : { width: `${rongMm}mm` }}
      />
    </div>
  );
};

/** Đầu phiếu: logo · tên công ty, địa chỉ, liên hệ, MST · số phiếu / ngày (phải). */
const DauPhieu: React.FC<{ compact: boolean; soPhieu?: string | null; ngay?: string | null }> = ({
  compact,
  soPhieu,
  ngay,
}) => {
  const { t } = useTranslation();
  const company = useUIStore((s) => s.companyInfo);
  const lienHe = [
    company.phone && `${t('common.phieuIn.dt')}: ${company.phone}`,
    company.email && `${t('common.phieuIn.email')}: ${company.email}`,
    company.taxId && `${t('common.phieuIn.mst')}: ${company.taxId}`,
  ].filter(Boolean);
  const chuNho = compact ? 'text-[7pt]' : 'text-[8pt]';
  return (
    <div className={cn('border-b-2 border-gray-300', compact ? 'pb-2 mb-2' : 'pb-3 mb-3')}>
      <BangHinhPhieuIn compact={compact} />
      <div className="flex items-start gap-3">
        {company.appLogo && (
          <img src={company.appLogo} alt="" className={cn('object-contain shrink-0', compact ? 'w-10 h-10' : 'w-14 h-14')} />
        )}
        <div className="min-w-0 flex-1">
          <h2 className={cn('font-bold uppercase leading-tight break-words m-0', compact ? 'text-[9.5pt]' : 'text-[12pt]')}>
            {company.companyName}
          </h2>
          {company.address && (
            <p className={cn('text-gray-600 mt-0.5 mb-0', chuNho)}>
              {t('company.address')}: {company.address}
            </p>
          )}
          {lienHe.length > 0 && <p className={cn('text-gray-600 m-0', chuNho)}>{lienHe.join(' · ')}</p>}
        </div>
        {(soPhieu || ngay) && (
          <div className={cn('shrink-0 text-right leading-snug', compact ? 'text-[7.5pt]' : 'text-[8.5pt]')}>
            {soPhieu && (
              <p className="m-0">
                {t('common.phieuIn.so')}: <span className="font-bold">{soPhieu}</span>
              </p>
            )}
            {ngay && (
              <p className="m-0 text-gray-600">
                {t('common.phieuIn.ngay')}: {ngay}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

/**
 * Nội dung tờ giấy: header công ty, tiêu đề, nội dung, chân "In lúc". Khổ, lề, cỡ chữ do khung
 * `PhieuInPage` lo; khối này cao tối thiểu đúng một trang (`--in-trang-h`) để chân nằm cuối trang.
 */
export const KhungPhieu: React.FC<KhungPhieuProps> = ({
  title,
  subtitle,
  soPhieu,
  ngay,
  lapDauTrang,
  compact: compactProp,
  className = 'phieu-in-content',
  children,
}) => {
  const { t } = useTranslation();
  const { compact: compactKho } = usePhieuIn();
  const compact = compactProp ?? compactKho;
  const dau = <DauPhieu compact={compact} soPhieu={soPhieu} ngay={ngay} />;
  const than = (
    <>
      <h1 className={cn('text-center font-bold uppercase m-0', compact ? 'text-[12pt] mb-0.5' : 'text-[15pt] mb-1')}>
        {title}
      </h1>
      {subtitle && <p className="text-center text-[0.85em] text-gray-500 mt-0 mb-3">{subtitle}</p>}
      {!subtitle && <div className={compact ? 'mb-2' : 'mb-3'} />}
    </>
  );
  return (
    <div
      className={cn(className, 'bg-white text-gray-900 font-sans box-border flex flex-col')}
      style={{ minHeight: 'var(--in-trang-h, auto)', fontSize: compact ? '9pt' : '10.5pt' }}
    >
      {lapDauTrang ? (
        <table className="w-full border-collapse" data-in-co-dinh>
          <thead>
            <tr>
              <td className="p-0">{dau}</td>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="p-0 align-top">
                {than}
                {children}
              </td>
            </tr>
          </tbody>
        </table>
      ) : (
        <>
          {dau}
          {than}
          <div className="flex-1 flex flex-col">{children}</div>
        </>
      )}

      {/* Bảng ngoài không co giãn theo flex → đệm đẩy chân xuống cuối trang. */}
      {lapDauTrang && <div className="flex-1" />}
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
              <td className="border border-gray-300 bg-gray-50 px-2 py-1 font-semibold w-[18%]">{k}</td>
              <td className="border border-gray-300 px-2 py-1 w-[32%]">{v || '—'}</td>
            </React.Fragment>
          ))}
          {pair.length === 1 && <td className="border border-gray-300" colSpan={2} />}
        </tr>
      ))}
    </tbody>
  </table>
);

export interface OKy {
  label: string;
  /** Họ tên in sẵn dưới khoảng ký (người lập, người duyệt… đã biết). */
  ten?: string | null;
}

/**
 * Hàng ô ký: tiêu đề + "(Ký, ghi rõ họ tên)" + khoảng trống ký + họ tên (nếu biết).
 * `break-inside: avoid` — không tách đôi khi sang trang (cả bản in lẫn PDF).
 */
export const HangKyTen: React.FC<{
  labels: (string | OKy)[];
  className?: string;
  /** Khoảng trống ký (mm), mặc định 20. */
  khoangKyMm?: number;
  /** Dòng "…, ngày … tháng … năm …" căn phải phía trên hàng ký. */
  dongNgay?: React.ReactNode;
}> = ({ labels, className, khoangKyMm = 20, dongNgay }) => {
  const { t } = useTranslation();
  const o = labels.map((l) => (typeof l === 'string' ? { label: l } : l));
  return (
    <div className={cn('mt-4 break-inside-avoid', className)}>
      {dongNgay && <p className="text-right italic m-0 mb-1">{dongNgay}</p>}
      <div className="grid gap-2 text-center" style={{ gridTemplateColumns: `repeat(${o.length}, minmax(0, 1fr))` }}>
        {o.map((x) => (
          <div key={x.label}>
            <p className="font-bold m-0">{x.label}</p>
            <p className="text-[0.8em] italic text-gray-500 m-0">{t('common.phieuIn.kyHint')}</p>
            <div style={{ height: `${khoangKyMm}mm` }} />
            {x.ten && <p className="font-semibold m-0">{x.ten}</p>}
          </div>
        ))}
      </div>
    </div>
  );
};

/**
 * Dòng tổng số lượng theo ĐVT cuối bảng chi tiết (không cộng lẫn đơn vị). 1–2 ĐVT: mỗi ĐVT một dòng,
 * số nằm đúng cột ĐVT / số lượng; nhiều ĐVT hơn: gom một dòng "76 Cây · 90 Đôi · …" cho gọn.
 */
export const DongTongTheoDvt: React.FC<{
  nhan: string;
  theoDvt: { dvt: string | null; soLuong: number }[];
  /** Số cột đứng trước cột ĐVT. */
  soCotTruocDvt: number;
  /** Số cột sau cột số lượng. */
  soCotSau: number;
}> = ({ nhan, theoDvt, soCotTruocDvt, soCotSau }) => {
  const td = `${TD_IN} p-1.5`;
  if (theoDvt.length > 2) {
    return (
      <tr className="bg-gray-100 font-semibold">
        <td colSpan={soCotTruocDvt} className={td}>
          {nhan}
        </td>
        <td colSpan={2 + soCotSau} className={td}>
          {theoDvt.map((d) => `${formatNumberVN(d.soLuong)} ${d.dvt ?? ''}`.trim()).join(' · ')}
        </td>
      </tr>
    );
  }
  return (
    <>
      {theoDvt.map((d, i) => (
        <tr key={i} className="bg-gray-100 font-semibold">
          {i === 0 && (
            <td colSpan={soCotTruocDvt} rowSpan={theoDvt.length} className={`${td} align-middle`}>
              {nhan}
            </td>
          )}
          <td className={`${td} text-center`}>{d.dvt ?? ''}</td>
          <td className={`${td} tabular-nums text-right`}>{formatNumberVN(d.soLuong)}</td>
          {soCotSau > 0 && <td colSpan={soCotSau} className={td} />}
        </tr>
      ))}
    </>
  );
};
