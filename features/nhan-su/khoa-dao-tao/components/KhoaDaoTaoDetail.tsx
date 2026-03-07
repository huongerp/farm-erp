import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { BookOpen, Edit, ListOrdered, Trash2, ToggleLeft, UserPlus, X, Shield, Layers } from 'lucide-react';
import GenericDrawer, { DRAWER_WIDTH_DETAIL } from '../../../../components/shared/GenericDrawer';
import DetailToolbar, { DetailToolbarAction } from '../../../../components/shared/DetailToolbar';
import DetailSection from '../../../../components/shared/DetailSection';
import DetailField from '../../../../components/shared/DetailField';
import Button from '../../../../components/ui/Button';
import Select from '../../../../components/ui/Select';
import PositionPermissionPicker from '../../../../components/shared/PositionPermissionPicker';
import { BTN_CLOSE, BTN_EDIT, BTN_DELETE } from '../../../../lib/button-labels';
import { formatDate, formatDateTimeShort } from '../../../../lib/utils';
import {
  getTrangThaiKhoaDaoTaoLabel,
  getTrangThaiKhoaDaoTaoBadgeClass,
  TRANG_THAI_KHOA_VALUES,
} from '../core/constants';
import { useUpdateKhoaDaoTao, useUpdateKhoaDaoTaoPhanQuyen } from '../hooks/use-khoa-dao-tao';
import { usePositions } from '@/features/he-thong/chuc-vu/hooks/use-chuc-vu';
import type { KhoaDaoTao, TrangThaiKhoaDaoTao } from '../core/types';

interface Props {
  data: KhoaDaoTao;
  onClose: () => void;
  onEdit: (item: KhoaDaoTao) => void;
  onDelete: (id: string) => void;
  /** Gọi sau khi cập nhật trạng thái thành công để parent cập nhật detailItem */
  onStatusUpdated?: (item: KhoaDaoTao) => void;
  /** Gọi khi bấm Đăng ký (chỉ hiện khi trạng thái = Mở đăng ký) */
  onDangKy?: (item: KhoaDaoTao) => void;
}

const KhoaDaoTaoDetail: React.FC<Props> = ({
  data,
  onClose,
  onEdit,
  onDelete,
  onStatusUpdated,
  onDangKy,
}) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [showStatusDialog, setShowStatusDialog] = useState(false);
  const [showPhanQuyen, setShowPhanQuyen] = useState(false);
  const [statusValue, setStatusValue] = useState(String(data.trang_thai));
  const updateMutation = useUpdateKhoaDaoTao();
  const updatePhanQuyenMutation = useUpdateKhoaDaoTaoPhanQuyen(() => setShowPhanQuyen(false));
  const { data: positionsList = [] } = usePositions();
  const positionsForPicker = useMemo(
    () => positionsList.filter((p) => p.trang_thai === 1).map((p) => ({
      id: p.id,
      ten_chuc_vu: p.ten_chuc_vu,
      id_phong_ban: p.id_phong_ban ?? undefined,
      ten_phong_ban: p.ten_phong_ban,
    })),
    [positionsList]
  );

  const toolbarActions: DetailToolbarAction[] = [
    {
      label: t('thietLapKhoa.detail.toolbar.thietLap'),
      icon: <ListOrdered size={16} />,
      variant: 'secondary',
      onClick: () => {
        onClose();
        navigate(`/nhan-su/khoa-dao-tao/thiet-lap/${data.id}`);
      },
    },
    {
      label: t('khoaDaoTao.detail.toolbar.changeStatus'),
      icon: <ToggleLeft size={16} />,
      onClick: () => {
        setStatusValue(String(data.trang_thai));
        setShowStatusDialog(true);
      },
      variant: 'warning',
      disabled: data.trang_thai === 4 || data.trang_thai === 5,
    },
    {
      label: t('khoaDaoTao.detail.phanQuyen'),
      icon: <Shield size={16} />,
      onClick: () => setShowPhanQuyen(true),
      variant: 'secondary',
    },
  ];
  if (data.trang_thai === 1 && onDangKy) {
    toolbarActions.push({
      label: t('khoaDaoTao.detail.toolbar.dangKy'),
      icon: <UserPlus size={16} />,
      onClick: () => onDangKy(data),
      variant: 'success',
    });
  }

  const footer = (
    <div className="flex items-center justify-between w-full flex-wrap gap-2">
      <Button
        variant="ghost"
        onClick={onClose}
        className="text-muted-foreground hover:text-foreground border border-border"
      >
        {BTN_CLOSE()}
      </Button>
      <div className="flex items-center gap-2 flex-wrap">
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
      title={data.ten}
      icon={<BookOpen size={20} />}
      subtitle={data.ma}
      onClose={onClose}
      footer={footer}
      maxWidthClass={DRAWER_WIDTH_DETAIL}
    >
      <div className="space-y-5">
        <div className="bg-card p-4 rounded-xl border border-border/50 shadow-sm flex items-center gap-4">
          <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center text-white shadow-primary/20 shadow-lg shrink-0">
            <BookOpen size={24} className="text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-base font-bold text-foreground leading-tight truncate">
              {data.ten}
            </h2>
            <p className="text-body-sm text-muted-foreground font-mono mt-0.5">
              {data.ma} · {data.ten_loai_khoa_hoc ?? '—'}
            </p>
            <div className="mt-1.5 flex flex-wrap items-center gap-2">
              <span
                className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium border ${getTrangThaiKhoaDaoTaoBadgeClass(data.trang_thai)}`}
              >
                {getTrangThaiKhoaDaoTaoLabel(data.trang_thai, t)}
              </span>
              <span className="text-xs text-muted-foreground">
                {data.thoi_luong} {t('khoaDaoTao.gio')}
              </span>
            </div>
          </div>
        </div>

        <DetailToolbar actions={toolbarActions} className="bg-card rounded-xl border border-border" />

        <DetailSection
          title={t('khoaDaoTao.detail.thongKeNoiDung')}
          icon={<Layers size={14} />}
          variant="secondary"
        >
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <DetailField
              label={t('khoaDaoTao.detail.soChuong')}
              value={String(data.so_chuong ?? 0)}
            />
            <DetailField
              label={t('khoaDaoTao.detail.soBaiHoc')}
              value={String(data.so_bai_hoc ?? 0)}
            />
            <DetailField
              label={t('khoaDaoTao.detail.soBaiTest')}
              value={String(data.so_bai_test ?? 0)}
            />
          </div>
        </DetailSection>

        <AnimatePresence>
          {showStatusDialog && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50"
              onClick={() => !updateMutation.isPending && setShowStatusDialog(false)}
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="bg-card rounded-xl border border-border shadow-xl max-w-md w-full p-5"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-foreground">
                    {t('khoaDaoTao.detail.toolbar.changeStatusTitle')}
                  </h3>
                  <button
                    type="button"
                    onClick={() => !updateMutation.isPending && setShowStatusDialog(false)}
                    className="p-1.5 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground"
                    aria-label="Close"
                  >
                    <X size={18} />
                  </button>
                </div>
                <div className="space-y-4">
                  <Select
                    label={t('khoaDaoTao.table.trangThai')}
                    value={statusValue}
                    onChange={(e) => setStatusValue(e.target.value)}
                    options={TRANG_THAI_KHOA_VALUES.map((v) => ({
                      value: String(v),
                      label: getTrangThaiKhoaDaoTaoLabel(v as TrangThaiKhoaDaoTao, t),
                    }))}
                  />
                </div>
                <div className="flex justify-end gap-2 mt-5">
                  <Button
                    variant="ghost"
                    onClick={() => setShowStatusDialog(false)}
                    disabled={updateMutation.isPending}
                    className="border border-border"
                  >
                    {t('common.cancel')}
                  </Button>
                  <Button
                    onClick={() => {
                      const trangThai = Number(statusValue) as TrangThaiKhoaDaoTao;
                      if (Number.isNaN(trangThai) || trangThai < 0 || trangThai > 5) return;
                      updateMutation.mutate(
                        { id: data.id, data: { trang_thai: trangThai } },
                        {
                          onSuccess: (updated) => {
                            setShowStatusDialog(false);
                            onStatusUpdated?.(updated);
                          },
                        }
                      );
                    }}
                    disabled={updateMutation.isPending}
                    className="bg-primary text-white"
                  >
                    {updateMutation.isPending ? t('common.saving') : t('common.confirm')}
                  </Button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        <DetailSection
          title={t('khoaDaoTao.detail.basicInfo')}
          icon={<BookOpen size={14} />}
          variant="primary"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <DetailField label={t('khoaDaoTao.table.ma')} value={data.ma} />
            <DetailField label={t('khoaDaoTao.table.ten')} value={data.ten} />
            <DetailField
              label={t('khoaDaoTao.table.loaiKhoaHoc')}
              value={data.ten_loai_khoa_hoc ?? '—'}
            />
            <DetailField
              label={t('khoaDaoTao.table.thoiLuong')}
              value={`${data.thoi_luong} ${t('khoaDaoTao.gio')}`}
            />
            <DetailField
              label={t('khoaDaoTao.table.trangThai')}
              value={getTrangThaiKhoaDaoTaoLabel(data.trang_thai, t)}
            />
            <DetailField
              label={t('khoaDaoTao.table.ngayBatDau')}
              value={formatDate(data.ngay_bat_dau)}
            />
            <DetailField
              label={t('khoaDaoTao.table.ngayKetThuc')}
              value={formatDate(data.ngay_ket_thuc)}
            />
            {data.dia_diem ? (
              <DetailField label={t('khoaDaoTao.detail.diaDiem')} value={data.dia_diem} />
            ) : null}
            {data.link_online ? (
              <DetailField
                label={t('khoaDaoTao.detail.linkOnline')}
                value={
                  <a
                    href={data.link_online}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline break-all"
                  >
                    {data.link_online}
                  </a>
                }
              />
            ) : null}
            {data.so_luong_toi_da != null ? (
              <DetailField
                label={t('khoaDaoTao.table.soLuongToiDa')}
                value={String(data.so_luong_toi_da)}
              />
            ) : null}
            {data.giang_vien ? (
              <DetailField label={t('khoaDaoTao.table.giangVien')} value={data.giang_vien} />
            ) : null}
            {data.mo_ta ? (
              <div className="col-span-1 sm:col-span-2">
                <DetailField label={t('khoaDaoTao.form.moTa')} value={data.mo_ta} />
              </div>
            ) : null}
            {data.ghi_chu ? (
              <div className="col-span-1 sm:col-span-2">
                <DetailField label={t('khoaDaoTao.form.ghiChu')} value={data.ghi_chu} />
              </div>
            ) : null}
            <div className="col-span-1 sm:col-span-2">
              <DetailField
                label={t('khoaDaoTao.detail.phanQuyenLabel')}
                value={
                  !data.id_chuc_vu_xem?.length
                    ? t('khoaDaoTao.detail.phanQuyenEmpty')
                    : (() => {
                        const names = (data.id_chuc_vu_xem ?? [])
                          .map((id) => positionsList.find((p) => p.id === id)?.ten_chuc_vu)
                          .filter(Boolean) as string[];
                        if (names.length === 0) return t('khoaDaoTao.detail.phanQuyenEmpty');
                        return (
                          <div className="flex flex-wrap gap-1.5">
                            {names.map((name) => (
                              <span
                                key={name}
                                className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary border border-primary/20"
                              >
                                {name}
                              </span>
                            ))}
                          </div>
                        );
                      })()
                }
              />
            </div>
            <DetailField
              label={t('khoaDaoTao.table.ngayTao')}
              value={formatDateTimeShort(data.tg_tao)}
            />
            <DetailField
              label={t('khoaDaoTao.table.ngayCapNhat')}
              value={formatDateTimeShort(data.tg_cap_nhat)}
            />
          </div>
        </DetailSection>
      </div>
      {showPhanQuyen && (
        <PositionPermissionPicker
          open={showPhanQuyen}
          onClose={() => setShowPhanQuyen(false)}
          positions={positionsForPicker}
          selectedIds={data.id_chuc_vu_xem ?? []}
          onSave={(id_chuc_vu_xem) => {
            updatePhanQuyenMutation.mutate(
              { id: data.id, id_chuc_vu_xem },
              { onSuccess: (updated) => onStatusUpdated?.(updated) }
            );
          }}
          title={t('khoaDaoTao.form.phanQuyenTitle')}
          activeOnly={true}
        />
      )}
    </GenericDrawer>
  );
};

export default KhoaDaoTaoDetail;
