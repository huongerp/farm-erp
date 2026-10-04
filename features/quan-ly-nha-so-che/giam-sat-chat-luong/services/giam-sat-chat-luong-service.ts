import type { PaginatedTableResult } from '../../../../lib/db';
import { getEmployeesRef } from '../../../he-thong/nhan-vien/services/nhan-vien-service';
import type { GiamSatChatLuong, KetLuanGscl, ThungMau, TrangThaiGscl } from '../core/types';
import type { GiamSatChatLuongListServerQuery } from './giam-sat-chat-luong-list-query';
import { getGsclByIdDb, getGsclPageDb, getGsclTomTatDb, getThungDb } from './giam-sat-chat-luong-db.service';

export {
  createGsclDb as createGscl,
  updateGsclDb as updateGscl,
  deleteGsclDb as deleteGscl,
  deleteGsclManyDb as deleteGsclMany,
  huyGsclDb as huyGscl,
  khoiPhucGsclDb as khoiPhucGscl,
  apDungTieuChiMoiDb as apDungTieuChiMoi,
  getThungTheoMaTemDb as getThungTheoMaTem,
  luuKetQuaThungDb as luuKetQuaThung,
  getTieuChiDb as getTieuChi,
  createTieuChiDb as createTieuChi,
  updateTieuChiDb as updateTieuChi,
  datDangDungTieuChiDb as datDangDungTieuChi,
  deleteTieuChiDb as deleteTieuChi,
  sapXepTieuChiDb as sapXepTieuChi,
  type LuuKetQuaThungInput,
} from './giam-sat-chat-luong-db.service';

async function hoTenMap(): Promise<Map<string, string>> {
  const employees = await getEmployeesRef();
  return new Map(employees.map((e) => [String(e.id), e.ho_ten]));
}

const ten = (m: Map<string, string>, id: string | null) => (id ? (m.get(id) ?? null) : null);

async function enrich(items: GiamSatChatLuong[]): Promise<GiamSatChatLuong[]> {
  if (items.length === 0) return items;
  const m = await hoTenMap();
  return items.map((i) => ({ ...i, ten_nguoi_tao: ten(m, i.id_nguoi_tao) }));
}

export async function getGsclPage(
  query: GiamSatChatLuongListServerQuery
): Promise<PaginatedTableResult<GiamSatChatLuong>> {
  const page = await getGsclPageDb(query);
  return { ...page, data: await enrich(page.data) };
}

export async function getGsclById(id: string): Promise<GiamSatChatLuong | null> {
  const row = await getGsclByIdDb(id);
  if (!row) return null;
  const [r] = await enrich([row]);
  return r;
}

export async function getThung(idPhieu: string): Promise<ThungMau[]> {
  const rows = await getThungDb(idPhieu);
  if (!rows.some((r) => r.id_nguoi_kiem)) return rows;
  const m = await hoTenMap();
  return rows.map((r) => ({ ...r, ten_nguoi_kiem: ten(m, r.id_nguoi_kiem) }));
}

/** Bản rút gọn: chip lọc năm/tháng/trạng thái/kết luận/farm/thành phẩm. */
export interface GsclTomTat {
  id: string;
  ngay: string;
  id_chi_nhanh: string | null;
  id_hang_hoa: string | null;
  trang_thai: TrangThaiGscl;
  ket_luan: KetLuanGscl | null;
  id_nguoi_tao: string | null;
}

export async function getGsclTomTat(viewAll: boolean, allowedBranchIds: string[]): Promise<GsclTomTat[]> {
  const rows = await getGsclTomTatDb(viewAll, allowedBranchIds);
  const s = (v: number | null) => (v != null ? String(v) : null);
  return rows.map((r) => ({
    id: String(r.id),
    ngay: r.ngay,
    id_chi_nhanh: s(r.id_chi_nhanh),
    id_hang_hoa: s(r.id_hang_hoa),
    trang_thai: r.trang_thai,
    ket_luan: r.ket_luan,
    id_nguoi_tao: s(r.id_nguoi_tao),
  }));
}
