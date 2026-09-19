/**
 * Dịch vai người nhận thành danh sách id nhân viên cụ thể.
 *
 * Đây là nơi trả lời "gửi cho ai" — phần dễ sai nhất và cũng là phần CLAUDE.md
 * xếp vào loại bắt buộc phải test (quyền và phạm vi xem).
 *
 * Nhóm người duyệt được TRA bằng RPC rpc_tb_nguoi_duyet (truy vấn thuộc về SQL);
 * hàm ở đây nhận sẵn kết quả đó nên vẫn là hàm thuần.
 */

import type { DongOutbox, SuKienDaPhanTich, VaiNguoiNhan } from './types.ts';
import type { MoTaBang } from './mo-ta-bang.ts';

/** Một dòng trả về từ rpc_tb_nguoi_duyet. */
export interface NguoiDuyet {
  nhanVienId: number;
  capBac: number;
}

export interface NguoiNhanDaChon {
  id: number;
  /**
   * true = vào chuông nhưng không rung push. Dành cho lãnh đạo cấp bậc 1 nhận
   * mọi phiếu để nắm tình hình: không có luật này thì điện thoại rung hàng chục
   * lần mỗi ngày và việc đầu tiên họ làm là tắt hẳn thông báo.
   */
  imLang: boolean;
}

const CAP_BAC_TOAN_QUYEN = 1;

function soNguyen(v: unknown): number | null {
  if (v === null || v === undefined || v === '') return null;
  const n = typeof v === 'number' ? v : Number(v);
  return Number.isFinite(n) ? n : null;
}

function mangSo(v: unknown): number[] {
  if (!Array.isArray(v)) return [];
  return v.map(soNguyen).filter((n): n is number => n !== null);
}

/**
 * Các vai rút thẳng từ payload của bản ghi. Không bao gồm 'nhom_duyet' vì vai đó
 * phải tra phân quyền.
 */
export function giaiVaiTheoPayload(
  vai: VaiNguoiNhan,
  moTa: MoTaBang,
  dong: DongOutbox,
  suKien: SuKienDaPhanTich
): number[] {
  const p = dong.payload;

  switch (vai) {
    case 'nguoi_tao': {
      const id = moTa.cotNguoiTao ? soNguyen(p[moTa.cotNguoiTao]) : null;
      return id === null ? [] : [id];
    }
    case 'nguoi_duyet': {
      const id = moTa.cotNguoiDuyet ? soNguyen(p[moTa.cotNguoiDuyet]) : null;
      return id === null ? [] : [id];
    }
    case 'nguoi_giao': {
      const id = soNguyen(p['id_nguoi_giao']);
      return id === null ? [] : [id];
    }
    case 'trach_nhiem': {
      const id = soNguyen(p['trach_nhiem']);
      return id === null ? [] : [id];
    }
    case 'nguoi_yeu_cau_mo': {
      // Người XIN mở khoá, không nhất thiết là người lập phiếu.
      const id = soNguyen(p['id_nguoi_yeu_cau_mo']);
      return id === null ? [] : [id];
    }
    case 'ho_tro':
      return mangSo(p['nguoi_ho_tro']);
    case 'ho_tro_moi':
      return mangSo(suKien.duLieu['hoTroMoi']);
    case 'nhom_duyet':
      return [];
    default:
      return [];
  }
}

/**
 * Chốt danh sách người nhận cho một sự kiện.
 *
 * Ba luật chống ồn nằm hết ở đây:
 *   1. Không bao giờ gửi ngược cho người vừa gây ra sự kiện.
 *   2. Mỗi người chỉ nhận một dòng dù trúng nhiều vai.
 *   3. Cấp bậc 1 lọt vào qua vai 'nhom_duyet' thì nhận ở mức im lặng, trừ khi
 *      sự kiện mức cao hoặc họ còn trúng một vai đích thực (người tạo phiếu,
 *      người chịu trách nhiệm…).
 */
export function dinhTuyen(
  dong: DongOutbox,
  suKien: SuKienDaPhanTich,
  moTa: MoTaBang,
  nhomDuyet: readonly NguoiDuyet[]
): NguoiNhanDaChon[] {
  const vaiDichThuc = new Set<number>();
  for (const vai of suKien.vai) {
    if (vai === 'nhom_duyet') continue;
    for (const id of giaiVaiTheoPayload(vai, moTa, dong, suKien)) vaiDichThuc.add(id);
  }

  const ketQua = new Map<number, NguoiNhanDaChon>();

  for (const id of vaiDichThuc) {
    ketQua.set(id, { id, imLang: false });
  }

  if (suKien.vai.includes('nhom_duyet')) {
    for (const nd of nhomDuyet) {
      const daCo = ketQua.get(nd.nhanVienId);
      if (daCo && !daCo.imLang) continue;

      const imLang = nd.capBac === CAP_BAC_TOAN_QUYEN && suKien.muc !== 'cao';
      ketQua.set(nd.nhanVienId, { id: nd.nhanVienId, imLang });
    }
  }

  if (dong.actor_id !== null) ketQua.delete(dong.actor_id);

  return [...ketQua.values()];
}
