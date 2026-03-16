import React, { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import Button from '../../../../components/ui/Button';
import Input from '../../../../components/ui/Input';
import Textarea from '../../../../components/ui/Textarea';
import Combobox from '../../../../components/ui/Combobox';
import { BTN_CANCEL, BTN_SAVE } from '../../../../lib/button-labels';
import type { PhieuDeXuatVatTuChiTietRow } from '../core/types';
import { useTienDoMuaHangList } from '../../../mua-hang/thiet-lap-de-xuat-vat-tu/hooks/use-tien-do-mua-hang';
import { TRANG_THAI_HOAT_DONG } from '../../../../lib/constants';

export interface ChiTietRowEditPayload {
  so_luong: number;
  thong_so: string;
  ghi_chu: string;
  id_tien_do_mh: string | null;
  ten_tien_do_mh: string | null;
}

interface Props {
  open: boolean;
  initialData: PhieuDeXuatVatTuChiTietRow | null;
  onClose: () => void;
  onSave: (payload: ChiTietRowEditPayload) => void;
}

const ChiTietRowEditModal: React.FC<Props> = ({ open, initialData, onClose, onSave }) => {
  const { t } = useTranslation();
  const { data: tienDoMuaHangList = [] } = useTienDoMuaHangList();
  const [soLuong, setSoLuong] = useState('');
  const [thongSo, setThongSo] = useState('');
  const [ghiChu, setGhiChu] = useState('');
  const [idTienDoMh, setIdTienDoMh] = useState<string | null>(null);
  const [tenTienDoMh, setTenTienDoMh] = useState<string | null>(null);

  const tienDoOptions = useMemo(
    () =>
      tienDoMuaHangList
        .filter((t) => t.trang_thai === TRANG_THAI_HOAT_DONG.DANG_HOAT_DONG)
        .sort((a, b) => a.thu_tu - b.thu_tu)
        .map((t) => ({ value: t.id, label: t.ten })),
    [tienDoMuaHangList]
  );

  useEffect(() => {
    if (open && initialData) {
      setSoLuong(String(initialData.so_luong ?? ''));
      setThongSo(initialData.thong_so ?? '');
      setGhiChu(initialData.ghi_chu ?? '');
      setIdTienDoMh(initialData.id_tien_do_mh ?? null);
      setTenTienDoMh(initialData.ten_tien_do_mh ?? null);
    }
  }, [open, initialData]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const num = Number(soLuong);
    if (Number.isNaN(num) || num <= 0) {
      return;
    }
    onSave({
      so_luong: num,
      thong_so: thongSo.trim(),
      ghi_chu: ghiChu.trim(),
      id_tien_do_mh: idTienDoMh,
      ten_tien_do_mh: tenTienDoMh,
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
          <div className="px-6 pt-5 pb-4 border-b border-border bg-muted/30">
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-lg font-semibold text-foreground">
                {t('phieuDeXuatVatTu.chiTietTab.editLineTitle')}
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
            {initialData && (
              <p className="text-sm text-muted-foreground mt-1">
                {initialData.so_phieu ?? '—'} · {initialData.ma_hang ?? initialData.ten_hang ?? '—'}
              </p>
            )}
          </div>
          <form onSubmit={handleSubmit} className="px-6 py-4 space-y-4">
            <Input
              label={t('phieuDeXuatVatTu.form.quantity')}
              type="number"
              step="any"
              min={0.0001}
              value={soLuong}
              onChange={(e) => setSoLuong(e.target.value)}
              required
            />
            <Textarea
              label={t('phieuDeXuatVatTu.form.specs')}
              placeholder={t('phieuDeXuatVatTu.form.specsPlaceholder')}
              value={thongSo}
              onChange={(e) => setThongSo(e.target.value)}
              rows={2}
            />
            <Textarea
              label={t('phieuDeXuatVatTu.form.note')}
              placeholder={t('phieuDeXuatVatTu.form.notePlaceholder')}
              value={ghiChu}
              onChange={(e) => setGhiChu(e.target.value)}
              rows={2}
            />
            <Combobox
              label={t('phieuDeXuatVatTu.form.tienDoMh')}
              options={tienDoOptions}
              value={idTienDoMh}
              onChange={(v) => {
                const item = tienDoMuaHangList.find((t) => t.id === v);
                setIdTienDoMh(v ?? null);
                setTenTienDoMh(item?.ten ?? null);
              }}
              placeholder={t('phieuDeXuatVatTu.form.tienDoMhPlaceholder')}
              searchPlaceholder={t('phieuDeXuatVatTu.form.itemSearchPlaceholder')}
              searchable
            />
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="ghost" onClick={onClose} className="border border-border">
                {BTN_CANCEL()}
              </Button>
              <Button type="submit" className="bg-primary text-white">
                {BTN_SAVE()}
              </Button>
            </div>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default ChiTietRowEditModal;
