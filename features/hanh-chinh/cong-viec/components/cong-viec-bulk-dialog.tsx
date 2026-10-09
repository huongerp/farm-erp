import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { Tag, User, X } from 'lucide-react';
import Button from '../../../../components/ui/Button';
import Combobox from '../../../../components/ui/Combobox';
import { BTN_CANCEL } from '../../../../lib/button-labels';
import { useEmployeesRefQuery } from '../../../../lib/hooks/use-ref-queries';
import { getTrangThaiOptions } from '../core/constants';
import { buildEmployeeOptions } from '../utils/employee-options';
import type { CongViecTrangThai } from '../core/types';

export type CongViecBulkMode = 'trang_thai' | 'trach_nhiem';

interface Props {
  mode: CongViecBulkMode;
  count: number;
  isPending: boolean;
  onClose: () => void;
  onConfirm: (value: CongViecTrangThai | number) => void;
}

/**
 * Popup chọn một giá trị áp cho mọi công việc đã chọn: trạng thái mới hoặc người phụ trách mới.
 * Chỉ mount khi đang mở nên state tự sạch mỗi lần mở lại.
 */
const CongViecBulkDialog: React.FC<Props> = ({ mode, count, isPending, onClose, onConfirm }) => {
  const { t } = useTranslation();
  const { data: employees = [] } = useEmployeesRefQuery();
  const [value, setValue] = useState<string | null>(null);

  const isTrangThai = mode === 'trang_thai';
  const options = useMemo(
    () =>
      isTrangThai
        ? getTrangThaiOptions(t)
        : buildEmployeeOptions(employees).map((o) => ({ label: o.label, value: String(o.value) })),
    [isTrangThai, t, employees]
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isPending || !value) return;
    onConfirm(isTrangThai ? (value as CongViecTrangThai) : Number(value));
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.15 }}
        className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
        onClick={isPending ? undefined : onClose}
      >
        <motion.div
          initial={{ scale: 0.96, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.96, opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="bg-card rounded-2xl border border-border shadow-2xl max-w-md w-full"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="px-6 pt-5 pb-4 border-b border-border bg-muted/30 rounded-t-2xl flex items-center justify-between gap-3">
            <h3 className="text-lg font-semibold text-foreground">
              {t(isTrangThai ? 'congViec.bulk.trangThaiTitle' : 'congViec.bulk.giaoLaiTitle', { count })}
            </h3>
            <button
              type="button"
              onClick={onClose}
              disabled={isPending}
              className="p-2 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors disabled:opacity-50"
              aria-label={t('common.close')}
            >
              <X size={18} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="px-6 py-4 space-y-4">
            <Combobox
              label={t(isTrangThai ? 'congViec.form.trangThai' : 'congViec.form.trachNhiem')}
              icon={isTrangThai ? <Tag size={16} /> : <User size={16} />}
              options={options}
              value={value}
              onChange={(v: string | null) => setValue(v ? String(v) : null)}
              searchable={!isTrangThai}
              required
              disabled={isPending}
            />
            {!isTrangThai && <p className="text-xs text-muted-foreground">{t('congViec.bulk.giaoLaiHint')}</p>}

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="ghost" onClick={onClose} disabled={isPending} className="border border-border">
                {BTN_CANCEL()}
              </Button>
              <Button type="submit" className="bg-primary text-white" disabled={isPending || !value}>
                {t('congViec.bulk.apDung')}
              </Button>
            </div>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default CongViecBulkDialog;
