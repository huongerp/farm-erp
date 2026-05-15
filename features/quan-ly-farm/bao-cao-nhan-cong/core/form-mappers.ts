import type { FarmBaoCaoNhanCong } from './types';
import { LOAI_CHUYEN_CODES } from './types';
import type { BaoCaoNhanCongFormValues } from './schema';

export function defaultChiTietRows(): BaoCaoNhanCongFormValues['chi_tiet'] {
  return LOAI_CHUYEN_CODES.map((loai_chuyen) => ({
    loai_chuyen,
    sl_cong_ngay: 0,
    sl_cong_nua: 0,
    sl_tang_ca: 0,
    so_gio_tc: 0,
    ghi_chu: null,
  })) as BaoCaoNhanCongFormValues['chi_tiet'];
}

export function defaultFormValues(): BaoCaoNhanCongFormValues {
  const today = new Date().toISOString().slice(0, 10);
  return {
    ngay: today,
    id_chi_nhanh: '',
    ten_chi_nhanh: null,
    ghi_chu: null,
    hinh_anh_urls: [],
    chi_tiet: defaultChiTietRows(),
  };
}

export function farmBaoCaoNhanCongToForm(row: FarmBaoCaoNhanCong): BaoCaoNhanCongFormValues {
  const byLoai = new Map(row.chi_tiet.map((c) => [c.loai_chuyen, c]));
  const chi_tiet = LOAI_CHUYEN_CODES.map((code) => {
    const c = byLoai.get(code);
    return {
      loai_chuyen: code,
      sl_cong_ngay: c ? Number(c.sl_cong_ngay) : 0,
      sl_cong_nua: c ? Number(c.sl_cong_nua) : 0,
      sl_tang_ca: c ? Number(c.sl_tang_ca) : 0,
      so_gio_tc: c ? Number(c.so_gio_tc) : 0,
      ghi_chu: c?.ghi_chu ?? null,
    };
  }) as BaoCaoNhanCongFormValues['chi_tiet'];

  return {
    ngay: row.ngay,
    id_chi_nhanh: row.id_chi_nhanh != null && String(row.id_chi_nhanh).trim() !== '' ? String(row.id_chi_nhanh) : '',
    ten_chi_nhanh: row.ten_chi_nhanh,
    ghi_chu: row.ghi_chu,
    hinh_anh_urls: Array.isArray(row.hinh_anh_urls) ? [...row.hinh_anh_urls] : [],
    chi_tiet,
  };
}

/** Ngày ISO yyyy-mm-dd + số ngày (theo lịch local). */
export function addCalendarDaysIso(isoDate: string, deltaDays: number): string {
  const raw = isoDate.slice(0, 10);
  const [y, m, d] = raw.split('-').map((x) => Number(x));
  if (!Number.isFinite(y) || !Number.isFinite(m) || !Number.isFinite(d)) {
    return raw;
  }
  const dt = new Date(y, m - 1, d + deltaDays);
  const yy = dt.getFullYear();
  const mm = String(dt.getMonth() + 1).padStart(2, '0');
  const dd = String(dt.getDate()).padStart(2, '0');
  return `${yy}-${mm}-${dd}`;
}

/** Form tạo phiếu mới: cùng chi nhánh + chi tiết + ghi chú, ngày = ngày nguồn + 1. */
export function farmBaoCaoNhanCongToFormNextDay(row: FarmBaoCaoNhanCong): BaoCaoNhanCongFormValues {
  const base = farmBaoCaoNhanCongToForm(row);
  return { ...base, ngay: addCalendarDaysIso(row.ngay, 1) };
}

/** Trùng cùng chi nhánh + cùng ngày (bỏ qua excludeId khi sửa). */
export function findBaoCaoDuplicateByBranchAndDate(
  items: FarmBaoCaoNhanCong[],
  ngay: string,
  idChiNhanh: string | null | undefined,
  excludeId?: string | null
): FarmBaoCaoNhanCong | undefined {
  if (!idChiNhanh || String(idChiNhanh).trim() === '' || !ngay) return undefined;
  const idStr = String(idChiNhanh);
  return items.find(
    (r) =>
      r.id !== excludeId &&
      r.ngay === ngay &&
      r.id_chi_nhanh != null &&
      String(r.id_chi_nhanh) === idStr
  );
}

/** Gợi ý chi nhánh mặc định từ bản ghi gần nhất do user tạo */
export function getPreferredBranchFromUserLastRecords(
  items: FarmBaoCaoNhanCong[],
  userId: string | number | undefined
): { id_chi_nhanh: string; ten_chi_nhanh: string } | null {
  if (userId == null || userId === '') return null;
  const uid = String(userId);
  const mine = items
    .filter((r) => r.id_nguoi_tao === uid && r.id_chi_nhanh && r.ten_chi_nhanh)
    .sort((a, b) => new Date(b.tg_tao).getTime() - new Date(a.tg_tao).getTime());
  const first = mine[0];
  if (!first?.id_chi_nhanh || !first.ten_chi_nhanh) return null;
  return { id_chi_nhanh: first.id_chi_nhanh, ten_chi_nhanh: first.ten_chi_nhanh };
}
