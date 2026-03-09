import type { KpiIndicator } from '../core/types';
import type { KpiIndicatorFormValues } from '../core/schema';
import i18n from '../../../../lib/i18n';
import { TRANG_THAI_HOAT_DONG } from '../../../../lib/constants';

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

const ts = () => new Date().toISOString();

let dbKpis: KpiIndicator[] = [
  // Ban giám đốc - Nhiệm vụ t0a: Phân tích và đề xuất chiến lược
  { id: 'k27', id_nhiem_vu: 't0a', ten_chi_so: 'Số đề xuất chiến lược được HĐQT phê duyệt', don_vi: 'đề án', chi_tieu_nguong: 'Theo kế hoạch năm', chu_ky_danh_gia: 'year', thu_tu: 1, trang_thai: TRANG_THAI_HOAT_DONG.DANG_HOAT_DONG, tg_tao: ts(), tg_cap_nhat: ts() },
  { id: 'k28', id_nhiem_vu: 't0a', ten_chi_so: 'Mức độ hoàn thành kế hoạch chiến lược', don_vi: '%', chi_tieu_nguong: '>= 90%', chu_ky_danh_gia: 'quarter', thu_tu: 2, trang_thai: TRANG_THAI_HOAT_DONG.DANG_HOAT_DONG, tg_tao: ts(), tg_cap_nhat: ts() },
  { id: 'k29', id_nhiem_vu: 't0a', ten_chi_so: 'Số báo cáo phân tích triển khai', don_vi: 'báo cáo', chi_tieu_nguong: '>= 4/năm', chu_ky_danh_gia: 'year', thu_tu: 3, trang_thai: TRANG_THAI_HOAT_DONG.DANG_HOAT_DONG, tg_tao: ts(), tg_cap_nhat: ts() },
  // Ban giám đốc - Nhiệm vụ t0b: Giám sát tiến độ toàn công ty
  { id: 'k30', id_nhiem_vu: 't0b', ten_chi_so: 'Tỷ lệ chỉ tiêu phòng ban đạt', don_vi: '%', chi_tieu_nguong: '>= 85%', chu_ky_danh_gia: 'quarter', thu_tu: 1, trang_thai: TRANG_THAI_HOAT_DONG.DANG_HOAT_DONG, tg_tao: ts(), tg_cap_nhat: ts() },
  { id: 'k31', id_nhiem_vu: 't0b', ten_chi_so: 'Số cuộc họp điều hành đúng kỳ', don_vi: '%', chi_tieu_nguong: '100%', chu_ky_danh_gia: 'month', thu_tu: 2, trang_thai: TRANG_THAI_HOAT_DONG.DANG_HOAT_DONG, tg_tao: ts(), tg_cap_nhat: ts() },
  { id: 'k32', id_nhiem_vu: 't0b', ten_chi_so: 'Báo cáo tiến độ gửi đúng hạn', don_vi: '%', chi_tieu_nguong: '100%', chu_ky_danh_gia: 'month', thu_tu: 3, trang_thai: TRANG_THAI_HOAT_DONG.DANG_HOAT_DONG, tg_tao: ts(), tg_cap_nhat: ts() },
  // Nhiệm vụ t1 - Viết mã và code review (Kỹ thuật)
  { id: 'k1', id_nhiem_vu: 't1', ten_chi_so: 'Số task hoàn thành đúng hạn', don_vi: '%', chi_tieu_nguong: '>= 95%', chu_ky_danh_gia: 'month', thu_tu: 1, trang_thai: TRANG_THAI_HOAT_DONG.DANG_HOAT_DONG, tg_tao: ts(), tg_cap_nhat: ts() },
  { id: 'k2', id_nhiem_vu: 't1', ten_chi_so: 'Tỷ lệ code review đạt', don_vi: '%', chi_tieu_nguong: '100%', chu_ky_danh_gia: 'month', thu_tu: 2, trang_thai: TRANG_THAI_HOAT_DONG.DANG_HOAT_DONG, tg_tao: ts(), tg_cap_nhat: ts() },
  { id: 'k3', id_nhiem_vu: 't1', ten_chi_so: 'Số bug critical trong release', don_vi: 'lỗi', chi_tieu_nguong: '<= 2', chu_ky_danh_gia: 'month', thu_tu: 3, trang_thai: TRANG_THAI_HOAT_DONG.DANG_HOAT_DONG, tg_tao: ts(), tg_cap_nhat: ts() },
  // Nhiệm vụ t2 - Kiểm thử và đảm bảo chất lượng
  { id: 'k4', id_nhiem_vu: 't2', ten_chi_so: 'Độ phủ test case', don_vi: '%', chi_tieu_nguong: '>= 80%', chu_ky_danh_gia: 'month', thu_tu: 1, trang_thai: TRANG_THAI_HOAT_DONG.DANG_HOAT_DONG, tg_tao: ts(), tg_cap_nhat: ts() },
  { id: 'k5', id_nhiem_vu: 't2', ten_chi_so: 'Số defect escape ra production', don_vi: 'lỗi', chi_tieu_nguong: '<= 3', chu_ky_danh_gia: 'quarter', thu_tu: 2, trang_thai: TRANG_THAI_HOAT_DONG.DANG_HOAT_DONG, tg_tao: ts(), tg_cap_nhat: ts() },
  // Nhiệm vụ t3 - Triển khai và giám sát
  { id: 'k6', id_nhiem_vu: 't3', ten_chi_so: 'Uptime hệ thống', don_vi: '%', chi_tieu_nguong: '>= 99.5%', chu_ky_danh_gia: 'month', thu_tu: 1, trang_thai: TRANG_THAI_HOAT_DONG.DANG_HOAT_DONG, tg_tao: ts(), tg_cap_nhat: ts() },
  { id: 'k7', id_nhiem_vu: 't3', ten_chi_so: 'Thời gian phản hồi sự cố', don_vi: 'phút', chi_tieu_nguong: '<= 15', chu_ky_danh_gia: 'month', thu_tu: 2, trang_thai: TRANG_THAI_HOAT_DONG.DANG_HOAT_DONG, tg_tao: ts(), tg_cap_nhat: ts() },
  // Nhiệm vụ t4 - Phỏng vấn ứng viên (Nhân sự)
  { id: 'k8', id_nhiem_vu: 't4', ten_chi_so: 'Số ứng viên tuyển thành công', don_vi: 'người', chi_tieu_nguong: 'Theo kế hoạch', chu_ky_danh_gia: 'quarter', thu_tu: 1, trang_thai: TRANG_THAI_HOAT_DONG.DANG_HOAT_DONG, tg_tao: ts(), tg_cap_nhat: ts() },
  { id: 'k9', id_nhiem_vu: 't4', ten_chi_so: 'Tỷ lệ offer chấp nhận', don_vi: '%', chi_tieu_nguong: '>= 85%', chu_ky_danh_gia: 'quarter', thu_tu: 2, trang_thai: TRANG_THAI_HOAT_DONG.DANG_HOAT_DONG, tg_tao: ts(), tg_cap_nhat: ts() },
  // Nhiệm vụ t4b - Xây dựng chương trình đào tạo
  { id: 'k10', id_nhiem_vu: 't4b', ten_chi_so: 'Số khóa đào tạo hoàn thành', don_vi: 'khóa', chi_tieu_nguong: '>= 4/năm', chu_ky_danh_gia: 'year', thu_tu: 1, trang_thai: TRANG_THAI_HOAT_DONG.DANG_HOAT_DONG, tg_tao: ts(), tg_cap_nhat: ts() },
  { id: 'k11', id_nhiem_vu: 't4b', ten_chi_so: 'Đánh giá hài lòng của học viên', don_vi: 'điểm', chi_tieu_nguong: '>= 4/5', chu_ky_danh_gia: 'quarter', thu_tu: 2, trang_thai: TRANG_THAI_HOAT_DONG.DANG_HOAT_DONG, tg_tao: ts(), tg_cap_nhat: ts() },
  // Nhiệm vụ t5 - Ghi sổ kế toán (Tài chính)
  { id: 'k12', id_nhiem_vu: 't5', ten_chi_so: 'Độ chính xác đối chiếu', don_vi: '%', chi_tieu_nguong: '100%', chu_ky_danh_gia: 'month', thu_tu: 1, trang_thai: TRANG_THAI_HOAT_DONG.DANG_HOAT_DONG, tg_tao: ts(), tg_cap_nhat: ts() },
  { id: 'k13', id_nhiem_vu: 't5', ten_chi_so: 'Báo cáo đúng hạn', don_vi: '%', chi_tieu_nguong: '100%', chu_ky_danh_gia: 'month', thu_tu: 2, trang_thai: TRANG_THAI_HOAT_DONG.DANG_HOAT_DONG, tg_tao: ts(), tg_cap_nhat: ts() },
  // Nhiệm vụ t6 - Lập dự báo và ngân sách
  { id: 'k14', id_nhiem_vu: 't6', ten_chi_so: 'Độ lệch dự báo so thực tế', don_vi: '%', chi_tieu_nguong: '<= 5%', chu_ky_danh_gia: 'quarter', thu_tu: 1, trang_thai: TRANG_THAI_HOAT_DONG.DANG_HOAT_DONG, tg_tao: ts(), tg_cap_nhat: ts() },
  // Nhiệm vụ t7 - Chăm sóc khách hàng B2B (Kinh doanh)
  { id: 'k15', id_nhiem_vu: 't7', ten_chi_so: 'Chỉ số NPS khách hàng', don_vi: 'điểm', chi_tieu_nguong: '>= 50', chu_ky_danh_gia: 'quarter', thu_tu: 1, trang_thai: TRANG_THAI_HOAT_DONG.DANG_HOAT_DONG, tg_tao: ts(), tg_cap_nhat: ts() },
  { id: 'k16', id_nhiem_vu: 't7', ten_chi_so: 'Thời gian phản hồi yêu cầu', don_vi: 'giờ', chi_tieu_nguong: '<= 4', chu_ky_danh_gia: 'month', thu_tu: 2, trang_thai: TRANG_THAI_HOAT_DONG.DANG_HOAT_DONG, tg_tao: ts(), tg_cap_nhat: ts() },
  // Nhiệm vụ t8 - Bán hàng B2C
  { id: 'k17', id_nhiem_vu: 't8', ten_chi_so: 'Doanh số đạt so chỉ tiêu', don_vi: '%', chi_tieu_nguong: '>= 100%', chu_ky_danh_gia: 'month', thu_tu: 1, trang_thai: TRANG_THAI_HOAT_DONG.DANG_HOAT_DONG, tg_tao: ts(), tg_cap_nhat: ts() },
  // Nhiệm vụ t9 - Kiểm nhận và nhập kho (Kho vận)
  { id: 'k18', id_nhiem_vu: 't9', ten_chi_so: 'Độ chính xác nhập kho', don_vi: '%', chi_tieu_nguong: '>= 99%', chu_ky_danh_gia: 'month', thu_tu: 1, trang_thai: TRANG_THAI_HOAT_DONG.DANG_HOAT_DONG, tg_tao: ts(), tg_cap_nhat: ts() },
  { id: 'k19', id_nhiem_vu: 't9', ten_chi_so: 'Thời gian xử lý phiếu nhập', don_vi: 'ngày', chi_tieu_nguong: '<= 1', chu_ky_danh_gia: 'month', thu_tu: 2, trang_thai: TRANG_THAI_HOAT_DONG.DANG_HOAT_DONG, tg_tao: ts(), tg_cap_nhat: ts() },
  // Nhiệm vụ t10 - Xuất kho và giao hàng
  { id: 'k20', id_nhiem_vu: 't10', ten_chi_so: 'Giao đúng hạn', don_vi: '%', chi_tieu_nguong: '>= 98%', chu_ky_danh_gia: 'month', thu_tu: 1, trang_thai: TRANG_THAI_HOAT_DONG.DANG_HOAT_DONG, tg_tao: ts(), tg_cap_nhat: ts() },
  // Nhiệm vụ t11 - Sản xuất nội dung (Marketing)
  { id: 'k21', id_nhiem_vu: 't11', ten_chi_so: 'Số bài đăng đúng lịch', don_vi: '%', chi_tieu_nguong: '>= 95%', chu_ky_danh_gia: 'month', thu_tu: 1, trang_thai: TRANG_THAI_HOAT_DONG.DANG_HOAT_DONG, tg_tao: ts(), tg_cap_nhat: ts() },
  { id: 'k22', id_nhiem_vu: 't11', ten_chi_so: 'Tỷ lệ tương tác (engagement)', don_vi: '%', chi_tieu_nguong: 'Tăng 5% so kỳ trước', chu_ky_danh_gia: 'quarter', thu_tu: 2, trang_thai: TRANG_THAI_HOAT_DONG.DANG_HOAT_DONG, tg_tao: ts(), tg_cap_nhat: ts() },
  // Nhiệm vụ t13 - Văn thư và quản lý tài sản (Hành chính)
  { id: 'k23', id_nhiem_vu: 't13', ten_chi_so: 'Công văn xử lý đúng hạn', don_vi: '%', chi_tieu_nguong: '>= 98%', chu_ky_danh_gia: 'month', thu_tu: 1, trang_thai: TRANG_THAI_HOAT_DONG.DANG_HOAT_DONG, tg_tao: ts(), tg_cap_nhat: ts() },
  { id: 'k24', id_nhiem_vu: 't13', ten_chi_so: 'Kiểm kê tài sản đúng kỳ', don_vi: 'lần', chi_tieu_nguong: '1/quarter', chu_ky_danh_gia: 'quarter', thu_tu: 2, trang_thai: TRANG_THAI_HOAT_DONG.DANG_HOAT_DONG, tg_tao: ts(), tg_cap_nhat: ts() },
  // Nhiệm vụ t14 - Tổ chức sự kiện
  { id: 'k25', id_nhiem_vu: 't14', ten_chi_so: 'Sự kiện hoàn thành đúng kế hoạch', don_vi: '%', chi_tieu_nguong: '100%', chu_ky_danh_gia: 'quarter', thu_tu: 1, trang_thai: TRANG_THAI_HOAT_DONG.DANG_HOAT_DONG, tg_tao: ts(), tg_cap_nhat: ts() },
  { id: 'k26', id_nhiem_vu: 't14', ten_chi_so: 'Đánh giá hài lòng tham dự viên', don_vi: 'điểm', chi_tieu_nguong: '>= 4/5', chu_ky_danh_gia: 'quarter', thu_tu: 2, trang_thai: TRANG_THAI_HOAT_DONG.DANG_HOAT_DONG, tg_tao: ts(), tg_cap_nhat: ts() },
];

export const getKpiIndicators = async (): Promise<KpiIndicator[]> => {
  await delay(400);
  return [...dbKpis].sort((a, b) => a.thu_tu - b.thu_tu || a.ten_chi_so.localeCompare(b.ten_chi_so));
};

export const getKpiIndicatorsByTask = async (idNhiemVu: string): Promise<KpiIndicator[]> => {
  await delay(300);
  return dbKpis.filter((k) => k.id_nhiem_vu === idNhiemVu).sort((a, b) => a.thu_tu - b.thu_tu);
};

export const createKpiIndicator = async (data: KpiIndicatorFormValues): Promise<KpiIndicator> => {
  await delay(500);
  const newKpi: KpiIndicator = {
    id: `k-${Date.now()}`,
    id_nhiem_vu: data.id_nhiem_vu,
    ten_chi_so: data.ten_chi_so,
    don_vi: data.don_vi,
    chi_tieu_nguong: data.chi_tieu_nguong,
    chu_ky_danh_gia: data.chu_ky_danh_gia,
    thu_tu: data.thu_tu,
    trang_thai: data.trang_thai,
    tg_tao: new Date().toISOString(),
    tg_cap_nhat: new Date().toISOString(),
  };
  dbKpis = [newKpi, ...dbKpis];
  return newKpi;
};

export const updateKpiIndicator = async (id: string, data: KpiIndicatorFormValues): Promise<KpiIndicator> => {
  await delay(500);
  const idx = dbKpis.findIndex((k) => k.id === id);
  if (idx === -1) throw new Error(i18n.t('chucNangNhiemVu.service.kpiNotFound'));
  const updated = { ...dbKpis[idx], ...data, trang_thai: data.trang_thai, tg_cap_nhat: new Date().toISOString() };
  dbKpis[idx] = updated;
  return updated;
};

export const deleteKpiIndicators = async (ids: string[]): Promise<void> => {
  await delay(400);
  dbKpis = dbKpis.filter((k) => !ids.includes(k.id));
};

export const updateKpiIndicatorStatus = async (ids: string[], status: import('../../../../lib/constants').TrangThaiHoatDong): Promise<KpiIndicator | undefined> => {
  await delay(400);
  let updated: KpiIndicator | undefined;
  dbKpis = dbKpis.map((k) => {
    if (ids.includes(k.id)) {
      const next = { ...k, trang_thai: status, tg_cap_nhat: new Date().toISOString() };
      if (ids.length === 1) updated = next;
      return next;
    }
    return k;
  });
  return updated;
};
