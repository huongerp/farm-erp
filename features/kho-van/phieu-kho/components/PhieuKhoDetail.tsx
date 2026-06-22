import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Edit, Trash2, FileText, Calendar, Warehouse, ArrowRightLeft, Package, Truck, Printer, CheckCircle, XCircle, Copy } from 'lucide-react';
import Button from '../../../../components/ui/Button';
import Textarea from '../../../../components/ui/Textarea';
import { cn } from '../../../../lib/utils';
import type { PhieuKho, LoaiPhieuKhoTab } from '../core/types';
import { formatDateTimeShort, formatNumberVN } from '../../../../lib/utils';
import GenericDrawer, { DRAWER_WIDTH_PHIEU_KHO } from '../../../../components/shared/GenericDrawer';
import DetailToolbar, { type DetailToolbarAction } from '../../../../components/shared/DetailToolbar';
import DetailSection from '../../../../components/shared/DetailSection';
import DetailField from '../../../../components/shared/DetailField';
import DetailFieldGrid from '../../../../components/shared/DetailFieldGrid';
import GenericSubTableSection from '../../../../components/shared/GenericSubTableSection';
import { BTN_CLOSE, BTN_EDIT, BTN_DELETE } from '../../../../lib/button-labels';
import { useUpdatePhieuKhoTrangThai } from '../hooks/use-phieu-kho';
import { useAuthStore } from '../../../../store/useStore';

interface Props {
  data: PhieuKho;
  loai: LoaiPhieuKhoTab;
  onClose: () => void;
  onEdit?: (item: PhieuKho) => void;
  onDelete?: (id: string) => void;
  onCopy?: (item: PhieuKho) => void;
  /** Có quyền phê duyệt – ẩn nút Duyệt khi false */
  canApprove?: boolean;
}

const PhieuKhoDetail: React.FC<Props> = ({ data, loai, onClose, onEdit, onDelete, onCopy, canApprove = true }) => {
  const { t } = useTranslation();
  const user = useAuthStore((s) => s.user);
  const nguoiDuyetId = user?.id != null ? Number(user.id) : null;
  const nguoiDuyetIdValid = nguoiDuyetId != null && !Number.isNaN(nguoiDuyetId) ? nguoiDuyetId : null;
  const nguoiDuyetTen =
    user?.ho_va_ten?.trim() || user?.full_name?.trim() || user?.email?.trim() || '';
  const [showDuyetPopup, setShowDuyetPopup] = useState(false);
  const [duyetGhiChu, setDuyetGhiChu] = useState('');
  const [duyetOption, setDuyetOption] = useState<'Đã duyệt' | 'Không duyệt'>('Đã duyệt');
  const updateTrangThaiMutation = useUpdatePhieuKhoTrangThai(() => setShowDuyetPopup(false));

  const statusLabel =
    data.trang_thai === 'Chờ duyệt'
      ? t('phieuKho.status.pending')
      : data.trang_thai === 'Đã duyệt'
        ? t('phieuKho.status.approved')
        : t('phieuKho.status.rejected');
  const statusVariant =
    data.trang_thai === 'Chờ duyệt' ? 'amber' : data.trang_thai === 'Đã duyệt' ? 'primary' : 'rose';
  const isChuyen = loai === 'chuyen';
  const isNhap = loai === 'nhap';
  const isXuat = loai === 'xuat';

  const detailToolbarActions: DetailToolbarAction[] = useMemo(() => {
    const actions: DetailToolbarAction[] = [];
    if (canApprove) {
      actions.push({
        label: t('phieuKho.approveAction'),
        icon: <CheckCircle size={16} />,
        onClick: () => {
          setDuyetGhiChu('');
          setDuyetOption(data.trang_thai === 'Không duyệt' ? 'Đã duyệt' : data.trang_thai === 'Đã duyệt' ? 'Không duyệt' : 'Đã duyệt');
          setShowDuyetPopup(true);
        },
        variant: 'primary',
      });
    }
    if (onCopy) {
      actions.push({
        label: t('phieuKho.copyAction'),
        icon: <Copy size={16} />,
        onClick: () => { onCopy(data); onClose(); },
      });
    }
    actions.push({
      label: t('phieuKho.printAction'),
      icon: <Printer size={16} />,
      onClick: () => window.open(`/mua-hang/phieu-kho/preview/${data.id}`, '_blank', 'noopener,noreferrer'),
    });
    return actions;
  }, [data, canApprove, onCopy, onClose, t]);

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
    <GenericDrawer
      title={t('phieuKho.detail.title')}
      subtitle={data.so_phieu}
      icon={<FileText size={18} />}
      onClose={onClose}
      footer={renderFooter}
      maxWidthClass={DRAWER_WIDTH_PHIEU_KHO}
    >
      <div className="space-y-5">
        <div className="bg-card p-4 rounded-xl border border-border/50 shadow-sm flex items-center gap-4">
          <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center text-white shadow-primary/20 shadow-lg shrink-0">
            <FileText size={24} className="text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-base font-bold text-foreground leading-tight truncate">{data.so_phieu}</h2>
            <p className="text-body-sm text-muted-foreground mt-0.5">{data.ngay}</p>
            <div className="mt-1.5">
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

        <DetailToolbar
          actions={detailToolbarActions}
          className="bg-card rounded-xl border border-border"
        />

        <DetailSection title={t('phieuKho.detail.basicInfo')} icon={<FileText size={14} />} variant="primary">
          <DetailFieldGrid>
            <DetailField label={t('phieuKho.form.code')} value={data.so_phieu} icon={<FileText size={12} />} />
            <DetailField label={t('phieuKho.form.date')} value={data.ngay} icon={<Calendar size={12} />} />
            {isNhap && (
              <DetailField label={t('phieuKho.form.warehouseTo')} value={data.ten_kho ?? '—'} icon={<Warehouse size={12} />} />
            )}
            {isXuat && (
              <DetailField label={t('phieuKho.form.warehouseFrom')} value={data.ten_kho ?? '—'} icon={<Warehouse size={12} />} />
            )}
            {isChuyen && (
              <>
                <DetailField label={t('phieuKho.form.warehouseFrom')} value={data.ten_kho ?? '—'} icon={<Warehouse size={12} />} />
                <DetailField
                  label={t('phieuKho.form.warehouseTo')}
                  value={data.ten_kho_den ?? '—'}
                  icon={<ArrowRightLeft size={12} />}
                />
              </>
            )}
            {isNhap && data.id_nha_cung_cap && (
              <DetailField
                label={t('phieuKho.detail.supplier')}
                value={data.ten_nha_cung_cap ?? data.id_nha_cung_cap ?? '—'}
                icon={<Truck size={12} />}
              />
            )}
            {isNhap && (data.id_don_dat_hang || (data.so_po_don_dat_hang && data.so_po_don_dat_hang.trim() !== '')) && (
              <DetailField
                label={t('phieuKho.detail.linkPo')}
                value={data.so_po_don_dat_hang?.trim() || (data.id_don_dat_hang ? `#${data.id_don_dat_hang}` : '—')}
                icon={<Package size={12} />}
              />
            )}
            {isXuat && data.id_khach_hang && (
              <DetailField
                label={t('phieuKho.form.customer')}
                value={data.ten_khach_hang ?? data.id_khach_hang ?? '—'}
                icon={<Truck size={12} />}
              />
            )}
            <DetailField
              label={t('phieuKho.form.description')}
              value={data.mo_ta ?? '—'}
              icon={<FileText size={12} />}
              className="col-span-1 sm:col-span-2"
            />
            {data.trao_doi && (
              <DetailField
                label={t('phieuKho.detail.traoDoi')}
                value={<span className="whitespace-pre-line break-words">{data.trao_doi}</span>}
                icon={<FileText size={12} />}
                className="col-span-1 sm:col-span-2"
              />
            )}
            <DetailField
              label={t('phieuKho.detail.creator')}
              value={data.ten_nguoi_tao ?? '—'}
              icon={<FileText size={12} />}
            />
            {(data.ten_nguoi_duyet != null && data.ten_nguoi_duyet !== '') || data.id_nguoi_duyet != null ? (
              <DetailField
                label={t('phieuKho.detail.approver')}
                value={data.ten_nguoi_duyet ?? (data.id_nguoi_duyet != null ? `#${data.id_nguoi_duyet}` : '—')}
                icon={<CheckCircle size={12} />}
              />
            ) : null}
          </DetailFieldGrid>
        </DetailSection>

        <GenericSubTableSection
          title={t('phieuKho.form.itemsSection')}
          icon={<Package size={14} className="text-primary" />}
          count={data.chi_tiet?.length ?? 0}
          emptyTitle={t('phieuKho.form.noItems')}
          emptyDescription={t('phieuKho.form.noItemsHint')}
          maxTableHeight="360px"
          tableClassName="min-w-max"
        >
          {data.chi_tiet && data.chi_tiet.length > 0 && (
            <>
              <thead className="sticky top-0 z-[1] bg-muted border-b border-border">
                <tr>
                  <th className="px-4 py-2 font-semibold text-foreground/80 text-xs whitespace-nowrap w-10">#</th>
                  <th className="px-4 py-2 font-semibold text-foreground/80 text-xs whitespace-nowrap min-w-[100px]">{t('phieuKho.form.itemCode')}</th>
                  <th className="px-4 py-2 font-semibold text-foreground/80 text-xs whitespace-nowrap min-w-[140px]">{t('phieuKho.form.itemName')}</th>
                  <th className="px-4 py-2 font-semibold text-foreground/80 text-xs whitespace-nowrap min-w-[100px]">{t('phieuKho.form.phamCap')}</th>
                  <th className="px-4 py-2 font-semibold text-foreground/80 text-xs whitespace-nowrap w-20">{t('phieuKho.form.unit')}</th>
                  <th className="px-4 py-2 font-semibold text-foreground/80 text-xs whitespace-nowrap w-24">{t('phieuKho.form.quantity')}</th>
                  <th className="px-4 py-2 font-semibold text-foreground/80 text-xs whitespace-nowrap min-w-[90px]">{t('phieuKho.form.unitPrice')}</th>
                  <th className="px-4 py-2 font-semibold text-foreground/80 text-xs whitespace-nowrap min-w-[100px]">{t('phieuKho.form.amount')}</th>
                  <th className="px-4 py-2 font-semibold text-foreground/80 text-xs whitespace-nowrap min-w-[160px]">{t('phieuKho.preview.soLot')}</th>
                  <th className="px-4 py-2 font-semibold text-foreground/80 text-xs whitespace-nowrap min-w-[120px]">{t('phieuKho.form.note')}</th>
                </tr>
              </thead>
              <tbody className="[&>tr>td]:border-b [&>tr>td]:border-border">
                {data.chi_tiet.map((ct, idx) => (
                  <tr key={ct.id} className="hover:bg-muted/60 transition-colors">
                    <td className="px-4 py-2.5 text-muted-foreground tabular-nums">{idx + 1}</td>
                    <td className="px-4 py-2.5 font-mono text-xs">{ct.ma_hang ?? '—'}</td>
                    <td className="px-4 py-2.5 text-sm">{ct.ten_hang ?? '—'}</td>
                    <td className="px-4 py-2.5 text-xs text-muted-foreground max-w-[120px] truncate" title={ct.pham_cap ?? undefined}>{ct.pham_cap ?? '—'}</td>
                    <td className="px-4 py-2.5 text-xs text-muted-foreground">{ct.don_vi_tinh ?? '—'}</td>
                    <td className="px-4 py-2.5 tabular-nums">{formatNumberVN(ct.so_luong)}</td>
                    <td className="px-4 py-2.5 tabular-nums">{formatNumberVN(ct.don_gia)}</td>
                    <td className="px-4 py-2.5 tabular-nums">{formatNumberVN(ct.thanh_tien)}</td>
                    <td className="px-4 py-2.5 text-xs text-muted-foreground min-w-[160px]">{ct.so_lot ?? '—'}</td>
                    <td className="px-4 py-2.5 text-xs text-muted-foreground">{ct.ghi_chu ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </>
          )}
        </GenericSubTableSection>

        <DetailSection title={t('phieuKho.detail.systemInfo')} icon={<Calendar size={14} />} variant="secondary">
          <DetailFieldGrid>
            <DetailField
              label={t('phieuKho.detail.createdAt')}
              value={formatDateTimeShort(data.tg_tao)}
              icon={<Calendar size={12} />}
            />
            <DetailField
              label={t('phieuKho.detail.updatedAt')}
              value={formatDateTimeShort(data.tg_cap_nhat)}
              icon={<Calendar size={12} />}
            />
          </DetailFieldGrid>
        </DetailSection>
      </div>

      {showDuyetPopup && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/50" onClick={() => setShowDuyetPopup(false)}>
          <div
            className="bg-card border border-border rounded-xl shadow-xl max-w-md w-full p-5 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-semibold text-foreground">{t('phieuKho.approveDialog.title')}</h3>

            <div className="grid grid-cols-2 gap-2.5">
              {([
                { value: 'Đã duyệt' as const, icon: <CheckCircle size={15} />, color: 'emerald' },
                { value: 'Không duyệt' as const, icon: <XCircle size={15} />, color: 'rose' },
              ]).map((opt) => {
                const selected = duyetOption === opt.value;
                const label = opt.value === 'Đã duyệt' ? t('phieuKho.approveDialog.approveButton') : t('phieuKho.approveDialog.rejectButton');
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setDuyetOption(opt.value)}
                    className={cn(
                      'flex items-center gap-2 rounded-lg border px-3.5 py-2.5 text-sm font-medium transition-all duration-150 cursor-pointer',
                      selected && opt.color === 'emerald' && 'border-emerald-500/60 bg-emerald-50 text-emerald-700 shadow-sm dark:bg-emerald-950/25 dark:text-emerald-400 dark:border-emerald-700/50',
                      selected && opt.color === 'rose' && 'border-rose-500/60 bg-rose-50 text-rose-700 shadow-sm dark:bg-rose-950/25 dark:text-rose-400 dark:border-rose-700/50',
                      !selected && 'border-border bg-card text-muted-foreground hover:bg-muted/50 hover:text-foreground',
                    )}
                  >
                    <span className={cn(
                      'shrink-0',
                      selected && opt.color === 'emerald' && 'text-emerald-600 dark:text-emerald-400',
                      selected && opt.color === 'rose' && 'text-rose-600 dark:text-rose-400',
                      !selected && 'text-muted-foreground/60',
                    )}>
                      {opt.icon}
                    </span>
                    <span>{label}</span>
                  </button>
                );
              })}
            </div>

            <Textarea
              label={t('phieuKho.approveDialog.note')}
              placeholder={t('phieuKho.approveDialog.notePlaceholder')}
              value={duyetGhiChu}
              onChange={(e) => setDuyetGhiChu(e.target.value)}
              rows={3}
            />

            <div className="flex items-center justify-end gap-2 pt-1">
              <Button variant="ghost" onClick={() => setShowDuyetPopup(false)} className="border border-border">
                {BTN_CLOSE()}
              </Button>
              <Button
                onClick={() => {
                  updateTrangThaiMutation.mutate(
                    {
                      id: data.id,
                      trang_thai: duyetOption,
                      ghi_chu: duyetGhiChu.trim() || undefined,
                      id_nguoi_duyet: nguoiDuyetIdValid,
                      ten_nguoi_duyet_hien_thi: nguoiDuyetTen || undefined,
                    },
                    { onSuccess: () => setShowDuyetPopup(false) }
                  );
                }}
                disabled={updateTrangThaiMutation.isPending}
                className="bg-primary text-white shadow-lg hover:bg-primary/90"
              >
                {updateTrangThaiMutation.isPending ? '...' : t('phieuKho.approveDialog.submit')}
              </Button>
            </div>
          </div>
        </div>
      )}
    </GenericDrawer>
  );
};

export default PhieuKhoDetail;
