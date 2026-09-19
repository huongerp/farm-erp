/**
 * Viết tiêu đề và nội dung tiếng Việt cho từng loại sự kiện.
 *
 * Để ở TypeScript thay vì PL/pgSQL chính là lý do chọn kiến trúc outbox: sửa câu
 * chữ không phải chạy migration, và câu chữ kiểm được bằng test.
 */

import type { DongOutbox, SuKienDaPhanTich } from './types.ts';
import type { MoTaBang } from './mo-ta-bang.ts';
import type { ThayDoiCot } from './thay-doi-phieu.ts';

const DAI_TOI_DA_TRAO_DOI = 120;

/** Liệt kê quá dài thì chuông và push đều bị cắt — nêu vài cột rồi đếm phần còn lại. */
const SO_THAY_DOI_KE_TEN = 4;

export interface NguCanhRender {
  moTa: MoTaBang;
  dong: DongOutbox;
  suKien: SuKienDaPhanTich;
  /** Tên người gây ra sự kiện; null khi không tra được (đổi từ SQL tay, import…). */
  tenActor: string | null;
  /** Tên loại phiếu tra từ danh mục; null khi module không có hoặc tra không ra. */
  tenLoaiPhieu?: string | null;
  /** Tên loại phiếu TRƯỚC khi sửa — chỉ dùng cho sự kiện sửa sau duyệt. */
  tenLoaiPhieuCu?: string | null;
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

/**
 * Nhãn phiếu hành chính: "Xin nghỉ phép 19/09 (Cả ngày)".
 * Bảng này không có số phiếu, nên loại phiếu + ngày + ca chính là thứ giúp
 * người duyệt nhận ra phiếu nào mà không phải mở app. Thiếu phần nào thì bỏ
 * phần đó, không bao giờ in "null" hay "()" rỗng.
 */
function nhanPhieuHanhChinh(nc: NguCanhRender): string {
  const loai = chuoi(nc.tenLoaiPhieu) ?? 'Phiếu hành chính';
  const ngay = ngayNgan(nc.dong.payload['ngay']);
  const ca = chuoi(nc.dong.payload['ca']);
  return `${loai}${ngay ? ` ${ngay}` : ''}${ca ? ` (${ca})` : ''}`;
}

/** Tiêu đề công việc dùng thay số phiếu. */
function tenCongViec(dong: DongOutbox): string {
  return chuoi(dong.payload['tieu_de']) ?? 'Công việc';
}

function boiActor(tenActor: string | null, hanhDong: string): string {
  return tenActor ? `${tenActor} ${hanhDong}` : `Có người ${hanhDong}`;
}

/** "Ngày cần: 17/09/2026 → 19/09/2026" — cột khoá ngoại thì chỉ nêu tên cột. */
function moTaMotThayDoi(td: ThayDoiCot): string {
  return td.cu === null || td.moi === null ? `đổi ${td.nhan.toLowerCase()}` : `${td.nhan}: ${td.cu} → ${td.moi}`;
}

function docThayDoi(duLieu: Record<string, unknown>): ThayDoiCot[] {
  const v = duLieu['thayDoi'];
  return Array.isArray(v) ? (v as ThayDoiCot[]) : [];
}

/**
 * Câu kể cụ thể cho ca "phiếu đã duyệt bị sửa".
 *
 * Không cột nào của phiếu đổi nghĩa là người dùng sửa danh sách mặt hàng: app
 * lưu phiếu bằng cách ghi lại bảng cha (chỉ `tg_cap_nhat` khác) rồi xoá/chèn lại
 * bảng chi tiết. Nói thẳng điều đó thay vì im lặng.
 */
function noiDungSuaSauDuyet(tenActor: string | null, thayDoi: ThayDoiCot[]): string {
  const mo = boiActor(tenActor, 'đã sửa phiếu sau khi phiếu được duyệt.');
  if (thayDoi.length === 0) {
    return `${mo} Thông tin chung không đổi — thay đổi nằm ở danh sách mặt hàng.`;
  }
  return `${mo} ${keTenThayDoi(thayDoi)}`;
}

/** Liệt kê tối đa SO_THAY_DOI_KE_TEN cột rồi đếm phần còn lại. */
function keTenThayDoi(thayDoi: ThayDoiCot[]): string {
  const keTen = thayDoi.slice(0, SO_THAY_DOI_KE_TEN).map(moTaMotThayDoi).join('; ');
  const conLai = thayDoi.length - SO_THAY_DOI_KE_TEN;
  return conLai > 0 ? `${keTen}; và ${conLai} thay đổi khác.` : `${keTen}.`;
}

/**
 * Phiếu hành chính không có bảng chi tiết: đã bắn sự kiện thì chắc chắn có cột
 * nghiệp vụ đổi, nên không có nhánh "thay đổi nằm ở danh sách mặt hàng".
 * `loai_phieu_id` là khoá ngoại nên soSanhCotPhieu bỏ trống giá trị — worker đã
 * tra sẵn tên cũ/mới, ghép vào đây để câu đọc được tên loại thay vì hai con số.
 */
function noiDungSuaSauDuyetHc(nc: NguCanhRender, thayDoi: ThayDoiCot[]): string {
  const day = thayDoi.map((td) =>
    td.cot === 'loai_phieu_id' && nc.tenLoaiPhieuCu && nc.tenLoaiPhieu
      ? { ...td, cu: nc.tenLoaiPhieuCu, moi: nc.tenLoaiPhieu }
      : td
  );
  return `${boiActor(nc.tenActor, 'đã sửa phiếu sau khi phiếu được duyệt.')} ${keTenThayDoi(day)}`;
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
        noiDung: noiDungSuaSauDuyet(tenActor, docThayDoi(suKien.duLieu)),
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
    case 'hanh_chinh.cho_duyet':
      return {
        tieuDe: `${nhanPhieuHanhChinh(nc)} chờ duyệt`,
        noiDung: boiActor(tenActor, 'vừa gửi phiếu, đang chờ bạn duyệt.'),
      };
    case 'hanh_chinh.da_duyet':
      return {
        tieuDe: `${nhanPhieuHanhChinh(nc)} đã được duyệt`,
        noiDung: boiActor(tenActor, 'đã duyệt phiếu của bạn.'),
      };
    case 'hanh_chinh.tu_choi':
      return {
        tieuDe: `${nhanPhieuHanhChinh(nc)} bị từ chối`,
        noiDung: lyDo
          ? `${boiActor(tenActor, 'đã từ chối phiếu.')} Lý do: ${lyDo}`
          : boiActor(tenActor, 'đã từ chối phiếu.'),
      };
    case 'hanh_chinh.da_huy':
      return {
        tieuDe: `${nhanPhieuHanhChinh(nc)} đã huỷ`,
        noiDung: boiActor(tenActor, 'đã huỷ phiếu.'),
      };
    case 'hanh_chinh.sua_sau_duyet':
      return {
        tieuDe: `${nhanPhieuHanhChinh(nc)} đã duyệt vừa bị sửa`,
        noiDung: noiDungSuaSauDuyetHc(nc, docThayDoi(suKien.duLieu)),
      };

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

    // --- Sổ quỹ: khoá / xin mở khoá ------------------------------------------
    case 'quy.xin_mo_khoa':
      return {
        tieuDe: `${nhan} xin mở khoá`,
        noiDung: lyDo
          ? `${boiActor(tenActor, 'xin mở khoá phiếu quỹ.')} Lý do: ${catBot(lyDo, DAI_TOI_DA_TRAO_DOI)}`
          : boiActor(tenActor, 'xin mở khoá phiếu quỹ, chờ bạn duyệt.'),
      };
    case 'quy.duyet_mo_khoa':
      return {
        tieuDe: `${nhan} đã được mở khoá`,
        noiDung: boiActor(tenActor, 'đã mở khoá phiếu, bạn sửa lại được rồi.'),
      };
    case 'quy.tu_choi_mo_khoa':
      return {
        tieuDe: `${nhan} bị từ chối mở khoá`,
        noiDung: boiActor(tenActor, 'đã từ chối yêu cầu mở khoá; phiếu vẫn đang khoá.'),
      };

    default:
      return { tieuDe: nhan, noiDung: null };
  }
}
