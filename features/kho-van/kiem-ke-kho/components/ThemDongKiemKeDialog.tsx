import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, X } from 'lucide-react';
import Button from '../../../../components/ui/Button';
import { cn } from '../../../../lib/utils';
import { TRANG_THAI_HOAT_DONG } from '../../../../lib/constants';
import { useKhoList } from '../../danh-sach-kho/hooks/use-kho';
import { useQuery } from '@tanstack/react-query';
import { getAllHangHoa } from '../../danh-sach-hang-hoa/services/hang-hoa-service';
import { HANG_HOA_QUERY_KEY } from '../../danh-sach-hang-hoa/hooks/use-hang-hoa';
import Select from '../../../../components/ui/Select';
import type { ChiTietKiemKeKho } from '../core/types';

const ALL_KHO_VALUE = '__ALL__';

interface Props {
  open: boolean;
  onClose: () => void;
  onConfirm: (id_kho_list: string[], id_hang_hoa: string) => void;
  isLoading?: boolean;
  idKhoOfDot: string[];
  chiTiet: ChiTietKiemKeKho[];
}

const ThemDongKiemKeDialog: React.FC<Props> = ({
  open,
  onClose,
  onConfirm,
  isLoading = false,
  idKhoOfDot,
  chiTiet,
}) => {
  const { t } = useTranslation();
  const [id_hang_hoa, setIdHangHoa] = useState('');
  const [id_kho, setIdKho] = useState('');

  const { data: khoList = [] } = useKhoList();
  const { data: hangHoaList = [] } = useQuery({
    queryKey: HANG_HOA_QUERY_KEY,
    queryFn: getAllHangHoa,
    enabled: open,
  });

  const existingKeys = useMemo(
    () => new Set(chiTiet.map((c) => `${c.id_kho}|${c.id_hang_hoa}`)),
    [chiTiet]
  );

  const khoOptions = useMemo(() => {
    return khoList
      .filter((k) => idKhoOfDot.includes(k.id) && k.trang_thai === TRANG_THAI_HOAT_DONG.DANG_HOAT_DONG)
      .map((k) => ({ value: k.id, label: `${k.ten_kho} (${k.ma_kho})` }));
  }, [khoList, idKhoOfDot]);

  const isSingleKho = khoOptions.length === 1;

  useEffect(() => {
    if (open) {
      setIdHangHoa('');
      if (isSingleKho) {
        setIdKho(khoOptions[0].value);
      } else {
        setIdKho(ALL_KHO_VALUE);
      }
    }
  }, [open, isSingleKho, khoOptions]);

  const resolvedKhoIds = useMemo(() => {
    if (id_kho === ALL_KHO_VALUE) return khoOptions.map((k) => k.value);
    if (id_kho) return [id_kho];
    return [];
  }, [id_kho, khoOptions]);

  const hangHoaOptions = useMemo(() => {
    const active = hangHoaList.filter(
      (h) => h.trang_thai === TRANG_THAI_HOAT_DONG.DANG_HOAT_DONG
    );
    return active
      .filter((h) => {
        return resolvedKhoIds.some(
          (kId) => !existingKeys.has(`${kId}|${h.id}`)
        );
      })
      .map((h) => ({
        value: h.id,
        label: `${h.ten_hang_hoa ?? h.ten_hang ?? ''} (${h.ma_hang_hoa ?? h.ma_hang ?? ''})`,
      }));
  }, [hangHoaList, resolvedKhoIds, existingKeys]);

  const targetKhoIds = useMemo(() => {
    if (!id_hang_hoa) return [];
    return resolvedKhoIds.filter(
      (kId) => !existingKeys.has(`${kId}|${id_hang_hoa}`)
    );
  }, [id_hang_hoa, resolvedKhoIds, existingKeys]);

  const canSubmit = id_hang_hoa && targetKhoIds.length > 0;

  const handleConfirm = useCallback(() => {
    if (!canSubmit) return;
    onConfirm(targetKhoIds, id_hang_hoa);
  }, [canSubmit, targetKhoIds, id_hang_hoa, onConfirm]);

  const handleClose = useCallback(() => {
    if (isLoading) return;
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
            'w-full min-w-[min(100%,28rem)] max-w-md bg-card rounded-2xl shadow-2xl border border-border pointer-events-auto flex flex-col'
          )}
        >
          <div className="flex items-center justify-between px-5 py-4 border-b border-border shrink-0">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-primary/10 text-primary">
                <Plus size={18} />
              </div>
              <h3 className="text-sm font-semibold text-foreground">
                {t('kiemKeKho.detail.addLine')}
              </h3>
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

          <div className="p-5 space-y-4">
            <Select
              label={t('kiemKeKho.store.hangHoaCol')}
              value={id_hang_hoa}
              onChange={(e) => setIdHangHoa(e.target.value)}
              options={[
                { value: '', label: t('kiemKeKho.themDong.hangHoaPlaceholder') },
                ...hangHoaOptions,
              ]}
            />
            {!isSingleKho && (
              <Select
                label={t('kiemKeKho.store.khoCol')}
                value={id_kho}
                onChange={(e) => {
                  setIdKho(e.target.value);
                  setIdHangHoa('');
                }}
                options={[
                  { value: ALL_KHO_VALUE, label: t('kiemKeKho.themDong.tatCaKho') },
                  ...khoOptions,
                ]}
              />
            )}
            {canSubmit && targetKhoIds.length > 1 && (
              <p className="text-xs text-muted-foreground">
                {t('kiemKeKho.themDong.multiKhoHint', { count: targetKhoIds.length })}
              </p>
            )}
          </div>

          <div className="flex items-center justify-end gap-3 px-5 py-4 border-t border-border shrink-0">
            <Button variant="outline" onClick={handleClose} disabled={isLoading}>
              {t('common.cancel')}
            </Button>
            <Button
              onClick={handleConfirm}
              disabled={!canSubmit || isLoading}
              isLoading={isLoading}
              className="bg-primary text-white"
            >
              {t('kiemKeKho.table.themDong')}
              {targetKhoIds.length > 1 && ` (${targetKhoIds.length})`}
            </Button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default ThemDongKiemKeDialog;
