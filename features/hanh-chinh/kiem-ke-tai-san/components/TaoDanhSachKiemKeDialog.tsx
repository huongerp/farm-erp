/**
 * Popup chọn phạm vi (chi nhánh, vị trí, người giữ) trước khi tạo danh sách kiểm kê.
 */
import React, { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { List, X } from 'lucide-react';
import Button from '../../../../components/ui/Button';
import MultiSelect from '../../../../components/ui/MultiSelect';
import { cn } from '../../../../lib/utils';
import { useBranches } from '../../../he-thong/chi-nhanh/hooks/use-chi-nhanh';
import { useAssetStorageLocations } from '../../thiet-lap-tai-san/hooks/use-noi-luu';
import { useEmployees } from '@/features/he-thong/nhan-vien/hooks/use-nhan-vien';
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
  const { data: employees = [] } = useEmployees();

  const branchOptions = branches
    .filter((b) => b.trang_thai === 1)
    .map((b) => ({ label: b.ten_chi_nhanh, value: b.id, subLabel: b.ma_chi_nhanh }));
  const locationOptions = locations
    .filter((l) => l.trang_thai === 1)
    .map((l) => ({ label: l.ten_noi_luu, value: l.id, subLabel: l.ten_chi_nhanh }));
  const employeeOptions = employees.map((e) => ({
    label: e.ho_ten,
    value: e.id,
    subLabel: e.ma_nhan_vien,
  }));

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
            />
            <MultiSelect
              label={t('kiemKeTaiSan.taoDanhSachDialog.viTri')}
              options={locationOptions}
              value={id_noi_luu}
              onChange={setIdNoiLuu}
              placeholder={t('kiemKeTaiSan.taoDanhSachDialog.viTriPlaceholder')}
            />
            <MultiSelect
              label={t('kiemKeTaiSan.taoDanhSachDialog.nguoiGiu')}
              options={employeeOptions}
              value={id_nguoi_giu}
              onChange={setIdNguoiGiu}
              placeholder={t('kiemKeTaiSan.taoDanhSachDialog.nguoiGiuPlaceholder')}
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
