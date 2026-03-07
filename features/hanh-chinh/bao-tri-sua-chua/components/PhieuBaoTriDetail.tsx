import React from 'react';
import { useTranslation } from 'react-i18next';
import { Wrench, Edit, Trash2, User, FileText, Calendar } from 'lucide-react';
import GenericDrawer, { DRAWER_WIDTH_DETAIL } from '../../../../components/shared/GenericDrawer';
import DetailSection from '../../../../components/shared/DetailSection';
import DetailField from '../../../../components/shared/DetailField';
import Button from '../../../../components/ui/Button';
import { BTN_CLOSE, BTN_EDIT, BTN_DELETE } from '../../../../lib/button-labels';
import { formatDateTimeShort, formatDate } from '../../../../lib/utils';
import type { PhieuBaoTriSuaChua } from '../core/types';
import { getHangMucLabel } from '../core/constants';

interface Props {
  data: PhieuBaoTriSuaChua;
  onClose: () => void;
  onEdit?: (item: PhieuBaoTriSuaChua) => void;
  onDelete?: (id: string) => void;
}

const PhieuBaoTriDetail: React.FC<Props> = ({ data, onClose, onEdit, onDelete }) => {
  const { t } = useTranslation();

  const footer = (
    <div className="flex items-center justify-between w-full flex-wrap gap-2">
      <Button variant="ghost" onClick={onClose} className="text-muted-foreground hover:text-foreground border border-border">
        {BTN_CLOSE()}
      </Button>
      <div className="flex items-center gap-3">
        {onEdit && (
          <Button
            onClick={() => {
              onClose();
              onEdit(data);
            }}
            className="bg-primary text-white shadow-lg hover:bg-primary/90"
          >
            <Edit size={16} className="mr-2" />
            {BTN_EDIT()}
          </Button>
        )}
        {onDelete && (
          <Button
            variant="ghost"
            onClick={() => {
              onDelete(data.id);
              onClose();
            }}
            className="text-rose-600 hover:bg-rose-50 hover:text-rose-700 dark:hover:bg-rose-950/50 dark:text-rose-400 border border-rose-200 hover:border-rose-300 dark:border-rose-800 dark:hover:border-rose-700"
          >
            <Trash2 size={16} className="mr-2" />
            {BTN_DELETE()}
          </Button>
        )}
      </div>
    </div>
  );

  return (
    <GenericDrawer
      title={t('baoTriSuaChua.detail.title')}
      icon={<Wrench size={20} />}
      subtitle={`${getHangMucLabel(data.hang_muc, t)} • ${data.ma_tai_san ?? data.id_tai_san}`}
      onClose={onClose}
      footer={footer}
      maxWidthClass={DRAWER_WIDTH_DETAIL}
    >
      <div className="space-y-5">
        <DetailSection
          title={t('baoTriSuaChua.detail.sectionGeneral')}
          icon={<Wrench size={18} />}
          variant="primary"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <DetailField label={t('baoTriSuaChua.store.hangMucCol')} value={getHangMucLabel(data.hang_muc, t)} />
            <DetailField label={t('baoTriSuaChua.store.taiSanCol')} value={data.ten_tai_san || data.ma_tai_san || '—'} />
            <DetailField label={t('baoTriSuaChua.store.ngayYeuCauCol')} value={formatDate(data.ngay_yeu_cau)} />
            <DetailField label={t('baoTriSuaChua.store.ngayHenCol')} value={formatDate(data.ngay_hen)} />
            <DetailField
              label={t('baoTriSuaChua.store.trangThaiCol')}
              value={data.trang_thai === 1 ? t('baoTriSuaChua.statusCompleted') : t('baoTriSuaChua.statusPending')}
            />
            <DetailField label={t('baoTriSuaChua.store.updatedCol')} value={formatDateTimeShort(data.tg_cap_nhat)} />
          </div>
        </DetailSection>

        <DetailSection
          title={t('baoTriSuaChua.detail.sectionPeople')}
          icon={<User size={18} />}
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <DetailField label={t('baoTriSuaChua.store.nguoiTaoCol')} value={data.ten_nguoi_tao || '—'} />
            <DetailField label={t('baoTriSuaChua.store.nguoiPhuTrachCol')} value={data.ten_nguoi_phu_trach || '—'} />
          </div>
        </DetailSection>

        <DetailSection
          title={t('baoTriSuaChua.detail.sectionContent')}
          icon={<FileText size={18} />}
        >
          <div className="grid grid-cols-1 gap-4">
            <DetailField label={t('baoTriSuaChua.store.moTaCol')} value={data.mo_ta || '—'} />
            {data.ngay_bat_dau && (
              <DetailField label={t('baoTriSuaChua.form.ngayBatDau')} value={formatDate(data.ngay_bat_dau)} />
            )}
            {data.ngay_hoan_thanh && (
              <DetailField label={t('baoTriSuaChua.form.ngayHoanThanh')} value={formatDate(data.ngay_hoan_thanh)} />
            )}
            {data.ghi_chu ? (
              <DetailField label={t('baoTriSuaChua.store.ghiChuCol')} value={data.ghi_chu} />
            ) : (
              <DetailField label={t('baoTriSuaChua.store.ghiChuCol')} value="—" />
            )}
          </div>
        </DetailSection>
      </div>
    </GenericDrawer>
  );
};

export default PhieuBaoTriDetail;
