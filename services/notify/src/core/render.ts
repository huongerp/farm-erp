/**
 * Viết tiêu đề và nội dung tiếng Việt cho từng loại sự kiện.
 *
 * Để ở TypeScript thay vì PL/pgSQL chính là lý do chọn kiến trúc outbox: sửa câu
 * chữ không phải chạy migration, và câu chữ kiểm được bằng test.
 */

import type { DongOutbox, SuKienDaPhanTich } from './types.ts';
import type { MoTaBang } from './mo-ta-bang.ts';

const DAI_TOI_DA_TRAO_DOI = 120;

export interface NguCanhRender {
  moTa: MoTaBang;
  dong: DongOutbox;
  suKien: SuKienDaPhanTich;
  /** Tên người gây ra sự kiện; null khi không tra được (đổi từ SQL tay, import…). */
  tenActor: string | null;
}

export interface NoiDungThongBao {
  tieuDe: string;
  noiDung: string | null;
}

function chuoi(v: unknown): string | null {
  if (typeof v === 'string') {
    const s = v.trim();
    return s === '' ? null : s;
  }
  if (typeof v === 'number') return String(v);
  return null;
}

function catBot(s: string, dai: number): string {
  return s.length <= dai ? s : `${s.slice(0, dai - 1).trimEnd()}…`;
}

/** Ngày dạng dd/MM — payload trả về chuỗi ISO hoặc yyyy-MM-dd. */
function ngayNgan(v: unknown): string | null {
  const s = chuoi(v);
  if (!s) return null;
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(s);
  return m ? `${m[3]}/${m[2]}` : s;
}

/** Nhãn chứng từ: "Phiếu kho PX-0042", lui về "Phiếu kho" khi thiếu số phiếu. */
function nhanChungTu(moTa: MoTaBang, dong: DongOutbox): string {
  const so = moTa.cotSoPhieu ? chuoi(dong.payload[moTa.cotSoPhieu]) : null;
  return so ? `${moTa.tenChungTu} ${so}` : moTa.tenChungTu;
}

/** Tiêu đề công việc dùng thay số phiếu. */
function tenCongViec(dong: DongOutbox): string {
  return chuoi(dong.payload['tieu_de']) ?? 'Công việc';
}

function boiActor(tenActor: string | null, hanhDong: string): string {
  return tenActor ? `${tenActor} ${hanhDong}` : `Có người ${hanhDong}`;
}

export function renderThongBao(nc: NguCanhRender): NoiDungThongBao {
  const { moTa, dong, suKien, tenActor } = nc;
  const nhan = nhanChungTu(moTa, dong);
  const cv = tenCongViec(dong);
  const lyDo = chuoi(suKien.duLieu['lyDo']);

  switch (suKien.loai) {
    // --- Bốn module phiếu duyệt ---------------------------------------------
    case 'phieu.cho_duyet':
      return {
        tieuDe: `${nhan} chờ duyệt`,
        noiDung: boiActor(tenActor, 'vừa gửi phiếu, đang chờ bạn duyệt.'),
      };
    case 'phieu.doi_duyet':
      return {
        tieuDe: `${nhan} chuyển sang đợi duyệt`,
        noiDung: boiActor(tenActor, 'đã chuyển phiếu sang bước duyệt tiếp theo.'),
      };
    case 'phieu.da_duyet':
      return {
        tieuDe: `${nhan} đã được duyệt`,
        noiDung: boiActor(tenActor, 'đã duyệt phiếu của bạn.'),
      };
    case 'phieu.khong_duyet':
      return {
        tieuDe: `${nhan} không được duyệt`,
        noiDung: lyDo
          ? `${boiActor(tenActor, 'không duyệt phiếu.')} Lý do: ${lyDo}`
          : boiActor(tenActor, 'không duyệt phiếu.'),
      };
    case 'phieu.sua_sau_duyet':
      return {
        tieuDe: `${nhan} đã duyệt vừa bị sửa`,
        noiDung: boiActor(tenActor, 'đã sửa nội dung phiếu sau khi phiếu được duyệt.'),
      };

    // --- Công việc -----------------------------------------------------------
    case 'cong_viec.duoc_giao':
      return {
        tieuDe: `Bạn được giao: ${cv}`,
        noiDung: boiActor(tenActor, 'vừa giao việc này cho bạn.'),
      };
    case 'cong_viec.them_ho_tro':
      return {
        tieuDe: `Bạn được thêm vào hỗ trợ: ${cv}`,
        noiDung: boiActor(tenActor, 'đã thêm bạn vào nhóm hỗ trợ công việc này.'),
      };
    case 'cong_viec.trao_doi_moi': {
      const noiDungTraoDoi = chuoi(suKien.duLieu['noiDungTraoDoi']);
      return {
        tieuDe: `Trao đổi mới: ${cv}`,
        noiDung: noiDungTraoDoi
          ? `${tenActor ?? 'Có người'}: ${catBot(noiDungTraoDoi, DAI_TOI_DA_TRAO_DOI)}`
          : boiActor(tenActor, 'vừa gửi một trao đổi mới.'),
      };
    }
    case 'cong_viec.cho_bao_cao':
      return {
        tieuDe: `Chờ bạn xem báo cáo: ${cv}`,
        noiDung: boiActor(tenActor, 'đã báo cáo kết quả và đang chờ bạn xem.'),
      };
    case 'cong_viec.hoan_thanh':
      return {
        tieuDe: `Đã hoàn thành: ${cv}`,
        noiDung: boiActor(tenActor, 'đã hoàn thành công việc.'),
      };
    case 'cong_viec.huy':
      return {
        tieuDe: `Công việc đã huỷ: ${cv}`,
        noiDung: boiActor(tenActor, 'đã huỷ công việc này.'),
      };

    // --- Phiếu hành chính ----------------------------------------------------
    case 'hanh_chinh.cho_duyet': {
      const ngay = ngayNgan(dong.payload['ngay']);
      return {
        tieuDe: ngay ? `Phiếu hành chính ngày ${ngay} chờ duyệt` : 'Phiếu hành chính chờ duyệt',
        noiDung: boiActor(tenActor, 'vừa gửi phiếu, đang chờ bạn duyệt.'),
      };
    }
    case 'hanh_chinh.da_duyet': {
      const ngay = ngayNgan(dong.payload['ngay']);
      return {
        tieuDe: ngay ? `Phiếu hành chính ngày ${ngay} đã được duyệt` : 'Phiếu hành chính đã được duyệt',
        noiDung: boiActor(tenActor, 'đã duyệt phiếu của bạn.'),
      };
    }
    case 'hanh_chinh.tu_choi': {
      const ngay = ngayNgan(dong.payload['ngay']);
      const tieuDe = ngay ? `Phiếu hành chính ngày ${ngay} bị từ chối` : 'Phiếu hành chính bị từ chối';
      return {
        tieuDe,
        noiDung: lyDo
          ? `${boiActor(tenActor, 'đã từ chối phiếu.')} Lý do: ${lyDo}`
          : boiActor(tenActor, 'đã từ chối phiếu.'),
      };
    }
    case 'hanh_chinh.da_huy': {
      const ngay = ngayNgan(dong.payload['ngay']);
      return {
        tieuDe: ngay ? `Phiếu hành chính ngày ${ngay} đã huỷ` : 'Phiếu hành chính đã huỷ',
        noiDung: boiActor(tenActor, 'đã huỷ phiếu.'),
      };
    }

    // --- Đơn đặt hàng --------------------------------------------------------
    case 'don_hang.cho_duyet':
      return {
        tieuDe: `${nhan} chờ duyệt`,
        noiDung: boiActor(tenActor, 'vừa gửi đơn, đang chờ bạn duyệt.'),
      };
    case 'don_hang.da_xac_nhan':
      return {
        tieuDe: `${nhan} đã được xác nhận`,
        noiDung: 'Nhà cung cấp đã xác nhận đơn hàng của bạn.',
      };
    case 'don_hang.dang_giao': {
      const ngayGiao = ngayNgan(dong.payload['ngay_giao_dk']);
      return {
        tieuDe: `${nhan} đang giao`,
        noiDung: ngayGiao ? `Hàng đang trên đường giao, dự kiến ${ngayGiao}.` : 'Hàng đang trên đường giao.',
      };
    }
    case 'don_hang.da_nhan_du':
      return {
        tieuDe: `${nhan} đã nhận đủ hàng`,
        noiDung: boiActor(tenActor, 'đã xác nhận nhận đủ hàng.'),
      };
    case 'don_hang.huy':
      return {
        tieuDe: `${nhan} đã bị huỷ`,
        noiDung: boiActor(tenActor, 'đã huỷ đơn đặt hàng này.'),
      };

    default:
      return { tieuDe: nhan, noiDung: null };
  }
}
