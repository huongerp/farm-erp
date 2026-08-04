import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';
import Input from '../../../../components/ui/Input';
import Textarea from '../../../../components/ui/Textarea';
import Combobox from '../../../../components/ui/Combobox';
import CurrencyInput from '../../../../components/ui/CurrencyInput';
import Button from '../../../../components/ui/Button';
import { hopDongChiTietLineSchema, type HopDongChiTietLineValues } from '../core/schema';
import type { HopDongChiTiet } from '../core/types';
import type { Branch } from '../../../he-thong/chi-nhanh/core/types';
import { TRANG_THAI } from '../../../../lib/constants';
import { getTodayISO } from '../../../../lib/utils';

interface Props {
  open: boolean;
  onClose: () => void;
  initial?: HopDongChiTiet | null;
  chiNhanhList: Branch[];
  onSubmit: (values: HopDongChiTietLineValues) => void;
  isLoading?: boolean;
}

const emptyValues = (): Partial<HopDongChiTietLineValues> => ({
  ngay: getTodayISO(),
  ten_dot: '',
  so_tien: undefined,
  so_cay_thuc_nhan: undefined,
  ghi_chu: '',
  id_chi_nhanh: '',
});

function toFormValues(ct: HopDongChiTiet | null | undefined): Partial<HopDongChiTietLineValues> {
  if (!ct) return emptyValues();
  return {
    ngay: ct.ngay ?? '',
    ten_dot: ct.ten_dot ?? '',
    so_tien: ct.so_tien ?? undefined,
    so_cay_thuc_nhan: ct.so_cay_thuc_nhan ?? undefined,
    ghi_chu: ct.ghi_chu ?? '',
    id_chi_nhanh: ct.id_chi_nhanh ?? '',
  };
}

const HopDongChiTietModal: React.FC<Props> = ({
  open,
  onClose,
  initial,
  chiNhanhList,
  onSubmit,
  isLoading,
}) => {
  const { t } = useTranslation();
  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<HopDongChiTietLineValues>({
    resolver: zodResolver(hopDongChiTietLineSchema) as any,
    defaultValues: emptyValues(),
  });

  useEffect(() => {
    if (open) reset(toFormValues(initial ?? null));
  }, [open, initial, reset]);

  const chiNhanhOptions = chiNhanhList
    .filter((b) => b.trang_thai === TRANG_THAI.DANG_DUNG)
    .map((b) => ({ value: b.id, label: b.ten_chi_nhanh }));

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.96, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.96, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="bg-card rounded-2xl border border-border shadow-2xl max-w-lg w-full overflow-hidden max-h-[90dvh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-5 pt-4 pb-3 border-b border-border bg-muted/30 shrink-0">
              <div className="flex items-center justify-between gap-3">
                <h3 className="text-lg font-semibold text-foreground">
                  {initial?.id ? t('hopDong.chiTiet.editTitle') : t('hopDong.chiTiet.addTitle')}
                </h3>
                <button
                  type="button"
                  onClick={onClose}
                  className="p-2 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                  aria-label={t('common.close')}
                >
                  <X size={18} />
                </button>
              </div>
            </div>
            <form
              onSubmit={handleSubmit((v) => onSubmit(v))}
              className="px-5 py-4 space-y-3 overflow-y-auto flex-1 min-h-0"
            >
              <Input
                label={t('hopDong.form.ctNgay')}
                type="date"
                required
                error={errors.ngay?.message}
                {...register('ngay')}
              />
              <Input
                label={t('hopDong.form.ctTenDot')}
                required
                error={errors.ten_dot?.message}
                {...register('ten_dot')}
              />
              <Controller
                name="so_tien"
                control={control}
                render={({ field }) => (
                  <CurrencyInput
                    label={t('hopDong.form.ctSoTien')}
                    suffix={t('hopDong.form.suffixDong')}
                    required
                    value={field.value ?? ''}
                    onChange={(v) => field.onChange(v)}
                    error={errors.so_tien?.message as string | undefined}
                  />
                )}
              />
              <Controller
                name="so_cay_thuc_nhan"
                control={control}
                render={({ field }) => (
                  <CurrencyInput
                    label={t('hopDong.form.ctSoCay')}
                    suffix={t('hopDong.form.suffixCay')}
                    required
                    value={field.value ?? ''}
                    onChange={(v) => field.onChange(v)}
                    error={errors.so_cay_thuc_nhan?.message as string | undefined}
                  />
                )}
              />
              <Controller
                name="id_chi_nhanh"
                control={control}
                render={({ field }) => (
                  <Combobox
                    label={t('hopDong.form.ctChiNhanh')}
                    placeholder={t('hopDong.form.ctChiNhanhPlaceholder')}
                    options={chiNhanhOptions}
                    value={field.value ?? ''}
                    onChange={field.onChange}
                    error={errors.id_chi_nhanh?.message}
                    required
                  />
                )}
              />
              <Textarea label={t('hopDong.form.ctGhiChu')} rows={2} {...register('ghi_chu')} />
              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="ghost" onClick={onClose} className="border border-border">
                  {t('common.cancel')}
                </Button>
                <Button type="submit" disabled={isLoading} className="bg-primary text-white">
                  {t('common.save')}
                </Button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default HopDongChiTietModal;
