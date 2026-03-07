import React from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Plus } from 'lucide-react';
import Button from '../../../../components/ui/Button';
import GenericToolbar from '../../../../components/shared/GenericToolbar';
import { BTN_ADD } from '../../../../lib/button-labels';
import { useCachTinhDiemStore } from '../store/useCachTinhDiemStore';

interface Props {
  onAdd: () => void;
}

const ThietLapCachTinhDiemToolbar: React.FC<Props> = ({ onAdd }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const {
    searchTerm,
    setSearchTerm,
    columns,
    toggleColumn,
    reorderColumns,
    resetColumns,
  } = useCachTinhDiemStore();

  const renderActions = (
    <Button
      onClick={onAdd}
      size="sm"
      className="bg-primary text-white hover:bg-primary/90 shadow-md shadow-primary/20 h-9 px-3 sm:px-4"
    >
      <Plus className="w-5 h-5 sm:w-4 sm:h-4 sm:mr-2" />
      <span className="hidden sm:inline">{BTN_ADD()}</span>
    </Button>
  );

  return (
    <GenericToolbar
      selectedCount={0}
      onClearSelection={() => {}}
      searchTerm={searchTerm}
      onSearchChange={setSearchTerm}
      actions={renderActions}
      showBack={true}
      onBack={() => navigate('/dieu-hanh')}
      searchPlaceholder={t('tieuChiKpi.thietLapCtd.searchPlaceholder')}
      onAdd={onAdd}
      columns={columns}
      onToggleColumn={toggleColumn}
      onReorderColumns={reorderColumns}
      onResetColumns={resetColumns}
    />
  );
};

export default ThietLapCachTinhDiemToolbar;
