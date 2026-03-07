import type { TaiKhoan, SoDuKyRow } from '../core/types';
import type { TaiKhoanFormValues } from '../core/schema';
import { MOCK_TAI_KHOAN } from '@/mocks/tai-chinh';
import { MOCK_THU_CHI } from '@/mocks/tai-chinh';
import i18n from '../../../../lib/i18n';

let dbTaiKhoan: TaiKhoan[] = JSON.parse(JSON.stringify(MOCK_TAI_KHOAN));

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const getTaiKhoanList = async (): Promise<TaiKhoan[]> => {
  await delay(500);
  return [...dbTaiKhoan].sort((a, b) => a.ten_tai_khoan.localeCompare(b.ten_tai_khoan));
};

export const createTaiKhoan = async (data: TaiKhoanFormValues): Promise<TaiKhoan> => {
  await delay(600);
  const now = new Date().toISOString();
  const soTk = data.loai_tai_khoan === 'tien_mat' ? `CASH-${Date.now().toString().slice(-6)}` : (data.so_tai_khoan ?? '').trim();
  const newItem: TaiKhoan = {
    id: `tk-${Date.now()}`,
    ten_tai_khoan: data.ten_tai_khoan,
    so_tai_khoan: soTk,
    ngan_hang: data.ngan_hang ?? '',
    ma_ngan_hang: data.ma_ngan_hang?.trim() || undefined,
    chu_tai_khoan: data.chu_tai_khoan?.trim() || undefined,
    loai_tai_khoan: data.loai_tai_khoan,
    so_du_dau: 0,
    tong_thu: 0,
    tong_chi: 0,
    so_du_cuoi: 0,
    so_du_hien_tai: 0,
    trang_thai: data.trang_thai as 0 | 1,
    tg_tao: now,
    tg_cap_nhat: now,
  };
  dbTaiKhoan = [newItem, ...dbTaiKhoan];
  return newItem;
};

export const updateTaiKhoan = async (id: string, data: TaiKhoanFormValues): Promise<TaiKhoan> => {
  await delay(600);
  const index = dbTaiKhoan.findIndex((t) => t.id === id);
  if (index === -1) throw new Error(i18n.t('taiKhoan.service.notFound'));
  const existing = dbTaiKhoan[index];
  const soTk = data.loai_tai_khoan === 'tien_mat' ? existing.so_tai_khoan : (data.so_tai_khoan ?? '').trim();
  const updated: TaiKhoan = {
    ...existing,
    ten_tai_khoan: data.ten_tai_khoan,
    so_tai_khoan: soTk,
    ngan_hang: data.ngan_hang ?? '',
    ma_ngan_hang: data.ma_ngan_hang?.trim() || undefined,
    chu_tai_khoan: data.chu_tai_khoan?.trim() || undefined,
    loai_tai_khoan: data.loai_tai_khoan,
    trang_thai: data.trang_thai as 0 | 1,
    tg_cap_nhat: new Date().toISOString(),
  };
  dbTaiKhoan[index] = updated;
  return updated;
};

export const deleteTaiKhoan = async (id: string): Promise<void> => {
  await delay(400);
  dbTaiKhoan = dbTaiKhoan.filter((t) => t.id !== id);
};

export const deleteTaiKhoanMany = async (ids: string[]): Promise<void> => {
  await delay(500);
  dbTaiKhoan = dbTaiKhoan.filter((t) => !ids.includes(t.id));
};

/** Giao dịch thu/chi (bỏ qua chuyen_quy khi tính tổng). */
function isThuChiCompleted(gd: { loai: string; trang_thai?: string }): boolean {
  return (gd.loai === 'thu' || gd.loai === 'chi') && gd.trang_thai === 'hoan_thanh';
}

function toDateStr(iso: string): string {
  return iso.slice(0, 10);
}

export interface GetSoDuTheoKyParams {
  tuNgay: string;
  denNgay: string;
  id_tai_khoan?: string[];
}

export const getSoDuTheoKy = async (params: GetSoDuTheoKyParams): Promise<SoDuKyRow[]> => {
  await delay(400);
  const { tuNgay, denNgay, id_tai_khoan } = params;
  const accounts = id_tai_khoan?.length
    ? dbTaiKhoan.filter((t) => id_tai_khoan.includes(t.id))
    : dbTaiKhoan;
  const rows: SoDuKyRow[] = [];

  for (const acc of accounts) {
    const beforePeriod = MOCK_THU_CHI.filter(
      (gd) =>
        gd.id_tai_khoan === acc.id &&
        isThuChiCompleted(gd as { loai: string; trang_thai?: string }) &&
        toDateStr(gd.ngay_giao_dich) < tuNgay
    );
    const inPeriod = MOCK_THU_CHI.filter(
      (gd) =>
        gd.id_tai_khoan === acc.id &&
        isThuChiCompleted(gd as { loai: string; trang_thai?: string }) &&
        toDateStr(gd.ngay_giao_dich) >= tuNgay &&
        toDateStr(gd.ngay_giao_dich) <= denNgay
    );

    const openingFromTx = beforePeriod.reduce(
      (sum, gd) => sum + (gd.loai === 'thu' ? gd.so_tien : -gd.so_tien),
      0
    );
    const so_du_dau_ky = acc.so_du_dau + openingFromTx;
    const tong_thu = inPeriod.filter((g) => g.loai === 'thu').reduce((s, g) => s + g.so_tien, 0);
    const tong_chi = inPeriod.filter((g) => g.loai === 'chi').reduce((s, g) => s + g.so_tien, 0);
    const so_du_cuoi_ky = so_du_dau_ky + tong_thu - tong_chi;

    rows.push({
      ky: `${tuNgay}_${denNgay}`,
      ky_label: `${tuNgay} – ${denNgay}`,
      id_tai_khoan: acc.id,
      ten_tai_khoan: acc.ten_tai_khoan,
      loai_tai_khoan: acc.loai_tai_khoan,
      so_du_dau_ky,
      tong_thu,
      tong_chi,
      so_du_cuoi_ky,
    });
  }

  return rows.sort((a, b) => a.ten_tai_khoan.localeCompare(b.ten_tai_khoan));
};
