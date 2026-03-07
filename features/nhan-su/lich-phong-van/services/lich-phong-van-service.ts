import type { LichPhongVan } from '../core/types';
import type { LichPhongVanFormValues } from '../core/schema';
import { MOCK_LICH_PHONG_VAN } from '@/mocks/nhan-su';
import { getUngViens } from '@/features/nhan-su/ung-vien/services/ung-vien-service';
import i18n from '../../../../lib/i18n';

type RawItem = Omit<LichPhongVan, 'ten_ung_vien' | 'ma_de_xuat'>;

let db: RawItem[] = JSON.parse(JSON.stringify(MOCK_LICH_PHONG_VAN));

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function enrich(items: RawItem[]): Promise<LichPhongVan[]> {
  const ungVienList = await getUngViens();
  const byUngVien = new Map(ungVienList.map((u) => [u.id, { ten_ung_vien: u.ho_ten, ma_de_xuat: u.ma_de_xuat }]));
  return items.map((item) => {
    const uv = byUngVien.get(item.id_ung_vien);
    return {
      ...item,
      ten_ung_vien: uv?.ten_ung_vien,
      ma_de_xuat: uv?.ma_de_xuat,
    };
  });
}

export const getLichPhongVans = async (): Promise<LichPhongVan[]> => {
  await delay(500);
  return enrich([...db]);
};

export const getLichPhongVanById = async (id: string): Promise<LichPhongVan | null> => {
  await delay(300);
  const item = db.find((i) => i.id === id);
  if (!item) return null;
  const [enriched] = await enrich([item]);
  return enriched;
};

export const createLichPhongVan = async (data: LichPhongVanFormValues): Promise<LichPhongVan> => {
  await delay(600);
  const now = new Date().toISOString();
  const newItem: RawItem = {
    id: `lpv-${Date.now()}`,
    id_ung_vien: data.id_ung_vien,
    so_vong: data.so_vong,
    ngay: data.ngay,
    gio: data.gio,
    hinh_thuc: data.hinh_thuc,
    dia_diem: data.dia_diem,
    trang_thai: data.trang_thai as 0 | 1 | 2 | 3,
    trang_thai_danh_gia: data.trang_thai_danh_gia ?? 0,
    danh_gia_diem_so: data.danh_gia_diem_so ?? null,
    danh_gia_nhan_xet: data.danh_gia_nhan_xet ?? null,
    ket_qua: data.ket_qua ?? null,
    ghi_chu: data.ghi_chu ?? null,
    danh_gia_chi_tiet: data.danh_gia_chi_tiet ?? null,
    tg_tao: now,
    tg_cap_nhat: now,
  };
  db = [newItem, ...db];
  const [enriched] = await enrich([newItem]);
  return enriched;
};

export const updateLichPhongVan = async (
  id: string,
  data: LichPhongVanFormValues
): Promise<LichPhongVan> => {
  await delay(600);
  const index = db.findIndex((i) => i.id === id);
  if (index === -1) throw new Error(i18n.t('lichPhongVan.service.notFound'));
  const updated: RawItem = {
    ...db[index],
    id_ung_vien: data.id_ung_vien,
    so_vong: data.so_vong,
    ngay: data.ngay,
    gio: data.gio,
    hinh_thuc: data.hinh_thuc,
    dia_diem: data.dia_diem,
    trang_thai: data.trang_thai as 0 | 1 | 2 | 3,
    trang_thai_danh_gia: data.trang_thai_danh_gia ?? 0,
    danh_gia_diem_so: data.danh_gia_diem_so ?? null,
    danh_gia_nhan_xet: data.danh_gia_nhan_xet ?? null,
    ket_qua: data.ket_qua ?? null,
    ghi_chu: data.ghi_chu ?? null,
    danh_gia_chi_tiet: data.danh_gia_chi_tiet ?? null,
    tg_cap_nhat: new Date().toISOString(),
  };
  db[index] = updated;
  const [enriched] = await enrich([updated]);
  return enriched;
};

export const deleteLichPhongVans = async (ids: string[]): Promise<void> => {
  await delay(500);
  db = db.filter((i) => !ids.includes(i.id));
};
