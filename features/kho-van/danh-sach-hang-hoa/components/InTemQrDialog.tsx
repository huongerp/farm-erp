import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Printer, QrCode } from 'lucide-react';
import { toast } from 'sonner';
import GenericDrawer from '../../../../components/shared/GenericDrawer';
import FormDrawerFooter from '../../../../components/shared/FormDrawerFooter';
import NumberInput from '../../../../components/ui/NumberInput';
import QrCodeImage from '../../../../components/shared/QrCodeImage';
import { DIALOG_SIZE } from '../../../../lib/dialog-sizes';
import { cn } from '../../../../lib/utils';
import { inTemQr, type CoTem, type TemQrItem } from '../utils/in-tem-qr';

const CO_TEM: CoTem[] = ['nho', 'vua', 'lon'];

/** In tem QR theo mã hàng — dán lên từng thùng để quét khi xuất hàng. */
const InTemQrDialog: React.FC<{ items: TemQrItem[]; onClose: () => void }> = ({ items, onClose }) => {
  const { t } = useTranslation();
  const [soTem, setSoTem] = useState(1);
  const [co, setCo] = useState<CoTem>('vua');
  const [dangIn, setDangIn] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setDangIn(true);
    try {
      await inTemQr(items, soTem, co);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : String(err));
    } finally {
      setDangIn(false);
    }
  };

  return (
    <GenericDrawer
      title={t('hangHoa.qr.inTemTitle')}
      subtitle={t('hangHoa.qr.inTemSubtitle', { count: items.length })}
      icon={<QrCode className="text-primary" size={22} />}
      onClose={onClose}
      variant="modal"
      maxWidthClass={DIALOG_SIZE.MEDIUM}
      footer={
        <FormDrawerFooter
          formId="in-tem-qr-form"
          onCancel={onClose}
          isEdit
          isLoading={dangIn}
          saveLabel={t('hangHoa.qr.in')}
          cancelLabel={t('common.cancel')}
        />
      }
    >
      <form id="in-tem-qr-form" className="space-y-4 pb-2" onSubmit={submit}>
        <NumberInput
          label={t('hangHoa.qr.soTemMoiMa')}
          value={soTem}
          onChange={(v) => setSoTem(Math.max(1, Math.min(500, Math.floor(v || 1))))}
          min={1}
          maxFractionDigits={0}
        />
        <div>
          <p className="text-xs font-medium mb-1.5">{t('hangHoa.qr.coTem')}</p>
          <div className="inline-flex rounded-lg border border-border p-0.5 bg-muted/30">
            {CO_TEM.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setCo(c)}
                className={cn(
                  'px-3 py-1.5 text-xs font-medium rounded-md transition',
                  co === c ? 'bg-card shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'
                )}
              >
                {t(`hangHoa.qr.co.${c}`)}
              </button>
            ))}
          </div>
        </div>
        <div className="max-h-64 overflow-y-auto space-y-2 pr-1">
          {items.map((it) => (
            <div key={it.ma} className="flex items-center gap-3 rounded-lg border border-border p-2">
              <QrCodeImage value={it.ma} size={56} />
              <div className="min-w-0">
                <div className="text-sm font-mono font-semibold">{it.ma}</div>
                <div className="text-xs text-muted-foreground line-clamp-2">{it.ten}</div>
              </div>
            </div>
          ))}
        </div>
        <p className="text-xs text-muted-foreground flex items-center gap-1.5">
          <Printer size={12} /> {t('hangHoa.qr.tongTem', { n: items.length * soTem })}
        </p>
      </form>
    </GenericDrawer>
  );
};

export default InTemQrDialog;
