import type { DeXuatTuyenDung } from '../core/types';
import type { DeXuatTuyenDungFormValues } from '../core/schema';
import { MOCK_DE_XUAT_TUYEN_DUNG } from '@/mocks/nhan-su';
import { getPositions } from '@/features/he-thong/chuc-vu/services/chuc-vu-service';
import i18n from '../../../../lib/i18n';

type RawItem = Omit<DeXuatTuyenDung, 'ten_chuc_vu' | 'ten_phong_ban'>;

let db: RawItem[] = JSON.parse(JSON.stringify(MOCK_DE_XUAT_TUYEN_DUNG));

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function enrich(items: RawItem[]): Promise<DeXuatTuyenDung[]> {
  const positions = await getPositions();
  const byId = new Map(positions.map((p) => [p.id, p]));
  return items.map((item) => {
    const pos = byId.get(item.id_chuc_vu);
    return {
      ...item,
      ten_chuc_vu: pos?.ten_chuc_vu,
      ten_phong_ban: pos?.ten_phong_ban,
    };
  });
}

export const getDeXuatTuyenDungs = async (): Promise<DeXuatTuyenDung[]> => {
  await delay(600);
  return enrich([...db]);
};

export const createDeXuatTuyenDung = async (
  data: DeXuatTuyenDungFormValues
): Promise<DeXuatTuyenDung> => {
  await delay(800);
  const now = new Date().toISOString();
  const newItem: RawItem = {
    id: `dx-${Date.now()}`,
    id_chuc_vu: data.id_chuc_vu,
    ma_de_xuat: data.ma_de_xuat,
    tieu_de: data.tieu_de ?? null,
    mo_ta: data.mo_ta,
    yeu_cau: data.yeu_cau,
    link_tuyen: data.link_tuyen,
    so_luong: data.so_luong,
    so_luong_da_tuyen: data.so_luong_da_tuyen ?? 0,
    han_nop: data.han_nop ?? null,
    trang_thai: data.trang_thai as 0 | 1 | 2 | 3,
    ghi_chu: null,
    tg_tao: now,
    tg_cap_nhat: now,
  };
  db = [newItem, ...db];
  const [enriched] = await enrich([newItem]);
  return enriched;
};

export const updateDeXuatTuyenDung = async (
  id: string,
  data: DeXuatTuyenDungFormValues
): Promise<DeXuatTuyenDung> => {
  await delay(800);
  const index = db.findIndex((i) => i.id === id);
  if (index === -1) throw new Error(i18n.t('deXuatTuyenDung.service.notFound'));
  const updated: RawItem = {
    ...db[index],
    id_chuc_vu: data.id_chuc_vu,
    ma_de_xuat: data.ma_de_xuat,
    tieu_de: data.tieu_de ?? null,
    mo_ta: data.mo_ta,
    yeu_cau: data.yeu_cau,
    link_tuyen: data.link_tuyen,
    so_luong: data.so_luong,
    so_luong_da_tuyen: data.so_luong_da_tuyen ?? 0,
    han_nop: data.han_nop ?? null,
    trang_thai: data.trang_thai as 0 | 1 | 2 | 3,
    ghi_chu: db[index].ghi_chu ?? null,
    tg_cap_nhat: new Date().toISOString(),
  };
  db[index] = updated;
  const [enriched] = await enrich([updated]);
  return enriched;
};

export const updateDeXuatTuyenDungStatus = async (
  ids: string[],
  status: 0 | 1 | 2 | 3
): Promise<void> => {
  await delay(600);
  db = db.map((i) =>
    ids.includes(i.id) ? { ...i, trang_thai: status, tg_cap_nhat: new Date().toISOString() } : i
  );
};

/** Cập nhật trạng thái + ghi chú cho một đề xuất (dùng trong detail toolbar). */
export const updateDeXuatTuyenDungStatusWithNote = async (
  id: string,
  status: 0 | 1 | 2 | 3,
  ghi_chu: string | null
): Promise<DeXuatTuyenDung> => {
  await delay(600);
  const index = db.findIndex((i) => i.id === id);
  if (index === -1) throw new Error(i18n.t('deXuatTuyenDung.service.notFound'));
  const updated: RawItem = {
    ...db[index],
    trang_thai: status,
    ghi_chu: ghi_chu ?? null,
    tg_cap_nhat: new Date().toISOString(),
  };
  db[index] = updated;
  const [enriched] = await enrich([updated]);
  return enriched;
};

export const deleteDeXuatTuyenDungs = async (ids: string[]): Promise<void> => {
  await delay(600);
  db = db.filter((i) => !ids.includes(i.id));
};
