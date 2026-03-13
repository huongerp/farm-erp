import React from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { FolderOpen, Edit, ClipboardList, Trash2, Plus, Power } from 'lucide-react';
import GenericDrawer, { DRAWER_WIDTH_DETAIL } from '../../../../components/shared/GenericDrawer';
import DetailSection from '../../../../components/shared/DetailSection';
import DetailField from '../../../../components/shared/DetailField';
import DetailToolbar, { DetailToolbarAction } from '../../../../components/shared/DetailToolbar';
import EmptyState from '../../../../components/shared/EmptyState';
import Button from '../../../../components/ui/Button';
import Select from '../../../../components/ui/Select';
import { BTN_CLOSE, BTN_EDIT, BTN_DELETE, CONFIRM_DELETE, CONFIRM_YES } from '../../../../lib/button-labels';
import { useCongViecList, useDeleteCongViecList } from '../../cong-viec/hooks/use-cong-viec';
import { useDuAnById, useUpdateDuAn } from '../hooks/use-du-an';
import { getTrangThaiLabel } from '../../cong-viec/core/constants';
import { useConfirmStore } from '../../../../store/useConfirmStore';
import { formatDate, formatDateTimeShort } from '../../../../lib/utils';
import type { DuAn } from '../core/types';
import type { CongViec } from '../../cong-viec/core/types';

interface Props {
  data: DuAn;
  onClose: () => void;
  onEdit: (item: DuAn) => void;
  onDelete?: (id: string) => void;
  /** Mở drawer detail công việc con (khi bấm dòng). Nếu có thì gọi, không thì navigate. */
  onViewCongViec?: (c: CongViec) => void;
  /** Mở drawer form thêm công việc (dự án đã chọn). Nếu có thì gọi, không thì đóng drawer + navigate. */
  onAddCongViec?: (duAn: DuAn) => void;
  /** Gọi khi xóa một công việc trong bảng con — để trang chủ đóng drawer detail công việc nếu đang xem đúng bản ghi đó. */
  onCongViecDeleted?: (id: string) => void;
}

const DuAnDetail: React.FC<Props> = ({ data, onClose, onEdit, onDelete, onViewCongViec, onAddCongViec, onCongViecDeleted }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const confirm = useConfirmStore((s) => s.confirm);
  const { data: freshData } = useDuAnById(data.id);
  const updateMutation = useUpdateDuAn();
  const { data: congViecList = [] } = useCongViecList();
  const deleteCongViecMutation = useDeleteCongViecList();
  /** Dữ liệu hiển thị: luôn dùng bản mới nhất từ query để action trong drawer cập nhật ngay */
  const displayData = freshData ?? data;
  const congViecThuocDuAn = congViecList.filter((c) => c.id_du_an === displayData.id);

  const handleChangeStatus = () => {
    let selectedStatus: DuAn['trang_thai'] = displayData.trang_thai;
    confirm({
      title: t('duAn.detail.changeStatusTitle'),
      message: (
        <div className="space-y-4 text-left py-2">
          <p className="text-sm">{t('duAn.detail.changeStatusMessage')}</p>
          <Select
            defaultValue={displayData.trang_thai}
            options={[
              { label: t('common.activeStatus'), value: 'Đang hoạt động' },
              { label: t('common.inactiveStatus'), value: 'Ngừng hoạt động' },
            ]}
            onChange={(e) => { selectedStatus = e.target.value as DuAn['trang_thai']; }}
          />
        </div>
      ),
      variant: 'info',
      confirmText: CONFIRM_YES(),
      onConfirm: async () => {
        await updateMutation.mutateAsync({
          id: displayData.id,
          data: {
            ma_du_an: displayData.ma_du_an,
            ten_du_an: displayData.ten_du_an,
            id_phong_ban: displayData.id_phong_ban,
            ngay_bat_dau: displayData.ngay_bat_dau,
            ngay_ket_thuc: displayData.ngay_ket_thuc,
            muc_tieu: displayData.muc_tieu ?? '',
            mo_ta: displayData.mo_ta ?? '',
            trang_thai: selectedStatus,
          },
          ten_phong_ban: displayData.ten_phong_ban,
        });
      },
    });
  };

  const handleAddCongViec = () => {
    if (onAddCongViec) {
      onAddCongViec(displayData);
    } else {
      onClose();
      navigate('/hanh-chinh/cong-viec');
    }
  };

  const toolbarActions: DetailToolbarAction[] = [
    {
      label: t('duAn.detail.changeStatus'),
      icon: <Power size={16} />,
      onClick: handleChangeStatus,
      variant: 'info',
    },
    {
      label: t('duAn.detail.addTask'),
      icon: <Plus size={16} />,
      onClick: handleAddCongViec,
      variant: 'primary',
    },
  ];

  const handleViewOne = (c: CongViec) => {
    if (onViewCongViec) {
      onViewCongViec(c);
    } else {
      onClose();
      navigate(`/hanh-chinh/cong-viec?detail=${c.id}`);
    }
  };

  const handleEditCongViec = (c: CongViec) => {
    onClose();
    navigate(`/hanh-chinh/cong-viec?detail=${c.id}`);
  };

  const handleDeleteCongViec = (c: CongViec) => {
    confirm({
      title: t('congViec.deleteTitle'),
      message: t('congViec.deleteMessage'),
      variant: 'danger',
      confirmText: CONFIRM_DELETE(),
      onConfirm: () =>
        deleteCongViecMutation.mutate([c.id], {
          onSuccess: () => onCongViecDeleted?.(c.id),
        }),
    });
  };

  const handleDelete = () => {
    if (!onDelete) return;
    onDelete(displayData.id);
  };

  const renderFooter = (
    <div className="flex items-center justify-between w-full">
      <Button variant="ghost" onClick={onClose} className="text-muted-foreground hover:text-foreground border border-border">
        {BTN_CLOSE()}
      </Button>
      <div className="flex items-center gap-3">
        <Button
          onClick={() => {
            onEdit(displayData);
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
              handleDelete();
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
      title={displayData.ten_du_an}
      icon={<FolderOpen size={20} />}
      onClose={onClose}
      footer={renderFooter}
      maxWidthClass={DRAWER_WIDTH_DETAIL}
    >
      <div className="space-y-5">
        {/* Summary card — trên toolbar detail */}
        <div className="bg-card p-4 rounded-xl border border-border/50 shadow-sm flex items-center gap-4">
          <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center text-white shadow-primary/20 shadow-lg shrink-0">
            <FolderOpen size={24} className="text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-base font-bold text-foreground leading-tight truncate">{displayData.ten_du_an}</h2>
            <p className="text-body-sm text-muted-foreground font-mono mt-0.5">{displayData.ma_du_an}</p>
            <div className="mt-1.5 flex flex-wrap items-center gap-2">
              {displayData.trang_thai === 'Đang hoạt động' ? (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-medium border border-primary/20">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary" /> {t('common.activeStatus')}
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-muted text-muted-foreground text-xs font-medium border border-border">
                  <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground" /> {t('common.inactiveStatus')}
                </span>
              )}
              <span className="text-xs text-muted-foreground">
                {formatDate(displayData.ngay_bat_dau)} → {formatDate(displayData.ngay_ket_thuc)}
              </span>
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium tabular-nums bg-muted/80 text-muted-foreground border border-border">
                {congViecThuocDuAn.length} {t('congViec.footerRecords')}
              </span>
            </div>
          </div>
        </div>

        <DetailToolbar actions={toolbarActions} className="bg-card rounded-xl border border-border" />

        <DetailSection title={t('duAn.form.basicInfo')} icon={<FolderOpen size={14} />} variant="primary">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <DetailField label={t('duAn.form.maDuAn')} value={displayData.ma_du_an} />
            <DetailField label={t('duAn.form.tenDuAn')} value={displayData.ten_du_an} />
            <DetailField label={t('duAn.form.phongBan')} value={displayData.ten_phong_ban || '—'} />
            <DetailField label={t('duAn.form.ngayBatDau')} value={formatDate(displayData.ngay_bat_dau)} />
            <DetailField label={t('duAn.form.ngayKetThuc')} value={formatDate(displayData.ngay_ket_thuc)} />
            <DetailField
              label={t('duAn.form.status')}
              value={displayData.trang_thai === 'Đang hoạt động' ? t('common.activeStatus') : t('common.inactiveStatus')}
            />
            {displayData.muc_tieu ? (
              <div className="col-span-1 sm:col-span-2">
                <DetailField label={t('duAn.form.mucTieu')} value={displayData.muc_tieu} />
              </div>
            ) : null}
            {displayData.mo_ta ? (
              <div className="col-span-1 sm:col-span-2">
                <DetailField label={t('duAn.form.moTa')} value={displayData.mo_ta} />
              </div>
            ) : null}
            <DetailField label={t('duAn.store.updatedCol')} value={formatDateTimeShort(displayData.tg_cap_nhat)} />
          </div>
        </DetailSection>

        {/* Danh sách công việc — bảng con chuẩn theo module Phòng ban */}
        <div className="w-full bg-card p-3.5 sm:p-4 md:p-5 rounded-xl border border-border shadow-sm space-y-2.5 sm:space-y-3">
          <div className="flex items-center gap-3 pb-2 sm:pb-2.5">
            <div className="flex items-center gap-2 shrink-0">
              <ClipboardList size={14} className="text-primary" />
              <h4 className="text-[11px] sm:text-xs font-semibold uppercase tracking-wider text-primary font-bold">
                {t('duAn.detail.sectionCongViecList')}
              </h4>
              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium tabular-nums bg-primary/10 text-primary border border-primary/20">
                {congViecThuocDuAn.length} {t('congViec.footerRecords')}
              </span>
            </div>
            <div className="flex-1 self-center h-px border-b border-dashed border-border/80 mx-1" aria-hidden />
            <Button
              type="button"
              size="sm"
              onClick={handleAddCongViec}
              className="bg-primary text-white hover:bg-primary/90 shadow-sm h-8 px-3 shrink-0"
            >
              <Plus size={14} className="mr-1.5" />
              {t('common.add')}
            </Button>
          </div>
          {congViecThuocDuAn.length === 0 ? (
            <EmptyState
              title={t('congViec.detail.conEmpty')}
              description={t('duAn.detail.conEmptyHint')}
              icon={<ClipboardList className="w-10 h-10 text-muted-foreground" />}
              action={
                <Button type="button" size="sm" onClick={handleAddCongViec} className="bg-primary text-white hover:bg-primary/90">
                  <Plus size={14} className="mr-2" />
                  {t('common.add')}
                </Button>
              }
            />
          ) : (
            <div className="rounded-xl border border-border overflow-hidden bg-card">
              <div className="overflow-x-auto max-h-[320px] overflow-y-auto custom-scrollbar">
                <table className="w-full text-sm text-left border-collapse">
                  <thead className="sticky top-0 z-[1] bg-muted border-b border-border">
                    <tr>
                      <th className="px-4 py-2 font-semibold text-foreground/80 text-xs whitespace-nowrap">{t('congViec.store.maCol')}</th>
                      <th className="px-4 py-2 font-semibold text-foreground/80 text-xs whitespace-nowrap max-w-[180px]">{t('congViec.store.tieuDeCol')}</th>
                      <th className="px-4 py-2 font-semibold text-foreground/80 text-xs whitespace-nowrap">{t('congViec.store.trangThaiCol')}</th>
                      <th className="px-4 py-2 font-semibold text-foreground/80 text-xs whitespace-nowrap">{t('congViec.store.ngayHetHanCol')}</th>
                      <th className="px-4 py-2 font-semibold text-foreground/80 text-xs text-center w-24">{t('common.actions')}</th>
                    </tr>
                  </thead>
                  <tbody className="[&>tr>td]:border-b [&>tr>td]:border-border">
                    {congViecThuocDuAn.map((c: CongViec) => (
                      <tr
                        key={c.id}
                        role="button"
                        tabIndex={0}
                        onClick={() => handleViewOne(c)}
                        onKeyDown={(e) => e.key === 'Enter' && handleViewOne(c)}
                        className="hover:bg-muted/60 transition-colors cursor-pointer"
                      >
                        <td className="px-4 py-2.5">
                          <span className="font-mono text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded border border-border">
                            {c.ma_cong_viec}
                          </span>
                        </td>
                        <td className="px-4 py-2.5 max-w-[180px]">
                          <span className="font-medium text-foreground line-clamp-2">{c.tieu_de}</span>
                        </td>
                        <td className="px-4 py-2.5">
                          {getTrangThaiLabel(c.trang_thai, t)}
                        </td>
                        <td className="px-4 py-2.5 tabular-nums text-muted-foreground">
                          {formatDate(c.ngay_het_han)}
                        </td>
                        <td className="px-4 py-2.5 text-center" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-center gap-0.5">
                            <button
                              type="button"
                              onClick={() => handleEditCongViec(c)}
                              className="p-1.5 text-primary hover:bg-primary/10 rounded-md transition-all"
                              title={t('common.edit')}
                            >
                              <Edit size={14} />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteCongViec(c)}
                              className="p-1.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-md transition-all"
                              title={t('common.delete')}
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </GenericDrawer>
  );
};

export default DuAnDetail;
