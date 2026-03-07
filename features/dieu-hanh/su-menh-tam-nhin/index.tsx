/**
 * Trang Sứ mệnh & Tầm nhìn: 2 cột – trái: Sứ mệnh, Tầm nhìn, Phiên bản; phải: Giá trị cốt lõi (chi tiết).
 * Nút sửa theo ngữ cảnh: cột trái = Sửa Sứ mệnh & Tầm nhìn, cột phải = Sửa Giá trị cốt lõi.
 * Phần Tầm nhìn quy mô & Thị phần nằm ở module riêng: tam-nhin-quy-mo-thi-phan.
 */
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { AnimatePresence } from 'framer-motion';
import DashboardToolbar from '../../../components/shared/DashboardToolbar';
import EmptyState from '../../../components/shared/EmptyState';
import { useSuMenhTamNhin } from './hooks/use-su-menh-tam-nhin';
import MissionVisionSection from './components/MissionVisionSection';
import DinhViSection from './components/DinhViSection';
import ValuesDetailSection from './components/ValuesDetailSection';
import MetaBlockSection from './components/MetaBlockSection';
import EditMissionVisionDrawer from './components/EditMissionVisionDrawer';
import EditDinhViDrawer from './components/EditDinhViDrawer';
import EditValuesDrawer from './components/EditValuesDrawer';

const SuMenhTamNhinPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { data, isLoading } = useSuMenhTamNhin();
  const [showMissionVisionDrawer, setShowMissionVisionDrawer] = useState(false);
  const [showDinhViDrawer, setShowDinhViDrawer] = useState(false);
  const [showValuesDrawer, setShowValuesDrawer] = useState(false);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[40vh]">
        <div className="h-10 w-10 rounded-full border-2 border-primary/30 border-t-primary animate-spin" aria-label={t('common.loading')} />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="max-w-4xl mx-auto">
        <DashboardToolbar onBack={() => navigate('/dieu-hanh')} />
        <EmptyState title={t('suMenhTamNhin.title')} description={t('suMenhTamNhin.loadError')} />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100dvh-3.75rem)] md:h-[calc(100dvh-4.5rem)] min-h-0">
      <DashboardToolbar
        onBack={() => navigate('/dieu-hanh')}
        leadingContent={
          <div className="flex flex-col gap-0.5 min-w-0">
            <h1 className="text-base sm:text-lg font-bold tracking-tight text-foreground truncate">
              {t('suMenhTamNhin.title')}
            </h1>
            <p className="text-xs text-muted-foreground line-clamp-2">
              {t('suMenhTamNhin.description')}
            </p>
          </div>
        }
      />

      <div className="flex-1 min-h-0 flex flex-col md:flex-row gap-3 sm:gap-4 p-2.5 sm:p-3 md:p-4 overflow-hidden">
        {/* Cột trái: 2 widget trên chia đều chiều cao (full page), Phiên bản cố định dưới */}
        <div className="w-full md:w-[44%] lg:w-[40%] xl:w-[38%] flex flex-col gap-3 sm:gap-4 min-h-0 shrink-0 md:min-w-0">
          <div className="min-h-0 flex flex-col gap-3 sm:gap-4 md:flex-1">
            <MissionVisionSection
              mission={data.su_menh}
              vision={data.tam_nhin}
              onEdit={() => setShowMissionVisionDrawer(true)}
            />
            <DinhViSection data={data.dinh_vi} onEdit={() => setShowDinhViDrawer(true)} />
          </div>
          <MetaBlockSection ngayHieuLuc={data.ngay_hieu_luc} nguoiDuyet={data.nguoi_duyet} />
        </div>

        {/* Cột phải: Giá trị cốt lõi – widget tự cuộn dọc khi nội dung tràn */}
        <div className="flex-1 min-h-0 min-w-0 flex flex-col w-full md:min-h-[320px]">
          <ValuesDetailSection values={data.gia_tri} onEdit={() => setShowValuesDrawer(true)} />
        </div>
      </div>

      <AnimatePresence>
        {showMissionVisionDrawer && (
          <EditMissionVisionDrawer
            initialMission={data.su_menh}
            initialVision={data.tam_nhin}
            onClose={() => setShowMissionVisionDrawer(false)}
          />
        )}
        {showDinhViDrawer && (
          <EditDinhViDrawer data={data.dinh_vi} onClose={() => setShowDinhViDrawer(false)} />
        )}
        {showValuesDrawer && (
          <EditValuesDrawer values={data.gia_tri} onClose={() => setShowValuesDrawer(false)} />
        )}
      </AnimatePresence>
    </div>
  );
};

export default SuMenhTamNhinPage;
