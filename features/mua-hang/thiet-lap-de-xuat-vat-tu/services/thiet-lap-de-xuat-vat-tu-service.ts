import type { CauHinhDeXuatVatTu } from '../core/types';

const STORAGE_KEY = 'cau_hinh_de_xuat_vat_tu';

const DEFAULT_CONFIG: CauHinhDeXuatVatTu = {
  thoi_han_duyet_ngay: 7,
  bat_canh_bao_qua_han: true,

  tien_to_so_phieu: 'PDX-',
  tu_sinh_so_phieu: false,
  do_dai_phan_so: 4,
  so_thu_tu_tiep_theo: 1,
  ngay_can_bat_buoc: true,
  ghi_chu_bat_buoc: false,
  so_dong_toi_da: 0,

  so_ngay_mac_dinh_ngay_can: 7,
  trang_thai_mac_dinh: 0,
  cho_phep_sua_sau_duyet: false,
};

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

function mergeWithDefaults(parsed: Partial<CauHinhDeXuatVatTu>): CauHinhDeXuatVatTu {
  return {
    ...DEFAULT_CONFIG,
    ...parsed,
    thoi_han_duyet_ngay: parsed.thoi_han_duyet_ngay ?? DEFAULT_CONFIG.thoi_han_duyet_ngay,
    bat_canh_bao_qua_han: parsed.bat_canh_bao_qua_han ?? DEFAULT_CONFIG.bat_canh_bao_qua_han,
    tien_to_so_phieu: parsed.tien_to_so_phieu ?? DEFAULT_CONFIG.tien_to_so_phieu,
    tu_sinh_so_phieu: parsed.tu_sinh_so_phieu ?? DEFAULT_CONFIG.tu_sinh_so_phieu,
    do_dai_phan_so: parsed.do_dai_phan_so ?? DEFAULT_CONFIG.do_dai_phan_so,
    so_thu_tu_tiep_theo: Math.max(1, parsed.so_thu_tu_tiep_theo ?? DEFAULT_CONFIG.so_thu_tu_tiep_theo),
    ngay_can_bat_buoc: parsed.ngay_can_bat_buoc ?? DEFAULT_CONFIG.ngay_can_bat_buoc,
    ghi_chu_bat_buoc: parsed.ghi_chu_bat_buoc ?? DEFAULT_CONFIG.ghi_chu_bat_buoc,
    so_dong_toi_da: parsed.so_dong_toi_da ?? DEFAULT_CONFIG.so_dong_toi_da,
    so_ngay_mac_dinh_ngay_can:
      parsed.so_ngay_mac_dinh_ngay_can ?? DEFAULT_CONFIG.so_ngay_mac_dinh_ngay_can,
    trang_thai_mac_dinh: parsed.trang_thai_mac_dinh ?? DEFAULT_CONFIG.trang_thai_mac_dinh,
    cho_phep_sua_sau_duyet: parsed.cho_phep_sua_sau_duyet ?? DEFAULT_CONFIG.cho_phep_sua_sau_duyet,
  };
}

export const getCauHinhDeXuatVatTu = async (): Promise<CauHinhDeXuatVatTu> => {
  await delay(300);
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<CauHinhDeXuatVatTu>;
      return mergeWithDefaults(parsed);
    }
  } catch {
    // ignore
  }
  return { ...DEFAULT_CONFIG };
};

export const saveCauHinhDeXuatVatTu = async (
  data: Partial<CauHinhDeXuatVatTu>
): Promise<CauHinhDeXuatVatTu> => {
  await delay(400);
  const current = await getCauHinhDeXuatVatTu();
  const merged = mergeWithDefaults({ ...current, ...data });
  localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
  return merged;
};

/** Trả về số phiếu tiếp theo (prefix + số pad) và tăng so_thu_tu_tiep_theo trong storage. */
export const getNextSoPhieuAndIncrement = async (): Promise<string> => {
  const config = await getCauHinhDeXuatVatTu();
  if (!config.tu_sinh_so_phieu) {
    return '';
  }
  const next = config.so_thu_tu_tiep_theo;
  const padded = String(next).padStart(config.do_dai_phan_so, '0');
  const soPhieu = `${config.tien_to_so_phieu || ''}${padded}`;
  await saveCauHinhDeXuatVatTu({ so_thu_tu_tiep_theo: next + 1 });
  return soPhieu;
};
