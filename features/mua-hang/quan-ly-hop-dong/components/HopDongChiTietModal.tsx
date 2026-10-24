import React, { useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useForm, Controller, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';
import Input from '../../../../components/ui/Input';
import Textarea from '../../../../components/ui/Textarea';
import Combobox from '../../../../components/ui/Combobox';
import Button from '../../../../components/ui/Button';
import { hopDongChiTietLineSchema, type HopDongChiTietLineValues } from '../core/schema';
import type { HopDongChiTiet } from '../core/types';
import type { Branch } from '../../../he-thong/chi-nhanh/core/types';
import { LOAI_DOT } from '../core/constants';
import { tongHopCoc, truCocVuotConLai } from '../core/tinh-tien-dot';
import { TRANG_THAI } from '../../../../lib/constants';
import { getTodayISO } from '../../../../lib/utils';
import DotThanhToanFields from './DotThanhToanFields';

interface Props {
  open: boolean;
  onClose: () => void;
  initial?: HopDongChiTiet | null;
  chiNhanhList: Branch[];
  /** Đơn giá HĐ — tính giá trị hàng theo số cây */
  donGia: number | null;
  /** Các đợt hiện có của HĐ — tính cọc còn lại + loại đợt mặc định */
  chiTiet: HopDongChiTiet[];
  onSubmit: (values: HopDongChiTietLineValues) => void;
  isLoading?: boolean;
}

/** HĐ chưa có đợt nào → mặc định đợt cọc (0 cây), ngược lại thanh toán theo cây. */
const emptyValues = (coDotTruoc: boolean): Partial<HopDongChiTietLineValues> => ({
  ngay: getTodayISO(),
  ten_dot: '',
  loai_dot: coDotTruoc ? LOAI_DOT.THANH_TOAN : LOAI_DOT.COC,
  so_tien: undefined,
  so_cay_thuc_nhan: coDotTruoc ? undefined : 0,
  tien_tru_coc: 0,
  ghi_chu: '',
  id_chi_nhanh: '',
});

function toFormValues(
  ct: HopDongChiTiet | null | undefined,
  coDotTruoc: boolean
): Partial<HopDongChiTietLineValues> {
  if (!ct) return emptyValues(coDotTruoc);
  return {
    ngay: ct.ngay ?? '',
    ten_dot: ct.ten_dot ?? '',
    loai_dot: ct.loai_dot,
    so_tien: ct.so_tien ?? undefined,
    so_cay_thuc_nhan: ct.so_cay_thuc_nhan ?? undefined,
    tien_tru_coc: ct.tien_tru_coc ?? 0,
    ghi_chu: ct.ghi_chu ?? '',
    id_chi_nhanh: ct.id_chi_nhanh ?? '',
  };
}

const HopDongChiTietModal: React.FC<Props> = ({
  open,
  onClose,
  initial,
  chiNhanhList,
  donGia,
  chiTiet,
  onSubmit,
  isLoading,
}) => {
  const { t } = useTranslation();
  const form = useForm<HopDongChiTietLineValues>({
    resolver: zodResolver(hopDongChiTietLineSchema),
    defaultValues: emptyValues(false),
  });
  const {
    register,
    control,
    handleSubmit,
    reset,
    setError,
    formState: { errors },
  } = form;

  const coDotTruoc = chiTiet.length > 0;
  useEffect(() => {
    if (open) reset(toFormValues(initial ?? null, coDotTruoc));
    // eslint-disable-next-line react-hooks/exhaustive-deps -- chỉ nạp lại khi mở / đổi dòng, không khi danh sách đợt refetch
  }, [open, initial, reset]);

  const { cocConLai } = useMemo(() => tongHopCoc(chiTiet, initial?.id), [chiTiet, initial?.id]);

  const submit = (v: HopDongChiTietLineValues) => {
    if (truCocVuotConLai(v.loai_dot, v.tien_tru_coc, cocConLai)) {
      setError('tien_tru_coc', { message: t('hopDong.validation.ctTruCocVuot') });
      return;
    }
    onSubmit(v);
  };

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
            <FormProvider {...form}>
              <form
                onSubmit={handleSubmit(submit)}
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
                <DotThanhToanFields donGia={donGia} cocConLai={cocConLai} />
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
            </FormProvider>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default HopDongChiTietModal;
