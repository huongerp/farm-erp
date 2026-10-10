/**
 * Mẫu in phiếu hành chính (mặc định A4 dọc, 1 trang): header công ty + số phiếu, tiêu đề,
 * người đề nghị, nội dung, kết quả xử lý (dấu trạng thái), ba ô ký. Dữ liệu từ `duLieuPhieuIn`.
 */
import React from 'react';
import { useTranslation } from 'react-i18next';
import { formatDate, formatDateTime } from '../../../../../lib/utils';
import { useUIStore } from '../../../../../store/useStore';
import type { AdminFormRequest } from '../../core/types';
import { duLieuPhieuIn, type KetQuaIn } from '../../core/phieu-in';

const MAU_DAU: Record<KetQuaIn, string> = {
  dong_y: '#15803d',
  khong_dong_y: '#b91c1c',
  cho: '#b45309',
  huy: '#6b7280',
};

const BangTT: React.FC<{ rows: [string, string | null | undefined][] }> = ({ rows }) => (
  <table className="w-full border-collapse">
    <tbody>
      {rows.map(([nhan, giaTri]) => (
        <tr key={nhan}>
          <td className="w-[32%] border border-gray-400 bg-gray-100 px-1.5 py-1 align-top font-bold">{nhan}</td>
          <td className="border border-gray-400 px-1.5 py-1 align-top">{giaTri || ' '}</td>
        </tr>
      ))}
    </tbody>
  </table>
);

const Muc: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="mt-3.5 mb-1.5 font-bold uppercase">{children}</div>
);

const PhieuHanhChinhPreview: React.FC<{ phieu: AdminFormRequest }> = ({ phieu }) => {
  const { t } = useTranslation();
  const info = useUIStore((s) => s.companyInfo);
  const d = duLieuPhieuIn(phieu, t, formatDate);
  const mau = MAU_DAU[d.ketQua];
  const kinhGui = [
    `${t('adminForm.print.banGiamDoc')}${info.companyName ? ` ${info.companyName}` : ''}`,
    d.phongBan && `${t('adminForm.print.truong')} ${d.phongBan}`,
  ]
    .filter(Boolean)
    .join('; ');
  const lienHe = [
    info.address && `${t('company.address')}: ${info.address}`,
    info.phone && `${t('company.phone')}: ${info.phone}`,
    info.taxId && `${t('company.taxId')}: ${info.taxId}`,
  ].filter(Boolean) as string[];
  const tick = (on: boolean, nhan: string) => (
    <span className="inline-block mr-7">
      {on ? '☑' : '☐'} {nhan}
    </span>
  );

  return (
    <div
      className="phieu-in-content relative flex flex-col overflow-hidden bg-white text-[#111] min-h-[var(--in-trang-h,auto)]"
      style={{ fontFamily: "'Times New Roman', Times, serif", fontSize: '12pt', lineHeight: 1.45 }}
    >
      {d.ketQua === 'huy' && (
        <div
          className="absolute left-1/2 top-[45%] whitespace-nowrap font-bold pointer-events-none"
          style={{ transform: 'translate(-50%,-50%) rotate(-30deg)', fontSize: '90pt', color: 'rgba(107,114,128,.13)' }}
        >
          {t('adminForm.print.dau.huy')}
        </div>
      )}

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
            {t('adminForm.print.soPhieu')}: <b>{d.soPhieu}</b>
          </div>
          <div className="text-[9.5pt] text-[#444]">
            {t('adminForm.print.ngayLap')}: {d.ngayLap}
          </div>
        </div>
      </div>
      <hr className="border-0 border-t-[1.5px] border-[#111] mt-2 mb-[18px]" />
      <h1 className="text-center text-[17pt] font-bold m-0 mb-1 tracking-[.5px]">{d.tieuDe}</h1>
      <p className="text-center italic m-0 mb-[18px]">
        {t('adminForm.print.kinhGui')}: {kinhGui}
      </p>

      <Muc>{t('adminForm.print.mucNguoi')}</Muc>
      <BangTT
        rows={[
          [t('adminForm.print.hoTen'), d.nguoiDeNghi],
          [t('adminForm.print.phongBan'), d.phongBan],
        ]}
      />

      <Muc>{t('adminForm.print.mucNoiDung')}</Muc>
      <BangTT
        rows={[
          [t('adminForm.print.loaiPhieu'), d.loaiPhieu],
          [t('adminForm.print.thoiGian'), d.thoiGian],
          ...(d.soNgay != null ? [[t('adminForm.print.soNgay'), d.soNgay] as [string, string]] : []),
          [t('adminForm.print.lyDo'), d.lyDo],
        ]}
      />

      <div className="relative">
        <Muc>{t('adminForm.print.mucKetQua')}</Muc>
        <span
          className="absolute right-1 top-3.5 rounded-md border-[2.5px] px-3.5 py-1 font-bold text-[14pt] tracking-[1px]"
          style={{ color: mau, borderColor: mau, transform: 'rotate(-8deg)' }}
        >
          {t(`adminForm.print.dau.${d.ketQua}`)}
        </span>
        <p className="mt-1 mb-2">
          {tick(d.ketQua === 'dong_y', t('adminForm.print.dongY'))}
          {tick(d.ketQua === 'khong_dong_y', t('adminForm.print.khongDongY'))}
        </p>
        <BangTT
          rows={[
            [t('adminForm.print.ghiChu'), d.ghiChu],
            [t('adminForm.print.ngayXuLy'), d.ngayXuLy ?? ''],
          ]}
        />
      </div>

      <p className="text-right italic mt-[26px] mb-1.5">{t('adminForm.print.ngayKy')}</p>
      <div className="grid grid-cols-3 text-center break-inside-avoid">
        {(['nguoiDeNghi', 'truongBoPhan', 'hcns'] as const).map((k) => (
          <div key={k} className="px-1">
            <div className="font-bold text-[10.5pt] whitespace-nowrap">{t(`adminForm.print.ky.${k}`)}</div>
            <div className="italic text-[9.5pt] text-[#555]">{t('adminForm.print.ky.goiY')}</div>
            <div className="pt-[72px] font-bold">{k === 'nguoiDeNghi' ? d.nguoiDeNghi : ' '}</div>
          </div>
        ))}
      </div>

      <div className="mt-auto pt-2.5 border-t border-[#ccc] text-[8.5pt] text-[#666]">
        {t('adminForm.print.inLuc')} {formatDateTime(new Date())}
      </div>
    </div>
  );
};

export default PhieuHanhChinhPreview;
