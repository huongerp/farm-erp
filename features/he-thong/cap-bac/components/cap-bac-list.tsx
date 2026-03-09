import React from 'react';
import { useTranslation } from 'react-i18next';
import { Edit, Trash2, Layers, ChevronRight } from 'lucide-react';
import LoadingSpinnerWithText from '../../../../components/shared/LoadingSpinnerWithText';
import { JobLevel } from '../core/types';
import { TRANG_THAI_HOAT_DONG } from '../../../../lib/constants';

interface Props {
  data: JobLevel[];
  isLoading: boolean;
  onEdit: (item: JobLevel) => void;
  onDelete: (id: string) => void;
  onViewDetail: (item: JobLevel) => void;
}

const JobLevelList: React.FC<Props> = ({ data, isLoading, onEdit, onDelete, onViewDetail }) => {
  const { t } = useTranslation();
  if (isLoading) {
    return (
      <div className="w-full h-64 flex items-center justify-center bg-card rounded-xl border border-border shadow-soft">
        <LoadingSpinnerWithText text={t('jobLevel.loading')} centered />
      </div>
    );
  }

  if (data.length === 0) {
    return (
        <div className="w-full h-64 flex flex-col items-center justify-center border border-border rounded-xl bg-card shadow-soft p-4 text-center">
            <div className="bg-muted p-6 rounded-full mb-4">
                <Layers className="w-10 h-10 text-muted-foreground" />
            </div>
            <h3 className="text-foreground font-semibold text-lg">{t('jobLevel.empty')}</h3>
            <p className="text-sm text-muted-foreground mt-1">{t('jobLevel.emptyHint')}</p>
        </div>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-card shadow-soft overflow-hidden">
      <div className="overflow-x-auto custom-scrollbar">
        <table className="w-full text-sm text-left">
          <thead className="bg-muted/80 border-b border-border">
            <tr>
              <th className="px-6 py-4 text-xs font-semibold text-muted-foreground w-[100px]">{t('jobLevel.order')}</th>
              <th className="px-6 py-4 text-xs font-semibold text-muted-foreground w-[250px]">{t('jobLevel.name')}</th>
              <th className="px-6 py-4 text-xs font-semibold text-muted-foreground">{t('common.description')}</th>
              <th className="px-6 py-4 text-xs font-semibold text-muted-foreground w-[150px]">{t('common.status')}</th>
              <th className="px-6 py-4 text-xs font-semibold text-muted-foreground w-[100px] text-right">{t('common.actions')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border [&>tr:last-child>td]:border-b [&>tr:last-child>td]:border-border">
            {data.map((item) => (
                <tr
                    key={item.id}
                    onClick={() => onViewDetail(item)}
                    className="group hover:bg-muted/80 transition-colors cursor-pointer relative"
                >
                  <td className="px-6 py-3.5">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-bold border border-primary/20 group-hover:bg-card group-hover:shadow-sm transition-all">
                        {item.cap_bac}
                    </div>
                  </td>
                  <td className="px-6 py-3.5">
                    <span className="font-bold text-foreground group-hover:text-primary transition-colors">{item.ten_cap_bac}</span>
                  </td>
                  <td className="px-6 py-3.5 text-muted-foreground truncate max-w-[200px]" title={item.mo_ta || ''}>
                     {item.mo_ta || <span className="text-muted-foreground/60 italic">--</span>}
                  </td>
                  <td className="px-6 py-3.5">
                     {item.trang_thai === TRANG_THAI_HOAT_DONG.DANG_HOAT_DONG ? (
                         <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary ring-1 ring-inset ring-primary/20">
                             <span className="w-1.5 h-1.5 rounded-full bg-primary"></span> {t('jobLevel.active')}
                         </span>
                     ) : (
                         <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-muted text-muted-foreground ring-1 ring-inset ring-border">
                             <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground"></span> {t('jobLevel.inactive')}
                         </span>
                     )}
                  </td>
                  <td className="px-6 py-3.5 text-right">
                    <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onEdit(item);
                        }}
                        className="p-1.5 text-primary hover:bg-primary/10 rounded-lg transition-colors active:scale-95"
                        title={t('common.edit')}
                      >
                          <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onDelete(item.id);
                        }}
                        className="p-1.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg transition-colors active:scale-95"
                        title={t('common.delete')}
                      >
                          <Trash2 className="h-4 w-4" />
                      </button>
                      <ChevronRight className="h-4 w-4 text-muted-foreground ml-1" />
                    </div>
                  </td>
                </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default JobLevelList;
