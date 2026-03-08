import React from 'react';
import { useTranslation } from 'react-i18next';
import { Edit, Trash2, Power, Award } from 'lucide-react';
import { JobLevel } from '../core/types';
import { useJobLevelStore } from '../store/useJobLevelStore';
import GenericTable from '../../../../components/shared/GenericTable';
import { TRANG_THAI_HOAT_DONG } from '../../../../lib/constants';

interface Props {
  data: JobLevel[];
  isLoading: boolean;
  onEdit: (item: JobLevel) => void;
  onDelete: (id: string) => void;
  onStatusChange: (item: JobLevel) => void;
  onView?: (item: JobLevel) => void;
}

const JobLevelTable: React.FC<Props> = ({ data, isLoading, onEdit, onDelete, onStatusChange, onView }) => {
  const handleRowAction = onView ?? onEdit;
  const { t } = useTranslation();
  const {
    columns, pagination, setPage, setPageSize,
    selectedIds, toggleSelection, toggleAllSelection,
    sort, setSort
  } = useJobLevelStore();

  const renderStatusBadge = (status: string) => {
      return status === TRANG_THAI_HOAT_DONG.DANG_HOAT_DONG ? (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary border border-primary/20">{t('jobLevel.active')}</span>
    ) : (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-muted text-muted-foreground border border-border">{t('jobLevel.inactive')}</span>
    );
  };

  const renderCell = (colId: string, item: JobLevel) => {
    switch (colId) {
        case 'cap_bac':
            return (
                <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-muted text-foreground font-semibold text-xs border border-border">
                    {item.cap_bac}
                </div>
            );
        case 'ten_cap_bac':
            return (
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-md bg-primary/10 text-primary">
                  <Award size={14} />
                </div>
                <span className="font-semibold text-foreground">{item.ten_cap_bac}</span>
              </div>
            );
        case 'mo_ta':
            return (
                <div className="truncate max-w-[250px] text-body-sm text-muted-foreground italic" title={item.mo_ta || ''}>
                    {item.mo_ta || <span className="text-muted-foreground">{t('jobLevel.noDescription')}</span>}
                </div>
            );
        case 'trang_thai':
            return renderStatusBadge(item.trang_thai);
        case 'tg_cap_nhat':
            return (
                <span className="text-body-sm text-muted-foreground">
                    {item.tg_cap_nhat ? new Date(item.tg_cap_nhat).toLocaleDateString() : '—'}
                </span>
            );
        case 'actions':
            return (
                <div className="flex items-center justify-center gap-1">
                    <button
                        onClick={(e) => { e.stopPropagation(); onStatusChange(item); }}
                        className={`p-2 rounded-lg transition-all ${item.trang_thai === TRANG_THAI_HOAT_DONG.DANG_HOAT_DONG ? 'text-primary hover:bg-primary/10' : 'text-muted-foreground hover:bg-muted'}`}
                    >
                        <Power size={16} />
                    </button>
                    <button
                        onClick={(e) => { e.stopPropagation(); onEdit(item); }}
                        className="p-2 text-primary hover:bg-primary/10 rounded-lg transition-all"
                    >
                        <Edit size={16} />
                    </button>
                    <button
                        onClick={(e) => { e.stopPropagation(); onDelete(item.id); }}
                        className="p-2 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-lg transition-all"
                    >
                        <Trash2 size={16} />
                    </button>
                </div>
            );
        default:
            return null;
    }
  };

  const renderMobileCard = (item: JobLevel, isSelected: boolean) => (
      <div
        key={item.id}
        onClick={() => handleRowAction(item)}
        className={`bg-card rounded-xl border p-4 shadow-sm transition-all ${isSelected ? 'border-primary ring-2 ring-primary/10' : 'border-border'}`}
    >
            <div className="flex items-start gap-4">
                <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-semibold border border-primary/20 shrink-0">
                    {item.cap_bac}
                </div>
                <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start mb-1">
                        <h4 className="font-semibold text-foreground truncate">{item.ten_cap_bac}</h4>
                        <div onClick={e => e.stopPropagation()}>
                            <input type="checkbox" checked={isSelected} onChange={() => toggleSelection(item.id)} className="w-5 h-5 rounded border-border text-primary accent-primary" />
                        </div>
                    </div>
                    <div className="flex items-center gap-2 mb-3">
                        <span className="text-xs font-mono bg-muted text-muted-foreground px-1.5 py-0.5 rounded border border-border">
                        {t('jobLevel.form.order')}: {item.cap_bac}
                        </span>
                        <div className="w-1 h-1 bg-border rounded-full"></div>
                        {renderStatusBadge(item.trang_thai)}
                    </div>
                    <div className="flex justify-end gap-2">
                        <button onClick={e => { e.stopPropagation(); onEdit(item); }} className="p-2 text-primary bg-primary/10 rounded-xl"><Edit size={16} /></button>
                        <button onClick={e => { e.stopPropagation(); onDelete(item.id); }} className="p-2 text-red-500 bg-red-50 dark:bg-red-950/30 rounded-xl"><Trash2 size={16} /></button>
                    </div>
                </div>
            </div>
    </div>
  );

  return (
    <GenericTable
        data={data}
        columns={columns}
        isLoading={isLoading}
        loadingText={t('jobLevel.loading')}
        selectedIds={selectedIds}
        onToggleSelection={toggleSelection}
        onToggleAll={toggleAllSelection}
        page={pagination.page}
        pageSize={pagination.pageSize}
        onPageChange={setPage}
        onPageSizeChange={setPageSize}
        sort={sort}
        onSort={setSort}
        renderCell={renderCell}
        renderMobileCard={renderMobileCard}
        onRowClick={(item) => handleRowAction(item)}
        keyExtractor={(item) => item.id}
    />
  );
};

export default JobLevelTable;
