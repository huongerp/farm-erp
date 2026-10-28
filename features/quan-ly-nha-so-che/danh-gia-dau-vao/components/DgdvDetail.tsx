/**
 * Chi tiết phiếu tuần: thông tin phiếu + lưới của ngày đang chọn (chip T2…CN, dùng chung lưới với
 * tab Bảng đánh giá — nhập được nếu có quyền) + In ngày / In cả tuần, Sao chép sang tuần mới, Khoá.
 */
import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ClipboardPen, Copy, Lock, Printer, Unlock } from 'lucide-react';
import GenericDrawer from '../../../../components/shared/GenericDrawer';
import { DRAWER_WIDTH_WIDE } from '../../../../lib/dialog-sizes';
import DetailSection from '../../../../components/shared/DetailSection';
import DetailField from '../../../../components/shared/DetailField';
import DetailFieldGrid from '../../../../components/shared/DetailFieldGrid';
import DetailToolbar, { type DetailToolbarAction } from '../../../../components/shared/DetailToolbar';
import DetailDrawerFooter from '../../../../components/shared/DetailDrawerFooter';
import { CONFIRM_YES } from '../../../../lib/button-labels';
import { useConfirmStore } from '../../../../store/useConfirmStore';
import { cn, formatDateTimeShort, formatNumberVN, formatYmdToDisplay, getTodayISO } from '../../../../lib/utils';
import type { DgdvPhieuDayDu } from '../core/types';
import { TRANG_THAI_DGDV } from '../core/types';
import { cacNgayCuaTuan } from '../core/tuan';
import { tongPhieuNgay } from '../core/bang-tinh';
import { useUpdateDgdvTrangThai } from '../hooks/use-danh-gia-dau-vao';
import { useLyDoDgdv } from '../hooks/use-danh-muc-dgdv';
import { useDungLuoi } from '../hooks/use-dung-luoi';
import { getDgdvPreviewUrl } from '../utils/preview-url';
import { khoangNgayTuan } from '../utils/export-danh-sach';
import DgdvLuoiNgayTable from './luoi/DgdvLuoiNgayTable';
import { TrangThaiDgdvBadge } from './DgdvList';

interface Props {
  data: DgdvPhieuDayDu;
  onClose: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  onSaoChep?: () => void;
  canToggleTrangThai: boolean;
  canNhapLuoi: boolean;
}

const DgdvDetail: React.FC<Props> = ({ data, onClose, onEdit, onDelete, onSaoChep, canToggleTrangThai, canNhapLuoi }) => {
  const { t } = useTranslation();
  const confirm = useConfirmStore((s) => s.confirm);
  const trangThaiMutation = useUpdateDgdvTrangThai();
  const { data: dsLyDo = [] } = useLyDoDgdv();

  const cacNgay = useMemo(() => cacNgayCuaTuan(data.nam, data.tuan), [data.nam, data.tuan]);
  const homNay = getTodayISO();
  const [ngayChon, setNgayChon] = useState(() => (cacNgay.includes(homNay) ? homNay : cacNgay[0]));
  const ngay = cacNgay.includes(ngayChon) ? ngayChon : cacNgay[0];

  const dsPhieu = useMemo(() => [data], [data]);
  const { dsKhoi, canhBao } = useDungLuoi(dsPhieu, ngay, ngay);
  const luoi = dsKhoi[0]?.luoi[0];
  const khoa = data.trang_thai === TRANG_THAI_DGDV.KHOA;

  const tongTuan = useMemo(
    () => cacNgay.reduce((s, d) => {
      const x = tongPhieuNgay(data, d);
      return { tongThu: s.tongThu + x.tongThu, ksc: s.ksc + x.ksc };
    }, { tongThu: 0, ksc: 0 }),
    [cacNgay, data]
  );

  const moIn = (tu: string, den: string) =>
    window.open(getDgdvPreviewUrl(tu, den, data.id_chi_nhanh), '_blank', 'noopener,noreferrer');

  const actions: DetailToolbarAction[] = [
    { label: t('danhGiaDauVao.detail.inNgay'), icon: <Printer size={16} />, variant: 'primary', onClick: () => moIn(ngay, ngay) },
    { label: t('danhGiaDauVao.detail.inTuan'), icon: <Printer size={16} />, variant: 'outline', onClick: () => moIn(cacNgay[0], cacNgay[6]) },
  ];
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

  return (
    <GenericDrawer
      title={t('danhGiaDauVao.detail.title')}
      subtitle={[t('danhGiaDauVao.list.namTuan', { tuan: data.tuan, nam: data.nam }), data.ten_chi_nhanh].filter(Boolean).join(' · ')}
      icon={<ClipboardPen className="text-fuchsia-600" size={22} />}
      onClose={onClose}
      maxWidthClass={DRAWER_WIDTH_WIDE}
      fullWidthContent
      footer={
        <DetailDrawerFooter
          onClose={onClose}
          canUpdate={!!onEdit}
          canDelete={!!onDelete}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      }
    >
      <div className="space-y-4 pb-2">
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto]">
          <DetailSection title={t('danhGiaDauVao.detail.sectionPhieu')} icon={<ClipboardPen size={14} />} variant="primary">
            <DetailFieldGrid cols={3} className="lg:grid-cols-4 gap-y-3">
              <DetailField label={t('danhGiaDauVao.store.colNamTuan')} value={t('danhGiaDauVao.list.namTuan', { tuan: data.tuan, nam: data.nam })} />
              <DetailField label={t('danhGiaDauVao.store.colKhoangNgay')} value={khoangNgayTuan(data.nam, data.tuan)} />
              <DetailField label={t('danhGiaDauVao.store.colBranch')} value={data.ten_chi_nhanh ?? '—'} />
              <DetailField label={t('danhGiaDauVao.store.colTrangThai')} value={<TrangThaiDgdvBadge trangThai={data.trang_thai} />} />
              <DetailField
                label={t('danhGiaDauVao.store.colTongThu')}
                value={<span className="font-bold tabular-nums text-primary">{formatNumberVN(tongTuan.tongThu)}</span>}
              />
              <DetailField
                label={t('danhGiaDauVao.store.colKsc')}
                value={<span className="font-bold tabular-nums text-rose-600">{formatNumberVN(tongTuan.ksc)}</span>}
              />
              <DetailField label={t('danhGiaDauVao.store.colNguoiTao')} value={data.ten_nguoi_tao ?? '—'} />
              <DetailField label={t('danhGiaDauVao.store.colUpdated')} value={formatDateTimeShort(data.tg_cap_nhat)} />
              {data.ghi_chu?.trim() && (
                <DetailField
                  label={t('danhGiaDauVao.form.ghiChu')}
                  value={<div className="whitespace-pre-wrap">{data.ghi_chu}</div>}
                  className="sm:col-span-2 lg:col-span-4"
                />
              )}
            </DetailFieldGrid>
          </DetailSection>
          <DetailToolbar
            actions={actions}
            className={cn(
              'bg-card rounded-xl border border-border content-center lg:w-[19rem] lg:grid-cols-2',
              actions.length > 3 ? 'grid-cols-4 sm:grid-cols-4' : 'grid-cols-3 sm:grid-cols-3'
            )}
          />
        </div>

        <DetailSection title={t('danhGiaDauVao.detail.sectionLuoi')} variant="primary">
          <div className="flex flex-wrap gap-1.5 mb-2">
            {cacNgay.map((d, i) => (
              <button
                key={d}
                type="button"
                onClick={() => setNgayChon(d)}
                className={cn(
                  'h-8 px-3 rounded-lg border text-xs font-medium tabular-nums',
                  d === ngay ? 'bg-primary text-white border-primary' : 'border-border bg-background hover:bg-muted'
                )}
              >
                {t(`danhGiaDauVao.thu.${i}`)} · {formatYmdToDisplay(d).slice(0, 5)}
              </button>
            ))}
          </div>
          {khoa && (
            <p className="text-caption text-amber-700 dark:text-amber-400 m-0 mb-1 inline-flex items-center gap-1">
              <Lock size={12} />
              {t('danhGiaDauVao.luoi.daKhoa')}
            </p>
          )}
          {luoi && (
            <DgdvLuoiNgayTable luoi={luoi} editable={canNhapLuoi} canhBao={canhBao} dsLyDo={dsLyDo} />
          )}
        </DetailSection>
      </div>
    </GenericDrawer>
  );
};

export default DgdvDetail;
