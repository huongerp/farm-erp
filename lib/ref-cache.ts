/**
 * In-memory TTL cache for lightweight ref fetchers (getKhoRef, getEmployeesRef, …).
 * Reduces Supabase egress when paged list services call the same refs on every page change.
 */

const store = new Map<string, { data: unknown; ts: number }>();

export const REF_CACHE_TTL_MS = 5 * 60 * 1000;

export const REF_CACHE_KEYS = {
  kho: 'ref:kho',
  employees: 'ref:employees',
  hangHoa: 'ref:hang_hoa',
  doiTac: (loai?: string) => `ref:doi_tac:${loai ?? 'all'}`,
} as const;

export async function getCachedRef<T>(key: string, fetcher: () => Promise<T>, ttlMs = REF_CACHE_TTL_MS): Promise<T> {
  const hit = store.get(key);
  const now = Date.now();
  if (hit && now - hit.ts < ttlMs) return hit.data as T;
  const data = await fetcher();
  store.set(key, { data, ts: now });
  return data;
}

/** Clear one ref category, or entire cache if omitted. */
export function invalidateRefCache(category?: 'kho' | 'employees' | 'hangHoa' | 'doiTac'): void {
  if (!category) {
    store.clear();
    return;
  }
  if (category === 'doiTac') {
    for (const k of [...store.keys()]) {
      if (k.startsWith('ref:doi_tac:')) store.delete(k);
    }
    return;
  }
  const single: Record<'kho' | 'employees' | 'hangHoa', string> = {
    kho: REF_CACHE_KEYS.kho,
    employees: REF_CACHE_KEYS.employees,
    hangHoa: REF_CACHE_KEYS.hangHoa,
  };
  store.delete(single[category]);
}
