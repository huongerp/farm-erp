import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Briefcase, Settings } from 'lucide-react';
import GenericDrawer from '../../../../../components/shared/GenericDrawer';
import TabGroup from '../../../../../components/ui/TabGroup';
import Button from '../../../../../components/ui/Button';
import { DIALOG_SIZE } from '../../../../../lib/dialog-sizes';
import ViTriTab from './ViTriTab';

/** Tab cài đặt — hiện chỉ có Vị trí, giữ kiểu union để sau thêm tab khác. */
export type TabCaiDat = 'vi-tri';

interface Props {
  onClose: () => void;
}

const CaiDatDialog: React.FC<Props> = ({ onClose }) => {
  const { t } = useTranslation();
  const [tab, setTab] = useState<TabCaiDat>('vi-tri');

  return (
    <GenericDrawer
      title={t('baoCaoNhanCong.caiDat.title')}
      subtitle={t('baoCaoNhanCong.caiDat.subtitle')}
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
          tabs={[{ id: 'vi-tri', label: t('baoCaoNhanCong.caiDat.tabViTri'), icon: Briefcase }]}
          activeTab={tab}
          onChange={(id) => setTab(id as TabCaiDat)}
        />
        {tab === 'vi-tri' && <ViTriTab />}
      </div>
    </GenericDrawer>
  );
};

export default CaiDatDialog;
