/**
 * Dialog chọn phạm vi (hàng hóa, danh mục) trước khi tạo danh sách kiểm kê kho.
 */
import React, { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { List, X } from 'lucide-react';
import Button from '../../../../components/ui/Button';
import MultiSelect from '../../../../components/ui/MultiSelect';
import { cn } from '../../../../lib/utils';
import { getAllHangHoa } from '../../features/kho-van/danh-sach-hang-hoa/services/hang-hoa-service';
import { HANG_HOA_QUERY_KEY } from '../../features/kho-van/danh-sach-hang-hoa/hooks/use-hang-hoa';
import { getAllDanhMucHangHoa } from '../../features/kho-van/danh-muc-hang-hoa/services/danh-muc-hang-hoa-service';
import { useQuery } from '@tanstack/react-query';
import type { TaoDanhSachKiemKeKhoFilters } from '../services/kiem-ke-kho-service';

interface Props {
  open: boolean;
  onClose: () => void;
  onConfirm: (filters: TaoDanhSachKiemKeKhoFilters | undefined) => void;
  isLoading?: boolean;
}

const TaoDanhSachKiemKeDialog: React.FC<Props> = ({
  open,
  onClose,
  onConfirm,
  isLoading = false,
}) => {
  const { t } = useTranslation();
  const [id_hang_hoa, setIdHangHoa] = useState<string[]>([]);
  const [id_danh_muc, setIdDanhMuc] = useState<string[]>([]);

  const { data: hangHoaList = [] } = useQuery({
    queryKey: HANG_HOA_QUERY_KEY,
    queryFn: getAllHangHoa,
    enabled: open,
  });
  const { data: danhMucList = [] } = useQuery({
    queryKey: ['danhMucHangHoa'],
    queryFn: getAllDanhMucHangHoa,
    enabled: open,
  });

  const hangHoaOptions = hangHoaList
    .filter((h) => h.trang_thai === 1)
    .map((h) => ({ label: h.ten_hang, value: h.id, subLabel: h.ma_hang }));
  const danhMucOptions = danhMucList
    .filter((d) => d.trang_thai === 1)
    .map((d) => ({ label: d.ten_danh_muc, value: d.id, subLabel: d.ma_danh_muc }));

  const handleConfirm = useCallback(() => {
    const hasAny = id_hang_hoa.length > 0 || id_danh_muc.length > 0;
    const filters: TaoDanhSachKiemKeKhoFilters | undefined = hasAny
      ? {
          ...(id_hang_hoa.length > 0 && { id_hang_hoa }),
          ...(id_danh_muc.length > 0 && { id_danh_muc }),
        }
      : undefined;
    onConfirm(filters);
  }, [id_hang_hoa, id_danh_muc, onConfirm]);

  const handleClose = useCallback(() => {
    if (isLoading) return;
    setIdHangHoa([]);
    setIdDanhMuc([]);
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
                  {t('kiemKeKho.taoDanhSachDialog.title')}
                </h3>
                <p className="text-xs text-muted-foreground">
                  {t('kiemKeKho.taoDanhSachDialog.hint')}
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
              label={t('kiemKeKho.taoDanhSachDialog.hangHoa')}
              options={hangHoaOptions}
              value={id_hang_hoa}
              onChange={setIdHangHoa}
              placeholder={t('kiemKeKho.taoDanhSachDialog.hangHoaPlaceholder')}
            />
            <MultiSelect
              label={t('kiemKeKho.taoDanhSachDialog.danhMuc')}
              options={danhMucOptions}
              value={id_danh_muc}
              onChange={setIdDanhMuc}
              placeholder={t('kiemKeKho.taoDanhSachDialog.danhMucPlaceholder')}
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
              {t('kiemKeKho.taoDanhSachDialog.confirm')}
            </Button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default TaoDanhSachKiemKeDialog;
