
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Shield, Users, Edit, Trash2, ShieldCheck, ShieldAlert, Building2 } from 'lucide-react';
import { PositionPermission } from '../core/types';
import { TRANG_THAI_HOAT_DONG } from '../../../../lib/constants';
import { useRoleStore } from '../store/useRoleStore';
import GenericTable from '../../../../components/shared/GenericTable';

interface Props {
  data: PositionPermission[];
  isLoading: boolean;
  onEdit: (item: PositionPermission) => void;
  onDelete: (id: string) => void;
}

const RoleTable: React.FC<Props> = ({ data, isLoading, onEdit, onDelete }) => {
  const { t } = useTranslation();
  const { 
    columns, resizeColumn, pagination, setPage, setPageSize,
    selectedIds, toggleSelection, toggleAllSelection 
  } = useRoleStore();

  const renderStatusBadge = (item: PositionPermission) =>
    item.trang_thai === TRANG_THAI_HOAT_DONG.DANG_HOAT_DONG ? (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-medium border border-primary/20"><ShieldCheck size={12}/> {t('permission.active')}</span>
    ) : (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-muted text-muted-foreground text-xs font-medium border border-border"><ShieldAlert size={12}/> {t('permission.inactive')}</span>
    );

  const renderCell = (colId: string, item: PositionPermission) => {
    switch (colId) {
        case 'vai_tro':
            return (
                <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${item.ma_chuc_vu.includes('ADMIN') || item.ma_chuc_vu === 'CEO' ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}`}>
                        <Shield size={18} />
                    </div>
                    <div className="flex flex-col min-w-0">
                        <span className="font-semibold text-foreground text-sm truncate">{item.ten_chuc_vu}</span>
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-mono">
                            {item.ma_chuc_vu}
                        </div>
                    </div>
                </div>
            );
        case 'mo_ta':
            return (
                <div className="flex flex-col gap-1.5">
                    <div className="flex items-center gap-1.5 text-body-sm font-medium text-muted-foreground">
                        <Building2 size={12} className="text-muted-foreground" />
                        {item.ten_phong_ban}
                    </div>
                    <div className="flex gap-1.5 flex-wrap">
                        {item.quyen_han.slice(0, 3).map(p => {
                            const hasAdmin = p.actions.includes('admin') || p.actions.includes('all');
                            return (
                                <span key={p.module_id} className={`text-xs px-1.5 py-0.5 rounded font-medium border ${hasAdmin ? 'bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 border-amber-100 dark:border-amber-900' : 'bg-primary/10 text-primary border-primary/20'}`}>
                                    {t(p.module_name)} {hasAdmin && '★'}
                                </span>
                            );
                        })}
                        {item.quyen_han.length > 3 && <span className="text-xs text-muted-foreground font-medium">+{item.quyen_han.length - 3}</span>}
                    </div>
                </div>
            );
        case 'thong_ke':
            return (
                <div className="flex items-center gap-1.5 text-body-sm font-medium text-foreground">
                    <Users size={14} className="text-muted-foreground" />
                    <span>{t('permission.staffCount', { count: item.so_nhan_vien })}</span>
                </div>
            );
        case 'trang_thai':
            return renderStatusBadge(item);
        case 'actions':
            return (
                <div className="flex items-center justify-center gap-1">
                    <button onClick={(e) => { e.stopPropagation(); onEdit(item); }} aria-label={t('common.edit')} className="p-2 text-muted-foreground hover:text-primary hover:bg-primary/5 rounded-lg transition-all"><Edit size={16} /></button>
                    <button onClick={(e) => { e.stopPropagation(); onDelete(item.id); }} aria-label={t('common.delete')} className="p-2 text-muted-foreground hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition-all"><Trash2 size={16} /></button>
                </div>
            );
        default: return null;
    }
  };

  const renderMobileCard = (item: PositionPermission, isSelected: boolean) => (
      <div key={item.id} className={`bg-card rounded-xl border p-3.5 shadow-sm transition-all ${isSelected ? 'border-primary ring-2 ring-primary/10' : 'border-border'}`}>
            <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                    <h4 className="font-semibold text-foreground text-sm truncate">{item.ten_chuc_vu}</h4>
                    <p className="text-xs text-muted-foreground truncate mt-0.5">
                        <span className="font-mono">{item.ma_chuc_vu}</span>
                        {item.ten_phong_ban ? ` · ${item.ten_phong_ban}` : ''}
                    </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                    {renderStatusBadge(item)}
                    <input type="checkbox" checked={isSelected} onChange={() => toggleSelection(item.id)} className="w-4 h-4 rounded border-border text-primary accent-primary cursor-pointer" aria-label={t('common.select')} />
                </div>
            </div>
            <div className="flex justify-between items-center gap-3 mt-2.5 pt-2.5 border-t border-border">
                 <div className="flex items-center gap-1.5 text-sm font-semibold text-foreground"><Users size={14} className="text-muted-foreground" /> {t('permission.staffCount', { count: item.so_nhan_vien })}</div>
                 <div className="flex gap-3">
                    <button onClick={() => onEdit(item)} aria-label={t('common.edit')} className="h-10 w-10 flex items-center justify-center text-primary bg-primary/5 hover:bg-primary/10 rounded-lg transition-all active:scale-90"><Edit size={16} /></button>
                    <button onClick={() => onDelete(item.id)} aria-label={t('common.delete')} className="h-10 w-10 flex items-center justify-center text-rose-500 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/30 dark:hover:bg-rose-950/50 rounded-lg transition-all active:scale-90"><Trash2 size={16} /></button>
                 </div>
            </div>
      </div>
  );

  return (
    <GenericTable
        data={data}
        columns={columns}
        onResizeColumn={resizeColumn}
        isLoading={isLoading}
        loadingText={t('permission.matrix.loading')}
        selectedIds={selectedIds}
        onToggleSelection={toggleSelection}
        onToggleAll={toggleAllSelection}
        page={pagination.page}
        pageSize={pagination.pageSize}
        onPageChange={setPage}
        onPageSizeChange={setPageSize}
        renderCell={renderCell}
        renderMobileCard={renderMobileCard}
        keyExtractor={item => item.id}
    />
  );
};

export default RoleTable;
