import React from 'react';
import { useTranslation } from 'react-i18next';
import { FileText } from 'lucide-react';
import GenericDrawer from '../../../../components/shared/GenericDrawer';
import { useThuChiDrillDown } from '../hooks/use-ke-hoach-chi-phi';
import { formatCurrency } from '../../../../lib/utils';
import { formatDateTimeShort } from '../../../../lib/utils';

interface TransactionDrillDownProps {
  nam: number;
  thang: number;
  idDanhMuc: string;
  tenDanhMuc: string;
  onClose: () => void;
}

const TransactionDrillDown: React.FC<TransactionDrillDownProps> = ({
  nam,
  thang,
  idDanhMuc,
  tenDanhMuc,
  onClose,
}) => {
  const { t } = useTranslation();
  const { data: transactions = [], isLoading } = useThuChiDrillDown(nam, thang, idDanhMuc);

  return (
    <GenericDrawer
      title={t('keHoachChiPhi.drillDown.title')}
      subtitle={`${tenDanhMuc} — T${thang}/${nam}`}
      icon={<FileText size={20} />}
      onClose={onClose}
    >
      {isLoading ? (
        <p className="text-sm text-muted-foreground py-4">{t('common.loading')}</p>
      ) : transactions.length === 0 ? (
        <p className="text-sm text-muted-foreground py-4">{t('keHoachChiPhi.drillDown.empty')}</p>
      ) : (
        <div className="space-y-2">
          {transactions.map((gd) => (
            <div
              key={gd.id}
              className="flex items-start justify-between gap-3 p-3 rounded-lg border border-border bg-card"
            >
              <div className="min-w-0 flex-1">
                <p className="font-medium text-sm font-mono text-foreground">{gd.ma_giao_dich}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{gd.noi_dung}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {formatDateTimeShort(gd.ngay_giao_dich)}
                  {gd.ten_nhan_vien && ` · ${gd.ten_nhan_vien}`}
                </p>
              </div>
              <span className="text-sm font-semibold tabular-nums text-rose-600 dark:text-rose-400 shrink-0">
                {formatCurrency(gd.so_tien)}
              </span>
            </div>
          ))}
        </div>
      )}
    </GenericDrawer>
  );
};

export default TransactionDrillDown;
