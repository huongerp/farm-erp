import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  FileText,
  Edit,
  Trash2,
  User,
  Printer,
  Briefcase,
  Calendar,
  FileSignature,
  Link2,
} from 'lucide-react';
import GenericDrawer, { DRAWER_WIDTH_DETAIL } from '../../../../components/shared/GenericDrawer';
import DetailToolbar, { DetailToolbarAction } from '../../../../components/shared/DetailToolbar';
import DetailSection from '../../../../components/shared/DetailSection';
import DetailField from '../../../../components/shared/DetailField';
import Button from '../../../../components/ui/Button';
import { BTN_CLOSE, BTN_EDIT, BTN_DELETE } from '../../../../lib/button-labels';
import { formatDate, formatDateTimeShort } from '../../../../lib/utils';
import {
  getLoaiHopDongLabel,
  getLoaiHopDongBadgeClass,
  getTrangThaiHopDongLabel,
  getTrangThaiHopDongBadgeClass,
  getDaysUntilEnd,
} from '../core/constants';
import type { HopDong, PhieuThanhLy } from '../core/types';

const PREVIEW_BASE = '/nhan-su/hop-dong/preview';
const PREVIEW_PHIEU_THANH_LY_BASE = '/nhan-su/hop-dong/thanh-ly/preview';

interface Props {
  data: HopDong;
  hasPhieuThanhLy: boolean;
  /** Phiếu thanh lý nếu đã có (để hiển thị số phiếu, ngày, lý do) */
  phieu?: PhieuThanhLy | null;
  onClose: () => void;
  onEdit: (item: HopDong) => void;
  onDelete: (id: string) => void;
  onOpenCreateChinhThuc: (item: HopDong) => void;
  onOpenPhieuThanhLy: (item: HopDong) => void;
  /** Mở detail HĐ thử việc gốc (khi có id_hop_dong_goc) */
  onOpenHopDongGoc?: (id: string) => void;
}

const HopDongDetail: React.FC<Props> = ({
  data,
  hasPhieuThanhLy,
  phieu,
  onClose,
  onEdit,
  onDelete,
  onOpenCreateChinhThuc,
  onOpenPhieuThanhLy,
  onOpenHopDongGoc,
}) => {
  const { t } = useTranslation();

  const printUrl = `${PREVIEW_BASE}/${encodeURIComponent(data.id)}`;

  const toolbarActions: DetailToolbarAction[] = [
    {
      label: t('hopDong.detail.toolbar.print'),
      icon: <Printer size={16} />,
      onClick: () => window.open(printUrl, '_blank', 'noopener,noreferrer'),
      variant: 'primary',
    },
  ];

  if (data.loai_hop_dong === 'thu-viec') {
    toolbarActions.push({
      label: t('hopDong.createChinhThuc'),
      icon: <FileSignature size={16} />,
      onClick: () => {
        onOpenCreateChinhThuc(data);
        onClose();
      },
      variant: 'success',
    });
  }

  if (data.loai_hop_dong === 'chinh-thuc' && !hasPhieuThanhLy) {
    toolbarActions.push({
      label: t('hopDong.createPhieuThanhLy'),
      icon: <FileSignature size={16} />,
      onClick: () => onOpenPhieuThanhLy(data),
      variant: 'warning',
    });
  }

  if (hasPhieuThanhLy && phieu) {
    const phieuPrintUrl = `${PREVIEW_PHIEU_THANH_LY_BASE}/${encodeURIComponent(phieu.id)}`;
    toolbarActions.push({
      label: t('hopDong.phieuThanhLy.printAction'),
      icon: <Printer size={16} />,
      onClick: () => window.open(phieuPrintUrl, '_blank', 'noopener,noreferrer'),
      variant: 'secondary',
    });
  }

  const footer = (
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

  const loaiBadgeClass = getLoaiHopDongBadgeClass(data.loai_hop_dong);
  const trangThaiBadgeClass = getTrangThaiHopDongBadgeClass(data.trang_thai);

  return (
    <GenericDrawer
      title={data.ten_ung_vien ?? '—'}
      icon={<FileText size={20} />}
      subtitle={
        <span
          className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium border shrink-0 ${loaiBadgeClass}`}
        >
          {getLoaiHopDongLabel(data.loai_hop_dong, t)}
        </span>
      }
      onClose={onClose}
      footer={footer}
      maxWidthClass={DRAWER_WIDTH_DETAIL}
    >
      <div className="space-y-5">
        <div className="bg-card p-4 rounded-xl border border-border/50 shadow-sm flex items-center gap-4">
          <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center text-white shadow-primary/20 shadow-lg shrink-0">
            <FileText size={24} className="text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-base font-bold text-foreground leading-tight truncate">
              {data.ten_ung_vien ?? '—'}
            </h2>
            <div className="flex flex-wrap items-center gap-2 mt-1">
              <span
                className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium border w-fit ${loaiBadgeClass}`}
              >
                {getLoaiHopDongLabel(data.loai_hop_dong, t)}
              </span>
              {data.loai_hop_dong === 'thu-viec' && (() => {
                const days = getDaysUntilEnd(data.ngay_ket_thuc);
                if (days != null && days >= 0 && days <= 7) {
                  return (
                    <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 w-fit">
                      {t('hopDong.sapHetHan')}
                    </span>
                  );
                }
                return null;
              })()}
              <span className="text-xs text-muted-foreground">{data.so_hop_dong}</span>
              <span
                className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium border w-fit ${trangThaiBadgeClass}`}
              >
                {getTrangThaiHopDongLabel(data.trang_thai, t)}
              </span>
            </div>
          </div>
        </div>

        <DetailToolbar actions={toolbarActions} className="bg-card rounded-xl border border-border" />

        <DetailSection
          title={t('hopDong.detail.basicInfo')}
          icon={<FileText size={14} />}
          variant="primary"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <DetailField
              label={t('hopDong.table.ungVien')}
              value={data.ten_ung_vien ?? '—'}
              icon={<User size={14} />}
            />
            <DetailField
              label={t('hopDong.table.soHopDong')}
              value={data.so_hop_dong}
              icon={<FileText size={14} />}
            />
            <DetailField
              label={t('hopDong.table.loaiHopDong')}
              value={
                <span
                  className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium border w-fit ${loaiBadgeClass}`}
                >
                  {getLoaiHopDongLabel(data.loai_hop_dong, t)}
                </span>
              }
              icon={<FileText size={14} />}
            />
            <DetailField
              label={t('hopDong.table.ngayBatDau')}
              value={formatDate(data.ngay_bat_dau)}
              icon={<Calendar size={14} />}
            />
            <DetailField
              label={t('hopDong.table.ngayKetThuc')}
              value={data.ngay_ket_thuc ? formatDate(data.ngay_ket_thuc) : '—'}
              icon={<Calendar size={14} />}
              emptyText="—"
            />
            <DetailField
              label={t('hopDong.table.trangThai')}
              value={
                <span
                  className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium border w-fit ${trangThaiBadgeClass}`}
                >
                  {getTrangThaiHopDongLabel(data.trang_thai, t)}
                </span>
              }
            />
            <div className="col-span-1 sm:col-span-2">
              <DetailField
                label={t('hopDong.ghiChu')}
                value={data.ghi_chu ?? ''}
                emptyText={t('common.noData')}
              />
            </div>
            <DetailField
              label={t('hopDong.table.ngayTao')}
              value={formatDateTimeShort(data.tg_tao)}
            />
            <DetailField
              label={t('hopDong.updatedAt')}
              value={formatDateTimeShort(data.tg_cap_nhat)}
            />
            {data.id_hop_dong_goc && (
              <div className="col-span-1 sm:col-span-2">
                <DetailField
                  label={t('hopDong.hopDongThuViecGoc')}
                  value={
                    onOpenHopDongGoc ? (
                      <button
                        type="button"
                        onClick={() => onOpenHopDongGoc(data.id_hop_dong_goc!)}
                        className="inline-flex items-center gap-1.5 text-primary hover:underline font-medium"
                      >
                        <Link2 size={14} />
                        {t('hopDong.hopDongThuViecGoc')}
                      </button>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 text-primary">
                        <Link2 size={14} />
                        {t('hopDong.hopDongThuViecGoc')}
                      </span>
                    )
                  }
                />
              </div>
            )}
            {hasPhieuThanhLy && phieu && (
              <div className="col-span-1 sm:col-span-2 p-3 rounded-lg bg-muted/50 border border-border">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-1">
                      {t('hopDong.phieuThanhLy.title')}
                    </p>
                    <p className="text-body-sm text-foreground">
                      {phieu.so_phieu} · {formatDate(phieu.ngay_thanh_ly)} · {phieu.ly_do}
                    </p>
                    {phieu.ghi_chu && (
                      <p className="text-body-sm text-muted-foreground mt-1">{phieu.ghi_chu}</p>
                    )}
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="shrink-0 h-8"
                    onClick={() =>
                      window.open(
                        `${PREVIEW_PHIEU_THANH_LY_BASE}/${encodeURIComponent(phieu.id)}`,
                        '_blank',
                        'noopener,noreferrer'
                      )
                    }
                  >
                    <Printer size={14} className="sm:mr-1.5" />
                    <span className="hidden sm:inline">{t('hopDong.phieuThanhLy.printAction')}</span>
                  </Button>
                </div>
              </div>
            )}
          </div>
        </DetailSection>

        <DetailSection
          title={t('hopDong.detail.terms')}
          icon={<Briefcase size={14} />}
          variant="primary"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <DetailField
              label={t('hopDong.bacLuong')}
              value={data.bac_luong ?? ''}
              emptyText={t('common.noData')}
            />
            <DetailField
              label={t('hopDong.mucLuong')}
              value={data.muc_luong ?? ''}
              emptyText={t('common.noData')}
            />
            <DetailField
              label={t('hopDong.ngayVaoLam')}
              value={data.ngay_vao_lam ? formatDate(data.ngay_vao_lam) : ''}
              icon={<Calendar size={14} />}
              emptyText={t('common.noData')}
            />
            <div className="col-span-1 sm:col-span-2">
              <DetailField
                label={t('hopDong.coCheKhac')}
                value={data.co_che_khac ?? ''}
                emptyText={t('common.noData')}
              />
            </div>
            <div className="col-span-1 sm:col-span-2">
              <DetailField
                label={t('hopDong.ghiChuKhac')}
                value={data.ghi_chu_khac ?? ''}
                emptyText={t('common.noData')}
              />
            </div>
          </div>
        </DetailSection>
      </div>
    </GenericDrawer>
  );
};

export default HopDongDetail;
