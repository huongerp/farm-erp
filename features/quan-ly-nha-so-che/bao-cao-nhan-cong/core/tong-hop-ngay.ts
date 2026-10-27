import type { FarmBaoCaoNhanCong, LoaiChuyen } from './types';

/**
 * Tab «Tổng hợp theo ngày» — gom số người theo nhóm chuyền cho từng nhà sơ chế.
 * Thứ tự phần tử = thứ tự cột trên bảng.
 */
export const NHOM_TONG_HOP_NGAY = [
  { key: 'quanLy', loai: ['CONG_DINH_BIEN_KHONG_SAN_XUAT'] },
  { key: 'xanTia', loai: ['XAN_NAI', 'TIA_DANH_GIA'] },
  { key: 'canDongThung', loai: ['CAN_TEM_DONG_THUNG'] },
  { key: 'kho', loai: ['KHO_HUT_CHAN_KHONG'] },
  { key: 'tangCuong', loai: ['CONG_TANG_CUONG'] },
] as const satisfies readonly { key: string; loai: readonly LoaiChuyen[] }[];

export type NhomTongHopKey = (typeof NHOM_TONG_HOP_NGAY)[number]['key'];

export type SoNguoiTheoNhom = Record<NhomTongHopKey, number>;

const NHOM_THEO_LOAI = new Map<string, NhomTongHopKey>(
  NHOM_TONG_HOP_NGAY.flatMap((n) => n.loai.map((loai) => [loai, n.key] as const))
);

/** Phiếu tối thiểu cần để tổng hợp (số liệu có thể là chuỗi / null từ dữ liệu cũ). */
export type PhieuTongHopNgay = Pick<FarmBaoCaoNhanCong, 'id_chi_nhanh' | 'ten_chi_nhanh'> & {
  chi_tiet?: {
    loai_chuyen: string;
    sl_cong_ngay?: unknown;
    sl_cong_nua?: unknown;
  }[];
};

/** Nhà sơ chế trong phạm vi xem đã từng có phiếu (lấy từ danh sách tóm tắt). */
export type NhaSoCheDaBiet = Pick<FarmBaoCaoNhanCong, 'id_chi_nhanh' | 'ten_chi_nhanh'>;

export interface DongTongHopNgay {
  /** Khoá gộp dòng: id chi nhánh, thiếu id thì theo tên */
  key: string;
  tenChiNhanh: string;
  /** false = nhà sơ chế chưa có phiếu ngày này (không tính vào tổng cộng) */
  daBaoCao: boolean;
  soNguoi: SoNguoiTheoNhom;
  tongNs: number;
}

export interface KetQuaTongHopNgay {
  dong: DongTongHopNgay[];
  tongCong: SoNguoiTheoNhom & { tongNs: number };
}

const num = (v: unknown) => {
  if (v == null || v === '') return 0;
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};

const soNguoiRong = (): SoNguoiTheoNhom => ({
  quanLy: 0,
  xanTia: 0,
  canDongThung: 0,
  kho: 0,
  tangCuong: 0,
});

const tongCacNhom = (s: SoNguoiTheoNhom) =>
  NHOM_TONG_HOP_NGAY.reduce((acc, n) => acc + s[n.key], 0);

function khoaNhaSoChe(x: NhaSoCheDaBiet): string {
  if (x.id_chi_nhanh != null && x.id_chi_nhanh !== '') return `id:${x.id_chi_nhanh}`;
  return `ten:${(x.ten_chi_nhanh ?? '').trim()}`;
}

/**
 * Mỗi nhà sơ chế một dòng; ô = số người (`sl_cong_ngay + sl_cong_nua`) của các chuyền thuộc nhóm —
 * không cộng tăng ca, không chia đôi công nửa. Nhiều phiếu cùng nhà sơ chế → cộng dồn.
 * Nhà sơ chế đã biết mà ngày này chưa có phiếu → dòng `daBaoCao: false`, không vào tổng cộng.
 */
export function tongHopNhanSuTheoNgay(
  phieuList: PhieuTongHopNgay[],
  nhaSoCheDaBiet: NhaSoCheDaBiet[]
): KetQuaTongHopNgay {
  const byKey = new Map<string, DongTongHopNgay>();

  for (const phieu of phieuList) {
    const key = khoaNhaSoChe(phieu);
    let dong = byKey.get(key);
    if (!dong) {
      dong = {
        key,
        tenChiNhanh: phieu.ten_chi_nhanh?.trim() ?? '',
        daBaoCao: true,
        soNguoi: soNguoiRong(),
        tongNs: 0,
      };
      byKey.set(key, dong);
    }
    for (const ct of phieu.chi_tiet ?? []) {
      const nhom = NHOM_THEO_LOAI.get(ct.loai_chuyen);
      if (!nhom) continue;
      dong.soNguoi[nhom] += num(ct.sl_cong_ngay) + num(ct.sl_cong_nua);
    }
  }
  for (const dong of byKey.values()) dong.tongNs = tongCacNhom(dong.soNguoi);

  for (const nsc of nhaSoCheDaBiet) {
    const key = khoaNhaSoChe(nsc);
    if (byKey.has(key)) continue;
    byKey.set(key, {
      key,
      tenChiNhanh: nsc.ten_chi_nhanh?.trim() ?? '',
      daBaoCao: false,
      soNguoi: soNguoiRong(),
      tongNs: 0,
    });
  }

  const dong = [...byKey.values()].sort((a, b) => a.tenChiNhanh.localeCompare(b.tenChiNhanh, 'vi'));

  const tong = soNguoiRong();
  for (const d of dong) {
    if (!d.daBaoCao) continue;
    for (const n of NHOM_TONG_HOP_NGAY) tong[n.key] += d.soNguoi[n.key];
  }

  return { dong, tongCong: { ...tong, tongNs: tongCacNhom(tong) } };
}

/** Hôm nay theo giờ máy, dạng yyyy-mm-dd. */
export function homNayYmd(now: Date = new Date()): string {
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  return `${now.getFullYear()}-${mm}-${dd}`;
}

/** `?ngay=` trên URL có phải ngày yyyy-mm-dd có thật không. */
export function laNgayYmdHopLe(v: string | null | undefined): v is string {
  if (!v || !/^\d{4}-\d{2}-\d{2}$/.test(v)) return false;
  const [y, m, d] = v.split('-').map(Number);
  const dt = new Date(y, m - 1, d);
  return dt.getFullYear() === y && dt.getMonth() === m - 1 && dt.getDate() === d;
}
