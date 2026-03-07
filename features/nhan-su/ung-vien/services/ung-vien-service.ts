import type { UngVien } from '../core/types';
import type { UngVienFormValues } from '../core/schema';
import { MOCK_UNG_VIEN } from '@/mocks/nhan-su';
import { getTrangThaiUngViens } from '@/features/nhan-su/thiet-lap-tuyen-dung/services/trang-thai-ung-vien-service';
import { getKenhTuyenDungs } from '@/features/nhan-su/thiet-lap-tuyen-dung/services/kenh-tuyen-dung-service';
import { getDeXuatTuyenDungs } from '@/features/nhan-su/de-xuat-tuyen-dung/services/de-xuat-tuyen-dung-service';
import i18n from '../../../../lib/i18n';

type RawItem = Omit<UngVien, 'ma_de_xuat' | 'ten_chuc_vu' | 'ten_trang_thai' | 'ten_kenh_tuyen_dung'>;

let db: RawItem[] = JSON.parse(JSON.stringify(MOCK_UNG_VIEN));

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function enrich(items: RawItem[]): Promise<UngVien[]> {
  const [trangThaiList, kenhList, deXuatList] = await Promise.all([
    getTrangThaiUngViens(),
    getKenhTuyenDungs(),
    getDeXuatTuyenDungs(),
  ]);
  const byTrangThai = new Map(trangThaiList.map((t) => [t.id, t.ten]));
  const byKenh = new Map(kenhList.map((k) => [k.id, k.ten]));
  const byDeXuat = new Map(deXuatList.map((d) => [d.id, { ma_de_xuat: d.ma_de_xuat, ten_chuc_vu: d.ten_chuc_vu }]));
  return items.map((item) => {
    const dx = byDeXuat.get(item.id_de_xuat_tuyen_dung);
    return {
      ...item,
      ten_trang_thai: byTrangThai.get(item.id_trang_thai_ung_vien),
      ten_kenh_tuyen_dung: item.id_kenh_tuyen_dung ? byKenh.get(item.id_kenh_tuyen_dung) : undefined,
      ma_de_xuat: dx?.ma_de_xuat,
      ten_chuc_vu: dx?.ten_chuc_vu,
    };
  });
}

export const getUngViens = async (): Promise<UngVien[]> => {
  await delay(500);
  return enrich([...db]);
};

export const getUngVienById = async (id: string): Promise<UngVien | null> => {
  await delay(300);
  const item = db.find((i) => i.id === id);
  if (!item) return null;
  const [enriched] = await enrich([item]);
  return enriched;
};

export const createUngVien = async (data: UngVienFormValues): Promise<UngVien> => {
  await delay(600);
  const now = new Date().toISOString();
  const newItem: RawItem = {
    id: `uv-${Date.now()}`,
    ho_ten: data.ho_ten,
    email: data.email,
    so_dien_thoai: data.so_dien_thoai ?? '',
    dia_chi: data.dia_chi ?? null,
    ngay_sinh: data.ngay_sinh ?? null,
    ghi_chu_noi_bo: data.ghi_chu_noi_bo ?? null,
    id_de_xuat_tuyen_dung: data.id_de_xuat_tuyen_dung,
    id_trang_thai_ung_vien: data.id_trang_thai_ung_vien,
    id_kenh_tuyen_dung: data.id_kenh_tuyen_dung ?? null,
    ngay_phong_van_gan_nhat: data.ngay_phong_van_gan_nhat ?? null,
    ket_qua_phan_hoi_gan_nhat: data.ket_qua_phan_hoi_gan_nhat ?? null,
    tai_lieu: data.tai_lieu ?? [],
    tg_tao: now,
    tg_cap_nhat: now,
  };
  db = [newItem, ...db];
  const [enriched] = await enrich([newItem]);
  return enriched;
};

export const updateUngVien = async (id: string, data: UngVienFormValues): Promise<UngVien> => {
  await delay(600);
  const index = db.findIndex((i) => i.id === id);
  if (index === -1) throw new Error(i18n.t('ungVien.service.notFound'));
  const updated: RawItem = {
    ...db[index],
    ho_ten: data.ho_ten,
    email: data.email,
    so_dien_thoai: data.so_dien_thoai ?? '',
    dia_chi: data.dia_chi ?? null,
    ngay_sinh: data.ngay_sinh ?? null,
    ghi_chu_noi_bo: data.ghi_chu_noi_bo ?? null,
    id_de_xuat_tuyen_dung: data.id_de_xuat_tuyen_dung,
    id_trang_thai_ung_vien: data.id_trang_thai_ung_vien,
    id_kenh_tuyen_dung: data.id_kenh_tuyen_dung ?? null,
    ngay_phong_van_gan_nhat: data.ngay_phong_van_gan_nhat ?? null,
    ket_qua_phan_hoi_gan_nhat: data.ket_qua_phan_hoi_gan_nhat ?? null,
    tai_lieu: data.tai_lieu ?? [],
    tg_cap_nhat: new Date().toISOString(),
  };
  db[index] = updated;
  const [enriched] = await enrich([updated]);
  return enriched;
};

export const deleteUngViens = async (ids: string[]): Promise<void> => {
  await delay(400);
  const set = new Set(ids);
  db = db.filter((i) => !set.has(i.id));
};
