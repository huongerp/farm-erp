/**
 * Helper thuần cho luồng import Excel: chuẩn hóa mã/tên và parse số theo kiểu Việt Nam.
 * Không phụ thuộc React / db → test trực tiếp.
 */

/** Chuẩn hóa mã: bỏ khoảng trắng thừa, viết hoa (khớp createFarmHangHoa / createFarmDanhMuc). */
export function normalizeCode(raw: unknown): string {
  return String(raw ?? '').trim().toUpperCase();
}

/** Chuẩn hóa text thường: chỉ trim, gộp khoảng trắng giữa các từ. */
export function normalizeText(raw: unknown): string {
  return String(raw ?? '').replace(/\s+/g, ' ').trim();
}

/** Khóa so khớp không phân biệt hoa thường / dấu cách thừa. */
export function matchKey(raw: unknown): string {
  return normalizeText(raw).toLowerCase();
}

export type ParsedNumber = { ok: true; value: number | null } | { ok: false };

/**
 * Parse số kiểu Việt Nam từ ô Excel: `50.000` → 50000, `1.234,5` → 1234.5, `50,000` → 50000, `1,5` → 1.5.
 * Ô trống → `null`. Không parse được → `{ ok: false }` để service báo lỗi dòng,
 * KHÔNG âm thầm gán 0 (dữ liệu tiền sai còn tệ hơn báo lỗi).
 */
export function parseImportNumber(raw: unknown): ParsedNumber {
  if (raw === null || raw === undefined) return { ok: true, value: null };
  if (typeof raw === 'number') {
    return Number.isFinite(raw) && raw >= 0 ? { ok: true, value: raw } : { ok: false };
  }
  const s = String(raw).replace(/\s/g, '');
  if (s === '') return { ok: true, value: null };

  let normalized: string;
  if (/^\d{1,3}(\.\d{3})+(,\d+)?$/.test(s)) {
    // 1.234.567,89 — nghìn bằng dấu chấm (chuẩn VN)
    normalized = s.replace(/\./g, '').replace(',', '.');
  } else if (/^\d{1,3}(,\d{3})+(\.\d+)?$/.test(s)) {
    // 1,234,567.89 — nghìn bằng dấu phẩy (chuẩn Anh Mỹ)
    normalized = s.replace(/,/g, '');
  } else if (/^\d+(,\d+)?$/.test(s)) {
    // 1,5 — thập phân bằng dấu phẩy
    normalized = s.replace(',', '.');
  } else if (/^\d+(\.\d+)?$/.test(s)) {
    normalized = s;
  } else {
    return { ok: false };
  }

  const n = Number(normalized);
  if (!Number.isFinite(n) || n < 0) return { ok: false };
  return { ok: true, value: n };
}

/** Parse số nguyên dương (thứ tự danh mục). */
export function parseImportInt(raw: unknown): ParsedNumber {
  const parsed = parseImportNumber(raw);
  if (!parsed.ok) return parsed;
  if (parsed.value === null) return parsed;
  if (!Number.isInteger(parsed.value)) return { ok: false };
  return parsed;
}

/** Mã hợp lệ theo đúng schema form (`^[A-Z0-9_-]+$`) — import không được tạo bản ghi mà form từ chối sửa. */
export const CODE_PATTERN = /^[A-Z0-9_-]+$/;

/** Cột hệ thống mà file import phải khớp vào. */
export interface ImportColumnLike {
  key: string;
  label: string;
}

/** Bỏ dấu + hạ chữ thường để so khớp tên cột bất kể cách gõ. */
export function normalizeHeader(value: string): string {
  return value
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Map cột hệ thống → cột file: khớp CHÍNH XÁC trước, hết mới tới khớp gần đúng.
 * Một cột file chỉ được gán cho đúng một cột hệ thống — nếu không, "Mã hàng" và
 * "Tên hàng" dễ cùng ăn vào một cột và dữ liệu vào nhầm chỗ.
 */
export function buildAutoMapping(columns: ImportColumnLike[], headers: string[]): Record<string, string> {
  const result: Record<string, string> = {};
  const used = new Set<string>();
  const normHeaders = headers.map((h) => ({ raw: h, norm: normalizeHeader(h) }));

  columns.forEach((col) => {
    const target = normalizeHeader(col.label);
    const hit = normHeaders.find((h) => !used.has(h.raw) && h.norm === target);
    if (hit) {
      result[col.key] = hit.raw;
      used.add(hit.raw);
    }
  });

  columns.forEach((col) => {
    if (result[col.key]) return;
    const target = normalizeHeader(col.label);
    if (!target) return;
    const hit = normHeaders.find(
      (h) => !used.has(h.raw) && h.norm !== '' && (h.norm.includes(target) || target.includes(h.norm))
    );
    if (hit) {
      result[col.key] = hit.raw;
      used.add(hit.raw);
    }
  });

  return result;
}
