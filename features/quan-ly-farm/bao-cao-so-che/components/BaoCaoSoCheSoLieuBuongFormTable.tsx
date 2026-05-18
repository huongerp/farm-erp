import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Controller, useWatch, type Control, type FieldErrors } from 'react-hook-form';
import NumberInput from '../../../../components/ui/NumberInput';
import Combobox from '../../../../components/ui/Combobox';
import Textarea from '../../../../components/ui/Textarea';
import type { BaoCaoSoCheFormValues } from '../core/schema';
import {
  bcscSoLieuColChiSo,
  bcscSoLieuColDvt,
  bcscSoLieuColGiaTri,
  bcscSoLieuColTt,
  bcscSoLieuTableClass,
  bcscSoLieuTdChiSo,
  bcscSoLieuTdDvt,
  bcscSoLieuTdGiaTri,
  bcscSoLieuTdTt,
  bcncColGhiChu,
  bcncTdGhiChu,
} from '../core/bcsc-so-lieu-table';
import {
  SO_LIEU_BUONG_ROW_DEFS,
  SO_LIEU_DVT_PRESET_OPTIONS,
  SO_LIEU_ROW_DVT_DEFAULT,
  SO_LIEU_ROW_DVT_QC_PCT,
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
      <table className={bcscSoLieuTableClass}>
          <thead>
            <tr className="bg-muted/50 border-b border-border">
              <th className={`text-center px-1 py-2 font-medium text-xs whitespace-nowrap ${bcscSoLieuColTt}`}>
                {th.tt}
              </th>
              <th className={`text-left px-2 py-2 font-medium text-xs ${bcscSoLieuColChiSo}`}>{th.chiSo}</th>
              <th className={`text-right px-1 py-2 font-medium text-xs ${bcscSoLieuColGiaTri}`}>{th.giaTri}</th>
              <th className={`text-left px-1 py-2 font-medium text-xs ${bcscSoLieuColDvt}`}>{th.dvt}</th>
              <th className={`text-left px-2 py-2 font-medium text-xs ${bcncColGhiChu}`}>{th.ghiChu}</th>
            </tr>
          </thead>
          <tbody>
            {SO_LIEU_BUONG_ROW_DEFS.map((def, idx) => {
              const isQcPct = def.key === 'danh_gia_loi_qc_pct';
              const numErr = errors[def.key as keyof BaoCaoSoCheFormValues]?.message as string | undefined;
              const metaErrGhi = errors.so_lieu_row_meta?.[def.key]?.ghi_chu?.message as string | undefined;
              const metaErrDvt = errors.so_lieu_row_meta?.[def.key]?.don_vi_tinh_phu?.message as string | undefined;
              return (
                <tr key={def.key} className="border-b border-border/80 last:border-b-0">
                  <td className={`${bcscSoLieuTdTt} font-medium text-muted-foreground tabular-nums text-xs`}>
                    {sttOffset + idx + 1}
                  </td>
                  <td className={`${bcscSoLieuTdChiSo} text-muted-foreground text-xs leading-snug`}>
                    {t(def.labelKey)}
                  </td>
                  <td className={bcscSoLieuTdGiaTri}>
                    <Controller
                      name={def.key}
                      control={control}
                      render={({ field }) => (
                        <NumberInput
                          value={field.value ?? 0}
                          onChange={field.onChange}
                          min={0}
                          max={isQcPct ? 100 : undefined}
                          compact
                          showZeroFormatted
                          className="text-right w-full"
                          error={numErr}
                        />
                      )}
                    />
                  </td>
                  <td className={bcscSoLieuTdDvt}>
                    <Controller
                      name={`so_lieu_row_meta.${def.key}.don_vi_tinh_phu` as const}
                      control={control}
                      render={({ field }) => (
                        <Combobox
                          options={dvtComboboxOptions}
                          value={field.value ?? ''}
                          onChange={(v) =>
                            field.onChange(
                              v != null && v !== ''
                                ? String(v)
                                : isQcPct
                                  ? SO_LIEU_ROW_DVT_QC_PCT
                                  : SO_LIEU_ROW_DVT_DEFAULT
                            )
                          }
                          placeholder={isQcPct ? SO_LIEU_ROW_DVT_QC_PCT : SO_LIEU_ROW_DVT_DEFAULT}
                          searchPlaceholder={t('baoCaoSoChe.readout.dvtComboboxSearch')}
                          creatable
                          creatableLabel={t('baoCaoSoChe.readout.dvtCreatable')}
                          error={metaErrDvt}
                          triggerClassName="h-8 text-xs"
                          searchable
                        />
                      )}
                    />
                  </td>
                  <td className={bcncTdGhiChu}>
                    <Controller
                      name={`so_lieu_row_meta.${def.key}.ghi_chu` as const}
                      control={control}
                      render={({ field }) => (
                        <Textarea
                          {...field}
                          value={field.value ?? ''}
                          rows={1}
                          className="text-sm resize-y w-full min-h-0 py-1.5"
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
