/**
 * Nội dung xem/in hồ sơ nhân viên — khung chuẩn hệ thống (PhieuInParts). Dữ liệu từ
 * buildEmployeeProfileSections; dòng trống ("—") và mục không có dữ liệu bị lược khỏi bản in
 * cho gọn, cuối phiếu có ô ký người khai / xác nhận.
 */
import React from 'react';
import { useTranslation } from 'react-i18next';
import { HangKyTen, KhungPhieu, TD_IN, TH_IN } from '../../../../components/shared/phieu-in/PhieuInParts';
import { buildEmployeeProfileSections } from '../utils/print-employee-pdf';
import type { Employee } from '../core/types';

interface Props {
  employee: Employee;
}

const coGiaTri = (v: unknown) => v != null && String(v).trim() !== '' && String(v).trim() !== '—';

const EmployeeProfilePreviewContent: React.FC<Props> = ({ employee }) => {
  const { t } = useTranslation();
  const sections = buildEmployeeProfileSections(employee)
    .map((s) => ({ ...s, rows: s.rows.filter((r) => coGiaTri(r.value)) }))
    .filter((s) => s.rows.length > 0);

  return (
    <KhungPhieu title={t('employee.pdf.title')} soPhieu={employee.ma_nhan_vien}>
      <p className="text-center font-bold text-[1.1em] mt-0 mb-1">{employee.ho_ten}</p>

      {sections.map((section) => (
        <table key={section.title} className="w-full border-collapse mt-3 break-inside-avoid">
          <thead>
            <tr>
              <th colSpan={2} className={`${TH_IN} px-2 py-1 text-left uppercase text-[0.9em]`}>
                {section.title}
              </th>
            </tr>
          </thead>
          <tbody>
            {section.rows.map((row) => (
              <tr key={row.label}>
                <td className={`${TD_IN} bg-gray-50 px-2 py-1 font-semibold w-[35%]`}>{row.label}</td>
                <td className={`${TD_IN} px-2 py-1 break-words`}>{row.value}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ))}

      <HangKyTen
        className="mt-6"
        labels={[{ label: t('employee.pdf.nguoiKhai'), ten: employee.ho_ten }, t('employee.pdf.xacNhan')]}
      />
    </KhungPhieu>
  );
};

export default EmployeeProfilePreviewContent;
