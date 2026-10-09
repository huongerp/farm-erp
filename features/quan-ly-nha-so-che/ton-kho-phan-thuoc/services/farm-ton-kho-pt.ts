/**
 * Tồn kho nhóm kho farm (theo biến thể): tồn tức thời (view tồn), tồn theo kỳ
 * (RPC theo kỳ — migration 027/029) và lịch sử NX của một hàng (view flat).
 */
import { db, fetchAllRows } from '../../../../lib/db';
import type {
  TonKhoPTHangNxHistoryRow,
  TonKhoPTKyCell,
  TonKhoPTKyParams,
  TonKhoPTRecord,
} from '../core/types';
import type { KhoBienThe } from '../../kho-bien-the/bien-the';

const HANG_NX_HISTORY_SELECT =
  'chi_tiet_id, id_phieu_kho, so_phieu, ngay, loai, kho_id, kho_den_id, phieu_tg_tao, ten_kho, ten_kho_den, trang_thai, so_luong, don_vi_tinh';

interface HangNxHistoryDbRow {
  chi_tiet_id: number;
  id_phieu_kho: number;
  so_phieu: string;
  ngay: string;
  loai: string;
  kho_id: number;
  kho_den_id: number | null;
  phieu_tg_tao: string | null;
  ten_kho: string | null;
  ten_kho_den: string | null;
  trang_thai: string;
  so_luong: number | string | null;
  don_vi_tinh: string | null;
}

interface TonKhoViewRow {
  id_kho: number;
  id_hang_hoa: number;
  so_luong: number | string | null;
}

function rowToTonKho(r: TonKhoViewRow): TonKhoPTRecord {
  return {
    id_kho: String(r.id_kho),
    id_hang_hoa: String(r.id_hang_hoa),
    so_luong: Number(r.so_luong) || 0,
  };
}

/** Ma trận tồn từ view (chỉ id kho × hàng + số lượng). */
export async function getTonKhoPTMatrix(bt: KhoBienThe): Promise<TonKhoPTRecord[]> {
  const rows = await fetchAllRows<TonKhoViewRow>((from, to) =>
    db.from(bt.view.tonKho).select('id_kho, id_hang_hoa, so_luong').range(from, to)
  );
  return rows.map(rowToTonKho);
}

/**
 * Tồn theo danh sách kho — dùng cho snapshot kiểm kê (một request thay vì một
 * request mỗi kho). Mảng rỗng = lấy mọi kho.
 */
export async function getTonKhoPTMatrixByKhoIds(bt: KhoBienThe, khoIds: string[]): Promise<TonKhoPTRecord[]> {
  if (khoIds.length === 0) return getTonKhoPTMatrix(bt);
  const ids = khoIds.map(Number).filter(Number.isFinite);
  if (ids.length === 0) return [];
  const rows = await fetchAllRows<TonKhoViewRow>((from, to) =>
    db.from(bt.view.tonKho).select('id_kho, id_hang_hoa, so_luong').in('id_kho', ids).range(from, to)
  );
  return rows.map(rowToTonKho);
}

/** Lịch sử phiếu kho (NX) của một hàng — từ view flat, mới nhất trước. */
export async function getPhieuKhoPTHangNxHistory(bt: KhoBienThe, idHangHoa: string): Promise<TonKhoPTHangNxHistoryRow[]> {
  const idNum = Number(idHangHoa);
  if (!idHangHoa?.trim() || Number.isNaN(idNum)) return [];

  const rows = await fetchAllRows<HangNxHistoryDbRow>((from, to) =>
    db
      .from(bt.view.phieuKhoChiTietFlat)
      .select(HANG_NX_HISTORY_SELECT)
      .eq('id_hang_hoa', idNum)
      .order('ngay', { ascending: false })
      .order('chi_tiet_id', { ascending: false })
      .range(from, to)
  );

  return rows.map((r) => ({
    chi_tiet_id: r.chi_tiet_id,
    id_phieu_kho: r.id_phieu_kho,
    so_phieu: r.so_phieu ?? '',
    ngay: (r.ngay ?? '').trim().slice(0, 10),
    loai: (r.loai ?? '').trim(),
    kho_id: String(r.kho_id),
    kho_den_id: r.kho_den_id != null ? String(r.kho_den_id) : null,
    phieu_tg_tao: r.phieu_tg_tao ?? null,
    ten_kho: r.ten_kho,
    ten_kho_den: r.ten_kho_den,
    trang_thai: (r.trang_thai ?? '').trim(),
    so_luong: Number(r.so_luong) || 0,
    don_vi_tinh: r.don_vi_tinh,
  }));
}

interface TonKyDbRow {
  id_kho: number;
  id_hang_hoa: number;
  ton_dau: number | string | null;
  nhap: number | string | null;
  xuat: number | string | null;
  chuyen_den: number | string | null;
  chuyen_di: number | string | null;
  ton_cuoi: number | string | null;
}

/**
 * Tồn theo kỳ (kho × hàng): tồn đầu, nhập, xuất, chuyển đến/đi, tồn cuối — tính trên DB.
 * Kết quả cỡ số cặp kho × hàng đã phát sinh (vài trăm dòng), không tải lịch sử phiếu.
 */
export async function getTonKhoPTTheoKy(bt: KhoBienThe, params: TonKhoPTKyParams): Promise<TonKhoPTKyCell[]> {
  const rows = await fetchAllRows<TonKyDbRow>((from, to) =>
    db
      .rpc(bt.rpc.tonKhoTheoKy, {
        p_tu: params.tu || null,
        p_den: params.den || null,
        p_chi_da_duyet: params.chiDaDuyet,
      })
      .order('id_kho')
      .order('id_hang_hoa')
      .range(from, to)
  );
  return rows.map((r) => ({
    id_kho: String(r.id_kho),
    id_hang_hoa: String(r.id_hang_hoa),
    ton_dau: Number(r.ton_dau) || 0,
    nhap: Number(r.nhap) || 0,
    xuat: Number(r.xuat) || 0,
    chuyen_den: Number(r.chuyen_den) || 0,
    chuyen_di: Number(r.chuyen_di) || 0,
    ton_cuoi: Number(r.ton_cuoi) || 0,
  }));
}
