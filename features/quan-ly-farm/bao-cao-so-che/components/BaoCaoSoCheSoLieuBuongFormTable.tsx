import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Controller, useWatch, type Control, type FieldErrors } from 'react-hook-form';
import NumberInput from '../../../../components/ui/NumberInput';
import Combobox from '../../../../components/ui/Combobox';
import Textarea from '../../../../components/ui/Textarea';
import type { BaoCaoSoCheFormValues } from '../core/schema';
import {
  SO_LIEU_BUONG_ROW_DEFS,
  SO_LIEU_DVT_PRESET_OPTIONS,
  SO_LIEU_ROW_DVT_DEFAULT,
  SO_LIEU_ROW_KEYS,
} from '../core/so-lieu-row-meta';

interface Props {
  control: Control<BaoCaoSoCheFormValues>;
  errors: FieldErrors<BaoCaoSoCheFormValues>;
  /** STT cột TT bắt đầu từ số này (nối sau các dòng BCNC). */
  sttOffset: number;
}

const BaoCaoSoCheSoLieuBuongFormTable: React.FC<Props> = ({ control, errors, sttOffset }) => {
  const { t } = useTranslation();
  const rowMeta = useWatch({ control, name: 'so_lieu_row_meta' });

  const dvtComboboxOptions = useMemo(() => {
    const set = new Set<string>([...SO_LIEU_DVT_PRESET_OPTIONS]);
    if (rowMeta && typeof rowMeta === 'object') {
      for (const k of SO_LIEU_ROW_KEYS) {
        const v = rowMeta[k]?.don_vi_tinh_phu?.trim();
        if (v) set.add(v);
      }
    }
    return [...set].sort((a, b) => a.localeCompare(b, 'vi')).map((label) => ({ value: label, label }));
  }, [rowMeta]);

  const th = useMemo(
    () => ({
      tt: t('baoCaoSoChe.readout.colTt'),
      chiSo: t('baoCaoSoChe.readout.colChiSo'),
      giaTri: t('baoCaoSoChe.readout.colGiaTri'),
      dvt: t('baoCaoSoChe.readout.colDvtDong'),
      ghiChu: t('baoCaoSoChe.readout.colGhiChu'),
    }),
    [t]
  );

  return (
    <div className="overflow-x-auto rounded-lg border border-border">
      <table className="w-full text-sm min-w-[48rem] text-left border-collapse">
        <thead>
          <tr className="bg-muted/50 border-b border-border">
            <th className="text-center px-2 py-2 font-medium text-xs w-14 whitespace-nowrap">{th.tt}</th>
            <th className="text-left px-3 py-2 font-medium text-xs min-w-[10rem]">{th.chiSo}</th>
            <th className="text-right px-2 py-2 font-medium text-xs min-w-[7.5rem]">{th.giaTri}</th>
            <th className="text-left px-2 py-2 font-medium text-xs w-[10rem] whitespace-nowrap">{th.dvt}</th>
            <th className="text-left px-2 py-2 font-medium text-xs min-w-[18rem] w-[22rem]">{th.ghiChu}</th>
          </tr>
        </thead>
        <tbody>
          {SO_LIEU_BUONG_ROW_DEFS.map((def, idx) => {
            const numErr = errors[def.key]?.message as string | undefined;
            const metaErrGhi = errors.so_lieu_row_meta?.[def.key]?.ghi_chu?.message as string | undefined;
            const metaErrDvt = errors.so_lieu_row_meta?.[def.key]?.don_vi_tinh_phu?.message as string | undefined;
            return (
              <tr key={def.key} className="border-b border-border/80 last:border-b-0">
                <td className="px-2 py-2 text-center font-medium text-muted-foreground tabular-nums text-xs align-top">
                  {sttOffset + idx + 1}
                </td>
                <td className="px-3 py-2 align-top text-muted-foreground whitespace-normal text-xs">{t(def.labelKey)}</td>
                <td className="px-2 py-1.5 align-top">
                  <Controller
                    name={def.key}
                    control={control}
                    render={({ field }) => (
                      <NumberInput
                        value={field.value ?? 0}
                        onChange={field.onChange}
                        min={0}
                        compact
                        showZeroFormatted
                        className="text-right w-full"
                        error={numErr}
                      />
                    )}
                  />
                </td>
                <td className="px-2 py-1.5 align-top">
                  <Controller
                    name={`so_lieu_row_meta.${def.key}.don_vi_tinh_phu` as const}
                    control={control}
                    render={({ field }) => (
                      <Combobox
                        options={dvtComboboxOptions}
                        value={field.value ?? ''}
                        onChange={(v) => field.onChange(v != null && v !== '' ? String(v) : SO_LIEU_ROW_DVT_DEFAULT)}
                        placeholder={SO_LIEU_ROW_DVT_DEFAULT}
                        searchPlaceholder={t('baoCaoSoChe.readout.dvtComboboxSearch')}
                        creatable
                        creatableLabel={t('baoCaoSoChe.readout.dvtCreatable')}
                        error={metaErrDvt}
                        triggerClassName="h-9 text-sm"
                        searchable
                      />
                    )}
                  />
                </td>
                <td className="px-2 py-1.5 align-top min-w-[18rem] max-w-[32rem]">
                  <Controller
                    name={`so_lieu_row_meta.${def.key}.ghi_chu` as const}
                    control={control}
                    render={({ field }) => (
                      <Textarea
                        {...field}
                        value={field.value ?? ''}
                        rows={3}
                        className="text-xs min-h-[4.5rem] resize-y w-full min-w-[18rem]"
                        placeholder="—"
                        error={metaErrGhi}
                      />
                    )}
                  />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default BaoCaoSoCheSoLieuBuongFormTable;
