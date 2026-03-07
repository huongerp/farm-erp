import React from 'react';
import { useTranslation } from 'react-i18next';
import { Mail, Edit, Trash2, User, FileText, Calendar, Briefcase, Printer } from 'lucide-react';
import GenericDrawer, { DRAWER_WIDTH_DETAIL } from '../../../../components/shared/GenericDrawer';
import DetailToolbar, { DetailToolbarAction } from '../../../../components/shared/DetailToolbar';
import DetailSection from '../../../../components/shared/DetailSection';
import DetailField from '../../../../components/shared/DetailField';
import Button from '../../../../components/ui/Button';
import { BTN_CLOSE, BTN_EDIT, BTN_DELETE } from '../../../../lib/button-labels';
import { formatDateTimeShort } from '../../../../lib/utils';
import { getLoaiThuLabel, getLoaiThuBadgeClass } from '../core/constants';
import type { ThuGuiUngVien } from '../core/types';

const PREVIEW_BASE = '/thu-gui-ung-vien/preview';

interface Props {
  data: ThuGuiUngVien;
  onClose: () => void;
  onEdit: (item: ThuGuiUngVien) => void;
  onDelete?: (id: string) => void;
}

const ThuGuiUngVienDetail: React.FC<Props> = ({ data, onClose, onEdit, onDelete }) => {
  const { t } = useTranslation();

  const printLetterUrl = `${PREVIEW_BASE}/${encodeURIComponent(data.id_ung_vien)}/${data.loai_thu}?letterId=${encodeURIComponent(data.id)}`;

  const toolbarActions: DetailToolbarAction[] = [
    {
      label: t('thuGuiUngVien.detail.toolbar.printLetter'),
      icon: <Printer size={16} />,
      onClick: () => window.open(printLetterUrl, '_blank', 'noopener,noreferrer'),
      variant: 'primary',
    },
  ];

  const footer = (
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
        {onDelete && (
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
        )}
      </div>
    </div>
  );

  const loaiThuBadgeClass = getLoaiThuBadgeClass(data.loai_thu);

  return (
    <GenericDrawer
      title={data.ten_ung_vien ?? '—'}
      icon={<Mail size={20} />}
      subtitle={
        <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium border shrink-0 ${loaiThuBadgeClass}`}>
          {getLoaiThuLabel(data.loai_thu, t)}
        </span>
      }
      onClose={onClose}
      footer={footer}
      maxWidthClass={DRAWER_WIDTH_DETAIL}
    >
      <div className="space-y-5">
        <div className="bg-card p-4 rounded-xl border border-border/50 shadow-sm flex items-center gap-4">
          <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center text-white shadow-primary/20 shadow-lg shrink-0">
            <Mail size={24} className="text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-base font-bold text-foreground leading-tight truncate">
              {data.ten_ung_vien ?? '—'}
            </h2>
            <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium border w-fit mt-0.5 ${loaiThuBadgeClass}`}>
              {getLoaiThuLabel(data.loai_thu, t)}
            </span>
          </div>
        </div>

        <DetailToolbar actions={toolbarActions} className="bg-card rounded-xl border border-border" />

        <DetailSection
          title={t('thuGuiUngVien.detail.basicInfo')}
          icon={<FileText size={14} />}
          variant="primary"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <DetailField label={t('thuGuiUngVien.table.ungVien')} value={data.ten_ung_vien ?? '—'} icon={<User size={14} />} />
            <DetailField
              label={t('thuGuiUngVien.table.loaiPhieu')}
              value={
                <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium border w-fit ${loaiThuBadgeClass}`}>
                  {getLoaiThuLabel(data.loai_thu, t)}
                </span>
              }
              icon={<FileText size={14} />}
            />
            <div className="col-span-1 sm:col-span-2">
              <DetailField
                label={t('thuGuiUngVien.ghiChu')}
                value={data.ghi_chu ?? ''}
                emptyText={t('common.noData')}
              />
            </div>
            <DetailField
              label={t('thuGuiUngVien.table.ngayTao')}
              value={formatDateTimeShort(data.tg_tao)}
            />
            <DetailField
              label={t('thuGuiUngVien.updatedAt')}
              value={formatDateTimeShort(data.tg_cap_nhat)}
            />
          </div>
        </DetailSection>

        {data.loai_thu === 'moi-nhan-viec' && (
          <DetailSection
            title={t('thuGuiUngVien.sectionJobOffer')}
            icon={<Briefcase size={14} />}
            variant="primary"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <DetailField
                label={t('thuGuiUngVien.bacLuong')}
                value={data.bac_luong ?? ''}
                emptyText={t('common.noData')}
              />
              <DetailField
                label={t('thuGuiUngVien.mucLuong')}
                value={data.muc_luong ?? ''}
                emptyText={t('common.noData')}
              />
              <DetailField
                label={t('thuGuiUngVien.ngayNhanViec')}
                value={data.ngay_vao_lam ?? ''}
                icon={<Calendar size={14} />}
                emptyText={t('common.noData')}
              />
              <div className="col-span-1 sm:col-span-2">
                <DetailField
                  label={t('thuGuiUngVien.coCheKhac')}
                  value={data.co_che_khac ?? ''}
                  emptyText={t('common.noData')}
                />
              </div>
              <div className="col-span-1 sm:col-span-2">
                <DetailField
                  label={t('thuGuiUngVien.ghiChuKhac')}
                  value={data.ghi_chu_khac ?? ''}
                  emptyText={t('common.noData')}
                />
              </div>
            </div>
          </DetailSection>
        )}
      </div>
    </GenericDrawer>
  );
};

export default ThuGuiUngVienDetail;
