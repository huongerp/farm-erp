import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Eye, Info, Loader2 } from 'lucide-react';
import ToggleSwitch from '../../ui/ToggleSwitch';
import { cn } from '../../../lib/utils';
import { sheetsClient, type CauHinhTanSuat } from '../../../lib/sheets-client';
import type { ExportColumn } from '../../../lib/export/dinh-dang-o';
import { DS_TAN_SUAT } from './tan-suat';

export interface CauHinhDongBoValue extends CauHinhTanSuat {
  bat: boolean;
}

interface Props {
  moduleId: string;
  value: CauHinhDongBoValue;
  onChange: (v: CauHinhDongBoValue) => void;
  duocTao: boolean;
  lyDo: string | null;
  cot: ExportColumn[];
}

const chonCls =
  'h-9 w-full rounded-lg border border-border bg-background px-2 text-xs text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20';

/** Công tắc "Đồng bộ tự động" + tần suất + xem thử dữ liệu lịch sẽ ghi. */
const CauHinhDongBo: React.FC<Props> = ({ moduleId, value, onChange, duocTao, lyDo, cot }) => {
  const { t } = useTranslation();
  const [xemThu, setXemThu] = useState<{ header: string[]; rows: string[][] } | null>(null);
  const [dangXem, setDangXem] = useState(false);
  const [loiXem, setLoiXem] = useState<string | null>(null);
  const set = (p: Partial<CauHinhDongBoValue>) => onChange({ ...value, ...p });

  if (!duocTao) {
    return (
      <p className="flex items-start gap-1.5 text-2xs text-muted-foreground">
        <Info size={12} className="shrink-0 mt-0.5" />
        {lyDo ?? t('shared.export.sync.notAllowed')}
      </p>
    );
  }

  const taiXemThu = async () => {
    setDangXem(true);
    setLoiXem(null);
    try {
      setXemThu(await sheetsClient.xemThuLich(moduleId, cot.map((c) => ({ key: c.key, label: c.label, type: c.type }))));
    } catch (e) {
      setLoiXem(e instanceof Error ? e.message : t('shared.export.sync.previewError'));
    } finally {
      setDangXem(false);
    }
  };

  return (
    <div className="space-y-2">
      <ToggleSwitch
        checked={value.bat}
        onChange={(bat) => set({ bat })}
        label={t('shared.export.sync.toggle')}
        description={t('shared.export.sync.toggleHint')}
      />

      {value.bat && (
        <div className="space-y-2 rounded-xl border border-border p-3">
          <div className="grid grid-cols-2 gap-2">
            <label className="col-span-2 text-2xs text-muted-foreground">
              {t('shared.export.sync.frequency')}
              <select className={cn(chonCls, 'mt-1')} value={value.tanSuat} onChange={(e) => set({ tanSuat: e.target.value as CauHinhTanSuat['tanSuat'] })}>
                {DS_TAN_SUAT.map((f) => (
                  <option key={f} value={f}>
                    {t(`shared.export.sync.freq.${f}`)}
                  </option>
                ))}
              </select>
            </label>
            {value.tanSuat === 'hang_tuan' && (
              <label className="text-2xs text-muted-foreground">
                {t('shared.export.sync.weekdayLabel')}
                <select className={cn(chonCls, 'mt-1')} value={value.thu ?? 1} onChange={(e) => set({ thu: Number(e.target.value) })}>
                  {[1, 2, 3, 4, 5, 6, 7].map((d) => (
                    <option key={d} value={d}>
                      {t(`shared.export.sync.weekday.${d}`)}
                    </option>
                  ))}
                </select>
              </label>
            )}
            {value.tanSuat === 'hang_thang' && (
              <label className="text-2xs text-muted-foreground">
                {t('shared.export.sync.dayLabel')}
                <select className={cn(chonCls, 'mt-1')} value={value.ngayThang ?? 1} onChange={(e) => set({ ngayThang: Number(e.target.value) })}>
                  {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => (
                    <option key={d} value={d}>
                      {d === 31 ? t('shared.export.sync.lastDay') : t('shared.export.sync.dayN', { n: d })}
                    </option>
                  ))}
                </select>
              </label>
            )}
            {(value.tanSuat === 'hang_ngay' || value.tanSuat === 'hang_tuan' || value.tanSuat === 'hang_thang') && (
              <label className="text-2xs text-muted-foreground">
                {t('shared.export.sync.hourLabel')}
                <select className={cn(chonCls, 'mt-1')} value={value.gio ?? 7} onChange={(e) => set({ gio: Number(e.target.value) })}>
                  {Array.from({ length: 24 }, (_, h) => h).map((h) => (
                    <option key={h} value={h}>
                      {String(h).padStart(2, '0')}:00
                    </option>
                  ))}
                </select>
              </label>
            )}
          </div>

          <p className="flex items-start gap-1.5 text-2xs text-amber-600 dark:text-amber-400">
            <Info size={12} className="shrink-0 mt-0.5" />
            {t('shared.export.sync.scopeNote')}
          </p>

          <button type="button" onClick={() => void taiXemThu()} disabled={dangXem} className="flex items-center gap-1 text-2xs text-primary hover:underline">
            {dangXem ? <Loader2 size={11} className="animate-spin" /> : <Eye size={11} />}
            {t('shared.export.sync.preview')}
          </button>
          {loiXem && <p className="text-2xs text-destructive">{loiXem}</p>}
          {xemThu && (
            <div className="max-h-48 overflow-auto rounded-lg border border-border custom-scrollbar">
              <table className="text-2xs w-max min-w-full">
                <thead className="bg-muted/60 sticky top-0">
                  <tr>
                    {xemThu.header.map((h, i) => (
                      <th key={i} className="px-2 py-1 text-left font-medium whitespace-nowrap">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {xemThu.rows.map((r, i) => (
                    <tr key={i} className="border-t border-border">
                      {r.map((o, j) => (
                        <td key={j} className="px-2 py-1 whitespace-nowrap max-w-[200px] truncate">
                          {o}
                        </td>
                      ))}
                    </tr>
                  ))}
                  {xemThu.rows.length === 0 && (
                    <tr>
                      <td className="px-2 py-2 text-muted-foreground" colSpan={xemThu.header.length}>
                        {t('shared.export.noData')}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default CauHinhDongBo;
