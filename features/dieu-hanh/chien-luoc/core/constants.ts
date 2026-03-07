import type { LoaiTows, TrangThaiDuyet, TrangThaiTrienKhai } from './types';
import type { LoaiChienLuoc, NhomLoaiChienLuoc } from './types';

export const TRANG_THAI_DUYET: TrangThaiDuyet[] = [
  'cho_duyet',
  'da_duyet',
  'khong_duyet',
];

export const TRANG_THAI_TRIEN_KHAI: TrangThaiTrienKhai[] = [
  'chua_bat_dau',
  'dang_trien_khai',
  'tam_ngung',
  'hoan_thanh',
  'huy',
];

export const LOAI_TOWS: LoaiTows[] = ['SO', 'ST', 'WO', 'WT'];

/** i18n key prefix cho trạng thái duyệt */
export const TRANG_THAI_DUYET_LABEL_KEYS: Record<TrangThaiDuyet, string> = {
  cho_duyet: 'chienLuoc.trangThaiDuyet.choDuyet',
  da_duyet: 'chienLuoc.trangThaiDuyet.daDuyet',
  khong_duyet: 'chienLuoc.trangThaiDuyet.khongDuyet',
};

/** i18n key prefix cho trạng thái triển khai */
export const TRANG_THAI_TRIEN_KHAI_LABEL_KEYS: Record<TrangThaiTrienKhai, string> = {
  chua_bat_dau: 'chienLuoc.trangThaiTrienKhai.chuaBatDau',
  dang_trien_khai: 'chienLuoc.trangThaiTrienKhai.dangTrienKhai',
  tam_ngung: 'chienLuoc.trangThaiTrienKhai.tamNgung',
  hoan_thanh: 'chienLuoc.trangThaiTrienKhai.hoanThanh',
  huy: 'chienLuoc.trangThaiTrienKhai.huy',
};

/** i18n key prefix cho nhóm loại chiến lược */
export const NHOM_LOAI_CHIEN_LUOC_LABEL_KEYS: Record<NhomLoaiChienLuoc, string> = {
  tows: 'chienLuoc.thietLap.nhomTows',
  ansoff: 'chienLuoc.thietLap.nhomAnsoff',
  corporate: 'chienLuoc.thietLap.nhomCorporate',
  integration: 'chienLuoc.thietLap.nhomIntegration',
};

/** Danh sách mặc định loại chiến lược: TOWS (4) + Ansoff (4) + Corporate (4) + Integration (3). Câu chiến lược mẫu theo quan điểm chuyên gia quản trị. */
export function getLoaiChienLuocDefault(): LoaiChienLuoc[] {
  const items: LoaiChienLuoc[] = [
    { id: 'tows-so', nhom: 'tows', ma: 'SO', ten: 'SO - Điểm mạnh & Cơ hội', mo_ta: 'Tận dụng điểm mạnh nội bộ để nắm bắt cơ hội bên ngoài.', cau_chien_luoc_mau: 'Tận dụng điểm mạnh [S] và cơ hội [O] để mở rộng thị phần và tăng trưởng nhằm tối đa hóa lợi thế cạnh tranh bền vững.', thu_tu: 0 },
    { id: 'tows-st', nhom: 'tows', ma: 'ST', ten: 'ST - Điểm mạnh & Nguy cơ', mo_ta: 'Dùng điểm mạnh để đối phó hoặc giảm thiểu nguy cơ.', cau_chien_luoc_mau: 'Sử dụng lợi thế [S] để giảm thiểu hoặc đối phó nguy cơ [T] nhằm bảo vệ vị thế và thị phần hiện tại.', thu_tu: 1 },
    { id: 'tows-wo', nhom: 'tows', ma: 'WO', ten: 'WO - Điểm yếu & Cơ hội', mo_ta: 'Tận dụng cơ hội bên ngoài để khắc phục điểm yếu nội bộ.', cau_chien_luoc_mau: 'Tận dụng cơ hội [O] để khắc phục điểm yếu [W] nhằm nâng cao năng lực và không bỏ lỡ cơ hội thị trường.', thu_tu: 2 },
    { id: 'tows-wt', nhom: 'tows', ma: 'WT', ten: 'WT - Điểm yếu & Nguy cơ', mo_ta: 'Giảm điểm yếu và tránh đối đầu trực tiếp với nguy cơ.', cau_chien_luoc_mau: 'Giảm thiểu điểm yếu [W] và tránh/đối phó nguy cơ [T] nhằm ổn định hoạt động và hạn chế rủi ro.', thu_tu: 3 },
    { id: 'ansoff-penetration', nhom: 'ansoff', ma: 'THAM_NHAP', ten: 'Thâm nhập thị trường', mo_ta: 'Tăng thị phần trong thị trường và sản phẩm hiện tại.', cau_chien_luoc_mau: 'Tăng cường thâm nhập thị trường hiện tại (giữ sản phẩm & thị trường) để tăng thị phần và doanh thu nhằm tối đa hóa giá trị từ khách hàng hiện có.', thu_tu: 10 },
    { id: 'ansoff-development', nhom: 'ansoff', ma: 'PHAT_TRIEN_TT', ten: 'Phát triển thị trường', mo_ta: 'Đưa sản phẩm hiện có sang thị trường mới (địa lý, phân khúc).', cau_chien_luoc_mau: 'Dùng phát triển thị trường (sản phẩm hiện có, thị trường mới) để mở rộng địa lý hoặc phân khúc nhằm tăng quy mô kinh doanh với rủi ro vừa phải.', thu_tu: 11 },
    { id: 'ansoff-product', nhom: 'ansoff', ma: 'PHAT_TRIEN_SP', ten: 'Phát triển sản phẩm', mo_ta: 'Phát triển sản phẩm/dịch vụ mới cho thị trường hiện tại.', cau_chien_luoc_mau: 'Dùng phát triển sản phẩm (sản phẩm mới, thị trường hiện có) để đáp ứng nhu cầu mới và tăng giá trị khách hàng nhằm gia tăng doanh thu và lòng trung thành.', thu_tu: 12 },
    { id: 'ansoff-diversification', nhom: 'ansoff', ma: 'DA_DANG_HOA', ten: 'Đa dạng hóa', mo_ta: 'Sản phẩm mới và thị trường mới; rủi ro cao.', cau_chien_luoc_mau: 'Dùng đa dạng hóa (sản phẩm mới, thị trường mới) để giảm phụ thuộc vào một ngành/thị trường nhằm phân tán rủi ro và tìm nguồn tăng trưởng mới.', thu_tu: 13 },
    { id: 'corporate-stability', nhom: 'corporate', ma: 'ON_DINH', ten: 'Ổn định', mo_ta: 'Duy trì hoạt động hiện tại, cải tiến từng bước.', cau_chien_luoc_mau: 'Dùng chiến lược ổn định để duy trì thị phần và mô hình hiện tại nhằm củng cố nền tảng và tối ưu hiệu quả vận hành.', thu_tu: 20 },
    { id: 'corporate-growth', nhom: 'corporate', ma: 'TANG_TRUONG', ten: 'Tăng trưởng', mo_ta: 'Mở rộng quy mô, thị phần, địa bàn.', cau_chien_luoc_mau: 'Dùng chiến lược tăng trưởng để mở rộng quy mô, thị phần hoặc địa bàn nhằm nâng cao vị thế cạnh tranh và giá trị cổ đông.', thu_tu: 21 },
    { id: 'corporate-retrenchment', nhom: 'corporate', ma: 'THU_HEP', ten: 'Thu hẹp', mo_ta: 'Rút lui có kiểm soát, cắt giảm để tái cơ cấu.', cau_chien_luoc_mau: 'Dùng chiến lược thu hẹp để rút lui hoặc cắt giảm hoạt động kém hiệu quả nhằm bảo toàn nguồn lực và tái tập trung vào lĩnh vực cốt lõi.', thu_tu: 22 },
    { id: 'corporate-combination', nhom: 'corporate', ma: 'KET_HOP', ten: 'Kết hợp', mo_ta: 'Áp dụng nhiều hướng cho từng bộ phận hoặc giai đoạn.', cau_chien_luoc_mau: 'Dùng chiến lược kết hợp (ổn định/tăng trưởng/thu hẹp theo bộ phận hoặc giai đoạn) để phù hợp với từng đơn vị kinh doanh nhằm cân bằng rủi ro và cơ hội.', thu_tu: 23 },
    { id: 'integration-horizontal', nhom: 'integration', ma: 'HOI_NHAP_NGANG', ten: 'Hội nhập ngang', mo_ta: 'M&A hoặc liên minh với đối thủ cùng ngành.', cau_chien_luoc_mau: 'Dùng hội nhập ngang (M&A, liên minh đối thủ cùng ngành) để mở rộng thị phần và năng lực nhằm tăng sức mạnh thị trường và hiệu quả quy mô.', thu_tu: 30 },
    { id: 'integration-vertical', nhom: 'integration', ma: 'HOI_NHAP_DOC', ten: 'Hội nhập dọc', mo_ta: 'Kiểm soát chuỗi cung ứng (nguồn đầu vào hoặc kênh phân phối).', cau_chien_luoc_mau: 'Dùng hội nhập dọc (kiểm soát nguồn đầu vào hoặc kênh phân phối) để chủ động chuỗi cung ứng nhằm giảm chi phí, rủi ro và tăng lợi thế cạnh tranh.', thu_tu: 31 },
    { id: 'integration-diversification', nhom: 'integration', ma: 'DA_DANG_HOA', ten: 'Đa dạng hóa (tích hợp)', mo_ta: 'Mở rộng sang ngành hoặc lĩnh vực liên quan hoặc không liên quan.', cau_chien_luoc_mau: 'Dùng đa dạng hóa tích hợp (bước sang ngành/lĩnh vực mới) để giảm phụ thuộc một ngành nhằm phân tán rủi ro và tận dụng năng lực hiện có.', thu_tu: 32 },
  ];
  return items;
}
