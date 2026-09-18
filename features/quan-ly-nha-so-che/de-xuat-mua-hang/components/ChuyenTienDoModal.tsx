import React, { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, Package, X } from 'lucide-react';
import Button from '../../../../components/ui/Button';
import Combobox from '../../../../components/ui/Combobox';
import Input from '../../../../components/ui/Input';
import Textarea from '../../../../components/ui/Textarea';
import { BTN_CANCEL } from '../../../../lib/button-labels';
import { useFarmTienDoMuaHangList } from '../../thiet-lap-de-xuat-mua-hang/hooks/use-farm-tien-do-mua-hang';
import { TRANG_THAI_HOAT_DONG } from '../../../../lib/constants';

export interface ChuyenTienDoResult {
  id_tien_do_mh: string;
  ten_tien_do_mh: string;
  ghi_chu: string;
  /** Ngày cần mới của phiếu; null = giữ nguyên ngày cần hiện tại. */
  ngay_can: string | null;
}

interface Props {
  open: boolean;
  selectedCount: number;
  /** Ngày cần hiện tại của các dòng đã chọn (chỉ khi mọi dòng cùng một ngày). */
  defaultNgayCan?: string | null;
  onClose: () => void;
  onConfirm: (result: ChuyenTienDoResult) => void;
}

const ChuyenTienDoModal: React.FC<Props> = ({ open, selectedCount, defaultNgayCan, onClose, onConfirm }) => {
  const { t } = useTranslation();
  const { data: tienDoMuaHangList = [] } = useFarmTienDoMuaHangList();
  const [idTienDo, setIdTienDo] = useState<string | null>(null);
  const [ghiChu, setGhiChu] = useState('');
  const [ngayCan, setNgayCan] = useState('');

  const options = useMemo(
    () =>
      tienDoMuaHangList
        .filter((x) => x.trang_thai === TRANG_THAI_HOAT_DONG.DANG_HOAT_DONG)
        .sort((a, b) => a.thu_tu - b.thu_tu)
        .map((x) => ({ value: x.id, label: x.ten })),
    [tienDoMuaHangList]
  );

  useEffect(() => {
    if (open) {
      setIdTienDo(options[0]?.value ?? null);
      setGhiChu('');
      setNgayCan(defaultNgayCan ?? '');
    }
  }, [open, options, defaultNgayCan]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const item = tienDoMuaHangList.find((x) => x.id === idTienDo);
    if (!item) return;
    const ngayCanTrimmed = ngayCan.trim();
    onConfirm({
      id_tien_do_mh: item.id,
      ten_tien_do_mh: item.ten,
      ghi_chu: ghiChu.trim(),
      ngay_can: ngayCanTrimmed && ngayCanTrimmed !== (defaultNgayCan ?? '') ? ngayCanTrimmed : null,
    });
    onClose();
  };

  if (!open) return null;

  return (
    <AnimatePresence>
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
          className="bg-card rounded-2xl border border-border shadow-2xl max-w-md w-full overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="px-6 pt-5 pb-4 border-b border-border bg-muted/30 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                <Package size={18} />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-foreground">
                  {t('deXuatMuaHang.chiTietTab.chuyenTienDoTitle')}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {t('deXuatMuaHang.chiTietTab.chuyenTienDoSubtitle', { count: selectedCount })}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
              aria-label={t('common.close')}
            >
              <X size={18} />
            </button>
          </div>
          <form onSubmit={handleSubmit} className="px-6 py-4 space-y-4">
            <Combobox
              label={t('deXuatMuaHang.form.tienDoMh')}
              options={options}
              value={idTienDo}
              onChange={(v) => setIdTienDo(v ?? null)}
              placeholder={t('deXuatMuaHang.form.tienDoMhPlaceholder')}
              searchable
              required
            />
            <div>
              <Input
                label={t('deXuatMuaHang.form.requiredDate')}
                type="date"
                icon={<Calendar size={12} />}
                value={ngayCan}
                onChange={(e) => setNgayCan(e.target.value)}
              />
              <p className="text-xs text-muted-foreground mt-1">
                {t('deXuatMuaHang.chiTietTab.ngayCanHint')}
              </p>
            </div>
            <Textarea
              label={t('deXuatMuaHang.chiTietTab.traoDoiLabel')}
              placeholder={t('deXuatMuaHang.chiTietTab.traoDoiPlaceholder')}
              value={ghiChu}
              onChange={(e) => setGhiChu(e.target.value)}
              rows={3}
            />
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="ghost" onClick={onClose} className="border border-border">
                {BTN_CANCEL()}
              </Button>
              <Button type="submit" className="bg-primary text-white" disabled={!idTienDo}>
                {t('deXuatMuaHang.chiTietTab.chuyenTienDoConfirm')}
              </Button>
            </div>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default ChuyenTienDoModal;
