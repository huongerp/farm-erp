import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import dayjs from "dayjs"
import utc from "dayjs/plugin/utc"
import timezone from "dayjs/plugin/timezone"
import { useUIStore } from "../store/useStore"
import i18n from "./i18n"

dayjs.extend(utc)
dayjs.extend(timezone)

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** Lấy timezone hiện tại từ store (fallback: Asia/Ho_Chi_Minh) */
export function getTimezone(): string {
  try {
    return useUIStore.getState().timezone || 'Asia/Ho_Chi_Minh'
  } catch {
    return 'Asia/Ho_Chi_Minh'
  }
}

/** Lấy locale hiện tại từ store (fallback: 'vi') - dùng cho Intl, localeCompare, toLocaleDateString */
export function getLocale(): string {
  try {
    return useUIStore.getState().language === 'en' ? 'en-US' : 'vi-VN'
  } catch {
    return 'vi-VN'
  }
}

/** Lấy language code ngắn ('vi' | 'en') từ store */
export function getLanguage(): string {
  try {
    return useUIStore.getState().language || 'vi'
  } catch {
    return 'vi'
  }
}

/** Tạo dayjs instance đã áp timezone từ cài đặt */
function toTz(value: string | Date | dayjs.Dayjs): dayjs.Dayjs {
  return dayjs(value).tz(getTimezone())
}

/** dayjs "bây giờ" theo timezone từ cài đặt */
export function nowTz(): dayjs.Dayjs {
  return dayjs().tz(getTimezone())
}

/** vi: dd/mm/yyyy, en: mm/dd/yyyy – chuỗi format dayjs theo ngôn ngữ hiện tại */
function getDisplayDateFormat(): string {
  return i18n.language?.startsWith('en') ? 'MM/DD/YYYY' : 'DD/MM/YYYY'
}
function getDisplayDateTimeFormat(): string {
  return i18n.language?.startsWith('en') ? 'MM/DD/YYYY HH:mm' : 'DD/MM/YYYY HH:mm'
}
function getDisplayDateTimeFormatShort(): string {
  return i18n.language?.startsWith('en') ? 'HH:mm - MM/DD/YYYY' : 'HH:mm - DD/MM/YYYY'
}
function getDisplayDateFormatShort(): string {
  return i18n.language?.startsWith('en') ? 'MM/DD' : 'DD/MM'
}
function getDisplayTimeDateShortFormat(): string {
  return i18n.language?.startsWith('en') ? 'HH:mm MM/DD' : 'HH:mm DD/MM'
}
function getDisplayDateShortTimeFormat(): string {
  return i18n.language?.startsWith('en') ? 'MM/DD HH:mm' : 'DD/MM HH:mm'
}

/** Định dạng ngày hiển thị (vi: DD/MM/YYYY, en: MM/DD/YYYY) – fallback cho code cũ */
export const DATE_DISPLAY_FORMAT = 'DD/MM/YYYY'
export const DATETIME_DISPLAY_FORMAT = 'DD/MM/YYYY HH:mm'
export const DATETIME_DISPLAY_FORMAT_SHORT = 'HH:mm - DD/MM/YYYY'

export function formatDate(value: string | Date | dayjs.Dayjs | null | undefined): string {
  if (value == null) return ''
  return toTz(value).format(getDisplayDateFormat())
}

export function formatDateTime(value: string | Date | dayjs.Dayjs | null | undefined): string {
  if (value == null) return ''
  return toTz(value).format(getDisplayDateTimeFormat())
}

export function formatDateTimeShort(value: string | Date | dayjs.Dayjs | null | undefined): string {
  if (value == null) return ''
  return toTz(value).format(getDisplayDateTimeFormatShort())
}

/** Chỉ giờ (HH:mm) */
export function formatTime(value: string | Date | dayjs.Dayjs | null | undefined): string {
  if (value == null) return ''
  return toTz(value).format('HH:mm')
}

/** Ngày tháng ngắn (vi: DD/MM, en: MM/DD) */
export function formatDateShort(value: string | Date | dayjs.Dayjs | null | undefined): string {
  if (value == null) return ''
  return toTz(value).format(getDisplayDateFormatShort())
}

/** Tháng/năm (MM/YYYY) – giữ chung cho cả hai locale */
export function formatMonthYear(value: string | Date | dayjs.Dayjs | null | undefined): string {
  if (value == null) return ''
  return toTz(value).format('MM/YYYY')
}

/** Tháng/năm 2 chữ số (MM/YY) */
export function formatMonthYearShort(value: string | Date | dayjs.Dayjs | null | undefined): string {
  if (value == null) return ''
  return toTz(value).format('MM/YY')
}

/** HH:mm + ngày tháng ngắn (vi: HH:mm DD/MM, en: HH:mm MM/DD) */
export function formatTimeDateShort(value: string | Date | dayjs.Dayjs | null | undefined): string {
  if (value == null) return ''
  return toTz(value).format(getDisplayTimeDateShortFormat())
}

/** Ngày tháng ngắn + HH:mm (vi: DD/MM HH:mm, en: MM/DD HH:mm) */
export function formatDateShortTime(value: string | Date | dayjs.Dayjs | null | undefined): string {
  if (value == null) return ''
  return toTz(value).format(getDisplayDateShortTimeFormat())
}

/** Ngày hôm nay dạng ISO (YYYY-MM-DD) theo timezone cài đặt */
export function getTodayISO(): string {
  return nowTz().format('YYYY-MM-DD')
}

/** Giá trị ngày cho input type="date" (YYYY-MM-DD) */
export function formatDateForInput(value: string | Date | dayjs.Dayjs | null | undefined): string {
  if (value == null) return ''
  return toTz(value).format('YYYY-MM-DD')
}

/** Phần ngày/tháng/năm cho dòng "Ngày DD tháng MM năm YYYY" (in ấn) */
export function getTodayParts(): { day: string; month: string; year: string } {
  const d = nowTz()
  return { day: d.format('DD'), month: d.format('MM'), year: d.format('YYYY') }
}

/** Ngày sau N ngày (vi: dd/mm/yyyy, en: mm/dd/yyyy) */
export function addDaysFormatted(days: number): string {
  return nowTz().add(days, 'day').format(getDisplayDateFormat())
}

/** Thâm niên từ ngày vào làm: "X năm Y tháng" / "X years Y months" */
export function getTenureText(startDate: string | Date | dayjs.Dayjs | null | undefined): string {
  if (startDate == null) return ''
  const now = nowTz()
  const start = toTz(startDate)
  const years = now.diff(start, 'year')
  const months = now.diff(start, 'month') % 12
  return `${years} ${i18n.t('tenure.year')} ${months} ${i18n.t('tenure.month')}`
}

/** Ngày hiện tại dạng YYYYMMDD theo timezone (dùng cho tên file export/backup) */
export function getTodayFileDate(): string {
  return nowTz().format('YYYYMMDD')
}

/** Ngày hiện tại dạng YYYY-MM-DD theo timezone (dùng cho tên file export) */
export function getTodayISODate(): string {
  return nowTz().format('YYYY-MM-DD')
}

/**
 * Trả về native Date object mà các phương thức .getFullYear(), .getMonth(), .getDate()
 * trả về giá trị theo timezone đã cài đặt (thay vì timezone trình duyệt).
 * Hữu ích khi cần tính toán date ranges theo timezone.
 */
export function getNowAsLocalDate(): Date {
  const d = nowTz()
  return new Date(d.year(), d.month(), d.date(), d.hour(), d.minute(), d.second())
}

// Định dạng số thành tiền tệ VND, sử dụng locale từ cài đặt
export function formatCurrency(value: number) {
  return new Intl.NumberFormat(getLocale(), {
    style: 'currency',
    currency: 'VND',
  }).format(value);
}

/** Định dạng số theo locale (phân tách hàng nghìn, phần thập phân tùy chọn). Dùng cho số lượng, đơn giá, thành tiền. */
export function formatNumberVN(value: number | null | undefined, options?: { maxFractionDigits?: number; minFractionDigits?: number }): string {
  if (value == null || Number.isNaN(value)) return '—';
  const { maxFractionDigits = 4, minFractionDigits = 0 } = options ?? {};
  return new Intl.NumberFormat('vi-VN', { minimumFractionDigits: minFractionDigits, maximumFractionDigits: maxFractionDigits }).format(value);
}

export function exportToExcel(data: any[], filename: string) {
  if (!data || !data.length) return;
  import('xlsx').then(XLSX => {
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Data');
    XLSX.writeFile(wb, `${filename}_${getTodayISODate()}.xlsx`);
  });
}

export function exportToPDF(data: any[], filename: string, title?: string) {
  if (!data || !data.length) return;
  Promise.all([
    import('jspdf'),
    import('jspdf-autotable')
  ]).then(([jspdfModule, autoTableModule]) => {
    const jsPDF = (jspdfModule as { default?: typeof import('jspdf') }).default;
    if (!jsPDF) return;
    const headers = Object.keys(data[0]);
    const doc = new jsPDF({ orientation: headers.length > 5 ? 'l' : 'p', unit: 'mm', format: 'a4' });
    if (title) { doc.setFontSize(12); doc.text(title, 14, 15); }
    const autoTable = autoTableModule.default;
    autoTable(doc, {
      head: [headers],
      body: data.map(row => headers.map(h => String(row[h] ?? ''))),
      startY: title ? 22 : 10,
      styles: { fontSize: 7, cellPadding: 2 },
      headStyles: { fillColor: [59, 130, 246] },
    });
    doc.save(`${filename}_${getTodayISODate()}.pdf`);
  }).catch(() => {});
}

export function exportToCSV(data: any[], filename: string) {
  if (!data || !data.length) return;

  // Lấy header từ key của object đầu tiên
  const headers = Object.keys(data[0]);
  
  // Tạo nội dung CSV với BOM để hỗ trợ tiếng Việt trong Excel
  const csvContent = [
    headers.join(','),
    ...data.map(row => headers.map(fieldName => {
      let cell = row[fieldName];
      // Xử lý null/undefined
      if (cell === null || cell === undefined) cell = '';
      // Convert sang string và escape dấu ngoặc kép
      cell = cell.toString().replace(/"/g, '""');
      // Bọc trong ngoặc kép nếu có ký tự đặc biệt
      if (cell.search(/("|,|\n)/g) >= 0) cell = `"${cell}"`;
      return cell;
    }).join(','))
  ].join('\n');

  const blob = new Blob(["\uFEFF" + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", `${filename}_${getTodayISODate()}.csv`);
  document.body.appendChild(link);
  
  link.click();
  document.body.removeChild(link);
}
