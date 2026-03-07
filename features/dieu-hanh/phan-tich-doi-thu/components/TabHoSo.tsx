import React from 'react';
import { useTranslation } from 'react-i18next';
import { Building2 } from 'lucide-react';
import type { DoiThu } from '../core/types';
import DetailSection from '../../../../components/shared/DetailSection';
import DetailField from '../../../../components/shared/DetailField';
import DetailFieldGrid from '../../../../components/shared/DetailFieldGrid';
import { LOAI_DOI_THU_LABELS, QUY_MO_LABELS, PHAN_KHUC_LABELS } from '../core/constants';
import type { LoaiDoiThu } from '../core/constants';

interface Props {
  data: DoiThu;
}

const TabHoSo: React.FC<Props> = ({ data }) => {
  const { t } = useTranslation();

  return (
    <div className="space-y-6">
      <DetailSection title={t('phanTichDoiThu.detail.hoSo')} icon={<Building2 size={14} />} variant="primary">
        <DetailFieldGrid cols={2}>
          <DetailField label={t('phanTichDoiThu.form.tenDoiThu')} value={data.ten_doi_thu} />
          <DetailField
            label={t('phanTichDoiThu.form.phanLoai')}
            value={LOAI_DOI_THU_LABELS[data.phan_loai as LoaiDoiThu] ?? data.phan_loai}
          />
          <DetailField label={t('phanTichDoiThu.form.tenCongTy')} value={data.ten_cong_ty ?? '—'} />
          <DetailField label={t('phanTichDoiThu.form.mst')} value={data.mst ?? '—'} />
          <DetailField label={t('phanTichDoiThu.form.diaChi')} value={data.dia_chi ?? '—'} className="col-span-2" />
          <DetailField label={t('phanTichDoiThu.form.website')} value={data.website ?? '—'} />
          <DetailField label={t('phanTichDoiThu.form.fanpage')} value={data.fanpage ?? '—'} />
          <DetailField label={t('phanTichDoiThu.form.hotline')} value={data.hotline ?? '—'} />
          <DetailField label={t('phanTichDoiThu.form.youtube')} value={data.youtube ?? '—'} />
          <DetailField label={t('phanTichDoiThu.form.facebook')} value={data.facebook ?? '—'} />
          <DetailField label={t('phanTichDoiThu.form.tiktok')} value={data.tiktok ?? '—'} />
          <DetailField
            label={t('phanTichDoiThu.form.linkKhac')}
            value={data.link_khac ?? '—'}
            className="col-span-2"
          />
          <DetailField
            label={t('phanTichDoiThu.form.ghiChuNhanDang')}
            value={data.ghi_chu_nhan_dang ?? '—'}
            className="col-span-2"
          />
        </DetailFieldGrid>
      </DetailSection>

      <DetailSection title={t('phanTichDoiThu.form.thongTinMoRong')} icon={<Building2 size={14} />}>
        <DetailFieldGrid cols={2}>
          <DetailField
            label={t('phanTichDoiThu.form.quyMo')}
            value={data.quy_mo ? (QUY_MO_LABELS[data.quy_mo as keyof typeof QUY_MO_LABELS] ?? data.quy_mo) : '—'}
          />
          <DetailField label={t('phanTichDoiThu.form.namThanhLap')} value={data.nam_thanh_lap != null ? String(data.nam_thanh_lap) : '—'} />
          <DetailField label={t('phanTichDoiThu.form.thiPhan')} value={data.thi_phan ?? '—'} />
          <DetailField label={t('phanTichDoiThu.form.nguonGoc')} value={data.nguon_goc ?? '—'} />
          <DetailField label={t('phanTichDoiThu.form.namHoatDong')} value={data.nam_hoat_dong ?? '—'} />
          <DetailField
            label={t('phanTichDoiThu.form.phanKhuc')}
            value={data.phan_khuc ? (PHAN_KHUC_LABELS[data.phan_khuc as keyof typeof PHAN_KHUC_LABELS] ?? data.phan_khuc) : '—'}
          />
          <DetailField label={t('phanTichDoiThu.form.dinhVi')} value={data.dinh_vi ?? '—'} className="col-span-2" />
          <DetailField label={t('phanTichDoiThu.form.linhVucKinhDoanh')} value={data.linh_vuc_kinh_doanh ?? '—'} />
          <DetailField label={t('phanTichDoiThu.form.thiTruongMucTieu')} value={data.thi_truong_muc_tieu ?? '—'} />
          <DetailField label={t('phanTichDoiThu.form.soNhanVien')} value={data.so_nhan_vien ?? '—'} />
          <DetailField label={t('phanTichDoiThu.form.vonDieuLe')} value={data.von_dieu_le ?? '—'} />
          <DetailField label={t('phanTichDoiThu.form.sanPham')} value={data.san_pham ?? '—'} className="col-span-2" />
          <DetailField label={t('phanTichDoiThu.form.cachThucHoatDong')} value={data.cach_thuc_hoat_dong ?? '—'} className="col-span-2" />
          <DetailField label={t('phanTichDoiThu.form.kenhPhanPhoi')} value={data.kenh_phan_phoi ?? '—'} className="col-span-2" />
          <DetailField label={t('phanTichDoiThu.form.chienLuocGia')} value={data.chien_luoc_gia ?? '—'} className="col-span-2" />
          <DetailField label={t('phanTichDoiThu.form.marketingTruyenThong')} value={data.marketing_truyen_thong ?? '—'} className="col-span-2" />
          <DetailField label={t('phanTichDoiThu.form.theManh')} value={data.the_manh ?? '—'} className="col-span-2" />
          <DetailField label={t('phanTichDoiThu.form.ghiChuKhac')} value={data.ghi_chu_khac ?? '—'} className="col-span-2" />
        </DetailFieldGrid>
      </DetailSection>
    </div>
  );
};

export default TabHoSo;
