/**
 * Xuất hồ sơ nhân viên ra Doc, Excel (có header công ty như bảng lương).
 * PDF dùng print-employee-pdf.ts (đã có header).
 */
import type { Employee } from '../core/types';
import { getTodayISODate } from '../../../../lib/utils';
import i18n from '../../../../lib/i18n';
import { useUIStore } from '../../../../store/useStore';
import { buildEmployeeProfileSections } from './print-employee-pdf';

function safeFileName(name: string): string {
  return name.replace(/\s+/g, '_').replace(/[<>:"/\\|?*]/g, '');
}

/** Xuất hồ sơ ra Excel (có header công ty + các section) */
export async function exportEmployeeProfileExcel(emp: Employee): Promise<void> {
  const XLSX = await import('xlsx');
  const info = useUIStore.getState().companyInfo;
  const sections = buildEmployeeProfileSections(emp);

  const rows: (string | number)[][] = [
    [info.companyName],
    ...(info.address ? [[i18n.t('company.address'), info.address]] : []),
    ...(info.email ? [[i18n.t('company.email'), info.email]] : []),
    ...(info.phone ? [[i18n.t('company.phone'), info.phone]] : []),
    [],
    [i18n.t('employee.pdf.title')],
    [i18n.t('employee.pdf.code'), emp.ma_nhan_vien],
    [i18n.t('employee.detail.fullName'), emp.ho_ten],
    [],
  ];

  for (const section of sections) {
    rows.push([section.title]);
    for (const row of section.rows) {
      rows.push([row.label, row.value]);
    }
    rows.push([]);
  }

  const ws = XLSX.utils.aoa_to_sheet(rows);
  ws['!cols'] = [{ wch: 32 }, { wch: 40 }];
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Ho so');
  XLSX.writeFile(wb, `Ho_so_${safeFileName(emp.ho_ten)}_${emp.ma_nhan_vien}_${getTodayISODate()}.xlsx`);
}
