import React from 'react';
import { useTranslation } from 'react-i18next';
import { Package, Calendar, Folder, DollarSign, FileText, PauseCircle, PlayCircle, Power } from 'lucide-react';
import type { FarmHangHoa } from '../core/types';
import { formatDateShort } from '../../../../lib/utils';
import GenericDrawer, { DRAWER_WIDTH_DETAIL } from '../../../../components/shared/GenericDrawer';
import DetailSection from '../../../../components/shared/DetailSection';
import DetailField from '../../../../components/shared/DetailField';
import DetailFieldGrid from '../../../../components/shared/DetailFieldGrid';
import DetailDrawerFooter from '../../../../components/shared/DetailDrawerFooter';
import DetailToolbar, { type DetailToolbarAction } from '../../../../components/shared/DetailToolbar';
import { useConfirmStore } from '../../../../store/useConfirmStore';
import { TRANG_THAI_HOAT_DONG } from '../../../../lib/constants';
import { useDoiTrangThaiFarmHangHoa } from '../hooks/use-farm-hang-hoa';
import TrangThaiHangHoaBadge from './TrangThaiHangHoaBadge';

interface Props {
  data: FarmHangHoa;
  onClose: () => void;
  onEdit?: (item: FarmHangHoa) => void;
  onDelete?: (id: string) => void;
  /** Quyền sửa module → hiện nút Ngừng hoạt động / Hoạt động lại. */
  canDoiTrangThai?: boolean;
}

const HangHoaDetail: React.FC<Props> = ({ data, onClose, onEdit, onDelete, canDoiTrangThai = false }) => {
  const { t } = useTranslation();
  const confirm = useConfirmStore((s) => s.confirm);
  const doiTrangThai = useDoiTrangThaiFarmHangHoa();
  const dangHoatDong = data.trang_thai === TRANG_THAI_HOAT_DONG.DANG_HOAT_DONG;

  const handleDoiTrangThai = () => {
    const moi = dangHoatDong ? TRANG_THAI_HOAT_DONG.NGUNG_HOAT_DONG : TRANG_THAI_HOAT_DONG.DANG_HOAT_DONG;
    confirm({
      title: t('farmHangHoaPhanThuoc.hangHoa.statusChangeTitle'),
      message: t(
        dangHoatDong ? 'farmHangHoaPhanThuoc.hangHoa.confirmNgung' : 'farmHangHoaPhanThuoc.hangHoa.confirmKichHoat',
        { ma: data.ma_hang_hoa }
      ),
      variant: dangHoatDong ? 'warning' : 'info',
      confirmText: t(
        dangHoatDong ? 'farmHangHoaPhanThuoc.hangHoa.actionNgung' : 'farmHangHoaPhanThuoc.hangHoa.actionKichHoat'
      ),
      onConfirm: () => doiTrangThai.mutate({ id: data.id, trang_thai: moi }),
    });
  };

  const toolbarActions: DetailToolbarAction[] = canDoiTrangThai
    ? [
        dangHoatDong
          ? {
              label: t('farmHangHoaPhanThuoc.hangHoa.actionNgung'),
              icon: <PauseCircle size={16} />,
              onClick: handleDoiTrangThai,
              variant: 'warning',
              disabled: doiTrangThai.isPending,
            }
          : {
              label: t('farmHangHoaPhanThuoc.hangHoa.actionKichHoat'),
              icon: <PlayCircle size={16} />,
              onClick: handleDoiTrangThai,
              variant: 'success',
              disabled: doiTrangThai.isPending,
            },
      ]
    : [];

  const renderFooter = (
    <DetailDrawerFooter
      onClose={onClose}
      onEdit={onEdit ? () => { onEdit(data);
              onClose(); } : undefined}
      onDelete={onDelete ? () => { onDelete(data.id);
              onClose(); } : undefined}
    />
  );

  return (
    <GenericDrawer
      title={t('farmHangHoaPhanThuoc.hangHoa.detail.title')}
      subtitle={data.ma_hang_hoa}
      icon={<Package size={18} />}
      onClose={onClose}
      footer={renderFooter}
      maxWidthClass={DRAWER_WIDTH_DETAIL}
    >
      <div className="space-y-5">
        <div className="bg-card p-4 rounded-xl border border-border/50 shadow-sm flex items-center gap-4">
          <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center text-white shadow-primary/20 shadow-lg shrink-0">
            <Package size={24} className="text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-base font-bold text-foreground leading-tight truncate">{data.ten_hang_hoa}</h2>
            <p className="text-body-sm text-muted-foreground font-mono mt-0.5">{data.ma_hang_hoa}</p>
            <TrangThaiHangHoaBadge trangThai={data.trang_thai} className="mt-1.5" />
          </div>
        </div>

        <DetailToolbar actions={toolbarActions} className="bg-card rounded-xl border border-border" />

        <DetailSection title={t('farmHangHoaPhanThuoc.hangHoa.detail.basicInfo')} icon={<Package size={14} />} variant="primary">
          <DetailFieldGrid cols={2}>
            <DetailField label={t('farmHangHoaPhanThuoc.hangHoa.form.code')} value={data.ma_hang_hoa} icon={<Package size={12} />} />
            <DetailField label={t('farmHangHoaPhanThuoc.hangHoa.form.name')} value={data.ten_hang_hoa} icon={<Package size={12} />} />
            <DetailField
              label={t('farmHangHoaPhanThuoc.hangHoa.detail.category')}
              value={data.ten_danh_muc ?? ''}
              icon={<Folder size={12} />}
              emptyText={t('farmHangHoaPhanThuoc.hangHoa.detail.noCategory')}
            />
            <DetailField
              label={t('farmHangHoaPhanThuoc.hangHoa.detail.unit')}
              value={data.dvt ?? ''}
              icon={<Package size={12} />}
              emptyText="—"
            />
            <DetailField
              label={t('farmHangHoaPhanThuoc.hangHoa.detail.phamCap')}
              value={data.pham_cap ?? ''}
              icon={<Package size={12} />}
              emptyText="—"
            />
            <DetailField
              label={t('farmHangHoaPhanThuoc.hangHoa.form.price')}
              value={data.don_gia != null ? data.don_gia.toLocaleString('vi-VN') : ''}
              icon={<DollarSign size={12} />}
              emptyText="—"
            />
            <DetailField
              label={t('farmHangHoaPhanThuoc.hangHoa.form.dinhMuc')}
              value={data.dinh_muc != null ? data.dinh_muc.toLocaleString('vi-VN') : ''}
              icon={<Package size={12} />}
              emptyText="—"
            />
            <DetailField
              label={t('farmHangHoaPhanThuoc.hangHoa.detail.status')}
              value={dangHoatDong ? t('farmHangHoaPhanThuoc.hangHoa.active') : t('farmHangHoaPhanThuoc.hangHoa.inactive')}
              icon={<Power size={12} />}
            />
            {data.mo_ta != null && data.mo_ta !== '' && (
              <DetailField
                label={t('farmHangHoaPhanThuoc.hangHoa.detail.description')}
                value={data.mo_ta}
                icon={<FileText size={12} />}
                className="col-span-1 sm:col-span-2"
              />
            )}
          </DetailFieldGrid>
        </DetailSection>

        <DetailSection title={t('farmHangHoaPhanThuoc.hangHoa.detail.systemInfo')} icon={<Calendar size={14} />} variant="primary">
          <DetailFieldGrid>
            <DetailField
              label={t('farmHangHoaPhanThuoc.hangHoa.detail.createdAt')}
              value={formatDateShort(data.tg_tao)}
              icon={<Calendar size={12} />}
            />
            <DetailField
              label={t('farmHangHoaPhanThuoc.hangHoa.detail.updated')}
              value={formatDateShort(data.tg_cap_nhat)}
              icon={<Calendar size={12} />}
            />
          </DetailFieldGrid>
        </DetailSection>
      </div>
    </GenericDrawer>
  );
};

export default HangHoaDetail;
