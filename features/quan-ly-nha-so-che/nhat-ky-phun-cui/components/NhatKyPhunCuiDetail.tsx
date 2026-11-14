import React from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Building2, Calendar, Droplets, FileText, Printer, User } from 'lucide-react';
import Button from '../../../../components/ui/Button';
import GenericDrawer, { DRAWER_WIDTH_DETAIL } from '../../../../components/shared/GenericDrawer';
import DetailSection from '../../../../components/shared/DetailSection';
import DetailField from '../../../../components/shared/DetailField';
import DetailFieldGrid from '../../../../components/shared/DetailFieldGrid';
import DetailDrawerFooter from '../../../../components/shared/DetailDrawerFooter';
import SubTable, { type SubTableColumn } from '../../../../components/shared/sub-table/SubTable';
import { formatDateTimeShort, formatYmdToDisplay } from '../../../../lib/utils';
import { donViLuongThuoc } from '../core/constants';
import { formatSo } from '../core/so';
import { cacThuoc, tongNuocLit } from '../core/tong-hop';
import type { LanPha, NhatKyPhunCui } from '../core/types';

interface Props {
  data: NhatKyPhunCui;
  onClose: () => void;
  onEdit?: (item: NhatKyPhunCui) => void;
  onDelete?: (id: string) => void;
  canUpdate?: boolean;
  canDelete?: boolean;
}

const NhatKyPhunCuiDetail: React.FC<Props> = ({ data, onClose, onEdit, onDelete, canUpdate = true, canDelete = true }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const lanColumns: SubTableColumn[] = [
    { id: 'gio', label: t('nkpc.lan.gio'), width: 70, minWidth: 60 },
    { id: 'thuoc', label: t('nkpc.lan.thuoc'), width: 200, minWidth: 130, sticky: true, mobile: 'title' },
    { id: 'nong_do', label: t('nkpc.lan.nongDo'), width: 120, minWidth: 90, align: 'right' },
    { id: 'luong_nuoc', label: t('nkpc.lan.luongNuoc'), width: 110, minWidth: 80, align: 'right' },
    { id: 'luong_thuoc', label: t('nkpc.lan.luongThuocCot'), width: 120, minWidth: 90, align: 'right' },
    { id: 'ghi_chu', label: t('nkpc.lan.ghiChu'), width: 180, minWidth: 100, mobile: 'full' },
  ];

  const renderLanCell = (colId: string, l: LanPha) => {
    switch (colId) {
      case 'gio':
        return <span className="tabular-nums">{l.gio || '—'}</span>;
      case 'thuoc':
        return <span className="font-medium">{l.ten_hang_hoa || '—'}</span>;
      case 'nong_do':
        return <span className="tabular-nums">{l.nong_do != null ? `${formatSo(l.nong_do)} ${l.don_vi}` : '—'}</span>;
      case 'luong_nuoc':
        return <span className="tabular-nums">{l.luong_nuoc_lit != null ? formatSo(l.luong_nuoc_lit) : '—'}</span>;
      case 'luong_thuoc':
        return (
          <span className="tabular-nums">
            {l.luong_thuoc != null ? `${formatSo(l.luong_thuoc)} ${donViLuongThuoc(l.don_vi)}` : '—'}
          </span>
        );
      case 'ghi_chu':
        return l.ghi_chu || '—';
      default:
        return null;
    }
  };

  return (
    <GenericDrawer
      title={t('nkpc.detail.title')}
      subtitle={`${formatYmdToDisplay(data.ngay)}${data.ten_chi_nhanh ? ` · ${data.ten_chi_nhanh}` : ''}`}
      icon={<Droplets className="text-primary" size={22} />}
      onClose={onClose}
      maxWidthClass={DRAWER_WIDTH_DETAIL}
      footer={
        <DetailDrawerFooter
          onClose={onClose}
          canUpdate={canUpdate}
          canDelete={canDelete}
          onEdit={onEdit && canUpdate ? () => onEdit(data) : undefined}
          onDelete={onDelete && canDelete ? () => onDelete(data.id) : undefined}
          extraActions={
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate(`/quan-ly-nha-so-che/nhat-ky-phun-cui/preview/${data.id}`)}
            >
              <Printer size={16} className="mr-2" /> {t('nkpc.in.inPhieu')}
            </Button>
          }
        />
      }
    >
      <div className="space-y-5">
        <DetailSection title={t('nkpc.detail.thongTin')} icon={<FileText size={14} />} variant="primary">
          <DetailFieldGrid>
            <DetailField label={t('nkpc.col.chiNhanh')} value={data.ten_chi_nhanh ?? ''} emptyText="—" icon={<Building2 size={12} />} />
            <DetailField label={t('nkpc.col.ngay')} value={formatYmdToDisplay(data.ngay)} icon={<Calendar size={12} />} />
            <DetailField label={t('nkpc.col.nhanSu')} value={data.ten_nhan_vien_phu_trach ?? ''} emptyText="—" icon={<User size={12} />} />
            <DetailField label={t('nkpc.col.soLan')} value={String(data.lan.length)} icon={<Droplets size={12} />} />
            <DetailField
              label={t('nkpc.col.tongNuoc')}
              value={data.lan.length ? formatSo(tongNuocLit(data.lan)) : ''}
              emptyText="—"
              icon={<Droplets size={12} />}
            />
            <DetailField label={t('nkpc.col.cacThuoc')} value={cacThuoc(data.lan).join(', ')} emptyText="—" icon={<Droplets size={12} />} />
            <DetailField
              label={t('nkpc.col.ghiChu')}
              value={data.ghi_chu ?? ''}
              emptyText="—"
              icon={<FileText size={12} />}
              className="col-span-1 sm:col-span-2 lg:col-span-3 whitespace-pre-line"
            />
          </DetailFieldGrid>
        </DetailSection>

        <DetailSection title={`${t('nkpc.lan.title')} (${data.lan.length})`} icon={<Droplets size={14} />} variant="secondary">
          {data.lan.length === 0 ? (
            <p className="text-sm text-muted-foreground/70 italic m-0">{t('nkpc.lan.empty')}</p>
          ) : (
            <SubTable
              tableKey="nhat-ky-phun-cui.lan"
              columns={lanColumns}
              rows={data.lan}
              keyExtractor={(l) => l.id}
              renderCell={renderLanCell}
              maxHeight="420px"
            />
          )}
        </DetailSection>

        <DetailSection title={t('nkpc.detail.systemInfo')} icon={<Calendar size={14} />} variant="muted">
          <DetailFieldGrid>
            <DetailField label={t('nkpc.col.nguoiTao')} value={data.ten_nguoi_tao ?? ''} emptyText="—" icon={<User size={12} />} />
            <DetailField label={t('nkpc.detail.tgTao')} value={formatDateTimeShort(data.tg_tao)} icon={<Calendar size={12} />} />
            <DetailField label={t('nkpc.detail.tgCapNhat')} value={formatDateTimeShort(data.tg_cap_nhat)} icon={<Calendar size={12} />} />
          </DetailFieldGrid>
        </DetailSection>
      </div>
    </GenericDrawer>
  );
};

export default NhatKyPhunCuiDetail;
