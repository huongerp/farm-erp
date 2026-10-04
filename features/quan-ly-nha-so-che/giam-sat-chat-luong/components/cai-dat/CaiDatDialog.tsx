import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ListChecks, Settings, Tag } from 'lucide-react';
import GenericDrawer from '../../../../../components/shared/GenericDrawer';
import TabGroup from '../../../../../components/ui/TabGroup';
import Button from '../../../../../components/ui/Button';
import { DIALOG_SIZE } from '../../../../../lib/dialog-sizes';
import TieuChiTab from './TieuChiTab';
import MauTemTab from './MauTemTab';

export type TabCaiDat = 'tieu-chi' | 'mau-tem';

interface Props {
  /** Cấp cao mới sửa được danh mục tiêu chí (dùng chung cho mọi người). */
  canEditTieuChi: boolean;
  initialTab?: TabCaiDat;
  onClose: () => void;
}

const CaiDatDialog: React.FC<Props> = ({ canEditTieuChi, initialTab = 'tieu-chi', onClose }) => {
  const { t } = useTranslation();
  const [tab, setTab] = useState<TabCaiDat>(initialTab);

  return (
    <GenericDrawer
      title={t('giamSatChatLuong.caiDat.title')}
      subtitle={t('giamSatChatLuong.caiDat.subtitle')}
      icon={<Settings className="text-primary" size={22} />}
      onClose={onClose}
      variant="modal"
      maxWidthClass={DIALOG_SIZE.LARGE}
      footer={
        <div className="flex justify-end w-full">
          <Button type="button" size="sm" onClick={onClose}>
            {t('common.close')}
          </Button>
        </div>
      }
    >
      <div className="space-y-4">
        <TabGroup
          tabs={[
            { id: 'tieu-chi', label: t('giamSatChatLuong.caiDat.tabTieuChi'), icon: ListChecks },
            { id: 'mau-tem', label: t('giamSatChatLuong.caiDat.tabMauTem'), icon: Tag },
          ]}
          activeTab={tab}
          onChange={(id) => setTab(id as TabCaiDat)}
        />
        {tab === 'tieu-chi' ? <TieuChiTab canEdit={canEditTieuChi} /> : <MauTemTab />}
      </div>
    </GenericDrawer>
  );
};

export default CaiDatDialog;
