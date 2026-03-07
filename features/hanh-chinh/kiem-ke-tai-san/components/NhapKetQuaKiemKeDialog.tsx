/**
 * Dialog nhập kết quả kiểm cho một dòng chi tiết: nơi lưu thực tế, người giữ thực tế, trạng thái thực tế, ghi chú.
 */
import React, { useState, useCallback, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { ClipboardCheck, X } from 'lucide-react';
import Button from '../../../../components/ui/Button';
import Combobox from '../../../../components/ui/Combobox';
import Textarea from '../../../../components/ui/Textarea';
import { cn } from '../../../../lib/utils';
import { useAssetStorageLocations } from '../../thiet-lap-tai-san/hooks/use-noi-luu';
import { useAssetStatuses } from '../../thiet-lap-tai-san/hooks/use-trang-thai';
import { useEmployees } from '@/features/he-thong/nhan-vien/hooks/use-nhan-vien';
import type { ChiTietKiemKe, ChiTietKiemKeUpdate } from '../core/types';

interface Props {
  open: boolean;
  row: ChiTietKiemKe | null;
  onClose: () => void;
  onSave: (data: ChiTietKiemKeUpdate) => void;
  isLoading?: boolean;
}

const NhapKetQuaKiemKeDialog: React.FC<Props> = ({
  open,
  row,
  onClose,
  onSave,
  isLoading = false,
}) => {
  const { t } = useTranslation();
  const [id_noi_luu_thuc_te, setIdNoiLuuThucTe] = useState<string>('');
  const [id_nguoi_giu_thuc_te, setIdNguoiGiuThucTe] = useState<string>('');
  const [id_trang_thai_thuc_te, setIdTrangThaiThucTe] = useState<string>('');
  const [ghi_chu_dong, setGhiChuDong] = useState<string>('');

  const { data: locations = [] } = useAssetStorageLocations();
  const { data: statuses = [] } = useAssetStatuses();
  const { data: employees = [] } = useEmployees();

  const locationOptions = locations
    .filter((l) => l.trang_thai === 1)
    .map((l) => ({ label: l.ten_noi_luu, value: l.id, subLabel: l.ma_noi_luu }));
  const statusOptions = statuses
    .filter((s) => s.trang_thai === 1)
    .map((s) => ({ label: s.ten, value: s.id, subLabel: s.ma }));
  const employeeOptions = employees.map((e) => ({
    label: e.ho_ten,
    value: e.id,
    subLabel: e.ma_nhan_vien,
  }));

  /** Pre-fill: ưu tiên thực tế đã nhập, chưa có thì lấy từ sổ để chỉnh nhanh */
  useEffect(() => {
    if (open && row) {
      setIdNoiLuuThucTe(row.id_noi_luu_thuc_te ?? row.id_noi_luu_so ?? '');
      setIdNguoiGiuThucTe(row.id_nguoi_giu_thuc_te ?? row.id_nguoi_giu_so ?? '');
      setIdTrangThaiThucTe(row.id_trang_thai_thuc_te ?? row.id_trang_thai_so ?? '');
      setGhiChuDong(row.ghi_chu_dong ?? '');
    }
  }, [open, row]);

  const handleGiongSo = useCallback(() => {
    if (!row) return;
    setIdNoiLuuThucTe(row.id_noi_luu_so ?? '');
    setIdNguoiGiuThucTe(row.id_nguoi_giu_so ?? '');
    setIdTrangThaiThucTe(row.id_trang_thai_so ?? '');
  }, [row]);

  const handleSave = useCallback(() => {
    onSave({
      id_noi_luu_thuc_te: id_noi_luu_thuc_te || null,
      id_nguoi_giu_thuc_te: id_nguoi_giu_thuc_te || null,
      id_trang_thai_thuc_te: id_trang_thai_thuc_te || null,
      ghi_chu_dong: ghi_chu_dong.trim() || null,
    });
  }, [id_noi_luu_thuc_te, id_nguoi_giu_thuc_te, id_trang_thai_thuc_te, ghi_chu_dong, onSave]);

  const handleClose = useCallback(() => {
    if (isLoading) return;
    onClose();
  }, [isLoading, onClose]);

  if (!open) return null;

  const taiSanLabel = row ? (row.ten_tai_san || row.ma_tai_san || '—') : '';

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
            'w-full min-w-[min(100%,28rem)] max-w-lg bg-card rounded-2xl shadow-2xl border border-border pointer-events-auto flex flex-col',
            'max-h-[90vh] min-h-[20rem] overflow-visible'
          )}
        >
          <div className="flex items-center justify-between px-5 py-4 border-b border-border shrink-0">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-primary/10 text-primary">
                <ClipboardCheck size={18} />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-foreground">
                  {t('kiemKeTaiSan.nhapKetQua.title')}
                </h3>
                {taiSanLabel && (
                  <p className="text-xs text-muted-foreground truncate max-w-[240px]" title={taiSanLabel}>
                    {taiSanLabel}
                  </p>
                )}
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

          <div className="flex-1 overflow-visible p-5 space-y-4">
            <Combobox
              label={t('kiemKeTaiSan.nhapKetQua.noiLuuThucTe')}
              options={locationOptions}
              value={id_noi_luu_thuc_te || null}
              onChange={(v) => setIdNoiLuuThucTe(v ? String(v) : '')}
              placeholder={t('kiemKeTaiSan.nhapKetQua.placeholderNoiLuu')}
            />
            <Combobox
              label={t('kiemKeTaiSan.nhapKetQua.nguoiGiuThucTe')}
              options={employeeOptions}
              value={id_nguoi_giu_thuc_te || null}
              onChange={(v) => setIdNguoiGiuThucTe(v ? String(v) : '')}
              placeholder={t('kiemKeTaiSan.nhapKetQua.placeholderNguoiGiu')}
            />
            <Combobox
              label={t('kiemKeTaiSan.nhapKetQua.trangThaiThucTe')}
              options={statusOptions}
              value={id_trang_thai_thuc_te || null}
              onChange={(v) => setIdTrangThaiThucTe(v ? String(v) : '')}
              placeholder={t('kiemKeTaiSan.nhapKetQua.placeholderTrangThai')}
            />
            <Textarea
              label={t('kiemKeTaiSan.nhapKetQua.ghiChuDong')}
              value={ghi_chu_dong}
              onChange={(e) => setGhiChuDong(e.target.value)}
              rows={2}
              className="resize-none"
            />
            {row && (
              <Button
                type="button"
                variant="outline"
                className="w-full border-dashed border-primary/50 text-primary hover:bg-primary/5"
                onClick={handleGiongSo}
                disabled={isLoading}
              >
                {t('kiemKeTaiSan.nhapKetQua.giongSo')}
              </Button>
            )}
          </div>

          <div className="flex items-center justify-end gap-3 px-5 py-4 border-t border-border shrink-0">
            <Button variant="outline" onClick={handleClose} disabled={isLoading}>
              {t('common.cancel')}
            </Button>
            <Button
              onClick={handleSave}
              isLoading={isLoading}
              className="bg-primary text-white"
            >
              {t('kiemKeTaiSan.nhapKetQua.save')}
            </Button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default NhapKetQuaKiemKeDialog;
