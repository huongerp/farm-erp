import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Wallet, FileText } from 'lucide-react';
import GenericDrawer, { DRAWER_WIDTH_DETAIL } from '../../../../components/shared/GenericDrawer';
import DetailSection from '../../../../components/shared/DetailSection';
import DetailField from '../../../../components/shared/DetailField';
import DetailFieldGrid from '../../../../components/shared/DetailFieldGrid';
import type { HopDongChiTietEnriched } from '../core/types';
import type { Branch } from '../../../he-thong/chi-nhanh/core/types';
import { cn, formatDateShort, formatDateTimeShort, formatNumberVN } from '../../../../lib/utils';
import { TRANG_THAI_HOP_DONG } from '../core/constants';
import DetailDrawerFooter from '../../../../components/shared/DetailDrawerFooter';

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
    <DetailDrawerFooter
      onClose={onClose}
      onEdit={onEdit ? () => onEdit(data) : undefined}
      onDelete={onDelete ? () => onDelete(data) : undefined}
    />
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
