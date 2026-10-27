import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { MapPinned, MessageSquareText, Palette, Settings } from 'lucide-react';
import GenericDrawer from '../../../../../components/shared/GenericDrawer';
import TabGroup from '../../../../../components/ui/TabGroup';
import Button from '../../../../../components/ui/Button';
import { DIALOG_SIZE } from '../../../../../lib/dialog-sizes';
import MauDayTab from './MauDayTab';
import LoThuHoachTab from './LoThuHoachTab';
import LyDoTab from './LyDoTab';

export type TabCaiDatDgdv = 'mau-day' | 'lo' | 'ly-do';

interface Props {
  initialTab?: TabCaiDatDgdv;
  onClose: () => void;
}

/** Cài đặt danh mục Đánh giá đầu vào — chỉ mở cho cấp cao / quản trị module (RLS migration 052 mục 7). */
const CaiDatDialog: React.FC<Props> = ({ initialTab = 'mau-day', onClose }) => {
  const { t } = useTranslation();
  const [tab, setTab] = useState<TabCaiDatDgdv>(initialTab);

  return (
    <GenericDrawer
      title={t('danhGiaDauVao.caiDat.title')}
      subtitle={t('danhGiaDauVao.caiDat.subtitle')}
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
            { id: 'mau-day', label: t('danhGiaDauVao.caiDat.tabMauDay'), icon: Palette },
            { id: 'lo', label: t('danhGiaDauVao.caiDat.tabLo'), icon: MapPinned },
            { id: 'ly-do', label: t('danhGiaDauVao.caiDat.tabLyDo'), icon: MessageSquareText },
          ]}
          activeTab={tab}
          onChange={(id) => setTab(id as TabCaiDatDgdv)}
        />
        {tab === 'mau-day' && <MauDayTab />}
        {tab === 'lo' && <LoThuHoachTab />}
        {tab === 'ly-do' && <LyDoTab />}
      </div>
    </GenericDrawer>
  );
};

export default CaiDatDialog;
