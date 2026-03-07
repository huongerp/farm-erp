
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Download, Trash2, FileArchive, Database, HardDrive, Clock, User, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { BackupRecord } from '../core/types';
import { useBackupStore } from '../store/useBackupStore';
import GenericTable from '../../../../components/shared/GenericTable';
import { formatDateTime, formatTimeDateShort, cn } from '../../../../lib/utils';

interface Props {
    data: BackupRecord[];
    isLoading: boolean;
    onDelete: (id: string) => void;
}

const BackupTable: React.FC<Props> = ({ data, isLoading, onDelete }) => {
    const { t } = useTranslation();
    const {
        columns, pagination, setPage, setPageSize,
        selectedIds, toggleSelection, toggleAllSelection
    } = useBackupStore();

    const getStatusBadge = (status: number) => {
        switch (status) {
            case 1: return <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary border border-primary/20"><CheckCircle2 size={12} /> {t('backup.statusSuccess')}</span>;
            case 2: return <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary border border-primary/20"><Loader2 size={12} className="animate-spin" /> {t('backup.statusProcessing')}</span>;
            default: return <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-rose-50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-400 border border-rose-100 dark:border-rose-900"><AlertCircle size={12} /> {t('backup.statusFailed')}</span>;
        }
    };

    const getIcon = (type: string) => {
        switch (type) {
            case 'Full': return <div className="p-2 rounded-lg bg-primary/10 text-primary"><FileArchive size={18} /></div>;
            case 'Database': return <div className="p-2 rounded-lg bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400"><Database size={18} /></div>;
            default: return <div className="p-2 rounded-lg bg-muted text-muted-foreground"><HardDrive size={18} /></div>;
        }
    };

    const renderCell = (colId: string, item: BackupRecord) => {
        switch (colId) {
            case 'ten_file':
                return (
                    <div className="flex items-center gap-3">
                        {getIcon(item.loai_sao_luu)}
                        <div className="flex flex-col min-w-0">
                            <span className="font-semibold text-foreground text-sm truncate">{item.ten_file}</span>
                            <span className="font-mono text-xs text-muted-foreground">{item.id}</span>
                        </div>
                    </div>
                );
            case 'loai_dung_luong':
                return (
                    <div className="flex flex-col">
                        <span className="text-body-sm font-medium text-foreground">{item.loai_sao_luu === 'Full' ? t('backup.typeFull') : item.loai_sao_luu === 'Database' ? t('backup.typeDatabase') : t('backup.typeFiles')}</span>
                        <span className="text-xs text-muted-foreground">{t('backup.sizeLabel')} {item.dung_luong}</span>
                    </div>
                );
            case 'thoi_gian':
                return (
                    <div className="flex flex-col gap-0.5">
                        <div className="flex items-center gap-1.5 text-body-sm font-medium text-foreground">
                            <Clock size={12} className="text-muted-foreground" /> {formatDateTime(item.tg_tao)}
                        </div>
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <User size={10} /> {item.ten_nguoi_thuc_hien}
                        </div>
                    </div>
                );
            case 'trang_thai':
                return getStatusBadge(item.trang_thai);
            case 'actions':
                return (
                    <div className="flex items-center justify-center gap-1">
                        <button className="p-2 text-muted-foreground hover:text-primary hover:bg-primary/5 rounded-lg transition-all"><Download size={16} /></button>
                        <button onClick={(e) => { e.stopPropagation(); onDelete(item.id); }} className="p-2 text-muted-foreground hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition-all"><Trash2 size={16} /></button>
                    </div>
                );
            default:
                return null;
        }
    };

    const renderMobileCard = (item: BackupRecord, isSelected: boolean) => (
        <div key={item.id} className={cn(
            "bg-card rounded-xl border p-4 shadow-sm transition-all",
            isSelected ? 'border-primary ring-2 ring-primary/10 shadow-lg' : 'border-border'
        )}>
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-4">
                    <div className="relative">
                        {getIcon(item.loai_sao_luu)}
                    </div>
                    <div className="flex flex-col min-w-0">
                        <h4 className="font-semibold text-foreground text-sm truncate max-w-[150px]">{item.ten_file}</h4>
                        <p className="text-xs text-muted-foreground mt-0.5">ID: {item.id.substring(0, 8)}...</p>
                    </div>
                </div>
                <div onClick={e => e.stopPropagation()}>
                    <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleSelection(item.id)}
                        className="w-5 h-5 rounded-lg border-2 border-border text-primary accent-primary cursor-pointer transition-all"
                    />
                </div>
            </div>
            <div className="grid grid-cols-2 gap-3 mb-5">
                <div className="bg-muted/50 p-3 rounded-xl border border-border/60">
                    <p className="text-xs text-muted-foreground mb-1">{t('backup.sizeMobile')}</p>
                    <p className="text-body-sm font-medium text-foreground">{item.dung_luong}</p>
                </div>
                <div className="bg-muted/50 p-3 rounded-xl border border-border/60">
                    <p className="text-xs text-muted-foreground mb-1">{t('backup.timeMobile')}</p>
                    <p className="text-body-sm font-medium text-foreground">{formatTimeDateShort(item.tg_tao)}</p>
                </div>
            </div>
            <div className="flex justify-between items-center pt-2">
                {getStatusBadge(item.trang_thai)}
                <div className="flex gap-2.5">
                    <button className="p-2.5 text-primary bg-primary/5 hover:bg-primary/10 rounded-xl transition-all active:scale-90"><Download size={16} className="stroke-[2.5px]" /></button>
                    <button onClick={() => onDelete(item.id)} className="p-2.5 text-rose-500 bg-rose-50 dark:bg-rose-950/30 hover:bg-rose-100 dark:hover:bg-rose-950/50 rounded-xl transition-all active:scale-90"><Trash2 size={16} className="stroke-[2.5px]" /></button>
                </div>
            </div>
        </div>
    );

    return (
        <GenericTable
            data={data}
            columns={columns}
            isLoading={isLoading}
            loadingText={t('backup.loading')}
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

export default BackupTable;
