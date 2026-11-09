import React from 'react';
import { useTranslation } from 'react-i18next';
import { Plus } from 'lucide-react';
import GenericToolbar from '../../../../components/shared/GenericToolbar';
import Button from '../../../../components/ui/Button';
import { useChecklistMauStore } from '../store/useChecklistMauStore';

interface Props {
  selectedCount: number;
  onAdd: () => void;
  canCreate: boolean;
}

const ChecklistMauToolbar: React.FC<Props> = ({ selectedCount, onAdd, canCreate }) => {
  const { t } = useTranslation();
  const { searchTerm, setSearchTerm, clearSelection, columns, toggleColumn, reorderColumns, resetColumns, resetColumnWidths } =
    useChecklistMauStore();

  const actions = canCreate ? (
    <Button
      size="sm"
      onClick={onAdd}
      className="bg-primary text-white shadow-lg shadow-primary/20 hover:bg-primary/90 gap-1.5"
    >
      <Plus size={15} />
      <span className="hidden md:inline">{t('common.addNew')}</span>
    </Button>
  ) : undefined;

  return (
    <GenericToolbar
      selectedCount={selectedCount}
      searchTerm={searchTerm}
      onSearchChange={setSearchTerm}
      onClearSelection={clearSelection}
      actions={actions}
      columns={columns}
      onToggleColumn={toggleColumn}
      onReorderColumns={reorderColumns}
      onResetColumns={resetColumns}
      onResetColumnWidths={resetColumnWidths}
      onAdd={canCreate ? onAdd : undefined}
    />
  );
};

export default ChecklistMauToolbar;
