/**
 * Tham số truy vấn danh sách đợt kiểm kê phân thuốc — dựng ở component, gửi
 * xuống service để PostgREST lọc / sắp xếp / cắt trang.
 *
 * Việc suy `allowedKhoIds` từ chi nhánh được phép nằm ở đây (chứ không nằm trong
 * component) để test được: nhầm chỗ này là lộ dữ liệu ngoài phạm vi xem.
 */
import type { Kho } from '../../../kho-van/danh-sach-kho/core/types';
import type { EmployeeBranchModuleScope } from '../../../he-thong/nhan-vien/hooks/use-employee-branch-module-scope';
import type { TrangThaiDotKiemKePT } from '../core/types';

export interface DotKiemKePTListServerQuery {
  /** 0-based (PostgREST range). */
  page: number;
  pageSize: number;
  searchTerm: string;
  /** Xem toàn phạm vi (cấp bậc 1 / quyền admin). */
  viewAll: boolean;
  /** Kho được phép xem khi không phải toàn phạm vi. Rỗng = không kho nào. */
  allowedKhoIds: string[];
  /** fp_var_nhan_vien.id — đợt mình tạo / phụ trách luôn thấy. */
  currentEmployeeId: string | null;
  trangThai: TrangThaiDotKiemKePT[];
  idNguoiPhuTrach: string[];
  idKho: string[];
  /** Khoảng kỳ (YYYY-MM-DD); rỗng = không giới hạn. */
  ngayFrom: string;
  ngayTo: string;
  sortColumn: string | null;
  sortDirection: 'asc' | 'desc' | null;
}

/** Cột sắp xếp được ở DB (cột của chính bảng đợt). */
export const KKPT_SORTABLE_DB_COLUMNS = new Set([
  'ma_dot',
  'ten_dot',
  'ngay_bat_dau',
  'ngay_ket_thuc',
  'trang_thai',
  'tg_tao',
  'tg_cap_nhat',
]);

/** Mặc định: đợt kết thúc gần nhất lên đầu. */
export const KKPT_SORT_MAC_DINH = { column: 'ngay_ket_thuc', ascending: false } as const;

export interface BuildKKPTQueryParams {
  searchTerm: string;
  filters: {
    trang_thai: string[];
    id_nguoi_phu_trach: string[];
    id_kho: string[];
    dateFrom: string;
    dateTo: string;
  };
  pagination: { page: number; pageSize: number };
  sort: { column: string | null; direction: 'asc' | 'desc' | null };
  viewScope: Pick<EmployeeBranchModuleScope, 'viewAll' | 'viewByBranch' | 'allowedBranchIds' | 'currentEmployeeId'>;
  khoList: Kho[];
}

/**
 * Kho được phép xem, suy từ chi nhánh của phạm vi.
 * Không `viewByBranch` → mảng rỗng: chỉ còn thấy đợt của chính mình, KHÔNG phải
 * thấy tất cả.
 */
export function khoChoPhepTheoPhamVi(
  viewScope: BuildKKPTQueryParams['viewScope'],
  khoList: Kho[]
): string[] {
  if (viewScope.viewAll) return [];
  if (!viewScope.viewByBranch) return [];
  return khoList
    .filter((k) => k.id_chi_nhanh != null && viewScope.allowedBranchIds.includes(k.id_chi_nhanh))
    .map((k) => k.id);
}

export function buildDotKiemKePTListServerQuery(
  params: BuildKKPTQueryParams
): DotKiemKePTListServerQuery {
  const { searchTerm, filters, pagination, sort, viewScope, khoList } = params;
  const sortHopLe = sort.column != null && KKPT_SORTABLE_DB_COLUMNS.has(sort.column) && sort.direction != null;

  return {
    page: Math.max(0, pagination.page - 1),
    pageSize: pagination.pageSize,
    searchTerm: searchTerm.trim(),
    viewAll: viewScope.viewAll,
    allowedKhoIds: khoChoPhepTheoPhamVi(viewScope, khoList),
    currentEmployeeId: viewScope.currentEmployeeId,
    trangThai: filters.trang_thai as TrangThaiDotKiemKePT[],
    idNguoiPhuTrach: filters.id_nguoi_phu_trach,
    idKho: filters.id_kho,
    ngayFrom: filters.dateFrom,
    ngayTo: filters.dateTo,
    sortColumn: sortHopLe ? sort.column : KKPT_SORT_MAC_DINH.column,
    sortDirection: sortHopLe ? sort.direction : 'desc',
  };
}

export { dieuKienKyTheoNgay, khoangNgay } from '../../../../lib/postgrest-search';
