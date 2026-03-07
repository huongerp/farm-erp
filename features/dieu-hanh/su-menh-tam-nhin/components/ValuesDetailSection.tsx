import React from 'react';
import { useTranslation } from 'react-i18next';
import { Heart, Target, ThumbsUp, ThumbsDown, Edit } from 'lucide-react';
import Button from '../../../../components/ui/Button';
import type { CoreValue } from '../core/types';

interface Props {
  values: CoreValue[];
  onEdit?: () => void;
}

const ValuesDetailSection: React.FC<Props> = ({ values, onEdit }) => {
  const { t } = useTranslation();
  const sorted = [...(values ?? [])].sort((a, b) => a.thu_tu - b.thu_tu);
  const isEmpty = !sorted.length;

  return (
    <div className="w-full flex-1 min-h-0 bg-card rounded-xl border border-border shadow-sm overflow-hidden flex flex-col">
      <div className="shrink-0 px-3 sm:px-4 pt-2.5 sm:pt-3 pb-1.5 sm:pb-2 border-b border-primary/20 flex items-center justify-between gap-2 bg-card">
        <h4 className="text-[10px] sm:text-[11px] font-semibold uppercase tracking-wider flex items-center gap-1.5 text-primary font-bold min-w-0 truncate">
          <Heart size={12} className="shrink-0" />
          <span className="truncate">{t('suMenhTamNhin.coreValues')}</span>
        </h4>
        {onEdit && (
          <Button size="icon" variant="ghost" onClick={onEdit} className="h-7 w-7 shrink-0 text-primary hover:bg-primary/10" aria-label={t('suMenhTamNhin.edit')} title={t('suMenhTamNhin.edit')}>
            <Edit size={12} />
          </Button>
        )}
      </div>
      <div className="flex-1 min-h-0 overflow-y-auto overflow-x-auto custom-scrollbar p-3 sm:p-4 md:p-5 pt-2.5 sm:pt-3">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
        {isEmpty ? (
          <p className="text-sm text-muted-foreground p-4 rounded-lg border border-dashed border-border text-center col-span-full">
            {t('suMenhTamNhin.emptyValues')}
          </p>
        ) : (
          sorted.map((v) => (
            <div
              key={v.id}
              className="p-4 rounded-xl border border-border bg-card shadow-sm space-y-3"
            >
              <h4 className="text-sm font-semibold text-foreground">{v.ten}</h4>
              {v.mo_ta && (
                <p className="text-sm text-muted-foreground">{v.mo_ta}</p>
              )}
              {v.mo_dich && (
                <div className="flex gap-2">
                  <Target size={14} className="shrink-0 mt-0.5 text-primary" />
                  <div>
                    <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      {t('suMenhTamNhin.purpose')}
                    </span>
                    <p className="text-sm text-foreground mt-0.5">{v.mo_dich}</p>
                  </div>
                </div>
              )}
              {(v.hanh_vi_nen_lam?.length ?? 0) > 0 && (
                <div className="flex gap-2">
                  <ThumbsUp size={14} className="shrink-0 mt-0.5 text-emerald-600 dark:text-emerald-400" />
                  <div className="min-w-0 flex-1">
                    <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      {t('suMenhTamNhin.behaviorsToDo')}
                    </span>
                    <ul className="mt-1 space-y-1">
                      {v.hanh_vi_nen_lam!.map((item, i) => (
                        <li key={i} className="text-sm text-foreground flex items-start gap-1.5">
                          <span className="text-emerald-600 dark:text-emerald-400 mt-0.5">•</span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
              {(v.hanh_vi_khong_nen_lam?.length ?? 0) > 0 && (
                <div className="flex gap-2">
                  <ThumbsDown size={14} className="shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
                  <div className="min-w-0 flex-1">
                    <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      {t('suMenhTamNhin.behaviorsNotToDo')}
                    </span>
                    <ul className="mt-1 space-y-1">
                      {v.hanh_vi_khong_nen_lam!.map((item, i) => (
                        <li key={i} className="text-sm text-foreground flex items-start gap-1.5">
                          <span className="text-amber-600 dark:text-amber-400 mt-0.5">•</span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
        </div>
      </div>
    </div>
  );
};

export default ValuesDetailSection;
