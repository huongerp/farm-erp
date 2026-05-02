import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus } from 'lucide-react';
import Button from '../../../../components/ui/Button';
import GenericToolbar from '../../../../components/shared/GenericToolbar';
import { useGenericToolbarSearch } from '../../../../lib/hooks/use-generic-toolbar-search';
import { useFarmDanhMucStore } from '../store/useFarmDanhMucStore';

interface Props {
  selectedCount: number;
  onAdd: () => void;
  onDeleteMany: () => void;
  canCreate?: boolean;
  canDelete?: boolean;
}

const DanhMucToolbar: React.FC<Props> = ({
  selectedCount,
  onAdd,
  onDeleteMany,
  canCreate = true,
  canDelete = true,
}) => {
  const { t } = useTranslation();
  const { searchInput, setSearchInput, commitSearchTerm } = useGenericToolbarSearch(useFarmDanhMucStore);
  const clearSelection = useFarmDanhMucStore((s) => s.clearSelection);
  const columns = useFarmDanhMucStore((s) => s.columns);
  const toggleColumn = useFarmDanhMucStore((s) => s.toggleColumn);
  const reorderColumns = useFarmDanhMucStore((s) => s.reorderColumns);
  const resetColumns = useFarmDanhMucStore((s) => s.resetColumns);

  const activeFilterCount = useMemo(() => (searchInput.trim() ? 1 : 0), [searchInput]);

  const handleClearAllFilters = () => {
    commitSearchTerm('');
  };

  const renderActions = canCreate ? (
    <Button
      onClick={onAdd}
      size="sm"
      className="bg-primary text-white hover:bg-primary/90 shadow-md shadow-primary/20 h-9 px-3 sm:px-4"
    >
      <Plus className="w-5 h-5 sm:w-4 sm:h-4 sm:mr-2" />
      <span className="hidden sm:inline">{t('common.addNew')}</span>
    </Button>
  ) : null;

  return (
    <GenericToolbar
      selectedCount={selectedCount}
      onDeleteMany={canDelete ? onDeleteMany : undefined}
      searchTerm={searchInput}
      onSearchChange={setSearchInput}
      onClearSelection={clearSelection}
      actions={renderActions}
      onAdd={canCreate ? onAdd : undefined}
      showBack
      searchPlaceholder={t('farmHangHoaPhanThuoc.danhMuc.searchPlaceholder')}
      activeFilterCount={activeFilterCount}
      onClearAllFilters={handleClearAllFilters}
      columns={columns}
      onToggleColumn={toggleColumn}
      onReorderColumns={reorderColumns}
      onResetColumns={resetColumns}
    />
  );
};

export default DanhMucToolbar;
