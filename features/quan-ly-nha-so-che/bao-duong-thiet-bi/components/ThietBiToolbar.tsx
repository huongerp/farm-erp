import React from 'react';
import { useTranslation } from 'react-i18next';
import { Plus } from 'lucide-react';
import Button from '../../../../components/ui/Button';
import GenericToolbar from '../../../../components/shared/GenericToolbar';
import { useGenericToolbarSearch } from '../../../../lib/hooks/use-generic-toolbar-search';
import { useThietBiStore } from '../store/useBaoDuongThietBiStore';

interface Props {
  selectedCount: number;
  onAdd: () => void;
  canUpdate: boolean;
}

const ThietBiToolbar: React.FC<Props> = ({ selectedCount, onAdd, canUpdate }) => {
  const { t } = useTranslation();
  const { searchInput, setSearchInput } = useGenericToolbarSearch(useThietBiStore);
  const clearSelection = useThietBiStore((s) => s.clearSelection);
  const columns = useThietBiStore((s) => s.columns);
  const toggleColumn = useThietBiStore((s) => s.toggleColumn);
  const reorderColumns = useThietBiStore((s) => s.reorderColumns);
  const resetColumns = useThietBiStore((s) => s.resetColumns);
  const resetColumnWidths = useThietBiStore((s) => s.resetColumnWidths);

  const actions = canUpdate ? (
    <Button onClick={onAdd} size="sm" className="bg-primary text-white hover:bg-primary/90 shadow-md shadow-primary/20 h-9 px-3 sm:px-4">
      <Plus className="w-5 h-5 sm:w-4 sm:h-4 sm:mr-2" />
      <span className="hidden sm:inline">{t('baoDuongThietBi.thietBi.add')}</span>
    </Button>
  ) : undefined;

  return (
    <GenericToolbar
      selectedCount={selectedCount}
      searchTerm={searchInput}
      onSearchChange={setSearchInput}
      onClearSelection={clearSelection}
      actions={actions}
      onAdd={canUpdate ? onAdd : undefined}
      columns={columns}
      onToggleColumn={toggleColumn}
      onReorderColumns={reorderColumns}
      onResetColumns={resetColumns}
      onResetColumnWidths={resetColumnWidths}
      showBack
    />
  );
};

export default ThietBiToolbar;
