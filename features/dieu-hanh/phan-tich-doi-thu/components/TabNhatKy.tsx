import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Send, User, Clock, Calendar, History } from 'lucide-react';
import Button from '../../../../components/ui/Button';
import Textarea from '../../../../components/ui/Textarea';
import type { DoiThuNhatKy } from '../core/types';
import { useNhatKy, useThemNhatKy } from '../hooks/use-phan-tich-doi-thu';
import { formatDateShort } from '../../../../lib/utils';
import { BTN_ADD } from '../../../../lib/button-labels';
import EmptyState from '../../../../components/shared/EmptyState';

const todayYYYYMMDD = () => new Date().toISOString().slice(0, 10);

interface Props {
  doiThuId: string;
}

const TabNhatKy: React.FC<Props> = ({ doiThuId }) => {
  const { t } = useTranslation();
  const { data: logs = [], isLoading } = useNhatKy(doiThuId);
  const themMutation = useThemNhatKy(doiThuId);
  const [noiDung, setNoiDung] = useState('');
  const [ngay, setNgay] = useState(todayYYYYMMDD);

  const handleThem = () => {
    const trimmed = noiDung.trim();
    if (!trimmed) return;
    themMutation.mutate(
      { noi_dung: trimmed, nguoi_tao: 'User', ngay: ngay || todayYYYYMMDD() },
      {
        onSuccess: () => {
          setNoiDung('');
          setNgay(todayYYYYMMDD());
        },
      }
    );
  };

  return (
    <div className="w-full bg-card p-3.5 sm:p-4 md:p-5 rounded-xl border border-border shadow-sm space-y-3">
      {/* Header chuẩn generic: icon + title + count */}
      <div className="flex items-center gap-3 pb-2 sm:pb-2.5">
        <div className="flex items-center gap-2 shrink-0">
          <History size={14} className="text-primary" />
          <h4 className="text-[11px] sm:text-xs font-semibold uppercase tracking-wider text-primary font-bold">
            {t('phanTichDoiThu.tab.nhatKy')}
          </h4>
          {!isLoading && (
            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium tabular-nums bg-primary/10 text-primary border border-primary/20">
              {logs.length}
            </span>
          )}
        </div>
        <div className="flex-1 self-center h-px border-b border-dashed border-border/80 mx-1" aria-hidden />
      </div>

      {/* Form thêm ghi chú */}
      <div className="rounded-lg border border-border bg-muted/20 p-3 sm:p-4">
        <p className="text-xs font-medium text-muted-foreground mb-2">{t('phanTichDoiThu.detail.ghiChuNhanh')}</p>
        <div className="flex flex-col sm:flex-row gap-3 sm:items-stretch">
          <div className="flex flex-col gap-1.5 sm:w-[150px] sm:shrink-0">
            <label className="text-xs font-medium text-muted-foreground flex items-center gap-1">
              <Calendar size={12} />
              {t('phanTichDoiThu.detail.ngayNhatKy')}
            </label>
            <input
              type="date"
              value={ngay}
              onChange={(e) => setNgay(e.target.value)}
              className="h-10 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground"
            />
          </div>
          <div className="flex-1 flex flex-col gap-1.5 min-w-0">
            <label className="text-xs font-medium text-muted-foreground">{t('phanTichDoiThu.detail.noiDung')}</label>
            <Textarea
              value={noiDung}
              onChange={(e) => setNoiDung(e.target.value)}
              placeholder={t('phanTichDoiThu.detail.ghiChuNhanh')}
              rows={3}
              className="min-h-[72px] resize-y flex-1 w-full border border-border rounded-lg"
            />
          </div>
          <div className="flex sm:items-end shrink-0">
            <Button
              type="button"
              onClick={handleThem}
              disabled={!noiDung.trim() || themMutation.isPending}
              className="w-full sm:w-auto h-10 sm:h-auto bg-primary text-white hover:bg-primary/90"
            >
              <Send size={14} className="mr-1.5" /> {BTN_ADD()}
            </Button>
          </div>
        </div>
      </div>

      {/* Nội dung: loading / empty / timeline */}
      {isLoading ? (
        <div className="py-8 flex justify-center">
          <div className="h-8 w-8 rounded-full border-2 border-primary/30 border-t-primary animate-spin" />
        </div>
      ) : logs.length === 0 ? (
        <EmptyState
          title={t('phanTichDoiThu.detail.nhatKyEmpty')}
          description={t('phanTichDoiThu.detail.nhatKyEmptyHint')}
          icon={<History className="w-10 h-10 text-muted-foreground" />}
        />
      ) : (
        <ul className="relative pt-1">
          <div className="absolute left-4 top-4 bottom-4 w-0.5 bg-border rounded-full" aria-hidden />
          {logs.map((log: DoiThuNhatKy) => (
            <li key={log.id} className="relative flex gap-4 pb-4 last:pb-0">
              <div className="relative z-[1] flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center border-2 border-background shadow-sm mt-0.5">
                <User size={14} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="rounded-xl border border-border bg-muted/20 overflow-hidden hover:bg-muted/30 transition-colors">
                  <div className="p-3">
                    <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">{log.noi_dung}</p>
                    <div className="flex items-center gap-3 mt-2 pt-2 border-t border-border/60 flex-wrap">
                      <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                        <Calendar size={10} />
                        {formatDateShort(log.ngay || log.tg_tao)}
                      </span>
                      <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                        <User size={10} />
                        {log.nguoi_tao}
                      </span>
                      <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                        <Clock size={10} />
                        {formatDateShort(log.tg_tao)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default TabNhatKy;
