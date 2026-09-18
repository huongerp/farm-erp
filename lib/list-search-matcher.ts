/**
 * Ô "Tìm kiếm" trên list view — tìm trên **mọi cột của bảng**.
 *
 * Trước đây mỗi module tự liệt kê tay vài cột trong `filterFn`
 * (`item.ten_chi_nhanh.toLowerCase().includes(q) || ...`). Hệ quả: gõ đúng chữ
 * đang hiện trên bảng (ghi chú, tên người duyệt, trạng thái) mà không ra kết quả,
 * và thêm cột mới thì phải nhớ sửa hai chỗ — không có gì trong `tsc` bắt được.
 *
 * Quy tắc từ nay:
 * 1. Mọi cột trong `DEFAULT_COLUMNS` đều tìm được, **kể cả cột đang ẩn**.
 * 2. So khớp cả text ĐANG HIỂN THỊ (`getCellText`: nhãn tiếng Việt của enum,
 *    ngày `15/03/2024`, tiền `1.250.000`) lẫn giá trị THÔ (`2024-03-15`, `1250000`).
 * 3. Bỏ dấu tiếng Việt hai chiều: gõ "nguyen van an" ra "Nguyễn Văn An".
 * 4. Nhiều từ khoá: mọi từ phải xuất hiện, không cần cùng một cột.
 *
 * Nhánh server (module phân trang ở DB) dùng `lib/postgrest-search.ts`.
 */
import { foldVi } from './search-text';
import { formatDate, formatDateTime, getLocale } from './utils';

/** Cột điều khiển, không mang dữ liệu để tìm. */
const NON_DATA_COLUMN_IDS = new Set(['actions', 'select', 'selection', 'expander', 'stt']);

/** Khoá nhạy cảm: không bao giờ đưa vào chuỗi tìm kiếm. */
const NEVER_SEARCH_KEY = /mat_khau|password|token|secret|hash/i;

/** Nhận diện chuỗi ISO date / datetime (`2024-03-15`, `2024-03-15T03:00:00.000Z`). */
const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}(?:[T ]\d{2}:\d{2})?/;

/**
 * Các biến thể chuỗi của một giá trị ngày — người dùng tìm bằng đúng thứ đang
 * thấy trên bảng (`15/03/2024`) lẫn giá trị thô (`2024-03-15`).
 */
function dateVariants(value: string | Date): string[] {
  const iso = value instanceof Date ? value.toISOString() : value;
  const out = [iso];
  const day = formatDate(iso);
  if (day) out.push(day);
  const full = formatDateTime(iso);
  if (full && full !== day) out.push(full);
  return out;
}

/**
 * Chuẩn hoá một giá trị thành các chuỗi để so khớp: giá trị thô + dạng đang hiển
 * thị. object/array bỏ qua (chúng được `getCellText` lo).
 */
function valueToSearchStrings(value: unknown): string[] {
  if (value == null) return [];
  if (typeof value === 'string') {
    return ISO_DATE_RE.test(value) ? dateVariants(value) : [value];
  }
  if (typeof value === 'number') {
    if (!Number.isFinite(value)) return [];
    const raw = String(value);
    const grouped = value.toLocaleString(getLocale());
    return grouped === raw ? [raw] : [raw, grouped];
  }
  if (typeof value === 'boolean') return [String(value)];
  if (value instanceof Date) return dateVariants(value);
  if (typeof value === 'object') return [];
  return [String(value)];
}

/**
 * Nhãn hiển thị tương đương của các giá trị trạng thái dùng chung toàn app.
 *
 * Bảng lưu `Đang dùng` (lib/constants.ts) nhưng badge trên màn hình ghi
 * `Hoạt động`; người dùng gõ đúng chữ đang thấy thì phải ra kết quả. Ánh xạ này
 * áp cho MỌI module, nên không phải khai `getCellText` riêng chỉ vì cột trạng thái.
 *
 * Chỉ khớp giá trị NGUYÊN VẸN (sau khi bỏ dấu), không khớp một phần, để không
 * kéo nhầm những chuỗi tình cờ chứa các từ này.
 */
const STATUS_SYNONYMS: Record<string, string[]> = {
  'dang dung': ['dang hoat dong', 'hoat dong', 'active'],
  'dang hoat dong': ['dang dung', 'hoat dong', 'active'],
  'hoat dong': ['dang dung', 'dang hoat dong', 'active'],
  ngung: ['ngung hoat dong', 'khong hoat dong', 'inactive'],
  'ngung hoat dong': ['ngung', 'khong hoat dong', 'inactive'],
  'dang lam viec': ['dang lam', 'active'],
  'nghi viec': ['da nghi', 'inactive'],
};

export interface ListSearchConfig<T> {
  /** `DEFAULT_COLUMNS` của store — tất cả cột đều tìm được, kể cả cột đang ẩn. */
  columns: readonly { id: string }[];
  /**
   * Text đang hiển thị trong ô — nên dùng chung hàm mà bảng dùng để render/xuất
   * file. Đây là thứ làm "tìm được đúng cái đang thấy". Bỏ trống cũng chạy, khi
   * đó chỉ so trên giá trị thô của bản ghi.
   */
  getCellText?: (colId: string, item: T) => string;
  /** Trường phụ hiển thị trong ô nhưng không có cột riêng (mã dưới tên…). */
  extraKeys?: readonly string[];
}

/**
 * Matcher chuẩn cho ô tìm kiếm của list view.
 *
 * Chuỗi tìm kiếm của một hàng KHÔNG phụ thuộc từ khoá nên được cache theo object
 * hàng (`WeakMap`): gõ thêm ký tự chỉ còn một phép `includes` mỗi hàng, không
 * format lại ngày/số. React Query thay object mới mỗi lần refetch nên cache tự
 * mất hiệu lực — đừng mutate hàng tại chỗ.
 */
export function createListSearchMatcher<T extends object = object>(
  config: ListSearchConfig<T>
): (item: T, searchTerm: string) => boolean {
  const columnIds = config.columns
    .map((c) => c.id)
    .filter((id) => !NON_DATA_COLUMN_IDS.has(id) && !NEVER_SEARCH_KEY.test(id));
  const extraKeys = (config.extraKeys ?? []).filter((k) => !NEVER_SEARCH_KEY.test(k));
  const cache = new WeakMap<T, string>();

  const haystackOf = (item: T): string => {
    const cached = cache.get(item);
    if (cached != null) return cached;

    const record = item as unknown as Record<string, unknown>;
    const parts: string[] = [];
    for (const id of columnIds) {
      const cell = config.getCellText?.(id, item);
      if (cell) parts.push(cell);
      for (const s of valueToSearchStrings(record[id])) parts.push(s);
    }
    for (const key of extraKeys) {
      for (const s of valueToSearchStrings(record[key])) parts.push(s);
    }
    // Nhãn tương đương của trạng thái (xem STATUS_SYNONYMS).
    for (const part of parts.slice()) {
      const extra = STATUS_SYNONYMS[foldVi(part)];
      if (extra) parts.push(...extra);
    }

    const text = foldVi(parts.join(' '));
    cache.set(item, text);
    return text;
  };

  return (item, searchTerm) => {
    const term = foldVi(searchTerm);
    if (!term) return true;
    const hay = haystackOf(item);
    return term.split(/\s+/).every((word) => hay.includes(word));
  };
}
