import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Boxes } from 'lucide-react';
import Input from '../../../../components/ui/Input';
import { cn, formatNumberVN } from '../../../../lib/utils';
import type { NvFormRow } from '../core/danh-sach-nv';
import {
  CHUYEN_THUONG_NS_NHOM,
  fmtNsNhom,
  fmtTyLeNs,
  ganSoThungNhom,
  lopMauTyLeNs,
  tinhNangSuatChuyen,
  type SoThungNhom,
} from '../core/nang-suat-nhom';
import type { LoaiChuyen } from '../core/types';

interface Props {
  loaiChuyen: LoaiChuyen;
  /** Danh sách người đang nhập của chuyền. */
  nhanVien: readonly NvFormRow[];
  soThungNhom: SoThungNhom | null | undefined;
  /** Mục tiêu NS nhóm của phiếu (thùng/giờ-người). */
  mucTieu: number;
  onChange: (next: SoThungNhom) => void;
  disabled?: boolean;
}

/** Hiển thị số thùng đã lưu trong ô nhập (dấu phẩy thập phân kiểu VN). */
const hienSoThung = (v: number | null | undefined) => (v == null ? '' : String(v).replace('.', ','));

/**
 * Khối «Sản lượng theo nhóm» của một chuyền: nhập số thùng từng nhóm, xem NS / % đạt / thưởng tính live.
 * Ô trống = chưa nhập (không phải 0). Chuỗi đang gõ giữ ở state cục bộ để không nhảy khi gõ dở («12,»).
 */
const BaoCaoNhanCongSanLuongNhom: React.FC<Props> = ({ loaiChuyen, nhanVien, soThungNhom, mucTieu, onChange, disabled }) => {
  const { t } = useTranslation();
  const [dangGo, setDangGo] = useState<Record<number, string>>({});
  const coThuong = loaiChuyen === CHUYEN_THUONG_NS_NHOM;
  const dsNhom = useMemo(
    () => tinhNangSuatChuyen({ loai_chuyen: loaiChuyen, nhanVien, soThungNhom }, mucTieu),
    [loaiChuyen, nhanVien, soThungNhom, mucTieu]
  );
  if (dsNhom.length === 0) return null;

  const gridCols = coThuong
    ? 'sm:grid-cols-[minmax(0,1fr)_7rem_4.5rem_4.5rem_9rem]'
    : 'sm:grid-cols-[minmax(0,1fr)_7rem_4.5rem_4.5rem]';
  const nhanMobile = 'sm:hidden block text-caption text-muted-foreground';

  const nhapSoThung = (soNhom: number, raw: string) => {
    setDangGo((d) => ({ ...d, [soNhom]: raw }));
    onChange(ganSoThungNhom(soThungNhom, soNhom, raw));
  };
  const roiO = (soNhom: number) =>
    setDangGo((d) => {
      if (!(soNhom in d)) return d;
      const { [soNhom]: _bo, ...con } = d;
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
        <span className="text-right">{t('baoCaoNhanCong.nsNhom.ns')}</span>
        <span className="text-right">{t('baoCaoNhanCong.nsNhom.tyLeDat')}</span>
        {coThuong && <span className="text-right">{t('baoCaoNhanCong.nsNhom.thuongNguoi')}</span>}
      </div>

      {dsNhom.map((g) => {
        const gia = dangGo[g.soNhom] ?? hienSoThung(g.soThung);
        return (
          <div key={g.soNhom} className={`grid grid-cols-3 ${gridCols} gap-x-2 gap-y-1.5 items-center rounded-lg bg-muted/30 p-2`}>
            <div className="col-span-3 sm:col-span-1 min-w-0 flex flex-wrap items-baseline gap-x-2">
              <span className="text-sm font-semibold">{t('baoCaoNhanCong.nsNhom.nhomN', { n: g.soNhom })}</span>
              <span className="text-caption text-muted-foreground">
                {t('baoCaoNhanCong.nsNhom.soNguoiDiLam', { n: g.soNguoiDiLam })} · {t('baoCaoNhanCong.nsNhom.gioCong', { gio: formatNumberVN(g.gioCong, { maxFractionDigits: 2 }) })}
              </span>
            </div>
            <div className="col-span-3 sm:col-span-1 min-w-0">
              <span className={nhanMobile}>{t('baoCaoNhanCong.nsNhom.soThung')}</span>
              <Input
                type="text"
                inputMode="decimal"
                value={gia}
                onChange={(e) => nhapSoThung(g.soNhom, e.target.value)}
                onBlur={() => roiO(g.soNhom)}
                disabled={disabled}
                aria-label={`${t('baoCaoNhanCong.nsNhom.nhomN', { n: g.soNhom })} — ${t('baoCaoNhanCong.nsNhom.soThung')}`}
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
            {coThuong && (
              <div className="sm:text-right">
                <span className={nhanMobile}>{t('baoCaoNhanCong.nsNhom.thuongNguoi')}</span>
                <span className="text-sm tabular-nums">{g.tyLe == null ? '—' : formatNumberVN(g.thuongCaNgay)}</span>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default BaoCaoNhanCongSanLuongNhom;
