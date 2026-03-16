import React, { useMemo, useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { AnimatePresence, motion } from 'framer-motion';
import { Edit, Trash2, CreditCard, Calendar, Building2, Users, Tag, User, RefreshCw, Printer, X } from 'lucide-react';
import Button from '../../../../components/ui/Button';
import Input from '../../../../components/ui/Input';
import Textarea from '../../../../components/ui/Textarea';
import Combobox from '../../../../components/ui/Combobox';
import type { ThanhToanDoiTac } from '../core/types';
import type { TrangThaiThanhToanDoiTac } from '../../thiet-lap-de-xuat-vat-tu/core/types';
import { formatDateTimeShort, getTodayISO } from '../../../../lib/utils';
import GenericDrawer, { DRAWER_WIDTH_DETAIL } from '../../../../components/shared/GenericDrawer';
import DetailToolbar, { type DetailToolbarAction } from '../../../../components/shared/DetailToolbar';
import DetailSection from '../../../../components/shared/DetailSection';
import DetailField from '../../../../components/shared/DetailField';
import DetailFieldGrid from '../../../../components/shared/DetailFieldGrid';
import { BTN_CLOSE, BTN_EDIT, BTN_DELETE } from '../../../../lib/button-labels';

const PREVIEW_BASE = '/mua-hang/thanh-toan-doi-tac/preview';

export interface ThanhToanDoiTacChangeStatusPayload {
  idTrangThai: string;
  ngayXuLy?: string;
  ghiChu?: string;
}

interface Props {
  data: ThanhToanDoiTac;
  onClose: () => void;
  onEdit?: (item: ThanhToanDoiTac) => void;
  onDelete?: (id: string) => void;
  /** Gọi khi bấm Chuyển trạng thái và xác nhận trong popup */
  onChangeStatus?: (item: ThanhToanDoiTac, payload: ThanhToanDoiTacChangeStatusPayload) => void;
  onPrint?: (item: ThanhToanDoiTac) => void;
  statusList?: TrangThaiThanhToanDoiTac[];
}

const ThanhToanDoiTacDetail: React.FC<Props> = ({
  data,
  onClose,
  onEdit,
  onDelete,
  onChangeStatus,
  onPrint,
  statusList = [],
}) => {
  const { t } = useTranslation();
  const [showChangeStatusPopup, setShowChangeStatusPopup] = useState(false);
  const [changeStatusIdTrangThai, setChangeStatusIdTrangThai] = useState('');
  const [changeStatusNgayXuLy, setChangeStatusNgayXuLy] = useState('');
  const [changeStatusGhiChu, setChangeStatusGhiChu] = useState('');

  const statusOptions = useMemo(
    () =>
      statusList.map((s) => ({ value: s.id, label: s.ten })),
    [statusList]
  );

  useEffect(() => {
    if (showChangeStatusPopup) {
      setChangeStatusIdTrangThai(data.id_trang_thai_thanh_toan || (statusList[0]?.id ?? ''));
      setChangeStatusNgayXuLy(data.ngay_xu_ly ?? getTodayISO().slice(0, 10));
      setChangeStatusGhiChu('');
    }
  }, [showChangeStatusPopup, data.id_trang_thai_thanh_toan, data.ngay_xu_ly, statusList]);

  const handleChangeStatusConfirm = () => {
    if (!changeStatusIdTrangThai) return;
    onChangeStatus?.(data, {
      idTrangThai: changeStatusIdTrangThai,
      ngayXuLy: changeStatusNgayXuLy.trim() || undefined,
      ghiChu: changeStatusGhiChu.trim() || undefined,
    });
    setShowChangeStatusPopup(false);
  };

  const showChangeStatusButton = !!onChangeStatus && statusList.length > 0;

  const toolbarActions: DetailToolbarAction[] = useMemo(
    () => [
      ...(showChangeStatusButton
        ? [
            {
              label: t('thanhToanDoiTac.detail.toolbar.changeStatus'),
              icon: <RefreshCw size={16} />,
              onClick: () => setShowChangeStatusPopup(true),
              variant: 'primary' as const,
            },
          ]
        : []),
      {
        label: t('thanhToanDoiTac.detail.toolbar.print'),
        icon: <Printer size={16} />,
        onClick: () => {
          if (onPrint) onPrint(data);
          else window.open(`${PREVIEW_BASE}/${data.id}`, '_blank', 'noopener,noreferrer');
        },
        variant: 'primary' as const,
      },
    ],
    [showChangeStatusButton, data, onPrint, t]
  );

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
        {onEdit && (
          <Button
            onClick={() => {
              onEdit(data);
              onClose();
            }}
            className="bg-primary text-white shadow-lg hover:bg-primary/90"
          >
            <Edit size={16} className="mr-2" /> {BTN_EDIT()}
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
            <Trash2 size={16} className="mr-2" /> {BTN_DELETE()}
          </Button>
        )}
      </div>
    </div>
  );

  return (
    <>
      <GenericDrawer
        title={t('thanhToanDoiTac.detail.title')}
        subtitle={data.so_phieu}
        icon={<CreditCard size={18} />}
        onClose={onClose}
        footer={renderFooter}
        maxWidthClass={DRAWER_WIDTH_DETAIL}
      >
        <div className="space-y-5">
          <div className="bg-card p-4 rounded-xl border border-border/50 shadow-sm flex items-center gap-4">
            <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center text-white shadow-primary/20 shadow-lg shrink-0">
              <CreditCard size={24} className="text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-base font-bold text-foreground leading-tight truncate">{data.so_phieu}</h2>
              <p className="text-body-sm text-muted-foreground mt-0.5">{data.hang_muc_thanh_toan}</p>
              <div className="mt-1.5">
                <span
                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${!data.mau_trang_thai ? 'bg-muted/50 text-muted-foreground border-border' : ''}`}
                  style={
                    data.mau_trang_thai
                      ? { backgroundColor: `${data.mau_trang_thai}20`, borderColor: data.mau_trang_thai, color: data.mau_trang_thai }
                      : undefined
                  }
                >
                  {data.ten_trang_thai ?? '—'}
                </span>
              </div>
            </div>
          </div>

          <DetailToolbar actions={toolbarActions} className="bg-card rounded-xl border border-border" />

          <DetailSection title={t('thanhToanDoiTac.detail.basicInfo')} icon={<CreditCard size={14} />} variant="primary">
            <DetailFieldGrid>
              <DetailField label={t('thanhToanDoiTac.form.soPhieu')} value={data.so_phieu} icon={<CreditCard size={12} />} />
              <DetailField label={t('thanhToanDoiTac.form.hangMuc')} value={data.hang_muc_thanh_toan} icon={<CreditCard size={12} />} className="col-span-1 sm:col-span-2" />
              <DetailField label={t('thanhToanDoiTac.form.ngay')} value={data.ngay} icon={<Calendar size={12} />} />
              <DetailField label={t('thanhToanDoiTac.form.donVi')} value={data.ten_don_vi ?? '—'} icon={<Building2 size={12} />} />
              <DetailField label={t('thanhToanDoiTac.form.doiTac')} value={data.ten_doi_tac ?? '—'} icon={<Users size={12} />} />
              <DetailField
                label={t('thanhToanDoiTac.form.trangThai')}
                value={
                  data.mau_trang_thai ? (
                    <span
                      className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border"
                      style={{ backgroundColor: `${data.mau_trang_thai}20`, borderColor: data.mau_trang_thai, color: data.mau_trang_thai }}
                    >
                      {data.ten_trang_thai ?? '—'}
                    </span>
                  ) : (
                    (data.ten_trang_thai ?? '—')
                  )
                }
                icon={<Tag size={12} />}
              />
              <DetailField label={t('thanhToanDoiTac.form.soTien')} value={data.so_tien != null ? data.so_tien.toLocaleString('vi-VN') : '—'} icon={<CreditCard size={12} />} />
              <DetailField label={t('thanhToanDoiTac.form.ngayXuLy')} value={data.ngay_xu_ly ?? '—'} icon={<Calendar size={12} />} />
              <DetailField label={t('thanhToanDoiTac.form.ghiChu')} value={data.ghi_chu ?? '—'} icon={<CreditCard size={12} />} className="col-span-1 sm:col-span-2" />
              <DetailField label={t('thanhToanDoiTac.form.nguoiTao')} value={data.ten_nguoi_tao ?? '—'} icon={<User size={12} />} />
            </DetailFieldGrid>
          </DetailSection>

          <DetailSection title={t('thanhToanDoiTac.detail.systemInfo')} icon={<Calendar size={14} />} variant="secondary">
            <DetailFieldGrid>
              <DetailField label={t('thanhToanDoiTac.detail.createdAt')} value={formatDateTimeShort(data.tg_tao)} icon={<Calendar size={12} />} />
              <DetailField label={t('thanhToanDoiTac.detail.updatedAt')} value={formatDateTimeShort(data.tg_cap_nhat)} icon={<Calendar size={12} />} />
            </DetailFieldGrid>
          </DetailSection>
        </div>
      </GenericDrawer>

      <AnimatePresence>
        {showChangeStatusPopup && statusOptions.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50"
            onClick={() => setShowChangeStatusPopup(false)}
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
                  {t('thanhToanDoiTac.detail.changeStatusDialogTitle')}
                </h3>
                <button
                  type="button"
                  onClick={() => setShowChangeStatusPopup(false)}
                  className="p-1.5 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground"
                  aria-label={t('common.close')}
                >
                  <X size={18} />
                </button>
              </div>
              <div className="space-y-4">
                <Combobox
                  label={t('thanhToanDoiTac.form.trangThai')}
                  options={statusOptions}
                  value={changeStatusIdTrangThai}
                  onChange={setChangeStatusIdTrangThai}
                  placeholder={t('thanhToanDoiTac.detail.changeStatusSelectStatus')}
                />
                <Input
                  label={t('thanhToanDoiTac.form.ngayXuLy')}
                  type="date"
                  value={changeStatusNgayXuLy}
                  onChange={(e) => setChangeStatusNgayXuLy(e.target.value)}
                />
                <Textarea
                  label={t('thanhToanDoiTac.detail.changeStatusDialogNote')}
                  placeholder={t('thanhToanDoiTac.detail.approveDialogNotePlaceholder')}
                  value={changeStatusGhiChu}
                  onChange={(e) => setChangeStatusGhiChu(e.target.value)}
                  rows={3}
                  className="resize-none"
                />
              </div>
              <div className="flex justify-end gap-2 mt-5">
                <Button variant="ghost" onClick={() => setShowChangeStatusPopup(false)} className="border border-border">
                  {t('common.cancel')}
                </Button>
                <Button onClick={handleChangeStatusConfirm} className="bg-primary text-white">
                  {t('common.confirm')}
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default ThanhToanDoiTacDetail;
