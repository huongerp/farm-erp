import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Package, Edit, Trash2, User, FileText, Calendar, Printer } from 'lucide-react';
import GenericDrawer, { DRAWER_WIDTH_DETAIL } from '../../../../components/shared/GenericDrawer';
import DetailSection from '../../../../components/shared/DetailSection';
import DetailField from '../../../../components/shared/DetailField';
import DetailToolbar, { type DetailToolbarAction } from '../../../../components/shared/DetailToolbar';
import GenericSubTableSection from '../../../../components/shared/GenericSubTableSection';
import Button from '../../../../components/ui/Button';
import { BTN_CLOSE, BTN_EDIT, BTN_DELETE } from '../../../../lib/button-labels';
import { formatDateTimeShort, formatDate } from '../../../../lib/utils';
import type { PhieuCapPhatThuHoi } from '../core/types';
import { getLoaiPhieuLabel } from '../core/constants';

interface Props {
  data: PhieuCapPhatThuHoi;
  onClose: () => void;
  onEdit?: (item: PhieuCapPhatThuHoi) => void;
  onDelete?: (id: string) => void;
}

const PhieuDetail: React.FC<Props> = ({ data, onClose, onEdit, onDelete }) => {
  const { t } = useTranslation();
  const chiTiet = data.chi_tiet ?? [];

  const detailToolbarActions: DetailToolbarAction[] = useMemo(() => {
    const actions: DetailToolbarAction[] = [];
    actions.push({
      label: t('capPhatThuHoi.detail.printPhieu'),
      icon: <Printer size={16} />,
      onClick: () => window.open(`/hanh-chinh/cap-phat-thu-hoi/preview/${data.id}`, '_blank', 'noopener,noreferrer'),
    });
    return actions;
  }, [data.id, t]);

  const footer = (
    <div className="flex items-center justify-between w-full flex-wrap gap-2">
      <Button variant="ghost" onClick={onClose} className="text-muted-foreground hover:text-foreground border border-border">
        {BTN_CLOSE()}
      </Button>
      <div className="flex items-center gap-3">
        {onEdit && (
          <Button
            onClick={() => {
              onClose();
              onEdit(data);
            }}
            className="bg-primary text-white shadow-lg hover:bg-primary/90"
          >
            <Edit size={16} className="mr-2" />
            {BTN_EDIT()}
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
            <Trash2 size={16} className="mr-2" />
            {BTN_DELETE()}
          </Button>
        )}
      </div>
    </div>
  );

  return (
    <GenericDrawer
      title={t('capPhatThuHoi.detail.title')}
      icon={<Package size={20} />}
      subtitle={`${data.ma_phieu} • ${getLoaiPhieuLabel(data.loai_phieu, t)}`}
      onClose={onClose}
      footer={footer}
      maxWidthClass={DRAWER_WIDTH_DETAIL}
    >
      <div className="space-y-5">
        <DetailToolbar
          actions={detailToolbarActions}
          className="bg-card rounded-xl border border-border"
        />

        {/* 1. Thông tin chung */}
        <DetailSection title={t('capPhatThuHoi.detail.sectionGeneral')} icon={<Package size={18} />} variant="primary">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <DetailField label={t('capPhatThuHoi.store.maPhieuCol')} value={data.ma_phieu} />
            <DetailField label={t('capPhatThuHoi.store.loaiCol')} value={getLoaiPhieuLabel(data.loai_phieu, t)} />
          </div>
        </DetailSection>

        {/* 2. Người giữ & Người thực hiện */}
        <DetailSection title={t('capPhatThuHoi.detail.sectionHolder')} icon={<User size={18} />}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <DetailField label={t('capPhatThuHoi.store.nguoiGiuTruocCol')} value={data.ten_nguoi_giu_truoc || '—'} />
            <DetailField label={t('capPhatThuHoi.store.nguoiGiuSauCol')} value={data.ten_nguoi_giu_sau || '—'} />
            <DetailField label={t('capPhatThuHoi.store.nguoiThucHienCol')} value={data.ten_nguoi_thuc_hien || '—'} />
            {data.ten_nguoi_tao ? (
              <DetailField label={t('capPhatThuHoi.detail.nguoiTao')} value={data.ten_nguoi_tao} />
            ) : null}
          </div>
        </DetailSection>

        {/* 3. Thời gian */}
        <DetailSection title={t('capPhatThuHoi.detail.sectionTime')} icon={<Calendar size={18} />}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <DetailField label={t('capPhatThuHoi.store.ngayCol')} value={formatDate(data.ngay_thuc_hien)} />
            <DetailField label={t('capPhatThuHoi.store.updatedCol')} value={formatDateTimeShort(data.tg_cap_nhat)} />
          </div>
        </DetailSection>

        {/* 4. Danh sách tài sản */}
        <GenericSubTableSection
          title={t('capPhatThuHoi.detail.sectionAssets')}
          icon={<Package size={14} className="text-primary" />}
          count={chiTiet.length}
          emptyTitle={t('capPhatThuHoi.empty')}
          emptyDescription={t('capPhatThuHoi.emptyHint')}
          maxTableHeight="320px"
        >
          {chiTiet.length > 0 && (
            <>
              <thead className="sticky top-0 z-[1] bg-muted border-b border-border">
                <tr>
                  <th className="px-4 py-2 font-semibold text-foreground/80 text-xs whitespace-nowrap w-10">#</th>
                  <th className="px-4 py-2 font-semibold text-foreground/80 text-xs whitespace-nowrap min-w-[90px]">{t('capPhatThuHoi.store.maTaiSanCol')}</th>
                  <th className="px-4 py-2 font-semibold text-foreground/80 text-xs whitespace-nowrap min-w-[140px]">{t('capPhatThuHoi.store.taiSanCol')}</th>
                  <th className="px-4 py-2 font-semibold text-foreground/80 text-xs whitespace-nowrap min-w-[120px]">{t('capPhatThuHoi.store.noiLuuTruocCol')}</th>
                  <th className="px-4 py-2 font-semibold text-foreground/80 text-xs whitespace-nowrap min-w-[120px]">{t('capPhatThuHoi.store.noiLuuSauCol')}</th>
                  <th className="px-4 py-2 font-semibold text-foreground/80 text-xs whitespace-nowrap min-w-[100px]">{t('capPhatThuHoi.store.ghiChuCol')}</th>
                </tr>
              </thead>
              <tbody className="[&>tr>td]:border-b [&>tr>td]:border-border">
                {chiTiet.map((ct, idx) => (
                  <tr key={ct.id} className="hover:bg-muted/60 transition-colors">
                    <td className="px-4 py-2.5 text-muted-foreground tabular-nums">{idx + 1}</td>
                    <td className="px-4 py-2.5 font-mono text-xs">{ct.ma_tai_san || '—'}</td>
                    <td className="px-4 py-2.5 text-sm">{ct.ten_tai_san || '—'}</td>
                    <td className="px-4 py-2.5 text-sm">{ct.ten_noi_luu_truoc || '—'}</td>
                    <td className="px-4 py-2.5 text-sm">{ct.ten_noi_luu_sau || '—'}</td>
                    <td className="px-4 py-2.5 text-xs text-muted-foreground">{ct.ghi_chu || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </>
          )}
        </GenericSubTableSection>

        {/* 5. Ghi chú */}
        <DetailSection title={t('capPhatThuHoi.detail.sectionOther')} icon={<FileText size={18} />}>
          <div className="grid grid-cols-1 gap-4">
            <DetailField label={t('capPhatThuHoi.store.ghiChuCol')} value={data.ghi_chu || '—'} />
          </div>
        </DetailSection>
      </div>
    </GenericDrawer>
  );
};

export default PhieuDetail;
