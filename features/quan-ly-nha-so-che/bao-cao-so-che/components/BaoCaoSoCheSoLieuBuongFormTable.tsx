import React, { useEffect, useMemo } from 'react';
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
  laSoLieuRowTuDgdv,
  laSoLieuRowTuGscl,
  laSoLieuRowTuTinh,
  tinhTonCuoiNgay,
  type SoLieuRowKeyTuDgdv,
} from '../core/so-lieu-row-meta';
import { cn, formatDateShort, formatNumberVN } from '../../../../lib/utils';
import type { BcscTonDauNgay } from '../core/ton-dau-ngay';
import type { QcNgay } from '../../giam-sat-chat-luong/core/qc-ngay';
import { DGDV_BANG_DANH_GIA_URL } from '../../danh-gia-dau-vao/hooks/use-dgdv-tong-ngay';

interface Props {
  control: Control<BaoCaoSoCheFormValues>;
  errors: FieldErrors<BaoCaoSoCheFormValues>;
  /** STT cột TT bắt đầu từ số này (nối sau các dòng BCNC). */
  sttOffset: number;
  /** Số của 2 chỉ tiêu khoá theo Đánh giá đầu vào (ngày + chi nhánh đang chọn); null → «—». */
  giaTriTuDgdv: Record<SoLieuRowKeyTuDgdv, number | null>;
  /** RPC tổng ngày lỗi → hiện dòng báo dưới ghi chú nguồn. */
  dgdvLoi?: boolean;
  /** Tình hình QC từ Giám sát chất lượng (ngày + chi nhánh đang chọn); undefined (chưa chọn / đang tải) → «—». */
  qcGscl?: QcNgay;
  /** RPC tỉ lệ lỗi lỗi → hiện dòng báo dưới ghi chú nguồn. */
  gsclLoi?: boolean;
  /** Tồn đầu theo phiếu liền trước; `co_phieu_truoc` → ô mục 6 khoá (DB trigger ghi đè). */
  tonDauTuPhieuTruoc?: BcscTonDauNgay;
}

/**
 * Đồng bộ giá trị tự tính / khoá vào form. Không gọi hook trong render-prop inline của Controller
 * → tách component con ở module-level, effect chỉ chạy khi `value` đổi.
 */
const DongBoGiaTri: React.FC<{ value: number; onChange: (v: number) => void }> = ({ value, onChange }) => {
  useEffect(() => {
    onChange(value);
  }, [value, onChange]);
  return null;
};

const BaoCaoSoCheSoLieuBuongFormTable: React.FC<Props> = ({
  control,
  errors,
  sttOffset,
  giaTriTuDgdv,
  dgdvLoi = false,
  qcGscl,
  gsclLoi = false,
  tonDauTuPhieuTruoc,
}) => {
  const { t } = useTranslation();
  const rowMeta = useWatch({ control, name: 'so_lieu_row_meta' });
  // Mục 10 tự tính = mục 6 + mục 7 − mục 8 − mục 9 (mục 7/8 khoá theo ĐGĐV, mục 9 nhập tay;
  // mục 6 khoá theo tồn cuối phiếu liền trước, phiếu đầu tiên mới nhập tay).
  const tonDauKhoa = tonDauTuPhieuTruoc?.co_phieu_truoc ? tonDauTuPhieuTruoc : null;
  const tonDauNhap = useWatch({ control, name: 'sl_buong_ton_dau_ngay' });
  const tonDau = tonDauKhoa ? tonDauKhoa.ton_dau : tonDauNhap;
  const soChe = useWatch({ control, name: 'tong_buong_so_che' });
  const tonCuoi = tinhTonCuoiNgay(
    tonDau,
    giaTriTuDgdv.tong_buong_thu_hoach,
    giaTriTuDgdv.tong_buong_khong_so_che,
    soChe
  );

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
              const tuDgdv = laSoLieuRowTuDgdv(def.key);
              const tuGscl = laSoLieuRowTuGscl(def.key);
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
                    {laSoLieuRowTuTinh(def.key) && (
                      <span className="mt-0.5 block text-[11px] text-muted-foreground">
                        {t('baoCaoSoChe.form.tonCuoiTuTinh')}
                      </span>
                    )}
                    {def.key === 'sl_buong_ton_dau_ngay' && tonDauKhoa && (
                      <span className="mt-0.5 block text-[11px] text-muted-foreground">
                        {t('baoCaoSoChe.form.tonDauTuPhieuTruoc', { ngay: formatDateShort(tonDauKhoa.ngay_truoc) })}
                      </span>
                    )}
                    {tuDgdv && (
                      <>
                        <a
                          href={DGDV_BANG_DANH_GIA_URL}
                          target="_blank"
                          rel="noopener noreferrer"
                          title={t('baoCaoSoChe.form.layTuDgdvTitle')}
                          className="mt-0.5 block text-[11px] text-primary hover:underline"
                        >
                          {t('baoCaoSoChe.form.layTuDgdv')}
                        </a>
                        {dgdvLoi && (
                          <span className="mt-0.5 block text-[11px] text-destructive">
                            {t('baoCaoSoChe.form.dgdvLoi')}
                          </span>
                        )}
                      </>
                    )}
                    {tuGscl && (
                      <>
                        <span
                          title={t('baoCaoSoChe.form.layTuGsclTitle')}
                          className="mt-0.5 block text-[11px] text-primary"
                        >
                          {t('baoCaoSoChe.form.layTuGscl')}
                        </span>
                        {qcGscl && qcGscl.ap_dung && (
                          <span
                            className={cn(
                              'mt-0.5 block text-[11px] tabular-nums',
                              qcGscl.ti_le == null ? 'text-amber-600 dark:text-amber-400' : 'text-muted-foreground'
                            )}
                          >
                            {t('baoCaoSoChe.form.daKiemThung', { da: qcGscl.so_thung, toiThieu: qcGscl.toi_thieu })}
                          </span>
                        )}
                        {gsclLoi && (
                          <span className="mt-0.5 block text-[11px] text-destructive">
                            {t('baoCaoSoChe.form.gsclLoi')}
                          </span>
                        )}
                      </>
                    )}
                  </td>
                  <td className={bcscSoLieuTdGiaTri}>
                    {laSoLieuRowTuTinh(def.key) ? (
                      // Ô tự tính: mục 6 + mục 7 − mục 8 − mục 9, không cho nhập tay; vẫn đồng bộ vào form khi lưu.
                      <>
                        <span
                          className={cn(
                            'block w-full rounded-md bg-muted/40 px-2 py-1.5 text-right text-sm font-medium tabular-nums text-foreground',
                            tonCuoi < 0 && 'text-destructive'
                          )}
                        >
                          {formatNumberVN(tonCuoi)}
                        </span>
                        <Controller
                          name={def.key}
                          control={control}
                          render={({ field }) => <DongBoGiaTri value={tonCuoi} onChange={field.onChange} />}
                        />
                      </>
                    ) : def.key === 'sl_buong_ton_dau_ngay' && tonDauKhoa ? (
                      // Ô khoá: tồn cuối của phiếu liền trước, DB trigger ghi đè; vẫn đồng bộ vào form khi lưu.
                      <>
                        <span
                          className={cn(
                            'block w-full rounded-md bg-muted/40 px-2 py-1.5 text-right text-sm font-medium tabular-nums text-foreground',
                            tonDauKhoa.ton_dau < 0 && 'text-destructive'
                          )}
                        >
                          {formatNumberVN(tonDauKhoa.ton_dau)}
                        </span>
                        <Controller
                          name={def.key}
                          control={control}
                          render={({ field }) => (
                            <DongBoGiaTri value={tonDauKhoa.ton_dau} onChange={field.onChange} />
                          )}
                        />
                      </>
                    ) : laSoLieuRowTuDgdv(def.key) ? (
                      // Ô khoá: số do DB ghi đè theo Đánh giá đầu vào, không cho nhập tay.
                      <span className="block w-full rounded-md bg-muted/40 px-2 py-1.5 text-right text-sm font-medium tabular-nums text-foreground">
                        {formatNumberVN(giaTriTuDgdv[def.key])}
                      </span>
                    ) : laSoLieuRowTuGscl(def.key) ? (
                      // Ô khoá: số do DB ghi đè theo Giám sát chất lượng, không cho nhập tay.
                      qcGscl && qcGscl.ti_le == null ? (
                        <span className="block w-full rounded-md bg-amber-50 px-2 py-1.5 text-right text-xs font-medium text-amber-700 dark:bg-amber-500/10 dark:text-amber-400">
                          {t('baoCaoSoChe.form.chuaDatKiemTra')}
                        </span>
                      ) : (
                        <span className="block w-full rounded-md bg-muted/40 px-2 py-1.5 text-right text-sm font-medium tabular-nums text-foreground">
                          {formatNumberVN(qcGscl?.ti_le ?? null)}
                        </span>
                      )
                    ) : (
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
                    )}
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
