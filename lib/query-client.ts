import { QueryClient, type Query } from '@tanstack/react-query';
import { createSyncStoragePersister } from '@tanstack/query-sync-storage-persister';
import { persistQueryClient } from '@tanstack/react-query-persist-client';

/**
 * gcTime phải ≥ maxAge để persister có thể khôi phục cache sau F5 (TanStack v5).
 * Đặt 24h cho cả gcTime và maxAge để ref query (chức vụ/phòng ban/công ty…) sống qua reload.
 */
const ONE_DAY_MS = 1000 * 60 * 60 * 24;

/** Singleton dùng chung (prefetch sau đăng nhập, App, tests). */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      gcTime: ONE_DAY_MS,
      refetchOnWindowFocus: false,
    },
  },
});

/**
 * Whitelist cache cần persist qua F5. Đây là các REF TĨNH / ít đổi, nên giữ trong
 * localStorage để tránh mỗi F5 là gọi lại Supabase — nguyên nhân chính đốt egress.
 *
 * Blacklist (KHÔNG persist):
 * - Danh sách phiếu động (phieuKho, phieuDeXuatVatTu, bangLuong, kiemKe, donDatHang…)
 * - Dữ liệu nhạy cảm (logs, password reset…)
 * - Query `employee` chi tiết (có base64 avatar) — chỉ persist ref nhẹ `['employees','ref']`.
 */
const PERSIST_KEY_WHITELIST: readonly string[] = [
  'companyInfo',
  'current-role-context',
  'positions',
  'departments',
  'job-levels',
  'kho',
  'hangHoa',
  'doiTac',
  'branches',
  'employees', // chỉ nhánh ['employees','ref'] — xem shouldDehydrate bên dưới
  'phieuDeXuatVatTu', // chỉ nhánh 'soPhieuMinimal'
];

function shouldPersistQuery(query: Query): boolean {
  const key = query.queryKey;
  if (!Array.isArray(key) || key.length === 0) return false;
  const root = String(key[0]);
  if (!PERSIST_KEY_WHITELIST.includes(root)) return false;

  // employees: chỉ persist nhánh ref (không persist list full — dính base64 avatar).
  if (root === 'employees') return key[1] === 'ref';
  // phieuDeXuatVatTu: chỉ persist soPhieuMinimal, các truy vấn báo cáo/động thì bỏ.
  if (root === 'phieuDeXuatVatTu') return key[1] === 'soPhieuMinimal';
  return true;
}

if (typeof window !== 'undefined') {
  const persister = createSyncStoragePersister({
    storage: window.localStorage,
    key: 'farm-erp-rq-cache',
    throttleTime: 1000,
  });
  // Buster: đổi chuỗi này khi schema cache không tương thích (sau migration lớn).
  // Mỗi lần bump → client sẽ drop cache cũ.
  const CACHE_BUSTER = 'v1-egress-fix-2026-04';
  persistQueryClient({
    queryClient,
    persister,
    maxAge: ONE_DAY_MS,
    buster: CACHE_BUSTER,
    dehydrateOptions: {
      shouldDehydrateQuery: shouldPersistQuery,
    },
  });
}
