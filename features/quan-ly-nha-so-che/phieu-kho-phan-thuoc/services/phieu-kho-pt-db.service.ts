/**
 * Phiếu kho phân thuốc — DB: (fp_farm_phieu_kho_phan_thuoc + chi tiết + views).
 */
import { db, fetchTablePage, type PaginatedTableResult, throwDbError } from '../../../../lib/db';
import type {
  PhieuKhoPT,
  PhieuKhoPTChiTiet,
  LoaiPhieuKhoPT,
  ChiTietPhieuKhoPTFlat,
  TrangThaiPhieuKhoPT,
} from '../core/types';
import type { PhieuKhoPTFormValues } from '../core/schema';
import i18n from '../../../../lib/i18n';
import { getKhoRef } from '../../../kho-van/danh-sach-kho/services/kho-service';
import { getAllFarmHangHoa } from '../../hang-hoa-phan-thuoc/services/farm-hang-hoa-service';
import { getEmployeesRef } from '../../../he-thong/nhan-vien/services/nhan-vien-service';
import { postgrestQuotedIlikePattern } from '../../../../lib/postgrest-or-ilike';
import type { ChiTietPhieuKhoPTListServerQuery, PhieuKhoPTListServerQuery } from './phieu-kho-pt-list-query';
import { formatDbError } from '../../../../lib/db-errors';
import { chunkBy } from '../../../../lib/import-bulk';
import { normalizeText } from '../../../../lib/import-common';
import type { ImportErrorRow } from '../../../../lib/import-types';
import { planPhieuKhoPTImport, type ExistingSoPhieu, type PhieuKhoPTImportRow } from '../utils/import-phieu-kho-pt';
import {
  applyDelta,
  buildTonMap,
  findVuotTon,
  khoCanKiemTra,
  phieuDelta,
  type TonMap,
  type VuotTon,
} from '../utils/ton-kho-check';
import { getTonKhoPTMatrixByKhoIds } from '../../ton-kho-phan-thuoc/services/farm-ton-kho-pt';

const TABLE_PHIEU = 'fp_farm_phieu_kho_phan_thuoc';
const TABLE_CHI_TIET = 'fp_farm_phieu_kho_phan_thuoc_chi_tiet';
const VIEW_SUMMARY = 'v_farm_phieu_kho_phan_thuoc_summary';
const VIEW_FLAT = 'v_farm_phieu_kho_phan_thuoc_chi_tiet_flat';

const PHIEU_PT_CHI_TIET_ROW_SELECT =
  'id, id_phieu_kho, id_hang_hoa, ten_hang_hoa, don_vi_tinh, pham_cap, so_luong, don_gia, thanh_tien, so_lot, ghi_chu, nguoi_tao_id, ten_nguoi_tao, tg_tao, tg_cap_nhat';

const PHIEU_PT_SUMMARY_SELECT =
  'id, so_phieu, ngay, loai, kho_id, ten_kho, kho_den_id, ten_kho_den, trang_thai, mo_ta, id_nguoi_duyet, nguoi_tao_id, ten_nguoi_tao, id_de_xuat_mua_hang, so_phieu_de_xuat, tg_tao, tg_cap_nhat, so_dong, tong_so_luong, tong_tien, ref_ten_kho, ref_ten_kho_den, ref_ten_nguoi_tao, ref_ten_nguoi_duyet';

const PHIEU_PT_HEADER_ROW_SELECT =
  'id, so_phieu, ngay, loai, kho_id, ten_kho, kho_den_id, ten_kho_den, trang_thai, mo_ta, trao_doi, id_nguoi_duyet, nguoi_tao_id, ten_nguoi_tao, id_de_xuat_mua_hang, so_phieu_de_xuat, tg_tao, tg_cap_nhat';

interface PhieuKhoPTDbRow {
  id: number;
  so_phieu: string;
  ngay: string;
  loai: string;
  kho_id: number;
  ten_kho: string | null;
  kho_den_id: number | null;
  ten_kho_den: string | null;
  trang_thai: string;
  mo_ta?: string | null;
  trao_doi?: string | null;
  id_nguoi_duyet?: number | null;
  nguoi_tao_id: number | null;
  ten_nguoi_tao: string | null;
  id_de_xuat_mua_hang?: number | null;
  so_phieu_de_xuat?: string | null;
  tg_tao: string | null;
  tg_cap_nhat: string | null;
}

interface ChiTietDbRow {
  id: number;
  id_phieu_kho: number;
  id_hang_hoa: number;
  ten_hang_hoa: string | null;
  don_vi_tinh: string | null;
  pham_cap: string | null;
  so_luong: number;
  don_gia: number | null;
  thanh_tien: number | null;
  so_lot: string | null;
  ghi_chu: string | null;
  nguoi_tao_id: number | null;
  ten_nguoi_tao: string | null;
  tg_tao: string | null;
  tg_cap_nhat: string | null;
}

type PhieuKhoPTSummaryRow = PhieuKhoPTDbRow & {
  so_dong: number;
  tong_so_luong: number | string | null;
  tong_tien: number | string | null;
  ref_ten_kho?: string | null;
  ref_ten_kho_den?: string | null;
  ref_ten_nguoi_tao?: string | null;
  ref_ten_nguoi_duyet?: string | null;
};

function mapPhieuKhoPTSummaryRowToPhieu(row: PhieuKhoPTSummaryRow): PhieuKhoPT {
  const ten_kho = row.ref_ten_kho ?? row.ten_kho ?? undefined;
  const ten_kho_den = row.kho_den_id != null ? (row.ref_ten_kho_den ?? row.ten_kho_den ?? undefined) : undefined;
  const ten_nguoi_tao = row.nguoi_tao_id != null ? (row.ten_nguoi_tao ?? row.ref_ten_nguoi_tao ?? undefined) : undefined;
  const ten_nguoi_duyet = row.id_nguoi_duyet != null ? (row.ref_ten_nguoi_duyet ?? undefined) : undefined;
  const phieu = rowToPhieu(row as PhieuKhoPTDbRow, { ten_kho, ten_kho_den, ten_nguoi_tao, ten_nguoi_duyet });
  phieu.tong_so_dong = Number(row.so_dong) || 0;
  phieu.tong_so_luong = Number(row.tong_so_luong) || 0;
  phieu.tong_tien = Number(row.tong_tien) || 0;
  return phieu;
}

interface PhieuKhoPTChiTietFlatViewRow {
  chi_tiet_id: number;
  id_phieu_kho: number;
  id_hang_hoa: number;
  ten_hang_hoa: string | null;
  don_vi_tinh: string | null;
  pham_cap: string | null;
  so_luong: number | string | null;
  don_gia: number | string | null;
  thanh_tien: number | string | null;
  so_lot: string | null;
  ghi_chu: string | null;
  chi_tiet_nguoi_tao_id: number | null;
  chi_tiet_ten_nguoi_tao: string | null;
  chi_tiet_tg_tao: string | null;
  chi_tiet_tg_cap_nhat: string | null;
  phieu_id: number;
  so_phieu: string;
  ngay: string;
  loai: string;
  kho_id: number;
  ten_kho: string | null;
  kho_den_id: number | null;
  ten_kho_den: string | null;
  trang_thai: string;
  mo_ta: string | null;
  trao_doi: string | null;
  phieu_nguoi_tao_id: number | null;
  phieu_ten_nguoi_tao: string | null;
  id_nguoi_duyet: number | null;
  phieu_tg_tao: string | null;
  phieu_tg_cap_nhat: string | null;
  ma_hang: string | null;
}

const PHIEU_PT_CHI_TIET_FLAT_SELECT =
  'chi_tiet_id, id_phieu_kho, id_hang_hoa, ten_hang_hoa, don_vi_tinh, pham_cap, so_luong, don_gia, thanh_tien, so_lot, ghi_chu, chi_tiet_nguoi_tao_id, chi_tiet_ten_nguoi_tao, chi_tiet_tg_tao, chi_tiet_tg_cap_nhat, phieu_id, so_phieu, ngay, loai, kho_id, ten_kho, kho_den_id, ten_kho_den, trang_thai, mo_ta, trao_doi, phieu_nguoi_tao_id, phieu_ten_nguoi_tao, id_nguoi_duyet, phieu_tg_tao, phieu_tg_cap_nhat, ma_hang';

function rowToPhieu(
  row: PhieuKhoPTDbRow,
  enrich?: {
    ten_kho?: string;
    ten_kho_den?: string;
    ten_nguoi_tao?: string;
    ten_nguoi_duyet?: string;
  }
): PhieuKhoPT {
  return {
    id: String(row.id),
    so_phieu: row.so_phieu,
    ngay: row.ngay,
    loai: row.loai as LoaiPhieuKhoPT,
    kho_id: String(row.kho_id),
    ten_kho: enrich?.ten_kho ?? row.ten_kho ?? undefined,
    kho_den_id: row.kho_den_id != null ? String(row.kho_den_id) : undefined,
    ten_kho_den: enrich?.ten_kho_den ?? row.ten_kho_den ?? undefined,
    trang_thai: (row.trang_thai as TrangThaiPhieuKhoPT) || 'Chờ duyệt',
    mo_ta: row.mo_ta ?? undefined,
    trao_doi: row.trao_doi ?? undefined,
    id_nguoi_duyet: row.id_nguoi_duyet ?? undefined,
    ten_nguoi_duyet: enrich?.ten_nguoi_duyet,
    nguoi_tao_id: row.nguoi_tao_id ?? undefined,
    ten_nguoi_tao: enrich?.ten_nguoi_tao ?? row.ten_nguoi_tao ?? undefined,
    id_de_xuat_mua_hang: row.id_de_xuat_mua_hang != null ? String(row.id_de_xuat_mua_hang) : null,
    so_phieu_de_xuat: row.so_phieu_de_xuat ?? null,
    tg_tao: row.tg_tao ?? new Date().toISOString(),
    tg_cap_nhat: row.tg_cap_nhat ?? new Date().toISOString(),
  };
}

function rowToChiTiet(
  row: ChiTietDbRow,
  idPhieuKhoStr: string,
  enrich?: { ma_hang?: string; ten_danh_muc?: string }
): PhieuKhoPTChiTiet {
  return {
    id: String(row.id),
    id_phieu_kho: idPhieuKhoStr,
    id_hang_hoa: String(row.id_hang_hoa),
    ten_hang_hoa: row.ten_hang_hoa ?? undefined,
    so_luong: Number(row.so_luong),
    don_gia: row.don_gia != null ? Number(row.don_gia) : undefined,
    thanh_tien: row.thanh_tien != null ? Number(row.thanh_tien) : undefined,
    don_vi_tinh: row.don_vi_tinh ?? undefined,
    pham_cap: row.pham_cap ?? null,
    so_lot: row.so_lot ?? undefined,
    ghi_chu: row.ghi_chu ?? undefined,
    nguoi_tao_id: row.nguoi_tao_id ?? undefined,
    ten_nguoi_tao: row.ten_nguoi_tao ?? undefined,
    tg_tao: row.tg_tao ?? undefined,
    tg_cap_nhat: row.tg_cap_nhat ?? undefined,
    ma_hang: enrich?.ma_hang,
    ten_hang: row.ten_hang_hoa ?? undefined,
    ten_danh_muc: enrich?.ten_danh_muc,
  };
}

export async function getNextSoPhieuFarmPtDb(loai: LoaiPhieuKhoPT): Promise<string> {
  const { data, error } = await db.rpc('get_next_so_phieu_farm_pt', { p_loai: loai });
  if (error) throwDbError(error);
  if (typeof data !== 'string') throw new Error('get_next_so_phieu_farm_pt did not return string');
  return data;
}

export async function getPhieuKhoPTByIdDb(id: string): Promise<PhieuKhoPT | null> {
  const idNum = Number(id);
  if (Number.isNaN(idNum)) return null;
  const { data: row, error } = await db
    .from(TABLE_PHIEU)
    .select(PHIEU_PT_HEADER_ROW_SELECT)
    .eq('id', idNum)
    .maybeSingle();
  if (error) throwDbError(error);
  if (!row) return null;

  const [khoList, employees, ctRows, hangHoaList] = await Promise.all([
    getKhoRef(),
    getEmployeesRef(),
    db
      .from(TABLE_CHI_TIET)
      .select(PHIEU_PT_CHI_TIET_ROW_SELECT)
      .eq('id_phieu_kho', idNum)
      .order('id', { ascending: true })
      .then((r) => r.data ?? []),
    getAllFarmHangHoa(),
  ]);
  const khoMap: Record<string, string> = {};
  khoList.forEach((k) => {
    khoMap[k.id] = k.ten_kho;
  });
  const nvMap: Record<string, string> = {};
  employees.forEach((e) => {
    nvMap[e.id] = e.ho_ten;
  });
  const hangHoaMap: Record<string, { ma_hang: string; ten_danh_muc?: string }> = {};
  hangHoaList.forEach((h) => {
    hangHoaMap[h.id] = { ma_hang: h.ma_hang_hoa ?? '', ten_danh_muc: h.ten_danh_muc };
  });

  const p = row as PhieuKhoPTDbRow;
  const ten_kho = khoMap[String(p.kho_id)] ?? p.ten_kho ?? undefined;
  const ten_kho_den = p.kho_den_id != null ? (khoMap[String(p.kho_den_id)] ?? p.ten_kho_den ?? undefined) : undefined;
  const ten_nguoi_tao = p.nguoi_tao_id != null ? nvMap[String(p.nguoi_tao_id)] : undefined;
  const ten_nguoi_duyet = p.id_nguoi_duyet != null ? nvMap[String(p.id_nguoi_duyet)] : undefined;
  const phieu = rowToPhieu(p, { ten_kho, ten_kho_den, ten_nguoi_tao, ten_nguoi_duyet });

  const chi_tiet: PhieuKhoPTChiTiet[] = (ctRows as ChiTietDbRow[]).map((ct) => {
    const h = hangHoaMap[String(ct.id_hang_hoa)];
    return rowToChiTiet(ct, id, { ma_hang: h?.ma_hang, ten_danh_muc: h?.ten_danh_muc });
  });
  phieu.chi_tiet = chi_tiet;
  phieu.tong_so_dong = chi_tiet.length;
  phieu.tong_so_luong = chi_tiet.reduce((s, c) => s + (Number(c.so_luong) || 0), 0);
  phieu.tong_tien = chi_tiet.reduce((s, c) => s + (Number(c.thanh_tien) || 0), 0);
  return phieu;
}

/** Phiếu kho đã sinh ra từ một đề xuất mua hàng (badge + chặn tạo trùng ở module Đề xuất). */
export type PhieuKhoPTByDeXuat = { id: string; so_phieu: string; loai: LoaiPhieuKhoPT; id_de_xuat_mua_hang: string };

export async function getPhieuKhoPTByDeXuatIdsDb(deXuatIds: string[]): Promise<PhieuKhoPTByDeXuat[]> {
  const numIds = [...new Set(deXuatIds.map((s) => Number(s)).filter((n) => !Number.isNaN(n)))];
  if (numIds.length === 0) return [];
  const { data, error } = await db
    .from(TABLE_PHIEU)
    .select('id, so_phieu, loai, id_de_xuat_mua_hang')
    .in('id_de_xuat_mua_hang', numIds)
    .order('id', { ascending: true });
  if (error) throwDbError(error);
  return ((data ?? []) as { id: number; so_phieu: string | null; loai: string; id_de_xuat_mua_hang: number }[]).map((r) => ({
    id: String(r.id),
    so_phieu: r.so_phieu ?? '',
    loai: r.loai as LoaiPhieuKhoPT,
    id_de_xuat_mua_hang: String(r.id_de_xuat_mua_hang),
  }));
}

type HangHoaSnapshot = Record<string, { ten_hang_hoa: string; don_vi_tinh?: string; pham_cap?: string | null }>;

async function getHangHoaSnapshotMap(): Promise<{ map: HangHoaSnapshot; tenById: Record<string, string> }> {
  const hangHoaList = await getAllFarmHangHoa();
  const map: HangHoaSnapshot = {};
  const tenById: Record<string, string> = {};
  hangHoaList.forEach((h) => {
    map[h.id] = { ten_hang_hoa: h.ten_hang_hoa ?? '', don_vi_tinh: h.dvt ?? undefined, pham_cap: h.pham_cap ?? null };
    tenById[h.id] = h.ma_hang_hoa ? `${h.ma_hang_hoa} – ${h.ten_hang_hoa ?? ''}` : (h.ten_hang_hoa ?? h.id);
  });
  return { map, tenById };
}

/** Dòng chi tiết hợp lệ của form (bỏ dòng trống / số lượng 0 như trước). */
function validChiTiet(data: PhieuKhoPTFormValues) {
  return (data.chi_tiet ?? []).filter((c) => c.id_hang_hoa?.trim() && Number(c.so_luong) > 0);
}

function buildChiTietRows(
  idPhieu: number,
  chiTiet: ReturnType<typeof validChiTiet>,
  hangHoaMap: HangHoaSnapshot,
  nguoiTaoId: number | null,
  tenNguoiTao: string | null
) {
  return chiTiet.map((c) => {
    const h = hangHoaMap[c.id_hang_hoa.trim()];
    const sl = Number(c.so_luong);
    const dg = c.don_gia != null ? Number(c.don_gia) : 0;
    return {
      id_phieu_kho: idPhieu,
      id_hang_hoa: Number(c.id_hang_hoa),
      ten_hang_hoa: h?.ten_hang_hoa ?? null,
      don_vi_tinh: h?.don_vi_tinh ?? null,
      // Để trống trên form → lấy phẩm cấp của danh mục hàng hóa (snapshot lúc lập phiếu).
      pham_cap: c.pham_cap?.trim() || h?.pham_cap || null,
      so_luong: sl,
      don_gia: dg,
      thanh_tien: sl * dg,
      so_lot: c.so_lot?.trim() || null,
      ghi_chu: c.ghi_chu?.trim() || null,
      nguoi_tao_id: nguoiTaoId,
      ten_nguoi_tao: tenNguoiTao,
    };
  });
}

function formatSoLuongTon(n: number): string {
  return n.toLocaleString('vi-VN', { maximumFractionDigits: 4 });
}

/** Thông điệp cảnh báo tồn âm liệt kê từng hàng × kho — chỉ cảnh báo, không chặn lưu. */
function vuotTonMessage(
  items: VuotTon[],
  khoMap: Record<string, string>,
  hangTenById: Record<string, string>
): string {
  const detail = items
    .map((v) =>
      i18n.t('phieuKhoPhanThuoc.service.vuotTonItem', {
        hang: hangTenById[v.id_hang_hoa] ?? `#${v.id_hang_hoa}`,
        kho: khoMap[v.id_kho] ?? `#${v.id_kho}`,
        ton: formatSoLuongTon(v.ton),
        can: formatSoLuongTon(v.can),
      })
    )
    .join('; ');
  return i18n.t('phieuKhoPhanThuoc.service.canhBaoTonAm', { detail });
}

/** Tồn hiện tại của các kho mà phiếu làm giảm (một request). */
async function loadTonForDeltas(...deltas: TonMap[]): Promise<TonMap> {
  const khoIds = khoCanKiemTra(...deltas);
  if (khoIds.length === 0) return new Map();
  return buildTonMap(await getTonKhoPTMatrixByKhoIds(khoIds));
}

function formToDeltaInput(data: PhieuKhoPTFormValues, lines: ReturnType<typeof validChiTiet>) {
  return {
    loai: data.loai as LoaiPhieuKhoPT,
    kho_id: data.kho_id,
    kho_den_id: data.loai === 'chuyển' ? data.kho_den_id : null,
    trang_thai: data.trang_thai,
    lines: lines.map((c) => ({ id_hang_hoa: c.id_hang_hoa.trim(), so_luong: Number(c.so_luong) })),
  };
}

function headerPayloadFromForm(
  data: PhieuKhoPTFormValues,
  khoMap: Record<string, string>,
  nguoiTaoId: number | null,
  tenNguoiTao: string | null
) {
  const loai = data.loai as LoaiPhieuKhoPT;
  return {
    so_phieu: data.so_phieu.trim(),
    ngay: data.ngay.trim(),
    loai,
    kho_id: Number(data.kho_id),
    ten_kho: khoMap[String(data.kho_id)] ?? null,
    kho_den_id: loai === 'chuyển' && data.kho_den_id ? Number(data.kho_den_id) : null,
    ten_kho_den: loai === 'chuyển' && data.kho_den_id ? (khoMap[String(data.kho_den_id)] ?? null) : null,
    trang_thai: data.trang_thai,
    mo_ta: data.mo_ta?.trim() || null,
    nguoi_tao_id: nguoiTaoId,
    ten_nguoi_tao: tenNguoiTao,
    id_de_xuat_mua_hang: data.id_de_xuat_mua_hang ? Number(data.id_de_xuat_mua_hang) : null,
    so_phieu_de_xuat: data.so_phieu_de_xuat?.trim() || null,
  };
}

async function loadKhoNvMaps() {
  const [khoList, employees] = await Promise.all([getKhoRef(), getEmployeesRef()]);
  const khoMap: Record<string, string> = {};
  khoList.forEach((k) => {
    khoMap[k.id] = k.ten_kho;
  });
  const nvMap: Record<string, string> = {};
  employees.forEach((e) => {
    nvMap[e.id] = e.ho_ten;
  });
  return { khoMap, nvMap };
}

/** Kết quả lưu phiếu: kèm cảnh báo tồn âm (nếu có) để hook hiện toast — phiếu vẫn được ghi. */
export interface PhieuKhoPTSaveResult {
  phieu: PhieuKhoPT;
  canhBaoTon: string | null;
}

export async function createPhieuKhoPTDb(data: PhieuKhoPTFormValues): Promise<PhieuKhoPTSaveResult> {
  const loai = data.loai as LoaiPhieuKhoPT;
  const soPhieu = data.so_phieu.trim();
  const { data: existing } = await db.from(TABLE_PHIEU).select('id').eq('so_phieu', soPhieu).eq('loai', loai).maybeSingle();
  if (existing) throw new Error(i18n.t('phieuKhoPhanThuoc.service.duplicateCode'));

  const chiTiet = validChiTiet(data);
  const newDelta = phieuDelta(formToDeltaInput(data, chiTiet));
  const [{ khoMap, nvMap }, { map: hangHoaMap, tenById }, ton] = await Promise.all([
    loadKhoNvMaps(),
    getHangHoaSnapshotMap(),
    loadTonForDeltas(newDelta),
  ]);
  const vuot = findVuotTon(ton, newDelta);
  const canhBaoTon = vuot.length > 0 ? vuotTonMessage(vuot, khoMap, tenById) : null;

  const nguoiTaoId = data.nguoi_tao_id != null ? Number(data.nguoi_tao_id) : null;
  const tenNguoiTao = nguoiTaoId != null ? (nvMap[String(nguoiTaoId)] ?? null) : null;

  const { data: inserted, error } = await db
    .from(TABLE_PHIEU)
    .insert(headerPayloadFromForm(data, khoMap, nguoiTaoId, tenNguoiTao))
    .select(PHIEU_PT_HEADER_ROW_SELECT)
    .single();
  if (error) throwDbError(error);
  const idPhieu = (inserted as PhieuKhoPTDbRow).id;

  if (chiTiet.length > 0) {
    const { error: errCt } = await db
      .from(TABLE_CHI_TIET)
      .insert(buildChiTietRows(idPhieu, chiTiet, hangHoaMap, nguoiTaoId, tenNguoiTao));
    if (errCt) {
      // Bù trừ: không để lại phiếu rỗng khi ghi dòng lỗi.
      await db.from(TABLE_PHIEU).delete().eq('id', idPhieu);
      throwDbError(errCt);
    }
  }

  const got = await getPhieuKhoPTByIdDb(String(idPhieu));
  if (!got) throw new Error(i18n.t('phieuKhoPhanThuoc.service.notFound'));
  return { phieu: got, canhBaoTon };
}

/**
 * Sửa phiếu theo thứ tự an toàn: ghi dòng MỚI trước, xong mới xoá dòng CŨ theo id.
 * Bước nào lỗi thì hoàn lại header + bỏ dòng mới → phiếu giữ nguyên như trước khi sửa,
 * không còn ca "xoá hết dòng rồi insert lỗi" làm phiếu mất dòng.
 */
export async function updatePhieuKhoPTDb(id: string, data: PhieuKhoPTFormValues): Promise<PhieuKhoPTSaveResult> {
  const idNum = Number(id);
  if (Number.isNaN(idNum)) throw new Error(i18n.t('phieuKhoPhanThuoc.service.notFound'));

  const [{ data: oldRow, error: fetchErr }, { data: oldLines, error: oldLinesErr }] = await Promise.all([
    db.from(TABLE_PHIEU).select(PHIEU_PT_HEADER_ROW_SELECT).eq('id', idNum).maybeSingle(),
    db.from(TABLE_CHI_TIET).select('id, id_hang_hoa, so_luong').eq('id_phieu_kho', idNum),
  ]);
  if (fetchErr || !oldRow) throw new Error(i18n.t('phieuKhoPhanThuoc.service.notFound'));
  if (oldLinesErr) throwDbError(oldLinesErr);
  const old = oldRow as PhieuKhoPTDbRow;
  const oldCt = (oldLines ?? []) as { id: number; id_hang_hoa: number; so_luong: number | string }[];

  const soPhieu = data.so_phieu.trim();
  const loaiForUnique = data.loai as LoaiPhieuKhoPT;
  const { data: other } = await db
    .from(TABLE_PHIEU)
    .select('id')
    .eq('so_phieu', soPhieu)
    .eq('loai', loaiForUnique)
    .neq('id', idNum)
    .maybeSingle();
  if (other) throw new Error(i18n.t('phieuKhoPhanThuoc.service.duplicateCode'));

  const chiTiet = validChiTiet(data);
  const newDelta = phieuDelta(formToDeltaInput(data, chiTiet));
  const oldDelta = phieuDelta({
    loai: old.loai as LoaiPhieuKhoPT,
    kho_id: String(old.kho_id),
    kho_den_id: old.kho_den_id != null ? String(old.kho_den_id) : null,
    trang_thai: old.trang_thai,
    lines: oldCt.map((c) => ({ id_hang_hoa: String(c.id_hang_hoa), so_luong: Number(c.so_luong) })),
  });
  const [{ khoMap, nvMap }, { map: hangHoaMap, tenById }, ton] = await Promise.all([
    loadKhoNvMaps(),
    getHangHoaSnapshotMap(),
    loadTonForDeltas(newDelta, oldDelta),
  ]);
  const vuot = findVuotTon(ton, newDelta, oldDelta);
  const canhBaoTon = vuot.length > 0 ? vuotTonMessage(vuot, khoMap, tenById) : null;

  const nguoiTaoId = data.nguoi_tao_id != null ? Number(data.nguoi_tao_id) : null;
  const tenNguoiTao = nguoiTaoId != null ? (nvMap[String(nguoiTaoId)] ?? null) : null;

  const { error: updateErr } = await db
    .from(TABLE_PHIEU)
    .update(headerPayloadFromForm(data, khoMap, nguoiTaoId, tenNguoiTao))
    .eq('id', idNum);
  if (updateErr) throwDbError(updateErr);

  const restoreHeader = () =>
    db
      .from(TABLE_PHIEU)
      .update({
        so_phieu: old.so_phieu,
        ngay: old.ngay,
        loai: old.loai,
        kho_id: old.kho_id,
        ten_kho: old.ten_kho,
        kho_den_id: old.kho_den_id,
        ten_kho_den: old.ten_kho_den,
        trang_thai: old.trang_thai,
        mo_ta: old.mo_ta ?? null,
        nguoi_tao_id: old.nguoi_tao_id,
        ten_nguoi_tao: old.ten_nguoi_tao,
        id_de_xuat_mua_hang: old.id_de_xuat_mua_hang ?? null,
        so_phieu_de_xuat: old.so_phieu_de_xuat ?? null,
      })
      .eq('id', idNum);

  let newIds: number[] = [];
  if (chiTiet.length > 0) {
    const { data: insertedCt, error: errCt } = await db
      .from(TABLE_CHI_TIET)
      .insert(buildChiTietRows(idNum, chiTiet, hangHoaMap, nguoiTaoId, tenNguoiTao))
      .select('id');
    if (errCt) {
      await restoreHeader();
      throwDbError(errCt);
    }
    newIds = ((insertedCt ?? []) as { id: number }[]).map((r) => r.id);
  }

  const oldIds = oldCt.map((c) => c.id);
  if (oldIds.length > 0) {
    const { error: delErr } = await db.from(TABLE_CHI_TIET).delete().in('id', oldIds);
    if (delErr) {
      if (newIds.length > 0) await db.from(TABLE_CHI_TIET).delete().in('id', newIds);
      await restoreHeader();
      throwDbError(delErr);
    }
  }

  const got = await getPhieuKhoPTByIdDb(id);
  if (!got) throw new Error(i18n.t('phieuKhoPhanThuoc.service.notFound'));
  return { phieu: got, canhBaoTon };
}

// ---------------------------------------------------------------------------
// IMPORT
// ---------------------------------------------------------------------------

export interface ImportPhieuKhoPTResult {
  created: number;
  errors: ImportErrorRow[];
  /** Phiếu đã tạo nhưng làm tồn kho âm — "<số phiếu>: <chi tiết>" để toast cảnh báo. */
  warnings: string[];
}

/** Số phiếu đã có trong DB (chỉ những số mà file có điền) — theo lô để URL `.in()` không quá dài. */
async function getExistingSoPhieuPT(soPhieuList: string[]): Promise<ExistingSoPhieu[]> {
  const out: ExistingSoPhieu[] = [];
  for (const group of chunkBy([...new Set(soPhieuList)], 200)) {
    const { data, error } = await db.from(TABLE_PHIEU).select('so_phieu, loai').in('so_phieu', group);
    if (error) throwDbError(error);
    out.push(...((data ?? []) as ExistingSoPhieu[]));
  }
  return out;
}

/**
 * Import phiếu từ Excel phẳng (1 dòng = 1 dòng hàng). Validate toàn bộ ở `planPhieuKhoPTImport`
 * trước khi ghi; mỗi phiếu ghi header → dòng, dòng lỗi thì xoá header vừa tạo để không còn phiếu rỗng.
 * Trạng thái luôn "Chờ duyệt" — import không được đi tắt luồng duyệt.
 */
export async function importPhieuKhoPTDb(
  rows: PhieuKhoPTImportRow[],
  nguoiTao: { id: number | null; ten: string | null }
): Promise<ImportPhieuKhoPTResult> {
  const soPhieuFile = rows.map((r) => normalizeText(r.so_phieu)).filter(Boolean);
  const [khoList, hangHoaList, existingSoPhieu] = await Promise.all([
    getKhoRef(),
    getAllFarmHangHoa(),
    soPhieuFile.length > 0 ? getExistingSoPhieuPT(soPhieuFile) : Promise.resolve([]),
  ]);

  const { phieus, errors } = planPhieuKhoPTImport(rows, {
    khoList,
    hangHoaList: hangHoaList.map((h) => ({
      id: h.id,
      ma_hang_hoa: h.ma_hang_hoa ?? '',
      ten_hang_hoa: h.ten_hang_hoa ?? '',
      dvt: h.dvt ?? null,
      pham_cap: h.pham_cap ?? null,
      don_gia: h.don_gia != null ? Number(h.don_gia) : null,
    })),
    existingSoPhieu,
  });

  // Tồn chạy dồn qua từng phiếu: phiếu sau thấy phần phiếu trước trong file đã lấy.
  const deltas = phieus.map((p) =>
    phieuDelta({ loai: p.loai, kho_id: p.kho_id, kho_den_id: p.kho_den_id, lines: p.lines })
  );
  const ton = await loadTonForDeltas(...deltas);
  const khoMap: Record<string, string> = {};
  khoList.forEach((k) => {
    khoMap[k.id] = k.ten_kho;
  });
  const hangTenById: Record<string, string> = {};
  hangHoaList.forEach((h) => {
    hangTenById[h.id] = h.ma_hang_hoa ? `${h.ma_hang_hoa} – ${h.ten_hang_hoa ?? ''}` : (h.ten_hang_hoa ?? h.id);
  });

  let created = 0;
  const warnings: string[] = [];
  for (const [i, p] of phieus.entries()) {
    // Tồn âm chỉ cảnh báo, không bỏ qua phiếu — tính trước applyDelta để đúng tồn trước phiếu này.
    const vuot = findVuotTon(ton, deltas[i]);
    let idPhieu: number | null = null;
    try {
      const soPhieu = p.so_phieu ?? (await getNextSoPhieuFarmPtDb(p.loai));
      const { data: inserted, error } = await db
        .from(TABLE_PHIEU)
        .insert({
          so_phieu: soPhieu,
          ngay: p.ngay,
          loai: p.loai,
          kho_id: p.kho_id,
          ten_kho: p.ten_kho,
          kho_den_id: p.kho_den_id,
          ten_kho_den: p.ten_kho_den,
          trang_thai: 'Chờ duyệt',
          mo_ta: p.mo_ta,
          nguoi_tao_id: nguoiTao.id,
          ten_nguoi_tao: nguoiTao.ten,
        })
        .select('id')
        .single();
      if (error) throw error;
      idPhieu = (inserted as { id: number }).id;

      const { error: errCt } = await db.from(TABLE_CHI_TIET).insert(
        p.lines.map((l) => ({
          id_phieu_kho: idPhieu,
          id_hang_hoa: l.id_hang_hoa,
          ten_hang_hoa: l.ten_hang_hoa,
          don_vi_tinh: l.don_vi_tinh,
          pham_cap: l.pham_cap,
          so_luong: l.so_luong,
          don_gia: l.don_gia,
          thanh_tien: l.so_luong * l.don_gia,
          so_lot: l.so_lot,
          ghi_chu: l.ghi_chu,
          nguoi_tao_id: nguoiTao.id,
          ten_nguoi_tao: nguoiTao.ten,
        }))
      );
      if (errCt) throw errCt;
      created++;
      applyDelta(ton, deltas[i]);
      if (vuot.length > 0) warnings.push(`${soPhieu}: ${vuotTonMessage(vuot, khoMap, hangTenById)}`);
    } catch (err) {
      if (idPhieu != null) await db.from(TABLE_PHIEU).delete().eq('id', idPhieu);
      const msg = i18n.t('phieuKhoPhanThuoc.import.errWriteFailed', { msg: formatDbError(err) });
      p.sourceRows.forEach((r) => errors.push({ row: r.row, msg, values: r.values }));
    }
  }

  errors.sort((a, b) => a.row - b.row);
  return { created, errors, warnings };
}

function formatPhieuKhoPTTraoDoiTimestamp(d: Date = new Date()): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

export interface UpdatePhieuKhoPTTrangThaiOptions {
  ghi_chu?: string;
  id_nguoi_duyet?: number | null;
  ten_nguoi_duyet_hien_thi?: string;
}

/** Bỏ NaN/không hữu hạn — dùng chung cho duyệt lẻ và duyệt hàng loạt. */
function normalizeNguoiDuyetIdPT(id?: number | null): number | null {
  return id != null && Number.isFinite(id) && !Number.isNaN(id) ? id : null;
}

/** Dòng log nối vào cột trao_doi. Duyệt lẻ và duyệt hàng loạt phải ra cùng định dạng. */
function buildTraoDoiEntryPT(
  trang_thai: TrangThaiPhieuKhoPT,
  idNguoiDuyet: number | null,
  options?: UpdatePhieuKhoPTTrangThaiOptions
): string {
  const ts = formatPhieuKhoPTTraoDoiTimestamp();
  const who =
    options?.ten_nguoi_duyet_hien_thi?.trim() ||
    (idNguoiDuyet != null ? `Nhân viên #${idNguoiDuyet}` : 'Người dùng');
  const actionVerb = trang_thai === 'Đã duyệt' ? 'đã duyệt' : 'không duyệt';
  const ghi_chu = options?.ghi_chu;
  return ghi_chu?.trim()
    ? `${ts} — ${who} ${actionVerb}. Ghi chú: ${ghi_chu.trim()}`
    : `${ts} — ${who} ${actionVerb}.`;
}

function appendTraoDoiPT(existing: string | null | undefined, entry: string): string {
  return existing ? existing + '\n' + entry : entry;
}

export async function updatePhieuKhoPTTrangThaiDb(
  id: string,
  trang_thai: TrangThaiPhieuKhoPT,
  options?: UpdatePhieuKhoPTTrangThaiOptions
): Promise<void> {
  const idNum = Number(id);
  if (Number.isNaN(idNum)) throw new Error(i18n.t('phieuKhoPhanThuoc.service.notFound'));
  const idNguoiDuyet = normalizeNguoiDuyetIdPT(options?.id_nguoi_duyet);

  const { data: row } = await db.from(TABLE_PHIEU).select('trao_doi').eq('id', idNum).maybeSingle();
  const existing = (row as { trao_doi?: string } | null)?.trao_doi ?? '';
  const newTraoDoi = appendTraoDoiPT(existing, buildTraoDoiEntryPT(trang_thai, idNguoiDuyet, options));
  const { error } = await db
    .from(TABLE_PHIEU)
    .update({ trang_thai, trao_doi: newTraoDoi, id_nguoi_duyet: idNguoiDuyet })
    .eq('id', idNum);
  if (error) throwDbError(error);
}

export interface UpdatePhieuKhoPTTrangThaiManyResult {
  okIds: string[];
  failed: { id: string; message: string }[];
}

/**
 * Đổi trạng thái hàng loạt. Cột trao_doi là log nối thêm riêng từng phiếu nên không gộp được
 * thành một `update().in()`: gom log cũ bằng 1 SELECT, PATCH tuần tự và gom lỗi thay vì dừng lô.
 */
export async function updatePhieuKhoPTTrangThaiManyDb(
  ids: string[],
  trang_thai: TrangThaiPhieuKhoPT,
  options?: UpdatePhieuKhoPTTrangThaiOptions
): Promise<UpdatePhieuKhoPTTrangThaiManyResult> {
  const numIds = ids.map((id) => Number(id)).filter((n) => !Number.isNaN(n));
  if (numIds.length === 0) return { okIds: [], failed: [] };

  const idNguoiDuyet = normalizeNguoiDuyetIdPT(options?.id_nguoi_duyet);
  const { data, error: selErr } = await db.from(TABLE_PHIEU).select('id,trao_doi').in('id', numIds);
  if (selErr) throwDbError(selErr);
  const traoDoiById = new Map<number, string>();
  ((data ?? []) as { id: number; trao_doi?: string | null }[]).forEach((row) => {
    traoDoiById.set(Number(row.id), row.trao_doi ?? '');
  });

  const entry = buildTraoDoiEntryPT(trang_thai, idNguoiDuyet, options);
  const okIds: string[] = [];
  const failed: { id: string; message: string }[] = [];

  for (const idNum of numIds) {
    try {
      const { error } = await db
        .from(TABLE_PHIEU)
        .update({
          trang_thai,
          trao_doi: appendTraoDoiPT(traoDoiById.get(idNum), entry),
          id_nguoi_duyet: idNguoiDuyet,
        })
        .eq('id', idNum);
      if (error) throwDbError(error);
      okIds.push(String(idNum));
    } catch (err) {
      failed.push({ id: String(idNum), message: err instanceof Error ? err.message : String(err) });
    }
  }

  return { okIds, failed };
}

export async function deletePhieuKhoPTDb(id: string): Promise<void> {
  const idNum = Number(id);
  if (Number.isNaN(idNum)) throw new Error(i18n.t('phieuKhoPhanThuoc.service.notFound'));
  const { error } = await db.from(TABLE_PHIEU).delete().eq('id', idNum);
  if (error) throwDbError(error);
}

export async function deletePhieuKhoPTManyDb(ids: string[]): Promise<void> {
  const numIds = ids.map((id) => Number(id)).filter((n) => !Number.isNaN(n));
  if (numIds.length === 0) return;
  const { error } = await db.from(TABLE_PHIEU).delete().in('id', numIds);
  if (error) throwDbError(error);
}

let nvMapCache: Promise<Record<string, string>> | null = null;
async function getNvMap(): Promise<Record<string, string>> {
  if (!nvMapCache) {
    nvMapCache = getEmployeesRef().then((employees) => {
      const nvMap: Record<string, string> = {};
      employees.forEach((e) => {
        nvMap[e.id] = e.ho_ten;
      });
      return nvMap;
    });
  }
  return nvMapCache;
}

function mapPhieuKhoPTChiTietFlatViewRows(flatRows: PhieuKhoPTChiTietFlatViewRow[], nvMap: Record<string, string>): ChiTietPhieuKhoPTFlat[] {
  const flat: ChiTietPhieuKhoPTFlat[] = flatRows.map((r) => {
    const lineNvId = r.chi_tiet_nguoi_tao_id != null ? r.chi_tiet_nguoi_tao_id : undefined;
    const lineTenNv =
      (typeof r.chi_tiet_ten_nguoi_tao === 'string' && r.chi_tiet_ten_nguoi_tao.trim() !== ''
        ? r.chi_tiet_ten_nguoi_tao.trim()
        : undefined) ?? (lineNvId != null ? nvMap[String(lineNvId)] : undefined);
    const maHang = r.ma_hang?.trim() ? r.ma_hang.trim() : undefined;
    return {
      id: String(r.chi_tiet_id),
      id_phieu_kho: String(r.phieu_id),
      so_phieu: r.so_phieu,
      ngay: r.ngay,
      loai: r.loai as LoaiPhieuKhoPT,
      kho_id: String(r.kho_id),
      ten_kho: r.ten_kho ?? undefined,
      kho_den_id: r.kho_den_id != null ? String(r.kho_den_id) : undefined,
      ten_kho_den: r.ten_kho_den ?? undefined,
      trang_thai: (r.trang_thai as TrangThaiPhieuKhoPT) || 'Chờ duyệt',
      mo_ta: r.mo_ta ?? undefined,
      trao_doi: r.trao_doi ?? undefined,
      phieu_tg_tao: r.phieu_tg_tao ?? undefined,
      phieu_tg_cap_nhat: r.phieu_tg_cap_nhat ?? undefined,
      id_nguoi_duyet: r.id_nguoi_duyet != null ? r.id_nguoi_duyet : undefined,
      ten_nguoi_duyet: r.id_nguoi_duyet != null ? nvMap[String(r.id_nguoi_duyet)] : undefined,
      nguoi_tao_id: r.phieu_nguoi_tao_id != null ? r.phieu_nguoi_tao_id : undefined,
      ten_nguoi_tao: r.phieu_nguoi_tao_id != null ? nvMap[String(r.phieu_nguoi_tao_id)] : undefined,
      id_hang_hoa: String(r.id_hang_hoa),
      ten_hang_hoa: r.ten_hang_hoa ?? undefined,
      ma_hang: maHang,
      ten_hang: r.ten_hang_hoa ?? undefined,
      so_luong: Number(r.so_luong),
      don_gia: r.don_gia != null ? Number(r.don_gia) : undefined,
      thanh_tien: r.thanh_tien != null ? Number(r.thanh_tien) : undefined,
      don_vi_tinh: r.don_vi_tinh ?? undefined,
      pham_cap: r.pham_cap ?? null,
      so_lot: r.so_lot ?? undefined,
      ghi_chu: r.ghi_chu ?? undefined,
      chi_tiet_nguoi_tao_id: lineNvId,
      chi_tiet_ten_nguoi_tao: lineTenNv,
      chi_tiet_tg_tao: r.chi_tiet_tg_tao ?? undefined,
      chi_tiet_tg_cap_nhat: r.chi_tiet_tg_cap_nhat ?? undefined,
    };
  });
  flat.sort(
    (a, b) =>
      (b.ngay || '').localeCompare(a.ngay || '') ||
      (a.so_phieu || '').localeCompare(b.so_phieu || '') ||
      (a.ma_hang ?? '').localeCompare(b.ma_hang ?? '')
  );
  return flat;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function applyPhieuKhoPTListQueryToSummarySelect(q: any, query: PhieuKhoPTListServerQuery): any {
  let b = q;
  if (query.loaiDb.length) b = b.in('loai', query.loaiDb);
  if (query.trangThaiViet.length) b = b.in('trang_thai', query.trangThaiViet);
  if (query.khoIds.length) b = b.in('kho_id', query.khoIds);
  if (query.khoDenIds.length) b = b.in('kho_den_id', query.khoDenIds);
  if (query.ngayFrom) b = b.gte('ngay', query.ngayFrom);
  if (query.ngayTo) b = b.lte('ngay', query.ngayTo);
  if (query.nguoiTaoIds.length) b = b.in('nguoi_tao_id', query.nguoiTaoIds);
  if (query.nguoiDuyetIds.length) b = b.in('id_nguoi_duyet', query.nguoiDuyetIds);
  const term = (query.searchTerm ?? '').trim();
  if (term) {
    const esc = term.replace(/%/g, '\\%').replace(/_/g, '\\_');
    const pat = postgrestQuotedIlikePattern(`%${esc}%`);
    b = b.or(`so_phieu.ilike.${pat},mo_ta.ilike.${pat},ten_kho.ilike.${pat},ten_kho_den.ilike.${pat}`);
  }
  return b;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function applyChiTietPhieuKhoPTListQueryToFlatSelect(q: any, query: ChiTietPhieuKhoPTListServerQuery): any {
  let b = q;
  if (query.loaiDb.length) b = b.in('loai', query.loaiDb);
  if (query.trangThaiViet.length) b = b.in('trang_thai', query.trangThaiViet);
  if (query.khoIds.length) b = b.in('kho_id', query.khoIds);
  if (query.khoDenIds.length) b = b.in('kho_den_id', query.khoDenIds);
  if (query.ngayFrom) b = b.gte('ngay', query.ngayFrom);
  if (query.ngayTo) b = b.lte('ngay', query.ngayTo);
  if (query.nguoiTaoIds.length) b = b.in('phieu_nguoi_tao_id', query.nguoiTaoIds);
  if (query.nguoiDuyetIds.length) b = b.in('id_nguoi_duyet', query.nguoiDuyetIds);
  const term = (query.searchTerm ?? '').trim();
  if (term) {
    const esc = term.replace(/%/g, '\\%').replace(/_/g, '\\_');
    const pat = postgrestQuotedIlikePattern(`%${esc}%`);
    b = b.or(`so_phieu.ilike.${pat},ten_hang_hoa.ilike.${pat},mo_ta.ilike.${pat},ghi_chu.ilike.${pat},ma_hang.ilike.${pat}`);
  }
  return b;
}

const CHI_TIET_PAGE_SIZE_DEFAULT = 100;
const DANH_SACH_PAGE_SIZE_DEFAULT = 50;

export async function getPhieuKhoPTPageDb(
  page: number,
  pageSize: number = DANH_SACH_PAGE_SIZE_DEFAULT,
  listQuery?: PhieuKhoPTListServerQuery
): Promise<PaginatedTableResult<PhieuKhoPT>> {
  const pageResult = await fetchTablePage<PhieuKhoPTSummaryRow>(page, pageSize, async (from, to) => {
    let sel = db.from(VIEW_SUMMARY).select(PHIEU_PT_SUMMARY_SELECT, { count: 'exact' });
    if (listQuery) sel = applyPhieuKhoPTListQueryToSummarySelect(sel, listQuery);
    const res = await sel.order('ngay', { ascending: false }).order('so_phieu', { ascending: false }).range(from, to);
    return { data: (res.data ?? null) as PhieuKhoPTSummaryRow[] | null, error: res.error, count: res.count };
  });
  const data = pageResult.data.map((row) => mapPhieuKhoPTSummaryRowToPhieu(row));
  return { data, totalCount: pageResult.totalCount, page: pageResult.page, pageSize: pageResult.pageSize };
}

export async function getChiTietPhieuKhoPTPageDb(
  page: number,
  pageSize: number = CHI_TIET_PAGE_SIZE_DEFAULT,
  listQuery?: ChiTietPhieuKhoPTListServerQuery
): Promise<PaginatedTableResult<ChiTietPhieuKhoPTFlat>> {
  const [pageResult, nvMap] = await Promise.all([
    fetchTablePage<PhieuKhoPTChiTietFlatViewRow>(page, pageSize, async (from, to) => {
      let sel = db.from(VIEW_FLAT).select(PHIEU_PT_CHI_TIET_FLAT_SELECT, { count: 'exact' });
      if (listQuery) sel = applyChiTietPhieuKhoPTListQueryToFlatSelect(sel, listQuery);
      const res = await sel
        .order('ngay', { ascending: false })
        .order('so_phieu', { ascending: false })
        .order('chi_tiet_id', { ascending: false })
        .range(from, to);
      return { data: res.data as PhieuKhoPTChiTietFlatViewRow[] | null, error: res.error, count: res.count };
    }),
    getNvMap(),
  ]);
  const data = mapPhieuKhoPTChiTietFlatViewRows(pageResult.data, nvMap);
  return { data, totalCount: pageResult.totalCount, page: pageResult.page, pageSize: pageResult.pageSize };
}

export async function fetchAllPhieuKhoPTForListQueryDb(
  listQuery: PhieuKhoPTListServerQuery,
  pageSize = 500,
  maxRows = 25000
): Promise<PhieuKhoPT[]> {
  const out: PhieuKhoPT[] = [];
  let p = 0;
  while (out.length < maxRows) {
    const { data, totalCount } = await getPhieuKhoPTPageDb(p, pageSize, listQuery);
    out.push(...data);
    if (data.length === 0 || out.length >= totalCount) break;
    p += 1;
  }
  return out;
}

export async function fetchAllChiTietPhieuKhoPTForListQueryDb(
  listQuery: ChiTietPhieuKhoPTListServerQuery,
  pageSize = 500,
  maxRows = 25000
): Promise<ChiTietPhieuKhoPTFlat[]> {
  const out: ChiTietPhieuKhoPTFlat[] = [];
  let p = 0;
  while (out.length < maxRows) {
    const { data, totalCount } = await getChiTietPhieuKhoPTPageDb(p, pageSize, listQuery);
    out.push(...data);
    if (data.length === 0 || out.length >= totalCount) break;
    p += 1;
  }
  return out;
}
