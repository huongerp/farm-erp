import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Boxes } from 'lucide-react';
import Input from '../../../../components/ui/Input';
import { cn, formatNumberVN } from '../../../../lib/utils';
import { GIO_CONG_MAC_DINH, type NvFormRow } from '../core/danh-sach-nv';
import { fmtNsNhom, fmtTyLeNs, ganSoThungNhom, lopMauTyLeNs, tinhNangSuatChuyen, type SoThungNhom } from '../core/nang-suat-nhom';
import { ganHeSoNhom, heSoHieuLuc, tinhThuongVuotChuyen, type HeSoNhom } from '../core/thuong-vuot-thung';
import type { LoaiChuyen } from '../core/types';
import { useCaiDatThuongVuot, useViTriKhongThuongVuot } from '../hooks/use-thuong-vuot';

interface Props {
  loaiChuyen: LoaiChuyen;
  /** Danh sách người đang nhập của chuyền. */
  nhanVien: readonly NvFormRow[];
  soThungNhom: SoThungNhom | null | undefined;
  /** Hệ số nhóm sửa trên phiếu (thiếu khoá = mặc định Cài đặt). */
  heSoNhom: HeSoNhom | null | undefined;
  /** Nhà sơ chế của phiếu — lấy đơn giá / ngưỡng / hệ số mặc định. */
  idChiNhanh: string | null | undefined;
  /** Mục tiêu NS nhóm của phiếu (thùng/giờ-người). */
  mucTieu: number;
  onChange: (next: SoThungNhom) => void;
  onChangeHeSoNhom: (next: HeSoNhom) => void;
  disabled?: boolean;
}

/** Số đã lưu → chuỗi trong ô nhập (dấu phẩy thập phân kiểu VN). */
const hienSo = (v: number | null | undefined) => (v == null ? '' : String(v).replace('.', ','));
const fmtHeSo = (v: number) => formatNumberVN(v, { maxFractionDigits: 3 });
const fmtThung = (v: number) => formatNumberVN(v, { maxFractionDigits: 2 });

/**
 * Khối «Sản lượng theo nhóm» của một chuyền: nhập số thùng + hệ số từng nhóm, xem NS / % đạt và thưởng
 * vượt thùng tính live (core/thuong-vuot-thung.ts). Ô trống = chưa nhập (không phải 0). Chuỗi đang gõ giữ
 * ở state cục bộ để không nhảy khi gõ dở («12,»).
 */
const BaoCaoNhanCongSanLuongNhom: React.FC<Props> = ({
  loaiChuyen,
  nhanVien,
  soThungNhom,
  heSoNhom,
  idChiNhanh,
  mucTieu,
  onChange,
  onChangeHeSoNhom,
  disabled,
}) => {
  const { t } = useTranslation();
  const [dangGo, setDangGo] = useState<Record<string, string>>({});
  const { caiDat } = useCaiDatThuongVuot(idChiNhanh);
  const viTriLoai = useViTriKhongThuongVuot();
  const dsNhom = useMemo(
    () => tinhNangSuatChuyen({ loai_chuyen: loaiChuyen, nhanVien, soThungNhom }, mucTieu),
    [loaiChuyen, nhanVien, soThungNhom, mucTieu]
  );
  const vuotTheoNhom = useMemo(
    () =>
      new Map(
        tinhThuongVuotChuyen({ loai_chuyen: loaiChuyen, nhanVien, soThungNhom, heSoNhom }, mucTieu, caiDat, viTriLoai).map((g) => [g.soNhom, g])
      ),
    [loaiChuyen, nhanVien, soThungNhom, heSoNhom, mucTieu, caiDat, viTriLoai]
  );
  if (dsNhom.length === 0) return null;

  const gridCols = 'sm:grid-cols-[minmax(0,1fr)_6.5rem_5rem_4.5rem_4.5rem_12rem]';
  const nhanMobile = 'sm:hidden block text-caption text-muted-foreground';
  const nguongNs = (caiDat.nguongPct / 100) * mucTieu;

  const go = (khoa: string, raw: string) => setDangGo((d) => ({ ...d, [khoa]: raw }));
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
        {t('baoCaoNhanCong.nsNhom.sanLuongTheoNhom')}
      </span>

      <div className={`hidden sm:grid ${gridCols} gap-2 px-2 text-caption text-muted-foreground`}>
        <span />
        <span>{t('baoCaoNhanCong.nsNhom.soThung')}</span>
        <span>{t('baoCaoNhanCong.vuot.heSoNhom')}</span>
        <span className="text-right">{t('baoCaoNhanCong.nsNhom.ns')}</span>
        <span className="text-right">{t('baoCaoNhanCong.nsNhom.tyLeDat')}</span>
        <span className="text-right">{t('baoCaoNhanCong.vuot.thuongVuot')}</span>
      </div>

      {dsNhom.map((g) => {
        const kThung = `t${g.soNhom}`;
        const kHeSo = `h${g.soNhom}`;
        const vuot = vuotTheoNhom.get(g.soNhom);
        const hs = heSoHieuLuc(caiDat, loaiChuyen, g.soNhom, heSoNhom);
        const macDinhNhom = heSoHieuLuc(caiDat, loaiChuyen, g.soNhom).heSoNhom;
        const tienCaNgay = vuot ? vuot.tienMoiGio * GIO_CONG_MAC_DINH.CA_NGAY : 0;
        return (
          <div key={g.soNhom} className={`grid grid-cols-3 ${gridCols} gap-x-2 gap-y-1.5 items-center rounded-lg bg-muted/30 p-2`}>
            <div className="col-span-3 sm:col-span-1 min-w-0 flex flex-wrap items-baseline gap-x-2">
              <span className="text-sm font-semibold">{t('baoCaoNhanCong.nsNhom.nhomN', { n: g.soNhom })}</span>
              <span className="text-caption text-muted-foreground">
                {t('baoCaoNhanCong.nsNhom.soNguoiDiLam', { n: g.soNguoiDiLam })} · {t('baoCaoNhanCong.nsNhom.gioCong', { gio: formatNumberVN(g.gioCong, { maxFractionDigits: 2 }) })}
              </span>
            </div>
            <div className="min-w-0">
              <span className={nhanMobile}>{t('baoCaoNhanCong.nsNhom.soThung')}</span>
              <Input
                type="text"
                inputMode="decimal"
                value={dangGo[kThung] ?? hienSo(g.soThung)}
                onChange={(e) => {
                  go(kThung, e.target.value);
                  onChange(ganSoThungNhom(soThungNhom, g.soNhom, e.target.value));
                }}
                onBlur={() => roiO(kThung)}
                disabled={disabled}
                aria-label={`${t('baoCaoNhanCong.nsNhom.nhomN', { n: g.soNhom })} — ${t('baoCaoNhanCong.nsNhom.soThung')}`}
                className="h-9 text-right"
              />
            </div>
            <div className="min-w-0">
              <span className={nhanMobile}>{t('baoCaoNhanCong.vuot.heSoNhom')}</span>
              <Input
                type="text"
                inputMode="decimal"
                value={dangGo[kHeSo] ?? (hs.nhomTuPhieu ? hienSo(hs.heSoNhom) : '')}
                placeholder={hienSo(macDinhNhom)}
                onChange={(e) => {
                  go(kHeSo, e.target.value);
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
              <span className={nhanMobile}>{t('baoCaoNhanCong.nsNhom.ns')}</span>
              <span className="text-sm tabular-nums">{fmtNsNhom(g.ns)}</span>
            </div>
            <div className="sm:text-right">
              <span className={nhanMobile}>{t('baoCaoNhanCong.nsNhom.tyLeDat')}</span>
              <span className={cn('text-sm font-semibold tabular-nums', lopMauTyLeNs(g.tyLe))}>
                {g.tyLe == null ? '—' : `${fmtTyLeNs(g.tyLe)}%`}
              </span>
            </div>
            <div className="col-span-2 sm:col-span-1 sm:text-right">
              <span className={nhanMobile}>{t('baoCaoNhanCong.vuot.thuongVuot')}</span>
              {vuot?.ketQua ? (
                <>
                  <span className={cn('text-sm font-semibold tabular-nums', vuot.ketQua.tien > 0 && 'text-emerald-600 dark:text-emerald-400')}>
                    {formatNumberVN(Math.round(vuot.ketQua.tien))}
                  </span>
                  <span className="block text-caption text-muted-foreground">
                    {t('baoCaoNhanCong.vuot.chiTietNhom', {
                      vuot: fmtThung(vuot.ketQua.thungVuot),
                      nguong: fmtThung(vuot.ketQua.nguongThung),
                      tienNguoi: formatNumberVN(Math.round(tienCaNgay)),
                    })}
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
          nguongNs: fmtThung(nguongNs),
          nguongPct: formatNumberVN(caiDat.nguongPct, { maxFractionDigits: 2 }),
          donGia: formatNumberVN(caiDat.donGia),
          heSoChuyen: fmtHeSo(caiDat.heSoChuyen[loaiChuyen] ?? 1),
        })}
      </p>
    </div>
  );
};

export default BaoCaoNhanCongSanLuongNhom;
