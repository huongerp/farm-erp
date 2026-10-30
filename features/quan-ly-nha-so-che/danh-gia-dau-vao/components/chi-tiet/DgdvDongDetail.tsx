/**
 * Drawer con CHỈ XEM một dòng «Chi tiết đánh giá»: lô, tổ trưởng, dây (chip màu) hoặc «Đứt dây», số lượng,
 * đánh giá, SL lỗi (đỏ khi > SL), lý do. Bấm dòng ở bảng luôn mở drawer này (kể cả không có quyền nhập /
 * phiếu đã khoá); footer Sửa / Xoá chỉ khi được nhập.
 */
import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { ListChecks } from 'lucide-react';
import GenericDrawer from '../../../../../components/shared/GenericDrawer';
import DetailSection from '../../../../../components/shared/DetailSection';
import DetailField from '../../../../../components/shared/DetailField';
import DetailFieldGrid from '../../../../../components/shared/DetailFieldGrid';
import DetailDrawerFooter from '../../../../../components/shared/DetailDrawerFooter';
import { DRAWER_WIDTH_STACKED } from '../../../../../lib/dialog-sizes';
import { cn, formatNumberVN, formatYmdToDisplay } from '../../../../../lib/utils';
import type { DgdvPhieuDayDu } from '../../core/types';
import type { DgdvDongPhang } from '../../core/chi-tiet-dong';
import { useMauDay } from '../../hooks/use-danh-muc-dgdv';
import { ChipDay } from '../ChipDay';

interface Props {
  phieu: DgdvPhieuDayDu;
  dong: DgdvDongPhang;
  canNhap: boolean;
  onClose: () => void;
  onSua: () => void;
  onXoa: () => void;
  stackLevel: number;
}

const DgdvDongDetail: React.FC<Props> = ({ phieu, dong, canNhap, onClose, onSua, onXoa, stackLevel }) => {
  const { t } = useTranslation();
  const { mauTheoId } = useMauDay();
  const cot = useMemo(() => (dong.id_cot ? (phieu.cot.find((c) => c.id === dong.id_cot) ?? null) : null), [phieu.cot, dong.id_cot]);
  const dutDay = dong.loai === 'dut_day';
  const loiQua = dong.so_luong_huy > dong.so_luong;

  return (
    <GenericDrawer
      title={dutDay ? t('danhGiaDauVao.luoi.dutDay') : t('danhGiaDauVao.chiTiet.xemTitle')}
      subtitle={`${t('danhGiaDauVao.detail.tieuDeNgay', { ngay: formatYmdToDisplay(phieu.ngay) })} · ${t('danhGiaDauVao.detail.tieuDeChuyen', { chuyen: phieu.chuyen })}`}
      icon={<ListChecks size={18} />}
      onClose={onClose}
      stackLevel={stackLevel}
      maxWidthClass={DRAWER_WIDTH_STACKED}
      footer={<DetailDrawerFooter onClose={onClose} canUpdate={canNhap} canDelete={canNhap} onEdit={onSua} onDelete={onXoa} />}
    >
      <DetailSection title={t('danhGiaDauVao.chiTiet.sectionVitri')} variant="primary">
        <DetailFieldGrid cols={2}>
          <DetailField label={t('danhGiaDauVao.form.lo')} value={dong.ten_lo ?? '—'} />
          <DetailField label={t('danhGiaDauVao.form.toTruong')} value={dong.to_truong ?? '—'} />
          <DetailField label={t('danhGiaDauVao.chiTiet.colDay')} value={<ChipDay cot={dutDay ? null : cot} mauTheoId={mauTheoId} />} />
          <DetailField label={t('danhGiaDauVao.luoi.colSoLuong')} value={<span className="font-bold tabular-nums text-primary">{formatNumberVN(dong.so_luong)}</span>} />
          {!dutDay && (
            <>
              <DetailField label={t('danhGiaDauVao.luoi.colDanhGia')} value={dong.danh_gia ?? t('danhGiaDauVao.chiTiet.dat')} />
              <DetailField
                label={t('danhGiaDauVao.luoi.colSlLoi')}
                value={
                  <span className={cn('tabular-nums', loiQua ? 'font-semibold text-rose-600' : dong.so_luong_huy > 0 && 'text-rose-600')}>
                    {formatNumberVN(dong.so_luong_huy)}
                    {loiQua && <span className="ml-2 text-caption">{t('danhGiaDauVao.luoi.canhBaoLoi')}</span>}
                  </span>
                }
              />
              <DetailField label={t('danhGiaDauVao.luoi.colLyDoLoi')} value={dong.ly_do_huy ?? '—'} className="sm:col-span-2" />
            </>
          )}
        </DetailFieldGrid>
      </DetailSection>
    </GenericDrawer>
  );
};

export default DgdvDongDetail;
