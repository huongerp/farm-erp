import type { SuMenhTamNhin, ChiTieuQuyMo, GiaTriQuyMoTheoNam, PhanKhucThiPhan, TamNhinThiPhanItem, DinhVi } from '../core/types';
import type { MissionVisionFormValues, ValuesFormValues, DinhViFormValues } from '../core/schema';

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));
const ts = () => new Date().toISOString();

let data: SuMenhTamNhin = {
  id: 'smtn-1',
  su_menh: 'Cung cấp giải pháp công nghệ và dịch vụ chuyên nghiệp, giúp doanh nghiệp vừa và nhỏ vận hành hiệu quả, phát triển bền vững.',
  tam_nhin: 'Đến năm 2030 trở thành đối tác tin cậy hàng đầu về phần mềm quản trị và chuyển đổi số tại thị trường Đông Nam Á.',
  dinh_vi: {
    phan_khuc_hien_tai: 'Doanh nghiệp vừa và nhỏ (SME) tại Việt Nam; ưu tiên các doanh nghiệp đang dùng phần mềm kế toán – quản trị nội bộ.',
    phan_khuc_tuong_lai: 'Mở rộng sang SME Đông Nam Á và doanh nghiệp quy mô vừa; tập trung đang chuyển đổi số hoặc cần phần mềm quản trị tổng thể.',
    khach_hang_hien_tai: 'Chủ doanh nghiệp, Giám đốc điều hành, Kế toán trưởng tại các SME đã hoặc đang dùng phần mềm kế toán – quản trị nội bộ.',
    khach_hang_tuong_lai: 'Mở rộng sang nhóm Giám đốc công nghệ (CTO), Trưởng phòng vận hành tại doanh nghiệp quy mô vừa và tập đoàn khu vực.',
    san_pham_hien_tai: 'Phần mềm kế toán, quản lý bán hàng, kho, nhân sự; dịch vụ triển khai và hỗ trợ trên nền tảng hiện có.',
    san_pham_tuong_lai: 'Nền tảng ERP tích hợp AI, giải pháp chuyển đổi số end-to-end, dịch vụ tư vấn và đồng hành dài hạn.',
  },
  gia_tri: [
    {
      id: 'v1',
      ten: 'Trung thực',
      mo_ta: 'Minh bạch trong mọi giao dịch và cam kết.',
      thu_tu: 1,
      mo_dich: 'Xây dựng niềm tin với đối tác và khách hàng qua hành động minh bạch.',
      hanh_vi_nen_lam: ['Báo cáo đúng sự thật', 'Giữ lời hứa', 'Thừa nhận sai sót'],
      hanh_vi_khong_nen_lam: ['Che giấu thông tin', 'Hứa quá khả năng'],
    },
    {
      id: 'v2',
      ten: 'Sáng tạo',
      mo_ta: 'Không ngừng cải tiến sản phẩm và quy trình.',
      thu_tu: 2,
      mo_dich: 'Dẫn dắt thay đổi và tạo lợi thế cạnh tranh bền vững.',
      hanh_vi_nen_lam: ['Đề xuất ý tưởng mới', 'Thử nghiệm cách làm khác', 'Học từ thất bại'],
      hanh_vi_khong_nen_lam: ['Làm theo lối mòn', 'Bỏ qua phản hồi'],
    },
    {
      id: 'v3',
      ten: 'Khách hàng làm trung tâm',
      mo_ta: 'Lắng nghe và đáp ứng nhu cầu khách hàng.',
      thu_tu: 3,
      mo_dich: 'Giữ chân khách hàng và mở rộng cơ hội từ sự hài lòng.',
      hanh_vi_nen_lam: ['Lắng nghe trước khi nói', 'Giải quyết kịp thời', 'Đo lường sự hài lòng'],
      hanh_vi_khong_nen_lam: ['Áp đặt giải pháp', 'Bỏ qua khiếu nại'],
    },
    {
      id: 'v4',
      ten: 'Tôn trọng',
      mo_ta: 'Tôn trọng con người, đa dạng và bình đẳng trong môi trường làm việc.',
      thu_tu: 4,
      mo_dich: 'Tạo văn hóa làm việc lành mạnh, gắn kết và phát huy năng lực từng cá nhân.',
      hanh_vi_nen_lam: ['Lắng nghe ý kiến đồng nghiệp', 'Công nhận đóng góp', 'Ứng xử công bằng'],
      hanh_vi_khong_nen_lam: ['Phân biệt đối xử', 'Nói xấu sau lưng', 'Áp đặt quan điểm'],
    },
    {
      id: 'v5',
      ten: 'Hợp tác',
      mo_ta: 'Cùng nhau đạt mục tiêu chung qua làm việc nhóm và chia sẻ trách nhiệm.',
      thu_tu: 5,
      mo_dich: 'Nâng cao hiệu quả và chất lượng quyết định nhờ đa chiều và minh bạch.',
      hanh_vi_nen_lam: ['Chia sẻ thông tin kịp thời', 'Hỗ trợ đồng đội', 'Giải quyết xung đột xây dựng'],
      hanh_vi_khong_nen_lam: ['Làm việc đơn lẻ bất hợp tác', 'Giữ thông tin cho riêng mình', 'Đổ lỗi cho người khác'],
    },
  ],
  chi_tieu_quy_mo: [
    { id: 'ct1', ten: 'Doanh số', don_vi: 'tỷ VND', thu_tu: 1, loai_bieu_do: 'bar_vertical' },
    { id: 'ct2', ten: 'Số cửa hàng', don_vi: 'cửa hàng', thu_tu: 2, loai_bieu_do: 'bar_horizontal' },
    { id: 'ct3', ten: 'Số mặt hàng', don_vi: 'SKU', thu_tu: 3, loai_bieu_do: 'bar_vertical' },
    { id: 'ct4', ten: 'Nhân sự', don_vi: 'người', thu_tu: 4, loai_bieu_do: 'bar_horizontal' },
    { id: 'ct5', ten: 'Lợi nhuận', don_vi: 'tỷ VND', thu_tu: 5, loai_bieu_do: 'bar_vertical' },
    { id: 'ct6', ten: 'Thị phần', don_vi: '%', thu_tu: 6, loai_bieu_do: 'bar_horizontal' },
    { id: 'ct7', ten: 'Số chi nhánh', don_vi: 'chi nhánh', thu_tu: 7, loai_bieu_do: 'bar_vertical' },
    { id: 'ct8', ten: 'Doanh thu xuất khẩu', don_vi: 'triệu USD', thu_tu: 8, loai_bieu_do: 'bar_horizontal' },
  ],
  gia_tri_quy_mo_theo_nam: [
    { id_chi_tieu: 'ct1', nam: 2025, gia_tri: 100 },
    { id_chi_tieu: 'ct1', nam: 2026, gia_tri: 120 },
    { id_chi_tieu: 'ct1', nam: 2027, gia_tri: 145 },
    { id_chi_tieu: 'ct2', nam: 2025, gia_tri: 10 },
    { id_chi_tieu: 'ct2', nam: 2026, gia_tri: 15 },
    { id_chi_tieu: 'ct2', nam: 2027, gia_tri: 22 },
    { id_chi_tieu: 'ct3', nam: 2025, gia_tri: 500 },
    { id_chi_tieu: 'ct3', nam: 2026, gia_tri: 650 },
    { id_chi_tieu: 'ct3', nam: 2027, gia_tri: 800 },
    { id_chi_tieu: 'ct4', nam: 2025, gia_tri: 50 },
    { id_chi_tieu: 'ct4', nam: 2026, gia_tri: 65 },
    { id_chi_tieu: 'ct4', nam: 2027, gia_tri: 80 },
    { id_chi_tieu: 'ct5', nam: 2025, gia_tri: 12 },
    { id_chi_tieu: 'ct5', nam: 2026, gia_tri: 18 },
    { id_chi_tieu: 'ct5', nam: 2027, gia_tri: 25 },
    { id_chi_tieu: 'ct6', nam: 2025, gia_tri: 5 },
    { id_chi_tieu: 'ct6', nam: 2026, gia_tri: 8 },
    { id_chi_tieu: 'ct6', nam: 2027, gia_tri: 12 },
    { id_chi_tieu: 'ct7', nam: 2025, gia_tri: 3 },
    { id_chi_tieu: 'ct7', nam: 2026, gia_tri: 5 },
    { id_chi_tieu: 'ct7', nam: 2027, gia_tri: 8 },
    { id_chi_tieu: 'ct8', nam: 2025, gia_tri: 2 },
    { id_chi_tieu: 'ct8', nam: 2026, gia_tri: 4 },
    { id_chi_tieu: 'ct8', nam: 2027, gia_tri: 7 },
  ],
  phan_khuc_thi_phan: [
    { id: 'pk1', ten: 'Phần mềm ERP', thu_tu: 1, loai_bieu_do: 'donut' },
    { id: 'pk2', ten: 'Dịch vụ chuyển đổi số', thu_tu: 2, loai_bieu_do: 'donut' },
    { id: 'pk3', ten: 'Tư vấn triển khai', thu_tu: 3, loai_bieu_do: 'pie' },
    { id: 'pk4', ten: 'Hạ tầng điện toán đám mây', thu_tu: 4, loai_bieu_do: 'donut' },
    { id: 'pk5', ten: 'Bảo trì & Hỗ trợ', thu_tu: 5, loai_bieu_do: 'pie' },
    { id: 'pk6', ten: 'Giải pháp AI', thu_tu: 6, loai_bieu_do: 'donut' },
  ],
  tam_nhin_thi_phan: [
    { nam: 2025, id_phan_khuc: 'pk1', gia_tri: 3 },
    { nam: 2025, id_phan_khuc: 'pk2', gia_tri: 2 },
    { nam: 2025, id_phan_khuc: 'pk3', gia_tri: 1.5 },
    { nam: 2025, id_phan_khuc: 'pk4', gia_tri: 1 },
    { nam: 2025, id_phan_khuc: 'pk5', gia_tri: 2.5 },
    { nam: 2025, id_phan_khuc: 'pk6', gia_tri: 0.5 },
    { nam: 2026, id_phan_khuc: 'pk1', gia_tri: 5 },
    { nam: 2026, id_phan_khuc: 'pk2', gia_tri: 4 },
    { nam: 2026, id_phan_khuc: 'pk3', gia_tri: 3 },
    { nam: 2026, id_phan_khuc: 'pk4', gia_tri: 2 },
    { nam: 2026, id_phan_khuc: 'pk5', gia_tri: 4 },
    { nam: 2026, id_phan_khuc: 'pk6', gia_tri: 2 },
    { nam: 2027, id_phan_khuc: 'pk1', gia_tri: 8 },
    { nam: 2027, id_phan_khuc: 'pk2', gia_tri: 6 },
    { nam: 2027, id_phan_khuc: 'pk3', gia_tri: 5 },
    { nam: 2027, id_phan_khuc: 'pk4', gia_tri: 4 },
    { nam: 2027, id_phan_khuc: 'pk5', gia_tri: 5 },
    { nam: 2027, id_phan_khuc: 'pk6', gia_tri: 4 },
  ],
  ngay_hieu_luc: '2025-01-15',
  nguoi_duyet: 'HĐQT',
  trang_thai: 1,
  tg_tao: ts(),
  tg_cap_nhat: ts(),
};

export const getSuMenhTamNhin = async (): Promise<SuMenhTamNhin> => {
  await delay(300);
  return { ...data };
};

export const updateMissionVision = async (
  payload: MissionVisionFormValues
): Promise<SuMenhTamNhin> => {
  await delay(400);
  data = {
    ...data,
    su_menh: payload.su_menh,
    tam_nhin: payload.tam_nhin,
    tg_cap_nhat: ts(),
  };
  return { ...data };
};

export const updateValues = async (payload: ValuesFormValues): Promise<SuMenhTamNhin> => {
  await delay(400);
  const gia_tri = payload.gia_tri.map((v, i) => ({
    id: v.id || `v-${Date.now()}-${i}`,
    ten: v.ten,
    mo_ta: v.mo_ta,
    thu_tu: v.thu_tu,
    mo_dich: v.mo_dich ?? '',
    hanh_vi_nen_lam: v.hanh_vi_nen_lam?.filter(Boolean) ?? [],
    hanh_vi_khong_nen_lam: v.hanh_vi_khong_nen_lam?.filter(Boolean) ?? [],
  }));
  data = {
    ...data,
    gia_tri,
    tg_cap_nhat: ts(),
  };
  return { ...data };
};

export const updateDinhVi = async (payload: DinhViFormValues): Promise<SuMenhTamNhin> => {
  await delay(400);
  const dinh_vi: DinhVi = {
    phan_khuc_hien_tai: payload.phan_khuc_hien_tai ?? '',
    phan_khuc_tuong_lai: payload.phan_khuc_tuong_lai ?? '',
    khach_hang_hien_tai: payload.khach_hang_hien_tai ?? '',
    khach_hang_tuong_lai: payload.khach_hang_tuong_lai ?? '',
    san_pham_hien_tai: payload.san_pham_hien_tai ?? '',
    san_pham_tuong_lai: payload.san_pham_tuong_lai ?? '',
  };
  data = { ...data, dinh_vi, tg_cap_nhat: ts() };
  return { ...data };
};

export const updateChiTieuQuyMo = async (
  payload: ChiTieuQuyMo[]
): Promise<SuMenhTamNhin> => {
  await delay(400);
  data = {
    ...data,
    chi_tieu_quy_mo: payload.sort((a, b) => a.thu_tu - b.thu_tu),
    tg_cap_nhat: ts(),
  };
  return { ...data };
};

export const updateGiaTriQuyMoTheoNam = async (
  payload: GiaTriQuyMoTheoNam[]
): Promise<SuMenhTamNhin> => {
  await delay(400);
  data = {
    ...data,
    gia_tri_quy_mo_theo_nam: payload,
    tg_cap_nhat: ts(),
  };
  return { ...data };
};

export const updatePhanKhucThiPhan = async (
  payload: PhanKhucThiPhan[]
): Promise<SuMenhTamNhin> => {
  await delay(400);
  data = {
    ...data,
    phan_khuc_thi_phan: payload.sort((a, b) => a.thu_tu - b.thu_tu),
    tg_cap_nhat: ts(),
  };
  return { ...data };
};

export const updateTamNhinThiPhan = async (
  payload: TamNhinThiPhanItem[]
): Promise<SuMenhTamNhin> => {
  await delay(400);
  data = {
    ...data,
    tam_nhin_thi_phan: payload,
    tg_cap_nhat: ts(),
  };
  return { ...data };
};
