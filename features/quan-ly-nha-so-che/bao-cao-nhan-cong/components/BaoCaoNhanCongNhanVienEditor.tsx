import React, { useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useWatch, type Control, type FieldErrors, type UseFormGetValues, type UseFormSetValue } from 'react-hook-form';
import { Plus, Trash2, UserPlus, Users } from 'lucide-react';
import Combobox from '../../../../components/ui/Combobox';
import NumberInput from '../../../../components/ui/NumberInput';
import Button from '../../../../components/ui/Button';
import { cn } from '../../../../lib/utils';
import { useIsMobile } from '../../../../lib/hooks/use-is-mobile';
import type { BaoCaoNhanCongFormValues, NhanVienRowFormValues } from '../core/schema';
import type { ChamCong, LoaiChuyen, VarNhanVienSoChe } from '../core/types';
import { CHAM_CONG_CODES } from '../core/types';
import { syncChiTietTotalsFromSub } from '../core/ct-sub';
import { GIO_CONG_MAC_DINH, nhomCuaChuyenChuaCo, nvFormRowMoi, subTuDanhSachNv, type NvFormRow } from '../core/danh-sach-nv';
import { khoaTen, laTenMoi, tenKhongTrung } from '../../danh-gia-dau-vao/core/chuan-hoa-ten';

const GIO_INPUT = { maxFractionDigits: 2, min: 0, max: 24 } as const;

interface Props {
  chiTietIndex: number;
  loaiChuyen: LoaiChuyen;
  control: Control<BaoCaoNhanCongFormValues>;
  setValue: UseFormSetValue<BaoCaoNhanCongFormValues>;
  getValues: UseFormGetValues<BaoCaoNhanCongFormValues>;
  /** Danh mục nhân viên của chi nhánh đang chọn. */
  danhMuc: VarNhanVienSoChe[];
  nvErrors?: FieldErrors<NhanVienRowFormValues>[];
  /** Chưa chọn chi nhánh thì chưa có danh mục để gợi ý. */
  chuaChonChiNhanh?: boolean;
}

/**
 * Danh sách tên của một chuyền — chọn tên có sẵn hoặc gõ tên mới (giống ô lô ở Đánh giá đầu vào).
 * Có ít nhất một tên thì số công của chuyền đếm từ danh sách (subTuDanhSachNv), không gõ tay.
 */
const BaoCaoNhanCongNhanVienEditor: React.FC<Props> = ({
  chiTietIndex,
  loaiChuyen,
  control,
  setValue,
  getValues,
  danhMuc,
  nvErrors,
  chuaChonChiNhanh,
}) => {
  const { t } = useTranslation();
  const isMobile = useIsMobile();
  const watched = useWatch({ control, name: `chi_tiet.${chiTietIndex}.nhan_vien` }) as NvFormRow[] | undefined;
  const ds = useMemo(() => watched ?? [], [watched]);

  const dangDung = useMemo(() => danhMuc.filter((nv) => nv.dang_dung), [danhMuc]);
  const nvTheoTen = useMemo(() => new Map(danhMuc.map((nv) => [khoaTen(nv.ho_ten), nv])), [danhMuc]);
  const tenOptions = useMemo(
    () => dangDung.map((nv) => ({ value: nv.ho_ten, label: nv.ho_ten, subLabel: nv.vi_tri ?? '' })),
    [dangDung]
  );
  const viTriOptions = useMemo(
    () => tenKhongTrung([...danhMuc.map((nv) => nv.vi_tri), ...ds.map((r) => r.vi_tri)]).map((v) => ({ value: v, label: v })),
    [danhMuc, ds]
  );
  const dsTenDanhMuc = useMemo(() => danhMuc.map((nv) => nv.ho_ten), [danhMuc]);

  /** Ghi danh sách + đếm lại số công của chuyền. */
  const apply = useCallback(
    (next: NvFormRow[]) => {
      const opts = { shouldDirty: true } as const;
      setValue(`chi_tiet.${chiTietIndex}.nhan_vien`, next, opts);
      if (next.length === 0) return;
      const sub = subTuDanhSachNv(next);
      const totals = syncChiTietTotalsFromSub(sub);
      setValue(`chi_tiet.${chiTietIndex}.sub`, sub, opts);
      setValue(`chi_tiet.${chiTietIndex}.sl_cong_ngay`, totals.sl_cong_ngay, opts);
      setValue(`chi_tiet.${chiTietIndex}.sl_cong_nua`, totals.sl_cong_nua, opts);
      setValue(`chi_tiet.${chiTietIndex}.sl_tang_ca`, totals.sl_tang_ca, opts);
      setValue(`chi_tiet.${chiTietIndex}.so_gio_tc`, totals.so_gio_tc, opts);
    },
    [chiTietIndex, setValue]
  );

  const current = () => [...((getValues(`chi_tiet.${chiTietIndex}.nhan_vien`) ?? []) as NvFormRow[])];

  const patchRow = (idx: number, patch: Partial<NvFormRow>) => {
    const next = current();
    next[idx] = { ...next[idx]!, ...patch };
    apply(next);
  };

  const chonTen = (idx: number, raw: unknown) => {
    const ten = raw ? String(raw).trim() : '';
    // Gõ trùng tên có sẵn (khác hoa thường) → dùng đúng tên trong danh mục + vị trí mặc định.
    const nv = nvTheoTen.get(khoaTen(ten));
    const row = current()[idx];
    patchRow(idx, { ho_ten: nv?.ho_ten ?? ten, vi_tri: row?.vi_tri || nv?.vi_tri || null });
  };

  const doiChamCong = (idx: number, cc: ChamCong) => {
    const row = current()[idx];
    if (!row || row.cham_cong === cc) return;
    // Giờ còn là mặc định của loại cũ thì đổi theo mặc định loại mới; giờ đã sửa tay thì giữ.
    const gio = row.so_gio_cong === GIO_CONG_MAC_DINH[row.cham_cong] ? GIO_CONG_MAC_DINH[cc] : row.so_gio_cong;
    patchRow(idx, { cham_cong: cc, so_gio_cong: gio });
  };

  const themNguoi = () => apply([...current(), nvFormRowMoi()]);

  const nhom = nhomCuaChuyenChuaCo(danhMuc, loaiChuyen, (getValues('chi_tiet') ?? []) as { nhan_vien?: NvFormRow[] }[]);
  const layCaNhom = () => apply([...current(), ...nhom.map((nv) => nvFormRowMoi(nv))]);

  const xoa = (idx: number) => apply(current().filter((_, i) => i !== idx));

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-foreground/80">
          <Users size={14} className="text-primary" />
          {t('baoCaoNhanCong.nv.title', { n: ds.length })}
        </span>
        <span className="text-caption text-muted-foreground flex-1 min-w-[12rem]">
          {ds.length > 0 ? t('baoCaoNhanCong.nv.dangDem') : t('baoCaoNhanCong.nv.hint')}
        </span>
      </div>

      {ds.length > 0 && (
        <div className="hidden sm:grid grid-cols-[minmax(0,2fr)_minmax(0,1.5fr)_auto_5.5rem_5.5rem_auto] gap-2 px-2 text-caption text-muted-foreground">
          <span>{t('baoCaoNhanCong.nv.hoTen')}</span>
          <span>{t('baoCaoNhanCong.nv.viTri')}</span>
          <span />
          <span className="text-right">{t('baoCaoNhanCong.nv.gioCong')}</span>
          <span className="text-right">{t('baoCaoNhanCong.nv.gioTc')}</span>
          <span className="w-9" />
        </div>
      )}

      {ds.map((row, idx) => {
        const err = nvErrors?.[idx];
        const moi = laTenMoi(row.ho_ten, dsTenDanhMuc);
        return (
          <div
            key={idx}
            className="grid grid-cols-2 sm:grid-cols-[minmax(0,2fr)_minmax(0,1.5fr)_auto_5.5rem_5.5rem_auto] gap-2 items-start rounded-lg bg-muted/30 p-2"
          >
            <div className="col-span-2 sm:col-span-1 min-w-0">
              <Combobox
                options={tenOptions}
                value={row.ho_ten}
                onChange={(x) => chonTen(idx, x)}
                placeholder={t('baoCaoNhanCong.nv.chonTen')}
                creatable
                creatableLabel={t('baoCaoNhanCong.nv.dungTenMoi')}
                dropdownInPortal
                error={err?.ho_ten?.message as string | undefined}
              />
              {!err?.ho_ten && moi && <p className="text-caption text-primary m-0 mt-0.5">{t('baoCaoNhanCong.nv.tenMoiSeThem')}</p>}
            </div>
            <div className="col-span-2 sm:col-span-1 min-w-0">
              <Combobox
                options={viTriOptions}
                value={row.vi_tri ?? ''}
                onChange={(x) => patchRow(idx, { vi_tri: x ? String(x).trim() : null })}
                placeholder={t('baoCaoNhanCong.nv.viTri')}
                creatable
                creatableLabel={t('baoCaoNhanCong.nv.dungTenMoi')}
                dropdownInPortal
              />
            </div>
            <div className="col-span-2 sm:col-span-1 inline-flex rounded-md border border-border overflow-hidden h-9 self-start">
              {CHAM_CONG_CODES.map((cc) => (
                <button
                  key={cc}
                  type="button"
                  onClick={() => doiChamCong(idx, cc)}
                  aria-pressed={row.cham_cong === cc}
                  className={cn(
                    'flex-1 px-2.5 text-xs font-medium whitespace-nowrap transition-colors',
                    row.cham_cong === cc ? 'bg-primary text-primary-foreground' : 'bg-background text-muted-foreground hover:text-primary'
                  )}
                >
                  {t(`baoCaoNhanCong.nv.chamCong.${cc}`)}
                </button>
              ))}
            </div>
            <NumberInput
              value={row.so_gio_cong}
              onChange={(v) => patchRow(idx, { so_gio_cong: v })}
              {...GIO_INPUT}
              compact
              label={isMobile ? t('baoCaoNhanCong.nv.gioCong') : undefined}
              className="w-full min-w-0"
              error={err?.so_gio_cong?.message as string | undefined}
            />
            <div className="flex items-start gap-1">
              <NumberInput
                value={row.so_gio_tc}
                onChange={(v) => patchRow(idx, { so_gio_tc: v })}
                {...GIO_INPUT}
                compact
                label={isMobile ? t('baoCaoNhanCong.nv.gioTc') : undefined}
                className="w-full min-w-0"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-9 w-9 p-0 shrink-0 text-rose-600 sm:hidden"
                onClick={() => xoa(idx)}
                aria-label={t('common.delete')}
              >
                <Trash2 size={15} />
              </Button>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-9 w-9 p-0 shrink-0 text-rose-600 hidden sm:inline-flex"
              onClick={() => xoa(idx)}
              aria-label={t('common.delete')}
            >
              <Trash2 size={15} />
            </Button>
          </div>
        );
      })}

      <div className="flex flex-wrap gap-2">
        <Button type="button" variant="outline" size="sm" className="h-8 text-xs gap-1" onClick={themNguoi}>
          <Plus size={13} />
          {t('baoCaoNhanCong.nv.them')}
        </Button>
        {nhom.length > 0 && (
          <Button type="button" variant="outline" size="sm" className="h-8 text-xs gap-1" onClick={layCaNhom}>
            <UserPlus size={13} />
            {t('baoCaoNhanCong.nv.layCaNhom', { n: nhom.length })}
          </Button>
        )}
        {chuaChonChiNhanh && <span className="text-caption text-muted-foreground self-center">{t('baoCaoNhanCong.nv.chonChiNhanhTruoc')}</span>}
      </div>
    </div>
  );
};

export default BaoCaoNhanCongNhanVienEditor;
