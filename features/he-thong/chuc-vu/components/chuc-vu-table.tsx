
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Edit, Trash2, Power, Briefcase, Building2, UserCircle } from 'lucide-react';
import { Position } from '../core/types';
import { usePositionStore } from '../store/usePositionStore';
import GenericTable from '../../../../components/shared/GenericTable';
import { formatDateShort } from '../../../../lib/utils';
import { TRANG_THAI_HOAT_DONG } from '../../../../lib/constants';

interface Props {
  data: Position[];
  isLoading: boolean;
  onEdit: (item: Position) => void;
  onDelete: (id: string) => void;
  onStatusChange: (item: Position) => void;
  /** Khi có: click row mở detail; không có: click row mở form sửa */
  onView?: (item: Position) => void;
}

const PositionTable: React.FC<Props> = ({ data, isLoading, onEdit, onDelete, onStatusChange, onView }) => {
  const { t } = useTranslation();
  const { 
    columns, pagination, setPage, setPageSize,
    selectedIds, toggleSelection, toggleAllSelection,
    sort, setSort
  } = usePositionStore();

  const renderStatusBadge = (status: string) => {
      return status === TRANG_THAI_HOAT_DONG.DANG_HOAT_DONG ? (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary border border-primary/20">{t('position.active')}</span>
    ) : (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-muted text-muted-foreground border border-border">{t('position.inactive')}</span>
    );
  };

  const renderCell = (colId: string, item: Position) => {
    switch (colId) {
        case 'thu_tu':
            return <span className="text-sm font-medium text-muted-foreground">{item.tt}</span>;
        case 'ma_chuc_vu':
            return (
                <div className="flex flex-col gap-0.5 min-w-[180px]">
                    <div className="flex items-center gap-2">
                         <div className="p-1.5 rounded-lg bg-primary/10 text-primary">
                             <Briefcase size={14} />
                         </div>
                         <span className="font-semibold text-foreground text-sm">{item.ten_chuc_vu}</span>
                    </div>
                    {item.ma_chuc_vu && (
                      <span className="font-mono text-xs text-muted-foreground pl-9">{item.ma_chuc_vu}</span>
                    )}
                </div>
            );
        case 'ten_chuc_vu':
            return <span className="font-semibold text-foreground">{item.ten_chuc_vu}</span>;
        case 'ten_cap_bac':
            return (
                <div className="flex flex-col gap-0.5">
                    <span className="text-body-sm font-medium text-foreground">{item.ten_cap_bac || t('position.noDescription')}</span>
                    <span className="text-xs text-muted-foreground">{t('position.subtitle')}</span>
                </div>
            );
        case 'ten_phong_ban':
            return (
                <div className="flex items-center gap-2">
                    <Building2 size={14} className="text-muted-foreground" />
                    <span className="text-sm font-medium text-muted-foreground">{item.ten_phong_ban || '--'}</span>
                </div>
            );
        case 'mo_ta':
            return (
                <div className="truncate max-w-[200px] text-body-sm text-muted-foreground italic" title={item.mo_ta || ''}>
                    {item.mo_ta || <span className="text-muted-foreground">{t('position.noDescFull')}</span>}
                </div>
            );
        case 'trang_thai':
            return renderStatusBadge(item.trang_thai);
        case 'tg_cap_nhat':
            return (
              <span className="text-xs text-muted-foreground">{formatDateShort(item.tg_cap_nhat)}</span>
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
                        className="p-2 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg transition-all"
                    >
                        <Trash2 size={16} />
                    </button>
                </div>
            );
        default:
            return null;
    }
  };

  const handleRowAction = onView ?? onEdit;

  const renderMobileCard = (item: Position, isSelected: boolean) => (
      <div 
        key={item.id}
        onClick={(e) => { e.stopPropagation(); handleRowAction(item); }} 
        className={`bg-card rounded-xl border p-4 shadow-sm transition-all ${isSelected ? 'border-primary ring-2 ring-primary/10' : 'border-border'}`}
    >
            <div className="flex items-start gap-4">
                <div className="p-3 rounded-xl bg-primary/10 text-primary border border-primary/20">
                    <Briefcase size={20} />
                </div>
                <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start mb-1">
                        <h4 className="font-semibold text-foreground truncate">{item.ten_chuc_vu}</h4>
                        <div onClick={e => e.stopPropagation()}>
                            <input type="checkbox" checked={isSelected} onChange={() => toggleSelection(item.id)} className="w-5 h-5 rounded border-border text-primary accent-primary" />
                        </div>
                    </div>
                    {item.ma_chuc_vu && <p className="text-xs text-muted-foreground font-mono mb-3">{item.ma_chuc_vu}</p>}
                    
                    <div className="grid grid-cols-2 gap-2 mb-4">
                        <div className="p-2 bg-muted rounded-xl border border-border">
                            <p className="text-xs text-muted-foreground mb-0.5">{t('position.form.department')}</p>
                            <p className="text-body-sm font-medium text-foreground truncate">{item.ten_phong_ban}</p>
                        </div>
                        <div className="p-2 bg-muted rounded-xl border border-border">
                            <p className="text-xs text-muted-foreground mb-0.5">{t('common.status')}</p>
                            <div className="scale-90 origin-left">{renderStatusBadge(item.trang_thai)}</div>
                        </div>
                    </div>

                    <div className="flex justify-between items-center pt-3 border-t border-border">
                        <div className="flex items-center gap-1.5 text-xs font-medium text-primary">
                            <UserCircle size={12} />
                            {item.ten_cap_bac}
                        </div>
                        <div className="flex gap-2">
                            <button onClick={e => { e.stopPropagation(); onEdit(item); }} className="p-2 text-primary bg-primary/10 rounded-xl"><Edit size={16} /></button>
                            <button onClick={e => { e.stopPropagation(); onDelete(item.id); }} className="p-2 text-red-500 bg-red-50 dark:bg-red-950/30 rounded-xl"><Trash2 size={16} /></button>
                        </div>
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
        loadingText={t('position.loading')}
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

export default PositionTable;
