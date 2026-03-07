import React from 'react';
import { useTranslation } from 'react-i18next';
import { Edit, Trash2, Briefcase } from 'lucide-react';
import LoadingSpinnerWithText from '../../../../components/shared/LoadingSpinnerWithText';
import { Position } from '../core/types';
import { TRANG_THAI } from '../../../../lib/constants';

interface Props {
  data: Position[];
  isLoading: boolean;
  onEdit: (item: Position) => void;
  onDelete: (id: string) => void;
}

const PositionList: React.FC<Props> = ({ data, isLoading, onEdit, onDelete }) => {
  const { t } = useTranslation();

  if (isLoading) {
    return (
      <div className="w-full h-64 flex items-center justify-center bg-card rounded-xl border border-border shadow-soft">
        <LoadingSpinnerWithText text={t('position.loading')} centered />
      </div>
    );
  }

  if (data.length === 0) {
    return (
        <div className="w-full h-64 flex flex-col items-center justify-center border border-border rounded-xl bg-card shadow-soft p-4 text-center">
            <div className="bg-muted p-6 rounded-full mb-4">
                <Briefcase className="w-10 h-10 text-muted-foreground" />
            </div>
            <h3 className="text-foreground font-semibold text-lg">{t('position.empty')}</h3>
            <p className="text-sm text-muted-foreground mt-1">{t('position.emptyHint')}</p>
        </div>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-card shadow-soft overflow-hidden">
      <div className="overflow-x-auto custom-scrollbar">
        <table className="w-full text-sm text-left">
          <thead className="bg-muted/80 border-b border-border">
            <tr>
              <th className="px-6 py-4 text-xs font-semibold text-muted-foreground w-[250px]">{t('position.name')}</th>
              <th className="px-6 py-4 text-xs font-semibold text-muted-foreground w-[150px]">{t('position.code')}</th>
              <th className="px-6 py-4 text-xs font-semibold text-muted-foreground">{t('common.description')}</th>
              <th className="px-6 py-4 text-xs font-semibold text-muted-foreground w-[150px]">{t('common.status')}</th>
              <th className="px-6 py-4 text-xs font-semibold text-muted-foreground w-[100px] text-right">{t('common.actions')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border [&>tr:last-child>td]:border-b [&>tr:last-child>td]:border-border">
            {data.map((pos) => (
                <tr key={pos.id} className="group hover:bg-muted/50 transition-colors">
                  <td className="px-6 py-3.5">
                    <span className="font-medium text-foreground">{pos.ten_chuc_vu}</span>
                  </td>
                  <td className="px-6 py-3.5">
                     <span className="font-mono text-xs font-semibold text-muted-foreground bg-muted px-2 py-1 rounded border border-border">
                        {pos.ma_chuc_vu ?? '—'}
                     </span>
                  </td>
                  <td className="px-6 py-3.5 text-muted-foreground truncate max-w-[200px]" title={pos.mo_ta || ''}>
                     {pos.mo_ta || <span className="text-muted-foreground italic">{t('common.noDescription')}</span>}
                  </td>
                  <td className="px-6 py-3.5">
                     {pos.trang_thai === TRANG_THAI.DANG_DUNG ? (
                         <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary ring-1 ring-inset ring-primary/20">
                             <span className="w-1.5 h-1.5 rounded-full bg-primary"></span> {t('position.active')}
                         </span>
                     ) : (
                         <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-muted text-muted-foreground ring-1 ring-inset ring-border">
                             <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground"></span> {t('position.inactive')}
                         </span>
                     )}
                  </td>
                  <td className="px-6 py-3.5 text-right">
                    <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={() => onEdit(pos)} 
                        className="p-1.5 text-primary hover:bg-primary/10 rounded-lg transition-colors active:scale-95"
                        title={t('common.edit')}
                      >
                          <Edit className="h-4 w-4" />
                      </button>
                      <button 
                        onClick={() => onDelete(pos.id)} 
                        className="p-1.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg transition-colors active:scale-95"
                        title={t('common.delete')}
                      >
                          <Trash2 className="h-4 w-4" />
                      </button>
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

export default PositionList;
