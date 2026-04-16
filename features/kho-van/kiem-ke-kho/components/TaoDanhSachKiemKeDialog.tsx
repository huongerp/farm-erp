/**
 * Dialog chọn phạm vi (kho, danh mục, hàng hóa) trước khi tạo danh sách kiểm kê kho.
 */
import React, { useState, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { List, X } from 'lucide-react';
import Button from '../../../../components/ui/Button';
import MultiSelect from '../../../../components/ui/MultiSelect';
import { cn } from '../../../../lib/utils';
import { TRANG_THAI_HOAT_DONG } from '../../../../lib/constants';
import { getAllDanhMucHangHoa } from '../../danh-muc-hang-hoa/services/danh-muc-hang-hoa-service';
import { useQuery } from '@tanstack/react-query';
import { useHangHoaRefQuery } from '../../../../lib/hooks/use-supabase-ref-queries';
import { useKhoList } from '../../danh-sach-kho/hooks/use-kho';
import type { TaoDanhSachKiemKeKhoFilters } from '../services/kiem-ke-kho-service';

interface Props {
  open: boolean;
  onClose: () => void;
  /** (id_dot_kiem_ke_kho, filters) — luôn truyền id đợt khi xác nhận để tránh state cũ. */
  onConfirm: (id_dot_kiem_ke_kho: string, filters: TaoDanhSachKiemKeKhoFilters | undefined) => void;
  isLoading?: boolean;
  /** Id đợt kiểm kê đang mở (bắt buộc khi tạo danh sách). */
  dotId: string | null;
  /** Kho thuộc đợt (để chọn phạm vi). Để trống = tất cả kho. */
  idKhoOfDot?: string[];
}

const TaoDanhSachKiemKeDialog: React.FC<Props> = ({
  open,
  onClose,
  onConfirm,
  isLoading = false,
  dotId,
  idKhoOfDot = [],
}) => {
  const { t } = useTranslation();
  const [id_kho, setIdKho] = useState<string[]>([]);
  const [id_danh_muc, setIdDanhMuc] = useState<string[]>([]);
  const [id_hang_hoa, setIdHangHoa] = useState<string[]>([]);

  const { data: khoList = [] } = useKhoList();
  const { data: hangHoaList = [] } = useHangHoaRefQuery();
  const { data: danhMucList = [] } = useQuery({
    queryKey: ['danhMucHangHoa'],
    queryFn: getAllDanhMucHangHoa,
    enabled: open,
  });

  const khoOptions = useMemo(() => {
    const ids = idKhoOfDot.length > 0 ? idKhoOfDot : khoList.map((k) => k.id);
    return khoList
      .filter((k) => ids.includes(k.id) && k.trang_thai === TRANG_THAI_HOAT_DONG.DANG_HOAT_DONG)
      .map((k) => ({ label: k.ten_kho, value: k.id, subLabel: k.ma_kho }));
  }, [khoList, idKhoOfDot]);

  const hangHoaOptions = hangHoaList
    .filter((h) => h.trang_thai === TRANG_THAI_HOAT_DONG.DANG_HOAT_DONG)
    .map((h) => ({ label: h.ten_hang ?? h.ten_hang_hoa, value: h.id, subLabel: h.ma_hang ?? h.ma_hang_hoa }));
  const danhMucOptions = danhMucList
    .filter((d) => d.trang_thai === TRANG_THAI_HOAT_DONG.DANG_HOAT_DONG)
    .map((d) => ({ label: d.ten_danh_muc, value: d.id, subLabel: d.ma_danh_muc }));

  const handleConfirm = useCallback(() => {
    if (!dotId) return;
    const hasAny = id_kho.length > 0 || id_danh_muc.length > 0 || id_hang_hoa.length > 0;
    const filters: TaoDanhSachKiemKeKhoFilters | undefined = hasAny
      ? {
          ...(id_kho.length > 0 && { id_kho }),
          ...(id_danh_muc.length > 0 && { id_danh_muc }),
          ...(id_hang_hoa.length > 0 && { id_hang_hoa }),
        }
      : undefined;
    onConfirm(dotId, filters);
  }, [dotId, id_kho, id_danh_muc, id_hang_hoa, onConfirm]);

  const handleClose = useCallback(() => {
    if (isLoading) return;
    setIdKho([]);
    setIdDanhMuc([]);
    setIdHangHoa([]);
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
            {khoOptions.length > 0 && (
              <MultiSelect
                label={t('kiemKeKho.taoDanhSachDialog.kho')}
                options={khoOptions}
                value={id_kho}
                onChange={setIdKho}
                placeholder={t('kiemKeKho.taoDanhSachDialog.khoPlaceholder')}
              />
            )}
            <MultiSelect
              label={t('kiemKeKho.taoDanhSachDialog.danhMuc')}
              options={danhMucOptions}
              value={id_danh_muc}
              onChange={setIdDanhMuc}
              placeholder={t('kiemKeKho.taoDanhSachDialog.danhMucPlaceholder')}
            />
            <MultiSelect
              label={t('kiemKeKho.taoDanhSachDialog.hangHoa')}
              options={hangHoaOptions}
              value={id_hang_hoa}
              onChange={setIdHangHoa}
              placeholder={t('kiemKeKho.taoDanhSachDialog.hangHoaPlaceholder')}
            />
          </div>

          <div className="flex items-center justify-end gap-3 px-5 py-4 border-t border-border shrink-0">
            <Button variant="outline" onClick={handleClose} disabled={isLoading}>
              {t('common.cancel')}
            </Button>
            <Button
              onClick={handleConfirm}
              disabled={!dotId}
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
