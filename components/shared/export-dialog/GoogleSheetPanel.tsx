import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { AlertTriangle, ExternalLink, FolderOpen, Link2Off, Loader2, Plus } from 'lucide-react';
import Button from '../../ui/Button';
import Input from '../../ui/Input';
import { cn } from '../../../lib/utils';
import { sheetsClient } from '../../../lib/sheets-client';
import type { useGoogleKetNoi } from './use-google-ket-noi';
import { useGooglePicker } from './use-google-picker';

export interface TabFile {
  title: string;
  rowCount: number;
  header: string[];
}

export interface CauHinhSheet {
  loai: 'moi' | 'co_san';
  tenFile: string;
  tenTab: string;
  cheDo: 'ghi_de' | 'ghi_them';
  file: { spreadsheetId: string; title: string; url: string; tabs: TabFile[] } | null;
  /** Đang gõ tên tab mới trong file có sẵn. */
  tabMoi: boolean;
}

/** Lệch header giữa tab đang có và cột sắp ghi thêm — chỉ để cảnh báo trước khi bấm. */
function lechHeader(cu: string[], moi: string[]): boolean {
  const a = cu.map((x) => x.trim());
  while (a.length > 0 && a[a.length - 1] === '') a.pop();
  if (a.length === 0) return false;
  return a.length !== moi.length || a.some((h, i) => h !== moi[i]);
}

interface Props {
  kn: ReturnType<typeof useGoogleKetNoi>;
  value: CauHinhSheet;
  onChange: (v: CauHinhSheet) => void;
  /** Header sẽ ghi — để cảnh báo lệch cột khi "Tải thêm". */
  headerXuat: string[];
}

const GoogleSheetPanel: React.FC<Props> = ({ kn, value, onChange, headerXuat }) => {
  const { t } = useTranslation();
  const picker = useGooglePicker();
  const [dangDocFile, setDangDocFile] = useState(false);
  const set = (p: Partial<CauHinhSheet>) => onChange({ ...value, ...p });

  if (kn.dangTai && !kn.trangThai) {
    return (
      <div className="flex items-center gap-2 text-xs text-muted-foreground py-3">
        <Loader2 size={14} className="animate-spin" /> {t('shared.export.gs.checking')}
      </div>
    );
  }

  if (!kn.trangThai?.ketNoi || kn.trangThai.trangThai === 'hong') {
    const hong = kn.trangThai?.trangThai === 'hong';
    return (
      <div className="rounded-xl border border-border p-3 space-y-2">
        {hong && (
          <p className="flex items-start gap-1.5 text-xs text-amber-600 dark:text-amber-400">
            <AlertTriangle size={14} className="shrink-0 mt-0.5" />
            {t('shared.export.gs.brokenHint', { email: kn.trangThai?.email ?? '' })}
          </p>
        )}
        <p className="text-xs text-muted-foreground">{t('shared.export.gs.connectHint')}</p>
        <Button onClick={() => void kn.ketNoi()} disabled={kn.dangKetNoi} className="text-xs h-9">
          {kn.dangKetNoi && <Loader2 size={13} className="mr-1.5 animate-spin" />}
          {hong ? t('shared.export.gs.reconnect') : t('shared.export.gs.connect')}
        </Button>
      </div>
    );
  }

  const chonFile = async () => {
    const doc = await picker.chonFile();
    if (!doc) return;
    setDangDocFile(true);
    try {
      const f = await sheetsClient.thongTinFile(doc.id);
      const tabDau = f.tabs[0]?.title ?? value.tenTab;
      onChange({ ...value, loai: 'co_san', file: f, tenTab: tabDau, tabMoi: f.tabs.length === 0 });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : t('shared.export.gs.readFileError'));
    } finally {
      setDangDocFile(false);
    }
  };

  const tabDangChon = value.file?.tabs.find((x) => x.title === value.tenTab);
  const canhBaoLech = value.loai === 'co_san' && value.cheDo === 'ghi_them' && tabDangChon && lechHeader(tabDangChon.header, headerXuat);

  return (
    <div className="space-y-3">
      {/* Tài khoản */}
      <div className="flex items-center justify-between rounded-lg bg-muted/40 px-3 py-2 text-xs">
        <span className="truncate">
          {t('shared.export.gs.connectedAs')} <b className="font-medium">{kn.trangThai.email}</b>
        </span>
        <button
          type="button"
          onClick={() => void kn.ngatKetNoi()}
          className="flex items-center gap-1 text-muted-foreground hover:text-destructive shrink-0 ml-2"
        >
          <Link2Off size={12} /> {t('shared.export.gs.disconnect')}
        </button>
      </div>

      {/* Đích */}
      <div className="flex gap-2">
        {(['moi', 'co_san'] as const).map((l) => (
          <button
            key={l}
            type="button"
            onClick={() => set({ loai: l })}
            disabled={l === 'co_san' && !picker.khaDung}
            title={l === 'co_san' && !picker.khaDung ? t('shared.export.gs.pickerMissing') : undefined}
            className={cn(
              'flex-1 py-2 px-2 rounded-lg border text-xs font-medium transition-all',
              value.loai === l ? 'border-primary bg-primary/5 text-primary' : 'border-border text-muted-foreground hover:border-primary/30',
              l === 'co_san' && !picker.khaDung && 'opacity-40 cursor-not-allowed',
            )}
          >
            {l === 'moi' ? t('shared.export.gs.newFile') : t('shared.export.gs.existingFile')}
          </button>
        ))}
      </div>

      {value.loai === 'moi' ? (
        <div className="grid grid-cols-2 gap-2">
          <Input label={t('shared.export.gs.fileName')} value={value.tenFile} onChange={(e) => set({ tenFile: e.target.value })} className="h-9" />
          <Input label={t('shared.export.gs.tabName')} value={value.tenTab} onChange={(e) => set({ tenTab: e.target.value })} className="h-9" />
        </div>
      ) : (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => void chonFile()} disabled={picker.dangMo || dangDocFile} className="text-xs h-9">
              {picker.dangMo || dangDocFile ? <Loader2 size={13} className="mr-1.5 animate-spin" /> : <FolderOpen size={13} className="mr-1.5" />}
              {value.file ? t('shared.export.gs.pickOther') : t('shared.export.gs.pickFile')}
            </Button>
            {value.file && (
              <a href={value.file.url} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-xs text-primary hover:underline truncate">
                {value.file.title} <ExternalLink size={11} className="shrink-0" />
              </a>
            )}
          </div>

          {value.file && (
            <>
              <div>
                <p className="text-2xs text-muted-foreground mb-1">{t('shared.export.gs.pickTab')}</p>
                <div className="flex flex-wrap gap-1.5">
                  {value.file.tabs.map((tab) => (
                    <button
                      key={tab.title}
                      type="button"
                      onClick={() => set({ tenTab: tab.title, tabMoi: false })}
                      className={cn(
                        'px-2.5 py-1 rounded-full border text-xs transition-all',
                        !value.tabMoi && value.tenTab === tab.title
                          ? 'border-primary bg-primary/5 text-primary'
                          : 'border-border text-muted-foreground hover:border-primary/30',
                      )}
                    >
                      {tab.title}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => set({ tabMoi: true, tenTab: '' })}
                    className={cn(
                      'flex items-center gap-1 px-2.5 py-1 rounded-full border border-dashed text-xs',
                      value.tabMoi ? 'border-primary text-primary' : 'border-border text-muted-foreground hover:border-primary/30',
                    )}
                  >
                    <Plus size={11} /> {t('shared.export.gs.newTab')}
                  </button>
                </div>
                {value.tabMoi && (
                  <Input
                    autoFocus
                    placeholder={t('shared.export.gs.tabName')}
                    value={value.tenTab}
                    onChange={(e) => set({ tenTab: e.target.value })}
                    className="h-9 mt-2"
                  />
                )}
              </div>

              <div>
                <p className="text-2xs text-muted-foreground mb-1">{t('shared.export.gs.writeMode')}</p>
                <div className="flex gap-2">
                  {(['ghi_de', 'ghi_them'] as const).map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => set({ cheDo: m })}
                      className={cn(
                        'flex-1 py-1.5 px-2 rounded-lg border text-xs transition-all text-left',
                        value.cheDo === m ? 'border-primary bg-primary/5 text-primary' : 'border-border text-muted-foreground hover:border-primary/30',
                      )}
                    >
                      <span className="font-medium">{m === 'ghi_de' ? t('shared.export.gs.overwrite') : t('shared.export.gs.append')}</span>
                      <span className="block text-2xs opacity-70">
                        {m === 'ghi_de' ? t('shared.export.gs.overwriteHint') : t('shared.export.gs.appendHint')}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {canhBaoLech && (
                <p className="flex items-start gap-1.5 text-xs text-amber-600 dark:text-amber-400">
                  <AlertTriangle size={14} className="shrink-0 mt-0.5" />
                  {t('shared.export.gs.headerMismatch')}
                </p>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default GoogleSheetPanel;
