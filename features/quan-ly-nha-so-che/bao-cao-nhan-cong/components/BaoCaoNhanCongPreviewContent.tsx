/**
 * Nội dung in báo cáo nhân công — khung chuẩn hệ thống (PhieuInParts): tổng quan + bảng chuyền
 * và/hoặc danh sách tên (theo `noiDung`) + ô ký.
 * Bảng nhiều cột → mặc định A4 ngang để chữ trong bảng đủ cỡ đọc được.
 */
import React from 'react';
import { useTranslation } from 'react-i18next';
import type { FarmBaoCaoNhanCong } from '../core/types';
import { getBcncPreviewSignLabels } from '../core/bcnc-preview-layout';
import type { NoiDungIn } from '../core/preview-url';
import { formatYmdToDisplay } from '../../../../lib/utils';
import { HangKyTen, KhungPhieu } from '../../../../components/shared/phieu-in/PhieuInParts';
import BaoCaoNhanCongPreviewOverview from './BaoCaoNhanCongPreviewOverview';
import BaoCaoNhanCongPreviewTable from './BaoCaoNhanCongPreviewTable';
import BaoCaoNhanCongNhanVienBang from './BaoCaoNhanCongNhanVienBang';

interface Props {
  data: FarmBaoCaoNhanCong;
  noiDung: NoiDungIn;
}

const BaoCaoNhanCongPreviewContent: React.FC<Props> = ({ data, noiDung }) => {
  const { t } = useTranslation();
  const inChuyen = noiDung !== 'nhan-vien';
  const inNv = noiDung !== 'chuyen' && (data.chi_tiet ?? []).some((ct) => (ct.nhan_vien?.length ?? 0) > 0);

  return (
    <KhungPhieu
      title={t(noiDung === 'nhan-vien' ? 'baoCaoNhanCong.preview.tieuDeDanhSachNv' : 'baoCaoNhanCong.preview.tieuDePhieu')} ngay={formatYmdToDisplay(data.ngay?.slice(0, 10))}>
      <BaoCaoNhanCongPreviewOverview data={data} />

      {inChuyen && (
        <>
          <h2 className="text-[9pt] font-bold uppercase mb-1.5 text-gray-900">{t('baoCaoNhanCong.form.sectionChuyen')}</h2>
          <BaoCaoNhanCongPreviewTable data={data} />
        </>
      )}

      {inNv && (
        <>
          <h2 className={`text-[9pt] font-bold uppercase ${inChuyen ? 'mt-3' : ''} mb-1.5 text-gray-900`}>{t('baoCaoNhanCong.nv.sectionDetail')}</h2>
          <BaoCaoNhanCongNhanVienBang data={data} variant="print" />
        </>
      )}

      <HangKyTen
        className="mt-4"
        labels={getBcncPreviewSignLabels(t).map((label, i) => (i === 0 ? { label, ten: data.ten_nguoi_tao } : label))}
      />
    </KhungPhieu>
  );
};

export default BaoCaoNhanCongPreviewContent;
