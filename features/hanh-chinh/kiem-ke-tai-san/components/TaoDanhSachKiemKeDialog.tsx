/**
 * Popup chọn phạm vi (chi nhánh, nơi lưu, người giữ) trước khi tạo danh sách kiểm kê.
 * Chỉ lọc thêm trong phạm vi đợt; để trống = lấy tất cả theo phạm vi đợt.
 */
import React, { useState, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { List, X } from 'lucide-react';
import Button from '../../../../components/ui/Button';
import MultiSelect from '../../../../components/ui/MultiSelect';
import { cn } from '../../../../lib/utils';
import { TRANG_THAI, TRANG_THAI_HOAT_DONG } from '../../../../lib/constants';
import { useBranches } from '../../../he-thong/chi-nhanh/hooks/use-chi-nhanh';
import { useAssetStorageLocations } from '../../thiet-lap-tai-san/hooks/use-noi-luu';
import { useEmployeesRefQuery } from '@/lib/hooks/use-supabase-ref-queries';
import type { TaoDanhSachKiemKeFilters } from '../services/kiem-ke-tai-san-service';

interface Props {
  open: boolean;
  onClose: () => void;
  onConfirm: (filters: TaoDanhSachKiemKeFilters | undefined) => void;
  isLoading?: boolean;
}

const TaoDanhSachKiemKeDialog: React.FC<Props> = ({
  open,
  onClose,
  onConfirm,
  isLoading = false,
}) => {
  const { t } = useTranslation();
  const [id_chi_nhanh, setIdChiNhanh] = useState<string[]>([]);
  const [id_noi_luu, setIdNoiLuu] = useState<string[]>([]);
  const [id_nguoi_giu, setIdNguoiGiu] = useState<string[]>([]);

  const { data: branches = [] } = useBranches();
  const { data: locations = [] } = useAssetStorageLocations();
  const { data: employees = [] } = useEmployeesRefQuery();

  const branchOptions = useMemo(
    () =>
      branches
        .filter((b) => b.trang_thai === TRANG_THAI.DANG_DUNG)
        .map((b) => {
          const label = [b.ma_chi_nhanh, b.ten_chi_nhanh].filter(Boolean).join(' – ') || b.id;
          return { label, value: b.id };
        }),
    [branches]
  );
  const locationOptions = useMemo(
    () =>
      locations
        .filter((l) => l.trang_thai === TRANG_THAI_HOAT_DONG.DANG_HOAT_DONG)
        .map((l) => {
          const label = [l.ma_noi_luu, l.ten_noi_luu].filter(Boolean).join(' – ') || l.id;
          return { label, value: l.id };
        }),
    [locations]
  );
  const employeeOptions = useMemo(
    () =>
      employees.map((e) => {
        const label = [e.ma_nhan_vien, e.ho_ten].filter(Boolean).join(' – ') || e.id;
        return { label, value: e.id };
      }),
    [employees]
  );

  const handleConfirm = useCallback(() => {
    const hasAny =
      id_chi_nhanh.length > 0 || id_noi_luu.length > 0 || id_nguoi_giu.length > 0;
    const filters: TaoDanhSachKiemKeFilters | undefined = hasAny
      ? {
          ...(id_chi_nhanh.length > 0 && { id_chi_nhanh }),
          ...(id_noi_luu.length > 0 && { id_noi_luu }),
          ...(id_nguoi_giu.length > 0 && { id_nguoi_giu }),
        }
      : undefined;
    onConfirm(filters);
  }, [id_chi_nhanh, id_noi_luu, id_nguoi_giu, onConfirm]);

  const handleClose = useCallback(() => {
    if (isLoading) return;
    setIdChiNhanh([]);
    setIdNoiLuu([]);
    setIdNguoiGiu([]);
    onClose();
  }, [isLoading, onClose]);

  if (!open) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={handleClose}
        className="fixed inset-0 z-[60] bg-black/20 backdrop-blur-md"
      />
      <div className="fixed inset-0 z-[61] flex items-center justify-center p-4 pointer-events-none">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          onClick={(e) => e.stopPropagation()}
          className={cn(
            'w-full min-w-[min(100%,28rem)] max-w-3xl bg-card rounded-2xl shadow-2xl border border-border pointer-events-auto flex flex-col',
            'max-h-[90vh] min-h-[24rem]'
          )}
        >
          <div className="flex items-center justify-between px-5 py-4 border-b border-border shrink-0">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-primary/10 text-primary">
                <List size={18} />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-foreground">
                  {t('kiemKeTaiSan.taoDanhSachDialog.title')}
                </h3>
                <p className="text-xs text-muted-foreground">
                  {t('kiemKeTaiSan.taoDanhSachDialog.hint')}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleClose}
              disabled={isLoading}
              className="p-2 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-all disabled:opacity-50"
            >
              <X size={18} />
            </button>
          </div>

          <div className="flex-1 min-h-[320px] overflow-visible p-5 space-y-5">
            <MultiSelect
              label={t('kiemKeTaiSan.taoDanhSachDialog.chiNhanh')}
              options={branchOptions}
              value={id_chi_nhanh}
              onChange={setIdChiNhanh}
              placeholder={t('kiemKeTaiSan.taoDanhSachDialog.chiNhanhPlaceholder')}
              labelAbove
            />
            <MultiSelect
              label={t('kiemKeTaiSan.taoDanhSachDialog.viTri')}
              options={locationOptions}
              value={id_noi_luu}
              onChange={setIdNoiLuu}
              placeholder={t('kiemKeTaiSan.taoDanhSachDialog.viTriPlaceholder')}
              labelAbove
            />
            <MultiSelect
              label={t('kiemKeTaiSan.taoDanhSachDialog.nguoiGiu')}
              options={employeeOptions}
              value={id_nguoi_giu}
              onChange={setIdNguoiGiu}
              placeholder={t('kiemKeTaiSan.taoDanhSachDialog.nguoiGiuPlaceholder')}
              labelAbove
            />
          </div>

          <div className="flex items-center justify-end gap-3 px-5 py-4 border-t border-border shrink-0">
            <Button variant="outline" onClick={handleClose} disabled={isLoading}>
              {t('common.cancel')}
            </Button>
            <Button
              onClick={handleConfirm}
              isLoading={isLoading}
              className="bg-primary text-white"
            >
              {t('kiemKeTaiSan.taoDanhSachDialog.confirm')}
            </Button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default TaoDanhSachKiemKeDialog;
