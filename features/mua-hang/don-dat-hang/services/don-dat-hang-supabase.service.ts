/**
 * Service đơn đặt hàng – đọc/ghi Supabase (fp_mh_don_dat_hang, fp_mh_don_dat_hang_chi_tiet).
 * Trạng thái DB và app đều dùng text (giống module đề xuất vật tư).
 */
import { db, fetchAllRows, fetchTablePage, type PaginatedTableResult, throwSupabaseError } from '../../../../lib/db';
import type { ChiTietDonDatHangFlat, DonDatHang, DonDatHangChiTiet, DonDatHangTrangThai } from '../core/types';
import type { DonDatHangFormValues } from '../core/schema';
import { TRANG_THAI_NHAP } from '../core/types';
import i18n from '../../../../lib/i18n';
import { getKhoRef } from '../../../kho-van/danh-sach-kho/services/kho-service';
import { getDoiTacRef } from '../../../kho-van/danh-sach-doi-tac/services/doi-tac-service';
import { getHangHoaRef, type HangHoaRefLite } from '../../../kho-van/danh-sach-hang-hoa/services/hang-hoa-service';
import type { BranchListScope } from '../../../../lib/branch-scope-query';
import { postgrestQuotedIlikePattern } from '../../../../lib/postgrest-or-ilike';
import type { DonDatHangListServerQuery } from './don-dat-hang-list-query';
import { TRANG_THAI_DON_DAT_HANG, TRANG_THAI_KEY } from '../core/constants';
import type {
  DonDatHangStatsByTrangThai,
  DonDatHangStatsSummary,
  StatsChartItem,
} from '../components/stats/useDonDatHangStats';
const TABLE_DON = 'fp_mh_don_dat_hang';
const TABLE_CHI_TIET = 'fp_mh_don_dat_hang_chi_tiet';

/** View DB: chạy docs/supabase-v_don_dat_hang_summary.sql trên Supabase. */
const VIEW_DON_DAT_HANG_SUMMARY = 'v_don_dat_hang_summary';

/** View DB: chạy docs/supabase-v_don_dat_hang_chi_tiet_flat.sql trên Supabase. */
const VIEW_DON_DAT_HANG_CHI_TIET_FLAT = 'v_don_dat_hang_chi_tiet_flat';

const VIEW_DON_DAT_HANG_SUMMARY_COLUMNS =
  'id,so_po,ngay_dat,ngay_giao_dk,id_nha_cung_cap,ten_nha_cung_cap,id_kho_nhan,ten_kho_nhan,id_phieu_de_xuat_vat_tu,id_nguoi_dat,id_nguoi_duyet,ghi_chu,trang_thai,tg_tao,tg_cap_nhat,so_phieu_de_xuat_ref,ref_ma_nha_cung_cap,ref_ten_nha_cung_cap,ref_ten_kho_nhan,ref_ten_nguoi_dat,ref_ma_nguoi_dat,ref_ten_nguoi_duyet,ref_ma_nguoi_duyet';

const DON_DAT_HANG_ROW_COLUMNS =
  'id,so_po,ngay_dat,ngay_giao_dk,id_nha_cung_cap,ten_nha_cung_cap,id_kho_nhan,ten_kho_nhan,id_phieu_de_xuat_vat_tu,id_nguoi_dat,id_nguoi_duyet,ghi_chu,trang_thai,tg_tao,tg_cap_nhat';

function trangThaiFromDb(s: string | null): DonDatHangTrangThai {
  if (s == null || s === '') return TRANG_THAI_NHAP;
  return s as DonDatHangTrangThai;
}

/** Dòng từ view summary (cột đơn + so phiếu đề xuất + ref_* khi view đã migrate). */
type DonSummaryRow = DonDbRow & {
  so_phieu_de_xuat_ref?: string | null;
  ref_ma_nha_cung_cap?: string | null;
  ref_ten_nha_cung_cap?: string | null;
  ref_ten_kho_nhan?: string | null;
  ref_ten_nguoi_dat?: string | null;
  ref_ma_nguoi_dat?: string | null;
  ref_ten_nguoi_duyet?: string | null;
  ref_ma_nguoi_duyet?: string | null;
};

interface DonDbRow {
  id: number;
  so_po: string;
  ngay_dat: string;
  ngay_giao_dk: string;
  id_nha_cung_cap: number;
  ten_nha_cung_cap: string | null;
  id_kho_nhan: number | null;
  ten_kho_nhan: string | null;
  id_phieu_de_xuat_vat_tu: number | null;
  id_nguoi_dat: number;
  id_nguoi_duyet: number | null;
  ghi_chu: string | null;
  trang_thai: string;
  tg_tao: string | null;
  tg_cap_nhat: string | null;
}

interface ChiTietDbRow {
  id: number;
  id_don_dat_hang: number;
  id_hang_hoa: number;
  phan_loai: string | null;
  muc_dich_su_dung?: string | null;
  so_luong: number;
  don_vi_tinh: string | null;
  don_gia: number | null;
  thanh_tien: number | null;
  ghi_chu: string | null;
}

type HangHoaLineEnrich = Pick<
  HangHoaRefLite,
  | 'ma_hang'
  | 'ma_hang_hoa'
  | 'ten_hang'
  | 'ten_hang_hoa'
  | 'dvt'
  | 'don_vi_tinh'
  | 'danh_muc_id'
  | 'danh_muc_cha_id'
  | 'ten_danh_muc_cap1'
  | 'ten_danh_muc_cap2'
>;

function toNum(s: string | null | undefined): number | null {
  if (s == null || s === '') return null;
  const n = Number(s);
  return Number.isNaN(n) ? null : n;
}

function rowToDon(
  row: DonDbRow,
  enrich?: {
    ma_nha_cung_cap?: string;
    so_phieu_de_xuat?: string | null;
    ten_nguoi_dat?: string;
    ma_nguoi_dat?: string;
    ten_nguoi_duyet?: string | null;
    ma_nguoi_duyet?: string | null;
  }
): DonDatHang {
  return {
    id: String(row.id),
    so_po: row.so_po ?? '',
    ngay_dat: row.ngay_dat ?? '',
    ngay_giao_dk: row.ngay_giao_dk ?? '',
    id_nha_cung_cap: String(row.id_nha_cung_cap),
    ten_nha_cung_cap: row.ten_nha_cung_cap ?? undefined,
    ma_nha_cung_cap: enrich?.ma_nha_cung_cap,
    id_kho_nhan: row.id_kho_nhan != null ? String(row.id_kho_nhan) : null,
    ten_kho_nhan: row.ten_kho_nhan ?? null,
    id_phieu_de_xuat_vat_tu: row.id_phieu_de_xuat_vat_tu != null ? String(row.id_phieu_de_xuat_vat_tu) : null,
    so_phieu_de_xuat: enrich?.so_phieu_de_xuat ?? null,
    id_nguoi_dat: String(row.id_nguoi_dat),
    ten_nguoi_dat: enrich?.ten_nguoi_dat,
    ma_nguoi_dat: enrich?.ma_nguoi_dat,
    id_nguoi_duyet: row.id_nguoi_duyet != null ? String(row.id_nguoi_duyet) : null,
    ten_nguoi_duyet: enrich?.ten_nguoi_duyet ?? null,
    ma_nguoi_duyet: enrich?.ma_nguoi_duyet ?? null,
    ghi_chu: row.ghi_chu ?? undefined,
    trang_thai: trangThaiFromDb(row.trang_thai),
    tg_tao: row.tg_tao ?? new Date().toISOString(),
    tg_cap_nhat: row.tg_cap_nhat ?? new Date().toISOString(),
  };
}

function rowToChiTiet(row: ChiTietDbRow, idDonStr: string, enrich?: HangHoaLineEnrich): DonDatHangChiTiet {
  return {
    id: String(row.id),
    id_don_dat_hang: idDonStr,
    id_hang_hoa: String(row.id_hang_hoa),
    so_luong: Number(row.so_luong),
    don_vi_tinh: row.don_vi_tinh ?? enrich?.don_vi_tinh ?? undefined,
    don_gia: row.don_gia != null ? Number(row.don_gia) : undefined,
    thanh_tien: row.thanh_tien != null ? Number(row.thanh_tien) : undefined,
    ghi_chu: row.ghi_chu ?? undefined,
    ten_danh_muc_cap1: enrich?.ten_danh_muc_cap1,
    ten_danh_muc_cap2: enrich?.ten_danh_muc_cap2,
    phan_loai: row.phan_loai ?? null,
    muc_dich_su_dung: row.muc_dich_su_dung?.trim() ? row.muc_dich_su_dung.trim() : null,
    ma_hang: enrich?.ma_hang,
    ten_hang: enrich?.ten_hang,
  };
}

/** Map một dòng view summary (đã JOIN trên DB) → DonDatHang — không gọi getKhoRef/getDoiTacRef/getEmployeesRef. */
function mapDonSummaryRowToDon(row: DonSummaryRow): DonDatHang {
  const so_phieu_de_xuat =
    row.so_phieu_de_xuat_ref != null && String(row.so_phieu_de_xuat_ref).trim() !== ''
      ? String(row.so_phieu_de_xuat_ref).trim()
      : null;
  const ten_nha_cung_cap = row.ref_ten_nha_cung_cap ?? row.ten_nha_cung_cap ?? undefined;
  const ten_kho_nhan = row.ref_ten_kho_nhan ?? row.ten_kho_nhan ?? null;
  const don = rowToDon(row, {
    ma_nha_cung_cap: row.ref_ma_nha_cung_cap ?? undefined,
    so_phieu_de_xuat,
    ten_nguoi_dat: row.ref_ten_nguoi_dat ?? undefined,
    ma_nguoi_dat: row.ref_ma_nguoi_dat ?? undefined,
    ten_nguoi_duyet: row.ref_ten_nguoi_duyet ?? null,
    ma_nguoi_duyet: row.ref_ma_nguoi_duyet ?? null,
  });
  if (ten_nha_cung_cap != null) don.ten_nha_cung_cap = ten_nha_cung_cap;
  if (ten_kho_nhan != null) don.ten_kho_nhan = ten_kho_nhan;
  return don;
}

export async function getAllDonDatHangSupabase(): Promise<DonDatHang[]> {
  const rows = await fetchAllRows<DonSummaryRow>((from, to) =>
    db
      .from(VIEW_DON_DAT_HANG_SUMMARY)
      .select(VIEW_DON_DAT_HANG_SUMMARY_COLUMNS)
      .order('ngay_dat', { ascending: false })
      .order('so_po', { ascending: false })
      .range(from, to)
  );
  return rows.map((row) => mapDonSummaryRowToDon(row));
}

const DON_DAT_HANG_PAGE_SIZE_DEFAULT = 50;
const IMPOSSIBLE_NUM_ID = -2147483647;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function applyDonDatHangScope(q: any, scope: BranchListScope): any {
  const b = q;
  if (scope.viewAll) return b;
  const own = scope.ownEmployeeIdNum;
  if (!scope.viewByBranch) {
    if (own != null) return b.eq('id_nguoi_dat', own);
    return b.eq('id', IMPOSSIBLE_NUM_ID);
  }
  const ids = scope.allowedKhoNumericIds;
  const parts: string[] = [];
  if (own != null) parts.push(`id_nguoi_dat.eq.${own}`);
  if (ids.length > 0) {
    const inl = `(${ids.join(',')})`;
    parts.push(`id_kho_nhan.in.${inl}`);
  }
  if (parts.length === 0) return b.eq('id', IMPOSSIBLE_NUM_ID);
  return b.or(parts.join(','));
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function applyDonDatHangListQuery(q: any, query: DonDatHangListServerQuery): any {
  let b = applyDonDatHangScope(q, query.scope);
  if (query.trangThaiViet.length) b = b.in('trang_thai', query.trangThaiViet);
  if (query.idNhaCungCap.length) b = b.in('id_nha_cung_cap', query.idNhaCungCap);
  if (query.idKhoNhan.length) b = b.in('id_kho_nhan', query.idKhoNhan);
  if (query.idNguoiDat.length) b = b.in('id_nguoi_dat', query.idNguoiDat);
  const term = (query.searchTerm ?? '').trim();
  if (term) {
    const esc = term.replace(/%/g, '\\%').replace(/_/g, '\\_');
    const pat = postgrestQuotedIlikePattern(`%${esc}%`);
    const parts = [
      `so_po.ilike.${pat}`,
      `ghi_chu.ilike.${pat}`,
      `ten_nha_cung_cap.ilike.${pat}`,
      `ten_kho_nhan.ilike.${pat}`,
      `trang_thai.ilike.${pat}`,
      `so_phieu_de_xuat_ref.ilike.${pat}`,
      `ref_ma_nha_cung_cap.ilike.${pat}`,
      `ref_ten_nha_cung_cap.ilike.${pat}`,
      `ref_ten_kho_nhan.ilike.${pat}`,
      `ref_ten_nguoi_dat.ilike.${pat}`,
      `ref_ma_nguoi_dat.ilike.${pat}`,
      `ref_ten_nguoi_duyet.ilike.${pat}`,
      `ref_ma_nguoi_duyet.ilike.${pat}`,
    ];
    if (/^\d+$/.test(term)) {
      const n = Number(term);
      if (Number.isSafeInteger(n)) parts.push(`id.eq.${n}`);
    }
    b = b.or(parts.join(','));
  }
  return b;
}

/** Tab chi tiết: cùng scope/filter danh sách + tìm thêm mã/tên hàng, ghi chú dòng. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function applyChiTietDonDatHangFlatListQuery(q: any, query: DonDatHangListServerQuery): any {
  let b = applyDonDatHangScope(q, query.scope);
  if (query.trangThaiViet.length) b = b.in('trang_thai', query.trangThaiViet);
  if (query.idNhaCungCap.length) b = b.in('id_nha_cung_cap', query.idNhaCungCap);
  if (query.idKhoNhan.length) b = b.in('id_kho_nhan', query.idKhoNhan);
  if (query.idNguoiDat.length) b = b.in('id_nguoi_dat', query.idNguoiDat);
  if (query.phanLoai.length) b = b.in('phan_loai', query.phanLoai);
  if (query.idHangHoaByProductFilters?.length) b = b.in('id_hang_hoa', query.idHangHoaByProductFilters);
  const term = (query.searchTerm ?? '').trim();
  if (term) {
    const esc = term.replace(/%/g, '\\%').replace(/_/g, '\\_');
    const pat = postgrestQuotedIlikePattern(`%${esc}%`);
    const parts = [
      `so_po.ilike.${pat}`,
      `ghi_chu.ilike.${pat}`,
      `ten_nha_cung_cap.ilike.${pat}`,
      `ten_kho_nhan.ilike.${pat}`,
      `ma_hang.ilike.${pat}`,
      `ten_hang.ilike.${pat}`,
      `chi_tiet_ghi_chu.ilike.${pat}`,
      `phan_loai.ilike.${pat}`,
      `muc_dich_su_dung.ilike.${pat}`,
      `don_vi_tinh.ilike.${pat}`,
      `trang_thai.ilike.${pat}`,
      `so_phieu_de_xuat_ref.ilike.${pat}`,
      `ref_ma_nha_cung_cap.ilike.${pat}`,
      `ref_ten_nha_cung_cap.ilike.${pat}`,
      `ref_ten_kho_nhan.ilike.${pat}`,
      `ref_ten_nguoi_dat.ilike.${pat}`,
      `ref_ma_nguoi_dat.ilike.${pat}`,
      `ref_ten_nguoi_duyet.ilike.${pat}`,
      `ref_ma_nguoi_duyet.ilike.${pat}`,
    ];
    if (/^\d+$/.test(term)) {
      const n = Number(term);
      if (Number.isSafeInteger(n)) {
        parts.push(`id.eq.${n}`, `chi_tiet_id.eq.${n}`, `id_hang_hoa.eq.${n}`);
      }
    }
    b = b.or(parts.join(','));
  }
  return b;
}

/** Row từ v_don_dat_hang_chi_tiet_flat (PostgREST). `id` là id đơn (header). */
interface DonDatHangChiTietFlatViewRow {
  chi_tiet_id: number;
  id: number;
  id_don_dat_hang: number;
  id_hang_hoa: number;
  so_luong: number | string | null;
  don_vi_tinh: string | null;
  don_gia: number | string | null;
  thanh_tien: number | string | null;
  phan_loai: string | null;
  muc_dich_su_dung?: string | null;
  chi_tiet_ghi_chu: string | null;
  ma_hang: string | null;
  ten_hang: string | null;
  so_po: string;
  ngay_dat: string;
  ngay_giao_dk: string;
  id_nha_cung_cap: number;
  ten_nha_cung_cap: string | null;
  id_kho_nhan: number | null;
  ten_kho_nhan: string | null;
  id_phieu_de_xuat_vat_tu: number | null;
  id_nguoi_dat: number;
  id_nguoi_duyet: number | null;
  ghi_chu: string | null;
  trang_thai: string;
  tg_tao: string | null;
  tg_cap_nhat: string | null;
  so_phieu_de_xuat_ref?: string | null;
  ref_ma_nha_cung_cap?: string | null;
  ref_ten_nha_cung_cap?: string | null;
  ref_ten_kho_nhan?: string | null;
  ref_ten_nguoi_dat?: string | null;
  ref_ma_nguoi_dat?: string | null;
  ref_ten_nguoi_duyet?: string | null;
  ref_ma_nguoi_duyet?: string | null;
}

const DON_DAT_HANG_CHI_TIET_FLAT_SELECT =
  'chi_tiet_id,id,id_don_dat_hang,id_hang_hoa,so_luong,don_vi_tinh,don_gia,thanh_tien,phan_loai,muc_dich_su_dung,chi_tiet_ghi_chu,ma_hang,ten_hang,so_po,ngay_dat,ngay_giao_dk,id_nha_cung_cap,ten_nha_cung_cap,id_kho_nhan,ten_kho_nhan,id_phieu_de_xuat_vat_tu,id_nguoi_dat,id_nguoi_duyet,ghi_chu,trang_thai,tg_tao,tg_cap_nhat,so_phieu_de_xuat_ref,ref_ma_nha_cung_cap,ref_ten_nha_cung_cap,ref_ten_kho_nhan,ref_ten_nguoi_dat,ref_ma_nguoi_dat,ref_ten_nguoi_duyet,ref_ma_nguoi_duyet';

function mapDonDatHangChiTietFlatViewRow(row: DonDatHangChiTietFlatViewRow, enrich?: HangHoaLineEnrich): ChiTietDonDatHangFlat {
  const so_phieu_de_xuat =
    row.so_phieu_de_xuat_ref != null && String(row.so_phieu_de_xuat_ref).trim() !== ''
      ? String(row.so_phieu_de_xuat_ref).trim()
      : null;
  const ten_ncc = row.ref_ten_nha_cung_cap ?? row.ten_nha_cung_cap ?? undefined;
  const ten_kho = row.ref_ten_kho_nhan ?? row.ten_kho_nhan ?? null;
  return {
    id: String(row.chi_tiet_id),
    id_don_dat_hang: String(row.id),
    so_po: row.so_po ?? '',
    ngay_dat: row.ngay_dat ?? '',
    ngay_giao_dk: row.ngay_giao_dk ?? '',
    id_nha_cung_cap: String(row.id_nha_cung_cap),
    ten_nha_cung_cap: ten_ncc,
    ma_nha_cung_cap: row.ref_ma_nha_cung_cap ?? undefined,
    id_kho_nhan: row.id_kho_nhan != null ? String(row.id_kho_nhan) : null,
    ten_kho_nhan: ten_kho,
    id_phieu_de_xuat_vat_tu: row.id_phieu_de_xuat_vat_tu != null ? String(row.id_phieu_de_xuat_vat_tu) : null,
    so_phieu_de_xuat,
    id_nguoi_dat: String(row.id_nguoi_dat),
    ten_nguoi_dat: row.ref_ten_nguoi_dat ?? undefined,
    ma_nguoi_dat: row.ref_ma_nguoi_dat ?? undefined,
    id_nguoi_duyet: row.id_nguoi_duyet != null ? String(row.id_nguoi_duyet) : null,
    ten_nguoi_duyet: row.ref_ten_nguoi_duyet ?? null,
    ma_nguoi_duyet: row.ref_ma_nguoi_duyet ?? null,
    don_ghi_chu: row.ghi_chu ?? undefined,
    trang_thai: trangThaiFromDb(row.trang_thai),
    don_tg_tao: row.tg_tao ?? '',
    don_tg_cap_nhat: row.tg_cap_nhat ?? '',
    id_hang_hoa: String(row.id_hang_hoa),
    ten_danh_muc_cap1: enrich?.ten_danh_muc_cap1,
    ten_danh_muc_cap2: enrich?.ten_danh_muc_cap2,
    phan_loai: row.phan_loai ?? null,
    muc_dich_su_dung: row.muc_dich_su_dung?.trim() ? row.muc_dich_su_dung.trim() : null,
    ma_hang: row.ma_hang?.trim() ? row.ma_hang.trim() : (enrich?.ma_hang ?? enrich?.ma_hang_hoa ?? undefined),
    ten_hang: row.ten_hang ?? enrich?.ten_hang_hoa ?? enrich?.ten_hang ?? undefined,
    so_luong: Number(row.so_luong),
    don_gia: row.don_gia != null ? Number(row.don_gia) : undefined,
    thanh_tien: row.thanh_tien != null ? Number(row.thanh_tien) : undefined,
    don_vi_tinh: row.don_vi_tinh ?? undefined,
    ghi_chu: row.chi_tiet_ghi_chu ?? undefined,
  };
}

function buildHangHoaLineMap(hangHoaList: HangHoaRefLite[]): Record<string, HangHoaLineEnrich> {
  const hangHoaMap: Record<string, HangHoaLineEnrich> = {};
  hangHoaList.forEach((h) => {
    hangHoaMap[h.id] = h;
  });
  return hangHoaMap;
}

async function resolveChiTietHangHoaFilters(
  query?: DonDatHangListServerQuery
): Promise<{ query?: DonDatHangListServerQuery; hangHoaList?: HangHoaRefLite[] }> {
  const hasProductFilter =
    !!query?.idDanhMucCap1?.length ||
    !!query?.idDanhMucCap2?.length;
  if (!query || !hasProductFilter) return { query };
  const hangHoaList = await getHangHoaRef();
  const selectedCap1 = new Set(query.idDanhMucCap1.map((x) => x.trim()).filter(Boolean));
  const selectedCap2 = new Set(query.idDanhMucCap2.map((x) => x.trim()).filter(Boolean));
  const ids = hangHoaList
    .filter((h) => {
      const matchCap1 = selectedCap1.size === 0 || (h.danh_muc_cha_id != null && selectedCap1.has(h.danh_muc_cha_id));
      const matchCap2 = selectedCap2.size === 0 || (h.danh_muc_id != null && selectedCap2.has(h.danh_muc_id));
      return matchCap1 && matchCap2;
    })
    .map((h) => Number(h.id))
    .filter((id) => Number.isSafeInteger(id));
  return {
    query: {
      ...query,
      idHangHoaByProductFilters: ids.length > 0 ? ids : [IMPOSSIBLE_NUM_ID],
    },
    hangHoaList,
  };
}

function mapDonDatHangChiTietFlatViewRows(
  flatRows: DonDatHangChiTietFlatViewRow[],
  hangHoaMap: Record<string, HangHoaLineEnrich> = {}
): ChiTietDonDatHangFlat[] {
  const out = flatRows.map((row) => mapDonDatHangChiTietFlatViewRow(row, hangHoaMap[String(row.id_hang_hoa)]));
  out.sort(
    (a, b) =>
      (b.ngay_dat || '').localeCompare(a.ngay_dat || '') ||
      (b.so_po || '').localeCompare(a.so_po || '') ||
      String(b.id).localeCompare(String(a.id), undefined, { numeric: true })
  );
  return out;
}

const CHI_TIET_DON_DAT_HANG_PAGE_SIZE_DEFAULT = 100;

/** Một trang danh sách đơn đặt hàng (server-side). */
export async function getDonDatHangPageSupabase(
  page: number,
  pageSize: number = DON_DAT_HANG_PAGE_SIZE_DEFAULT,
  listQuery?: DonDatHangListServerQuery
): Promise<PaginatedTableResult<DonDatHang>> {
  const pageResult = await fetchTablePage<DonSummaryRow>(page, pageSize, async (from, to) => {
    let sel = db.from(VIEW_DON_DAT_HANG_SUMMARY).select(VIEW_DON_DAT_HANG_SUMMARY_COLUMNS, { count: 'exact' });
    if (listQuery) sel = applyDonDatHangListQuery(sel, listQuery);
    const res = await sel.order('ngay_dat', { ascending: false }).order('so_po', { ascending: false }).range(from, to);
    return { data: res.data as DonSummaryRow[] | null, error: res.error, count: res.count };
  });
  const data = pageResult.data.map((row) => mapDonSummaryRowToDon(row));
  return { data, totalCount: pageResult.totalCount, page: pageResult.page, pageSize: pageResult.pageSize };
}

export async function fetchAllDonDatHangForListQuerySupabase(
  listQuery: DonDatHangListServerQuery,
  pageSize = 500,
  maxRows = 25000
): Promise<DonDatHang[]> {
  const out: DonDatHang[] = [];
  let page = 0;
  while (out.length < maxRows) {
    const { data, totalCount } = await getDonDatHangPageSupabase(page, pageSize, listQuery);
    out.push(...data);
    if (data.length === 0 || out.length >= totalCount) break;
    page += 1;
  }
  return out;
}

/** Một trang chi tiết đơn đặt hàng phẳng (server-side). */
export async function getChiTietDonDatHangPageSupabase(
  page: number,
  pageSize: number = CHI_TIET_DON_DAT_HANG_PAGE_SIZE_DEFAULT,
  listQuery?: DonDatHangListServerQuery
): Promise<PaginatedTableResult<ChiTietDonDatHangFlat>> {
  const { query: effectiveQuery, hangHoaList: preloadedHangHoaList } = await resolveChiTietHangHoaFilters(listQuery);
  const pageResult = await fetchTablePage<DonDatHangChiTietFlatViewRow>(page, pageSize, async (from, to) => {
    let sel = db.from(VIEW_DON_DAT_HANG_CHI_TIET_FLAT).select(DON_DAT_HANG_CHI_TIET_FLAT_SELECT, { count: 'exact' });
    if (effectiveQuery) sel = applyChiTietDonDatHangFlatListQuery(sel, effectiveQuery);
    const res = await sel
      .order('ngay_dat', { ascending: false })
      .order('so_po', { ascending: false })
      .order('chi_tiet_id', { ascending: false })
      .range(from, to);
    return { data: res.data as DonDatHangChiTietFlatViewRow[] | null, error: res.error, count: res.count };
  });
  const hangHoaMap = pageResult.data.length > 0 ? buildHangHoaLineMap(preloadedHangHoaList ?? (await getHangHoaRef())) : {};
  const data = mapDonDatHangChiTietFlatViewRows(pageResult.data, hangHoaMap);
  return { data, totalCount: pageResult.totalCount, page: pageResult.page, pageSize: pageResult.pageSize };
}

/** Gom tối đa `maxRows` dòng chi tiết phẳng khớp `listQuery` — dùng export. */
export async function fetchAllChiTietDonDatHangForListQuerySupabase(
  listQuery: DonDatHangListServerQuery,
  pageSize = 500,
  maxRows = 25000
): Promise<ChiTietDonDatHangFlat[]> {
  const out: ChiTietDonDatHangFlat[] = [];
  let page = 0;
  while (out.length < maxRows) {
    const { data, totalCount } = await getChiTietDonDatHangPageSupabase(page, pageSize, listQuery);
    out.push(...data);
    if (data.length === 0 || out.length >= totalCount) break;
    page += 1;
  }
  return out;
}

export async function getPhanLoaiDonDatHangChiTietSupabase(): Promise<string[]> {
  const rows = await fetchAllRows<{ phan_loai: string | null }>((from, to) =>
    db
      .from(TABLE_CHI_TIET)
      .select('phan_loai')
      .not('phan_loai', 'is', null)
      .range(from, to)
  );
  return [...new Set(rows.map((row) => row.phan_loai?.trim()).filter((value): value is string => !!value))]
    .sort((a, b) => a.localeCompare(b));
}

export async function getDonDatHangByIdSupabase(id: string): Promise<DonDatHang | null> {
  const idNum = Number(id);
  if (Number.isNaN(idNum)) return null;

  const { data: row, error } = await db
    .from(VIEW_DON_DAT_HANG_SUMMARY)
    .select(VIEW_DON_DAT_HANG_SUMMARY_COLUMNS)
    .eq('id', idNum)
    .maybeSingle();
  if (error) throwSupabaseError(error);
  if (!row) return null;

  const [ctRows, hangHoaList] = await Promise.all([
    db
      .from(TABLE_CHI_TIET)
      .select('id, id_don_dat_hang, id_hang_hoa, phan_loai, muc_dich_su_dung, so_luong, don_vi_tinh, don_gia, thanh_tien, ghi_chu')
      .eq('id_don_dat_hang', idNum)
      .order('id', { ascending: true })
      .then((r) => r.data ?? []),
    getHangHoaRef(),
  ]);

  const hangHoaMap = buildHangHoaLineMap(hangHoaList);

  const p = row as DonSummaryRow;
  const don = mapDonSummaryRowToDon(p);

  const chi_tiet: DonDatHangChiTiet[] = (ctRows as ChiTietDbRow[]).map((ct) => {
    const enrich = hangHoaMap[String(ct.id_hang_hoa)];
    return rowToChiTiet(ct, id, enrich);
  });
  don.chi_tiet = chi_tiet;
  return don;
}

export async function createDonDatHangSupabase(data: DonDatHangFormValues): Promise<DonDatHang> {
  const soPo = data.so_po.trim();
  const { data: existing } = await db.from(TABLE_DON).select('id').eq('so_po', soPo).maybeSingle();
  if (existing) throw new Error(i18n.t('donDatHang.service.duplicateCode'));

  const [doiTacList, khoList] = await Promise.all([
    getDoiTacRef('nha_cung_cap'),
    getKhoRef(),
  ]);
  const nccMap: Record<string, string> = {};
  doiTacList.forEach((d) => { nccMap[d.id] = d.ten_ncc; });
  const khoMap: Record<string, string> = {};
  khoList.forEach((k) => { khoMap[k.id] = k.ten_kho; });

  const payload = {
    so_po: soPo,
    ngay_dat: data.ngay_dat.trim(),
    ngay_giao_dk: data.ngay_giao_dk.trim(),
    id_nha_cung_cap: Number(data.id_nha_cung_cap),
    ten_nha_cung_cap: nccMap[data.id_nha_cung_cap] ?? null,
    id_kho_nhan: toNum(data.id_kho_nhan),
    ten_kho_nhan: data.id_kho_nhan ? (khoMap[data.id_kho_nhan] ?? null) : null,
    id_phieu_de_xuat_vat_tu: toNum(data.id_phieu_de_xuat_vat_tu),
    id_nguoi_dat: Number(data.id_nguoi_dat),
    id_nguoi_duyet: toNum(data.id_nguoi_duyet),
    ghi_chu: data.ghi_chu?.trim() || null,
    trang_thai: data.trang_thai,
  };

  const { data: inserted, error } = await db.from(TABLE_DON).insert(payload).select(DON_DAT_HANG_ROW_COLUMNS).single();
  if (error) throwSupabaseError(error);
  const idDon = (inserted as DonDbRow).id;
  const idStr = String(idDon);

  const hangHoaList = await getHangHoaRef();
  const hangHoaMap: Record<string, string> = {};
  hangHoaList.forEach((h) => { hangHoaMap[h.id] = h.dvt ?? ''; });

  const chiTietPayload = (data.chi_tiet ?? []).filter((ct) => ct.id_hang_hoa?.trim() && Number(ct.so_luong) > 0);
  if (chiTietPayload.length > 0) {
    const ctRows = chiTietPayload.map((c) => ({
      id_don_dat_hang: idDon,
      id_hang_hoa: Number(c.id_hang_hoa),
      phan_loai: c.phan_loai?.trim() || null,
      muc_dich_su_dung: c.muc_dich_su_dung?.trim() || null,
      so_luong: Number(c.so_luong),
      don_vi_tinh: hangHoaMap[c.id_hang_hoa.trim()] ?? null,
      don_gia: Number(c.don_gia ?? 0),
      ghi_chu: c.ghi_chu?.trim() || null,
    }));
    const { error: errCt } = await db.from(TABLE_CHI_TIET).insert(ctRows);
    if (errCt) throwSupabaseError(errCt);
  }

  const got = await getDonDatHangByIdSupabase(idStr);
  if (!got) throw new Error(i18n.t('donDatHang.service.notFound'));
  return got;
}

export async function updateDonDatHangSupabase(id: string, data: DonDatHangFormValues): Promise<DonDatHang> {
  const idNum = Number(id);
  if (Number.isNaN(idNum)) throw new Error(i18n.t('donDatHang.service.notFound'));

  const { data: oldRow, error: fetchErr } = await db.from(TABLE_DON).select(DON_DAT_HANG_ROW_COLUMNS).eq('id', idNum).maybeSingle();
  if (fetchErr || !oldRow) throw new Error(i18n.t('donDatHang.service.notFound'));

  const soPo = data.so_po.trim();
  const { data: other } = await db.from(TABLE_DON).select('id').eq('so_po', soPo).neq('id', idNum).maybeSingle();
  if (other) throw new Error(i18n.t('donDatHang.service.duplicateCode'));

  const [doiTacList, khoList] = await Promise.all([
    getDoiTacRef('nha_cung_cap'),
    getKhoRef(),
  ]);
  const nccMap: Record<string, string> = {};
  doiTacList.forEach((d) => { nccMap[d.id] = d.ten_ncc; });
  const khoMap: Record<string, string> = {};
  khoList.forEach((k) => { khoMap[k.id] = k.ten_kho; });

  const payload = {
    so_po: soPo,
    ngay_dat: data.ngay_dat.trim(),
    ngay_giao_dk: data.ngay_giao_dk.trim(),
    id_nha_cung_cap: Number(data.id_nha_cung_cap),
    ten_nha_cung_cap: nccMap[data.id_nha_cung_cap] ?? null,
    id_kho_nhan: toNum(data.id_kho_nhan),
    ten_kho_nhan: data.id_kho_nhan ? (khoMap[data.id_kho_nhan] ?? null) : null,
    id_phieu_de_xuat_vat_tu: toNum(data.id_phieu_de_xuat_vat_tu),
    id_nguoi_dat: Number(data.id_nguoi_dat),
    id_nguoi_duyet: toNum(data.id_nguoi_duyet),
    ghi_chu: data.ghi_chu?.trim() || null,
    trang_thai: data.trang_thai,
  };

  const { error: updateErr } = await db.from(TABLE_DON).update(payload).eq('id', idNum);
  if (updateErr) throwSupabaseError(updateErr);

  await db.from(TABLE_CHI_TIET).delete().eq('id_don_dat_hang', idNum);

  const hangHoaList = await getHangHoaRef();
  const hangHoaMap: Record<string, string> = {};
  hangHoaList.forEach((h) => { hangHoaMap[h.id] = h.dvt ?? ''; });

  const chiTietPayload = (data.chi_tiet ?? []).filter((ct) => ct.id_hang_hoa?.trim() && Number(ct.so_luong) > 0);
  if (chiTietPayload.length > 0) {
    const ctRows = chiTietPayload.map((c) => ({
      id_don_dat_hang: idNum,
      id_hang_hoa: Number(c.id_hang_hoa),
      phan_loai: c.phan_loai?.trim() || null,
      muc_dich_su_dung: c.muc_dich_su_dung?.trim() || null,
      so_luong: Number(c.so_luong),
      don_vi_tinh: hangHoaMap[c.id_hang_hoa.trim()] ?? null,
      don_gia: Number(c.don_gia ?? 0),
      ghi_chu: c.ghi_chu?.trim() || null,
    }));
    const { error: errCt } = await db.from(TABLE_CHI_TIET).insert(ctRows);
    if (errCt) throwSupabaseError(errCt);
  }

  const got = await getDonDatHangByIdSupabase(id);
  if (!got) throw new Error(i18n.t('donDatHang.service.notFound'));
  return got;
}

/**
 * Đổi trạng thái PO (duyệt/chuyển trạng thái) — chỉ update trang_thai + ghi_chu,
 * KHÔNG đụng chi_tiet. Tự đọc ghi_chu hiện tại từ DB để nối thêm ghi chú, không
 * phụ thuộc vào object PO caller đang giữ (item/viewingPoFull) — tránh lặp lại
 * bug "duyệt khi viewingPoFull chưa load xong ⇒ gửi object cũ/thiếu chi_tiet
 * ⇒ updateDonDatHangSupabase xoá sạch dòng hàng" vì đường này không gọi
 * updateDonDatHangSupabase (full update) nữa.
 */
export async function updateDonDatHangTrangThaiSupabase(
  id: string,
  trang_thai: DonDatHangTrangThai,
  options?: { ghi_chu?: string; notePrefix?: string }
): Promise<void> {
  const idNum = Number(id);
  if (Number.isNaN(idNum)) throw new Error(i18n.t('donDatHang.service.notFound'));

  const { data: row, error: fetchErr } = await db.from(TABLE_DON).select('ghi_chu').eq('id', idNum).maybeSingle();
  if (fetchErr || !row) throw new Error(i18n.t('donDatHang.service.notFound'));

  const existingGhiChu = (row as { ghi_chu?: string | null } | null)?.ghi_chu ?? '';
  const noteText = options?.ghi_chu?.trim();
  const mergedGhiChu = noteText
    ? (existingGhiChu ? existingGhiChu + '\n' : '') + `${options?.notePrefix ?? ''}${noteText}`
    : existingGhiChu || null;

  const { error } = await db
    .from(TABLE_DON)
    .update({ trang_thai, ghi_chu: mergedGhiChu })
    .eq('id', idNum);
  if (error) throwSupabaseError(error);
}

export async function deleteDonDatHangSupabase(id: string): Promise<void> {
  const idNum = Number(id);
  if (Number.isNaN(idNum)) throw new Error(i18n.t('donDatHang.service.notFound'));
  const { error } = await db.from(TABLE_DON).delete().eq('id', idNum);
  if (error) throwSupabaseError(error);
}

export async function deleteDonDatHangManySupabase(ids: string[]): Promise<void> {
  const numIds = ids.map((s) => Number(s)).filter((n) => !Number.isNaN(n));
  if (numIds.length === 0) return;
  const { error } = await db.from(TABLE_DON).delete().in('id', numIds);
  if (error) throwSupabaseError(error);
}

/** Gọi RPC lấy số thứ tự tiếp theo cho so_po (app format: PO-YYYY- + pad). */
export async function getNextSoPoDonDatHangSupabase(): Promise<number> {
  const { data, error } = await db.rpc('get_next_so_po_don_dat_hang');
  if (error) throwSupabaseError(error);
  if (typeof data === 'number' && Number.isFinite(data)) return data;
  const n = Number(data);
  return Number.isFinite(n) ? n : 1;
}

/** Kết quả Thống kê (giống computeDonDatHangStats + chip counts). */
export type DonDatHangThongKeRpcResult = {
  summary: DonDatHangStatsSummary;
  byTrangThai: DonDatHangStatsByTrangThai[];
  bySupplier: StatsChartItem[];
  byBuyer: StatsChartItem[];
  byMonth: StatsChartItem[];
  chipByTrangThai: Record<string, number>;
  chipBySupplierId: Record<string, number>;
  chipByBuyerId: Record<string, number>;
};

type RpcDonStatsJson = {
  summary: DonDatHangThongKeRpcResult['summary'];
  byTrangThai: { id: string; count: number }[];
  bySupplier: StatsChartItem[];
  byBuyer: StatsChartItem[];
  byMonth: StatsChartItem[];
  chipByTrangThai: Record<string, number>;
  chipBySupplierId: Record<string, number>;
  chipByBuyerId: Record<string, number>;
};

/** Gọi rpc_don_dat_hang_stats (docs/supabase-rpc_don_dat_hang_stats.sql). Trả null nếu RPC chưa deploy / lỗi. */
export async function fetchDonDatHangThongKeFromRpc(params: {
  dateFrom: string;
  dateTo: string;
  filterStatus: string[];
  filterSupplier: string[];
  filterBuyer: string[];
}): Promise<DonDatHangThongKeRpcResult | null> {
  const toDate = (s: string) => (s && s.trim() !== '' ? s.trim().slice(0, 10) : null);
  const pSupplier = params.filterSupplier.map((x) => Number(x)).filter((n) => !Number.isNaN(n));
  const pBuyer = params.filterBuyer.map((x) => Number(x)).filter((n) => !Number.isNaN(n));
  const { data, error } = await db.rpc('rpc_don_dat_hang_stats', {
    p_date_from: toDate(params.dateFrom),
    p_date_to: toDate(params.dateTo),
    p_trang_thai: params.filterStatus.length ? params.filterStatus : null,
    p_supplier_ids: pSupplier.length ? pSupplier : null,
    p_buyer_ids: pBuyer.length ? pBuyer : null,
  });
  if (error || data == null || typeof data !== 'object') return null;
  const j = data as RpcDonStatsJson;
  if (!j.summary || !Array.isArray(j.byTrangThai)) return null;
  const byTrangThai: DonDatHangStatsByTrangThai[] = TRANG_THAI_DON_DAT_HANG.map((s) => {
    const row = j.byTrangThai.find((r) => r.id === s);
    return {
      id: s,
      ten: `status.${TRANG_THAI_KEY[s]}`,
      count: row?.count ?? 0,
    };
  });
  return {
    summary: j.summary,
    byTrangThai,
    bySupplier: Array.isArray(j.bySupplier) ? j.bySupplier : [],
    byBuyer: Array.isArray(j.byBuyer) ? j.byBuyer : [],
    byMonth: Array.isArray(j.byMonth) ? j.byMonth : [],
    chipByTrangThai: j.chipByTrangThai && typeof j.chipByTrangThai === 'object' ? j.chipByTrangThai : {},
    chipBySupplierId: j.chipBySupplierId && typeof j.chipBySupplierId === 'object' ? j.chipBySupplierId : {},
    chipByBuyerId: j.chipByBuyerId && typeof j.chipByBuyerId === 'object' ? j.chipByBuyerId : {},
  };
}

/** Kết quả tổng hợp theo danh mục / phân loại cho tab Thống kê. */
export interface ChiTietCategoryStatsItem {
  id_hang_hoa: string;
  phan_loai: string | null;
  ten_danh_muc_cap1?: string;
  ten_danh_muc_cap2?: string;
}

/** Lấy dữ liệu tối thiểu từ flat view để tính thống kê theo danh mục cấp 1/2 và phân loại. */
export async function fetchChiTietForCategoryStatsSupabase(params: {
  dateFrom?: string;
  dateTo?: string;
  filterStatus?: string[];
  filterSupplier?: string[];
  filterBuyer?: string[];
}): Promise<ChiTietCategoryStatsItem[]> {
  const rows = await fetchAllRows<{ id_hang_hoa: number; phan_loai: string | null }>((from, to) => {
    let q = db
      .from(VIEW_DON_DAT_HANG_CHI_TIET_FLAT)
      .select('id_hang_hoa,phan_loai')
      .range(from, to);
    if (params.filterStatus?.length) q = q.in('trang_thai', params.filterStatus);
    if (params.filterSupplier?.length) {
      const nums = params.filterSupplier.map(Number).filter((n) => !Number.isNaN(n));
      if (nums.length) q = q.in('id_nha_cung_cap', nums);
    }
    if (params.filterBuyer?.length) {
      const nums = params.filterBuyer.map(Number).filter((n) => !Number.isNaN(n));
      if (nums.length) q = q.in('id_nguoi_dat', nums);
    }
    if (params.dateFrom) q = q.gte('ngay_dat', params.dateFrom);
    if (params.dateTo) q = q.lte('ngay_dat', params.dateTo);
    return q;
  });

  const hangHoaList = await getHangHoaRef();
  const hangHoaMap: Record<string, { ten_danh_muc_cap1?: string; ten_danh_muc_cap2?: string }> = {};
  hangHoaList.forEach((h) => {
    hangHoaMap[h.id] = { ten_danh_muc_cap1: h.ten_danh_muc_cap1, ten_danh_muc_cap2: h.ten_danh_muc_cap2 };
  });

  return rows.map((r) => ({
    id_hang_hoa: String(r.id_hang_hoa),
    phan_loai: r.phan_loai ?? null,
    ten_danh_muc_cap1: hangHoaMap[String(r.id_hang_hoa)]?.ten_danh_muc_cap1,
    ten_danh_muc_cap2: hangHoaMap[String(r.id_hang_hoa)]?.ten_danh_muc_cap2,
  }));
}

/** Chỉ id + số PO + ngày đặt — dropdown liên kết phiếu nhập ↔ đơn đặt hàng (giảm egress). */
export type DonDatHangSoPoOption = { id: string; so_po: string; ngay: string };

export async function listDonDatHangSoPoMinimalSupabase(limit = 2500): Promise<DonDatHangSoPoOption[]> {
  const { data, error } = await db
    .from(TABLE_DON)
    .select('id, so_po, ngay_dat')
    .order('id', { ascending: false })
    .limit(limit);
  if (error) throwSupabaseError(error);
  return (data ?? []).map((r: { id: number; so_po: string | null; ngay_dat: string | null }) => ({
    id: String(r.id),
    so_po: r.so_po ?? '',
    ngay: r.ngay_dat ?? '',
  }));
}
