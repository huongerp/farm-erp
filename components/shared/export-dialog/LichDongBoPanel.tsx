import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { AlertTriangle, CheckCircle2, Clock, ExternalLink, Loader2, RefreshCw, Trash2 } from 'lucide-react';
import { cn, formatDateTimeShort } from '../../../lib/utils';
import { sheetsClient, type LichDongBo } from '../../../lib/sheets-client';
import { useConfirmStore } from '../../../store/useConfirmStore';
import { moTaTanSuat } from './tan-suat';

interface Props {
  dsLich: LichDongBo[];
  onThay: (l: LichDongBo) => void;
  onTaiLai: () => void;
}

function DongTrangThai({ l }: { l: LichDongBo }) {
  const { t } = useTranslation();
  if (!l.bat) {
    return (
      <span className="flex items-start gap-1 text-destructive">
        <AlertTriangle size={11} className="shrink-0 mt-0.5" />
        {l.thongDiepCuoi ? t('shared.export.sync.stoppedWith', { msg: l.thongDiepCuoi }) : t('shared.export.sync.paused')}
      </span>
    );
  }
  if (l.ketQuaCuoi === 'loi') {
    return (
      <span className="flex items-start gap-1 text-amber-600 dark:text-amber-400">
        <AlertTriangle size={11} className="shrink-0 mt-0.5" />
        {t('shared.export.sync.errorRetry', { n: l.soLoiLienTiep, msg: l.thongDiepCuoi ?? '' })}
      </span>
    );
  }
  if (l.choGhi) {
    return (
      <span className="flex items-center gap-1 text-primary">
        <Clock size={11} /> {t('shared.export.sync.pendingWrite')}
      </span>
    );
  }
  return (
    <span className="flex items-center gap-1">
      <CheckCircle2 size={11} className="text-emerald-600" />
      {l.lanChayCuoi
        ? t('shared.export.sync.lastRun', { at: formatDateTimeShort(l.lanChayCuoi), rows: l.soDongCuoi ?? 0 })
        : t('shared.export.sync.neverRun')}
      {l.lanChayKeTiep && <> · {t('shared.export.sync.nextRun', { at: formatDateTimeShort(l.lanChayKeTiep) })}</>}
    </span>
  );
}

/** Danh sách lịch đồng bộ của module (của chính người dùng): bật/tắt, đồng bộ ngay, xoá. */
const LichDongBoPanel: React.FC<Props> = ({ dsLich, onThay, onTaiLai }) => {
  const { t } = useTranslation();
  const confirm = useConfirmStore((s) => s.confirm);
  const [dangLam, setDangLam] = useState<number | null>(null);

  if (dsLich.length === 0) return null;

  const lam = async (id: number, viec: () => Promise<void>) => {
    setDangLam(id);
    try {
      await viec();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : t('shared.export.sync.actionError'));
    } finally {
      setDangLam(null);
    }
  };

  return (
    <div>
      <p className="text-xs font-medium text-muted-foreground mb-2">{t('shared.export.sync.listTitle')}</p>
      <div className="space-y-1.5">
        {dsLich.map((l) => (
          <div key={l.id} className={cn('rounded-lg border border-border px-3 py-2 text-xs', !l.bat && 'opacity-80')}>
            <div className="flex items-center gap-2">
              <a href={l.spreadsheetUrl} target="_blank" rel="noreferrer" className="flex min-w-0 items-center gap-1 font-medium text-foreground hover:text-primary">
                <span className="truncate">
                  {l.tenFile ?? 'Google Sheet'} › {l.sheetTitle}
                </span>
                <ExternalLink size={11} className="shrink-0" />
              </a>
              <div className="ml-auto flex shrink-0 items-center gap-1">
                {dangLam === l.id && <Loader2 size={13} className="animate-spin text-muted-foreground" />}
                <button
                  type="button"
                  title={t('shared.export.sync.runNow')}
                  disabled={dangLam !== null}
                  onClick={() =>
                    void lam(l.id, async () => {
                      const kq = await sheetsClient.chayNgay(l.id);
                      if (kq.lich) onThay(kq.lich);
                      if (kq.ok) toast.success(t('shared.export.sync.runNowDone', { msg: kq.ketQua.thongDiep }));
                      else toast.error(kq.ketQua.thongDiep);
                    })
                  }
                  className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted disabled:opacity-40"
                >
                  <RefreshCw size={13} />
                </button>
                <button
                  type="button"
                  role="switch"
                  aria-checked={l.bat}
                  title={l.bat ? t('shared.export.sync.pause') : t('shared.export.sync.resume')}
                  disabled={dangLam !== null}
                  onClick={() =>
                    void lam(l.id, async () => {
                      const kq = await sheetsClient.suaLich(l.id, { bat: !l.bat });
                      onThay(kq.lich);
                    })
                  }
                  className={cn(
                    'relative inline-flex h-4 w-7 shrink-0 items-center rounded-full transition-colors disabled:opacity-40',
                    l.bat ? 'bg-primary' : 'bg-muted-foreground/30',
                  )}
                >
                  <span className={cn('inline-block h-3 w-3 rounded-full bg-white transition-transform', l.bat ? 'translate-x-3.5' : 'translate-x-0.5')} />
                </button>
                <button
                  type="button"
                  title={t('common.delete')}
                  disabled={dangLam !== null}
                  onClick={() =>
                    confirm({
                      title: t('shared.export.sync.deleteTitle'),
                      message: t('shared.export.sync.deleteMessage', { tab: l.sheetTitle }),
                      variant: 'danger',
                      confirmText: t('common.delete'),
                      onConfirm: () =>
                        lam(l.id, async () => {
                          await sheetsClient.xoaLich(l.id);
                          onTaiLai();
                        }),
                    })
                  }
                  className="p-1 rounded-md text-muted-foreground hover:text-destructive hover:bg-muted disabled:opacity-40"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
            <div className="mt-1 flex flex-col gap-0.5 text-2xs text-muted-foreground">
              <span>
                {moTaTanSuat(l, t)} · {t('shared.export.sync.columns', { n: l.soCot })}
              </span>
              <DongTrangThai l={l} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default LichDongBoPanel;
