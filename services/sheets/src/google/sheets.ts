/**
 * Ghi Google Sheet bằng Sheets API v4 qua `goiGoogle`. Luôn `valueInputOption=RAW`:
 * Google không diễn giải chuỗi (giữ số 0 đầu, không biến `=...` thành công thức) —
 * số và serial ngày phía client đã là kiểu thật, ngày hiện đúng nhờ numberFormat cột.
 */
import {
  chiaLo,
  cotChu,
  dinhDangSoSheet,
  GIOI_HAN,
  soKhopHeader,
  vungA1,
  type CheDoGhi,
  type LechHeader,
  type MauSoCot,
  type OSheet,
} from '../core/bang-tinh.ts';
import { goiGoogle } from './goi-google.ts';

const BASE = 'https://sheets.googleapis.com/v4/spreadsheets';

export interface ThongTinTab {
  sheetId: number;
  title: string;
  rowCount: number;
  columnCount: number;
}

export interface ThongTinFile {
  spreadsheetId: string;
  title: string;
  url: string;
  tabs: ThongTinTab[];
}

interface SheetProps {
  properties: { sheetId: number; title: string; gridProperties?: { rowCount?: number; columnCount?: number } };
}

function veTab(s: SheetProps): ThongTinTab {
  return {
    sheetId: s.properties.sheetId,
    title: s.properties.title,
    rowCount: s.properties.gridProperties?.rowCount ?? 0,
    columnCount: s.properties.gridProperties?.columnCount ?? 0,
  };
}

export async function taoFile(at: string, tenFile: string, tenTab: string): Promise<ThongTinFile> {
  const r = await goiGoogle<{ spreadsheetId: string; spreadsheetUrl: string; properties: { title: string }; sheets: SheetProps[] }>(
    BASE,
    {
      method: 'POST',
      accessToken: at,
      idempotent: false,
      body: {
        properties: { title: tenFile, locale: 'vi_VN', timeZone: 'Asia/Ho_Chi_Minh' },
        sheets: [{ properties: { title: tenTab, gridProperties: { frozenRowCount: 1 } } }],
      },
    },
  );
  return { spreadsheetId: r.spreadsheetId, title: r.properties.title, url: r.spreadsheetUrl, tabs: r.sheets.map(veTab) };
}

export async function layThongTinFile(at: string, id: string): Promise<ThongTinFile> {
  const fields = 'spreadsheetId,spreadsheetUrl,properties.title,sheets.properties(sheetId,title,gridProperties(rowCount,columnCount))';
  const r = await goiGoogle<{ spreadsheetId: string; spreadsheetUrl: string; properties: { title: string }; sheets?: SheetProps[] }>(
    `${BASE}/${encodeURIComponent(id)}?fields=${encodeURIComponent(fields)}`,
    { accessToken: at, idempotent: true },
  );
  return { spreadsheetId: r.spreadsheetId, title: r.properties.title, url: r.spreadsheetUrl, tabs: (r.sheets ?? []).map(veTab) };
}

/** Dòng 1 của nhiều tab trong một lệnh — để UI hiện header và cảnh báo lệch cột trước khi ghi thêm. */
export async function docHeaderCacTab(at: string, id: string, tabs: string[]): Promise<Map<string, string[]>> {
  const out = new Map<string, string[]>();
  if (tabs.length === 0) return out;
  const q = tabs.map((t) => `ranges=${encodeURIComponent(vungA1(t, '1:1'))}`).join('&');
  const r = await goiGoogle<{ valueRanges?: { values?: unknown[][] }[] }>(
    `${BASE}/${encodeURIComponent(id)}/values:batchGet?${q}&majorDimension=ROWS`,
    { accessToken: at, idempotent: true },
  );
  tabs.forEach((t, i) => {
    out.set(t, (r.valueRanges?.[i]?.values?.[0] ?? []).map((x) => String(x ?? '')));
  });
  return out;
}

async function batchUpdate(at: string, id: string, requests: unknown[], idempotent: boolean): Promise<{ replies?: unknown[] }> {
  if (requests.length === 0) return {};
  return goiGoogle(`${BASE}/${encodeURIComponent(id)}:batchUpdate`, {
    method: 'POST',
    accessToken: at,
    idempotent,
    body: { requests },
  });
}

/** Tạo tab nếu chưa có; tab có rồi thì nới lưới (không bao giờ thu nhỏ — giữ dữ liệu người dùng). */
async function damBaoTab(at: string, file: ThongTinFile, tenTab: string, soDong: number, soCot: number): Promise<number> {
  const co = file.tabs.find((t) => t.title === tenTab);
  if (!co) {
    const r = (await batchUpdate(
      at,
      file.spreadsheetId,
      [
        {
          addSheet: {
            properties: {
              title: tenTab,
              gridProperties: { rowCount: Math.max(soDong, 1000), columnCount: Math.max(soCot, 26), frozenRowCount: 1 },
            },
          },
        },
      ],
      false,
    )) as { replies?: { addSheet?: { properties?: { sheetId?: number } } }[] };
    return r.replies?.[0]?.addSheet?.properties?.sheetId ?? 0;
  }
  if (co.rowCount < soDong || co.columnCount < soCot) {
    await batchUpdate(
      at,
      file.spreadsheetId,
      [
        {
          updateSheetProperties: {
            properties: {
              sheetId: co.sheetId,
              gridProperties: { rowCount: Math.max(co.rowCount, soDong), columnCount: Math.max(co.columnCount, soCot) },
            },
            fields: 'gridProperties.rowCount,gridProperties.columnCount',
          },
        },
      ],
      true,
    );
  }
  return co.sheetId;
}

async function ghiVung(at: string, id: string, range: string, values: OSheet[][]): Promise<void> {
  await goiGoogle(`${BASE}/${encodeURIComponent(id)}/values/${encodeURIComponent(range)}?valueInputOption=RAW`, {
    method: 'PUT',
    accessToken: at,
    idempotent: true,
    body: { range, majorDimension: 'ROWS', values },
  });
}

async function xoaVung(at: string, id: string, ranges: string[]): Promise<void> {
  if (ranges.length === 0) return;
  await goiGoogle(`${BASE}/${encodeURIComponent(id)}/values:batchClear`, {
    method: 'POST',
    accessToken: at,
    idempotent: true,
    body: { ranges },
  });
}

export async function noiThem(at: string, id: string, tenTab: string, values: OSheet[][]): Promise<void> {
  const range = vungA1(tenTab, 'A1');
  await goiGoogle(
    `${BASE}/${encodeURIComponent(id)}/values/${encodeURIComponent(range)}:append?valueInputOption=RAW&insertDataOption=INSERT_ROWS`,
    { method: 'POST', accessToken: at, idempotent: false, body: { range, majorDimension: 'ROWS', values } },
  );
}

/** Đọc một vùng dạng giá trị thô (số là số, serial ngày là số) — để so khớp khi đồng bộ. */
export async function docVung(at: string, id: string, range: string): Promise<unknown[][]> {
  const r = await goiGoogle<{ values?: unknown[][] }>(
    `${BASE}/${encodeURIComponent(id)}/values/${encodeURIComponent(range)}?valueRenderOption=UNFORMATTED_VALUE&majorDimension=ROWS`,
    { accessToken: at, idempotent: true },
  );
  return r.values ?? [];
}

/** Ghi đè nhiều dòng lẻ trong MỘT lệnh (values:batchUpdate), chia lô 500 range. */
export async function capNhatDong(at: string, id: string, tenTab: string, soCot: number, ds: { dong: number; values: OSheet[] }[]): Promise<void> {
  for (const lo of chiaLo(ds, 500)) {
    await goiGoogle(`${BASE}/${encodeURIComponent(id)}/values:batchUpdate`, {
      method: 'POST',
      accessToken: at,
      idempotent: true,
      body: {
        valueInputOption: 'RAW',
        data: lo.map((x) => ({
          range: vungA1(tenTab, `A${x.dong}:${cotChu(soCot)}${x.dong}`),
          majorDimension: 'ROWS',
          values: [x.values],
        })),
      },
    });
  }
}

/** Xoá các khoảng dòng (chỉ số 0, GIẢM DẦN) trong một batchUpdate — xoá từ dưới lên. */
export async function xoaKhoangDong(at: string, id: string, sheetId: number, khoang: { batDau: number; ketThuc: number }[]): Promise<void> {
  // Không idempotent: thử lại sau 5xx có thể xoá thêm một lần nữa vào dòng khác.
  await batchUpdate(
    at,
    id,
    khoang.map((k) => ({ deleteDimension: { range: { sheetId, dimension: 'ROWS', startIndex: k.batDau, endIndex: k.ketThuc } } })),
    false,
  );
}

export async function dinhDangCot(at: string, id: string, sheetId: number, soCot: number, mauSo: (MauSoCot | null)[]): Promise<void> {
  await batchUpdate(at, id, yeuCauDinhDang(sheetId, soCot, mauSo, false), true);
}

/** Header đậm + nền xanh nhạt + cố định dòng 1, và numberFormat cho từng cột (từ dòng 2 trở xuống). */
function yeuCauDinhDang(sheetId: number, soCot: number, mauSo: (MauSoCot | null)[], coHeader: boolean): unknown[] {
  const req: unknown[] = [];
  if (coHeader) {
    req.push(
      {
        repeatCell: {
          range: { sheetId, startRowIndex: 0, endRowIndex: 1, startColumnIndex: 0, endColumnIndex: soCot },
          cell: {
            userEnteredFormat: {
              textFormat: { bold: true },
              backgroundColor: { red: 0.86, green: 0.92, blue: 1 },
            },
          },
          fields: 'userEnteredFormat(textFormat,backgroundColor)',
        },
      },
      {
        updateSheetProperties: {
          properties: { sheetId, gridProperties: { frozenRowCount: 1 } },
          fields: 'gridProperties.frozenRowCount',
        },
      },
    );
  }
  mauSo.forEach((m, i) => {
    const nf = m ? dinhDangSoSheet(m) : null;
    if (!nf) return;
    req.push({
      repeatCell: {
        range: { sheetId, startRowIndex: 1, startColumnIndex: i, endColumnIndex: i + 1 },
        cell: { userEnteredFormat: { numberFormat: nf } },
        fields: 'userEnteredFormat.numberFormat',
      },
    });
  });
  return req;
}

export interface KetQuaGhi {
  soDong: number;
  lechHeader: LechHeader | null;
}

/**
 * Ghi bảng vào một tab.
 *
 * - `ghi_de`: ghi dữ liệu MỚI trước rồi mới xoá phần thừa của bảng cũ — lỗi giữa chừng
 *   thì tab vẫn còn dữ liệu (cũ lẫn mới), không bao giờ trống trơn. Chỉ xoá trong phạm vi
 *   bề rộng bảng cũ/mới: cột người dùng tự thêm xa hơn bên phải được giữ.
 * - `ghi_them`: nối dưới cùng; tab trống thì ghi header trước. Lệch header thì vẫn ghi
 *   nhưng trả `lechHeader` để UI cảnh báo.
 */
export async function ghiBang(opts: {
  at: string;
  file: ThongTinFile;
  tenTab: string;
  cheDo: CheDoGhi;
  header: string[];
  rows: OSheet[][];
  mauSo: (MauSoCot | null)[];
}): Promise<KetQuaGhi> {
  const { at, file, tenTab, cheDo, header, rows, mauSo } = opts;
  const id = file.spreadsheetId;
  const soCot = header.length;
  const coTab = file.tabs.some((t) => t.title === tenTab);
  const headerCu = coTab ? ((await docHeaderCacTab(at, id, [tenTab])).get(tenTab) ?? []) : [];
  let rongCu = headerCu.length;
  while (rongCu > 0 && headerCu[rongCu - 1]!.trim() === '') rongCu--;

  if (cheDo === 'ghi_de') {
    const tongDong = rows.length + 1;
    const sheetId = await damBaoTab(at, file, tenTab, tongDong, Math.max(soCot, rongCu));
    const tatCa: OSheet[][] = [header, ...rows];
    let dongBatDau = 1;
    for (const lo of chiaLo(tatCa, GIOI_HAN.loGhi)) {
      const cuoi = dongBatDau + lo.length - 1;
      await ghiVung(at, id, vungA1(tenTab, `A${dongBatDau}:${cotChu(soCot)}${cuoi}`), lo);
      dongBatDau = cuoi + 1;
    }
    const rong = Math.max(soCot, rongCu);
    const canXoa = [vungA1(tenTab, `A${tongDong + 1}:${cotChu(rong)}`)];
    if (rongCu > soCot) canXoa.push(vungA1(tenTab, `${cotChu(soCot + 1)}1:${cotChu(rongCu)}${tongDong}`));
    await xoaVung(at, id, canXoa);
    await batchUpdate(
      at,
      id,
      [
        ...yeuCauDinhDang(sheetId, soCot, mauSo, true),
        { autoResizeDimensions: { dimensions: { sheetId, dimension: 'COLUMNS', startIndex: 0, endIndex: soCot } } },
      ],
      true,
    );
    return { soDong: rows.length, lechHeader: null };
  }

  const tabTrong = rongCu === 0;
  const sheetId = await damBaoTab(at, file, tenTab, 1, soCot);
  if (tabTrong) await ghiVung(at, id, vungA1(tenTab, `A1:${cotChu(soCot)}1`), [header]);
  for (const lo of chiaLo(rows, GIOI_HAN.loGhi)) await noiThem(at, id, tenTab, lo);
  await batchUpdate(at, id, yeuCauDinhDang(sheetId, soCot, mauSo, tabTrong), true);
  return { soDong: rows.length, lechHeader: tabTrong ? null : soKhopHeader(headerCu, header) };
}
