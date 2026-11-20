import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Briefcase, Coins, Settings } from 'lucide-react';
import GenericDrawer from '../../../../../components/shared/GenericDrawer';
import TabGroup from '../../../../../components/ui/TabGroup';
import Button from '../../../../../components/ui/Button';
import { DIALOG_SIZE } from '../../../../../lib/dialog-sizes';
import ViTriTab from './ViTriTab';
import HeSoThuongVuotTab from './HeSoThuongVuotTab';

export type TabCaiDat = 'vi-tri' | 'he-so-vuot';

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
          tabs={[
            { id: 'vi-tri', label: t('baoCaoNhanCong.caiDat.tabViTri'), icon: Briefcase },
            { id: 'he-so-vuot', label: t('baoCaoNhanCong.vuot.tabCaiDat'), icon: Coins },
          ]}
          activeTab={tab}
          onChange={(id) => setTab(id as TabCaiDat)}
        />
        {tab === 'vi-tri' && <ViTriTab />}
        {tab === 'he-so-vuot' && <HeSoThuongVuotTab />}
      </div>
    </GenericDrawer>
  );
};

export default CaiDatDialog;
