import React, { useMemo, useState, useCallback, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { Building2, Edit, Trash2, ArrowLeftRight, Plus, Power, Image as ImageIcon, Wrench, Printer, ClipboardCheck, Calculator, FileText, X } from 'lucide-react';
import GenericDrawer, { DRAWER_WIDTH_DETAIL } from '../../../../components/shared/GenericDrawer';
import DetailSection from '../../../../components/shared/DetailSection';
import DetailField from '../../../../components/shared/DetailField';
import DetailToolbar, { DetailToolbarAction } from '../../../../components/shared/DetailToolbar';
import EmptyState from '../../../../components/shared/EmptyState';
import Button from '../../../../components/ui/Button';
import Textarea from '../../../../components/ui/Textarea';
import { BTN_CLOSE, BTN_EDIT, BTN_DELETE } from '../../../../lib/button-labels';
import { formatDateTimeShort, formatCurrency, formatDate, cn } from '../../../../lib/utils';
import { usePhieuList } from '../../cap-phat-thu-hoi/hooks/use-cap-phat-thu-hoi';
import { getLoaiPhieuLabel } from '../../cap-phat-thu-hoi/core/constants';
import { usePhieuBaoTriList } from '../../bao-tri-sua-chua/hooks/use-bao-tri-sua-chua';
import { getHangMucLabel } from '../../bao-tri-sua-chua/core/constants';
import type { TaiSan } from '../core/types';
import BarcodeQRDisplay from './BarcodeQRDisplay';
import type { PhieuCapPhatThuHoi } from '../../cap-phat-thu-hoi/core/types';
import type { PhieuBaoTriSuaChua } from '../../bao-tri-sua-chua/core/types';

interface Props {
  data: TaiSan;
  onClose: () => void;
  onEdit: (item: TaiSan) => void;
  onDelete?: (id: string) => void;
  showActions?: boolean;
  /** Bảng con Lịch sử cấp phát / Thu hồi: thêm phiếu (mở form với tài sản = data) */
  onAddPhieu?: (taiSan: TaiSan) => void;
  /** Sửa phiếu (mở form sửa) */
  onEditPhieu?: (phieu: PhieuCapPhatThuHoi) => void;
  /** Xóa phiếu (parent nên gọi confirm rồi delete) */
  onDeletePhieu?: (phieu: PhieuCapPhatThuHoi) => void;
  /** Sửa phiếu bảo trì / sửa chữa (mở form sửa) */
  onEditPhieuBaoTri?: (phieu: PhieuBaoTriSuaChua) => void;
  /** Xóa phiếu bảo trì (parent nên gọi confirm rồi delete) */
  onDeletePhieuBaoTri?: (phieu: PhieuBaoTriSuaChua) => void;
  /** Thêm phiếu bảo trì / sửa chữa (mở form với tài sản = data) */
  onAddPhieuBaoTri?: (taiSan: TaiSan) => void;
  /** Chuyển trạng thái — parent mở popup chọn id_trang_thai */
  onStatusChange?: (item: TaiSan) => void;
  /** Cập nhật ảnh tài sản — parent mở dialog nhập URL rồi gọi updateTaiSan */
  onUpdateImage?: (item: TaiSan) => void;
  /** Điền ghi chú — parent gọi updateTaiSan với ghi_chu rồi cập nhật item */
  onUpdateGhiChu?: (taiSan: TaiSan, ghiChu: string) => void;
}

const TaiSanDetail: React.FC<Props> = ({
  data,
  onClose,
  onEdit,
  onDelete,
  showActions = true,
  onAddPhieu,
  onEditPhieu,
  onDeletePhieu,
  onEditPhieuBaoTri,
  onDeletePhieuBaoTri,
  onAddPhieuBaoTri,
  onStatusChange,
  onUpdateImage,
  onUpdateGhiChu,
}) => {
  const { t } = useTranslation();
  const [ghiChuOpen, setGhiChuOpen] = useState(false);
  const [ghiChuValue, setGhiChuValue] = useState(data.ghi_chu ?? '');

  useEffect(() => {
    if (ghiChuOpen) setGhiChuValue(data.ghi_chu ?? '');
  }, [ghiChuOpen, data.ghi_chu]);

  const handleSaveGhiChu = useCallback(() => {
    if (onUpdateGhiChu) onUpdateGhiChu(data, ghiChuValue.trim());
    setGhiChuOpen(false);
  }, [data, ghiChuValue, onUpdateGhiChu]);

  const isActive = data.trang_thai === 1;

  /** URL trang in hồ sơ tài sản (mở tab mới), dùng HashRouter */
  const getHoSoTaiSanPreviewUrl = (id: string) =>
    `/ho-so-tai-san/${encodeURIComponent(id)}`;

  const getHanhChinhModuleUrl = (slug: string) =>
    `/hanh-chinh/${slug}`;

  const toolbarActions: DetailToolbarAction[] = [
    {
      label: t('danhSachTaiSan.detail.printProfile'),
      icon: <Printer size={16} />,
      onClick: () => window.open(getHoSoTaiSanPreviewUrl(data.id), '_blank', 'noopener,noreferrer'),
      variant: 'primary' as const,
    },
    ...(onAddPhieu
      ? [
          {
            label: t('danhSachTaiSan.detail.addCapPhatThuHoi'),
            icon: <ArrowLeftRight size={16} />,
            onClick: () => onAddPhieu(data),
            variant: 'primary' as const,
          },
        ]
      : []),
    ...(onAddPhieuBaoTri
      ? [
          {
            label: t('danhSachTaiSan.detail.addBaoTriSuaChua'),
            icon: <Wrench size={16} />,
            onClick: () => onAddPhieuBaoTri(data),
            variant: 'primary' as const,
          },
        ]
      : []),
    ...(onUpdateImage
      ? [
          {
            label: t('danhSachTaiSan.detail.updateImage'),
            icon: <ImageIcon size={16} />,
            onClick: () => onUpdateImage(data),
            variant: 'default' as const,
          },
        ]
      : []),
    ...(onStatusChange
      ? [
          {
            label: t('danhSachTaiSan.detail.changeStatus'),
            icon: <Power size={16} />,
            onClick: () => onStatusChange(data),
            variant: 'info' as const,
          },
        ]
      : []),
    ...(onUpdateGhiChu
      ? [
          {
            label: t('danhSachTaiSan.detail.fillNote'),
            icon: <FileText size={16} />,
            onClick: () => setGhiChuOpen(true),
            variant: 'outline' as const,
          },
        ]
      : []),
    {
      label: t('danhSachTaiSan.detail.linkKiemKe'),
      icon: <ClipboardCheck size={16} />,
      onClick: () => window.open(getHanhChinhModuleUrl('kiem-ke-tai-san'), '_blank', 'noopener,noreferrer'),
      variant: 'default' as const,
    },
    {
      label: t('danhSachTaiSan.detail.linkKhauHao'),
      icon: <Calculator size={16} />,
      onClick: () => window.open(getHanhChinhModuleUrl('khau-hao-tai-san'), '_blank', 'noopener,noreferrer'),
      variant: 'default' as const,
    },
  ];
  const { data: phieuList = [], isLoading: phieuLoading } = usePhieuList({ filter: 'all', id_tai_san: data.id });
  const phieuSorted = useMemo(
    () => [...phieuList].sort((a, b) => (b.ngay_thuc_hien || '').localeCompare(a.ngay_thuc_hien || '')),
    [phieuList]
  );
  const { data: phieuBaoTriList = [], isLoading: phieuBaoTriLoading } = usePhieuBaoTriList({ id_tai_san: data.id });
  const phieuBaoTriSorted = useMemo(
    () => [...phieuBaoTriList].sort((a, b) => (b.ngay_yeu_cau || '').localeCompare(a.ngay_yeu_cau || '')),
    [phieuBaoTriList]
  );

  const renderFooter = showActions ? (
    <div className="flex items-center justify-between w-full flex-wrap gap-2">
      <Button
        variant="ghost"
        onClick={onClose}
        className="text-muted-foreground hover:text-foreground border border-border"
      >
        {BTN_CLOSE()}
      </Button>
      <div className="flex items-center gap-3 flex-wrap">
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
  ) : (
    <Button variant="outline" onClick={onClose} className="border border-border">
      {BTN_CLOSE()}
    </Button>
  );

  return (
    <GenericDrawer
      title={data.ten_tai_san}
      icon={<Building2 size={20} />}
      subtitle={data.ma_tai_san}
      onClose={onClose}
      footer={renderFooter}
      maxWidthClass={DRAWER_WIDTH_DETAIL}
    >
      <div className="space-y-5">
        <div className="bg-card p-4 rounded-xl border border-border/50 shadow-sm flex items-center gap-4">
          {data.hinh_anh ? (
            <img
              src={data.hinh_anh}
              alt=""
              className="h-20 w-20 rounded-xl object-cover border border-border shadow-sm shrink-0"
            />
          ) : (
            <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center text-white shadow-primary/20 shadow-lg shrink-0">
              <Building2 size={24} className="text-white" />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <h2 className="text-base font-bold text-foreground leading-tight truncate">
              {data.ten_tai_san}
            </h2>
            <p className="text-body-sm text-muted-foreground font-mono mt-0.5">
              {data.ma_tai_san} · {data.ten_nhom || '—'}
            </p>
            <div className="mt-1.5 flex flex-wrap items-center gap-2">
              {isActive ? (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-medium border border-primary/20">
                  {t('common.active')}
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-muted text-muted-foreground text-xs font-medium border border-border">
                  {t('common.inactive')}
                </span>
              )}
              {data.ten_trang_thai && (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-muted/50 text-foreground text-xs font-medium border border-border">
                  {data.ten_trang_thai}
                </span>
              )}
            </div>
          </div>
        </div>

        {toolbarActions.length > 0 && (
          <DetailToolbar actions={toolbarActions} className="bg-card rounded-xl border border-border" />
        )}

        <DetailSection
          title={t('danhSachTaiSan.form.basicInfo')}
          icon={<Building2 size={14} />}
          variant="primary"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <DetailField label={t('danhSachTaiSan.store.maCol')} value={data.ma_tai_san} />
            <DetailField label={t('danhSachTaiSan.store.tenCol')} value={data.ten_tai_san} />
            <DetailField label={t('danhSachTaiSan.store.nhomCol')} value={data.ten_nhom || '—'} />
            <DetailField label={t('danhSachTaiSan.store.noiLuuCol')} value={data.ten_noi_luu || '—'} />
            <DetailField label={t('danhSachTaiSan.store.chiNhanhCol')} value={data.ten_chi_nhanh || '—'} />
            <DetailField label={t('danhSachTaiSan.store.trangThaiCol')} value={data.ten_trang_thai || '—'} />
            <DetailField label={t('danhSachTaiSan.store.thuongHieuCol')} value={data.thuong_hieu || '—'} />
            <DetailField label={t('danhSachTaiSan.store.modelCol')} value={data.model || '—'} />
            <DetailField label={t('danhSachTaiSan.store.serialCol')} value={data.serial || '—'} />
            <DetailField label={t('danhSachTaiSan.store.xuatXuCol')} value={data.xuat_xu || '—'} />
            {data.ma_barcode?.trim() ? (
              <div className="col-span-1 sm:col-span-2">
                <p className="text-xs font-medium text-muted-foreground mb-2">{t('danhSachTaiSan.store.maBarcodeCol')}</p>
                <BarcodeQRDisplay value={data.ma_barcode} qrSize={120} barcodeHeight={48} />
              </div>
            ) : (
              <DetailField label={t('danhSachTaiSan.store.maBarcodeCol')} value="—" />
            )}
            <DetailField label={t('danhSachTaiSan.store.nhaCungCapCol')} value={data.ten_nha_cung_cap || '—'} />
            <DetailField label={t('danhSachTaiSan.store.nguoiTaoCol')} value={data.ten_nguoi_tao || '—'} />
            <DetailField
              label={t('danhSachTaiSan.store.nguoiGiuCol')}
              value={data.ten_nhan_vien_dang_giu ? `${data.ten_nhan_vien_dang_giu}${data.ma_nhan_vien_dang_giu ? ` (${data.ma_nhan_vien_dang_giu})` : ''}` : '—'}
            />
            <DetailField label={t('danhSachTaiSan.store.ngayNhapCol')} value={formatDate(data.ngay_nhap)} />
            <DetailField
              label={t('danhSachTaiSan.store.nguyenGiaCol')}
              value={data.nguyen_gia != null ? formatCurrency(data.nguyen_gia) : '—'}
            />
            <DetailField
              label={t('danhSachTaiSan.detail.ngayBatDauTrichKhauHao')}
              value={data.ngay_bat_dau_trich_khau_hao ? formatDate(data.ngay_bat_dau_trich_khau_hao) : '—'}
            />
            <DetailField
              label={t('danhSachTaiSan.detail.giaTriConLai')}
              value={data.gia_tri_con_lai != null ? formatCurrency(data.gia_tri_con_lai) : '—'}
            />
            <DetailField
              label={t('danhSachTaiSan.detail.khauHaoLuyKe')}
              value={data.khau_hao_luy_ke != null ? formatCurrency(data.khau_hao_luy_ke) : '—'}
            />
            {data.ghi_chu ? (
              <div className="col-span-1 sm:col-span-2">
                <DetailField label={t('danhSachTaiSan.form.ghiChu')} value={data.ghi_chu} />
              </div>
            ) : null}
            <DetailField
              label={t('danhSachTaiSan.store.updatedCol')}
              value={formatDateTimeShort(data.tg_cap_nhat)}
            />
          </div>
        </DetailSection>

        {/* Bảng con: Lịch sử cấp phát / Thu hồi — chuẩn generic như Dự án > Công việc */}
        <div className="w-full bg-card p-3.5 sm:p-4 md:p-5 rounded-xl border border-border shadow-sm space-y-2.5 sm:space-y-3">
          <div className="flex items-center gap-3 pb-2 sm:pb-2.5">
            <div className="flex items-center gap-2 shrink-0">
              <ArrowLeftRight size={14} className="text-primary" />
              <h4 className="text-[11px] sm:text-xs font-semibold uppercase tracking-wider text-primary font-bold">
                {t('danhSachTaiSan.detail.phieuHistorySection')}
              </h4>
              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium tabular-nums bg-primary/10 text-primary border border-primary/20">
                {phieuSorted.length}
              </span>
            </div>
            <div className="flex-1 self-center h-px border-b border-dashed border-border/80 mx-1" aria-hidden />
            {onAddPhieu && (
              <Button
                type="button"
                size="sm"
                onClick={() => onAddPhieu(data)}
                className="bg-primary text-white hover:bg-primary/90 shadow-sm h-8 px-3 shrink-0"
              >
                <Plus size={14} className="mr-1.5" />
                {t('danhSachTaiSan.detail.addPhieu')}
              </Button>
            )}
          </div>
          {phieuLoading ? (
            <div className="py-6 text-center text-sm text-muted-foreground">
              {t('danhSachTaiSan.loading')}
            </div>
          ) : phieuSorted.length === 0 ? (
            <EmptyState
              title={t('capPhatThuHoi.empty')}
              description={t('capPhatThuHoi.emptyHint')}
              icon={<ArrowLeftRight className="w-10 h-10 text-muted-foreground" />}
              action={
                onAddPhieu ? (
                  <Button type="button" size="sm" onClick={() => onAddPhieu(data)} className="bg-primary text-white hover:bg-primary/90">
                    <Plus size={14} className="mr-2" />
                    {t('danhSachTaiSan.detail.addPhieu')}
                  </Button>
                ) : undefined
              }
            />
          ) : (
            <div className="rounded-xl border border-border overflow-hidden bg-card">
              <div className="overflow-x-auto max-h-[320px] overflow-y-auto custom-scrollbar">
                <table className="w-full text-sm text-left border-collapse">
                  <thead className="sticky top-0 z-[1] bg-muted border-b border-border">
                    <tr>
                      <th className="px-4 py-2 font-semibold text-foreground/80 text-xs whitespace-nowrap">{t('capPhatThuHoi.store.loaiCol')}</th>
                      <th className="px-4 py-2 font-semibold text-foreground/80 text-xs whitespace-nowrap">{t('capPhatThuHoi.store.noiLuuTruocCol')}</th>
                      <th className="px-4 py-2 font-semibold text-foreground/80 text-xs whitespace-nowrap">{t('capPhatThuHoi.store.noiLuuSauCol')}</th>
                      <th className="px-4 py-2 font-semibold text-foreground/80 text-xs whitespace-nowrap">{t('capPhatThuHoi.store.nguoiGiuSauCol')}</th>
                      <th className="px-4 py-2 font-semibold text-foreground/80 text-xs whitespace-nowrap">{t('capPhatThuHoi.store.ngayCol')}</th>
                      <th className="px-4 py-2 font-semibold text-foreground/80 text-xs whitespace-nowrap">{t('capPhatThuHoi.store.nguoiThucHienCol')}</th>
                      {(onEditPhieu || onDeletePhieu) && (
                        <th className="sticky right-0 z-[2] px-4 py-2 font-semibold text-foreground/80 text-xs text-center w-24 bg-muted border-l border-border min-w-[96px]">
                          {t('common.actions')}
                        </th>
                      )}
                    </tr>
                  </thead>
                  <tbody className="[&>tr>td]:border-b [&>tr>td]:border-border">
                    {phieuSorted.map((p) => (
                      <tr key={p.id} className="hover:bg-muted/60 transition-colors">
                        <td className="px-4 py-2.5">
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary border border-primary/20">
                            {getLoaiPhieuLabel(p.loai_phieu, t)}
                          </span>
                        </td>
                        <td className="px-4 py-2.5 text-foreground">{p.ten_noi_luu_truoc || '—'}</td>
                        <td className="px-4 py-2.5 text-foreground">{p.ten_noi_luu_sau || '—'}</td>
                        <td className="px-4 py-2.5 text-foreground">{p.ten_nguoi_giu_sau || '—'}</td>
                        <td className="px-4 py-2.5 tabular-nums text-muted-foreground">{formatDate(p.ngay_thuc_hien)}</td>
                        <td className="px-4 py-2.5 text-foreground">{p.ten_nguoi_thuc_hien || '—'}</td>
                        {(onEditPhieu || onDeletePhieu) && (
                          <td className="sticky right-0 z-[1] px-4 py-2.5 text-center bg-card border-l border-border/50" onClick={(e) => e.stopPropagation()}>
                            <div className="flex items-center justify-center gap-0.5">
                              {onEditPhieu && (
                                <button
                                  type="button"
                                  onClick={() => onEditPhieu(p)}
                                  className="p-1.5 text-primary hover:bg-primary/10 rounded-md transition-all"
                                  title={t('common.edit')}
                                >
                                  <Edit size={14} />
                                </button>
                              )}
                              {onDeletePhieu && (
                                <button
                                  type="button"
                                  onClick={() => onDeletePhieu(p)}
                                  className="p-1.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-md transition-all"
                                  title={t('common.delete')}
                                >
                                  <Trash2 size={14} />
                                </button>
                              )}
                            </div>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Bảng con: Lịch sử bảo trì / Sửa chữa — link Thêm phiếu tới trang Bảo trì với ?tai_san_id= */}
        <div className="w-full bg-card p-3.5 sm:p-4 md:p-5 rounded-xl border border-border shadow-sm space-y-2.5 sm:space-y-3">
          <div className="flex items-center gap-3 pb-2 sm:pb-2.5">
            <div className="flex items-center gap-2 shrink-0">
              <Wrench size={14} className="text-primary" />
              <h4 className="text-[11px] sm:text-xs font-semibold uppercase tracking-wider text-primary font-bold">
                {t('danhSachTaiSan.detail.baoTriSuaChuaSection')}
              </h4>
              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium tabular-nums bg-primary/10 text-primary border border-primary/20">
                {phieuBaoTriSorted.length}
              </span>
            </div>
            <div className="flex-1 self-center h-px border-b border-dashed border-border/80 mx-1" aria-hidden />
            {onAddPhieuBaoTri && (
              <Button
                type="button"
                size="sm"
                onClick={() => onAddPhieuBaoTri(data)}
                className="bg-primary text-white hover:bg-primary/90 shadow-sm h-8 px-3 shrink-0"
              >
                <Plus size={14} className="mr-1.5" />
                {t('danhSachTaiSan.detail.addBaoTriPhieu')}
              </Button>
            )}
          </div>
          {phieuBaoTriLoading ? (
            <div className="py-6 text-center text-sm text-muted-foreground">
              {t('danhSachTaiSan.loading')}
            </div>
          ) : phieuBaoTriSorted.length === 0 ? (
            <EmptyState
              title={t('baoTriSuaChua.empty')}
              description={t('baoTriSuaChua.emptyHint')}
              icon={<Wrench className="w-10 h-10 text-muted-foreground" />}
              action={
                onAddPhieuBaoTri ? (
                  <Button type="button" size="sm" onClick={() => onAddPhieuBaoTri(data)} className="bg-primary text-white hover:bg-primary/90">
                    <Plus size={14} className="mr-2" />
                    {t('danhSachTaiSan.detail.addBaoTriPhieu')}
                  </Button>
                ) : undefined
              }
            />
          ) : (
            <div className="rounded-xl border border-border overflow-hidden bg-card">
              <div className="overflow-x-auto max-h-[280px] overflow-y-auto custom-scrollbar">
                <table className="w-full text-sm text-left border-collapse">
                  <thead className="sticky top-0 z-[1] bg-muted border-b border-border">
                    <tr>
                      <th className="px-4 py-2 font-semibold text-foreground/80 text-xs whitespace-nowrap">{t('baoTriSuaChua.store.hangMucCol')}</th>
                      <th className="px-4 py-2 font-semibold text-foreground/80 text-xs whitespace-nowrap">{t('baoTriSuaChua.store.ngayYeuCauCol')}</th>
                      <th className="px-4 py-2 font-semibold text-foreground/80 text-xs whitespace-nowrap">{t('baoTriSuaChua.store.ngayHenCol')}</th>
                      <th className="px-4 py-2 font-semibold text-foreground/80 text-xs whitespace-nowrap">{t('baoTriSuaChua.store.nguoiPhuTrachCol')}</th>
                      <th className="px-4 py-2 font-semibold text-foreground/80 text-xs whitespace-nowrap">{t('baoTriSuaChua.store.trangThaiCol')}</th>
                      {(onEditPhieuBaoTri || onDeletePhieuBaoTri) && (
                        <th className="sticky right-0 z-[2] px-4 py-2 font-semibold text-foreground/80 text-xs text-center w-24 bg-muted border-l border-border min-w-[96px]">
                          {t('common.actions')}
                        </th>
                      )}
                    </tr>
                  </thead>
                  <tbody className="[&>tr>td]:border-b [&>tr>td]:border-border">
                    {phieuBaoTriSorted.map((p) => (
                      <tr key={p.id} className="hover:bg-muted/60 transition-colors">
                        <td className="px-4 py-2.5">
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary border border-primary/20">
                            {getHangMucLabel(p.hang_muc, t)}
                          </span>
                        </td>
                        <td className="px-4 py-2.5 tabular-nums text-muted-foreground">{formatDate(p.ngay_yeu_cau)}</td>
                        <td className="px-4 py-2.5 tabular-nums text-muted-foreground">{formatDate(p.ngay_hen)}</td>
                        <td className="px-4 py-2.5 text-foreground">{p.ten_nguoi_phu_trach || '—'}</td>
                        <td className="px-4 py-2.5">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${p.trang_thai === 1 ? 'bg-primary/10 text-primary border border-primary/20' : 'bg-muted text-muted-foreground border border-border'}`}>
                            {p.trang_thai === 1 ? t('baoTriSuaChua.statusCompleted') : t('baoTriSuaChua.statusPending')}
                          </span>
                        </td>
                        {(onEditPhieuBaoTri || onDeletePhieuBaoTri) && (
                          <td className="sticky right-0 z-[1] px-4 py-2.5 text-center bg-card border-l border-border/50" onClick={(e) => e.stopPropagation()}>
                            <div className="flex items-center justify-center gap-0.5">
                              {onEditPhieuBaoTri && (
                                <button
                                  type="button"
                                  onClick={() => onEditPhieuBaoTri(p)}
                                  className="p-1.5 text-primary hover:bg-primary/10 rounded-md transition-all"
                                  title={t('common.edit')}
                                >
                                  <Edit size={14} />
                                </button>
                              )}
                              {onDeletePhieuBaoTri && (
                                <button
                                  type="button"
                                  onClick={() => onDeletePhieuBaoTri(p)}
                                  className="p-1.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-md transition-all"
                                  title={t('common.delete')}
                                >
                                  <Trash2 size={14} />
                                </button>
                              )}
                            </div>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>

      <AnimatePresence>
        {ghiChuOpen && onUpdateGhiChu && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setGhiChuOpen(false)}
              className="fixed inset-0 z-[60] bg-black/20 backdrop-blur-md"
            />
            <div className="fixed inset-0 z-[61] flex items-center justify-center p-4 pointer-events-none">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                onClick={(e) => e.stopPropagation()}
                className={cn(
                  'w-full min-w-[min(100%,28rem)] max-w-lg bg-card rounded-2xl shadow-2xl border border-border pointer-events-auto flex flex-col'
                )}
              >
                <div className="flex items-center justify-between px-5 py-4 border-b border-border">
                  <h3 className="text-sm font-semibold text-foreground">{t('danhSachTaiSan.detail.ghiChuDialogTitle')}</h3>
                  <button
                    type="button"
                    onClick={() => setGhiChuOpen(false)}
                    className="p-2 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground"
                  >
                    <X size={18} />
                  </button>
                </div>
                <div className="p-5">
                  <Textarea
                    label=""
                    value={ghiChuValue}
                    onChange={(e) => setGhiChuValue(e.target.value)}
                    placeholder={t('danhSachTaiSan.form.ghiChuPlaceholder')}
                    rows={4}
                    className="resize-none"
                  />
                </div>
                <div className="flex justify-end gap-3 px-5 py-4 border-t border-border">
                  <Button variant="outline" onClick={() => setGhiChuOpen(false)}>
                    {t('common.cancel')}
                  </Button>
                  <Button onClick={handleSaveGhiChu}>
                    {t('common.save')}
                  </Button>
                </div>
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>
    </GenericDrawer>
  );
};

export default TaiSanDetail;
