import React from 'react';
import { useTranslation } from 'react-i18next';
import { Edit, Trash2, Wallet, Building2, Hash, User, Calendar } from 'lucide-react';
import Button from '../../../../components/ui/Button';
import { formatCurrency, formatDateTimeShort } from '../../../../lib/utils';
import type { TaiKhoan } from '../../core/types';
import { formatCurrencyWithColor } from '../utils/currencyColors';
import GenericDrawer, { DRAWER_WIDTH_DETAIL } from '../../../../components/shared/GenericDrawer';
import DetailSection from '../../../../components/shared/DetailSection';
import DetailField from '../../../../components/shared/DetailField';
import DetailFieldGrid from '../../../../components/shared/DetailFieldGrid';
import { BTN_CLOSE, BTN_EDIT, BTN_DELETE } from '../../../../lib/button-labels';

interface Props {
  data: TaiKhoan;
  onClose: () => void;
  onEdit: (item: TaiKhoan) => void;
  onDelete: (id: string) => void;
  /** Optional: VietQR component when type is bank (injected from parent to avoid circular deps) */
  vietQRNode?: React.ReactNode;
}

const TaiKhoanDetail: React.FC<Props> = ({
  data,
  onClose,
  onEdit,
  onDelete,
  vietQRNode,
}) => {
  const { t } = useTranslation();
  const isActive = data.trang_thai === 1;
  const isBank = data.loai_tai_khoan === 'ngan_hang';

  const renderFooter = (
    <div className="flex items-center justify-between w-full">
      <Button
        variant="ghost"
        onClick={onClose}
        className="text-muted-foreground hover:text-foreground border border-border"
      >
        {BTN_CLOSE()}
      </Button>
      <div className="flex items-center gap-3">
        <Button
          onClick={() => {
            onEdit(data);
            onClose();
          }}
          className="bg-primary text-white shadow-lg hover:bg-primary/90"
        >
          <Edit size={16} className="mr-2" /> {BTN_EDIT()}
        </Button>
        <Button
          variant="ghost"
          onClick={() => {
            onDelete(data.id);
            onClose();
          }}
          className="text-rose-600 hover:bg-rose-50 hover:text-rose-700 dark:hover:bg-rose-950/50 dark:text-rose-400 border border-rose-200 hover:border-rose-300 dark:border-rose-800 dark:hover:border-rose-700"
        >
          <Trash2 size={16} className="mr-2" /> {BTN_DELETE()}
        </Button>
      </div>
    </div>
  );

  return (
    <GenericDrawer
      title={t('taiKhoan.detail.title')}
      subtitle={data.so_tai_khoan || data.ten_tai_khoan}
      icon={<Wallet size={18} />}
      onClose={onClose}
      footer={renderFooter}
      maxWidthClass={DRAWER_WIDTH_DETAIL}
    >
      <div className="space-y-5">
        <div className="bg-card p-4 rounded-xl border border-border/50 shadow-sm flex items-center gap-4">
          <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center text-white shadow-primary/20 shadow-lg shrink-0">
            <Wallet size={24} className="text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-base font-bold text-foreground leading-tight truncate">
              {data.ten_tai_khoan}
            </h2>
            <p className="text-body-sm text-muted-foreground font-mono mt-0.5">
              {data.so_tai_khoan || '—'}
            </p>
            <div className="mt-1.5 flex flex-wrap gap-2">
              <span
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${
                  isBank
                    ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20'
                    : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20'
                }`}
              >
                {isBank ? t('taiKhoan.loaiNganHang') : t('taiKhoan.loaiTienMat')}
              </span>
              {isActive ? (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-medium border border-primary/20">
                  {t('common.activeStatus')}
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-muted text-muted-foreground text-xs font-medium border border-border">
                  {t('common.inactiveStatus')}
                </span>
              )}
            </div>
          </div>
        </div>

        <DetailSection title={t('taiKhoan.detail.basicInfo')} icon={<Wallet size={14} />} variant="primary">
          <DetailFieldGrid>
            <DetailField
              label={t('taiKhoan.form.tenTaiKhoan')}
              value={data.ten_tai_khoan}
              icon={<Wallet size={12} />}
            />
            <DetailField
              label={t('taiKhoan.columns.soTaiKhoan')}
              value={data.so_tai_khoan || '—'}
              icon={<Hash size={12} />}
            />
            {isBank && (
              <>
                <DetailField
                  label={t('taiKhoan.columns.nganHang')}
                  value={data.ngan_hang || '—'}
                  icon={<Building2 size={12} />}
                />
                <DetailField
                  label={t('taiKhoan.columns.chuTaiKhoan')}
                  value={data.chu_tai_khoan || '—'}
                  icon={<User size={12} />}
                />
              </>
            )}
          </DetailFieldGrid>
        </DetailSection>

        <DetailSection
          title={t('taiKhoan.detail.soDuSection')}
          icon={<Wallet size={14} />}
          variant="primary"
        >
          <DetailFieldGrid>
            <DetailField
              label={t('taiKhoan.detail.tonDau')}
              value={formatCurrencyWithColor(data.so_du_dau ?? 0, formatCurrency, 'balance')}
              icon={<Wallet size={12} />}
            />
            <DetailField
              label={t('taiKhoan.detail.tongThu')}
              value={formatCurrencyWithColor(data.tong_thu ?? 0, formatCurrency, 'income')}
              icon={<Wallet size={12} />}
            />
            <DetailField
              label={t('taiKhoan.detail.tongChi')}
              value={formatCurrencyWithColor(data.tong_chi ?? 0, formatCurrency, 'expense')}
              icon={<Wallet size={12} />}
            />
            <DetailField
              label={t('taiKhoan.detail.duCuoi')}
              value={formatCurrencyWithColor(data.so_du_cuoi ?? 0, formatCurrency, 'balance')}
              icon={<Wallet size={12} />}
            />
          </DetailFieldGrid>
        </DetailSection>

        {isBank && (
          <DetailSection
            title={t('taiKhoan.detail.vietQR')}
            icon={<Wallet size={14} />}
            variant="primary"
          >
            {vietQRNode ?? (
              <p className="text-sm text-muted-foreground">
                {t('taiKhoan.detail.vietQRConfigHint')}
              </p>
            )}
          </DetailSection>
        )}

        <DetailSection title={t('taiKhoan.detail.systemInfo')} icon={<Calendar size={14} />} variant="primary">
          <DetailFieldGrid>
            <DetailField
              label={t('taiKhoan.detail.updatedAt')}
              value={formatDateTimeShort(data.tg_cap_nhat)}
              icon={<Calendar size={12} />}
            />
          </DetailFieldGrid>
        </DetailSection>
      </div>
    </GenericDrawer>
  );
};

export default TaiKhoanDetail;
