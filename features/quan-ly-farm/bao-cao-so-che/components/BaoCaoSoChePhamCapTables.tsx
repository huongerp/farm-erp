import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Controller, useFieldArray, useWatch, type Control, type FieldErrors } from 'react-hook-form';
import { Plus, Trash2, Package } from 'lucide-react';
import NumberInput from '../../../../components/ui/NumberInput';
import Input from '../../../../components/ui/Input';
import Button from '../../../../components/ui/Button';
import FormSection from '../../../../components/shared/FormSection';
import type { BaoCaoSoCheFormValues } from '../core/schema';
import type { FarmBaoCaoSoChePhamCapRow } from '../core/pham-cap';
import { PHAM_CAP_ROWS_MAX, emptyPhamCapRow, sumPhamCapTotals, lookupPhieuNhapSoLuong, sumPhieuNhapRefForRows } from '../core/pham-cap';
import { enrichPhamCapRowsWithDerived } from '../core/pham-cap-derived';
import { formatNumberVN, cn } from '../../../../lib/utils';

function pctDisplay(n: number): string {
  if (!Number.isFinite(n)) return '—';
  return `${formatNumberVN(n)}%`;
}

function PhieuNhapRefCell({
  qty,
  loading,
}: {
  qty: number | undefined;
  loading?: boolean;
}) {
  if (loading) {
    return <span className="text-xs text-muted-foreground">…</span>;
  }
  if (qty === undefined) {
    return <span className="text-xs text-muted-foreground">—</span>;
  }
  return (
    <span className="text-xs font-medium tabular-nums text-muted-foreground">
      {formatNumberVN(qty)}
    </span>
  );
}

/** Section + bảng phẩm cấp (nút Thêm trên cùng hàng tiêu đề). */
export const BaoCaoSoChePhamCapFormSection: React.FC<{
  control: Control<BaoCaoSoCheFormValues>;
  errors: FieldErrors<BaoCaoSoCheFormValues>;
  /** Khi true: ẩn nút Thêm/Xóa, disable toàn bộ input — chỉ quản trị mới thao tác được. */
  disabled?: boolean;
  /** SL phiếu nhập kho theo phẩm cấp (đối chiếu, không lưu DB). */
  phieuNhapByPhamCap?: Record<string, number>;
  phieuNhapRefLoading?: boolean;
}> = ({ control, errors, disabled = false, phieuNhapByPhamCap, phieuNhapRefLoading = false }) => {
  const { t } = useTranslation();
  const { fields, append, remove } = useFieldArray({ control, name: 'pham_cap' });
  const pham = useWatch({ control, name: 'pham_cap' });
  const derived = useMemo(() => enrichPhamCapRowsWithDerived(pham ?? []), [pham]);
  const totals = useMemo(() => sumPhamCapTotals(pham ?? []), [pham]);
  const phieuNhapRefTotal = useMemo(
    () => sumPhieuNhapRefForRows(phieuNhapByPhamCap, pham ?? []),
    [phieuNhapByPhamCap, pham]
  );
  const atMax = fields.length >= PHAM_CAP_ROWS_MAX;

  return (
    <FormSection
      title={t('baoCaoSoChe.form.sectionPhamCapTitle')}
      icon={<Package size={14} aria-hidden />}
      variant="primary"
      action={
        !disabled ? (
          <div className="flex flex-wrap items-center justify-end gap-2">
            {atMax ? (
              <span className="text-[10px] sm:text-xs text-muted-foreground max-w-[14rem] text-right leading-tight">
                {t('baoCaoSoChe.phamCap.maxRowsHint', { max: PHAM_CAP_ROWS_MAX })}
              </span>
            ) : null}
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="gap-1 shrink-0"
              disabled={atMax}
              onClick={() => append(emptyPhamCapRow())}
            >
              <Plus className="h-3.5 w-3.5" aria-hidden />
              {t('baoCaoSoChe.phamCap.addRow')}
            </Button>
          </div>
        ) : undefined
      }
    >
      <div className="overflow-x-auto rounded-lg border border-border -mx-0.5 sm:mx-0">
        <table className="w-full text-sm min-w-[64rem] text-left border-collapse">
          <thead>
            <tr className="bg-muted/50 border-b border-border">
              <th rowSpan={2} className="text-center px-2 py-2 font-medium text-xs w-12 align-middle border-r border-border/80">
                {t('baoCaoSoChe.readout.colTt')}
              </th>
              <th rowSpan={2} className="text-left px-3 py-2 font-medium text-xs min-w-[10rem] align-middle border-r border-border/80">
                {t('baoCaoSoChe.phamCap.colPhamCap')}
              </th>
              <th rowSpan={2} className="text-right px-2 py-2 font-medium text-xs w-20 align-middle border-r border-border/80">
                {t('baoCaoSoChe.phamCap.colSoKg')}
              </th>
              <th colSpan={4} className="text-center px-2 py-1.5 font-medium text-xs border-r border-border/80">
                {t('baoCaoSoChe.phamCap.groupLoaiThung')}
              </th>
              <th rowSpan={2} className="text-center px-2 py-2 font-medium text-xs w-[7.5rem] align-middle border-r border-border/80 leading-tight">
                <span className="block">{t('baoCaoSoChe.phamCap.groupTongQuyDoi')}</span>
                <span className="mt-1 block text-[10px] font-normal text-muted-foreground">
                  {t('baoCaoSoChe.phamCap.colSoThungQD')}
                </span>
              </th>
              <th rowSpan={2} className="text-left px-2 py-2 font-medium text-xs min-w-[12rem] align-middle border-r border-border/80">
                {t('baoCaoSoChe.phamCap.colGhiChu')}
              </th>
              <th rowSpan={2} className="text-center px-2 py-2 font-medium text-xs w-24 align-middle">
                {t('baoCaoSoChe.phamCap.colThaoTac')}
              </th>
            </tr>
            <tr className="bg-muted/40 border-b border-border">
              <th className="text-right px-2 py-1.5 font-medium text-xs border-r border-border/60 leading-tight">
                <span className="block">{t('baoCaoSoChe.phamCap.colSoThungPhieuNhap')}</span>
                <span className="mt-0.5 block text-[10px] font-normal text-muted-foreground">
                  {t('baoCaoSoChe.phamCap.colSoThungPhieuNhapHint')}
                </span>
              </th>
              <th className="text-right px-2 py-1.5 font-medium text-xs border-r border-border/60">
                {t('baoCaoSoChe.phamCap.colSoThung')}
              </th>
              <th className="text-right px-2 py-1.5 font-medium text-xs border-r border-border/60">
                {t('baoCaoSoChe.phamCap.colTongKg')}
              </th>
              <th className="text-right px-2 py-1.5 font-medium text-xs border-r border-border/80">
                {t('baoCaoSoChe.phamCap.colTyLe')}
              </th>
            </tr>
          </thead>
          <tbody>
            {fields.length === 0 ? (
              <tr className="border-b border-border/80">
                <td colSpan={10} className="px-3 py-6 text-center text-xs text-muted-foreground">
                  {t('baoCaoSoChe.phamCap.emptyHint')}
                </td>
              </tr>
            ) : (
              fields.map((field, idx) => {
                const base = `pham_cap.${idx}` as const;
                const errTen = errors.pham_cap?.[idx]?.ten_pham_cap?.message as string | undefined;
                const errSo = errors.pham_cap?.[idx]?.so_tham_chieu?.message as string | undefined;
                const errSt = errors.pham_cap?.[idx]?.so_thung?.message as string | undefined;
                const errQd = errors.pham_cap?.[idx]?.so_thung_quy_doi?.message as string | undefined;
                const errGhiChu = errors.pham_cap?.[idx]?.ghi_chu?.message as string | undefined;
                const rowDerived = derived[idx];
                const slPhieuNhap = lookupPhieuNhapSoLuong(phieuNhapByPhamCap, pham?.[idx]?.ten_pham_cap);
                const soThungVal = Number(pham?.[idx]?.so_thung) || 0;
                const soThungMismatch =
                  slPhieuNhap !== undefined && soThungVal > 0 && slPhieuNhap > 0 && soThungVal !== slPhieuNhap;
                return (
                  <tr key={field.id} className="border-b border-border/80">
                    <td className="px-2 py-1.5 text-center text-xs text-muted-foreground tabular-nums align-top border-r border-border/60">
                      {idx + 1}
                    </td>
                    <td className="px-3 py-1.5 align-top border-r border-border/60">
                      <Controller
                        name={`${base}.ten_pham_cap`}
                        control={control}
                        render={({ field: f }) => (
                          <Input
                            {...f}
                            value={f.value ?? ''}
                            placeholder={t('baoCaoSoChe.phamCap.tenPlaceholder')}
                            className="text-xs h-8"
                            error={errTen}
                            disabled={disabled}
                          />
                        )}
                      />
                    </td>
                    <td className="px-2 py-1 align-top border-r border-border/60">
                      <Controller
                        name={`${base}.so_tham_chieu`}
                        control={control}
                        render={({ field }) => (
                          <NumberInput
                            value={field.value ?? 0}
                            onChange={field.onChange}
                            min={0}
                            compact
                            showZeroFormatted
                            className="text-right w-full"
                            error={errSo}
                            disabled={disabled}
                          />
                        )}
                      />
                    </td>
                    <td className="px-2 py-1.5 align-top border-r border-border/60 text-right">
                      <PhieuNhapRefCell qty={slPhieuNhap} loading={phieuNhapRefLoading} />
                    </td>
                    <td className="px-2 py-1 align-top border-r border-border/60">
                      <Controller
                        name={`${base}.so_thung`}
                        control={control}
                        render={({ field }) => (
                          <NumberInput
                            value={field.value ?? 0}
                            onChange={field.onChange}
                            min={0}
                            compact
                            showZeroFormatted
                            className={cn('text-right w-full', soThungMismatch && 'text-amber-600 dark:text-amber-500')}
                            error={errSt}
                            disabled={disabled}
                          />
                        )}
                      />
                    </td>
                    <td className="px-2 py-1.5 align-top border-r border-border/60 text-right">
                      <span className="text-xs font-medium tabular-nums text-foreground">
                        {formatNumberVN(rowDerived?.tong_kg ?? 0)}
                      </span>
                    </td>
                    <td className="px-2 py-1.5 align-top border-r border-border/80 text-right">
                      <span className="text-xs font-medium tabular-nums text-muted-foreground">
                        {pctDisplay(rowDerived?.ty_le_pct ?? 0)}
                      </span>
                    </td>
                    <td className="px-2 py-1 align-top border-r border-border/80">
                      <Controller
                        name={`${base}.so_thung_quy_doi`}
                        control={control}
                        render={({ field }) => (
                          <NumberInput
                            value={field.value ?? 0}
                            onChange={field.onChange}
                            min={0}
                            compact
                            showZeroFormatted
                            className="text-right w-full"
                            error={errQd}
                            disabled={disabled}
                          />
                        )}
                      />
                    </td>
                    <td className="px-2 py-1.5 align-top border-r border-border/80">
                      <Controller
                        name={`${base}.ghi_chu`}
                        control={control}
                        render={({ field: f }) => (
                          <Input
                            {...f}
                            value={f.value ?? ''}
                            placeholder={t('baoCaoSoChe.phamCap.ghiChuPlaceholder')}
                            className="text-xs h-8"
                            error={errGhiChu}
                            disabled={disabled}
                          />
                        )}
                      />
                    </td>
                    <td className="px-1 py-1 align-middle text-center">
                      {!disabled && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-destructive"
                          onClick={() => remove(idx)}
                          aria-label={t('baoCaoSoChe.phamCap.removeRow')}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
            <tr className="bg-muted/30 font-medium">
              <td colSpan={3} className="px-3 py-2 text-xs text-right border-r border-border/80">
                {t('baoCaoSoChe.phamCap.totalRow')}
              </td>
              <td className="px-2 py-2 text-xs text-right tabular-nums text-muted-foreground border-r border-border/60">
                {phieuNhapRefLoading ? '…' : formatNumberVN(phieuNhapRefTotal)}
              </td>
              <td className="px-2 py-2 text-xs text-right tabular-nums border-r border-border/60">{formatNumberVN(totals.so_thung)}</td>
              <td className="px-2 py-2 text-xs text-right tabular-nums border-r border-border/60">{formatNumberVN(totals.tong_kg)}</td>
              <td className="px-2 py-2 text-xs text-right tabular-nums border-r border-border/80">{pctDisplay(totals.ty_le_pct)}</td>
              <td className="px-2 py-2 text-xs text-right tabular-nums border-r border-border/80">{formatNumberVN(totals.so_thung_quy_doi)}</td>
              <td className="px-2 py-2 border-r border-border/80" aria-hidden />
              <td className="px-2 py-2 border-border/80" aria-hidden />
            </tr>
          </tbody>
        </table>
      </div>
    </FormSection>
  );
};

export const BaoCaoSoChePhamCapDetailTable: React.FC<{
  rows: FarmBaoCaoSoChePhamCapRow[];
  phieuNhapByPhamCap?: Record<string, number>;
  phieuNhapRefLoading?: boolean;
}> = ({ rows, phieuNhapByPhamCap, phieuNhapRefLoading = false }) => {
  const { t } = useTranslation();
  const sorted = useMemo(
    () => [...rows].sort((a, b) => (a.thu_tu ?? 0) - (b.thu_tu ?? 0)),
    [rows]
  );
  const derived = useMemo(() => enrichPhamCapRowsWithDerived(sorted), [sorted]);
  const totals = useMemo(() => sumPhamCapTotals(sorted), [sorted]);
  const phieuNhapRefTotal = useMemo(
    () => sumPhieuNhapRefForRows(phieuNhapByPhamCap, sorted),
    [phieuNhapByPhamCap, sorted]
  );

  return (
    <div className="overflow-x-auto rounded-lg border border-border bg-muted/10">
      <table className="w-full text-sm min-w-[64rem] text-left border-collapse">
        <thead>
          <tr className="bg-muted/50 border-b border-border">
            <th rowSpan={2} className="text-center px-2 py-2 font-medium text-xs w-12 align-middle border-r border-border/80">
              {t('baoCaoSoChe.readout.colTt')}
            </th>
            <th rowSpan={2} className="text-left px-3 py-2 font-medium text-xs min-w-[12rem] align-middle border-r border-border/80">
              {t('baoCaoSoChe.phamCap.colPhamCap')}
            </th>
            <th rowSpan={2} className="text-right px-2 py-2 font-medium text-xs w-20 align-middle border-r border-border/80">
              {t('baoCaoSoChe.phamCap.colSoKg')}
            </th>
            <th colSpan={4} className="text-center px-2 py-1.5 font-medium text-xs border-r border-border/80">
              {t('baoCaoSoChe.phamCap.groupLoaiThung')}
            </th>
            <th rowSpan={2} className="text-center px-2 py-2 font-medium text-xs w-[7.5rem] align-middle border-r border-border/80 leading-tight">
              <span className="block">{t('baoCaoSoChe.phamCap.groupTongQuyDoi')}</span>
              <span className="mt-1 block text-[10px] font-normal text-muted-foreground">
                {t('baoCaoSoChe.phamCap.colSoThungQD')}
              </span>
            </th>
            <th rowSpan={2} className="text-left px-2 py-2 font-medium text-xs min-w-[12rem] align-middle">
              {t('baoCaoSoChe.phamCap.colGhiChu')}
            </th>
          </tr>
          <tr className="bg-muted/40 border-b border-border">
            <th className="text-right px-2 py-1.5 font-medium text-xs border-r border-border/60 leading-tight">
              <span className="block">{t('baoCaoSoChe.phamCap.colSoThungPhieuNhap')}</span>
              <span className="mt-0.5 block text-[10px] font-normal text-muted-foreground">
                {t('baoCaoSoChe.phamCap.colSoThungPhieuNhapHint')}
              </span>
            </th>
            <th className="text-right px-2 py-1.5 font-medium text-xs border-r border-border/60">
              {t('baoCaoSoChe.phamCap.colSoThung')}
            </th>
            <th className="text-right px-2 py-1.5 font-medium text-xs border-r border-border/60">
              {t('baoCaoSoChe.phamCap.colTongKg')}
            </th>
            <th className="text-right px-2 py-1.5 font-medium text-xs border-r border-border/80">
              {t('baoCaoSoChe.phamCap.colTyLe')}
            </th>
          </tr>
        </thead>
        <tbody>
          {sorted.length === 0 ? (
            <tr>
              <td colSpan={9} className="px-3 py-6 text-center text-xs text-muted-foreground">
                {t('baoCaoSoChe.phamCap.detailEmpty')}
              </td>
            </tr>
          ) : (
            sorted.map((r, idx) => {
              const d = derived[idx];
              const slPhieuNhap = lookupPhieuNhapSoLuong(phieuNhapByPhamCap, r.ten_pham_cap);
              const soThungVal = Number(r.so_thung) || 0;
              const soThungMismatch =
                slPhieuNhap !== undefined && soThungVal > 0 && slPhieuNhap > 0 && soThungVal !== slPhieuNhap;
              return (
                <tr key={`${r.id ?? 'row'}-${idx}`} className="border-b border-border/80 last:border-b-0">
                  <td className="px-2 py-2 text-center text-xs text-muted-foreground tabular-nums border-r border-border/60">
                    {idx + 1}
                  </td>
                  <td className="px-3 py-2 text-xs border-r border-border/60">{r.ten_pham_cap || '—'}</td>
                  <td className="px-2 py-2 text-xs text-right tabular-nums border-r border-border/60">
                    {formatNumberVN(r.so_tham_chieu ?? 0)}
                  </td>
                  <td className="px-2 py-2 text-xs text-right tabular-nums border-r border-border/60">
                    <PhieuNhapRefCell qty={slPhieuNhap} loading={phieuNhapRefLoading} />
                  </td>
                  <td
                    className={cn(
                      'px-2 py-2 text-xs text-right tabular-nums border-r border-border/60',
                      soThungMismatch && 'text-amber-600 dark:text-amber-500 font-medium'
                    )}
                  >
                    {formatNumberVN(r.so_thung ?? 0)}
                  </td>
                  <td className="px-2 py-2 text-xs text-right tabular-nums border-r border-border/60">
                    {formatNumberVN(d?.tong_kg ?? 0)}
                  </td>
                  <td className="px-2 py-2 text-xs text-right tabular-nums border-r border-border/80">
                    {pctDisplay(d?.ty_le_pct ?? 0)}
                  </td>
                  <td className="px-2 py-2 text-xs text-right tabular-nums border-r border-border/80">{formatNumberVN(r.so_thung_quy_doi ?? 0)}</td>
                  <td className="px-2 py-2 text-xs text-muted-foreground whitespace-pre-wrap leading-snug">
                    {r.ghi_chu?.trim() || '—'}
                  </td>
                </tr>
              );
            })
          )}
          <tr className="bg-muted/30 font-medium border-t border-border">
            <td colSpan={3} className="px-3 py-2 text-xs text-right border-r border-border/80">
              {t('baoCaoSoChe.phamCap.totalRow')}
            </td>
            <td className="px-2 py-2 text-xs text-right tabular-nums text-muted-foreground border-r border-border/60">
              {phieuNhapRefLoading ? '…' : formatNumberVN(phieuNhapRefTotal)}
            </td>
            <td className="px-2 py-2 text-xs text-right tabular-nums border-r border-border/60">{formatNumberVN(totals.so_thung)}</td>
            <td className="px-2 py-2 text-xs text-right tabular-nums border-r border-border/60">{formatNumberVN(totals.tong_kg)}</td>
            <td className="px-2 py-2 text-xs text-right tabular-nums border-r border-border/80">{pctDisplay(totals.ty_le_pct)}</td>
            <td className="px-2 py-2 text-xs text-right tabular-nums border-r border-border/80">{formatNumberVN(totals.so_thung_quy_doi)}</td>
            <td className="px-2 py-2" aria-hidden />
          </tr>
        </tbody>
      </table>
    </div>
  );
};
