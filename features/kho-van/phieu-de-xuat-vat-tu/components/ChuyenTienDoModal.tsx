import React, { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { Package, X } from 'lucide-react';
import Button from '../../../../components/ui/Button';
import Combobox from '../../../../components/ui/Combobox';
import Textarea from '../../../../components/ui/Textarea';
import { BTN_CANCEL } from '../../../../lib/button-labels';
import { useTienDoMuaHangList } from '../../../mua-hang/thiet-lap-de-xuat-vat-tu/hooks/use-tien-do-mua-hang';
import { TRANG_THAI_HOAT_DONG } from '../../../../lib/constants';

export interface ChuyenTienDoResult {
  id_tien_do_mh: string;
  ten_tien_do_mh: string;
  ghi_chu: string;
}

interface Props {
  open: boolean;
  selectedCount: number;
  onClose: () => void;
  onConfirm: (result: ChuyenTienDoResult) => void;
}

const ChuyenTienDoModal: React.FC<Props> = ({ open, selectedCount, onClose, onConfirm }) => {
  const { t } = useTranslation();
  const { data: tienDoMuaHangList = [] } = useTienDoMuaHangList();
  const [idTienDo, setIdTienDo] = useState<string | null>(null);
  const [ghiChu, setGhiChu] = useState('');

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
    }
  }, [open, options]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const item = tienDoMuaHangList.find((x) => x.id === idTienDo);
    if (!item) return;
    onConfirm({
      id_tien_do_mh: item.id,
      ten_tien_do_mh: item.ten,
      ghi_chu: ghiChu.trim(),
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
                  {t('phieuDeXuatVatTu.chiTietTab.chuyenTienDoTitle')}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {t('phieuDeXuatVatTu.chiTietTab.chuyenTienDoSubtitle', { count: selectedCount })}
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
              label={t('phieuDeXuatVatTu.form.tienDoMh')}
              options={options}
              value={idTienDo}
              onChange={(v) => setIdTienDo(v ?? null)}
              placeholder={t('phieuDeXuatVatTu.form.tienDoMhPlaceholder')}
              searchPlaceholder={t('phieuDeXuatVatTu.form.itemSearchPlaceholder')}
              searchable
              required
            />
            <Textarea
              label={t('phieuDeXuatVatTu.chiTietTab.traoDoiLabel')}
              placeholder={t('phieuDeXuatVatTu.chiTietTab.traoDoiPlaceholder')}
              value={ghiChu}
              onChange={(e) => setGhiChu(e.target.value)}
              rows={3}
            />
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="ghost" onClick={onClose} className="border border-border">
                {BTN_CANCEL()}
              </Button>
              <Button type="submit" className="bg-primary text-white" disabled={!idTienDo}>
                {t('phieuDeXuatVatTu.chiTietTab.chuyenTienDoConfirm')}
              </Button>
            </div>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default ChuyenTienDoModal;
