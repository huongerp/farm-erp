
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Database, Download, Trash2, Filter } from 'lucide-react';
import Button from '../../../../components/ui/Button';
import { useBackupStore } from '../store/useBackupStore';
import GenericToolbar from '../../../../components/shared/GenericToolbar';

interface Props {
  onAdd: () => void;
  onDeleteMany: (ids: string[]) => void;
}

const BackupToolbar: React.FC<Props> = ({ onAdd, onDeleteMany }) => {
  const { t } = useTranslation();
  const { 
    searchTerm, setSearchTerm, 
    filters, setFilter, 
    columns, toggleColumn, reorderColumns, resetColumns,
    selectedIds, clearSelection
  } = useBackupStore();

  const renderFilters = (
    <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
        <select 
            value={filters.loai_sao_luu}
            onChange={(e) => setFilter('loai_sao_luu', e.target.value)}
            className="h-9 px-3 text-sm border border-border rounded-lg bg-background text-foreground hover:border-primary/50 outline-none cursor-pointer min-w-[140px]"
        >
            <option value="All">{t('backup.toolbar.allTypes')}</option>
            <option value="Full">{t('backup.toolbar.typeSystem')}</option>
            <option value="Database">{t('backup.toolbar.typeDatabase')}</option>
            <option value="Assets">{t('backup.toolbar.typeFiles')}</option>
        </select>

        <select 
            value={filters.trang_thai}
            onChange={(e) => setFilter('trang_thai', e.target.value)}
            className="h-9 px-3 text-sm border border-border rounded-lg bg-background text-foreground hover:border-primary/50 outline-none cursor-pointer min-w-[140px]"
        >
            <option value="All">{t('backup.toolbar.allStatuses')}</option>
            <option value="Success">{t('backup.toolbar.statusSuccess')}</option>
            <option value="Failed">{t('backup.toolbar.statusFailed')}</option>
            <option value="Pending">{t('backup.toolbar.statusProcessing')}</option>
        </select>
    </div>
  );

  const renderActions = (
    <Button onClick={onAdd} size="sm" className="bg-foreground text-background hover:bg-foreground/90 shadow-md h-9 px-4">
        <Database className="w-4 h-4 mr-2" /> {t('backup.toolbar.createButton')}
    </Button>
  );

  return (
    <GenericToolbar
        selectedCount={selectedIds.size}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        onClearSelection={clearSelection}
        actions={renderActions}
        filters={renderFilters}
        onDeleteMany={() => onDeleteMany(Array.from(selectedIds))}
        columns={columns}
        onToggleColumn={toggleColumn}
        onReorderColumns={reorderColumns}
        onResetColumns={resetColumns}
    />
  );
};

export default BackupToolbar;
