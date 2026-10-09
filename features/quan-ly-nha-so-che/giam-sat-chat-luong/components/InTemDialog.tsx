import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Printer, Settings } from 'lucide-react';
import GenericDrawer from '../../../../components/shared/GenericDrawer';
import Button from '../../../../components/ui/Button';
import { DIALOG_SIZE } from '../../../../lib/dialog-sizes';
import { cn } from '../../../../lib/utils';
import { docCaiDatTem } from '../core/mau-tem';
import type { GiamSatChatLuong, ThungMau } from '../core/types';
import { inTemGscl, temTuPhieu } from '../utils/in-tem-gscl';

interface Props {
  phieu: GiamSatChatLuong;
  thung: ThungMau[];
  onClose: () => void;
  onOpenSettings: () => void;
}

/** Chọn thùng cần in tem (mặc định tất cả) — in lại một tem bị hỏng cũng ở đây. */
const InTemDialog: React.FC<Props> = ({ phieu, thung, onClose, onOpenSettings }) => {
  const { t } = useTranslation();
  const caiDat = useMemo(() => docCaiDatTem(), []);
  const [chon, setChon] = useState<Set<number>>(() => new Set(thung.map((x) => x.stt_thung)));
  const [dangIn, setDangIn] = useState(false);

  const toggle = (stt: number) =>
    setChon((cur) => {
      const next = new Set(cur);
      if (next.has(stt)) next.delete(stt);
      else next.add(stt);
      return next;
    });

  const inNgay = async () => {
    const list = thung.filter((x) => chon.has(x.stt_thung));
    if (list.length === 0) return;
    setDangIn(true);
    try {
      await inTemGscl(temTuPhieu(phieu, list), caiDat);
      onClose();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : String(e));
    } finally {
      setDangIn(false);
    }
  };

  return (
    <GenericDrawer
      title={t('giamSatChatLuong.inTem.title')}
      subtitle={phieu.so_phieu}
      icon={<Printer className="text-primary" size={22} />}
      onClose={onClose}
      variant="modal"
      maxWidthClass={DIALOG_SIZE.COMPACT}
      footer={
        <div className="flex items-center justify-end gap-2 w-full">
          <Button type="button" variant="outline" size="sm" onClick={onClose}>
            {t('common.cancel')}
          </Button>
          <Button type="button" size="sm" onClick={inNgay} disabled={dangIn || chon.size === 0}>
            <Printer size={14} className="mr-1.5" />
            {t('giamSatChatLuong.inTem.in', { n: chon.size })}
          </Button>
        </div>
      }
    >
      <div className="space-y-3">
        <div className="flex items-center justify-between gap-2 text-sm">
          <span className="text-muted-foreground">
            {t('giamSatChatLuong.inTem.kho', { rong: caiDat.rong, cao: caiDat.cao })} ·{' '}
            {t(`giamSatChatLuong.caiDat.cheDo_${caiDat.cheDo}`)}
          </span>
          <button
            type="button"
            onClick={onOpenSettings}
            className="inline-flex items-center gap-1 text-primary text-xs font-medium hover:underline"
          >
            <Settings size={13} />
            {t('giamSatChatLuong.caiDat.title')}
          </button>
        </div>
        <div className="flex items-center justify-between text-xs">
          <span className="font-semibold text-muted-foreground uppercase tracking-wide">{t('giamSatChatLuong.inTem.chonThung')}</span>
          <div className="flex gap-3">
            <button type="button" className="text-primary hover:underline" onClick={() => setChon(new Set(thung.map((x) => x.stt_thung)))}>
              {t('giamSatChatLuong.inTem.tatCa')}
            </button>
            <button type="button" className="text-primary hover:underline" onClick={() => setChon(new Set())}>
              {t('giamSatChatLuong.inTem.boChon')}
            </button>
          </div>
        </div>
        <div className="grid grid-cols-5 gap-1.5">
          {thung.map((x) => (
            <button
              key={x.id}
              type="button"
              onClick={() => toggle(x.stt_thung)}
              className={cn(
                'h-10 rounded-lg border text-sm font-semibold tabular-nums',
                chon.has(x.stt_thung)
                  ? 'bg-primary text-white border-primary'
                  : 'bg-background border-border text-muted-foreground hover:bg-muted'
              )}
            >
              {t('giamSatChatLuong.detail.thungSo', { stt: x.stt_thung })}
            </button>
          ))}
        </div>
        <p className="text-xs text-muted-foreground m-0">{t('giamSatChatLuong.inTem.hint')}</p>
      </div>
    </GenericDrawer>
  );
};

export default InTemDialog;
