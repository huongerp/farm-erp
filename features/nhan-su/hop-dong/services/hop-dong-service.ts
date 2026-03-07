import type { HopDong, PhieuThanhLy, HopDongFormValues, PhieuThanhLyFormValues } from '../core/types';
import { SO_HOP_DONG_PREFIX, SO_PHIEU_THANH_LY_PREFIX } from '../core/constants';
import { MOCK_HOP_DONG, MOCK_PHIEU_THANH_LY } from '@/mocks/nhan-su';
import { getUngViens } from '@/features/nhan-su/ung-vien/services/ung-vien-service';
import i18n from '../../../../lib/i18n';

type RawHopDong = Omit<HopDong, 'ten_ung_vien'>;

let dbHopDong: RawHopDong[] = JSON.parse(JSON.stringify(MOCK_HOP_DONG));
let dbPhieuThanhLy: PhieuThanhLy[] = JSON.parse(JSON.stringify(MOCK_PHIEU_THANH_LY));

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function enrichHopDongs(items: RawHopDong[]): Promise<HopDong[]> {
  const ungViens = await getUngViens();
  const byId = new Map(ungViens.map((u) => [u.id, u.ho_ten]));
  return items.map((item) => ({
    ...item,
    ten_ung_vien: byId.get(item.id_ung_vien),
  }));
}

function getNextSoHopDong(loai: 'thu-viec' | 'chinh-thuc'): string {
  const prefix = SO_HOP_DONG_PREFIX[loai];
  const year = new Date().getFullYear();
  const pattern = new RegExp(`^${prefix}-${year}-(\\d+)$`);
  let max = 0;
  dbHopDong.forEach((h) => {
    const m = h.so_hop_dong.match(pattern);
    if (m) max = Math.max(max, parseInt(m[1], 10));
  });
  return `${prefix}-${year}-${String(max + 1).padStart(3, '0')}`;
}

function getNextSoPhieu(): string {
  const year = new Date().getFullYear();
  const pattern = new RegExp(`^${SO_PHIEU_THANH_LY_PREFIX}-${year}-(\\d+)$`);
  let max = 0;
  dbPhieuThanhLy.forEach((p) => {
    const m = p.so_phieu.match(pattern);
    if (m) max = Math.max(max, parseInt(m[1], 10));
  });
  return `${SO_PHIEU_THANH_LY_PREFIX}-${year}-${String(max + 1).padStart(3, '0')}`;
}

export const getHopDongs = async (): Promise<HopDong[]> => {
  await delay(400);
  return enrichHopDongs([...dbHopDong]);
};

export const getPhieuThanhLyByHopDong = (id_hop_dong: string): PhieuThanhLy | undefined => {
  return dbPhieuThanhLy.find((p) => p.id_hop_dong === id_hop_dong);
};

export const getPhieuThanhLyList = async (): Promise<PhieuThanhLy[]> => {
  await delay(200);
  return [...dbPhieuThanhLy];
};

export const createHopDong = async (data: HopDongFormValues): Promise<HopDong> => {
  await delay(500);
  const now = new Date().toISOString();
  const so_hop_dong = getNextSoHopDong(data.loai_hop_dong);
  const newItem: RawHopDong = {
    id: `hd-${Date.now()}`,
    id_ung_vien: data.id_ung_vien,
    loai_hop_dong: data.loai_hop_dong,
    so_hop_dong,
    ngay_bat_dau: data.ngay_bat_dau,
    ngay_ket_thuc: data.loai_hop_dong === 'thu-viec' ? (data.ngay_ket_thuc ?? null) : null,
    id_hop_dong_goc: null,
    bac_luong: data.bac_luong ?? null,
    muc_luong: data.muc_luong ?? null,
    ngay_vao_lam: data.ngay_vao_lam ?? null,
    co_che_khac: data.co_che_khac ?? null,
    ghi_chu: data.ghi_chu ?? null,
    ghi_chu_khac: data.ghi_chu_khac ?? null,
    trang_thai: 'hieu_luc',
    tg_tao: now,
    tg_cap_nhat: now,
  };
  dbHopDong = [newItem, ...dbHopDong];
  const [enriched] = await enrichHopDongs([newItem]);
  return enriched;
};

export const createHopDongFromProbation = async (
  data: HopDongFormValues,
  id_hop_dong_goc: string
): Promise<HopDong> => {
  await delay(500);
  const now = new Date().toISOString();
  const so_hop_dong = getNextSoHopDong('chinh-thuc');
  const newItem: RawHopDong = {
    id: `hd-${Date.now()}`,
    id_ung_vien: data.id_ung_vien,
    loai_hop_dong: 'chinh-thuc',
    so_hop_dong,
    ngay_bat_dau: data.ngay_bat_dau,
    ngay_ket_thuc: null,
    id_hop_dong_goc,
    bac_luong: data.bac_luong ?? null,
    muc_luong: data.muc_luong ?? null,
    ngay_vao_lam: data.ngay_vao_lam ?? null,
    co_che_khac: data.co_che_khac ?? null,
    ghi_chu: data.ghi_chu ?? null,
    ghi_chu_khac: data.ghi_chu_khac ?? null,
    trang_thai: 'hieu_luc',
    tg_tao: now,
    tg_cap_nhat: now,
  };
  dbHopDong = [newItem, ...dbHopDong];
  const [enriched] = await enrichHopDongs([newItem]);
  return enriched;
};

export const updateHopDong = async (
  id: string,
  data: Partial<HopDongFormValues>
): Promise<HopDong> => {
  await delay(400);
  const index = dbHopDong.findIndex((i) => i.id === id);
  if (index === -1) throw new Error(i18n.t('hopDong.service.notFound'));
  const now = new Date().toISOString();
  const updated: RawHopDong = {
    ...dbHopDong[index],
    ...(data.id_ung_vien != null && { id_ung_vien: data.id_ung_vien }),
    ...(data.loai_hop_dong != null && { loai_hop_dong: data.loai_hop_dong }),
    ...(data.ngay_bat_dau != null && { ngay_bat_dau: data.ngay_bat_dau }),
    ...(data.ngay_ket_thuc !== undefined && { ngay_ket_thuc: data.ngay_ket_thuc ?? null }),
    ...(data.bac_luong !== undefined && { bac_luong: data.bac_luong ?? null }),
    ...(data.muc_luong !== undefined && { muc_luong: data.muc_luong ?? null }),
    ...(data.ngay_vao_lam !== undefined && { ngay_vao_lam: data.ngay_vao_lam ?? null }),
    ...(data.co_che_khac !== undefined && { co_che_khac: data.co_che_khac ?? null }),
    ...(data.ghi_chu !== undefined && { ghi_chu: data.ghi_chu ?? null }),
    ...(data.ghi_chu_khac !== undefined && { ghi_chu_khac: data.ghi_chu_khac ?? null }),
    tg_cap_nhat: now,
  };
  dbHopDong[index] = updated;
  const [enriched] = await enrichHopDongs([updated]);
  return enriched;
};

export const deleteHopDongs = async (ids: string[]): Promise<void> => {
  await delay(300);
  const set = new Set(ids);
  dbHopDong = dbHopDong.filter((i) => !set.has(i.id));
  dbPhieuThanhLy = dbPhieuThanhLy.filter((p) => !set.has(p.id_hop_dong));
};

export const createPhieuThanhLy = async (
  data: PhieuThanhLyFormValues
): Promise<PhieuThanhLy> => {
  await delay(500);
  const so_phieu = getNextSoPhieu();
  const now = new Date().toISOString();
  const newPhieu: PhieuThanhLy = {
    id: `ptl-${Date.now()}`,
    id_hop_dong: data.id_hop_dong,
    so_phieu,
    ngay_thanh_ly: data.ngay_thanh_ly,
    ly_do: data.ly_do,
    ghi_chu: data.ghi_chu ?? null,
    tg_tao: now,
    tg_cap_nhat: now,
  };
  dbPhieuThanhLy = [...dbPhieuThanhLy, newPhieu];
  const hdIndex = dbHopDong.findIndex((h) => h.id === data.id_hop_dong);
  if (hdIndex !== -1) {
    dbHopDong[hdIndex] = { ...dbHopDong[hdIndex], trang_thai: 'thanh_ly', tg_cap_nhat: now };
  }
  return newPhieu;
};
