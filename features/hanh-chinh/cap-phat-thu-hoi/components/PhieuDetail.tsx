import React from 'react';
import { useTranslation } from 'react-i18next';
import { Package, Edit, Trash2, MapPin, User, FileText } from 'lucide-react';
import GenericDrawer, { DRAWER_WIDTH_DETAIL } from '../../../../components/shared/GenericDrawer';
import DetailSection from '../../../../components/shared/DetailSection';
import DetailField from '../../../../components/shared/DetailField';
import Button from '../../../../components/ui/Button';
import { BTN_CLOSE, BTN_EDIT, BTN_DELETE } from '../../../../lib/button-labels';
import { formatDateTimeShort, formatDate } from '../../../../lib/utils';
import type { PhieuCapPhatThuHoi } from '../core/types';
import { getLoaiPhieuLabel } from '../core/constants';

interface Props {
  data: PhieuCapPhatThuHoi;
  onClose: () => void;
  onEdit?: (item: PhieuCapPhatThuHoi) => void;
  onDelete?: (id: string) => void;
}

const PhieuDetail: React.FC<Props> = ({ data, onClose, onEdit, onDelete }) => {
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
      title={t('capPhatThuHoi.detail.title')}
      icon={<Package size={20} />}
      subtitle={`${getLoaiPhieuLabel(data.loai_phieu, t)} • ${data.ma_tai_san ?? data.id_tai_san}`}
      onClose={onClose}
      footer={footer}
      maxWidthClass={DRAWER_WIDTH_DETAIL}
    >
      <div className="space-y-5">
        {/* Section 1: Thông tin chung */}
        <DetailSection
          title={t('capPhatThuHoi.detail.sectionGeneral')}
          icon={<Package size={18} />}
          variant="primary"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <DetailField label={t('capPhatThuHoi.store.loaiCol')} value={getLoaiPhieuLabel(data.loai_phieu, t)} />
            <DetailField label={t('capPhatThuHoi.store.taiSanCol')} value={data.ten_tai_san || data.ma_tai_san || '—'} />
            <DetailField label={t('capPhatThuHoi.store.ngayCol')} value={formatDate(data.ngay_thuc_hien)} />
            <DetailField label={t('capPhatThuHoi.store.updatedCol')} value={formatDateTimeShort(data.tg_cap_nhat)} />
          </div>
        </DetailSection>

        {/* Section 2: Nơi lưu */}
        <DetailSection
          title={t('capPhatThuHoi.detail.sectionLocation')}
          icon={<MapPin size={18} />}
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <DetailField label={t('capPhatThuHoi.store.noiLuuTruocCol')} value={data.ten_noi_luu_truoc || '—'} />
            <DetailField label={t('capPhatThuHoi.store.noiLuuSauCol')} value={data.ten_noi_luu_sau || '—'} />
          </div>
        </DetailSection>

        {/* Section 3: Người giữ & Người thực hiện */}
        <DetailSection
          title={t('capPhatThuHoi.detail.sectionHolder')}
          icon={<User size={18} />}
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <DetailField label={t('capPhatThuHoi.store.nguoiGiuTruocCol')} value={data.ten_nguoi_giu_truoc || '—'} />
            <DetailField label={t('capPhatThuHoi.store.nguoiGiuSauCol')} value={data.ten_nguoi_giu_sau || '—'} />
            <DetailField label={t('capPhatThuHoi.store.nguoiThucHienCol')} value={data.ten_nguoi_thuc_hien || '—'} />
          </div>
        </DetailSection>

        {/* Section 4: Ghi chú & Thời gian */}
        <DetailSection
          title={t('capPhatThuHoi.detail.sectionOther')}
          icon={<FileText size={18} />}
        >
          <div className="grid grid-cols-1 gap-4">
            {data.ghi_chu ? (
              <DetailField label={t('capPhatThuHoi.store.ghiChuCol')} value={data.ghi_chu} />
            ) : (
              <DetailField label={t('capPhatThuHoi.store.ghiChuCol')} value="—" />
            )}
          </div>
        </DetailSection>
      </div>
    </GenericDrawer>
  );
};

export default PhieuDetail;
