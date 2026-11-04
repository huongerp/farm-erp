/**
 * Nội dung in phiếu điểm cộng / trừ — khung chuẩn hệ thống (PhieuInParts): bảng thông tin
 * (nhân viên, kỳ, loại, hạng mục, điểm, ngày tạo), mô tả + quản lý trao đổi (khi có), ô ký người lập / người lao động / quản lý.
 */
import React from 'react';
import { useTranslation } from 'react-i18next';
import { formatDateTimeShort, formatYmdToDisplay } from '../../../../lib/utils';
import { BangThongTin, HangKyTen, KhungPhieu } from '../../../../components/shared/phieu-in/PhieuInParts';
import type { DiemCongTruRecord } from '../core/types';
import { getDiemCongTruLoaiLabel } from '../core/constants';

interface Props {
  item: DiemCongTruRecord;
}

const DiemCongTruPreviewContent: React.FC<Props> = ({ item }) => {
  const { t } = useTranslation();
  const nhanVien = [item.ma_nhan_vien, item.ten_nhan_vien].filter(Boolean).join(' - ') || '—';

  return (
    <KhungPhieu
      title={t('diemCongTru.preview.tieuDe')}
      soPhieu={`DCT-${item.id}`}
      ngay={formatYmdToDisplay(item.tg_tao?.slice(0, 10))}
    >
      <BangThongTin
        rows={[
          [t('diemCongTru.store.employeeCol'), nhanVien],
          [t('diemCongTru.store.periodCol'), `${item.nam}-${String(item.thang).padStart(2, '0')}`],
          [t('diemCongTru.store.loaiCol'), getDiemCongTruLoaiLabel(item.loai, t)],
          [t('diemCongTru.store.categoryCol'), item.ten_hang_muc || item.ma_hang_muc || '—'],
          [t('diemCongTru.store.diemCol'), String(item.diem)],
          [t('diemCongTru.detail.createdAt'), formatDateTimeShort(item.tg_tao)],
        ]}
      />
      {item.mo_ta?.trim() && (
        <p className="mt-2 mb-0 whitespace-pre-line break-words">
          <span className="font-semibold">{t('diemCongTru.store.moTaCol')}: </span>
          {item.mo_ta}
        </p>
      )}
      {item.quan_ly_trao_doi?.trim() && (
        <p className="mt-2 mb-0 whitespace-pre-line break-words">
          <span className="font-semibold">{t('diemCongTru.store.traoDoiCol')}: </span>
          {item.quan_ly_trao_doi}
        </p>
      )}

      <HangKyTen
        className="mt-6"
        labels={[
          { label: t('diemCongTru.preview.signNguoiLap') },
          { label: t('diemCongTru.preview.signNguoiLaoDong'), ten: item.ten_nhan_vien },
          { label: t('diemCongTru.preview.signQuanLy') },
        ]}
      />
    </KhungPhieu>
  );
};

export default DiemCongTruPreviewContent;
