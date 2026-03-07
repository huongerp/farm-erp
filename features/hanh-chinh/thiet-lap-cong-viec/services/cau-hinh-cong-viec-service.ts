import type { CauHinhCongViec } from '../core/types';
import type { CauHinhCongViecFormValues } from '../core/schema';

const STORAGE_KEY = 'cau_hinh_cong_viec';

const DEFAULT_CONFIG: CauHinhCongViec = {
  so_ngay_canh_bao_sap_han: 3,
  bat_canh_bao_qua_han: true,
};

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const getCauHinhCongViec = async (): Promise<CauHinhCongViec> => {
  await delay(300);
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as CauHinhCongViec;
      return {
        so_ngay_canh_bao_sap_han: parsed.so_ngay_canh_bao_sap_han ?? DEFAULT_CONFIG.so_ngay_canh_bao_sap_han,
        bat_canh_bao_qua_han: parsed.bat_canh_bao_qua_han ?? DEFAULT_CONFIG.bat_canh_bao_qua_han,
      };
    }
  } catch {
    // ignore
  }
  return { ...DEFAULT_CONFIG };
};

export const saveCauHinhCongViec = async (
  data: CauHinhCongViecFormValues
): Promise<CauHinhCongViec> => {
  await delay(400);
  const config: CauHinhCongViec = {
    so_ngay_canh_bao_sap_han: data.so_ngay_canh_bao_sap_han,
    bat_canh_bao_qua_han: data.bat_canh_bao_qua_han,
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
  return config;
};
