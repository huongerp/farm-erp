import React from 'react';
import { useTranslation } from 'react-i18next';
import { Construction } from 'lucide-react';

/**
 * Tab placeholder cho Thiết lập đào tạo — chức năng sẽ xây dựng sau.
 */
const TabPlaceholderDaoTao: React.FC = () => {
  const { t } = useTranslation();

  return (
    <div className="flex-1 min-h-0 flex flex-col rounded-xl border border-border bg-card shadow-sm overflow-hidden">
      <div className="flex-1 flex items-center justify-center p-8 bg-muted/20">
        <div className="max-w-md w-full text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-muted border border-border mb-4">
            <Construction size={28} className="text-muted-foreground" />
          </div>
          <p className="text-muted-foreground text-body">
            {t('thietLapDaoTao.placeholder.description')}
          </p>
        </div>
      </div>
    </div>
  );
};

export default TabPlaceholderDaoTao;
