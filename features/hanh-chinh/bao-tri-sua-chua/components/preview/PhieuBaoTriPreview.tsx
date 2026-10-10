/**
 * Mẫu in phiếu bảo trì / sửa chữa (mặc định A4 dọc, 1 trang) — cùng khuôn phiếu hành chính:
 * header công ty + số phiếu, thông tin chung, nội dung + số tiền, kết quả duyệt, ba ô ký.
 */
import React from 'react';
import { useTranslation } from 'react-i18next';
import { formatCurrency, formatDate, formatDateTime } from '../../../../../lib/utils';
import { useUIStore } from '../../../../../store/useStore';
import type { PhieuBaoTriSuaChua, TrangThaiPhieu } from '../../core/types';
import { duLieuPhieuIn } from '../../core/phieu-in';

const MAU_DAU: Record<TrangThaiPhieu, string> = {
  da_duyet: '#15803d',
  khong_duyet: '#b91c1c',
  cho_duyet: '#b45309',
};

const BangTT: React.FC<{ rows: [string, string | null | undefined, string?][] }> = ({ rows }) => (
  <table className="w-full border-collapse">
    <tbody>
      {rows.map(([nhan, giaTri, cls]) => (
        <tr key={nhan}>
          <td className="w-[32%] border border-gray-400 bg-gray-100 px-1.5 py-1 align-top font-bold">{nhan}</td>
          <td className={`border border-gray-400 px-1.5 py-1 align-top ${cls ?? ''}`}>{giaTri || ' '}</td>
        </tr>
      ))}
    </tbody>
  </table>
);

const Muc: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="mt-3.5 mb-1.5 font-bold uppercase">{children}</div>
);

const PhieuBaoTriPreview: React.FC<{ phieu: PhieuBaoTriSuaChua }> = ({ phieu }) => {
  const { t: tg } = useTranslation();
  const t = (k: string) => tg(`baoTriSuaChua.print.${k}`);
  const info = useUIStore((s) => s.companyInfo);
  const d = duLieuPhieuIn(phieu, tg, { tien: formatCurrency, ngayGio: formatDate });
  const mau = MAU_DAU[d.trangThai];
  const lienHe = [
    info.address && `${tg('company.address')}: ${info.address}`,
    info.phone && `${tg('company.phone')}: ${info.phone}`,
    info.taxId && `${tg('company.taxId')}: ${info.taxId}`,
  ].filter(Boolean) as string[];

  return (
    <div
      className="phieu-in-content relative flex flex-col overflow-hidden bg-white text-[#111] min-h-[var(--in-trang-h,auto)]"
      style={{ fontFamily: "'Times New Roman', Times, serif", fontSize: '12pt', lineHeight: 1.45 }}
    >
      <div className="flex items-start gap-2.5">
        {info.appLogo && <img src={info.appLogo} alt="" className="w-[56px] h-[56px] object-contain shrink-0" />}
        <div className="flex-1 min-w-0">
          <div className="font-bold uppercase text-[12.5pt]">{info.companyName}</div>
          {lienHe.map((s) => (
            <div key={s} className="text-[9.5pt] text-[#444]">
              {s}
            </div>
          ))}
        </div>
        <div className="text-right whitespace-nowrap text-[11pt]">
          <div>
            {t('soPhieu')}: <b>{d.soPhieu}</b>
          </div>
          <div className="text-[9.5pt] text-[#444]">
            {t('ngayLap')}: {d.ngayLap}
          </div>
        </div>
      </div>
      <hr className="border-0 border-t-[1.5px] border-[#111] mt-2 mb-[18px]" />
      <h1 className="text-center text-[17pt] font-bold m-0 mb-1 tracking-[.5px]">{t('title')}</h1>
      <p className="text-center italic m-0 mb-[18px]">
        {t('ngay')}: {d.ngay}
      </p>

      <Muc>{t('mucChung')}</Muc>
      <BangTT
        rows={[
          [t('nguoiDeNghi'), d.nguoiDeNghi],
          [t('chiNhanh'), d.chiNhanh],
          [t('taiSan'), d.taiSan],
          [t('hangMuc'), d.hangMuc],
        ]}
      />

      <Muc>{t('mucNoiDung')}</Muc>
      <BangTT
        rows={[
          [t('moTa'), d.moTa],
          [t('nhaCungCap'), d.nhaCungCap],
          [t('soTien'), d.soTien, 'font-bold'],
          [t('bangChu'), d.soTienChu, 'italic'],
          [t('ghiChu'), d.ghiChu],
        ]}
      />

      <div className="relative">
        <Muc>{t('mucKetQua')}</Muc>
        <span
          className="absolute right-0 -top-1.5 rounded-md border-[2.5px] px-3.5 py-1 font-bold uppercase text-[14pt] tracking-[1px]"
          style={{ color: mau, borderColor: mau, transform: 'rotate(-8deg)' }}
        >
          {d.trangThaiLabel}
        </span>
        <BangTT
          rows={[
            [t('trangThai'), d.trangThaiLabel],
            [t('nguoiDuyet'), d.nguoiDuyet],
          ]}
        />
      </div>

      <p className="text-right italic mt-[26px] mb-1.5">{t('ngayKy')}</p>
      <div className="grid grid-cols-3 text-center break-inside-avoid">
        {(
          [
            ['nguoiDeNghi', d.nguoiDeNghi],
            ['truongBoPhan', ''],
            ['nguoiDuyet', d.nguoiDuyet],
          ] as const
        ).map(([k, ten]) => (
          <div key={k} className="px-1">
            <div className="font-bold text-[11pt]">{t(`ky.${k}`)}</div>
            <div className="italic text-[9.5pt] text-[#555]">{t('ky.goiY')}</div>
            <div className="pt-[72px] font-bold">{ten || ' '}</div>
          </div>
        ))}
      </div>

      <div className="mt-auto pt-2.5 border-t border-[#ccc] text-[8.5pt] text-[#666]">
        {t('inLuc')} {formatDateTime(new Date())}
      </div>
    </div>
  );
};

export default PhieuBaoTriPreview;
