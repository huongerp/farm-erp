/**
 * Nhận diện sự kiện nghiệp vụ từ một dòng outbox.
 *
 * Đây là nơi trả lời "chuyện gì vừa xảy ra" — bắn cái gì và khi nào. Một dòng
 * outbox có thể sinh nhiều sự kiện: sửa công việc vừa đổi người chịu trách nhiệm
 * vừa thêm trao đổi thì cả hai đều đáng báo.
 *
 * Hàm thuần, không chạm database → test bằng vitest.
 */

import type { DongOutbox, SuKienDaPhanTich } from './types.ts';
import { soSanhCotPhieu } from './thay-doi-phieu.ts';

// --- Trạng thái, lấy đúng chuỗi mà app đang ghi xuống DB ---------------------

/** Bốn module phiếu duyệt. Bản farm không có "Đợi duyệt" nhưng để chung vô hại. */
export const TT_CHO_DUYET = 'Chờ duyệt';
export const TT_DOI_DUYET = 'Đợi duyệt';
export const TT_DA_DUYET = 'Đã duyệt';
export const TT_KHONG_DUYET = 'Không duyệt';

/** Phiếu hành chính — một cấp duyệt, giá trị tiếng Việt riêng. */
export const TT_HC_CHO_DUYET = 'Chờ duyệt';
export const TT_HC_DA_DUYET = 'Đã duyệt';
export const TT_HC_TU_CHOI = 'Từ chối';
export const TT_HC_DA_HUY = 'Đã hủy';

/** Đơn đặt hàng. */
export const TT_DH_CHO_DUYET = 'Chờ duyệt';
export const TT_DH_DA_XAC_NHAN = 'Đã xác nhận';
export const TT_DH_DANG_GIAO = 'Đang giao';
export const TT_DH_DA_NHAN_DU = 'Đã nhận đủ';
export const TT_DH_HUY = 'Hủy';

/** Sổ quỹ — mã không dấu, khớp CHECK của fp_tc_quy_thu_chi. */
export const TT_QUY_MO = 'mo';
export const TT_QUY_KHOA = 'khoa';
export const TT_QUY_CHO_MO = 'cho_mo';

/** Công việc — mã không dấu. */
export const TT_CV_CHO_BAO_CAO = 'cho_bao_cao';
export const TT_CV_HOAN_THANH = 'hoan_thanh';
export const TT_CV_HUY = 'huy';

const BANG_PHIEU_DUYET = new Set([
  'fp_mh_phieu_kho',
  'fp_mh_phieu_de_xuat_vat_tu',
  'fp_farm_de_xuat_mua_hang',
  'fp_farm_phieu_kho_phan_thuoc',
]);

// --- Tiện ích đọc payload ----------------------------------------------------

function soNguyen(v: unknown): number | null {
  if (v === null || v === undefined || v === '') return null;
  const n = typeof v === 'number' ? v : Number(v);
  return Number.isFinite(n) ? n : null;
}

function mangSo(v: unknown): number[] {
  if (!Array.isArray(v)) return [];
  return v.map(soNguyen).filter((n): n is number => n !== null);
}

function doDaiMang(v: unknown): number {
  return Array.isArray(v) ? v.length : 0;
}

/** Đổi trạng thái thật sự, không tính ca INSERT hay ca giá trị không đổi. */
function daDoiTrangThai(dong: DongOutbox): boolean {
  return dong.trang_thai_moi !== null && dong.trang_thai_moi !== dong.trang_thai_cu;
}

// --- Bốn module phiếu có luồng duyệt ----------------------------------------

function phanTichPhieuDuyet(dong: DongOutbox): SuKienDaPhanTich[] {
  const tt = dong.trang_thai_moi;

  if (dong.thao_tac === 'INSERT') {
    return tt === TT_CHO_DUYET
      ? [{ loai: 'phieu.cho_duyet', muc: 'thuong', vai: ['nhom_duyet'], duLieu: {} }]
      : [];
  }

  if (daDoiTrangThai(dong)) {
    switch (tt) {
      case TT_CHO_DUYET:
        return [{ loai: 'phieu.cho_duyet', muc: 'thuong', vai: ['nhom_duyet'], duLieu: {} }];
      case TT_DOI_DUYET:
        return [{ loai: 'phieu.doi_duyet', muc: 'thuong', vai: ['nguoi_tao', 'nhom_duyet'], duLieu: {} }];
      case TT_DA_DUYET:
        return [{ loai: 'phieu.da_duyet', muc: 'thuong', vai: ['nguoi_tao'], duLieu: {} }];
      case TT_KHONG_DUYET:
        return [
          {
            loai: 'phieu.khong_duyet',
            muc: 'cao',
            vai: ['nguoi_tao'],
            duLieu: { lyDo: dong.payload['ghi_chu'] ?? dong.payload['mo_ta'] ?? null },
          },
        ];
      default:
        return [];
    }
  }

  // Không đổi trạng thái mà phiếu đang ở "Đã duyệt" nghĩa là nội dung phiếu đã
  // duyệt bị sửa — người duyệt cần biết vì họ đã ký vào bản cũ. Kèm luôn danh
  // sách cột đã đổi để thông báo nói rõ sửa gì, khỏi phải mở phiếu ra dò.
  if (tt === TT_DA_DUYET) {
    return [
      {
        loai: 'phieu.sua_sau_duyet',
        muc: 'cao',
        vai: ['nguoi_tao', 'nguoi_duyet'],
        duLieu: { thayDoi: soSanhCotPhieu(dong) },
      },
    ];
  }

  return [];
}

// --- Công việc ---------------------------------------------------------------

function phanTichCongViec(dong: DongOutbox): SuKienDaPhanTich[] {
  const ket: SuKienDaPhanTich[] = [];
  const cu = dong.payload_cu ?? {};
  const moi = dong.payload;

  if (dong.thao_tac === 'INSERT') {
    if (soNguyen(moi['trach_nhiem']) !== null) {
      ket.push({ loai: 'cong_viec.duoc_giao', muc: 'cao', vai: ['trach_nhiem'], duLieu: {} });
    }
    const hoTro = mangSo(moi['nguoi_ho_tro']);
    if (hoTro.length > 0) {
      ket.push({
        loai: 'cong_viec.them_ho_tro',
        muc: 'thuong',
        vai: ['ho_tro_moi'],
        duLieu: { hoTroMoi: hoTro },
      });
    }
    return ket;
  }

  // Đổi người chịu trách nhiệm → người mới cần biết ngay.
  const tnCu = soNguyen(cu['trach_nhiem']);
  const tnMoi = soNguyen(moi['trach_nhiem']);
  if (tnMoi !== null && tnMoi !== tnCu) {
    ket.push({ loai: 'cong_viec.duoc_giao', muc: 'cao', vai: ['trach_nhiem'], duLieu: {} });
  }

  // Chỉ báo cho người VỪA được thêm, không báo lại cả nhóm hỗ trợ cũ.
  const hoTroCu = new Set(mangSo(cu['nguoi_ho_tro']));
  const hoTroMoi = mangSo(moi['nguoi_ho_tro']).filter((id) => !hoTroCu.has(id));
  if (hoTroMoi.length > 0) {
    ket.push({
      loai: 'cong_viec.them_ho_tro',
      muc: 'thuong',
      vai: ['ho_tro_moi'],
      duLieu: { hoTroMoi },
    });
  }

  // trao_doi là mảng jsonb chỉ nối thêm — dài ra nghĩa là có bình luận mới.
  const soTraoDoiCu = doDaiMang(cu['trao_doi']);
  const soTraoDoiMoi = doDaiMang(moi['trao_doi']);
  if (soTraoDoiMoi > soTraoDoiCu) {
    const traoDoi = Array.isArray(moi['trao_doi']) ? moi['trao_doi'] : [];
    const cuoi = traoDoi[traoDoi.length - 1] as Record<string, unknown> | undefined;
    ket.push({
      loai: 'cong_viec.trao_doi_moi',
      muc: 'thuong',
      vai: ['nguoi_giao', 'trach_nhiem', 'ho_tro'],
      duLieu: { noiDungTraoDoi: cuoi?.['noi_dung'] ?? null },
    });
  }

  if (daDoiTrangThai(dong)) {
    switch (dong.trang_thai_moi) {
      case TT_CV_CHO_BAO_CAO:
        ket.push({ loai: 'cong_viec.cho_bao_cao', muc: 'cao', vai: ['nguoi_giao'], duLieu: {} });
        break;
      case TT_CV_HOAN_THANH:
        ket.push({ loai: 'cong_viec.hoan_thanh', muc: 'thuong', vai: ['nguoi_giao'], duLieu: {} });
        break;
      case TT_CV_HUY:
        ket.push({ loai: 'cong_viec.huy', muc: 'thuong', vai: ['trach_nhiem', 'ho_tro'], duLieu: {} });
        break;
      default:
        break;
    }
  }

  return ket;
}

// --- Phiếu hành chính --------------------------------------------------------

/**
 * Một cấp duyệt. Hằng ADMIN_FORM_STATUSES phía app còn giá trị 'manager_approved'
 * nhưng đó là di sản: admin-form-service.ts chỉ ghi Chờ duyệt / Đã duyệt /
 * Từ chối / Đã hủy, và bảng không có cột quan_ly_id hay hcns_id.
 */
function phanTichPhieuHanhChinh(dong: DongOutbox): SuKienDaPhanTich[] {
  const tt = dong.trang_thai_moi;

  if (dong.thao_tac === 'INSERT') {
    return tt === TT_HC_CHO_DUYET
      ? [{ loai: 'hanh_chinh.cho_duyet', muc: 'cao', vai: ['nhom_duyet'], duLieu: {} }]
      : [];
  }

  if (!daDoiTrangThai(dong)) return [];

  switch (tt) {
    case TT_HC_CHO_DUYET:
      return [{ loai: 'hanh_chinh.cho_duyet', muc: 'cao', vai: ['nhom_duyet'], duLieu: {} }];
    case TT_HC_DA_DUYET:
      return [{ loai: 'hanh_chinh.da_duyet', muc: 'cao', vai: ['nguoi_tao'], duLieu: {} }];
    case TT_HC_TU_CHOI:
      return [
        {
          loai: 'hanh_chinh.tu_choi',
          muc: 'cao',
          vai: ['nguoi_tao'],
          duLieu: { lyDo: dong.payload['ghi_chu'] ?? null },
        },
      ];
    case TT_HC_DA_HUY:
      return [{ loai: 'hanh_chinh.da_huy', muc: 'thuong', vai: ['nhom_duyet'], duLieu: {} }];
    default:
      return [];
  }
}

// --- Đơn đặt hàng ------------------------------------------------------------

/**
 * Máy trạng thái 7 bước nhưng chỉ 5 mốc đáng báo. Bỏ Nháp → Đã gửi và Đã đóng:
 * không ai phải hành động vì chúng.
 */
function phanTichDonDatHang(dong: DongOutbox): SuKienDaPhanTich[] {
  if (!daDoiTrangThai(dong)) return [];

  switch (dong.trang_thai_moi) {
    case TT_DH_CHO_DUYET:
      return [{ loai: 'don_hang.cho_duyet', muc: 'thuong', vai: ['nhom_duyet'], duLieu: {} }];
    case TT_DH_DA_XAC_NHAN:
      return [{ loai: 'don_hang.da_xac_nhan', muc: 'thuong', vai: ['nguoi_tao'], duLieu: {} }];
    case TT_DH_DANG_GIAO:
      return [{ loai: 'don_hang.dang_giao', muc: 'thuong', vai: ['nguoi_tao'], duLieu: {} }];
    case TT_DH_DA_NHAN_DU:
      return [{ loai: 'don_hang.da_nhan_du', muc: 'thuong', vai: ['nguoi_tao'], duLieu: {} }];
    case TT_DH_HUY:
      return [{ loai: 'don_hang.huy', muc: 'cao', vai: ['nguoi_tao', 'nguoi_duyet'], duLieu: {} }];
    default:
      return [];
  }
}

// --- Sổ quỹ: khoá / xin mở khoá ---------------------------------------------

/**
 * Chỉ ba mốc đáng báo. `mo → khoa` KHÔNG báo: đó là thao tác thường ngày của
 * chính người lập phiếu, báo lên sẽ thành tiếng ồn hằng ngày cho nhóm duyệt.
 */
function phanTichQuyThuChi(dong: DongOutbox): SuKienDaPhanTich[] {
  if (!daDoiTrangThai(dong)) return [];

  switch (dong.trang_thai_moi) {
    case TT_QUY_CHO_MO:
      return [
        {
          loai: 'quy.xin_mo_khoa',
          muc: 'cao',
          vai: ['nhom_duyet'],
          duLieu: { lyDo: dong.payload['ly_do_yeu_cau_mo'] ?? null },
        },
      ];
    case TT_QUY_MO:
      // Về "mo" từ "cho_mo" là DUYỆT; từ "khoa" là cấp cao mở thẳng, người tạo
      // cũng cần biết phiếu của mình sửa lại được.
      return [
        {
          loai: 'quy.duyet_mo_khoa',
          muc: 'cao',
          vai: dong.trang_thai_cu === TT_QUY_CHO_MO ? ['nguoi_yeu_cau_mo'] : ['nguoi_tao'],
          duLieu: {},
        },
      ];
    case TT_QUY_KHOA:
      // khoa ← cho_mo là TỪ CHỐI; khoa ← mo là khoá thường, không báo.
      return dong.trang_thai_cu === TT_QUY_CHO_MO
        ? [
            {
              loai: 'quy.tu_choi_mo_khoa',
              muc: 'cao',
              vai: ['nguoi_yeu_cau_mo'],
              duLieu: { lyDo: dong.payload['ly_do_yeu_cau_mo'] ?? null },
            },
          ]
        : [];
    default:
      return [];
  }
}

// --- Cổng vào ----------------------------------------------------------------

export function phanTichSuKien(dong: DongOutbox): SuKienDaPhanTich[] {
  if (BANG_PHIEU_DUYET.has(dong.bang)) return phanTichPhieuDuyet(dong);
  if (dong.bang === 'fp_hc_cong_viec') return phanTichCongViec(dong);
  if (dong.bang === 'fp_hr_phieu_hanh_chinh') return phanTichPhieuHanhChinh(dong);
  if (dong.bang === 'fp_mh_don_dat_hang') return phanTichDonDatHang(dong);
  if (dong.bang === 'fp_tc_quy_thu_chi') return phanTichQuyThuChi(dong);
  return [];
}
