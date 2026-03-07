import type { ThuGuiUngVien, ThuGuiUngVienFormValues } from '../core/types';
import { MOCK_THU_GUI_UNG_VIEN } from '@/mocks/nhan-su';
import { getUngViens } from '@/features/nhan-su/ung-vien/services/ung-vien-service';
import i18n from '../../../../lib/i18n';

type RawItem = Omit<ThuGuiUngVien, 'ten_ung_vien'>;

let db: RawItem[] = JSON.parse(JSON.stringify(MOCK_THU_GUI_UNG_VIEN));

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function enrich(items: RawItem[]): Promise<ThuGuiUngVien[]> {
  const ungViens = await getUngViens();
  const byId = new Map(ungViens.map((u) => [u.id, u.ho_ten]));
  return items.map((item) => ({
    ...item,
    ten_ung_vien: byId.get(item.id_ung_vien),
  }));
}

export const getThuGuiUngViens = async (): Promise<ThuGuiUngVien[]> => {
  await delay(400);
  return enrich([...db]);
};

export const createThuGuiUngVien = async (data: ThuGuiUngVienFormValues): Promise<ThuGuiUngVien> => {
  await delay(500);
  const now = new Date().toISOString();
  const newItem: RawItem = {
    id: `tguv-${Date.now()}`,
    id_ung_vien: data.id_ung_vien,
    loai_thu: data.loai_thu,
    ghi_chu: data.ghi_chu ?? null,
    ngay_vao_lam: data.ngay_vao_lam ?? null,
    bac_luong: data.bac_luong ?? null,
    muc_luong: data.muc_luong ?? null,
    co_che_khac: data.co_che_khac ?? null,
    ghi_chu_khac: data.ghi_chu_khac ?? null,
    tg_tao: now,
    tg_cap_nhat: now,
  };
  db = [newItem, ...db];
  const [enriched] = await enrich([newItem]);
  return enriched;
};

export const updateThuGuiUngVien = async (
  id: string,
  data: Partial<ThuGuiUngVienFormValues>
): Promise<ThuGuiUngVien> => {
  await delay(400);
  const index = db.findIndex((i) => i.id === id);
  if (index === -1) throw new Error(i18n.t('thuGuiUngVien.service.notFound'));
  const now = new Date().toISOString();
  const updated: RawItem = {
    ...db[index],
    ...(data.id_ung_vien != null && { id_ung_vien: data.id_ung_vien }),
    ...(data.loai_thu != null && { loai_thu: data.loai_thu }),
    ...(data.ghi_chu !== undefined && { ghi_chu: data.ghi_chu ?? null }),
    ...(data.ngay_vao_lam !== undefined && { ngay_vao_lam: data.ngay_vao_lam ?? null }),
    ...(data.bac_luong !== undefined && { bac_luong: data.bac_luong ?? null }),
    ...(data.muc_luong !== undefined && { muc_luong: data.muc_luong ?? null }),
    ...(data.co_che_khac !== undefined && { co_che_khac: data.co_che_khac ?? null }),
    ...(data.ghi_chu_khac !== undefined && { ghi_chu_khac: data.ghi_chu_khac ?? null }),
    tg_cap_nhat: now,
  };
  db[index] = updated;
  const [enriched] = await enrich([updated]);
  return enriched;
};

export const deleteThuGuiUngViens = async (ids: string[]): Promise<void> => {
  await delay(300);
  const set = new Set(ids);
  db = db.filter((i) => !set.has(i.id));
};
