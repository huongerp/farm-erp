import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  FileText,
  Calendar,
  Warehouse,
  ArrowRightLeft,
  Package,
  Printer,
  CheckCircle,
  XCircle,
  Copy,
  AlertTriangle,
  FilePen,
  Lock,
  Unlock,
  Truck,
} from 'lucide-react';
import { toast } from 'sonner';
import Button from '../../../../components/ui/Button';
import DetailDrawerFooter from '../../../../components/shared/DetailDrawerFooter';
import Textarea from '../../../../components/ui/Textarea';
import { cn } from '../../../../lib/utils';
import type { PhieuKhoPT, LoaiPhieuKhoPT, TrangThaiPhieuKhoPT } from '../core/types';

type ChiTietPhieuKhoPT = NonNullable<PhieuKhoPT['chi_tiet']>[number];
import { formatDateTimeShort, formatNumberVN, formatYmdToDisplay } from '../../../../lib/utils';
import GenericDrawer, { DRAWER_WIDTH_DETAIL } from '../../../../components/shared/GenericDrawer';
import DetailToolbar, { type DetailToolbarAction } from '../../../../components/shared/DetailToolbar';
import DetailSection from '../../../../components/shared/DetailSection';
import DetailField from '../../../../components/shared/DetailField';
import DetailFieldGrid from '../../../../components/shared/DetailFieldGrid';
import GenericSubTableSection from '../../../../components/shared/GenericSubTableSection';
import SubTable, { type SubTableColumn } from '../../../../components/shared/sub-table/SubTable';
import { BTN_CLOSE, CONFIRM_YES } from '../../../../lib/button-labels';
import { useUpdatePhieuKhoPTTrangThai, useXinSuaPhieuKhoPT, useXuLyXinSuaPhieuKhoPT } from '../hooks/use-phieu-kho-pt';
import { usePhieuKhoPTCapCao } from '../hooks/use-phieu-kho-pt-cap-cao';
import {
  canKhoaLaiQuyenSua,
  canXinSuaPhieuKhoPT,
  canXuLyYeuCauSua,
  phieuMoChoSuaXoa,
  TRANG_THAI_SUA_CHO_CAP,
  TRANG_THAI_SUA_DA_CAP,
} from '../core/quyen-sua-phieu';
import type { HanhDongXinSuaPhieuKhoPT } from '../core/types';
import XinSuaPhieuDialog from './XinSuaPhieuDialog';
import { useAuthStore } from '../../../../store/useStore';
import { useConfirmStore } from '../../../../store/useConfirmStore';
import { useKhoBienThe } from '../../kho-bien-the/KhoBienTheProvider';
import { khoPreviewUrl } from '../../kho-bien-the/bien-the';
import { useXeCuaPhieuKho } from '../../dang-ky-nhan-hang/hooks/use-dang-ky-nhan-hang';

interface Props {
  data: PhieuKhoPT;
  onClose: () => void;
  onEdit?: (item: PhieuKhoPT) => void;
  onDelete?: (id: string) => void;
  onCopy?: (item: PhieuKhoPT) => void;
  canApprove?: boolean;
  /** Tầng drawer khi mở chồng lên drawer khác (vd từ drawer Đề xuất mua hàng). */
  stackLevel?: number;
}

function loaiLabel(loai: LoaiPhieuKhoPT, t: (k: string) => string): string {
  if (loai === 'nhập') return t('phieuKhoPhanThuoc.tabs.nhap');
  if (loai === 'xuất') return t('phieuKhoPhanThuoc.tabs.xuat');
  return t('phieuKhoPhanThuoc.tabs.chuyen');
}

const PhieuKhoPTDetail: React.FC<Props> = ({ data, onClose, onEdit, onDelete, onCopy, canApprove = true, stackLevel }) => {
  const bt = useKhoBienThe();
  const { t } = useTranslation();
  const user = useAuthStore((s) => s.user);
  const confirm = useConfirmStore((s) => s.confirm);
  const nguoiDuyetId = user?.id != null ? Number(user.id) : null;
  const nguoiDuyetIdValid = nguoiDuyetId != null && !Number.isNaN(nguoiDuyetId) ? nguoiDuyetId : null;
  const nguoiDuyetTen = user?.ho_va_ten?.trim() || user?.full_name?.trim() || user?.email?.trim() || '';
  const [showDuyetPopup, setShowDuyetPopup] = useState(false);
  const [duyetGhiChu, setDuyetGhiChu] = useState('');
  const [duyetOption, setDuyetOption] = useState<'Đã duyệt' | 'Không duyệt'>('Đã duyệt');
  const updateTrangThaiMutation = useUpdatePhieuKhoPTTrangThai(() => setShowDuyetPopup(false));

  // Phiếu đã duyệt: chỉ cấp cao / người được cấp quyền mới sửa xoá; người khác "Xin sửa".
  const capCao = usePhieuKhoPTCapCao();
  const nguoi = { capCao, nhanVienId: nguoiDuyetIdValid };
  const moChoSuaXoa = phieuMoChoSuaXoa(data, nguoi);
  const showXinSua = canXinSuaPhieuKhoPT(data, nguoi, !!onEdit || !!onDelete);
  const [showXinSuaDialog, setShowXinSuaDialog] = useState(false);
  const xinSuaMutation = useXinSuaPhieuKhoPT(() => setShowXinSuaDialog(false));
  const xuLyMutation = useXuLyXinSuaPhieuKhoPT();
  const xuLyXinSua = (hanhDong: HanhDongXinSuaPhieuKhoPT) => {
    if (hanhDong === 'cap') {
      xuLyMutation.mutate({ id: data.id, hanhDong });
      return;
    }
    confirm({
      title: t(`phieuKhoPhanThuoc.xinSua.confirm.${hanhDong}.title`),
      message: t(`phieuKhoPhanThuoc.xinSua.confirm.${hanhDong}.message`, { ten: data.ten_nguoi_xin_sua ?? '' }),
      variant: 'warning',
      confirmText: CONFIRM_YES(),
      onConfirm: () => xuLyMutation.mutate({ id: data.id, hanhDong }),
    });
  };

  const isDaQuyetDinh = data.trang_thai === 'Đã duyệt' || data.trang_thai === 'Không duyệt';
  const statusLabel =
    data.trang_thai === 'Chờ duyệt'
      ? t('phieuKhoPhanThuoc.status.pending')
      : data.trang_thai === 'Đã duyệt'
        ? t('phieuKhoPhanThuoc.status.approved')
        : t('phieuKhoPhanThuoc.status.rejected');
  const statusVariant =
    data.trang_thai === 'Chờ duyệt' ? 'amber' : data.trang_thai === 'Đã duyệt' ? 'primary' : 'rose';
  const isChuyen = data.loai === 'chuyển';
  const isNhap = data.loai === 'nhập';
  const isXuat = data.loai === 'xuất';

  const previewPath = khoPreviewUrl(bt, 'phieu-kho-phan-thuoc', data.id);
  // Phiếu xuất thành phẩm sinh từ Đăng ký nhận hàng (migration 042) — chỉ bảng Sơ chế có liên kết.
  const { data: xeNguon } = useXeCuaPhieuKho(data.id, bt.key === 'so-che' && isXuat);

  const optionLabel = (value: TrangThaiPhieuKhoPT) =>
    value === 'Đã duyệt'
      ? t('phieuKhoPhanThuoc.status.approved')
      : value === 'Không duyệt'
        ? t('phieuKhoPhanThuoc.status.rejected')
        : t('phieuKhoPhanThuoc.status.pending');

  const applyTrangThai = (trangThai: 'Đã duyệt' | 'Không duyệt') => {
    updateTrangThaiMutation.mutate(
      {
        id: data.id,
        trang_thai: trangThai,
        ghi_chu: duyetGhiChu.trim() || undefined,
        id_nguoi_duyet: nguoiDuyetIdValid,
        ten_nguoi_duyet_hien_thi: nguoiDuyetTen || undefined,
      },
      { onSuccess: () => setShowDuyetPopup(false) }
    );
  };

  const submitDuyet = () => {
    if (duyetOption === data.trang_thai) {
      toast.message(t('phieuKhoPhanThuoc.approveDialog.sameStatus'));
      return;
    }
    if (isDaQuyetDinh) {
      if (!duyetGhiChu.trim()) {
        toast.warning(t('phieuKhoPhanThuoc.approveDialog.noteRequired'));
        return;
      }
      confirm({
        title: t('phieuKhoPhanThuoc.approveDialog.redecideConfirmTitle'),
        message: t('phieuKhoPhanThuoc.approveDialog.redecideConfirmMessage', {
          from: statusLabel,
          to: optionLabel(duyetOption),
        }),
        variant: 'warning',
        confirmText: CONFIRM_YES(),
        onConfirm: () => applyTrangThai(duyetOption),
      });
      return;
    }
    applyTrangThai(duyetOption);
  };

  const detailToolbarActions: DetailToolbarAction[] = (() => {
    const actions: DetailToolbarAction[] = [];
    if (canApprove) {
      actions.push({
        label: isDaQuyetDinh ? t('phieuKhoPhanThuoc.approveActionChange') : t('phieuKhoPhanThuoc.approveAction'),
        icon: <CheckCircle size={16} />,
        onClick: () => {
          setDuyetGhiChu('');
          setDuyetOption(data.trang_thai === 'Không duyệt' ? 'Đã duyệt' : data.trang_thai === 'Đã duyệt' ? 'Không duyệt' : 'Đã duyệt');
          setShowDuyetPopup(true);
        },
        variant: 'primary',
      });
    }
    if (showXinSua) {
      actions.push({
        label: t('phieuKhoPhanThuoc.xinSua.action'),
        icon: <FilePen size={16} />,
        onClick: () => setShowXinSuaDialog(true),
        variant: 'warning',
      });
    }
    if (canXuLyYeuCauSua(data, capCao)) {
      actions.push(
        {
          label: t('phieuKhoPhanThuoc.xinSua.capAction'),
          icon: <Unlock size={16} />,
          onClick: () => xuLyXinSua('cap'),
          variant: 'success',
          disabled: xuLyMutation.isPending,
        },
        {
          label: t('phieuKhoPhanThuoc.xinSua.tuChoiAction'),
          icon: <XCircle size={16} />,
          onClick: () => xuLyXinSua('tu_choi'),
          variant: 'danger',
          disabled: xuLyMutation.isPending,
        }
      );
    }
    if (canKhoaLaiQuyenSua(data, capCao)) {
      actions.push({
        label: t('phieuKhoPhanThuoc.xinSua.khoaLaiAction'),
        icon: <Lock size={16} />,
        onClick: () => xuLyXinSua('khoa_lai'),
        variant: 'warning',
        disabled: xuLyMutation.isPending,
      });
    }
    if (onCopy) {
      actions.push({
        label: t('phieuKhoPhanThuoc.copyAction'),
        icon: <Copy size={16} />,
        onClick: () => {
          onCopy(data);
          onClose();
        },
      });
    }
    actions.push({
      label: t('phieuKhoPhanThuoc.printAction'),
      icon: <Printer size={16} />,
      onClick: () => window.open(previewPath, '_blank', 'noopener,noreferrer'),
    });
    return actions;
  })();

  const renderFooter = (
    <DetailDrawerFooter
      onClose={onClose}
      onEdit={onEdit && moChoSuaXoa ? () => { onEdit(data); onClose(); } : undefined}
      onDelete={onDelete && moChoSuaXoa ? () => { onDelete(data.id); onClose(); } : undefined}
    />
  );

  const chiTietColumns: SubTableColumn[] = [
    { id: 'ten_hang', label: t('phieuKhoPhanThuoc.form.itemName'), width: 200, minWidth: 140, sticky: true, mobile: 'title' },
    { id: 'ma_hang', label: t('phieuKhoPhanThuoc.form.itemCode'), width: 110, minWidth: 80, mobile: 'hidden' },
    { id: 'pham_cap', label: t('phieuKhoPhanThuoc.form.phamCap'), width: 120, minWidth: 80 },
    { id: 'so_luong', label: t('phieuKhoPhanThuoc.form.quantity'), width: 110, minWidth: 80, align: 'right' },
    { id: 'don_vi_tinh', label: t('phieuKhoPhanThuoc.form.unit'), width: 80, minWidth: 56, mobile: 'hidden' },
    { id: 'don_gia', label: t('phieuKhoPhanThuoc.form.unitPrice'), width: 110, minWidth: 80, align: 'right' },
    { id: 'thanh_tien', label: t('phieuKhoPhanThuoc.form.amount'), width: 120, minWidth: 90, align: 'right' },
    { id: 'so_lot', label: t('phieuKhoPhanThuoc.preview.soLot'), width: 100, minWidth: 70 },
    { id: 'ghi_chu', label: t('phieuKhoPhanThuoc.form.note'), width: 180, minWidth: 100, mobile: 'full' },
  ];

  const renderChiTietCell = (colId: string, ct: ChiTietPhieuKhoPT) => {
    switch (colId) {
      case 'ten_hang':
        return (
          <>
            <span className="text-sm">{ct.ten_hang ?? ct.ten_hang_hoa ?? '—'}</span>
            {/* Mobile ẩn cột Mã → hiện mã ngay dưới tên. */}
            {ct.ma_hang && <span className="md:hidden block text-xs text-muted-foreground font-mono">{ct.ma_hang}</span>}
          </>
        );
      case 'ma_hang':
        return <span className="font-mono text-xs">{ct.ma_hang ?? '—'}</span>;
      case 'pham_cap':
        return <span className="text-xs text-muted-foreground truncate" title={ct.pham_cap ?? undefined}>{ct.pham_cap ?? '—'}</span>;
      case 'so_luong':
        // Mobile ẩn cột ĐVT → ghép đơn vị vào số lượng.
        return (
          <span className="tabular-nums">
            {formatNumberVN(ct.so_luong)}
            {ct.don_vi_tinh && <span className="md:hidden text-muted-foreground"> {ct.don_vi_tinh}</span>}
          </span>
        );
      case 'don_vi_tinh':
        return <span className="text-xs text-muted-foreground">{ct.don_vi_tinh ?? '—'}</span>;
      case 'don_gia':
        return <span className="tabular-nums">{formatNumberVN(ct.don_gia)}</span>;
      case 'thanh_tien':
        return <span className="tabular-nums">{formatNumberVN(ct.thanh_tien)}</span>;
      case 'so_lot':
        return <span className="text-xs text-muted-foreground">{ct.so_lot ?? '—'}</span>;
      case 'ghi_chu':
        return <span className="text-xs text-muted-foreground">{ct.ghi_chu ?? '—'}</span>;
      default:
        return null;
    }
  };

  return (
    <GenericDrawer
      title={t('phieuKhoPhanThuoc.detail.title')}
      subtitle={[data.so_phieu, data.ten_kho].filter(Boolean).join(' · ')}
      icon={<FileText size={18} />}
      onClose={onClose}
      footer={renderFooter}
      maxWidthClass={DRAWER_WIDTH_DETAIL}
      stackLevel={stackLevel}
    >
      <div className="space-y-5">
        <div className="bg-card p-4 rounded-xl border border-border/50 shadow-sm flex items-center gap-4">
          <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center text-white shadow-primary/20 shadow-lg shrink-0">
            <FileText size={24} className="text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-base font-bold text-foreground leading-tight truncate">{data.so_phieu}</h2>
            <p className="text-body-sm text-muted-foreground mt-0.5">{data.ngay}</p>
            <div className="mt-1 flex flex-wrap gap-2">
              <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium border bg-muted/50 text-foreground border-border">
                {loaiLabel(data.loai, t)}
              </span>
              <span
                className={
                  statusVariant === 'amber'
                    ? 'inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 text-xs font-medium border border-amber-500/20'
                    : statusVariant === 'primary'
                      ? 'inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-medium border border-primary/20'
                      : 'inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-600 dark:text-rose-400 text-xs font-medium border border-rose-500/20'
                }
              >
                <span
                  className={
                    statusVariant === 'amber'
                      ? 'w-1.5 h-1.5 rounded-full bg-amber-500'
                      : statusVariant === 'primary'
                        ? 'w-1.5 h-1.5 rounded-full bg-primary'
                        : 'w-1.5 h-1.5 rounded-full bg-rose-500'
                  }
                />{' '}
                {statusLabel}
              </span>
            </div>
          </div>
        </div>

        {data.trang_thai_sua === TRANG_THAI_SUA_CHO_CAP && (
          <div className="flex gap-2.5 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-800 dark:text-amber-200">
            <FilePen size={16} className="mt-0.5 shrink-0 text-amber-600 dark:text-amber-400" />
            <div className="min-w-0 space-y-0.5">
              <p className="font-medium">
                {t('phieuKhoPhanThuoc.xinSua.bannerChoCap', {
                  ten: data.ten_nguoi_xin_sua ?? '—',
                  thoiGian: data.tg_xin_sua ? formatDateTimeShort(data.tg_xin_sua) : '',
                })}
              </p>
              {data.ly_do_xin_sua && (
                <p className="whitespace-pre-line break-words">
                  {t('phieuKhoPhanThuoc.xinSua.lyDoLabel')}: {data.ly_do_xin_sua}
                </p>
              )}
            </div>
          </div>
        )}
        {data.trang_thai_sua === TRANG_THAI_SUA_DA_CAP && (
          <div className="flex gap-2.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-800 dark:text-emerald-200">
            <Unlock size={16} className="mt-0.5 shrink-0 text-emerald-600 dark:text-emerald-400" />
            <p className="min-w-0">
              {t('phieuKhoPhanThuoc.xinSua.bannerDaCap', {
                ten: data.ten_nguoi_xin_sua ?? '—',
                nguoiCap: data.ten_nguoi_cap_sua ?? '—',
                thoiGian: data.tg_cap_sua ? formatDateTimeShort(data.tg_cap_sua) : '',
              })}
            </p>
          </div>
        )}
        {showXinSua && (
          <div className="flex gap-2.5 rounded-xl border border-border bg-muted/40 px-4 py-3 text-sm text-muted-foreground">
            <Lock size={16} className="mt-0.5 shrink-0" />
            <p>{t('phieuKhoPhanThuoc.xinSua.bannerKhoa')}</p>
          </div>
        )}

        <DetailToolbar actions={detailToolbarActions} className="bg-card rounded-xl border border-border" />

        <DetailSection title={t('phieuKhoPhanThuoc.detail.basicInfo')} icon={<FileText size={14} />} variant="primary">
          <DetailFieldGrid>
            <DetailField label={t('phieuKhoPhanThuoc.form.code')} value={data.so_phieu} icon={<FileText size={12} />} />
            <DetailField label={t('phieuKhoPhanThuoc.form.date')} value={data.ngay} icon={<Calendar size={12} />} />
            <DetailField label={t('phieuKhoPhanThuoc.form.loai')} value={loaiLabel(data.loai, t)} icon={<ArrowRightLeft size={12} />} />
            {isNhap && (
              <DetailField label={t('phieuKhoPhanThuoc.form.warehouseTo')} value={data.ten_kho ?? '—'} icon={<Warehouse size={12} />} />
            )}
            {isXuat && (
              <DetailField label={t('phieuKhoPhanThuoc.form.warehouseFrom')} value={data.ten_kho ?? '—'} icon={<Warehouse size={12} />} />
            )}
            {isChuyen && (
              <>
                <DetailField label={t('phieuKhoPhanThuoc.form.warehouseFrom')} value={data.ten_kho ?? '—'} icon={<Warehouse size={12} />} />
                <DetailField
                  label={t('phieuKhoPhanThuoc.form.warehouseTo')}
                  value={data.ten_kho_den ?? '—'}
                  icon={<ArrowRightLeft size={12} />}
                />
              </>
            )}
            <DetailField
              label={t('phieuKhoPhanThuoc.form.description')}
              value={data.mo_ta ?? '—'}
              icon={<FileText size={12} />}
              className="col-span-1 sm:col-span-2"
            />
            {xeNguon && (
              <DetailField
                label={t('phieuKhoPhanThuoc.detail.nguonXe')}
                value={[xeNguon.so_xe, xeNguon.so_cont, xeNguon.khach_hang, formatYmdToDisplay(xeNguon.ngay_dang_ky)]
                  .filter(Boolean)
                  .join(' · ')}
                icon={<Truck size={12} />}
                className="col-span-1 sm:col-span-2"
              />
            )}
            {data.trao_doi && (
              <DetailField
                label={t('phieuKhoPhanThuoc.detail.traoDoi')}
                value={<span className="whitespace-pre-line break-words">{data.trao_doi}</span>}
                icon={<FileText size={12} />}
                className="col-span-1 sm:col-span-2"
              />
            )}
            <DetailField label={t('phieuKhoPhanThuoc.detail.creator')} value={data.ten_nguoi_tao ?? '—'} icon={<FileText size={12} />} />
            {(data.ten_nguoi_duyet != null && data.ten_nguoi_duyet !== '') || data.id_nguoi_duyet != null ? (
              <DetailField
                label={t('phieuKhoPhanThuoc.detail.approver')}
                value={data.ten_nguoi_duyet ?? (data.id_nguoi_duyet != null ? `#${data.id_nguoi_duyet}` : '—')}
                icon={<CheckCircle size={12} />}
              />
            ) : null}
          </DetailFieldGrid>
        </DetailSection>

        <GenericSubTableSection
          title={t('phieuKhoPhanThuoc.form.itemsSection')}
          icon={<Package size={14} className="text-primary" />}
          count={data.chi_tiet?.length ?? 0}
          emptyTitle={t('phieuKhoPhanThuoc.form.noItems')}
          emptyDescription={t('phieuKhoPhanThuoc.form.noItemsHint')}
          contentMode="raw"
        >
          {data.chi_tiet && data.chi_tiet.length > 0 && (
            // SubTable: desktop là bảng như cũ, điện thoại chuyển sang thẻ — bảng 10 cột (~900px) phải vuốt ngang.
            <SubTable
              tableKey="phieu-kho-pt.detail"
              columns={chiTietColumns}
              rows={data.chi_tiet}
              keyExtractor={(ct) => ct.id}
              renderCell={renderChiTietCell}
              maxHeight="320px"
            />
          )}
        </GenericSubTableSection>

        <DetailSection title={t('phieuKhoPhanThuoc.detail.systemInfo')} icon={<Calendar size={14} />} variant="secondary">
          <DetailFieldGrid>
            <DetailField label={t('phieuKhoPhanThuoc.detail.createdAt')} value={formatDateTimeShort(data.tg_tao)} icon={<Calendar size={12} />} />
            <DetailField label={t('phieuKhoPhanThuoc.detail.updatedAt')} value={formatDateTimeShort(data.tg_cap_nhat)} icon={<Calendar size={12} />} />
          </DetailFieldGrid>
        </DetailSection>
      </div>

      {showXinSuaDialog && (
        <XinSuaPhieuDialog
          soPhieu={data.so_phieu}
          isPending={xinSuaMutation.isPending}
          onClose={() => setShowXinSuaDialog(false)}
          onConfirm={(lyDo) => xinSuaMutation.mutate({ id: data.id, lyDo })}
        />
      )}

      {showDuyetPopup && (
        <div role="presentation" className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/50" onClick={() => setShowDuyetPopup(false)}>
          <div
            role="presentation"
            className="bg-card border border-border rounded-xl shadow-xl max-w-md w-full p-5 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-semibold text-foreground">{t('phieuKhoPhanThuoc.approveDialog.title')}</h3>

            {isDaQuyetDinh && (
              <div className="flex gap-2.5 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2.5 text-sm text-amber-800 dark:text-amber-200">
                <AlertTriangle size={16} className="mt-0.5 shrink-0 text-amber-600 dark:text-amber-400" />
                <p>{t('phieuKhoPhanThuoc.approveDialog.redecideWarning', { status: statusLabel })}</p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-2.5">
              {(
                [
                  { value: 'Đã duyệt' as const, icon: <CheckCircle size={15} />, color: 'emerald' },
                  { value: 'Không duyệt' as const, icon: <XCircle size={15} />, color: 'rose' },
                ] as const
              ).map((opt) => {
                const selected = duyetOption === opt.value;
                const label =
                  opt.value === 'Đã duyệt'
                    ? t('phieuKhoPhanThuoc.approveDialog.approveButton')
                    : t('phieuKhoPhanThuoc.approveDialog.rejectButton');
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setDuyetOption(opt.value)}
                    className={cn(
                      'flex items-center gap-2 rounded-lg border px-3.5 py-2.5 text-sm font-medium transition-all duration-150 cursor-pointer',
                      selected &&
                        opt.color === 'emerald' &&
                        'border-emerald-500/60 bg-emerald-50 text-emerald-700 shadow-sm dark:bg-emerald-950/25 dark:text-emerald-400 dark:border-emerald-700/50',
                      selected &&
                        opt.color === 'rose' &&
                        'border-rose-500/60 bg-rose-50 text-rose-700 shadow-sm dark:bg-rose-950/25 dark:text-rose-400 dark:border-rose-700/50',
                      !selected && 'border-border bg-card text-muted-foreground hover:bg-muted/50 hover:text-foreground'
                    )}
                  >
                    <span
                      className={cn(
                        'shrink-0',
                        selected && opt.color === 'emerald' && 'text-emerald-600 dark:text-emerald-400',
                        selected && opt.color === 'rose' && 'text-rose-600 dark:text-rose-400',
                        !selected && 'text-muted-foreground/60'
                      )}
                    >
                      {opt.icon}
                    </span>
                    <span>{label}</span>
                  </button>
                );
              })}
            </div>

            <Textarea
              label={t('phieuKhoPhanThuoc.approveDialog.note')}
              placeholder={
                isDaQuyetDinh
                  ? t('phieuKhoPhanThuoc.approveDialog.notePlaceholderRequired')
                  : t('phieuKhoPhanThuoc.approveDialog.notePlaceholder')
              }
              value={duyetGhiChu}
              onChange={(e) => setDuyetGhiChu(e.target.value)}
              rows={3}
            />

            <div className="flex items-center justify-end gap-2 pt-1">
              <Button variant="ghost" onClick={() => setShowDuyetPopup(false)} className="border border-border">
                {BTN_CLOSE()}
              </Button>
              <Button
                onClick={submitDuyet}
                disabled={updateTrangThaiMutation.isPending || duyetOption === data.trang_thai}
                className="bg-primary text-white shadow-lg hover:bg-primary/90"
              >
                {updateTrangThaiMutation.isPending ? '...' : t('phieuKhoPhanThuoc.approveDialog.submit')}
              </Button>
            </div>
          </div>
        </div>
      )}
    </GenericDrawer>
  );
};

export default PhieuKhoPTDetail;
