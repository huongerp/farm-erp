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

/** Ô ngày Excel: chuỗi dd/mm/yyyy, yyyy-mm-dd, hoặc serial number của Excel. */
export function parseImportDate(raw: unknown): string | null {
  if (raw === null || raw === undefined) return null;

  if (raw instanceof Date && !Number.isNaN(raw.getTime())) {
    return toIso(raw.getFullYear(), raw.getMonth() + 1, raw.getDate());
  }

  if (typeof raw === 'number' && Number.isFinite(raw)) {
    // Excel serial: ngày 1 = 1900-01-01, trừ lỗi năm nhuận 1900 của Excel.
    const ms = Math.round((raw - 25569) * 86400 * 1000);
    const d = new Date(ms);
    if (Number.isNaN(d.getTime())) return null;
    return toIso(d.getUTCFullYear(), d.getUTCMonth() + 1, d.getUTCDate());
  }

  const s = String(raw).trim();
  if (s === '') return null;

  const iso = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (iso) return toIso(Number(iso[1]), Number(iso[2]), Number(iso[3]));

  const vn = s.match(/^(\d{1,2})[/\-.](\d{1,2})[/\-.](\d{2,4})$/);
  if (vn) {
    const day = Number(vn[1]);
    const month = Number(vn[2]);
    let year = Number(vn[3]);
    if (year < 100) year += 2000;
    return toIso(year, month, day);
  }

  return null;
}

/** Từ chối ngày không tồn tại (31/02, 30/02…) — để lọt xuống DB thì cả lô bị từ chối với lỗi khó hiểu. */
function toIso(year: number, month: number, day: number): string | null {
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;
  const d = new Date(Date.UTC(year, month - 1, day));
  if (d.getUTCFullYear() !== year || d.getUTCMonth() !== month - 1 || d.getUTCDate() !== day) return null;
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
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

/**
 * Tra danh mục theo mã trước rồi theo tên (bỏ dấu cách thừa, không phân biệt hoa thường).
 * Trả `undefined` = không tìm thấy, `null` = nhiều bản ghi cùng tên (không đoán — bắt ghi mã).
 */
export function buildRefLookup<T>(
  list: T[],
  ma: (x: T) => string | null | undefined,
  ten: (x: T) => string | null | undefined
): (input: unknown) => T | null | undefined {
  const byMa = new Map<string, T>();
  const byTen = new Map<string, T | null>();
  list.forEach((x) => {
    const m = normalizeCode(ma(x));
    if (m && !byMa.has(m)) byMa.set(m, x);
    const n = matchKey(ten(x));
    if (n) byTen.set(n, byTen.has(n) ? null : x);
  });
  return (input) => {
    const m = normalizeCode(input);
    if (!m) return undefined;
    return byMa.get(m) ?? byTen.get(matchKey(input));
  };
}

/**
 * Khớp ô Excel với một tập giá trị cố định: nhận cả giá trị lưu DB lẫn nhãn hiển thị,
 * bỏ dấu + hoa thường ("dang thuc hien" = "Đang thực hiện" = "dang_thuc_hien").
 */
export function pickImportOption<T extends string>(
  raw: unknown,
  options: { value: T; labels?: string[] }[]
): T | null {
  const n = normalizeHeader(String(raw ?? '')).replace(/_/g, ' ');
  if (!n) return null;
  const hit = options.find((o) =>
    [o.value, ...(o.labels ?? [])].some((v) => normalizeHeader(v).replace(/_/g, ' ') === n)
  );
  return hit?.value ?? null;
}

/** Lỗi zod → thông điệp, bỏ các trường đã báo lỗi riêng (tránh báo hai lần cùng một ô). */
export function schemaIssueMessages(
  issues: { path: PropertyKey[]; message: string }[],
  alreadyReported: Set<string>
): string[] {
  const out: string[] = [];
  const seen = new Set(alreadyReported);
  issues.forEach((i) => {
    const field = String(i.path[0] ?? '');
    if (seen.has(field)) return;
    seen.add(field);
    out.push(i.message);
  });
  return out;
}
