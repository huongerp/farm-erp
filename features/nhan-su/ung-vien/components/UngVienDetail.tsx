import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { User, Edit, Trash2, Phone, MapPin, Calendar, Briefcase, Tag, FileText } from 'lucide-react';
import GenericDrawer, { DRAWER_WIDTH_DETAIL } from '../../../../components/shared/GenericDrawer';
import DetailSection from '../../../../components/shared/DetailSection';
import DetailField from '../../../../components/shared/DetailField';
import Button from '../../../../components/ui/Button';
import { BTN_CLOSE, BTN_EDIT, BTN_DELETE } from '../../../../lib/button-labels';
import { formatDateTimeShort } from '../../../../lib/utils';
import { getTrangThaiBadgeClass, getNguonBadgeClass, TRANG_THAI_BADGE_BASE } from '../utils/trang-thai-badge';
import { getYearFromNgaySinh } from '../utils/format';
import { TaiLieuSubTableView } from './TaiLieuSubTable';
import LichPhongVanSubTable from '@/features/nhan-su/lich-phong-van/components/LichPhongVanSubTable';
import { useUpdateUngVien } from '../hooks/use-ung-vien';
import { useLichPhongVans } from '@/features/nhan-su/lich-phong-van/hooks/use-lich-phong-van';
import { useConfirmStore } from '../../../../store/useConfirmStore';
import type { UngVien } from '../core/types';
import type { UngVienFormValues } from '../core/schema';
import type { TaiLieuUngVien } from '../core/types';
import type { LichPhongVan } from '@/features/nhan-su/lich-phong-van/core/types';

interface Props {
  data: UngVien;
  onClose: () => void;
  onEdit: (item: UngVien) => void;
  onDelete?: (id: string) => void;
  /** Section Lịch phỏng vấn: Thêm (mở form với initialIdUngVien = data.id) */
  onAddLichPhongVan?: () => void;
  /** Xem chi tiết lịch PV */
  onViewLichPhongVan?: (item: LichPhongVan) => void;
  /** Sửa lịch PV */
  onEditLichPhongVan?: (item: LichPhongVan) => void;
  /** Xóa lịch PV */
  onDeleteLichPhongVan?: (item: LichPhongVan) => void;
}

/** Chuyển UngVien sang payload form (để gọi update, có thể override tai_lieu). */
function toFormValues(u: UngVien, taiLieuOverride?: TaiLieuUngVien[]): UngVienFormValues {
  return {
    ho_ten: u.ho_ten,
    email: u.email,
    so_dien_thoai: u.so_dien_thoai ?? '',
    dia_chi: u.dia_chi ?? null,
    ngay_sinh: u.ngay_sinh ?? null,
    ghi_chu_noi_bo: u.ghi_chu_noi_bo ?? null,
    id_de_xuat_tuyen_dung: u.id_de_xuat_tuyen_dung,
    id_trang_thai_ung_vien: u.id_trang_thai_ung_vien,
    id_kenh_tuyen_dung: u.id_kenh_tuyen_dung ?? null,
    ngay_phong_van_gan_nhat: u.ngay_phong_van_gan_nhat ?? null,
    ket_qua_phan_hoi_gan_nhat: u.ket_qua_phan_hoi_gan_nhat ?? null,
    tai_lieu: taiLieuOverride ?? u.tai_lieu ?? [],
  };
}

const UngVienDetail: React.FC<Props> = ({
  data,
  onClose,
  onEdit,
  onDelete,
  onAddLichPhongVan,
  onViewLichPhongVan,
  onEditLichPhongVan,
  onDeleteLichPhongVan,
}) => {
  const { t } = useTranslation();
  const confirm = useConfirmStore((s) => s.confirm);
  const updateMutation = useUpdateUngVien();
  const { data: lichPhongVanList = [], isLoading: loadingLichPhongVan } = useLichPhongVans();
  const lichPhongVanForUngVien = useMemo(
    () => lichPhongVanList.filter((l) => l.id_ung_vien === data.id),
    [lichPhongVanList, data.id]
  );

  const handleAddTaiLieu = () => {
    onEdit(data);
    onClose();
  };

  const handleEditTaiLieu = () => {
    onEdit(data);
    onClose();
  };

  const handleDeleteTaiLieu = (doc: TaiLieuUngVien) => {
    confirm({
      title: t('ungVien.deleteTitle'),
      message: t('ungVien.deleteDocMessage'),
      confirmText: t('common.delete'),
      variant: 'danger',
      onConfirm: () => {
        const nextTaiLieu = (data.tai_lieu ?? []).filter((d) => d.id !== doc.id);
        updateMutation.mutate({
          id: data.id,
          data: toFormValues(data, nextTaiLieu),
        });
      },
    });
  };

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

  return (
    <GenericDrawer
      title={data.ho_ten}
      subtitle={data.email}
      icon={<User size={20} />}
      onClose={onClose}
      footer={renderFooter}
      maxWidthClass={DRAWER_WIDTH_DETAIL}
    >
      <div className="space-y-5">
        <div className="bg-card p-4 rounded-xl border border-border/50 shadow-sm flex items-center gap-4">
          <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center text-white shadow-primary/20 shadow-lg shrink-0">
            <User size={24} className="text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-base font-bold text-foreground leading-tight truncate">
              {data.ho_ten}
            </h2>
            <p className="text-body-sm text-muted-foreground truncate">{data.email}</p>
            <div className="mt-1.5 flex flex-wrap items-center gap-2">
              <span
                className={`${TRANG_THAI_BADGE_BASE} ${getTrangThaiBadgeClass(data.id_trang_thai_ung_vien)}`}
              >
                {data.ten_trang_thai ?? t('ungVien.noValue')}
              </span>
              {data.id_kenh_tuyen_dung && (
                <span
                  className={`${TRANG_THAI_BADGE_BASE} ${getNguonBadgeClass(data.id_kenh_tuyen_dung)}`}
                >
                  {data.ten_kenh_tuyen_dung ?? t('ungVien.noValue')}
                </span>
              )}
            </div>
          </div>
        </div>

        <DetailSection title={t('ungVien.detail.basicInfo')} icon={<User size={14} />} variant="primary">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <DetailField label={t('ungVien.form.hoTen')} value={data.ho_ten} />
            <DetailField label={t('ungVien.form.email')} value={data.email} />
            <DetailField label={t('ungVien.form.soDienThoai')} value={data.so_dien_thoai || t('ungVien.noValue')} />
            {data.dia_chi && (
              <DetailField label={t('ungVien.form.diaChi')} value={data.dia_chi} className="sm:col-span-2" />
            )}
            {data.ngay_sinh && (
              <DetailField
                label={t('ungVien.form.ngaySinh')}
                value={data.ngay_sinh}
              />
            )}
            <DetailField
              label={t('ungVien.detail.namSinh')}
              value={(() => {
                const y = getYearFromNgaySinh(data.ngay_sinh);
                return y != null ? String(y) : t('ungVien.noValue');
              })()}
            />
          </div>
        </DetailSection>

        <DetailSection title={t('ungVien.detail.viTriUngTuyen')} icon={<Briefcase size={14} />} variant="primary">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <DetailField label={t('ungVien.store.viTriCol')} value={data.ma_de_xuat ?? t('ungVien.noValue')} />
            <DetailField label={t('ungVien.stats.chucVu')} value={data.ten_chuc_vu ?? t('ungVien.noValue')} />
            <div className="sm:col-span-2">
              <p className="text-2xs font-medium text-muted-foreground mb-1">{t('ungVien.detail.trangThai')}</p>
              <span
                className={`inline-block ${TRANG_THAI_BADGE_BASE} ${getTrangThaiBadgeClass(data.id_trang_thai_ung_vien)} w-fit`}
              >
                {data.ten_trang_thai ?? t('ungVien.noValue')}
              </span>
            </div>
            {data.id_kenh_tuyen_dung ? (
              <div>
                <p className="text-2xs font-medium text-muted-foreground mb-1">{t('ungVien.detail.nguon')}</p>
                <span
                  className={`inline-block ${TRANG_THAI_BADGE_BASE} ${getNguonBadgeClass(data.id_kenh_tuyen_dung)} w-fit`}
                >
                  {data.ten_kenh_tuyen_dung ?? t('ungVien.noValue')}
                </span>
              </div>
            ) : null}
          </div>
        </DetailSection>

        <DetailSection title={t('ungVien.detail.phongVanGanNhat')} icon={<Calendar size={14} />} variant="primary">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <DetailField
              label={t('ungVien.detail.ngayPv')}
              value={data.ngay_phong_van_gan_nhat ? formatDateTimeShort(data.ngay_phong_van_gan_nhat) : t('ungVien.noValue')}
            />
            <DetailField
              label={t('ungVien.detail.ketQua')}
              value={data.ket_qua_phan_hoi_gan_nhat || t('ungVien.noValue')}
              className="sm:col-span-2"
            />
          </div>
        </DetailSection>

        <TaiLieuSubTableView
          items={data.tai_lieu ?? []}
          onAdd={handleAddTaiLieu}
          onEdit={handleEditTaiLieu}
          onDelete={handleDeleteTaiLieu}
        />

        <LichPhongVanSubTable
          items={lichPhongVanForUngVien}
          loading={loadingLichPhongVan}
          addLabel={t('lichPhongVan.detail.addLich')}
          onAdd={onAddLichPhongVan}
          onView={onViewLichPhongVan}
          onEdit={onEditLichPhongVan}
          onDelete={onDeleteLichPhongVan}
        />

        {data.ghi_chu_noi_bo && data.ghi_chu_noi_bo.trim() !== '' && (
          <DetailSection title={t('ungVien.detail.ghiChuNoiBo')} icon={<FileText size={14} />} variant="primary">
            <p className="text-body-sm text-foreground whitespace-pre-wrap">{data.ghi_chu_noi_bo}</p>
          </DetailSection>
        )}
      </div>
    </GenericDrawer>
  );
};

export default UngVienDetail;
