import React, { useEffect, useMemo, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Controller,
  useFieldArray,
  useWatch,
  type Control,
  type FieldErrors,
  type UseFormSetValue,
} from 'react-hook-form';
import { Plus, Trash2, Package } from 'lucide-react';
import NumberInput from '../../../../components/ui/NumberInput';
import Input from '../../../../components/ui/Input';
import Combobox from '../../../../components/ui/Combobox';
import Button from '../../../../components/ui/Button';
import FormSection from '../../../../components/shared/FormSection';
import type { BaoCaoSoCheFormValues } from '../core/schema';
import type { FarmBaoCaoSoChePhamCapRow } from '../core/pham-cap';
import {
  PHAM_CAP_ROWS_MAX,
  emptyPhamCapRow,
  sumPhamCapTotals,
  lookupPhieuNhapSoLuong,
  sumPhieuNhapRefForRows,
  normalizePhamCapKey,
  type PhamCapRowFormValues,
} from '../core/pham-cap';
import { parseHeSo } from '../core/he-so-quy-doi';
import { heSoTheoCaiDat } from '../core/he-so-cai-dat';
import { useCaiDatHeSo, useHeSoQuyDoiGoiY } from '../hooks/use-he-so-quy-doi';
import { enrichPhamCapRowsWithDerived } from '../core/pham-cap-derived';
import { formatNumberVN, cn } from '../../../../lib/utils';
import { useIsMobile } from '../../../../lib/hooks/use-is-mobile';
import {
  buildPhamCapMobileCards,
  buildPhamCapMobileTotalFields,
  type PhamCapMobileField,
  type PhamCapMobileFieldKey,
} from '../core/pham-cap-mobile';

function pctDisplay(n: number): string {
  if (!Number.isFinite(n)) return '—';
  return `${formatNumberVN(n)}%`;
}

/** Hệ số hiển thị 2 chữ số thập phân như bảng giấy (1,20 · 0,85). */
function heSoDisplay(n: number | null | undefined): string {
  return n == null ? '—' : formatNumberVN(n, { minFractionDigits: 2 });
}

/**
 * Dòng được tự điền hệ số gần nhất: chưa có hệ số và chưa có tổng quy đổi nhập tay
 * (dòng phiếu cũ có số nhập tay thì giữ nguyên).
 */
function canAutoFillHeSo(row: Pick<PhamCapRowFormValues, 'he_so_quy_doi' | 'so_thung_quy_doi'> | undefined): boolean {
  return !!row && row.he_so_quy_doi == null && !(Number(row.so_thung_quy_doi) > 0);
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

const PHAM_CAP_MOBILE_LABEL_KEY: Record<PhamCapMobileFieldKey, string> = {
  soKg: 'baoCaoSoChe.phamCap.colSoKg',
  phieuNhap: 'baoCaoSoChe.phamCap.mobileSoLuongPhieuNhap',
  soThung: 'baoCaoSoChe.phamCap.colSoThung',
  tongKg: 'baoCaoSoChe.phamCap.colTongKg',
  tyLe: 'baoCaoSoChe.phamCap.colTyLe',
  heSo: 'baoCaoSoChe.phamCap.mobileHeSo',
  quyDoi: 'baoCaoSoChe.phamCap.mobileSoThungQuyDoi',
};

/** Lưới nhãn / giá trị của một thẻ phẩm cấp (điện thoại). */
function PhamCapMobileFieldGrid({ fields }: { fields: PhamCapMobileField[] }) {
  const { t } = useTranslation();
  return (
    <dl className="grid grid-cols-3 gap-x-3 gap-y-2">
      {fields.map((f) => (
        <div key={f.key} className="min-w-0">
          <dt className="text-xs text-muted-foreground leading-tight">{t(PHAM_CAP_MOBILE_LABEL_KEY[f.key])}</dt>
          <dd
            className={cn(
              'mt-0.5 text-sm font-semibold tabular-nums',
              f.warn && 'text-amber-600 dark:text-amber-500'
            )}
          >
            {f.value === null
              ? f.key === 'heSo'
                ? '—'
                : '…'
              : f.pct
                ? pctDisplay(f.value)
                : f.key === 'heSo'
                  ? heSoDisplay(f.value)
                  : formatNumberVN(f.value)}
          </dd>
        </div>
      ))}
    </dl>
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
  setValue: UseFormSetValue<BaoCaoSoCheFormValues>;
  /** Phiếu mới: tự điền hệ số lần gần nhất theo tên phẩm cấp khi mở form. */
  autoFillHeSo?: boolean;
  /** Chi nhánh của phiếu — tra cài đặt hệ số theo farm × phẩm cấp. */
  idChiNhanh?: string;
  /** Quản trị: được sửa tay ô hệ số; ngược lại ô hệ số chỉ đọc khi farm đã cài. */
  canAdmin?: boolean;
}> = ({
  control,
  errors,
  disabled = false,
  phieuNhapByPhamCap,
  phieuNhapRefLoading = false,
  setValue,
  autoFillHeSo = false,
  idChiNhanh = '',
  canAdmin = false,
}) => {
  const { t } = useTranslation();
  const { fields, append, remove } = useFieldArray({ control, name: 'pham_cap' });
  const pham = useWatch({ control, name: 'pham_cap' });
  const { data: heSoGoiY } = useHeSoQuyDoiGoiY(!disabled);
  // Luôn tải cài đặt kể cả section đang disabled — farm thường vẫn phải được tự điền hệ số.
  const { data: caiDat } = useCaiDatHeSo(!!idChiNhanh);

  /** Hệ số đã cài cho farm × phẩm cấp, `null` = farm chưa cài. */
  const heSoCaiDat = (ten: string | null | undefined) =>
    heSoTheoCaiDat(caiDat, idChiNhanh, ten);

  /** Đang có cài đặt cho dòng này không (để khoá ô hoặc hiện gợi ý). */
  const coCaiDat = (ten: string | null | undefined) => heSoCaiDat(ten) != null;

  const heSoOptions = useMemo(() => {
    const set = new Set<number>(heSoGoiY?.options ?? []);
    // Giá trị đang có trên dòng (vd. cài đặt của farm) phải có trong danh sách — nếu không
    // Combobox sẽ không khớp option và hiện placeholder thay vì số.
    for (const r of pham ?? []) {
      const v = r?.he_so_quy_doi;
      if (v != null && Number.isFinite(Number(v))) set.add(Number(v));
    }
    return [...set].sort((a, b) => a - b).map((v) => ({ value: v, label: heSoDisplay(v) }));
  }, [heSoGoiY, pham]);

  /**
   * Điền hệ số cho dòng `idx` theo tên phẩm cấp: ưu tiên cài đặt farm × phẩm cấp,
   * không có mới rơi về gợi ý lịch sử (chỉ khi dòng đang trống).
   * `overwrite` = true cho ca «đổi tên phẩm cấp» — ghi đè cả hệ số đã có.
   */
  const fillHeSoForRow = (
    idx: number,
    ten: string | null | undefined,
    shouldDirty: boolean,
    overwrite = false
  ) => {
    const tuCaiDat = heSoCaiDat(ten);
    if (tuCaiDat != null) {
      if (!overwrite && !canAutoFillHeSo(pham?.[idx])) return;
      setValue(`pham_cap.${idx}.he_so_quy_doi`, tuCaiDat, { shouldDirty });
      return;
    }
    const heSo = heSoGoiY?.ganNhatTheoPhamCap[normalizePhamCapKey(ten)];
    if (heSo == null || !canAutoFillHeSo(pham?.[idx])) return;
    setValue(`pham_cap.${idx}.he_so_quy_doi`, heSo, { shouldDirty });
  };

  // Điền theo cài đặt một lần khi dữ liệu cài đặt tải xong (phiếu mới + phiếu sửa: chỉ dòng trống).
  // KHÔNG chặn theo `disabled` — farm thường nhập phiếu vẫn cần hệ số tự điền.
  const caiDatFilledRef = useRef(false);
  useEffect(() => {
    if (!caiDat || caiDatFilledRef.current) return;
    caiDatFilledRef.current = true;
    (pham ?? []).forEach((r, idx) => {
      const heSo = heSoTheoCaiDat(caiDat, idChiNhanh, r.ten_pham_cap);
      if (heSo == null || !canAutoFillHeSo(r)) return;
      setValue(`pham_cap.${idx}.he_so_quy_doi`, heSo, { shouldDirty: false });
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- chỉ chạy một lần khi cài đặt tải xong
  }, [caiDat, idChiNhanh]);

  // Phiếu mới đổi chi nhánh: điền lại toàn bộ theo cài đặt của farm mới (dòng không khớp để nguyên).
  const prevChiNhanhRef = useRef<string | null>(null);
  useEffect(() => {
    const cur = idChiNhanh ? String(idChiNhanh) : '';
    const prev = prevChiNhanhRef.current;
    prevChiNhanhRef.current = cur;
    // prev == null = lần render đầu (đã có effect điền ban đầu lo); chưa chọn farm thì không làm gì.
    if (!autoFillHeSo || !caiDat || prev == null || !cur || prev === cur) return;
    (pham ?? []).forEach((r, idx) => {
      const heSo = heSoTheoCaiDat(caiDat, cur, r.ten_pham_cap);
      if (heSo != null) setValue(`pham_cap.${idx}.he_so_quy_doi`, heSo, { shouldDirty: true });
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- chỉ phản ứng khi đổi chi nhánh / cài đặt
  }, [idChiNhanh, caiDat, autoFillHeSo]);

  // Phiếu mới: điền một lần khi lịch sử hệ số tải xong (dòng nào farm đã cài thì không đè).
  // Chờ cài đặt tải xong trước (tránh điền gợi ý lịch sử đè lên hệ số admin đã cài — hai
  // request về không theo thứ tự).
  const autoFilledRef = useRef(false);
  useEffect(() => {
    if (!autoFillHeSo || autoFilledRef.current || !heSoGoiY) return;
    if (idChiNhanh && caiDat === undefined) return;
    autoFilledRef.current = true;
    (pham ?? []).forEach((r, idx) => {
      if (coCaiDat(r.ten_pham_cap)) return;
      fillHeSoForRow(idx, r.ten_pham_cap, false);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- chỉ chạy một lần khi có dữ liệu gợi ý
  }, [autoFillHeSo, heSoGoiY, caiDat, idChiNhanh]);
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
              <span className="text-2xs sm:text-xs text-muted-foreground max-w-[14rem] text-right leading-tight">
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
        <table className="w-full text-sm min-w-[70rem] text-left border-collapse">
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
                {t('baoCaoSoChe.phamCap.colHeSoQuyDoi')}
              </th>
              <th rowSpan={2} className="text-center px-2 py-2 font-medium text-xs w-[7.5rem] align-middle border-r border-border/80 leading-tight">
                <span className="block">{t('baoCaoSoChe.phamCap.groupTongQuyDoi')}</span>
                <span className="mt-1 block text-2xs font-normal text-muted-foreground">
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
                <span className="mt-0.5 block text-2xs font-normal text-muted-foreground">
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
                <td colSpan={11} className="px-3 py-6 text-center text-xs text-muted-foreground">
                  {t('baoCaoSoChe.phamCap.emptyHint')}
                </td>
              </tr>
            ) : (
              fields.map((field, idx) => {
                const base = `pham_cap.${idx}` as const;
                const errTen = errors.pham_cap?.[idx]?.ten_pham_cap?.message as string | undefined;
                const errSo = errors.pham_cap?.[idx]?.so_tham_chieu?.message as string | undefined;
                const errSt = errors.pham_cap?.[idx]?.so_thung?.message as string | undefined;
                const errHeSo = errors.pham_cap?.[idx]?.he_so_quy_doi?.message as string | undefined;
                const errGhiChu = errors.pham_cap?.[idx]?.ghi_chu?.message as string | undefined;
                const rowDerived = derived[idx];
                const slPhieuNhap = lookupPhieuNhapSoLuong(phieuNhapByPhamCap, pham?.[idx]?.ten_pham_cap);
                const soThungVal = Number(pham?.[idx]?.so_thung) || 0;
                const soThungMismatch =
                  slPhieuNhap !== undefined && soThungVal > 0 && slPhieuNhap > 0 && soThungVal !== slPhieuNhap;
                // Farm đã cài hệ số cho phẩm cấp này → người không phải admin không sửa được ô.
                const khoaHeSoTheoCaiDat = coCaiDat(pham?.[idx]?.ten_pham_cap) && !canAdmin;
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
                            onBlur={() => {
                              f.onBlur();
                              // Đổi tên phẩm cấp: điền lại theo cài đặt của tên mới (ghi đè).
                              if (!disabled) fillHeSoForRow(idx, f.value, true, true);
                            }}
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
                        name={`${base}.he_so_quy_doi`}
                        control={control}
                        render={({ field }) =>
                          khoaHeSoTheoCaiDat ? (
                            <Input
                              type="text"
                              readOnly
                              value={heSoDisplay(field.value)}
                              title={t('baoCaoSoChe.phamCap.heSoTheoCaiDat')}
                              className="h-8 px-2 text-right text-xs tabular-nums"
                              disabled={disabled}
                              aria-label={t('baoCaoSoChe.phamCap.colHeSoQuyDoi')}
                            />
                          ) : (
                            <Combobox
                              options={heSoOptions}
                              value={field.value ?? null}
                              onChange={(v: string | number) => {
                                if (v === '' || v == null) {
                                  field.onChange(null);
                                  return;
                                }
                                const heSo = parseHeSo(v);
                                if (heSo != null) field.onChange(heSo);
                              }}
                              renderValue={(o) => heSoDisplay(Number(o.value))}
                              placeholder={t('baoCaoSoChe.phamCap.heSoPlaceholder')}
                              searchPlaceholder={t('baoCaoSoChe.phamCap.heSoSearchPlaceholder')}
                              creatable
                              creatableLabel={t('baoCaoSoChe.phamCap.heSoCreatable')}
                              dropdownAutoHeight
                              triggerClassName="h-8 px-2 text-xs tabular-nums"
                              error={errHeSo}
                              disabled={disabled}
                            />
                          )
                        }
                      />
                    </td>
                    <td className="px-2 py-1.5 align-top border-r border-border/80 text-right">
                      <span className="text-xs font-semibold tabular-nums text-foreground">
                        {formatNumberVN(rowDerived?.tong_quy_doi ?? 0)}
                      </span>
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
              <td className="px-2 py-2 border-r border-border/80" aria-hidden />
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
  const isMobile = useIsMobile();
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

  if (isMobile) {
    if (sorted.length === 0) {
      return <p className="py-4 text-center text-xs text-muted-foreground">{t('baoCaoSoChe.phamCap.detailEmpty')}</p>;
    }
    const cards = buildPhamCapMobileCards(sorted, derived, phieuNhapByPhamCap, phieuNhapRefLoading);
    return (
      <div className="space-y-2">
        <div className="rounded-xl border border-primary/20 bg-primary/5 p-3 space-y-2">
          <p className="text-sm font-semibold text-primary">{t('baoCaoSoChe.phamCap.totalRow')}</p>
          <PhamCapMobileFieldGrid
            fields={buildPhamCapMobileTotalFields(totals, phieuNhapRefTotal, phieuNhapRefLoading)}
          />
        </div>
        {cards.map((c, idx) => (
          <div key={`${sorted[idx].id ?? 'row'}-${idx}`} className="rounded-xl border border-border bg-card p-3 space-y-2">
            <p className="text-sm font-semibold text-foreground">
              <span className="mr-1.5 text-xs font-normal text-muted-foreground tabular-nums">{idx + 1}.</span>
              {c.title}
            </p>
            <PhamCapMobileFieldGrid fields={c.fields} />
            {c.ghiChu ? (
              <p className="border-t border-border/60 pt-2 text-xs text-muted-foreground leading-snug whitespace-pre-wrap">
                {c.ghiChu}
              </p>
            ) : null}
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-border bg-muted/10">
      <table className="w-full text-sm min-w-[70rem] text-left border-collapse">
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
            <th rowSpan={2} className="text-center px-2 py-2 font-medium text-xs w-24 align-middle border-r border-border/80 leading-tight">
              {t('baoCaoSoChe.phamCap.colHeSoQuyDoi')}
            </th>
            <th rowSpan={2} className="text-center px-2 py-2 font-medium text-xs w-[7.5rem] align-middle border-r border-border/80 leading-tight">
              <span className="block">{t('baoCaoSoChe.phamCap.groupTongQuyDoi')}</span>
              <span className="mt-1 block text-2xs font-normal text-muted-foreground">
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
              <span className="mt-0.5 block text-2xs font-normal text-muted-foreground">
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
              <td colSpan={10} className="px-3 py-6 text-center text-xs text-muted-foreground">
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
                  <td className="px-2 py-2 text-xs text-right tabular-nums border-r border-border/80">
                    {heSoDisplay(r.he_so_quy_doi)}
                  </td>
                  <td className="px-2 py-2 text-xs text-right tabular-nums border-r border-border/80">
                    {formatNumberVN(d?.tong_quy_doi ?? 0)}
                  </td>
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
            <td className="px-2 py-2 border-r border-border/80" aria-hidden />
            <td className="px-2 py-2 text-xs text-right tabular-nums border-r border-border/80">{formatNumberVN(totals.so_thung_quy_doi)}</td>
            <td className="px-2 py-2" aria-hidden />
          </tr>
        </tbody>
      </table>
    </div>
  );
};
