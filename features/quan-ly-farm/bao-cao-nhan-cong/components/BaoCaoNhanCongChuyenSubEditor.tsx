import React, { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  useFieldArray,
  Controller,
  useWatch,
  type Control,
  type UseFormGetValues,
  type UseFormSetValue,
  type FieldPath,
} from 'react-hook-form';
import { Plus, Trash2 } from 'lucide-react';
import NumberInput from '../../../../components/ui/NumberInput';
import Input from '../../../../components/ui/Input';
import Button from '../../../../components/ui/Button';
import type { BaoCaoNhanCongFormValues } from '../core/schema';
import {
  LOAI_CHI_TIEU_CODES,
  type LoaiChiTieu,
  normalizeChiTietSubFormByLoai,
  syncChiTietTotalsFromSub,
  sumGioCongFromSubRows,
  sumSlCongFromSubRows,
} from '../core/ct-sub';
import { cn, formatNumberVN } from '../../../../lib/utils';

/** Ô SL công nhân — số nguyên */
const SL_INPUT = { maxFractionDigits: 0, min: 0 } as const;
/** Ô giờ — cho phép 1, 1,5, 7,5… */
const GIO_INPUT = { maxFractionDigits: 2, min: 0 } as const;

interface Props {
  chiTietIndex: number;
  chuyenLabel: string;
  control: Control<BaoCaoNhanCongFormValues>;
  setValue: UseFormSetValue<BaoCaoNhanCongFormValues>;
  getValues: UseFormGetValues<BaoCaoNhanCongFormValues>;
}

const BaoCaoNhanCongChuyenSubEditor: React.FC<Props> = ({
  chiTietIndex,
  chuyenLabel,
  control,
  setValue,
  getValues,
}) => {
  const { t } = useTranslation();
  const [activeLoai, setActiveLoai] = useState<LoaiChiTieu>('CN_NGAY');

  const subArrayName = (loai: LoaiChiTieu) =>
    `chi_tiet.${chiTietIndex}.sub.${loai}` as `chi_tiet.${number}.sub.${LoaiChiTieu}`;

  const syncTotals = useCallback(() => {
    const sub = normalizeChiTietSubFormByLoai(getValues(`chi_tiet.${chiTietIndex}.sub`));
    const totals = syncChiTietTotalsFromSub(sub);
    setValue(`chi_tiet.${chiTietIndex}.sl_cong_ngay`, totals.sl_cong_ngay, { shouldDirty: true });
    setValue(`chi_tiet.${chiTietIndex}.sl_cong_nua`, totals.sl_cong_nua, { shouldDirty: true });
    setValue(`chi_tiet.${chiTietIndex}.sl_tang_ca`, totals.sl_tang_ca, { shouldDirty: true });
    setValue(`chi_tiet.${chiTietIndex}.so_gio_tc`, totals.so_gio_tc, { shouldDirty: true });
  }, [chiTietIndex, getValues, setValue]);

  const watchedSub = useWatch({ control, name: `chi_tiet.${chiTietIndex}.sub` });
  const sub = normalizeChiTietSubFormByLoai(watchedSub);
  const totals = syncChiTietTotalsFromSub(sub);
  const { fields, append, remove } = useFieldArray({
    control,
    name: subArrayName(activeLoai),
  });
  const activeRows = sub[activeLoai];
  const tabSumSl = sumSlCongFromSubRows(activeRows);
  const tabSumGio = sumGioCongFromSubRows(activeRows);

  return (
    <div className="border-t border-primary/20 bg-primary/[0.04] dark:bg-primary/[0.08] px-3 py-3 space-y-3">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="text-sm font-semibold text-foreground">{chuyenLabel}</p>
          <p className="text-xs text-muted-foreground mt-0.5">{t('baoCaoNhanCong.sub.panelHint')}</p>
        </div>
        <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs tabular-nums text-muted-foreground">
          <span>
            {t('baoCaoNhanCong.form.colSlNgay')}:{' '}
            <strong className="text-foreground">{formatNumberVN(totals.sl_cong_ngay)}</strong>
          </span>
          <span>
            {t('baoCaoNhanCong.form.colSlNua')}:{' '}
            <strong className="text-foreground">{formatNumberVN(totals.sl_cong_nua)}</strong>
          </span>
          <span>
            {t('baoCaoNhanCong.form.colSlTangCa')}:{' '}
            <strong className="text-foreground">{formatNumberVN(totals.sl_tang_ca)}</strong>
          </span>
          <span>
            {t('baoCaoNhanCong.form.colTongGioTangCa')}:{' '}
            <strong className="text-primary">{formatNumberVN(sumGioCongFromSubRows(sub.TANG_CA))}</strong>
          </span>
        </div>
      </div>

      <div className="flex flex-wrap gap-1 p-1 rounded-lg bg-muted/50 border border-border/80 w-fit max-w-full">
        {LOAI_CHI_TIEU_CODES.map((loai) => {
          const count = (sub[loai] ?? []).length;
          const loaiKey = `baoCaoNhanCong.sub.loai.${loai}` as const;
          return (
            <button
              key={loai}
              type="button"
              onClick={() => setActiveLoai(loai)}
              className={cn(
                'px-3 py-1.5 rounded-md text-xs font-medium transition-colors whitespace-nowrap',
                activeLoai === loai
                  ? 'bg-background text-primary shadow-sm border border-border/80'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              {t(loaiKey)}
              {count > 0 && <span className="ml-1.5 tabular-nums opacity-70">({count})</span>}
            </button>
          );
        })}
      </div>

      <div className="rounded-lg border border-border bg-background overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-muted/40 border-b border-border text-xs text-muted-foreground">
              <th className="w-10 px-2 py-2 text-center">#</th>
              <th className="px-2 py-2 text-right w-28">{t('baoCaoNhanCong.sub.colSlCong')}</th>
              <th className="px-2 py-2 text-right w-24">{t('baoCaoNhanCong.sub.colSoGio')}</th>
              <th className="px-2 py-2 text-right w-28">{t('baoCaoNhanCong.sub.colGioCong')}</th>
              <th className="px-2 py-2 text-left">{t('baoCaoNhanCong.sub.colGhiChu')}</th>
              <th className="w-10 px-1 py-2" />
            </tr>
          </thead>
          <tbody>
            {fields.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-3 py-6 text-center text-xs text-muted-foreground">
                  {t('baoCaoNhanCong.sub.emptyTab')}
                </td>
              </tr>
            ) : (
              fields.map((field, rowIdx) => {
                const line = activeRows[rowIdx];
                const sl = Number(line?.sl_cong ?? 0);
                const gio = Number(line?.so_gio ?? 0);
                const slName =
                  `chi_tiet.${chiTietIndex}.sub.${activeLoai}.${rowIdx}.sl_cong` as FieldPath<BaoCaoNhanCongFormValues>;
                const gioName =
                  `chi_tiet.${chiTietIndex}.sub.${activeLoai}.${rowIdx}.so_gio` as FieldPath<BaoCaoNhanCongFormValues>;
                const ghiChuName =
                  `chi_tiet.${chiTietIndex}.sub.${activeLoai}.${rowIdx}.ghi_chu` as FieldPath<BaoCaoNhanCongFormValues>;
                return (
                  <tr key={field.id} className="border-b border-border/50 last:border-0">
                    <td className="px-2 py-1.5 text-center text-xs text-muted-foreground tabular-nums">
                      {rowIdx + 1}
                    </td>
                    <td className="px-2 py-1 align-top">
                      <Controller
                        name={slName}
                        control={control}
                        render={({ field: f }) => (
                          <NumberInput
                            value={Number(f.value ?? 0)}
                            onChange={(v) => {
                              f.onChange(v);
                              queueMicrotask(syncTotals);
                            }}
                            {...SL_INPUT}
                            compact
                            className="w-full"
                            placeholder="0"
                          />
                        )}
                      />
                    </td>
                    <td className="px-2 py-1 align-top">
                        <Controller
                          name={gioName}
                        control={control}
                        render={({ field: f }) => (
                          <NumberInput
                            value={Number(f.value ?? 0)}
                            onChange={(v) => {
                              f.onChange(v);
                              queueMicrotask(syncTotals);
                            }}
                            {...GIO_INPUT}
                            compact
                            className="w-full"
                            placeholder={t('baoCaoNhanCong.sub.gioPlaceholder')}
                          />
                        )}
                      />
                    </td>
                    <td className="px-2 py-2 text-right tabular-nums text-sm font-medium text-primary align-middle">
                      {formatNumberVN(sl * gio)}
                    </td>
                    <td className="px-2 py-1 align-top">
                      <Controller
                        name={ghiChuName}
                        control={control}
                        render={({ field: f }) => (
                          <Input
                            value={f.value == null ? '' : String(f.value)}
                            onChange={(e) => f.onChange(e.target.value || null)}
                            className="text-sm h-9"
                            placeholder={t('baoCaoNhanCong.sub.ghiChuPlaceholder')}
                          />
                        )}
                      />
                    </td>
                    <td className="px-1 py-1 align-middle">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 text-rose-600"
                        onClick={() => {
                          remove(rowIdx);
                          queueMicrotask(syncTotals);
                        }}
                        aria-label={t('common.delete')}
                      >
                        <Trash2 size={15} />
                      </Button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
          {fields.length > 0 && (
            <tfoot>
              <tr className="bg-muted/30 text-xs font-medium">
                <td className="px-2 py-2">{t('baoCaoNhanCong.sub.sum')}</td>
                <td className="px-2 py-2 text-right tabular-nums">{formatNumberVN(tabSumSl)}</td>
                <td className="px-2 py-2" />
                <td className="px-2 py-2 text-right tabular-nums text-primary">{formatNumberVN(tabSumGio)}</td>
                <td colSpan={2} />
              </tr>
            </tfoot>
          )}
        </table>
        <div className="px-2 py-2 border-t border-border/80 bg-muted/20">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-8 text-xs gap-1.5"
            onClick={() => {
              append({
                sl_cong: 0,
                so_gio: 0,
                ghi_chu: null,
              } as BaoCaoNhanCongFormValues['chi_tiet'][number]['sub'][LoaiChiTieu][number]);
              queueMicrotask(syncTotals);
            }}
          >
            <Plus size={14} />
            {t('baoCaoNhanCong.sub.addRow')}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default BaoCaoNhanCongChuyenSubEditor;
