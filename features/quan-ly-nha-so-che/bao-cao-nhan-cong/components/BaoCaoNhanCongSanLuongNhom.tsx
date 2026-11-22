import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useWatch, type Control } from 'react-hook-form';
import { Boxes } from 'lucide-react';
import Input from '../../../../components/ui/Input';
import { cn, formatNumberVN } from '../../../../lib/utils';
import { GIO_CONG_MAC_DINH } from '../core/danh-sach-nv';
import type { BaoCaoNhanCongFormValues } from '../core/schema';
import { ganHeSoNhom, heSoHieuLuc, thuongVuotCuaPhieu, type HeSoNhom, type QuyVuotNgay } from '../core/thuong-vuot-thung';
import type { LoaiChuyen } from '../core/types';
import { useCaiDatThuongVuot, useKpiSoCheNgay, useViTriKhongThuongVuot } from '../hooks/use-thuong-vuot';

interface Props {
  control: Control<BaoCaoNhanCongFormValues>;
  chiTietIndex: number;
  loaiChuyen: LoaiChuyen;
  /** Hệ số nhóm sửa trên phiếu (thiếu khoá = mặc định Cài đặt). */
  heSoNhom: HeSoNhom | null | undefined;
  /** Nhà sơ chế của phiếu — lấy đơn giá / ngưỡng / hệ số mặc định và Báo cáo sơ chế cùng ngày. */
  idChiNhanh: string | null | undefined;
  onChangeHeSoNhom: (next: HeSoNhom) => void;
  disabled?: boolean;
}

/** Số đã lưu → chuỗi trong ô nhập (dấu phẩy thập phân kiểu VN). */
const hienSo = (v: number | null | undefined) => (v == null ? '' : String(v).replace('.', ','));
const fmtHeSo = (v: number) => formatNumberVN(v, { maxFractionDigits: 3 });
const fmtSo = (v: number) => formatNumberVN(v, { maxFractionDigits: 2 });

/** Dòng tóm tắt quỹ ngày lấy từ Báo cáo sơ chế (dùng chung cho form và bảng tổng hợp). */
export const DongQuyVuot: React.FC<{ quy: QuyVuotNgay | null; nguongPct: number; dangTai?: boolean; className?: string }> = ({
  quy,
  nguongPct,
  dangTai,
  className,
}) => {
  const { t } = useTranslation();
  if (dangTai) return <p className={cn('m-0 text-caption text-muted-foreground', className)}>{t('baoCaoNhanCong.vuot.dangTaiKpi')}</p>;
  if (!quy) return <p className={cn('m-0 text-caption text-amber-700 dark:text-amber-400', className)}>{t('baoCaoNhanCong.vuot.chuaCoBcsc')}</p>;
  return (
    <p className={cn('m-0 text-caption text-muted-foreground', className)}>
      {t('baoCaoNhanCong.vuot.dongQuy', {
        thucTe: fmtSo(quy.thuHoiThucTe),
        mucTieu: fmtSo(quy.thuHoiMucTieu),
        vuot: fmtSo(quy.thungVuot),
        ns: quy.nsTyLe == null ? '—' : formatNumberVN(quy.nsTyLe, { maxFractionDigits: 1 }),
        nguong: formatNumberVN(nguongPct, { maxFractionDigits: 2 }),
      })}{' '}
      <span className={cn('font-semibold', quy.datNs ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400')}>
        {quy.datNs ? t('baoCaoNhanCong.vuot.datNs') : t('baoCaoNhanCong.vuot.khongDatNs')}
      </span>
      {' · '}
      {t('baoCaoNhanCong.vuot.quyNgay', { tien: formatNumberVN(Math.round(quy.quy)) })}
    </p>
  );
};

/**
 * Khối «Thưởng vượt theo nhóm» của một chuyền: quỹ ngày lấy từ KPI Báo cáo sơ chế cùng ngày (thu hồi vượt
 * mục tiêu, chỉ khi NS sơ chế đạt ngưỡng), chia cho mọi nhóm của cả phiếu theo giờ × hệ số — nên khối đọc cả
 * `chi_tiet`. Chỉ sửa hệ số nhóm ở đây; chuỗi đang gõ giữ ở state cục bộ để không nhảy khi gõ dở («1,»).
 */
const BaoCaoNhanCongSanLuongNhom: React.FC<Props> = ({ control, chiTietIndex, loaiChuyen, heSoNhom, idChiNhanh, onChangeHeSoNhom, disabled }) => {
  const { t } = useTranslation();
  const [dangGo, setDangGo] = useState<Record<string, string>>({});
  const chiTiet = useWatch({ control, name: 'chi_tiet' });
  const ngay = useWatch({ control, name: 'ngay' });
  const { caiDat } = useCaiDatThuongVuot(idChiNhanh);
  const { kpi, isLoading: dangTaiKpi } = useKpiSoCheNgay(idChiNhanh, ngay);
  const viTriLoai = useViTriKhongThuongVuot();
  const ketQua = useMemo(() => thuongVuotCuaPhieu({ chi_tiet: chiTiet }, kpi, caiDat, viTriLoai), [chiTiet, kpi, caiDat, viTriLoai]);
  const dsNhom = ketQua.chuyen.find((c) => c.idx === chiTietIndex)?.nhom ?? [];
  if (dsNhom.length === 0) return null;

  const gridCols = 'sm:grid-cols-[minmax(0,1fr)_6.5rem_12rem]';
  const nhanMobile = 'sm:hidden block text-caption text-muted-foreground';

  const roiO = (khoa: string) =>
    setDangGo((d) => {
      if (!(khoa in d)) return d;
      const { [khoa]: _bo, ...con } = d;
      return con;
    });

  return (
    <div className="space-y-2 rounded-lg border border-border/60 p-2">
      <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-foreground/80">
        <Boxes size={14} className="text-primary" />
        {t('baoCaoNhanCong.vuot.theoNhom')}
      </span>
      <DongQuyVuot quy={ketQua.quy} nguongPct={caiDat.nguongPct} dangTai={dangTaiKpi} className="px-1" />

      <div className={`hidden sm:grid ${gridCols} gap-2 px-2 text-caption text-muted-foreground`}>
        <span />
        <span>{t('baoCaoNhanCong.vuot.heSoNhom')}</span>
        <span className="text-right">{t('baoCaoNhanCong.vuot.thuongVuot')}</span>
      </div>

      {dsNhom.map((g) => {
        const kHeSo = `h${g.soNhom}`;
        const hs = heSoHieuLuc(caiDat, loaiChuyen, g.soNhom, heSoNhom);
        const macDinhNhom = heSoHieuLuc(caiDat, loaiChuyen, g.soNhom).heSoNhom;
        const tienCaNgay = g.tienMoiGio * GIO_CONG_MAC_DINH.CA_NGAY;
        return (
          <div key={g.soNhom} className={`grid grid-cols-2 ${gridCols} gap-x-2 gap-y-1.5 items-center rounded-lg bg-muted/30 p-2`}>
            <div className="col-span-2 sm:col-span-1 min-w-0 flex flex-wrap items-baseline gap-x-2">
              <span className="text-sm font-semibold">{t('baoCaoNhanCong.nsNhom.nhomN', { n: g.soNhom })}</span>
              <span className="text-caption text-muted-foreground">
                {t('baoCaoNhanCong.vuot.soNguoiTinh', { n: g.soCongNhan - g.soXuongSom })} · {t('baoCaoNhanCong.vuot.gioGomTc', { gio: fmtSo(g.gioCong) })}
                {g.soXuongSom > 0 && <> · {t('baoCaoNhanCong.vuot.xuongSomKhongTinh', { n: g.soXuongSom })}</>}
              </span>
            </div>
            <div className="min-w-0">
              <span className={nhanMobile}>{t('baoCaoNhanCong.vuot.heSoNhom')}</span>
              <Input
                type="text"
                inputMode="decimal"
                value={dangGo[kHeSo] ?? (hs.nhomTuPhieu ? hienSo(hs.heSoNhom) : '')}
                placeholder={hienSo(macDinhNhom)}
                onChange={(e) => {
                  setDangGo((d) => ({ ...d, [kHeSo]: e.target.value }));
                  onChangeHeSoNhom(ganHeSoNhom(heSoNhom, g.soNhom, e.target.value));
                }}
                onBlur={() => roiO(kHeSo)}
                disabled={disabled}
                title={t('baoCaoNhanCong.vuot.heSoNhomHint', { macDinh: fmtHeSo(macDinhNhom) })}
                aria-label={`${t('baoCaoNhanCong.nsNhom.nhomN', { n: g.soNhom })} — ${t('baoCaoNhanCong.vuot.heSoNhom')}`}
                className="h-9 text-right"
              />
            </div>
            <div className="sm:text-right">
              <span className={nhanMobile}>{t('baoCaoNhanCong.vuot.thuongVuot')}</span>
              {ketQua.quy ? (
                <>
                  <span className={cn('text-sm font-semibold tabular-nums', g.tien > 0 && 'text-emerald-600 dark:text-emerald-400')}>
                    {formatNumberVN(Math.round(g.tien))}
                  </span>
                  <span className="block text-caption text-muted-foreground">
                    {t('baoCaoNhanCong.vuot.chiTietNhom', { tienNguoi: formatNumberVN(Math.round(tienCaNgay)) })}
                  </span>
                </>
              ) : (
                <span className="text-sm text-muted-foreground">—</span>
              )}
            </div>
          </div>
        );
      })}

      <p className="px-1 text-caption text-muted-foreground">
        {t('baoCaoNhanCong.vuot.ghiChuPhieu', {
          nguongPct: formatNumberVN(caiDat.nguongPct, { maxFractionDigits: 2 }),
          donGia: formatNumberVN(caiDat.donGia),
          heSoChuyen: fmtHeSo(caiDat.heSoChuyen[loaiChuyen] ?? 1),
        })}
      </p>
    </div>
  );
};

export default BaoCaoNhanCongSanLuongNhom;
