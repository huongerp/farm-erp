import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { BarChart3, Eye, FileStack, Printer, Users } from 'lucide-react';
import GenericDrawer from '../../../../components/shared/GenericDrawer';
import Button from '../../../../components/ui/Button';
import { DIALOG_SIZE } from '../../../../lib/dialog-sizes';
import { cn } from '../../../../lib/utils';
import { taoUrlPreview, type LoaiIn } from '../core/mau-in';

const LOAI: { id: LoaiIn; icon: React.ReactNode; tone: string }[] = [
  { id: 'tong-hop', icon: <FileStack size={18} />, tone: 'bg-primary/10 text-primary' },
  { id: 'nhan-cong-so-che', icon: <Users size={18} />, tone: 'bg-emerald-500/10 text-emerald-600' },
  { id: 'pham-cap-kpi', icon: <BarChart3 size={18} />, tone: 'bg-violet-500/10 text-violet-600' },
];

/** Popup chọn loại phiếu in báo cáo sơ chế rồi mở trang preview ở tab mới. */
const ChonMauInDialog: React.FC<{ idPhieu: string; onClose: () => void }> = ({ idPhieu, onClose }) => {
  const { t } = useTranslation();
  const [loai, setLoai] = useState<LoaiIn>('tong-hop');

  const xemTruoc = () => {
    window.open(taoUrlPreview(idPhieu, loai), '_blank', 'noopener,noreferrer');
    onClose();
  };

  return (
    <GenericDrawer
      title={t('baoCaoSoChe.mauIn.title')}
      subtitle={t('baoCaoSoChe.mauIn.subtitle')}
      icon={<Printer className="text-primary" size={22} />}
      onClose={onClose}
      variant="modal"
      maxWidthClass={DIALOG_SIZE.MEDIUM}
      footer={
        <div className="flex items-center justify-between gap-2 w-full">
          <Button type="button" variant="outline" size="sm" onClick={onClose}>
            {t('common.cancel')}
          </Button>
          <Button type="button" size="sm" onClick={xemTruoc}>
            <Eye size={14} className="mr-1.5" />
            {t('baoCaoSoChe.mauIn.xemTruoc')}
          </Button>
        </div>
      }
    >
      <div className="space-y-4 pb-2">
        <div className="space-y-2" role="radiogroup" aria-label={t('baoCaoSoChe.mauIn.title')}>
          {LOAI.map((o) => (
            <button
              key={o.id}
              type="button"
              role="radio"
              aria-checked={loai === o.id}
              onClick={() => setLoai(o.id)}
              onDoubleClick={xemTruoc}
              className={cn(
                'w-full flex items-center gap-3 rounded-xl border p-3 text-left transition',
                loai === o.id
                  ? 'border-primary ring-2 ring-primary/20 bg-primary/[0.03]'
                  : 'border-border hover:bg-muted/40'
              )}
            >
              <span className={cn('h-10 w-10 shrink-0 rounded-full flex items-center justify-center', o.tone)}>
                {o.icon}
              </span>
              <span className="min-w-0">
                <span className="block text-sm font-semibold">{t(`baoCaoSoChe.mauIn.ten.${o.id}`)}</span>
                <span className="block text-xs text-muted-foreground">{t(`baoCaoSoChe.mauIn.moTa.${o.id}`)}</span>
              </span>
            </button>
          ))}
        </div>

        <p className="text-xs text-muted-foreground">{t('baoCaoSoChe.mauIn.caiDatHint')}</p>
      </div>
    </GenericDrawer>
  );
};

export default ChonMauInDialog;
