/**
 * Kế hoạch đào tạo – trang trung tâm liên kết với Khóa đào tạo.
 * Phần kế hoạch chi tiết (năm, quý, ngân sách) có thể mở rộng sau.
 */
import React from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { GraduationCap, ArrowRight, Construction } from 'lucide-react';
import DashboardToolbar from '../../../components/shared/DashboardToolbar';

const KeHoachDaoTaoPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  return (
    <div className="flex flex-col h-[calc(100dvh-3.75rem)] md:h-[calc(100dvh-4.5rem)]">
      <DashboardToolbar className="static z-auto" />

      <div className="flex-1 min-h-0 overflow-y-auto p-3 sm:p-4 space-y-4">
        <p className="text-sm text-muted-foreground">{t('keHoachDaoTao.description')}</p>

        <div
          role="button"
          tabIndex={0}
          onClick={() => navigate('/nhan-su/khoa-dao-tao')}
          onKeyDown={(e) => e.key === 'Enter' && navigate('/nhan-su/khoa-dao-tao')}
          className="flex items-center gap-4 p-4 rounded-xl border border-border bg-card hover:bg-muted/30 hover:border-primary/30 transition-colors cursor-pointer group"
        >
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 group-hover:bg-emerald-500/20">
            <GraduationCap size={24} />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-foreground">{t('keHoachDaoTao.linkKhoaDaoTao')}</h3>
            <p className="text-sm text-muted-foreground mt-0.5">{t('keHoachDaoTao.linkKhoaHint')}</p>
          </div>
          <ArrowRight size={20} className="text-muted-foreground group-hover:text-primary shrink-0" />
        </div>

        <div className="flex items-center gap-3 p-4 rounded-xl border border-dashed border-border bg-muted/20">
          <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center shrink-0">
            <Construction size={20} className="text-muted-foreground" />
          </div>
          <p className="text-sm text-muted-foreground">{t('keHoachDaoTao.placeholder')}</p>
        </div>
      </div>
    </div>
  );
};

export default KeHoachDaoTaoPage;
