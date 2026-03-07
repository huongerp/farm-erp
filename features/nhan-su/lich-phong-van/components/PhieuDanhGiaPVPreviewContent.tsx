/**
 * Nội dung in phiếu đánh giá phỏng vấn A4 – theo chuẩn danh_gia_chi_tiet (5 phần).
 * Dùng cho trang preview /phieu-danh-gia-pv/:id và in.
 */
import React from 'react';
import { useTranslation } from 'react-i18next';
import { formatDateTime } from '../../../../lib/utils';
import { getTrangThaiLichPVLabel, getHinhThucLabel } from '../core/constants';
import {
  parseDanhGiaChiTiet,
  XEP_HANG_OPTIONS,
  DE_XUAT_OPTIONS,
} from '../core/danh-gia-types';
import type { LichPhongVan } from '../core/types';

interface Props {
  record: LichPhongVan;
}

const PhieuDanhGiaPVPreviewContent: React.FC<Props> = ({ record }) => {
  const { t } = useTranslation();
  const printedAt = formatDateTime(new Date());
  const chiTiet = parseDanhGiaChiTiet(record.danh_gia_chi_tiet);
  const hasChiTiet = chiTiet != null;

  const renderTable = (rows: [string, string][]) => (
    <table className="w-full border-collapse text-[10pt] mb-4">
      <tbody>
        {rows.map(([label, value]) => (
          <tr key={label}>
            <td className="w-[38%] border border-gray-300 p-1.5 font-semibold text-gray-600 bg-gray-50/50 align-top">
              {label}
            </td>
            <td className="border border-gray-300 p-1.5 text-gray-900 align-top">
              {value || '—'}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );

  const sectionHeader = (title: string) => (
    <h2 className="text-[11pt] font-bold text-gray-800 mt-4 mb-2 border-b border-gray-300 pb-0.5">
      {title}
    </h2>
  );

  const getXepHangLabel = (value: string | null | undefined) => {
    if (!value) return '—';
    const opt = XEP_HANG_OPTIONS.find((o) => o.value === value);
    return opt ? t(opt.labelKey) : value;
  };
  const getDeXuatLabel = (value: string | null | undefined) => {
    if (!value) return '—';
    const opt = DE_XUAT_OPTIONS.find((o) => o.value === value);
    return opt ? t(opt.labelKey) : value;
  };

  return (
    <div className="phieu-danh-gia-pv-preview-content bg-white text-gray-900 font-sans text-[10pt] p-5 min-h-full">
      <h1 className="text-[14pt] font-bold mb-1">
        {t('lichPhongVan.export.phieuTitle')}
      </h1>
      <p className="text-[10pt] text-gray-600 mb-4">
        {record.ten_ung_vien ?? record.id_ung_vien} · {t('lichPhongVan.detail.lichColVong')} {record.so_vong}
      </p>

      {/* Thông tin lịch */}
      {sectionHeader(t('lichPhongVan.danhGia.sectionBasic'))}
      {renderTable([
        [t('lichPhongVan.store.ungVienCol'), record.ten_ung_vien ?? '—'],
        [t('lichPhongVan.detail.viTriUngTuyen'), record.ma_de_xuat ?? '—'],
        [t('lichPhongVan.store.soVongCol'), String(record.so_vong)],
        [t('lichPhongVan.detail.ngayGio'), `${record.ngay} – ${record.gio}`],
        [t('lichPhongVan.store.hinhThucCol'), getHinhThucLabel(record.hinh_thuc, t)],
        [t('lichPhongVan.store.diaDiemCol'), record.dia_diem ?? '—'],
        [t('lichPhongVan.store.trangThaiCol'), getTrangThaiLichPVLabel(record.trang_thai, t)],
        ...(hasChiTiet && chiTiet.nguoi_phong_van
          ? [[t('lichPhongVan.danhGia.nguoiPhongVan'), chiTiet.nguoi_phong_van] as [string, string]]
          : []),
      ])}

      {hasChiTiet && (
        <>
          {sectionHeader(t('lichPhongVan.danhGia.sectionHard'))}
          {renderTable([
            [t('lichPhongVan.danhGia.hardNghiepVu'), chiTiet.hard_nghiep_vu != null ? String(chiTiet.hard_nghiep_vu) : '—'],
            [t('lichPhongVan.danhGia.hardKinhNghiem'), chiTiet.hard_kinh_nghiem != null ? String(chiTiet.hard_kinh_nghiem) : '—'],
            [t('lichPhongVan.danhGia.hardKyThuat'), chiTiet.hard_ky_thuat != null ? String(chiTiet.hard_ky_thuat) : '—'],
          ])}

          {sectionHeader(t('lichPhongVan.danhGia.sectionSoft'))}
          {renderTable([
            [t('lichPhongVan.danhGia.softGiaoTiep'), chiTiet.soft_giao_tiep != null ? String(chiTiet.soft_giao_tiep) : '—'],
            [t('lichPhongVan.danhGia.softTuDuy'), chiTiet.soft_tu_duy != null ? String(chiTiet.soft_tu_duy) : '—'],
            [t('lichPhongVan.danhGia.softVanHoa'), chiTiet.soft_van_hoa != null ? String(chiTiet.soft_van_hoa) : '—'],
            [t('lichPhongVan.danhGia.softTacPhong'), chiTiet.soft_tac_phong != null ? String(chiTiet.soft_tac_phong) : '—'],
          ])}

          {sectionHeader(t('lichPhongVan.danhGia.sectionNhanXet'))}
          {renderTable([
            [t('lichPhongVan.danhGia.diemManh'), chiTiet.diem_manh ?? '—'],
            [t('lichPhongVan.danhGia.diemYeu'), chiTiet.diem_yeu ?? '—'],
            [t('lichPhongVan.danhGia.kyVongLuong'), chiTiet.ky_vong_luong ?? '—'],
          ])}

          {sectionHeader(t('lichPhongVan.danhGia.sectionKetLuan'))}
          {renderTable([
            [t('lichPhongVan.danhGia.xepHangChung'), getXepHangLabel(chiTiet.xep_hang_chung ?? undefined)],
            [t('lichPhongVan.danhGia.deXuatLabel'), getDeXuatLabel(chiTiet.de_xuat ?? undefined)],
            [t('lichPhongVan.danhGia.ghiChu'), chiTiet.ghi_chu ?? '—'],
          ])}
        </>
      )}

      {/* Fallback: không có danh_gia_chi_tiet thì hiển thị điểm số, nhận xét cũ */}
      {!hasChiTiet && (
        <>
          {sectionHeader(t('lichPhongVan.form.danhGiaDiemSo'))}
          {renderTable([
            [t('lichPhongVan.form.danhGiaDiemSo'), record.danh_gia_diem_so ?? '—'],
            [t('lichPhongVan.form.danhGiaNhanXet'), record.danh_gia_nhan_xet ?? '—'],
          ])}
        </>
      )}

      {/* Kết quả (mức lịch) – luôn hiển thị */}
      {sectionHeader(t('lichPhongVan.store.ketQuaCol'))}
      {renderTable([
        [t('lichPhongVan.store.ketQuaCol'), record.ket_qua ?? '—'],
        ...(record.ghi_chu && record.ghi_chu.trim() !== '' && !hasChiTiet
          ? [[t('lichPhongVan.form.ghiChu'), record.ghi_chu] as [string, string]]
          : []),
      ])}
      {hasChiTiet && record.ghi_chu && record.ghi_chu.trim() !== '' && (
        <>
          {sectionHeader(t('lichPhongVan.form.ghiChu'))}
          <p className="text-[10pt] text-gray-900 whitespace-pre-wrap border border-gray-300 p-2 rounded bg-gray-50/30">
            {record.ghi_chu}
          </p>
        </>
      )}

      <p className="text-[7pt] text-gray-500 mt-5">
        {t('lichPhongVan.export.printedAt')}: {printedAt}
      </p>
    </div>
  );
};

export default PhieuDanhGiaPVPreviewContent;
