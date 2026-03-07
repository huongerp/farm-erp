import React from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Plus } from 'lucide-react';
import Button from '../../../../components/ui/Button';
import GenericToolbar from '../../../../components/shared/GenericToolbar';
import { BTN_ADD } from '../../../../lib/button-labels';
import { useNhomHanhDongStore } from '../store/useNhomHanhDongStore';
import type { NhomHanhDong } from '../core/types';

interface Props {
  data: NhomHanhDong[];
  onAdd: () => void;
}

const ThietLapNhomHanhDongToolbar: React.FC<Props> = ({ onAdd }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const {
    searchTerm,
    setSearchTerm,
    columns,
    toggleColumn,
    reorderColumns,
    resetColumns,
  } = useNhomHanhDongStore();

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
      searchPlaceholder={t('hanhDongCotLoi.thietLap.searchPlaceholder')}
      onAdd={onAdd}
      columns={columns}
      onToggleColumn={toggleColumn}
      onReorderColumns={reorderColumns}
      onResetColumns={resetColumns}
    />
  );
};

export default ThietLapNhomHanhDongToolbar;
