import React, { useCallback, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Controller, useWatch, type Control, type FieldErrors, type UseFormGetValues, type UseFormSetValue } from 'react-hook-form';
import { Plus, Trash2 } from 'lucide-react';
import NumberInput from '../../../../components/ui/NumberInput';
import Input from '../../../../components/ui/Input';
import Button from '../../../../components/ui/Button';
import type { BaoCaoNhanCongFormValues, ChiTietSubFormValues } from '../core/schema';
import {
  LOAI_CHI_TIEU_CODES,
  type LoaiChiTieu,
  type ChiTietSubFormByLoai,
  normalizeChiTietSubFormByLoai,
  syncChiTietTotalsFromSub,
  defaultCtSubFormRow,
  padSubToRowCount,
  subAlignedRowCount,
  ensureSubFormMinRows,
} from '../core/ct-sub';
import {
  bcncTrSub,
  bcncTdTt,
  bcncTdSubLabel,
  bcncTdGhiChu,
  bcncTdInput,
  bcncTdSubDash,
  bcncTdSubHighlightDash,
} from '../core/bcnc-detail-table';

const SL_INPUT = { maxFractionDigits: 0, min: 0 } as const;
const GIO_INPUT = { maxFractionDigits: 2, min: 0 } as const;

type SubFieldErrors = FieldErrors<ChiTietSubFormValues>;

function subPairError(subErrors: SubFieldErrors | undefined, loai: LoaiChiTieu, rowIdx: number): string | undefined {
  const row = subErrors?.[loai]?.[rowIdx];
  return row?.sl_cong?.message ?? row?.so_gio?.message;
}

interface Props {
  chiTietIndex: number;
  control: Control<BaoCaoNhanCongFormValues>;
  setValue: UseFormSetValue<BaoCaoNhanCongFormValues>;
  getValues: UseFormGetValues<BaoCaoNhanCongFormValues>;
  subErrors?: SubFieldErrors;
}

/** Dòng chi tiết + nút thêm — render trực tiếp trong tbody bảng chuyền (cùng lưới detail). */
const BaoCaoNhanCongChuyenSubEditor: React.FC<Props> = ({ chiTietIndex, control, setValue, getValues, subErrors }) => {
  const { t } = useTranslation();

  const syncTotals = useCallback(
    (sub: ChiTietSubFormByLoai) => {
      const totals = syncChiTietTotalsFromSub(sub);
      setValue(`chi_tiet.${chiTietIndex}.sl_cong_ngay`, totals.sl_cong_ngay, { shouldDirty: true });
      setValue(`chi_tiet.${chiTietIndex}.sl_cong_nua`, totals.sl_cong_nua, { shouldDirty: true });
      setValue(`chi_tiet.${chiTietIndex}.sl_tang_ca`, totals.sl_tang_ca, { shouldDirty: true });
      setValue(`chi_tiet.${chiTietIndex}.so_gio_tc`, totals.so_gio_tc, { shouldDirty: true });
    },
    [chiTietIndex, setValue]
  );

  const applySub = useCallback(
    (sub: ChiTietSubFormByLoai) => {
      const normalized = normalizeChiTietSubFormByLoai(sub);
      const aligned = padSubToRowCount(normalized, Math.max(1, subAlignedRowCount(normalized)));
      setValue(
        `chi_tiet.${chiTietIndex}.sub`,
        aligned as BaoCaoNhanCongFormValues['chi_tiet'][number]['sub'],
        { shouldDirty: true }
      );
      syncTotals(aligned);
    },
    [chiTietIndex, setValue, syncTotals]
  );

  const watchedSub = useWatch({ control, name: `chi_tiet.${chiTietIndex}.sub` });
  const sub = normalizeChiTietSubFormByLoai(watchedSub);
  const rowCount = Math.max(1, subAlignedRowCount(sub));
  const alignedSub = padSubToRowCount(sub, rowCount);

  useEffect(() => {
    const current = normalizeChiTietSubFormByLoai(getValues(`chi_tiet.${chiTietIndex}.sub`));
    const n = Math.max(1, subAlignedRowCount(current));
    if (LOAI_CHI_TIEU_CODES.some((k) => (current[k]?.length ?? 0) !== n)) {
      applySub(padSubToRowCount(current, n));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chiTietIndex]);

  const updateLoaiCell = (rowIdx: number, loai: LoaiChiTieu, patch: Partial<{ sl_cong: number; so_gio: number }>) => {
    const next = padSubToRowCount(normalizeChiTietSubFormByLoai(getValues(`chi_tiet.${chiTietIndex}.sub`)), rowCount);
    const row = { ...next[loai][rowIdx], ...patch };
    next[loai][rowIdx] = {
      sl_cong: Number(row.sl_cong ?? 0),
      so_gio: Number(row.so_gio ?? 0),
      ghi_chu: row.ghi_chu ?? null,
    };
    applySub(next);
  };

  const setRowGhiChu = (rowIdx: number, value: string | null) => {
    const next = padSubToRowCount(normalizeChiTietSubFormByLoai(getValues(`chi_tiet.${chiTietIndex}.sub`)), rowCount);
    for (const loai of LOAI_CHI_TIEU_CODES) {
      next[loai][rowIdx] = { ...next[loai][rowIdx], ghi_chu: value };
    }
    applySub(next);
  };

  const addRow = () => {
    applySub(
      padSubToRowCount(normalizeChiTietSubFormByLoai(getValues(`chi_tiet.${chiTietIndex}.sub`)), rowCount + 1)
    );
  };

  const removeRow = (rowIdx: number) => {
    if (rowCount <= 1) return;
    const next = ensureSubFormMinRows(getValues(`chi_tiet.${chiTietIndex}.sub`), 0);
    for (const loai of LOAI_CHI_TIEU_CODES) {
      next[loai] = next[loai].filter((_, i) => i !== rowIdx);
    }
    applySub(padSubToRowCount(next, Math.max(1, subAlignedRowCount(next))));
  };

  const loaiInputCells = (rowIdx: number, loai: LoaiChiTieu) => {
    const slName = `chi_tiet.${chiTietIndex}.sub.${loai}.${rowIdx}.sl_cong` as const;
    const gioName = `chi_tiet.${chiTietIndex}.sub.${loai}.${rowIdx}.so_gio` as const;
    const pairErr = subPairError(subErrors, loai, rowIdx);
    return (
      <React.Fragment key={loai}>
        <td className={bcncTdInput}>
          <Controller
            name={slName}
            control={control}
            render={({ field: f }) => (
              <NumberInput
                value={Number(f.value ?? 0)}
                onChange={(v) => updateLoaiCell(rowIdx, loai, { sl_cong: v })}
                {...SL_INPUT}
                compact
                className="w-full min-w-0 max-w-full"
                error={pairErr}
              />
            )}
          />
        </td>
        <td className={bcncTdInput}>
          <Controller
            name={gioName}
            control={control}
            render={({ field: f }) => (
              <NumberInput
                value={Number(f.value ?? 0)}
                onChange={(v) => updateLoaiCell(rowIdx, loai, { so_gio: v })}
                {...GIO_INPUT}
                compact
                className="w-full min-w-0 max-w-full"
                error={pairErr}
              />
            )}
          />
        </td>
      </React.Fragment>
    );
  };

  return (
    <>
      {Array.from({ length: rowCount }, (_, rowIdx) => (
        <tr key={rowIdx} className={bcncTrSub}>
          <td className={`${bcncTdTt} text-muted-foreground/50 text-xs`}>·</td>
          <td className={bcncTdSubLabel}>
            <div className="flex items-center justify-between gap-0.5">
              <span className="truncate">{t('baoCaoNhanCong.sub.detailRow', { index: rowIdx + 1 })}</span>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0 shrink-0 text-rose-600"
                disabled={rowCount <= 1}
                onClick={() => removeRow(rowIdx)}
                aria-label={t('common.delete')}
              >
                <Trash2 size={14} />
              </Button>
            </div>
          </td>
          {loaiInputCells(rowIdx, 'CN_NGAY')}
          {loaiInputCells(rowIdx, 'CN_NUA')}
          <td className={bcncTdSubDash}>—</td>
          <td className={bcncTdSubHighlightDash}>—</td>
          {loaiInputCells(rowIdx, 'TANG_CA')}
          <td className={bcncTdSubHighlightDash}>—</td>
          <td className={bcncTdGhiChu}>
            <Input
              value={alignedSub.CN_NGAY[rowIdx]?.ghi_chu ?? ''}
              onChange={(e) => setRowGhiChu(rowIdx, e.target.value || null)}
              className="text-xs h-7 min-w-0"
              placeholder="—"
            />
          </td>
        </tr>
      ))}
      <tr className="bg-muted/10 border-b border-border/60">
        <td colSpan={12} className="px-2 py-1.5">
          <Button type="button" variant="outline" size="sm" className="h-7 text-xs gap-1" onClick={addRow}>
            <Plus size={13} />
            {t('baoCaoNhanCong.sub.addRow')}
          </Button>
        </td>
      </tr>
    </>
  );
};

export default BaoCaoNhanCongChuyenSubEditor;
