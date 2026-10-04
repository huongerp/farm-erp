/**
 * Gọi service sheets (`/sheets/*`): kết nối Google, đọc file, xuất Google Sheet.
 * Lỗi trả về luôn có `thongDiep` tiếng Việt để hiện toast thẳng.
 */
import { SHEETS_URL } from './api-config';
import { layAccessToken } from './token-store';
import type { MauSoCot } from './export/dinh-dang-o';

export class SheetsLoi extends Error {
  readonly ma: string;
  readonly status: number;
  constructor(ma: string, status: number, thongDiep: string) {
    super(thongDiep);
    this.ma = ma;
    this.status = status;
  }
}

async function goi<T>(duongDan: string, init: RequestInit = {}): Promise<T> {
  const token = await layAccessToken();
  let res: Response;
  try {
    res = await fetch(`${SHEETS_URL}${duongDan}`, {
      ...init,
      headers: {
        ...(init.body ? { 'Content-Type': 'application/json' } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...init.headers,
      },
    });
  } catch {
    throw new SheetsLoi('mang', 0, 'Không kết nối được máy chủ Google Sheet.');
  }
  const text = await res.text();
  let json: Record<string, unknown> = {};
  try {
    json = text ? (JSON.parse(text) as Record<string, unknown>) : {};
  } catch {
    // Proxy trả HTML (service chưa bật) — rơi xuống nhánh lỗi chung.
  }
  if (!res.ok) {
    const ma = typeof json.loi === 'string' ? json.loi : 'loi';
    const tb =
      typeof json.thongDiep === 'string'
        ? json.thongDiep
        : res.status === 502 || res.status === 503 || res.status === 504
          ? 'Dịch vụ Google Sheet chưa sẵn sàng.'
          : 'Thao tác Google Sheet thất bại.';
    throw new SheetsLoi(ma, res.status, tb);
  }
  return json as T;
}

export interface TrangThaiGoogle {
  ketNoi: boolean;
  email: string | null;
  trangThai: 'hoat_dong' | 'hong' | null;
}

export type TanSuatDongBo = 'khi_thay_doi' | 'moi_gio' | 'moi_4_gio' | 'hang_ngay' | 'hang_tuan' | 'hang_thang';

export interface LichDongBo {
  id: number;
  moduleId: string;
  tenFile: string | null;
  sheetTitle: string;
  spreadsheetUrl: string;
  tanSuat: TanSuatDongBo;
  gio: number | null;
  thu: number | null;
  ngayThang: number | null;
  bat: boolean;
  soCot: number;
  lanChayCuoi: string | null;
  ketQuaCuoi: 'ok' | 'loi' | null;
  thongDiepCuoi: string | null;
  soDongCuoi: number | null;
  lanChayKeTiep: string | null;
  /** Đã có thay đổi, đang chờ hết cửa sổ gộp để ghi. */
  choGhi: boolean;
  soLoiLienTiep: number;
}

export interface CauHinhTanSuat {
  tanSuat: TanSuatDongBo;
  gio?: number | null;
  thu?: number | null;
  ngayThang?: number | null;
}

type CotGui = { key: string; label: string; type?: string };
type KetQuaChayLich = { ok: boolean; soDong?: number; thongDiep: string };

export const sheetsClient = {
  trangThai: () => goi<TrangThaiGoogle>('/google/trang-thai'),

  batDauKetNoi: (popup: boolean) =>
    goi<{ url: string }>('/google/bat-dau', { method: 'POST', body: JSON.stringify({ popup }) }),

  ngatKetNoi: () => goi<{ ok: true }>('/google/ket-noi', { method: 'DELETE' }),

  tokenPicker: () => goi<{ accessToken: string }>('/google/token-picker'),

  thongTinFile: (id: string) =>
    goi<{
      spreadsheetId: string;
      title: string;
      url: string;
      tabs: { title: string; rowCount: number; header: string[] }[];
    }>(`/google/bang-tinh/${encodeURIComponent(id)}`),

  xuatNgay: (body: {
    dich: { loai: 'moi'; tenFile: string; tenTab: string } | { loai: 'co_san'; spreadsheetId: string; tenTab: string };
    cheDo: 'ghi_de' | 'ghi_them';
    header: string[];
    rows: (string | number)[][];
    mauSo: (MauSoCot | null)[];
  }) =>
    goi<{
      ok: true;
      spreadsheetId: string;
      url: string;
      tenTab: string;
      soDong: number;
      lechHeader: { thieu: string[]; thua: string[]; doiThuTu: boolean } | null;
    }>('/xuat-ngay', { method: 'POST', body: JSON.stringify(body) }),

  // --- Lịch đồng bộ tự động ---
  dsLich: (moduleId?: string) =>
    goi<{ hoTro: boolean; duocTao: boolean; lyDo: string | null; dsLich: LichDongBo[] }>(
      `/lich${moduleId ? `?moduleId=${encodeURIComponent(moduleId)}` : ''}`,
    ),

  xemThuLich: (moduleId: string, cot: CotGui[]) =>
    goi<{ header: string[]; rows: string[][] }>('/lich/xem-thu', { method: 'POST', body: JSON.stringify({ moduleId, cot }) }),

  taoLich: (
    body: CauHinhTanSuat & {
      moduleId: string;
      cot: CotGui[];
      dich: { loai: 'moi'; tenFile: string; tenTab: string } | { loai: 'co_san'; spreadsheetId: string; tenTab: string };
    },
  ) =>
    goi<{ ok: true; lich: LichDongBo; ketQua: KetQuaChayLich | null; url: string }>('/lich', {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  suaLich: (id: number, body: Partial<CauHinhTanSuat> & { bat?: boolean }) =>
    goi<{ ok: true; lich: LichDongBo }>(`/lich/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),

  xoaLich: (id: number) => goi<{ ok: true }>(`/lich/${id}`, { method: 'DELETE' }),

  chayNgay: (id: number) =>
    goi<{ ok: boolean; ketQua: KetQuaChayLich; lich: LichDongBo | null }>(`/lich/${id}/chay-ngay`, { method: 'POST' }),
};
