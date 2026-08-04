import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { TFunction } from 'i18next';
import { Wrench, User, FileText, Power } from 'lucide-react';
import GenericDrawer, { DRAWER_WIDTH_DETAIL } from '../../../../components/shared/GenericDrawer';
import DetailSection from '../../../../components/shared/DetailSection';
import DetailField from '../../../../components/shared/DetailField';
import DetailToolbar, { type DetailToolbarAction } from '../../../../components/shared/DetailToolbar';
import DetailDrawerFooter from '../../../../components/shared/DetailDrawerFooter';
import Combobox from '../../../../components/ui/Combobox';
import Textarea from '../../../../components/ui/Textarea';
import { CONFIRM_YES } from '../../../../lib/button-labels';
import { formatDateTimeShort, formatDate, formatCurrency } from '../../../../lib/utils';
import { useConfirmStore } from '../../../../store/useConfirmStore';
import { usePhieuBaoTriById, useUpdatePhieuBaoTri } from '../hooks/use-bao-tri-sua-chua';
import type { PhieuBaoTriSuaChua, PhieuBaoTriSuaChuaCreate, TrangThaiPhieu } from '../core/types';
import { getTrangThaiLabel, TRANG_THAI_OPTIONS } from '../core/constants';

function toUpdatePayload(p: PhieuBaoTriSuaChua): PhieuBaoTriSuaChuaCreate {
  return {
    ngay: p.ngay,
    id_tai_san: p.id_tai_san,
    id_hang_muc: p.id_hang_muc,
    ten_hang_muc: p.ten_hang_muc ?? null,
    mo_ta: p.mo_ta,
    so_tien: p.so_tien,
    ghi_chu: p.ghi_chu ?? null,
    trang_thai: p.trang_thai,
    nguoi_duyet: p.nguoi_duyet ?? null,
  };
}

interface ChangeStatusSyncRef {
  current: { trang_thai: TrangThaiPhieu; ghi_chu: string };
}

/** Form trong dialog xác nhận: đồng bộ giá trị vào ref để onConfirm đọc */
const ChangeTrangThaiChiPhiForm: React.FC<{
  initial: PhieuBaoTriSuaChua;
  syncRef: ChangeStatusSyncRef;
  t: TFunction;
}> = ({ initial, syncRef, t }) => {
  const [trangThai, setTrangThai] = useState<TrangThaiPhieu>(initial.trang_thai);
  const [ghiChu, setGhiChu] = useState(initial.ghi_chu ?? '');

  useEffect(() => {
    syncRef.current = { trang_thai: trangThai, ghi_chu: ghiChu };
  }, [trangThai, ghiChu, syncRef]);

  const comboboxOptions = useMemo(
    () =>
      TRANG_THAI_OPTIONS.map((o) => ({
        value: o.value,
        label: t(o.labelKey),
      })),
    [t]
  );

  return (
    <div className="space-y-4 text-left py-2">
      <p className="text-sm text-muted-foreground">{t('baoTriSuaChua.detail.changeStatusMessage')}</p>
      <div>
        <label className="block text-sm font-medium text-foreground mb-1.5">
          {t('baoTriSuaChua.detail.changeStatusTrangThaiLabel')}
        </label>
        <Combobox
          value={trangThai}
          onChange={(v) => setTrangThai(String(v) as TrangThaiPhieu)}
          options={comboboxOptions}
          placeholder={t('baoTriSuaChua.detail.changeStatusTrangThaiPlaceholder')}
          searchable={false}
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-foreground mb-1.5">
          {t('baoTriSuaChua.detail.changeStatusGhiChuLabel')}
        </label>
        <Textarea
          value={ghiChu}
          onChange={(e) => setGhiChu(e.target.value)}
          placeholder={t('baoTriSuaChua.detail.changeStatusGhiChuPlaceholder')}
          rows={3}
        />
      </div>
    </div>
  );
};

interface Props {
  data: PhieuBaoTriSuaChua;
  onClose: () => void;
  onEdit?: (item: PhieuBaoTriSuaChua) => void;
  onDelete?: (id: string) => void;
  /** Chỉ quản trị (admin | all trên module) mới đổi trạng thái từ toolbar */
  canAdmin?: boolean;
}

const PhieuBaoTriDetail: React.FC<Props> = ({ data, onClose, onEdit, onDelete, canAdmin = false }) => {
  const { t } = useTranslation();
  const confirm = useConfirmStore((s) => s.confirm);
  const { data: fresh } = usePhieuBaoTriById(data.id);
  const displayData = fresh ?? data;
  const updateMutation = useUpdatePhieuBaoTri();

  const handleChangeStatus = useCallback(() => {
    const syncRef: ChangeStatusSyncRef = {
      current: {
        trang_thai: displayData.trang_thai,
        ghi_chu: displayData.ghi_chu ?? '',
      },
    };
    confirm({
      title: t('baoTriSuaChua.detail.changeStatusTitle'),
      message: <ChangeTrangThaiChiPhiForm initial={displayData} syncRef={syncRef} t={t} />,
      variant: 'info',
      confirmText: CONFIRM_YES(),
      onConfirm: () => {
        const { trang_thai, ghi_chu } = syncRef.current;
        updateMutation.mutate({
          id: displayData.id,
          data: {
            ...toUpdatePayload(displayData),
            trang_thai,
            ghi_chu: ghi_chu.trim() || null,
          },
        });
      },
    });
  }, [confirm, displayData, t, updateMutation]);

  const toolbarActions: DetailToolbarAction[] = useMemo(() => {
    if (!canAdmin) return [];
    return [
      {
        label: t('baoTriSuaChua.detail.changeStatus'),
        icon: <Power size={16} />,
        onClick: handleChangeStatus,
        variant: 'info',
        disabled: updateMutation.isPending,
      },
    ];
  }, [canAdmin, t, handleChangeStatus, updateMutation.isPending]);

  const footer = (
    <DetailDrawerFooter
      onClose={onClose}
      onEdit={onEdit ? () => { onClose(); onEdit(displayData); } : undefined}
      onDelete={onDelete ? () => { onDelete(displayData.id); onClose(); } : undefined}
    />
  );

  return (
    <GenericDrawer
      title={t('baoTriSuaChua.detail.title')}
      icon={<Wrench size={20} />}
      subtitle={`${displayData.ma_phieu} • ${displayData.ten_hang_muc ?? displayData.id_hang_muc}`}
      onClose={onClose}
      footer={footer}
      maxWidthClass={DRAWER_WIDTH_DETAIL}
    >
      <div className="space-y-5">
        <DetailToolbar actions={toolbarActions} className="bg-card rounded-xl border border-border" />

        <DetailSection
          title={t('baoTriSuaChua.detail.sectionGeneral')}
          icon={<Wrench size={18} />}
          variant="primary"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <DetailField label={t('baoTriSuaChua.store.maPhieuCol')} value={displayData.ma_phieu} />
            <DetailField label={t('baoTriSuaChua.store.ngayCol')} value={formatDate(displayData.ngay)} />
            <DetailField label={t('baoTriSuaChua.store.hangMucCol')} value={displayData.ten_hang_muc ?? displayData.id_hang_muc} />
            <DetailField label={t('baoTriSuaChua.store.maTaiSanCol')} value={displayData.ma_tai_san || '—'} />
            <DetailField label={t('baoTriSuaChua.store.tenTaiSanCol')} value={displayData.ten_tai_san || '—'} />
            <DetailField label={t('baoTriSuaChua.store.soTienCol')} value={formatCurrency(displayData.so_tien)} />
            <DetailField
              label={t('baoTriSuaChua.store.trangThaiCol')}
              value={getTrangThaiLabel(displayData.trang_thai, t)}
            />
            <DetailField label={t('baoTriSuaChua.store.createdCol')} value={formatDateTimeShort(displayData.tg_tao)} />
            <DetailField label={t('baoTriSuaChua.store.updatedCol')} value={formatDateTimeShort(displayData.tg_cap_nhat)} />
          </div>
        </DetailSection>

        <DetailSection
          title={t('baoTriSuaChua.detail.sectionPeople')}
          icon={<User size={18} />}
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <DetailField label={t('baoTriSuaChua.store.nguoiTaoCol')} value={displayData.ten_nguoi_tao || '—'} />
            <DetailField label={t('baoTriSuaChua.store.nguoiDuyetCol')} value={displayData.nguoi_duyet || '—'} />
          </div>
        </DetailSection>

        <DetailSection
          title={t('baoTriSuaChua.detail.sectionContent')}
          icon={<FileText size={18} />}
        >
          <div className="grid grid-cols-1 gap-4">
            <DetailField label={t('baoTriSuaChua.store.moTaCol')} value={displayData.mo_ta || '—'} />
            <DetailField label={t('baoTriSuaChua.store.ghiChuCol')} value={displayData.ghi_chu || '—'} />
          </div>
        </DetailSection>
      </div>
    </GenericDrawer>
  );
};

export default PhieuBaoTriDetail;
