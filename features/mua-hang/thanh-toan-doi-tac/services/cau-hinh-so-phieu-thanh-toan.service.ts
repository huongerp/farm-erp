/**
 * Cấu hình quy tắc số phiếu thanh toán đối tác – tiền tố, độ dài phần số, số thứ tự tăng dần.
 */
export interface CauHinhSoPhieuThanhToan {
  tien_to_so_phieu: string;
  tu_sinh_so_phieu: boolean;
  do_dai_phan_so: number;
  so_thu_tu_tiep_theo: number;
}

const STORAGE_KEY = 'cau_hinh_so_phieu_thanh_toan_doi_tac';

const DEFAULT_CONFIG: CauHinhSoPhieuThanhToan = {
  tien_to_so_phieu: 'TTO-',
  tu_sinh_so_phieu: true,
  do_dai_phan_so: 4,
  so_thu_tu_tiep_theo: 1,
};

function mergeWithDefaults(parsed: Partial<CauHinhSoPhieuThanhToan>): CauHinhSoPhieuThanhToan {
  return {
    tien_to_so_phieu: parsed.tien_to_so_phieu ?? DEFAULT_CONFIG.tien_to_so_phieu,
    tu_sinh_so_phieu: parsed.tu_sinh_so_phieu ?? DEFAULT_CONFIG.tu_sinh_so_phieu,
    do_dai_phan_so: Math.min(10, Math.max(1, parsed.do_dai_phan_so ?? DEFAULT_CONFIG.do_dai_phan_so)),
    so_thu_tu_tiep_theo: Math.max(1, parsed.so_thu_tu_tiep_theo ?? DEFAULT_CONFIG.so_thu_tu_tiep_theo),
  };
}

export async function getCauHinhSoPhieuThanhToan(): Promise<CauHinhSoPhieuThanhToan> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<CauHinhSoPhieuThanhToan>;
      return mergeWithDefaults(parsed);
    }
  } catch {
    // ignore
  }
  return { ...DEFAULT_CONFIG };
}

export async function saveCauHinhSoPhieuThanhToan(
  data: Partial<CauHinhSoPhieuThanhToan>
): Promise<CauHinhSoPhieuThanhToan> {
  const current = await getCauHinhSoPhieuThanhToan();
  const merged = mergeWithDefaults({ ...current, ...data });
  localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
  return merged;
}

/** Xem trước số phiếu tiếp theo (không tăng counter). */
export async function getNextSoPhieuThanhToanPreview(): Promise<string> {
  const config = await getCauHinhSoPhieuThanhToan();
  if (!config.tu_sinh_so_phieu) return '';
  const padded = String(config.so_thu_tu_tiep_theo).padStart(config.do_dai_phan_so, '0');
  return `${config.tien_to_so_phieu || ''}${padded}`;
}

function parseSoPhieuNumber(soPhieu: string, prefix: string): number | null {
  if (!soPhieu || typeof soPhieu !== 'string') return null;
  const s = soPhieu.trim();
  if (!prefix || !s.startsWith(prefix)) return null;
  const numPart = s.slice(prefix.length);
  if (!/^\d+$/.test(numPart)) return null;
  const n = parseInt(numPart, 10);
  return Number.isNaN(n) ? null : n;
}

/** Trả về số phiếu tiếp theo và tăng so_thu_tu_tiep_theo (tăng dần). Có thể truyền danh sách so_phieu hiện có để đồng bộ counter. */
export async function getNextSoPhieuThanhToanAndIncrement(
  existingSoPhieuList?: string[]
): Promise<string> {
  let config = await getCauHinhSoPhieuThanhToan();
  if (!config.tu_sinh_so_phieu) return '';

  if (existingSoPhieuList?.length && config.tien_to_so_phieu) {
    const prefix = config.tien_to_so_phieu;
    let maxNum = config.so_thu_tu_tiep_theo - 1;
    for (const sp of existingSoPhieuList) {
      const n = parseSoPhieuNumber(sp, prefix);
      if (n != null && n > maxNum) maxNum = n;
    }
    if (maxNum >= config.so_thu_tu_tiep_theo) {
      config = await saveCauHinhSoPhieuThanhToan({ so_thu_tu_tiep_theo: maxNum + 1 });
    }
  }

  const next = config.so_thu_tu_tiep_theo;
  const padded = String(next).padStart(config.do_dai_phan_so, '0');
  const soPhieu = `${config.tien_to_so_phieu || ''}${padded}`;
  await saveCauHinhSoPhieuThanhToan({ so_thu_tu_tiep_theo: next + 1 });
  return soPhieu;
}
