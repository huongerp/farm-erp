/**
 * Chi tiết phiếu chuyến (60rem): ngày · chuyến · tuần · chi nhánh trên tiêu đề; thông tin gọn (trạng thái, tổng
 * thu, KSC, ghi chú; người tạo / cập nhật ở dòng phụ cuối) + bảng con «Theo lô» (bấm lô → drawer lô) + «Chi tiết
 * đánh giá» (bấm dòng → drawer xem dòng; nhập SL · đánh giá · SL lỗi · lý do · đứt dây, «Nhập theo lô»).
 * Lưới Excel lô × dây mở bằng «Xem dạng lưới» (drawer con rộng). In ngày / In cả tuần farm, Xuất Excel dạng
 * dòng, Sao chép sang chuyến mới, Khoá.
 */
import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AnimatePresence } from 'framer-motion';
import { ClipboardPen, Copy, FileSpreadsheet, Grid3x3, Lock, Printer, Unlock } from 'lucide-react';
import GenericDrawer from '../../../../components/shared/GenericDrawer';
import { DRAWER_WIDTH_BAO_CAO_SO_CHE, DRAWER_WIDTH_WIDE } from '../../../../lib/dialog-sizes';
import DetailSection from '../../../../components/shared/DetailSection';
import DetailField from '../../../../components/shared/DetailField';
import DetailFieldGrid from '../../../../components/shared/DetailFieldGrid';
import DetailToolbar, { type DetailToolbarAction } from '../../../../components/shared/DetailToolbar';
import DetailDrawerFooter from '../../../../components/shared/DetailDrawerFooter';
import { CONFIRM_YES } from '../../../../lib/button-labels';
import { useConfirmStore } from '../../../../store/useConfirmStore';
import { formatDateTimeShort, formatNumberVN, formatYmdToDisplay } from '../../../../lib/utils';
import type { DgdvPhieuDayDu } from '../core/types';
import { TRANG_THAI_DGDV } from '../core/types';
import { cacNgayCuaTuanFarm } from '../core/tuan';
import { tongPhieu } from '../core/bang-tinh';
import { useUpdateDgdvTrangThai } from '../hooks/use-danh-gia-dau-vao';
import { useDungLuoi } from '../hooks/use-dung-luoi';
import { getDgdvPreviewUrl } from '../utils/preview-url';
import { nhanTiLeKsc } from '../utils/export-danh-sach';
import DgdvLuoiNgayTable from './luoi/DgdvLuoiNgayTable';
import DgdvChiTietSection from './chi-tiet/DgdvChiTietSection';
import DgdvTheoLoSection from './chi-tiet/DgdvTheoLoSection';
import { useDgdvChiTietDrawers } from './chi-tiet/useDgdvChiTietDrawers';
import LazyImportDialog from '../../../../components/shared/LazyImportDialog';
import { useDgdvImport } from '../hooks/use-dgdv-import';
import { TrangThaiDgdvBadge } from './DgdvList';

interface Props {
  data: DgdvPhieuDayDu;
  onClose: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  onSaoChep?: () => void;
  /** Xuất Excel chi tiết dạng dòng của phiếu (khuôn file import). */
  onXuatExcel?: () => void;
  dangXuat?: boolean;
  canToggleTrangThai: boolean;
  canNhapLuoi: boolean;
  /** Tầng drawer — 1 khi mở chồng từ Detail tổng ngày. */
  stackLevel?: number;
}

const DgdvDetail: React.FC<Props> = ({
  data,
  onClose,
  onEdit,
  onDelete,
  onSaoChep,
  onXuatExcel,
  dangXuat,
  canToggleTrangThai,
  canNhapLuoi,
  stackLevel = 0,
}) => {
  const { t } = useTranslation();
  const confirm = useConfirmStore((s) => s.confirm);
  const trangThaiMutation = useUpdateDgdvTrangThai();
  const phieuCoDinh = useMemo(
    () => ({ id: data.id, ngay: data.ngay, chuyen: data.chuyen, id_chi_nhanh: data.id_chi_nhanh }),
    [data.id, data.ngay, data.chuyen, data.id_chi_nhanh]
  );
  const importer = useDgdvImport(phieuCoDinh);
  const { mo, drawers } = useDgdvChiTietDrawers(data, canNhapLuoi, stackLevel);
  const [xemLuoi, setXemLuoi] = useState(false);

  const ngay = data.ngay;
  const cacNgayTuan = useMemo(() => cacNgayCuaTuanFarm(data.nam, data.tuan), [data.nam, data.tuan]);

  const dsPhieu = useMemo(() => [data], [data]);
  const { dsKhoi, canhBao } = useDungLuoi(dsPhieu, ngay, ngay);
  const luoi = dsKhoi[0]?.luoi[0];
  const khoa = data.trang_thai === TRANG_THAI_DGDV.KHOA;

  const tong = useMemo(() => tongPhieu(data), [data]);

  const moIn = (tu: string, den: string) =>
    window.open(getDgdvPreviewUrl(tu, den, data.id_chi_nhanh), '_blank', 'noopener,noreferrer');

  const actions: DetailToolbarAction[] = [
    { label: t('danhGiaDauVao.detail.xemLuoi'), icon: <Grid3x3 size={16} />, variant: 'primary', disabled: !luoi, onClick: () => setXemLuoi(true) },
    { label: t('danhGiaDauVao.detail.inNgay'), icon: <Printer size={16} />, variant: 'outline', onClick: () => moIn(ngay, ngay) },
    { label: t('danhGiaDauVao.detail.inTuan'), icon: <Printer size={16} />, variant: 'outline', onClick: () => moIn(cacNgayTuan[0], cacNgayTuan[6]) },
  ];
  if (onXuatExcel) {
    actions.push({
      label: t('danhGiaDauVao.xuat.nutPhieu'),
      icon: <FileSpreadsheet size={16} />,
      variant: 'outline',
      disabled: dangXuat,
      onClick: onXuatExcel,
    });
  }
  if (onSaoChep) {
    actions.push({ label: t('danhGiaDauVao.detail.saoChep'), icon: <Copy size={16} />, variant: 'outline', onClick: onSaoChep });
  }
  if (canToggleTrangThai) {
    actions.push({
      label: khoa ? t('danhGiaDauVao.detail.moKhoa') : t('danhGiaDauVao.detail.khoa'),
      icon: khoa ? <Unlock size={16} /> : <Lock size={16} />,
      variant: 'outline',
      disabled: trangThaiMutation.isPending,
      onClick: () =>
        confirm({
          title: khoa ? t('danhGiaDauVao.confirmUnlockTitle') : t('danhGiaDauVao.confirmLockTitle'),
          message: khoa ? t('danhGiaDauVao.confirmUnlockMessage') : t('danhGiaDauVao.confirmLockMessage'),
          variant: 'warning',
          confirmText: CONFIRM_YES(),
          onConfirm: () =>
            trangThaiMutation.mutate({ ids: [data.id], trang_thai: khoa ? TRANG_THAI_DGDV.MO : TRANG_THAI_DGDV.KHOA }),
        }),
    });
  }

  const tieuDe = [
    t('danhGiaDauVao.detail.tieuDeNgay', { ngay: formatYmdToDisplay(data.ngay) }),
    t('danhGiaDauVao.detail.tieuDeChuyen', { chuyen: data.chuyen }),
    t('danhGiaDauVao.luoi.tuan', { tuan: data.tuan }),
    data.ten_chi_nhanh,
  ]
    .filter(Boolean)
    .join(' · ');

  return (
    <GenericDrawer
      // Điện thoại: tiêu đề ngắn (chuyến · chi nhánh), ngày · tuần xuống dòng phụ — không bị cắt mất chi nhánh.
      title={[t('danhGiaDauVao.detail.tieuDeChuyen', { chuyen: data.chuyen }), data.ten_chi_nhanh].filter(Boolean).join(' · ')}
      subtitle={`${t('danhGiaDauVao.detail.tieuDeNgay', { ngay: formatYmdToDisplay(data.ngay) })} · ${t('danhGiaDauVao.luoi.tuan', { tuan: data.tuan })}`}
      icon={<ClipboardPen className="text-fuchsia-600" size={22} />}
      onClose={onClose}
      stackLevel={stackLevel}
      maxWidthClass={DRAWER_WIDTH_BAO_CAO_SO_CHE}
      footer={<DetailDrawerFooter onClose={onClose} canUpdate={!!onEdit} canDelete={!!onDelete} onEdit={onEdit} onDelete={onDelete} />}
    >
      <div className="space-y-4 pb-2">
        <DetailToolbar actions={actions} className="bg-card rounded-xl border border-border" />

        <DetailSection title={t('danhGiaDauVao.detail.sectionPhieu')} icon={<ClipboardPen size={14} />} variant="primary">
          <DetailFieldGrid cols={3} className="grid-cols-2 gap-y-3">
            <DetailField label={t('danhGiaDauVao.store.colTrangThai')} value={<TrangThaiDgdvBadge trangThai={data.trang_thai} />} />
            <DetailField
              label={t('danhGiaDauVao.store.colTongThu')}
              value={<span className="font-bold tabular-nums text-primary">{formatNumberVN(tong.tongThu)}</span>}
            />
            <DetailField
              label={t('danhGiaDauVao.store.colKsc')}
              value={
                <span className="tabular-nums">
                  <span className="font-bold text-rose-600">{formatNumberVN(tong.ksc)}</span>
                  <span className="text-muted-foreground"> · {nhanTiLeKsc(tong.ksc, tong.tongThu)}</span>
                </span>
              }
            />
            {data.ghi_chu?.trim() && (
              <DetailField
                label={t('danhGiaDauVao.form.ghiChu')}
                value={<div className="whitespace-pre-wrap">{data.ghi_chu}</div>}
                className="col-span-2 lg:col-span-3"
              />
            )}
          </DetailFieldGrid>
          {khoa && (
            <p className="text-caption text-amber-700 dark:text-amber-400 m-0 mt-2 inline-flex items-center gap-1">
              <Lock size={12} />
              {t('danhGiaDauVao.luoi.daKhoa')}
            </p>
          )}
        </DetailSection>

        <DgdvTheoLoSection phieu={data} canNhap={canNhapLuoi} onXemLo={mo.xemLo} onNhapTheoLo={mo.nhapTheoLo} />

        <DgdvChiTietSection phieu={data} canNhap={canNhapLuoi} onImport={importer.openImport} mo={mo} />

        <p className="m-0 text-caption text-muted-foreground">
          {t('danhGiaDauVao.detail.dongPhu', {
            nguoiTao: data.ten_nguoi_tao ?? '—',
            tao: formatDateTimeShort(data.tg_tao),
            capNhat: formatDateTimeShort(data.tg_cap_nhat),
          })}
        </p>
        <LazyImportDialog open={importer.showImport} onClose={importer.closeImport} {...importer.dialogProps} />
      </div>

      {drawers}

      <AnimatePresence>
        {xemLuoi && luoi && (
          <GenericDrawer
            title={t('danhGiaDauVao.detail.sectionLuoi')}
            subtitle={tieuDe}
            icon={<Grid3x3 size={18} />}
            onClose={() => setXemLuoi(false)}
            stackLevel={stackLevel + 1}
            maxWidthClass={DRAWER_WIDTH_WIDE}
            fullWidthContent
          >
            <DgdvLuoiNgayTable luoi={luoi} canhBao={canhBao} />
          </GenericDrawer>
        )}
      </AnimatePresence>
    </GenericDrawer>
  );
};

export default DgdvDetail;
