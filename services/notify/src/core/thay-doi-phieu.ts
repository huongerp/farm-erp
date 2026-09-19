/**
 * So payload trước/sau của một dòng outbox để trả lời "phiếu vừa bị sửa CÁI GÌ".
 *
 * Dùng cho sự kiện `phieu.sua_sau_duyet`: câu "đã sửa nội dung phiếu" nói suông
 * khiến người duyệt phải mở phiếu ra dò, nên ở đây rút đúng những cột nghiệp vụ
 * đã đổi kèm giá trị cũ → mới.
 *
 * PHẠM VI: chỉ các cột của BẢNG PHIẾU (bảng cha). Danh sách mặt hàng nằm ở bảng
 * `*_chi_tiet` chưa gắn trigger outbox, và app sửa phiếu bằng cách xoá sạch dòng
 * con rồi chèn lại — nên khi chỉ mặt hàng đổi, bảng cha không có cột nghiệp vụ
 * nào khác biệt. Ca đó trả về mảng rỗng và lớp render nói thẳng là thay đổi nằm
 * ở danh sách mặt hàng.
 *
 * Hàm thuần, không chạm database → test bằng vitest.
 */

import type { DongOutbox } from './types.ts';

/** Một cột đã đổi giá trị, đã dịch sẵn nhãn và format sẵn giá trị để in ra. */
export interface ThayDoiCot {
  cot: string;
  nhan: string;
  /** Giá trị đã format. null khi cột chỉ lưu khoá ngoại → in id ra thì vô nghĩa với người đọc. */
  cu: string | null;
  moi: string | null;
}

const DAI_TOI_DA_GIA_TRI = 40;

/**
 * Cột kỹ thuật: đổi nhưng không phải "nội dung phiếu" theo nghĩa người dùng.
 * `trang_thai` bỏ ra vì đổi trạng thái đã có sự kiện riêng (duyệt / không duyệt).
 */
const COT_BO_QUA = new Set([
  'id',
  'tg_tao',
  'tg_cap_nhat',
  'trang_thai',
  'so_dong',
  'tong_so_luong',
]);

/**
 * Bảng lưu song song khoá ngoại và tên (`kho_id` + `ten_kho`). Sửa một cái thì
 * cả hai cùng đổi; giữ cột tên vì nó đọc được, bỏ cột id đi cho khỏi trùng ý.
 */
const COT_ID_CO_COT_TEN: Record<string, string> = {
  kho_id: 'ten_kho',
  kho_den_id: 'ten_kho_den',
  nguoi_tao_id: 'ten_nguoi_tao',
  id_de_xuat_mua_hang: 'so_phieu_de_xuat',
};

/** Nhãn tiếng Việt cho cột của 4 bảng phiếu duyệt. Cột lạ lui về tên cột đã làm đẹp. */
const NHAN_COT: Record<string, string> = {
  so_phieu: 'Số phiếu',
  ngay: 'Ngày',
  ngay_can: 'Ngày cần',
  ca: 'Ca',
  ly_do: 'Lý do',
  loai_phieu_id: 'Loại phiếu',
  loai: 'Loại phiếu',
  ten_kho: 'Kho',
  ten_kho_den: 'Kho đến',
  kho_id: 'Kho',
  kho_den_id: 'Kho đến',
  id_nha_cung_cap: 'Nhà cung cấp',
  id_khach_hang: 'Khách hàng',
  id_noi_de_xuat: 'Nơi đề xuất',
  id_nguoi_de_xuat: 'Người đề xuất',
  id_nguoi_duyet: 'Người duyệt',
  nguoi_tao_id: 'Người tạo',
  ten_nguoi_tao: 'Người tạo',
  ghi_chu: 'Ghi chú',
  mo_ta: 'Mô tả',
  trao_doi: 'Trao đổi',
  id_don_dat_hang: 'Đơn đặt hàng',
  so_phieu_de_xuat: 'Phiếu đề xuất',
  id_de_xuat_mua_hang: 'Phiếu đề xuất',
};

/** Cột lạ (bảng mới đấu vào mà quên thêm nhãn): `ngay_giao_dk` → "Ngày giao dk". */
function nhanLuiVe(cot: string): string {
  const s = cot.replace(/_/g, ' ').trim();
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function laKhoaNgoai(cot: string): boolean {
  return cot.startsWith('id_') || cot.endsWith('_id');
}

function catBot(s: string): string {
  return s.length <= DAI_TOI_DA_GIA_TRI ? s : `${s.slice(0, DAI_TOI_DA_GIA_TRI - 1).trimEnd()}…`;
}

/**
 * Format giá trị để in trong câu thông báo.
 * Trả về null nghĩa là "không in được giá trị" → câu chỉ nêu tên cột đã đổi.
 */
function ganGiaTri(v: unknown): string | null {
  if (v === null || v === undefined) return '(trống)';
  if (typeof v === 'boolean') return v ? 'Có' : 'Không';
  if (typeof v === 'number') return String(v);
  if (typeof v !== 'string') return null;

  const s = v.trim();
  if (s === '') return '(trống)';

  // Ngày dạng yyyy-MM-dd hoặc ISO đầy đủ → dd/MM/yyyy cho khớp cách app hiển thị.
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(s);
  if (m) return `${m[3]}/${m[2]}/${m[1]}`;

  return catBot(s);
}

/**
 * Danh sách cột nghiệp vụ đã đổi giữa `payload_cu` và `payload`.
 * Trả về mảng rỗng khi là INSERT, khi thiếu payload_cu, hoặc khi chỉ cột kỹ
 * thuật đổi (ca sửa danh sách mặt hàng).
 */
export function soSanhCotPhieu(dong: DongOutbox): ThayDoiCot[] {
  const cu = dong.payload_cu;
  if (!cu) return [];

  const moi = dong.payload;
  const cotDoi = new Set<string>();
  for (const cot of new Set([...Object.keys(cu), ...Object.keys(moi)])) {
    if (COT_BO_QUA.has(cot)) continue;
    if (JSON.stringify(cu[cot] ?? null) !== JSON.stringify(moi[cot] ?? null)) cotDoi.add(cot);
  }

  // Cặp id + tên cùng đổi thì chỉ giữ cột tên.
  for (const [cotId, cotTen] of Object.entries(COT_ID_CO_COT_TEN)) {
    if (cotDoi.has(cotId) && cotDoi.has(cotTen)) cotDoi.delete(cotId);
  }

  const ket: ThayDoiCot[] = [];
  for (const cot of cotDoi) {
    const giaTriCu = laKhoaNgoai(cot) ? null : ganGiaTri(cu[cot]);
    const giaTriMoi = laKhoaNgoai(cot) ? null : ganGiaTri(moi[cot]);
    ket.push({
      cot,
      nhan: NHAN_COT[cot] ?? nhanLuiVe(cot),
      cu: giaTriCu,
      moi: giaTriMoi,
    });
  }

  // Thứ tự cột trong jsonb là thứ tự cột trong bảng — giữ nguyên cho ổn định
  // giữa các lần chạy, chỉ sắp lại để cột có giá trị đọc được lên trước.
  return ket.sort((a, b) => Number(a.moi === null) - Number(b.moi === null));
}
