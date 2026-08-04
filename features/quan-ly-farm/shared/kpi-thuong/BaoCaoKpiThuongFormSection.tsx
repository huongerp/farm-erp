import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Award, Plus, Trash2 } from 'lucide-react';
import {
  Controller,
  useFieldArray,
  useWatch,
  type Control,
  type FieldArrayPath,
  type FieldValues,
} from 'react-hook-form';
import Input from '../../../../components/ui/Input';
import NumberInput from '../../../../components/ui/NumberInput';
import Combobox from '../../../../components/ui/Combobox';
import Button from '../../../../components/ui/Button';
import FormSection from '../../../../components/shared/FormSection';
import { formatNumberVN } from '../../../../lib/utils';
import { defaultKpiThuongFormRow } from './form-mappers';
import type { KpiThuongFormRow } from './types';
import { computeKpiPhanTram } from './types';

type KpiThuongFieldValues = FieldValues & { kpi_thuong: KpiThuongFormRow[] };

interface Props<T extends KpiThuongFieldValues> {
  control: Control<T>;
  /** Tiền tố i18n, ví dụ `baoCaoSoChe.kpiThuong` */
  i18nPrefix: string;
  /**
   * Danh sách lựa chọn cho cột Đánh giá (combobox).
   * Nếu không truyền, hiển thị ô nhập text thông thường.
   */
  danhGiaOptions?: readonly string[];
  /** Khi true: ẩn nút Thêm/Xóa, disable toàn bộ input — chỉ quản trị mới thao tác được. */
  disabled?: boolean;
}

function BaoCaoKpiThuongFormSection<T extends KpiThuongFieldValues>({
  control,
  i18nPrefix,
  danhGiaOptions,
  disabled = false,
}: Props<T>) {
  const { t } = useTranslation();
  const k = (suffix: string) => t(`${i18nPrefix}.${suffix}`);

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'kpi_thuong' as FieldArrayPath<T>,
  });

  const kpiRows = useWatch({ control, name: 'kpi_thuong' as never }) as KpiThuongFormRow[] | undefined;
  const tongTienThuong = useMemo(
    () => (kpiRows ?? []).reduce((s, r) => s + Number(r?.tien_thuong ?? 0), 0),
    [kpiRows]
  );

  const danhGiaComboboxOptions = useMemo(
    () =>
      danhGiaOptions?.map((v) => ({ value: v, label: v })) ?? [],
    [danhGiaOptions]
  );

  return (
    <FormSection title={k('sectionTitle')} icon={<Award size={14} />} variant="primary">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
        <p className="text-xs text-muted-foreground">{k('hint')}</p>
        {!disabled && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="gap-1"
            onClick={() => append(defaultKpiThuongFormRow() as never)}
          >
            <Plus size={14} /> {k('addRow')}
          </Button>
        )}
      </div>
      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full text-sm min-w-[60rem]">
          <thead>
            <tr className="bg-muted/50 border-b border-border">
              <th className="text-center px-1 py-2 font-medium w-10">{k('colTt')}</th>
              <th className="text-left px-2 py-2 font-medium min-w-[9rem]">{k('colHangMuc')}</th>
              <th className="text-left px-2 py-2 font-medium w-[5rem]">{k('colDvt')}</th>
              <th className="text-left px-2 py-2 font-medium w-[5.5rem]">{k('colMucTieu')}</th>
              <th className="text-left px-2 py-2 font-medium w-[5.5rem]">{k('colThucTe')}</th>
              <th className="text-right px-2 py-2 font-medium w-[5.5rem]">{k('colPhanTram')}</th>
              <th className="text-left px-2 py-2 font-medium w-[7rem]">{k('colDanhGia')}</th>
              <th className="text-right px-2 py-2 font-medium w-[8.5rem]">{k('colTienThuong')}</th>
              <th className="text-left px-2 py-2 font-medium min-w-[6rem]">{k('colGhiChu')}</th>
              <th className="w-10 px-1" aria-label={t('common.actions')} />
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
              fields.map((field, index) => (
                <tr key={field.id} className="border-b border-border/80">
                  <td className="px-1 py-2 text-center tabular-nums text-muted-foreground align-top">{index + 1}</td>

                  {/* Hạng mục */}
                  <td className="px-2 py-1.5 align-top">
                    <Controller
                      name={`kpi_thuong.${index}.ten_hang_muc` as never}
                      control={control}
                      render={({ field: f }) => (
                        <Input {...f} value={f.value ?? ''} className="text-xs w-full min-w-[8rem]" placeholder="—" disabled={disabled} />
                      )}
                    />
                  </td>

                  {/* ĐVT */}
                  <td className="px-2 py-1.5 align-top">
                    <Controller
                      name={`kpi_thuong.${index}.don_vi_tinh` as never}
                      control={control}
                      render={({ field: f }) => (
                        <Input {...f} value={f.value ?? ''} className="text-xs w-full" placeholder="—" disabled={disabled} />
                      )}
                    />
                  </td>

                  {/* Mục tiêu */}
                  <td className="px-2 py-1.5 align-top">
                    <Controller
                      name={`kpi_thuong.${index}.muc_tieu` as never}
                      control={control}
                      render={({ field: f }) => (
                        <Input {...f} value={f.value ?? ''} className="text-xs w-full" placeholder="—" disabled={disabled} />
                      )}
                    />
                  </td>

                  {/* Thực tế */}
                  <td className="px-2 py-1.5 align-top">
                    <Controller
                      name={`kpi_thuong.${index}.thuc_te` as never}
                      control={control}
                      render={({ field: f }) => (
                        <Input {...f} value={f.value ?? ''} className="text-xs w-full" placeholder="—" disabled={disabled} />
                      )}
                    />
                  </td>

                  {/* % — tự tính từ thực tế / mục tiêu × 100 */}
                  <td className="px-2 py-2 align-top text-right tabular-nums text-xs text-muted-foreground">
                    {(() => {
                      const row = (kpiRows ?? [])[index];
                      const pct = computeKpiPhanTram(row?.muc_tieu, row?.thuc_te);
                      return pct == null ? <span className="opacity-40">—</span> : `${formatNumberVN(pct)}%`;
                    })()}
                  </td>

                  {/* Đánh giá — combobox hoặc text input tuỳ prop */}
                  <td className="px-2 py-1.5 align-top">
                    <Controller
                      name={`kpi_thuong.${index}.danh_gia` as never}
                      control={control}
                      render={({ field: f }) =>
                        danhGiaOptions && danhGiaOptions.length > 0 ? (
                          <Combobox
                            options={danhGiaComboboxOptions}
                            value={f.value ?? ''}
                            onChange={(v) => f.onChange(v != null && v !== '' ? String(v) : null)}
                            placeholder="—"
                            triggerClassName="h-8 text-xs"
                            disabled={disabled}
                          />
                        ) : (
                          <Input {...f} value={f.value ?? ''} className="text-xs w-full" placeholder="—" disabled={disabled} />
                        )
                      }
                    />
                  </td>

                  {/* Tiền thưởng — phân tách hàng nghìn */}
                  <td className="px-2 py-1.5 align-top">
                    <Controller
                      name={`kpi_thuong.${index}.tien_thuong` as never}
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
                      name={`kpi_thuong.${index}.ghi_chu` as never}
                      control={control}
                      render={({ field: f }) => (
                        <Input {...f} value={f.value ?? ''} className="text-xs w-full min-w-[5rem]" placeholder="—" disabled={disabled} />
                      )}
                    />
                  </td>

                  <td className="px-1 py-1.5 align-top text-center">
                    {!disabled && (
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
              ))
            )}
            {fields.length > 0 && (
              <tr className="bg-primary/10 dark:bg-primary/15 border-t border-border">
                <td colSpan={7} className="px-3 py-2 text-right font-bold text-primary tabular-nums">
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

export default BaoCaoKpiThuongFormSection;
