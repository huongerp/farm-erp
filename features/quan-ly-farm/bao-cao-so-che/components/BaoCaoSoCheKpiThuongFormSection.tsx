import React, { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Award, Plus, Trash2 } from 'lucide-react';
import {
  Controller,
  useFieldArray,
  useWatch,
  type Control,
  type UseFormSetValue,
} from 'react-hook-form';
import Input from '../../../../components/ui/Input';
import NumberInput from '../../../../components/ui/NumberInput';
import FormSection from '../../../../components/shared/FormSection';
import { cn, formatNumberVN } from '../../../../lib/utils';
import { computeKpiPhanTram } from '../../shared/kpi-thuong/types';
import { defaultKpiThuongFormRow } from '../../shared/kpi-thuong/form-mappers';
import type { KpiThuongFormRow } from '../../shared/kpi-thuong/types';
import type { BaoCaoSoCheFormValues } from '../core/schema';

/** Nguồn tự tính cho mỗi hàng preset. */
export interface BcscKpiPresetSource {
  /** Giá trị thực tế đã tính (null = chưa có dữ liệu). */
  thucTeValue: number | null;
  /** true = đạt khi thực tế >= mục tiêu; false = đạt khi thực tế <= mục tiêu. */
  isHigherBetter: boolean;
}

/** Số hàng preset cố định — luôn là 3. */
const PRESET_COUNT = 3;

const DANH_GIA_DAT = 'Đạt';
const DANH_GIA_KHONG_DAT = 'Không đạt';

function numericStr(val: number | null): string | null {
  if (val == null || !Number.isFinite(val)) return null;
  return String(Math.round(val * 10000) / 10000);
}

function parseLenient(s: string | null | undefined): number | null {
  const n = parseFloat(String(s ?? '').trim().replace(',', '.'));
  return Number.isFinite(n) ? n : null;
}

function computeDanhGia(
  thucTeStr: string | null,
  mucTieuStr: string | null,
  isHigherBetter: boolean
): typeof DANH_GIA_DAT | typeof DANH_GIA_KHONG_DAT | null {
  const tt = parseLenient(thucTeStr);
  const mt = parseLenient(mucTieuStr);
  if (tt == null || mt == null) return null;
  return (isHigherBetter ? tt >= mt : tt <= mt) ? DANH_GIA_DAT : DANH_GIA_KHONG_DAT;
}

/** Badge màu cho cột Đánh giá */
export function DanhGiaKpiBadge({ value }: { value: string | null | undefined }) {
  if (!value?.trim()) return <span className="text-muted-foreground text-xs opacity-50">—</span>;
  if (value === DANH_GIA_DAT) {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300 whitespace-nowrap">
        {value}
      </span>
    );
  }
  if (value === DANH_GIA_KHONG_DAT) {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300 whitespace-nowrap">
        {value}
      </span>
    );
  }
  return <span className="text-xs">{value}</span>;
}

interface Props {
  control: Control<BaoCaoSoCheFormValues>;
  setValue: UseFormSetValue<BaoCaoSoCheFormValues>;
  i18nPrefix: string;
  /**
   * 3 nguồn tự tính cho 3 hàng preset (index 0 → NS sơ chế, 1 → lỗi QC, 2 → tỷ lệ thu hồi).
   */
  presetSources: [BcscKpiPresetSource, BcscKpiPresetSource, BcscKpiPresetSource];
  disabled?: boolean;
}

const BaoCaoSoCheKpiThuongFormSection: React.FC<Props> = ({
  control,
  setValue,
  i18nPrefix,
  presetSources,
  disabled = false,
}) => {
  const { t } = useTranslation();
  const k = (s: string) => t(`${i18nPrefix}.${s}`);

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'kpi_thuong',
  });

  const kpiRows = useWatch({ control, name: 'kpi_thuong' }) as KpiThuongFormRow[] | undefined;
  const kpiRowsRef = useRef<KpiThuongFormRow[] | undefined>(undefined);
  kpiRowsRef.current = kpiRows;

  /* ── Tự động đồng bộ thực tế + đánh giá cho 3 hàng preset ── */
  useEffect(() => {
    const rows = kpiRowsRef.current ?? [];
    presetSources.forEach((source, index) => {
      if (index >= PRESET_COUNT) return;
      const ttStr = numericStr(source.thucTeValue);
      if (ttStr == null) return;
      const mucTieu = rows[index]?.muc_tieu ?? null;
      const danhGia = computeDanhGia(ttStr, mucTieu, source.isHigherBetter);
      setValue(`kpi_thuong.${index}.thuc_te`, ttStr, { shouldDirty: false, shouldTouch: false });
      if (danhGia != null) {
        setValue(`kpi_thuong.${index}.danh_gia`, danhGia, { shouldDirty: false, shouldTouch: false });
      }
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [presetSources, setValue]);

  const tongTienThuong = (kpiRows ?? []).reduce((s, r) => s + Number(r?.tien_thuong ?? 0), 0);

  return (
    <FormSection title={k('sectionTitle')} icon={<Award size={14} />} variant="primary">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
        <p className="text-xs text-muted-foreground">{k('hint')}</p>
        {!disabled && (
          <button
            type="button"
            onClick={() => append(defaultKpiThuongFormRow() as never)}
            className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded border border-border hover:bg-muted/50"
          >
            <Plus size={13} /> {k('addRow')}
          </button>
        )}
      </div>

      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full text-sm min-w-[58rem]">
          <thead>
            <tr className="bg-muted/50 border-b border-border">
              <th className="text-center px-1 py-2 font-medium w-10">{k('colTt')}</th>
              <th className="text-left px-2 py-2 font-medium min-w-[9rem]">{k('colHangMuc')}</th>
              <th className="text-left px-2 py-2 font-medium w-[5rem]">{k('colDvt')}</th>
              <th className="text-left px-2 py-2 font-medium w-[5.5rem]">{k('colMucTieu')}</th>
              <th className="text-left px-2 py-2 font-medium w-[5.5rem]">{k('colThucTe')}</th>
              <th className="text-right px-2 py-2 font-medium w-[5rem]">{k('colPhanTram')}</th>
              <th className="text-left px-2 py-2 font-medium w-[7rem]">{k('colDanhGia')}</th>
              <th className="text-right px-2 py-2 font-medium w-[8.5rem]">{k('colTienThuong')}</th>
              <th className="text-left px-2 py-2 font-medium min-w-[6rem]">{k('colGhiChu')}</th>
              <th className="w-10 px-1" />
            </tr>
          </thead>
          <tbody>
            {fields.length === 0 ? (
              <tr>
                <td colSpan={10} className="px-3 py-6 text-center text-muted-foreground text-sm">
                  {k('empty')}
                </td>
              </tr>
            ) : (
              fields.map((field, index) => {
                const isPreset = index < PRESET_COUNT;
                const source = isPreset ? presetSources[index] : null;
                const row = (kpiRows ?? [])[index];

                /* Thực tế hiển thị cho hàng preset — lấy thẳng từ nguồn tính, không qua form state */
                const thucTeDisplay = isPreset
                  ? source!.thucTeValue != null && Number.isFinite(source!.thucTeValue)
                    ? formatNumberVN(Math.round(source!.thucTeValue * 10000) / 10000)
                    : '—'
                  : null;

                /* Đánh giá cho hàng preset */
                const danhGiaPreset = isPreset
                  ? computeDanhGia(
                      numericStr(source!.thucTeValue),
                      row?.muc_tieu ?? null,
                      source!.isHigherBetter
                    )
                  : null;

                /* % cho hàng preset */
                const pctPreset = isPreset
                  ? computeKpiPhanTram(row?.muc_tieu, numericStr(source!.thucTeValue))
                  : computeKpiPhanTram(row?.muc_tieu, row?.thuc_te);

                return (
                  <tr key={field.id} className="border-b border-border/80">
                    <td className="px-1 py-2 text-center tabular-nums text-muted-foreground align-top text-xs">
                      {index + 1}
                    </td>

                    {/* Hạng mục — luôn read-only cho preset; editable cho hàng thêm mới */}
                    <td className="px-2 py-1.5 align-top">
                      {isPreset ? (
                        <span className="text-xs text-foreground leading-snug">{row?.ten_hang_muc || '—'}</span>
                      ) : (
                        <Controller
                          name={`kpi_thuong.${index}.ten_hang_muc`}
                          control={control}
                          render={({ field: f }) => (
                            <Input {...f} value={f.value ?? ''} className="text-xs w-full min-w-[8rem]" placeholder="—" disabled={disabled} />
                          )}
                        />
                      )}
                    </td>

                    {/* ĐVT — luôn read-only cho preset */}
                    <td className="px-2 py-1.5 align-top">
                      {isPreset ? (
                        <span className="text-xs text-muted-foreground">{row?.don_vi_tinh || '—'}</span>
                      ) : (
                        <Controller
                          name={`kpi_thuong.${index}.don_vi_tinh`}
                          control={control}
                          render={({ field: f }) => (
                            <Input {...f} value={f.value ?? ''} className="text-xs w-full" placeholder="—" disabled={disabled} />
                          )}
                        />
                      )}
                    </td>

                    {/* Mục tiêu — luôn read-only cho preset */}
                    <td className="px-2 py-1.5 align-top">
                      {isPreset ? (
                        <span className="text-xs text-muted-foreground tabular-nums">{row?.muc_tieu || '—'}</span>
                      ) : (
                        <Controller
                          name={`kpi_thuong.${index}.muc_tieu`}
                          control={control}
                          render={({ field: f }) => (
                            <Input {...f} value={f.value ?? ''} className="text-xs w-full" placeholder="—" disabled={disabled} />
                          )}
                        />
                      )}
                    </td>

                    {/* Thực tế — tự tính cho preset, editable cho hàng thêm mới */}
                    <td className="px-2 py-1.5 align-top">
                      {isPreset ? (
                        <span className={cn(
                          'text-xs tabular-nums font-medium',
                          thucTeDisplay === '—' ? 'text-muted-foreground opacity-50' : 'text-foreground'
                        )}>
                          {thucTeDisplay}
                        </span>
                      ) : (
                        <Controller
                          name={`kpi_thuong.${index}.thuc_te`}
                          control={control}
                          render={({ field: f }) => (
                            <Input {...f} value={f.value ?? ''} className="text-xs w-full" placeholder="—" disabled={disabled} />
                          )}
                        />
                      )}
                    </td>

                    {/* % — tự tính */}
                    <td className="px-2 py-2 align-top text-right tabular-nums text-xs text-muted-foreground">
                      {pctPreset == null
                        ? <span className="opacity-40">—</span>
                        : `${formatNumberVN(pctPreset)}%`}
                    </td>

                    {/* Đánh giá — badge cho preset, combobox/text cho hàng thêm mới */}
                    <td className="px-2 py-1.5 align-top">
                      {isPreset ? (
                        <DanhGiaKpiBadge value={danhGiaPreset} />
                      ) : (
                        <Controller
                          name={`kpi_thuong.${index}.danh_gia`}
                          control={control}
                          render={({ field: f }) => (
                            <Input {...f} value={f.value ?? ''} className="text-xs w-full" placeholder="—" disabled={disabled} />
                          )}
                        />
                      )}
                    </td>

                    {/* Tiền thưởng */}
                    <td className="px-2 py-1.5 align-top">
                      <Controller
                        name={`kpi_thuong.${index}.tien_thuong`}
                        control={control}
                        render={({ field: f }) => (
                          <NumberInput
                            value={f.value ?? 0}
                            onChange={f.onChange}
                            min={-1e15}
                            max={1e15}
                            maxFractionDigits={0}
                            showZeroFormatted
                            className="w-full text-right"
                            disabled={disabled}
                          />
                        )}
                      />
                    </td>

                    {/* Ghi chú */}
                    <td className="px-2 py-1.5 align-top">
                      <Controller
                        name={`kpi_thuong.${index}.ghi_chu`}
                        control={control}
                        render={({ field: f }) => (
                          <Input {...f} value={f.value ?? ''} className="text-xs w-full min-w-[5rem]" placeholder="—" disabled={disabled} />
                        )}
                      />
                    </td>

                    {/* Xóa — chỉ cho hàng thêm mới */}
                    <td className="px-1 py-1.5 align-top text-center">
                      {!isPreset && !disabled && (
                        <button
                          type="button"
                          onClick={() => remove(index)}
                          className="p-1.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-md"
                          title={t('common.delete')}
                          aria-label={t('common.delete')}
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })
            )}

            {fields.length > 0 && (
              <tr className="bg-primary/10 dark:bg-primary/15 border-t border-border">
                <td colSpan={7} className="px-3 py-2 text-right font-bold text-primary tabular-nums text-sm">
                  {k('rowTongThuong')}
                </td>
                <td className="px-2 py-2 text-right font-bold text-primary tabular-nums text-sm">
                  {formatNumberVN(tongTienThuong)}
                </td>
                <td colSpan={2} />
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </FormSection>
  );
};

export default BaoCaoSoCheKpiThuongFormSection;
