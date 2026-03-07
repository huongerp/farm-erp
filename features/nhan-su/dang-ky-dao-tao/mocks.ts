import type { DangKyThamGia, TienDoBaiHoc, KetQuaBaiTest } from './core/types';

/** Mock đăng ký: emp-000 có 3 khóa (kdt-1, kdt-2, kdt-3); emp-002 có 1 khóa kdt-1. Đủ để kiểm tra Khóa của tôi, Đăng ký mới, Quản lý giao, Báo cáo. */
export const MOCK_DANG_KY_THAM_GIA: Omit<
  DangKyThamGia,
  'ten_khoa_hoc' | 'ma_khoa_hoc' | 'ten_nhan_vien' | 'id_loai_khoa_hoc' | 'so_chuong_da_pass' | 'so_chuong_tong' | 'so_bai_da_xem' | 'so_bai_tong'
>[] = [
  {
    id: 'dk-1',
    id_khoa_hoc: 'kdt-1',
    id_nhan_vien: 'emp-000',
    loai_dang_ky: 'tu_dang_ky',
    id_nguoi_giao: null,
    trang_thai: 2,
    tg_dang_ky: '2025-02-01T08:00:00Z',
    tg_cap_nhat: '2025-02-01T08:00:00Z',
  },
  {
    id: 'dk-2',
    id_khoa_hoc: 'kdt-2',
    id_nhan_vien: 'emp-000',
    loai_dang_ky: 'duoc_giao',
    id_nguoi_giao: 'emp-000',
    trang_thai: 1,
    tg_dang_ky: '2025-02-10T09:00:00Z',
    tg_cap_nhat: '2025-02-10T09:00:00Z',
  },
  {
    id: 'dk-3',
    id_khoa_hoc: 'kdt-1',
    id_nhan_vien: 'emp-002',
    loai_dang_ky: 'duoc_giao',
    id_nguoi_giao: 'emp-000',
    trang_thai: 1,
    tg_dang_ky: '2025-02-12T10:00:00Z',
    tg_cap_nhat: '2025-02-12T10:00:00Z',
  },
  {
    id: 'dk-4',
    id_khoa_hoc: 'kdt-3',
    id_nhan_vien: 'emp-000',
    loai_dang_ky: 'tu_dang_ky',
    id_nguoi_giao: null,
    trang_thai: 3,
    tg_dang_ky: '2025-02-15T08:00:00Z',
    tg_cap_nhat: '2025-02-20T14:00:00Z',
  },
  {
    id: 'dk-5',
    id_khoa_hoc: 'kdt-2',
    id_nhan_vien: 'emp-002',
    loai_dang_ky: 'duoc_giao',
    id_nguoi_giao: 'emp-000',
    trang_thai: 2,
    tg_dang_ky: '2025-02-18T09:00:00Z',
    tg_cap_nhat: '2025-02-18T09:00:00Z',
  },
];

/** Mock tiến độ: dk-1 đã xem chương 1 (bh-1, bh-2); dk-2 đã xem bh-4; dk-3 đã xem bh-1; dk-4 đã xem hết ch-4 (bh-5, bh-6); dk-5 đã xem bh-4. */
export const MOCK_TIEN_DO_BAI_HOC: TienDoBaiHoc[] = [
  { id: 'td-1', id_dang_ky: 'dk-1', id_bai_hoc: 'bh-1', da_xem: true, tg_xem_xong: '2025-02-02T10:00:00Z' },
  { id: 'td-2', id_dang_ky: 'dk-1', id_bai_hoc: 'bh-2', da_xem: true, tg_xem_xong: '2025-02-02T11:00:00Z' },
  { id: 'td-3', id_dang_ky: 'dk-2', id_bai_hoc: 'bh-4', da_xem: true, tg_xem_xong: '2025-02-11T09:00:00Z' },
  { id: 'td-4', id_dang_ky: 'dk-3', id_bai_hoc: 'bh-1', da_xem: true, tg_xem_xong: '2025-02-13T10:00:00Z' },
  { id: 'td-5', id_dang_ky: 'dk-4', id_bai_hoc: 'bh-5', da_xem: true, tg_xem_xong: '2025-02-16T10:00:00Z' },
  { id: 'td-6', id_dang_ky: 'dk-4', id_bai_hoc: 'bh-6', da_xem: true, tg_xem_xong: '2025-02-20T14:00:00Z' },
  { id: 'td-7', id_dang_ky: 'dk-5', id_bai_hoc: 'bh-4', da_xem: true, tg_xem_xong: '2025-02-18T10:00:00Z' },
];

/** Mock kết quả test: dk-1 đã pass bt-1 (mở chương 2); dk-2 đã pass bt-3; dk-4 đã pass bt-4 (hoàn thành khóa). */
export const MOCK_KET_QUA_BAI_TEST: KetQuaBaiTest[] = [
  { id: 'kq-1', id_dang_ky: 'dk-1', id_bai_test: 'bt-1', diem: 85, dat: true, tg_lam: '2025-02-02T12:00:00Z' },
  { id: 'kq-2', id_dang_ky: 'dk-2', id_bai_test: 'bt-3', diem: 90, dat: true, tg_lam: '2025-02-11T10:00:00Z' },
  { id: 'kq-3', id_dang_ky: 'dk-4', id_bai_test: 'bt-4', diem: 100, dat: true, tg_lam: '2025-02-20T14:30:00Z' },
];
