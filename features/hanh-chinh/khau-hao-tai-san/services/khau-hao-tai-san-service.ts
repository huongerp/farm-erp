import type { KyKhauHao, ChiTietKhauHao, KyKhauHaoCreate, TrangThaiKyKhauHao } from '../core/types';
import { getTaiSanList } from '../../danh-muc-tai-san/services/danh-muc-tai-san-service';
import { updateTaiSanKhauHao } from '../../danh-muc-tai-san/services/danh-muc-tai-san-service';
import { getAssetGroups } from '../../thiet-lap-tai-san/services/nhom-tai-san-service';
import type { TaiSan } from '../../danh-muc-tai-san/core/types';
import type { AssetGroup } from '../../thiet-lap-tai-san/core/types';
import i18n from '../../../../lib/i18n';

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

let dbKy: KyKhauHao[] = [
  { id: 'ky-1', thang: 1, nam: 2025, trang_thai: 'chot', tong_nguyen_gia: 100000000, tong_khau_hao_ky: 2500000, tg_tao: '2025-01-15T08:00:00Z', tg_cap_nhat: '2025-01-20T10:00:00Z' },
  { id: 'ky-2', thang: 2, nam: 2025, trang_thai: 'draft', tg_tao: '2025-02-01T08:00:00Z', tg_cap_nhat: '2025-02-01T08:00:00Z' },
];

const dbChiTiet = new Map<string, ChiTietKhauHao[]>();

function lastDayOfMonth(year: number, month: number): string {
  const d = new Date(year, month, 0);
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
}

function roundMoney(value: number): number {
  return Math.round(value);
}

/** Tính khấu hao kỳ (1 tháng) cho một tài sản theo nhóm */
function tinhKhauHaoKy(
  nguyenGia: number,
  giaTriConLaiDauKy: number,
  khauHaoLuyKeHienTai: number,
  group: AssetGroup
): { khau_hao_ky: number; khau_hao_luy_ke: number; gia_tri_con_lai_cuoi_ky: number } {
  const tyLe = group.ty_le_khau_hao ?? null;
  const soNam = group.so_nam_su_dung ?? null;
  let khauHaoNam = 0;
  if (group.phuong_phap_khau_hao === 'duong_thang') {
    if (soNam != null && soNam > 0) {
      khauHaoNam = nguyenGia / soNam;
    } else if (tyLe != null && tyLe > 0) {
      khauHaoNam = (nguyenGia * tyLe) / 100;
    }
  } else {
    if (tyLe != null && tyLe > 0) {
      khauHaoNam = (giaTriConLaiDauKy * tyLe) / 100;
    }
  }
  const khauHaoKy = roundMoney(khauHaoNam / 12);
  const giaTriConLaiCuoiKy = Math.max(0, roundMoney(giaTriConLaiDauKy - khauHaoKy));
  const khauHaoLuyKe = khauHaoLuyKeHienTai + khauHaoKy;
  return { khau_hao_ky: khauHaoKy, khau_hao_luy_ke: khauHaoLuyKe, gia_tri_con_lai_cuoi_ky: giaTriConLaiCuoiKy };
}

export const getKyKhauHaoList = async (): Promise<KyKhauHao[]> => {
  await delay(500);
  return [...dbKy].sort((a, b) => (b.nam !== a.nam ? b.nam - a.nam : b.thang - a.thang));
};

export const getKyKhauHaoById = async (id: string): Promise<KyKhauHao | null> => {
  await delay(300);
  return dbKy.find((k) => k.id === id) ?? null;
};

export const createKyKhauHao = async (data: KyKhauHaoCreate): Promise<KyKhauHao> => {
  await delay(600);
  const exists = dbKy.some((k) => k.thang === data.thang && k.nam === data.nam);
  if (exists) throw new Error(i18n.t('khauHaoTaiSan.service.kyExists'));
  const now = new Date().toISOString();
  const newKy: KyKhauHao = {
    id: `ky-${Date.now()}`,
    thang: data.thang,
    nam: data.nam,
    trang_thai: 'draft',
    ghi_chu: data.ghi_chu ?? null,
    tg_tao: now,
    tg_cap_nhat: now,
  };
  dbKy = [newKy, ...dbKy];
  return newKy;
};

export const updateKyKhauHao = async (id: string, data: KyKhauHaoCreate): Promise<KyKhauHao> => {
  await delay(500);
  const ky = dbKy.find((k) => k.id === id);
  if (!ky) throw new Error(i18n.t('khauHaoTaiSan.service.kyNotFound'));
  if (ky.trang_thai === 'chot') throw new Error(i18n.t('khauHaoTaiSan.service.kyAlreadyChot'));
  const existsOther = dbKy.some(
    (k) => k.id !== id && k.thang === data.thang && k.nam === data.nam
  );
  if (existsOther) throw new Error(i18n.t('khauHaoTaiSan.service.kyExists'));
  const now = new Date().toISOString();
  const updated: KyKhauHao = {
    ...ky,
    thang: data.thang,
    nam: data.nam,
    ghi_chu: data.ghi_chu ?? ky.ghi_chu ?? null,
    tg_cap_nhat: now,
  };
  const idx = dbKy.findIndex((k) => k.id === id);
  if (idx >= 0) dbKy[idx] = updated;
  return updated;
};

export const getChiTietKhauHao = async (idKy: string): Promise<ChiTietKhauHao[]> => {
  await delay(400);
  const list = dbChiTiet.get(idKy) ?? [];
  return [...list];
};

export const tinhToanKhauHaoKy = async (idKy: string): Promise<ChiTietKhauHao[]> => {
  await delay(800);
  const ky = dbKy.find((k) => k.id === idKy);
  if (!ky) throw new Error(i18n.t('khauHaoTaiSan.service.kyNotFound'));
  if (ky.trang_thai === 'chot') throw new Error(i18n.t('khauHaoTaiSan.service.kyAlreadyChot'));
  const [taiSanList, groups] = await Promise.all([getTaiSanList(), getAssetGroups()]);
  const groupMap = new Map<string, AssetGroup>(groups.map((g) => [g.id, g]));
  const endDate = lastDayOfMonth(ky.nam, ky.thang);
  const eligible: TaiSan[] = taiSanList.filter((ts) => {
    if (ts.trang_thai !== 1) return false;
    const nguyenGia = ts.nguyen_gia ?? 0;
    if (nguyenGia <= 0) return false;
    const ngayBatDau = ts.ngay_bat_dau_trich_khau_hao ?? ts.ngay_nhap ?? '';
    if (!ngayBatDau || ngayBatDau > endDate) return false;
    const group = groupMap.get(ts.id_nhom);
    if (!group) return false;
    const hasRate = (group.ty_le_khau_hao != null && group.ty_le_khau_hao > 0) || (group.so_nam_su_dung != null && group.so_nam_su_dung > 0);
    return hasRate;
  });
  const now = new Date().toISOString();
  const chiTietList: ChiTietKhauHao[] = [];
  let tongNguyenGia = 0;
  let tongKhauHaoKy = 0;
  for (const ts of eligible) {
    const group = groupMap.get(ts.id_nhom)!;
    const nguyenGia = ts.nguyen_gia ?? 0;
    const giaTriDauKy = ts.gia_tri_con_lai ?? nguyenGia;
    const khauHaoLuyKeHienTai = ts.khau_hao_luy_ke ?? 0;
    const { khau_hao_ky, khau_hao_luy_ke, gia_tri_con_lai_cuoi_ky } = tinhKhauHaoKy(
      nguyenGia,
      giaTriDauKy,
      khauHaoLuyKeHienTai,
      group
    );
    tongNguyenGia += nguyenGia;
    tongKhauHaoKy += khau_hao_ky;
    chiTietList.push({
      id: `ct-${idKy}-${ts.id}-${Date.now()}`,
      id_ky_khau_hao: idKy,
      id_tai_san: ts.id,
      ma_tai_san: ts.ma_tai_san,
      ten_tai_san: ts.ten_tai_san,
      id_nhom: ts.id_nhom,
      ten_nhom: ts.ten_nhom ?? undefined,
      nguyen_gia: nguyenGia,
      gia_tri_con_lai_dau_ky: giaTriDauKy,
      khau_hao_ky,
      khau_hao_luy_ke,
      gia_tri_con_lai_cuoi_ky,
      ten_noi_luu: ts.ten_noi_luu ?? null,
      ten_nguoi_giu: ts.ten_nhan_vien_dang_giu ?? null,
      tg_tao: now,
      tg_cap_nhat: now,
    });
  }
  dbChiTiet.set(idKy, chiTietList);
  const kyIndex = dbKy.findIndex((k) => k.id === idKy);
  if (kyIndex >= 0) {
    dbKy[kyIndex] = { ...dbKy[kyIndex], tong_nguyen_gia: tongNguyenGia, tong_khau_hao_ky: tongKhauHaoKy, tg_cap_nhat: now };
  }
  return chiTietList;
};

export const chotKy = async (idKy: string): Promise<void> => {
  await delay(600);
  const ky = dbKy.find((k) => k.id === idKy);
  if (!ky) throw new Error(i18n.t('khauHaoTaiSan.service.kyNotFound'));
  if (ky.trang_thai === 'chot') throw new Error(i18n.t('khauHaoTaiSan.service.kyAlreadyChot'));
  const chiTiet = dbChiTiet.get(idKy);
  if (!chiTiet || chiTiet.length === 0) throw new Error(i18n.t('khauHaoTaiSan.service.chotRequiresTinhToan'));
  const now = new Date().toISOString();
  for (const ct of chiTiet) {
    await updateTaiSanKhauHao(ct.id_tai_san, {
      gia_tri_con_lai: ct.gia_tri_con_lai_cuoi_ky,
      khau_hao_luy_ke: ct.khau_hao_luy_ke,
    });
  }
  const kyIndex = dbKy.findIndex((k) => k.id === idKy);
  if (kyIndex >= 0) {
    dbKy[kyIndex] = { ...dbKy[kyIndex], trang_thai: 'chot' as TrangThaiKyKhauHao, tg_cap_nhat: now };
  }
};

export const deleteKyKhauHao = async (id: string): Promise<void> => {
  await delay(400);
  const ky = dbKy.find((k) => k.id === id);
  if (ky?.trang_thai === 'chot') throw new Error(i18n.t('khauHaoTaiSan.service.cannotDeleteChot'));
  dbKy = dbKy.filter((k) => k.id !== id);
  dbChiTiet.delete(id);
};

/** Chỉ cập nhật ghi chú (cho phép cả kỳ đã chốt). */
export const updateKyKhauHaoGhiChu = async (id: string, ghi_chu: string | null): Promise<KyKhauHao> => {
  await delay(400);
  const ky = dbKy.find((k) => k.id === id);
  if (!ky) throw new Error(i18n.t('khauHaoTaiSan.service.kyNotFound'));
  const now = new Date().toISOString();
  const updated: KyKhauHao = { ...ky, ghi_chu: ghi_chu ?? null, tg_cap_nhat: now };
  const idx = dbKy.findIndex((k) => k.id === id);
  if (idx >= 0) dbKy[idx] = updated;
  return updated;
};

/** Chuyển trạng thái kỳ — chỉ hỗ trợ chốt → nháp (hoàn tác). */
export const updateKyKhauHaoTrangThai = async (
  id: string,
  trang_thai: TrangThaiKyKhauHao
): Promise<KyKhauHao> => {
  await delay(400);
  const ky = dbKy.find((k) => k.id === id);
  if (!ky) throw new Error(i18n.t('khauHaoTaiSan.service.kyNotFound'));
  if (trang_thai === 'chot') throw new Error(i18n.t('khauHaoTaiSan.service.useChotKy'));
  if (ky.trang_thai !== 'chot') throw new Error(i18n.t('khauHaoTaiSan.service.onlyRevertChot'));
  const now = new Date().toISOString();
  const updated: KyKhauHao = { ...ky, trang_thai: 'draft' as TrangThaiKyKhauHao, tg_cap_nhat: now };
  const idx = dbKy.findIndex((k) => k.id === id);
  if (idx >= 0) dbKy[idx] = updated;
  return updated;
};
