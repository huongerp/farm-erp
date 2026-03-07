import type { KhoaDaoTao } from '../core/types';
import type { KhoaDaoTaoFormValues } from '../core/schema';
import { MOCK_KHOA_DAO_TAO, MOCK_LOAI_KHOA_HOC } from '@/mocks/nhan-su';
import { getThongKeTheoKhoaHoc } from '../thiet-lap/services/thiet-lap-khoa-service';
import i18n from '../../../../lib/i18n';

type RawKhoaDaoTao = Omit<KhoaDaoTao, 'ten_loai_khoa_hoc' | 'so_chuong' | 'so_bai_hoc' | 'so_bai_test'>;

let db: RawKhoaDaoTao[] = JSON.parse(JSON.stringify(MOCK_KHOA_DAO_TAO));

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

function enrichWithTenLoai(
  items: RawKhoaDaoTao[],
  thongKe: Record<string, { so_chuong: number; so_bai_hoc: number; so_bai_test: number }>
): KhoaDaoTao[] {
  const byId = new Map(MOCK_LOAI_KHOA_HOC.map((l) => [l.id, l.ten]));
  return items.map((item) => {
    const stats = thongKe[item.id];
    return {
      ...item,
      ten_loai_khoa_hoc: byId.get(item.id_loai_khoa_hoc),
      id_chuc_vu_xem: item.id_chuc_vu_xem ?? [],
      so_chuong: stats?.so_chuong ?? 0,
      so_bai_hoc: stats?.so_bai_hoc ?? 0,
      so_bai_test: stats?.so_bai_test ?? 0,
    };
  });
}

export const getKhoaDaoTaos = async (): Promise<KhoaDaoTao[]> => {
  await delay(400);
  const [thongKe] = await Promise.all([getThongKeTheoKhoaHoc()]);
  return enrichWithTenLoai([...db], thongKe);
};

export const createKhoaDaoTao = async (data: KhoaDaoTaoFormValues): Promise<KhoaDaoTao> => {
  await delay(500);
  const now = new Date().toISOString();
  const newItem: RawKhoaDaoTao = {
    id: `kdt-${Date.now()}`,
    ma: data.ma,
    ten: data.ten,
    id_loai_khoa_hoc: data.id_loai_khoa_hoc,
    mo_ta: data.mo_ta ?? null,
    thoi_luong: data.thoi_luong,
    ngay_bat_dau: data.ngay_bat_dau,
    ngay_ket_thuc: data.ngay_ket_thuc,
    dia_diem: data.dia_diem ?? null,
    link_online: data.link_online ?? null,
    trang_thai: data.trang_thai as KhoaDaoTao['trang_thai'],
    so_luong_toi_da: data.so_luong_toi_da ?? null,
    giang_vien: data.giang_vien ?? null,
    ghi_chu: data.ghi_chu ?? null,
    id_chuc_vu_xem: data.id_chuc_vu_xem ?? [],
    tg_tao: now,
    tg_cap_nhat: now,
  };
  db = [newItem, ...db];
  const thongKe = await getThongKeTheoKhoaHoc();
  const [enriched] = enrichWithTenLoai([newItem], thongKe);
  return enriched;
};

export const updateKhoaDaoTao = async (
  id: string,
  data: Partial<KhoaDaoTaoFormValues>
): Promise<KhoaDaoTao> => {
  await delay(400);
  const index = db.findIndex((i) => i.id === id);
  if (index === -1) throw new Error(i18n.t('khoaDaoTao.service.notFound'));
  const now = new Date().toISOString();
  const updated: RawKhoaDaoTao = {
    ...db[index],
    ...(data.ma != null && { ma: data.ma }),
    ...(data.ten != null && { ten: data.ten }),
    ...(data.id_loai_khoa_hoc != null && { id_loai_khoa_hoc: data.id_loai_khoa_hoc }),
    ...(data.mo_ta !== undefined && { mo_ta: data.mo_ta ?? null }),
    ...(data.thoi_luong != null && { thoi_luong: data.thoi_luong }),
    ...(data.ngay_bat_dau != null && { ngay_bat_dau: data.ngay_bat_dau }),
    ...(data.ngay_ket_thuc != null && { ngay_ket_thuc: data.ngay_ket_thuc }),
    ...(data.dia_diem !== undefined && { dia_diem: data.dia_diem ?? null }),
    ...(data.link_online !== undefined && { link_online: data.link_online ?? null }),
    ...(data.trang_thai != null && { trang_thai: data.trang_thai as KhoaDaoTao['trang_thai'] }),
    ...(data.so_luong_toi_da !== undefined && { so_luong_toi_da: data.so_luong_toi_da ?? null }),
    ...(data.giang_vien !== undefined && { giang_vien: data.giang_vien ?? null }),
    ...(data.ghi_chu !== undefined && { ghi_chu: data.ghi_chu ?? null }),
    ...(data.id_chuc_vu_xem !== undefined && { id_chuc_vu_xem: data.id_chuc_vu_xem ?? [] }),
    tg_cap_nhat: now,
  };
  db[index] = updated;
  const thongKe = await getThongKeTheoKhoaHoc();
  const [enriched] = enrichWithTenLoai([updated], thongKe);
  return enriched;
};

export const updateKhoaDaoTaoPhanQuyen = async (
  id: string,
  id_chuc_vu_xem: string[]
): Promise<KhoaDaoTao> => {
  await delay(400);
  const index = db.findIndex((i) => i.id === id);
  if (index === -1) throw new Error(i18n.t('khoaDaoTao.service.notFound'));
  const now = new Date().toISOString();
  const updated: RawKhoaDaoTao = { ...db[index], id_chuc_vu_xem, tg_cap_nhat: now };
  db[index] = updated;
  const thongKe = await getThongKeTheoKhoaHoc();
  const [enriched] = enrichWithTenLoai([updated], thongKe);
  return enriched;
};

export const deleteKhoaDaoTaos = async (ids: string[]): Promise<void> => {
  await delay(300);
  const set = new Set(ids);
  db = db.filter((i) => !set.has(i.id));
};
