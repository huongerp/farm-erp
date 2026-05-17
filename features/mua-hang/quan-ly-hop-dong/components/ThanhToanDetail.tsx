import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Wallet, Edit, Trash2, FileText } from 'lucide-react';
import Button from '../../../../components/ui/Button';
import GenericDrawer, { DRAWER_WIDTH_DETAIL } from '../../../../components/shared/GenericDrawer';
import DetailSection from '../../../../components/shared/DetailSection';
import DetailField from '../../../../components/shared/DetailField';
import DetailFieldGrid from '../../../../components/shared/DetailFieldGrid';
import { BTN_CLOSE, BTN_EDIT, BTN_DELETE } from '../../../../lib/button-labels';
import type { HopDongChiTietEnriched } from '../core/types';
import type { Branch } from '../../../he-thong/chi-nhanh/core/types';
import { cn, formatDateShort, formatDateTimeShort, formatNumberVN } from '../../../../lib/utils';
import { TRANG_THAI_HOP_DONG } from '../core/constants';

interface Props {
  data: HopDongChiTietEnriched;
  chiNhanhList: Branch[];
  onClose: () => void;
  onEdit?: (item: HopDongChiTietEnriched) => void;
  onDelete?: (item: HopDongChiTietEnriched) => void;
}

const ThanhToanDetail: React.FC<Props> = ({ data, chiNhanhList, onClose, onEdit, onDelete }) => {
  const { t } = useTranslation();

  const cnMap = useMemo(() => {
    const m: Record<string, string> = {};
    chiNhanhList.forEach((b) => {
      m[b.id] = b.ten_chi_nhanh;
    });
    return m;
  }, [chiNhanhList]);

  const statusLabel =
    data.trang_thai_hop_dong === TRANG_THAI_HOP_DONG[1]
      ? t('hopDong.trangThai.daThanhLy')
      : data.trang_thai_hop_dong
        ? t('hopDong.trangThai.dangThucHien')
        : '—';

  const renderFooter = (
    <div className="flex items-center justify-between w-full">
      <Button variant="ghost" onClick={onClose} className="text-muted-foreground hover:text-foreground border border-border">
        {BTN_CLOSE()}
      </Button>
      <div className="flex items-center gap-3">
        {onEdit && (
          <Button onClick={() => onEdit(data)} className="bg-primary text-white shadow-lg hover:bg-primary/90">
            <Edit size={16} className="mr-2" /> {BTN_EDIT()}
          </Button>
        )}
        {onDelete && (
          <Button
            variant="ghost"
            onClick={() => onDelete(data)}
            className="text-rose-600 hover:bg-rose-50 hover:text-rose-700 dark:hover:bg-rose-950/50 dark:text-rose-400 border border-rose-200 dark:border-rose-800"
          >
            <Trash2 size={16} className="mr-2" /> {BTN_DELETE()}
          </Button>
        )}
      </div>
    </div>
  );

  return (
    <GenericDrawer
      title={t('hopDong.thanhToan.detail.title')}
      subtitle={data.ten_dot ?? data.ma_hop_dong ?? undefined}
      icon={<Wallet size={20} />}
      onClose={onClose}
      maxWidthClass={DRAWER_WIDTH_DETAIL}
      footer={renderFooter}
    >
      <div className="space-y-6">
        <DetailSection title={t('hopDong.thanhToan.detail.hopDongSection')} icon={<FileText size={14} />}>
          <DetailFieldGrid cols={2}>
            <DetailField label={t('hopDong.form.maHopDong')} value={data.ma_hop_dong ?? '—'} />
            <DetailField
              label={t('hopDong.form.trangThai')}
              value={
                data.trang_thai_hop_dong ? (
                  <span
                    className={cn(
                      'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border',
                      data.trang_thai_hop_dong === 'Đã thanh lý'
                        ? 'bg-muted/50 text-muted-foreground border-border'
                        : 'bg-emerald-500/10 text-emerald-800 dark:text-emerald-200 border-emerald-500/30'
                    )}
                  >
                    {statusLabel}
                  </span>
                ) : (
                  '—'
                )
              }
            />
            <DetailField label={t('hopDong.form.tenHopDong')} value={data.ten_hop_dong ?? '—'} className="sm:col-span-2" />
            <DetailField label={t('hopDong.form.ncc')} value={data.ten_nha_cung_cap ?? '—'} className="sm:col-span-2" />
          </DetailFieldGrid>
        </DetailSection>

        <DetailSection title={t('hopDong.thanhToan.detail.paymentSection')} icon={<Wallet size={14} />}>
          <DetailFieldGrid cols={2}>
            <DetailField
              label={t('hopDong.form.ctNgay')}
              value={data.ngay ? formatDateShort(data.ngay) : '—'}
            />
            <DetailField label={t('hopDong.form.ctTenDot')} value={data.ten_dot ?? '—'} />
            <DetailField
              label={t('hopDong.form.ctSoTien')}
              value={formatNumberVN(data.so_tien != null ? Number(data.so_tien) : null)}
            />
            <DetailField
              label={t('hopDong.form.ctSoCay')}
              value={formatNumberVN(data.so_cay_thuc_nhan != null ? Number(data.so_cay_thuc_nhan) : null)}
            />
            <DetailField
              label={t('hopDong.form.ctChiNhanh')}
              value={data.id_chi_nhanh ? (cnMap[data.id_chi_nhanh] ?? data.id_chi_nhanh) : '—'}
            />
            <DetailField label={t('hopDong.form.ctGhiChu')} value={data.ghi_chu ?? '—'} className="sm:col-span-2" />
            <DetailField
              label={t('hopDong.store.updatedCol')}
              value={data.tg_cap_nhat ? formatDateTimeShort(data.tg_cap_nhat) : '—'}
            />
          </DetailFieldGrid>
        </DetailSection>
      </div>
    </GenericDrawer>
  );
};

export default ThanhToanDetail;
