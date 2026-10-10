/**
 * Mẫu in "Phiếu đăng ký tham quan farm" — bám phiếu giấy, xếp gọn cho A5 ngang (mặc định):
 * bảng khách ở trên, ba mục Thời gian · Mục đích · Phương tiện chia ba cột, cam kết + hai ô ký.
 * `phieu = null` → phiếu trắng để khách vãng lai điền tay.
 */
import React from 'react';
import { useTranslation } from 'react-i18next';
import { cn, formatYmdToDisplay } from '../../../../../lib/utils';
import { useUIStore } from '../../../../../store/useStore';
import { usePhieuIn } from '../../../../../components/shared/phieu-in/phieu-in-context';
import { MUC_DICH_THAM_QUAN, PHUONG_TIEN, type DangKyThamQuan } from '../../core/types';
import { dongKhachIn } from '../../core/khach';
import { SO_DONG_KHACH_TOI_THIEU, tachGioPhutNgay, type GioPhutNgay } from '../../core/mau-in';

/** Cỡ chữ gốc (pt) theo khổ — truyền cho khung in. */
export const coChuPhieuThamQuan = (kho: 'a4' | 'a5') => (kho === 'a5' ? 9 : 11);

const O: React.FC<{ on: boolean }> = ({ on }) => (
  <span className="inline-flex h-[1.05em] w-[1.05em] shrink-0 items-center justify-center border border-gray-700 text-[0.85em] font-bold leading-none align-[-0.15em]">
    {on ? '✓' : ''}
  </span>
);

/** Ô điền có gạch chấm — trống vẫn giữ chỗ để ghi tay. */
const Cham: React.FC<{ children?: React.ReactNode; className?: string }> = ({ children, className }) => (
  <span className={cn('inline-block border-b border-dotted border-gray-600 text-center leading-tight px-0.5', className)}>
    {children || ' '}
  </span>
);

const DongGio: React.FC<{ nhan: string; v: GioPhutNgay | null }> = ({ nhan, v }) => {
  const { t } = useTranslation();
  return (
    <p className="m-0 whitespace-nowrap">
      <span className="inline-block w-[2.6em]">{nhan}:</span>
      <Cham className="w-[1.8em]">{v?.gio}</Cham> {t('dangKyThamQuan.preview.gio')} <Cham className="w-[1.8em]">{v?.phut}</Cham>{' '}
      {t('dangKyThamQuan.preview.phut')} <Cham className="w-[5.6em]">{v?.ngay}</Cham>
    </p>
  );
};

const TieuDe: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <h3 className="m-0 mb-1 font-bold text-[1em]">{children}</h3>
);

const COT_KHACH: { key: string; rong: string; can?: 'center' }[] = [
  { key: 'stt', rong: '5%', can: 'center' },
  { key: 'hoTen', rong: '20%' },
  { key: 'gioiTinh', rong: '7%', can: 'center' },
  { key: 'quocTich', rong: '10%' },
  { key: 'sdt', rong: '13%' },
  { key: 'nguoiGioiThieu', rong: '14%' },
  { key: 'khuVuc', rong: '13%' },
  { key: 'donVi', rong: '18%' },
];

const PhieuThamQuanPreview: React.FC<{ phieu: DangKyThamQuan | null }> = ({ phieu }) => {
  const { t } = useTranslation();
  const company = useUIStore((s) => s.companyInfo);
  const { compact } = usePhieuIn();
  const farm = phieu?.ten_chi_nhanh ?? '';
  const dong = dongKhachIn(phieu?.khach ?? [], SO_DONG_KHACH_TOI_THIEU);
  const tu = tachGioPhutNgay(phieu?.tg_bat_dau);
  const den = tachGioPhutNgay(phieu?.tg_ket_thuc);
  const daiDien = phieu?.nguoi_dai_dien || phieu?.khach[0]?.ho_ten || '';
  const th = 'border border-gray-500 bg-gray-100 px-1 py-0.5 font-semibold align-middle leading-tight';
  const td = 'border border-gray-400 px-1 py-0.5 align-middle leading-tight break-words';

  return (
    <div
      className="phieu-in-content bg-white text-gray-900 font-sans box-border flex flex-col"
      style={{ minHeight: 'var(--in-trang-h, auto)', fontSize: compact ? '9pt' : '11pt' }}
    >
      {/* Đầu phiếu: công ty bên trái, số phiếu / ngày bên phải — một dòng cho gọn khổ A5. */}
      <div className="flex items-center gap-2 text-[0.8em] text-gray-600">
        {company.appLogo && <img src={company.appLogo} alt="" className="h-[1.8em] w-[1.8em] object-contain shrink-0" />}
        <span className="flex-1 min-w-0 font-semibold uppercase truncate">{company.companyName}</span>
        {phieu && (
          <span className="shrink-0 tabular-nums">
            {t('dangKyThamQuan.preview.so')}: {phieu.id} · {formatYmdToDisplay(phieu.ngay_dang_ky)}
          </span>
        )}
      </div>
      <h1 className="m-0 mt-0.5 pb-0.5 border-b border-gray-700 text-center font-bold uppercase text-[1.35em] leading-tight tracking-tight">
        {farm ? t('dangKyThamQuan.preview.tieuDe', { farm }) : t('dangKyThamQuan.preview.tieuDeTrang')}
      </h1>

      <div className="mt-1.5">
        <TieuDe>{t('dangKyThamQuan.preview.muc1')}</TieuDe>
        <table className="w-full border-collapse table-fixed text-[0.95em]">
          <thead>
            <tr>
              {COT_KHACH.map((c) => (
                <th key={c.key} className={cn(th, c.can === 'center' ? 'text-center' : 'text-left')} style={{ width: c.rong }}>
                  {t(`dangKyThamQuan.khach.${c.key}`)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {dong.map((k, i) => (
              <tr key={i} style={{ height: compact ? '5.8mm' : '7.5mm' }}>
                <td className={cn(td, 'text-center tabular-nums')}>{i + 1}</td>
                <td className={cn(td, 'font-semibold')}>{k?.ho_ten}</td>
                <td className={cn(td, 'text-center')}>{k?.gioi_tinh ? t(`dangKyThamQuan.gioiTinh.${k.gioi_tinh}`) : ''}</td>
                <td className={td}>{k?.quoc_tich}</td>
                <td className={cn(td, 'tabular-nums')}>{k?.so_dien_thoai}</td>
                <td className={td}>{k?.nguoi_gioi_thieu}</td>
                <td className={td}>{k?.khu_vuc_tham_quan}</td>
                <td className={td}>{k?.don_vi_lam_viec}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-1.5 grid grid-cols-[1.25fr_1fr_1fr] gap-3 break-inside-avoid">
        <div>
          <TieuDe>{t('dangKyThamQuan.preview.muc2')}</TieuDe>
          <div className="space-y-1.5">
            <DongGio nhan={t('dangKyThamQuan.form.tu')} v={tu} />
            <DongGio nhan={t('dangKyThamQuan.form.den')} v={den} />
          </div>
        </div>
        <div>
          <TieuDe>{t('dangKyThamQuan.preview.muc3')}</TieuDe>
          <ul className="m-0 p-0 list-none space-y-0.5">
            {MUC_DICH_THAM_QUAN.map((m) => (
              <li key={m} className="flex items-start gap-1.5">
                <O on={!!phieu?.muc_dich.includes(m)} />
                <span className="min-w-0">
                  {t(`dangKyThamQuan.mucDich.${m}`)}
                  {m === 'khac' && (
                    <>
                      : <Cham className="min-w-[6em] text-left">{phieu?.muc_dich_khac}</Cham>
                    </>
                  )}
                </span>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <TieuDe>{t('dangKyThamQuan.preview.muc4')}</TieuDe>
          <ul className="m-0 p-0 list-none space-y-0.5">
            {PHUONG_TIEN.map((p) => (
              <li key={p} className="flex items-start gap-1.5">
                <O on={phieu?.phuong_tien === p} />
                <span>{t(`dangKyThamQuan.phuongTien.${p}`)}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <p className="m-0 mt-1.5 leading-snug break-inside-avoid">
        <b>{t('dangKyThamQuan.preview.muc5')}:</b>{' '}
        {t('dangKyThamQuan.preview.camKet', { farm: farm || t('dangKyThamQuan.preview.camKetFarmMacDinh') })}
      </p>

      {/* Hai ô ký đẩy xuống cuối trang; ngày ký lấy theo ngày đăng ký. */}
      <div className="mt-auto pt-1 grid grid-cols-2 gap-6 text-center leading-tight break-inside-avoid">
        <div>
          <p className="m-0 italic">
            {t('dangKyThamQuan.preview.ngay')} <Cham className="w-[6.5em]">{phieu ? formatYmdToDisplay(phieu.ngay_dang_ky) : ''}</Cham>
          </p>
          <p className="m-0 font-bold">{t('dangKyThamQuan.preview.kyDaiDien')}</p>
          <p className="m-0 text-[0.85em] italic text-gray-500">{t('common.phieuIn.kyHint')}</p>
          <div style={{ height: compact ? '10mm' : '16mm' }} />
          <p className="m-0 font-semibold">{daiDien}</p>
        </div>
        <div>
          <p className="m-0 italic">&nbsp;</p>
          <p className="m-0 font-bold">{t('dangKyThamQuan.preview.kyTiepDon')}</p>
          <p className="m-0 text-[0.85em] italic text-gray-500">{t('common.phieuIn.kyHint')}</p>
          <div style={{ height: compact ? '10mm' : '16mm' }} />
          <p className="m-0 font-semibold">{phieu?.ten_nguoi_tiep_don ?? ''}</p>
        </div>
      </div>
    </div>
  );
};

export default PhieuThamQuanPreview;
