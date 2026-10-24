/**
 * Gắn băng hình «cây chuối + fp ForPeasantz» lên đầu file Excel có đầu công ty.
 *
 * Các file Excel phiếu/báo cáo dựng bằng SheetJS bản community — bản này không nhúng được ảnh. Nên:
 * dời sheet đầu xuống `SO_DONG_BANG_HINH` dòng (ô, merge, chiều cao dòng đi theo), ghi ra buffer, mở lại
 * bằng ExcelJS (chunk lazy sẵn có của dialog Xuất) để chèn ảnh vào dòng trống rồi tải về.
 * Không tải được ảnh hoặc ExcelJS lỗi → ghi file như cũ, không băng hình (xuất không bao giờ hỏng vì ảnh).
 */
import type { CellObject, Range, WorkBook, WorkSheet } from 'xlsx';
import { downloadBlob } from '../download-blob';
import { BANG_HINH_CAO, BANG_HINH_RONG, taiBangHinhBase64 } from '../phieu-in/bang-hinh';

type XlsxModule = typeof import('xlsx');

/** Số dòng trống chèn trên cùng để đặt ảnh. */
export const SO_DONG_BANG_HINH = 1;
/** Chiều cao dòng chứa ảnh (pt) và chiều cao ảnh (px) — 36pt = 48px, ảnh 40px chừa lề trên/dưới. */
const CAO_DONG_PT = 36;
const CAO_ANH_PX = 40;
const EMU_MOI_PX = 9525;
/** Độ rộng cột mặc định của Excel (ký tự) khi `!cols` không khai báo. */
const RONG_COT_MAC_DINH = 8.43;

/** Ký tự → px theo cách Excel quy đổi với phông Calibri 11 (7px/ký tự + 5px đệm). */
export const kyTuSangPx = (w: number) => Math.floor(w * 7 + 5);

/**
 * Bản sao của sheet đã dời xuống `n` dòng: mọi ô, `!merges`, `!rows`, `!autofilter` theo chỉ số
 * dòng mới; `!ref` bắt đầu từ dòng 0 để gồm cả dòng trống. Không đụng sheet gốc.
 */
export function dichSheetXuong(XLSX: XlsxModule, ws: WorkSheet, n: number): WorkSheet {
  const out: WorkSheet = {};
  for (const key of Object.keys(ws)) {
    if (key.startsWith('!')) continue;
    const { r, c } = XLSX.utils.decode_cell(key);
    out[XLSX.utils.encode_cell({ r: r + n, c })] = ws[key] as CellObject;
  }
  const dich = (rg: Range): Range => ({ s: { r: rg.s.r + n, c: rg.s.c }, e: { r: rg.e.r + n, c: rg.e.c } });
  for (const key of Object.keys(ws)) {
    if (!key.startsWith('!')) continue;
    switch (key) {
      case '!ref': {
        const rg = XLSX.utils.decode_range(ws['!ref'] as string);
        out['!ref'] = XLSX.utils.encode_range({ s: { r: 0, c: rg.s.c }, e: { r: rg.e.r + n, c: rg.e.c } });
        break;
      }
      case '!merges':
        out['!merges'] = (ws['!merges'] ?? []).map(dich);
        break;
      case '!rows':
        out['!rows'] = [...Array.from({ length: n }, () => ({})), ...(ws['!rows'] ?? [])];
        break;
      case '!autofilter':
        if (ws['!autofilter']?.ref) {
          out['!autofilter'] = { ref: XLSX.utils.encode_range(dich(XLSX.utils.decode_range(ws['!autofilter'].ref))) };
        }
        break;
      default:
        out[key] = ws[key];
    }
  }
  if (!out['!ref']) out['!ref'] = XLSX.utils.encode_range({ s: { r: 0, c: 0 }, e: { r: n - 1, c: 0 } });
  return out;
}

/**
 * Vị trí + kích thước ảnh căn giữa theo tổng độ rộng (px) các cột đang dùng: ảnh rộng hơn tổng cột
 * thì thu nhỏ giữ tỉ lệ. Trả cột bắt đầu (0-based) + độ lệch px trong cột đó.
 */
export function viTriAnh(rongCotPx: number[], rongAnhMuon: number, caoAnhMuon: number) {
  const tong = rongCotPx.reduce((a, b) => a + b, 0);
  const tiLe = tong > 0 && rongAnhMuon > tong ? tong / rongAnhMuon : 1;
  const rong = Math.round(rongAnhMuon * tiLe);
  const cao = Math.round(caoAnhMuon * tiLe);
  let conLai = Math.max(0, Math.floor((tong - rong) / 2));
  for (let cot = 0; cot < rongCotPx.length; cot++) {
    if (conLai < rongCotPx[cot]) return { cot, lechPx: conLai, rong, cao };
    conLai -= rongCotPx[cot];
  }
  return { cot: 0, lechPx: 0, rong, cao };
}

/** Thay `XLSX.writeFile(wb, tenFile)` cho các file có đầu công ty ở sheet đầu tiên. */
export async function ghiXlsxCoBangHinh(XLSX: XlsxModule, wb: WorkBook, tenFile: string): Promise<void> {
  const base64 = await taiBangHinhBase64();
  if (!base64) {
    XLSX.writeFile(wb, tenFile);
    return;
  }
  try {
    const tenSheet = wb.SheetNames[0];
    const wsGoc = wb.Sheets[tenSheet];
    const wbDich: WorkBook = {
      ...wb,
      Sheets: { ...wb.Sheets, [tenSheet]: dichSheetXuong(XLSX, wsGoc, SO_DONG_BANG_HINH) },
    };
    const buf = XLSX.write(wbDich, { type: 'array', bookType: 'xlsx' }) as ArrayBuffer;

    const mod = await import('exceljs');
    const ExcelJS = (mod as unknown as { default?: typeof mod }).default ?? mod;
    const ewb = new ExcelJS.Workbook();
    await ewb.xlsx.load(buf);
    const ews = ewb.worksheets[0];

    for (let r = 1; r <= SO_DONG_BANG_HINH; r++) ews.getRow(r).height = CAO_DONG_PT / SO_DONG_BANG_HINH;

    const range = XLSX.utils.decode_range(wsGoc['!ref'] ?? 'A1');
    const cols = wsGoc['!cols'] ?? [];
    const rongCotPx = Array.from({ length: range.e.c + 1 }, (_, c) => {
      const col = cols[c];
      if (col?.hidden) return 0;
      if (col?.wpx) return col.wpx;
      return kyTuSangPx(col?.wch ?? col?.width ?? RONG_COT_MAC_DINH);
    });
    const { cot, lechPx, rong, cao } = viTriAnh(
      rongCotPx,
      Math.round((CAO_ANH_PX * BANG_HINH_RONG) / BANG_HINH_CAO),
      CAO_ANH_PX,
    );
    const imageId = ewb.addImage({ base64, extension: 'png' });
    // Neo bằng toạ độ gốc (EMU): `tl.col/row` số lẻ của ExcelJS quy đổi theo độ rộng cột ước lượng sai.
    const caoDongPx = (CAO_DONG_PT * 96) / 72;
    const tl = {
      nativeCol: cot,
      nativeColOff: Math.round(lechPx * EMU_MOI_PX),
      nativeRow: 0,
      nativeRowOff: Math.round(Math.max(0, (caoDongPx - cao) / 2) * EMU_MOI_PX),
    };
    ews.addImage(imageId, {
      tl: tl as unknown as { col: number; row: number },
      ext: { width: rong, height: cao },
      editAs: 'oneCell',
    });

    const out = await ewb.xlsx.writeBuffer();
    downloadBlob(
      new Blob([out], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }),
      tenFile,
    );
  } catch (err) {
    console.warn('[xlsx-bang-hinh] Không chèn được băng hình, xuất file không ảnh:', err);
    XLSX.writeFile(wb, tenFile);
  }
}
