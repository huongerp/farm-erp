import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AnimatePresence, motion } from 'framer-motion';
import { Briefcase, Edit, Trash2, ExternalLink, FileText, ListOrdered, Calendar, RefreshCw, X } from 'lucide-react';
import GenericDrawer, { DRAWER_WIDTH_DETAIL } from '../../../../components/shared/GenericDrawer';
import DetailSection from '../../../../components/shared/DetailSection';
import DetailField from '../../../../components/shared/DetailField';
import DetailToolbar, { DetailToolbarAction } from '../../../../components/shared/DetailToolbar';
import Button from '../../../../components/ui/Button';
import Select from '../../../../components/ui/Select';
import Textarea from '../../../../components/ui/Textarea';
import { BTN_CLOSE, BTN_EDIT, BTN_DELETE } from '../../../../lib/button-labels';
import { formatDateTimeShort } from '../../../../lib/utils';
import { useUpdateDeXuatTuyenDungStatusWithNote } from '../hooks/use-de-xuat-tuyen-dung';
import { useUngViens } from '@/features/nhan-su/ung-vien/hooks/use-ung-vien';
import UngVienSubTable from './UngVienSubTable';
import type { DeXuatTuyenDung, DeXuatTuyenDungWithCounts } from '../core/types';
import type { UngVien } from '@/features/nhan-su/ung-vien/core/types';

const STATUS_KEYS: Record<number, string> = {
  0: 'deXuatTuyenDung.status.nhap',
  1: 'deXuatTuyenDung.status.choDuyet',
  2: 'deXuatTuyenDung.status.daDuyet',
  3: 'deXuatTuyenDung.status.tuChoi',
};

const STATUS_OPTIONS = [
  { value: '0', labelKey: STATUS_KEYS[0] },
  { value: '1', labelKey: STATUS_KEYS[1] },
  { value: '2', labelKey: STATUS_KEYS[2] },
  { value: '3', labelKey: STATUS_KEYS[3] },
] as const;

/** Cùng màu với cột trạng thái trong list (DanhSachTable) */
const getStatusBadgeClass = (status: number) => {
  if (status === 2) return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20';
  if (status === 3) return 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20';
  if (status === 1) return 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20';
  return 'bg-muted text-muted-foreground border-border';
};

interface Props {
  data: DeXuatTuyenDungWithCounts | DeXuatTuyenDung;
  onClose: () => void;
  onEdit: (item: DeXuatTuyenDung) => void;
  onDelete?: (id: string) => void;
  onDataUpdated?: (item: DeXuatTuyenDung) => void;
  /** Thêm ứng viên (mở form với đề xuất này được chọn). */
  onAddUngVien?: () => void;
  /** Xem chi tiết ứng viên. */
  onViewUngVien?: (item: UngVien) => void;
  /** Sửa ứng viên. */
  onEditUngVien?: (item: UngVien) => void;
  /** Xóa ứng viên. */
  onDeleteUngVien?: (item: UngVien) => void;
}

const DeXuatTuyenDungDetail: React.FC<Props> = ({
  data,
  onClose,
  onEdit,
  onDelete,
  onDataUpdated,
  onAddUngVien,
  onViewUngVien,
  onEditUngVien,
  onDeleteUngVien,
}) => {
  const { t } = useTranslation();
  const { data: ungVienList = [], isLoading: loadingUngVien } = useUngViens();
  const candidates = React.useMemo(
    () => ungVienList.filter((u) => u.id_de_xuat_tuyen_dung === data.id),
    [ungVienList, data.id]
  );
  const [showStatusDialog, setShowStatusDialog] = useState(false);
  const [statusValue, setStatusValue] = useState<string>(String(data.trang_thai));
  const [ghiChu, setGhiChu] = useState<string>(data.ghi_chu ?? '');
  const statusMutation = useUpdateDeXuatTuyenDungStatusWithNote((updated) => {
    setShowStatusDialog(false);
    onDataUpdated?.(updated);
  });

  const statusLabel = t(STATUS_KEYS[data.trang_thai] ?? STATUS_KEYS[0]);
  const withCounts = data as DeXuatTuyenDungWithCounts;
  const soLuongOnboard = withCounts.so_luong_onboard ?? data.so_luong_da_tuyen ?? 0;
  const soLuongDaNghi = withCounts.so_luong_da_nghi ?? 0;
  const soLuongConLai = withCounts.so_luong_con_lai ?? Math.max(0, (data.so_luong ?? 0) - soLuongOnboard);

  const toolbarActions: DetailToolbarAction[] = [
    {
      label: t('deXuatTuyenDung.detail.changeStatus'),
      icon: <RefreshCw />,
      onClick: () => {
        setStatusValue(String(data.trang_thai));
        setGhiChu(data.ghi_chu ?? '');
        setShowStatusDialog(true);
      },
      variant: 'info',
    },
  ];

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
      title={data.tieu_de || data.ma_de_xuat}
      icon={<Briefcase size={20} />}
      subtitle={data.ma_de_xuat}
      onClose={onClose}
      footer={renderFooter}
      maxWidthClass={DRAWER_WIDTH_DETAIL}
    >
      <div className="space-y-5">
        <div className="bg-card p-4 rounded-xl border border-border/50 shadow-sm flex items-center gap-4">
          <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center text-white shadow-primary/20 shadow-lg shrink-0">
            <Briefcase size={24} className="text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-base font-bold text-foreground leading-tight truncate">
              {data.tieu_de || data.ma_de_xuat}
            </h2>
            <p className="text-body-sm text-muted-foreground font-mono mt-0.5">
              {data.ma_de_xuat}
            </p>
            <div className="mt-1.5 flex flex-wrap items-center gap-2">
              <span
                className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${getStatusBadgeClass(data.trang_thai)}`}
              >
                {statusLabel}
              </span>
              {data.ten_chuc_vu && (
                <span className="text-xs text-foreground">{data.ten_chuc_vu}</span>
              )}
            </div>
          </div>
        </div>

        <DetailToolbar actions={toolbarActions} className="bg-card rounded-xl border border-border" />

        {/* Dialog chuyển trạng thái */}
        <AnimatePresence>
          {showStatusDialog && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50"
              onClick={() => !statusMutation.isPending && setShowStatusDialog(false)}
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
                    {t('deXuatTuyenDung.detail.changeStatusTitle')}
                  </h3>
                  <button
                    type="button"
                    onClick={() => !statusMutation.isPending && setShowStatusDialog(false)}
                    className="p-1.5 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground"
                    aria-label="Close"
                  >
                    <X size={18} />
                  </button>
                </div>
                <div className="space-y-4">
                  <Select
                    label={t('deXuatTuyenDung.store.statusCol')}
                    value={statusValue}
                    onChange={(e) => setStatusValue(e.target.value)}
                    options={STATUS_OPTIONS.map((o) => ({ value: o.value, label: t(o.labelKey) }))}
                  />
                  <Textarea
                    label={t('deXuatTuyenDung.detail.changeStatusNote')}
                    placeholder={t('deXuatTuyenDung.detail.changeStatusNotePlaceholder')}
                    value={ghiChu}
                    onChange={(e) => setGhiChu(e.target.value)}
                    rows={3}
                  />
                </div>
                <div className="flex justify-end gap-2 mt-5">
                  <Button
                    variant="ghost"
                    onClick={() => setShowStatusDialog(false)}
                    disabled={statusMutation.isPending}
                    className="border border-border"
                  >
                    {t('common.cancel')}
                  </Button>
                  <Button
                    onClick={() => {
                      const status = Number(statusValue) as 0 | 1 | 2 | 3;
                      if (Number.isNaN(status) || status < 0 || status > 3) return;
                      statusMutation.mutate({
                        id: data.id,
                        status,
                        ghi_chu: ghiChu.trim() || null,
                      });
                    }}
                    disabled={statusMutation.isPending}
                    className="bg-primary text-white"
                  >
                    {statusMutation.isPending ? t('common.saving') : t('common.confirm')}
                  </Button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Section 1: Thông tin cơ bản */}
        <DetailSection
          title={t('deXuatTuyenDung.detail.basicInfo')}
          icon={<ListOrdered size={14} />}
          variant="primary"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <DetailField label={t('deXuatTuyenDung.store.maDeXuatCol')} value={data.ma_de_xuat} />
            <DetailField label={t('deXuatTuyenDung.store.chucVuCol')} value={data.ten_chuc_vu ?? '—'} />
            {data.ten_phong_ban && (
              <DetailField label={t('deXuatTuyenDung.detail.phongBan')} value={data.ten_phong_ban} className="sm:col-span-2" />
            )}
            {data.tieu_de && (
              <DetailField label={t('deXuatTuyenDung.store.tieuDeCol')} value={data.tieu_de} className="sm:col-span-2" />
            )}
            <DetailField
              label={t('deXuatTuyenDung.store.statusCol')}
              value={
                <span
                  className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border w-fit ${getStatusBadgeClass(data.trang_thai)}`}
                >
                  {statusLabel}
                </span>
              }
            />
            {data.ghi_chu != null && data.ghi_chu.trim() !== '' && (
              <DetailField
                label={t('deXuatTuyenDung.detail.ghiChu')}
                value={data.ghi_chu}
                className="sm:col-span-2"
              />
            )}
          </div>
        </DetailSection>

        {/* Section 2: Nội dung tuyển dụng */}
        <DetailSection
          title={t('deXuatTuyenDung.detail.jobContent')}
          icon={<FileText size={14} />}
          variant="primary"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <DetailField
                label={t('deXuatTuyenDung.detail.moTa')}
                value={data.mo_ta || '—'}
              />
            </div>
            <div className="sm:col-span-2">
              <DetailField
                label={t('deXuatTuyenDung.detail.yeuCau')}
                value={data.yeu_cau || '—'}
              />
            </div>
            {data.link_tuyen ? (
              <div className="sm:col-span-2">
                <p className="text-body-sm text-muted-foreground mb-1">{t('deXuatTuyenDung.detail.linkTuyen')}</p>
                <a
                  href={data.link_tuyen}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline"
                >
                  <ExternalLink size={14} />
                  {data.link_tuyen}
                </a>
              </div>
            ) : null}
          </div>
        </DetailSection>

        {/* Section 3: Số lượng & thời hạn */}
        <DetailSection
          title={t('deXuatTuyenDung.detail.quantityAndDeadline')}
          icon={<Calendar size={14} />}
          variant="primary"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <DetailField label={t('deXuatTuyenDung.detail.soLuong')} value={String(data.so_luong)} />
            <DetailField
              label={t('deXuatTuyenDung.detail.soLuongOnboard')}
              value={String(soLuongOnboard)}
            />
            <DetailField
              label={t('deXuatTuyenDung.detail.soLuongDaNghi')}
              value={String(soLuongDaNghi)}
            />
            <DetailField
              label={t('deXuatTuyenDung.detail.soLuongConLai')}
              value={String(soLuongConLai)}
            />
            <DetailField
              label={t('deXuatTuyenDung.detail.hanNop')}
              value={data.han_nop ? formatDateTimeShort(data.han_nop) : '—'}
            />
            <DetailField
              label={t('deXuatTuyenDung.detail.tgTao')}
              value={formatDateTimeShort(data.tg_tao)}
            />
            <DetailField
              label={t('deXuatTuyenDung.detail.tgCapNhat')}
              value={formatDateTimeShort(data.tg_cap_nhat)}
            />
          </div>
        </DetailSection>

        {/* Section 4: Ứng viên (bảng con generic: Thêm, Sửa, Xóa) */}
        <UngVienSubTable
          items={candidates}
          loading={loadingUngVien}
          addLabel={onAddUngVien != null ? t('deXuatTuyenDung.detail.addUngVien') : undefined}
          onAdd={onAddUngVien}
          onView={onViewUngVien}
          onEdit={onEditUngVien}
          onDelete={onDeleteUngVien}
        />
      </div>
    </GenericDrawer>
  );
};

export default DeXuatTuyenDungDetail;
