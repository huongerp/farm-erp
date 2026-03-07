import React from 'react';
import { useTranslation } from 'react-i18next';
import { Printer, Edit, Trash2, Calendar, FileText, Award, MessageSquare, Mail } from 'lucide-react';
import GenericDrawer, { DRAWER_WIDTH_DETAIL } from '../../../../components/shared/GenericDrawer';
import DetailSection from '../../../../components/shared/DetailSection';
import DetailField from '../../../../components/shared/DetailField';
import DetailToolbar, { DetailToolbarAction } from '../../../../components/shared/DetailToolbar';
import Button from '../../../../components/ui/Button';
import { BTN_CLOSE, BTN_EDIT, BTN_DELETE } from '../../../../lib/button-labels';
import { getTrangThaiLichPVLabel, getHinhThucLabel, getKetQuaBadgeClass, getTrangThaiDanhGiaLabel, TRANG_THAI_DANH_GIA_BADGE_CLASS } from '../core/constants';
import { parseDanhGiaChiTiet } from '../core/danh-gia-types';
import { XEP_HANG_OPTIONS, DE_XUAT_OPTIONS } from '../core/danh-gia-types';
import type { LichPhongVan } from '../core/types';

const TRANG_THAI_VARIANT: Record<number, string> = {
  0: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
  1: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
  2: 'bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20',
  3: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20',
};

interface Props {
  data: LichPhongVan;
  onClose: () => void;
  onEdit: (item: LichPhongVan) => void;
  onDelete?: (id: string) => void;
  /** Mở form đánh giá phỏng vấn (chỉ phần đánh giá) */
  onOpenDanhGia?: (item: LichPhongVan) => void;
  }

const LichPhongVanDetail: React.FC<Props> = ({ data, onClose, onEdit, onDelete, onOpenDanhGia }) => {
  const { t } = useTranslation();

  const getPhieuPreviewUrl = (id: string) => `/phieu-danh-gia-pv/${encodeURIComponent(id)}`;
  const getThuMoiPreviewUrl = (id: string) => `/thu-moi-phong-van/${encodeURIComponent(id)}`;

  const toolbarActions: DetailToolbarAction[] = [
    {
      label: t('lichPhongVan.detail.toolbar.printEvaluation'),
      icon: <Printer size={16} />,
      onClick: () => window.open(getPhieuPreviewUrl(data.id), '_blank', 'noopener,noreferrer'),
      variant: 'primary',
    },
    ...(onOpenDanhGia
      ? [
          {
            label: t('lichPhongVan.detail.toolbar.evaluate'),
            icon: <Award size={16} />,
            onClick: () => onOpenDanhGia(data),
            variant: 'info' as const,
          },
        ]
      : []),
    {
      label: t('lichPhongVan.detail.toolbar.printInvitation'),
      icon: <Mail size={16} />,
      onClick: () => window.open(getThuMoiPreviewUrl(data.id), '_blank', 'noopener,noreferrer'),
      variant: 'secondary',
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
      title={t('lichPhongVan.detail.title')}
      subtitle={`${data.ten_ung_vien ?? '—'} · ${t('lichPhongVan.detail.lichColVong')} ${data.so_vong}`}
      icon={<Calendar size={20} />}
      onClose={onClose}
      footer={renderFooter}
      maxWidthClass={DRAWER_WIDTH_DETAIL}
    >
      <div className="space-y-5">
        <DetailToolbar actions={toolbarActions} className="bg-card rounded-xl border border-border" />

        <DetailSection
          title={t('lichPhongVan.detail.sectionInfo')}
          icon={<Calendar size={14} />}
          variant="primary"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <DetailField
              label={t('lichPhongVan.store.ungVienCol')}
              value={data.ten_ung_vien ?? '—'}
            />
            <DetailField
              label={t('lichPhongVan.detail.viTriUngTuyen')}
              value={data.ma_de_xuat ?? '—'}
            />
            <DetailField
              label={t('lichPhongVan.store.soVongCol')}
              value={String(data.so_vong)}
            />
            <DetailField
              label={t('lichPhongVan.detail.ngayGio')}
              value={`${data.ngay} – ${data.gio}`}
            />
            <DetailField
              label={t('lichPhongVan.store.hinhThucCol')}
              value={getHinhThucLabel(data.hinh_thuc, t)}
            />
            <DetailField
              label={t('lichPhongVan.store.diaDiemCol')}
              value={data.dia_diem ?? '—'}
            />
            <div>
              <p className="text-2xs font-medium text-muted-foreground mb-1">
                {t('lichPhongVan.store.trangThaiCol')}
              </p>
              <span
                className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${TRANG_THAI_VARIANT[data.trang_thai] ?? TRANG_THAI_VARIANT[0]}`}
              >
                {getTrangThaiLichPVLabel(data.trang_thai, t)}
              </span>
            </div>
          </div>
        </DetailSection>

        <DetailSection
          title={t('lichPhongVan.detail.sectionDanhGia')}
          icon={<Award size={14} />}
          variant="primary"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {(() => {
              const chiTiet = parseDanhGiaChiTiet(data.danh_gia_chi_tiet);
              if (chiTiet) {
                const xepHangLabel = chiTiet.xep_hang_chung
                  ? t(XEP_HANG_OPTIONS.find((o) => o.value === chiTiet.xep_hang_chung)?.labelKey ?? '')
                  : null;
                const deXuatLabel = chiTiet.de_xuat
                  ? t(DE_XUAT_OPTIONS.find((o) => o.value === chiTiet.de_xuat)?.labelKey ?? '')
                  : null;
                return (
                  <>
                    {chiTiet.nguoi_phong_van && (
                      <DetailField
                        label={t('lichPhongVan.danhGia.nguoiPhongVan')}
                        value={chiTiet.nguoi_phong_van}
                      />
                    )}
                    {xepHangLabel && (
                      <DetailField
                        label={t('lichPhongVan.danhGia.xepHangChung')}
                        value={xepHangLabel}
                      />
                    )}
                    {deXuatLabel && (
                      <DetailField
                        label={t('lichPhongVan.danhGia.deXuatLabel')}
                        value={deXuatLabel}
                      />
                    )}
                    {chiTiet.diem_manh && (
                      <DetailField
                        label={t('lichPhongVan.danhGia.diemManh')}
                        value={chiTiet.diem_manh}
                        className="sm:col-span-2"
                      />
                    )}
                    {chiTiet.diem_yeu && (
                      <DetailField
                        label={t('lichPhongVan.danhGia.diemYeu')}
                        value={chiTiet.diem_yeu}
                        className="sm:col-span-2"
                      />
                    )}
                  </>
                );
              }
              return (
                <>
                  <DetailField
                    label={t('lichPhongVan.form.danhGiaDiemSo')}
                    value={data.danh_gia_diem_so ?? '—'}
                  />
                  <DetailField
                    label={t('lichPhongVan.form.danhGiaNhanXet')}
                    value={data.danh_gia_nhan_xet ?? '—'}
                    className="sm:col-span-2"
                  />
                </>
              );
            })()}
          </div>
        </DetailSection>

        <DetailSection
          title={t('lichPhongVan.detail.sectionKetQua')}
          icon={<MessageSquare size={14} />}
          variant="primary"
        >
          <DetailField
            label={t('lichPhongVan.store.trangThaiDanhGiaCol')}
            value={
              <span
                className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border w-fit ${TRANG_THAI_DANH_GIA_BADGE_CLASS[data.trang_thai_danh_gia ?? 0] ?? TRANG_THAI_DANH_GIA_BADGE_CLASS[0]}`}
              >
                {getTrangThaiDanhGiaLabel(data.trang_thai_danh_gia, t)}
              </span>
            }
          />
          <DetailField
            label={t('lichPhongVan.store.ketQuaCol')}
            value={
              <span
                className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border w-fit ${getKetQuaBadgeClass(data.ket_qua)}`}
              >
                {data.ket_qua ?? '—'}
              </span>
            }
          />
        </DetailSection>

        {data.ghi_chu && data.ghi_chu.trim() !== '' && (
          <DetailSection
            title={t('lichPhongVan.detail.sectionGhiChu')}
            icon={<FileText size={14} />}
            variant="primary"
          >
            <p className="text-body-sm text-foreground whitespace-pre-wrap">{data.ghi_chu}</p>
          </DetailSection>
        )}
      </div>
    </GenericDrawer>
  );
};

export default LichPhongVanDetail;
