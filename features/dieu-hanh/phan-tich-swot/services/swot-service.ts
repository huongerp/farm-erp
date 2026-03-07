import type { SwotAnalysis, SwotItem } from '../core/types';
import type { SwotFormValues } from '../core/schema';

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));
const ts = () => new Date().toISOString();
const genId = () => `swot-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

/** Mock: lưu theo năm, key = nam */
const store = new Map<number, SwotAnalysis>();

function toItems(arr: { id?: string; text: string }[]): SwotItem[] {
  return arr
    .filter((x) => x.text?.trim())
    .map((x) => ({ id: x.id || genId(), text: x.text.trim() }));
}

/** Seed dữ liệu mẫu cho năm hiện tại */
const currentYear = new Date().getFullYear();
store.set(currentYear, {
  id: genId(),
  nam: currentYear,
  strengths: [
    { id: 's1', text: 'Đội ngũ kỹ thuật giàu kinh nghiệm' },
    { id: 's2', text: 'Sản phẩm đã có thương hiệu trên thị trường' },
    { id: 's3', text: 'Hệ thống khách hàng trung thành' },
    { id: 's4', text: 'Vốn mạnh, tài chính ổn định' },
    { id: 's5', text: 'Cơ sở vật chất và trang thiết bị tốt' },
    { id: 's6', text: 'Công nghệ, quy trình tiên tiến' },
    { id: 's7', text: 'Quản lý chuyên nghiệp, văn hóa doanh nghiệp rõ ràng' },
  ],
  weaknesses: [
    { id: 'w1', text: 'Hạn chế nguồn vốn mở rộng' },
    { id: 'w2', text: 'Phụ thuộc vào một số đối tác lớn' },
    { id: 'w3', text: 'Chi phí vận hành còn cao' },
    { id: 'w4', text: 'Quy trình nội bộ chưa tối ưu' },
    { id: 'w5', text: 'Thiếu nhân sự chuyên môn ở một số mảng' },
    { id: 'w6', text: 'Thị phần còn nhỏ so với đối thủ dẫn đầu' },
  ],
  opportunities: [
    { id: 'o1', text: 'Chính sách hỗ trợ chuyển đổi số' },
    { id: 'o2', text: 'Thị trường SME đang tăng trưởng' },
    { id: 'o3', text: 'Nhu cầu chuyển đổi số tăng mạnh' },
    { id: 'o4', text: 'Mở rộng sang khu vực, phân khúc mới' },
    { id: 'o5', text: 'Ưu đãi thuế, vay vốn từ ngân hàng' },
    { id: 'o6', text: 'Công nghệ mới giúp giảm chi phí, tăng hiệu quả' },
    { id: 'o7', text: 'Hợp tác với đối tác công nghệ, nhà cung cấp lớn' },
  ],
  threats: [
    { id: 't1', text: 'Cạnh tranh từ đối thủ quốc tế' },
    { id: 't2', text: 'Thay đổi quy định pháp lý' },
    { id: 't3', text: 'Đối thủ giảm giá mạnh' },
    { id: 't4', text: 'Sản phẩm thay thế xuất hiện' },
    { id: 't5', text: 'Tiêu chuẩn ngành nâng cao' },
    { id: 't6', text: 'Lãi suất tăng, thắt chặt tín dụng' },
    { id: 't7', text: 'Biến động tỷ giá, giá nguyên liệu' },
  ],
  industrySuccessFactors: [
    { id: 'isf1', text: 'Chất lượng sản phẩm/dịch vụ vượt trội' },
    { id: 'isf2', text: 'Chi phí hợp lý, hiệu quả vận hành' },
    { id: 'isf3', text: 'Đáp ứng tiêu chuẩn ngành, chứng nhận' },
    { id: 'isf4', text: 'Thị phần và nhận diện thương hiệu' },
    { id: 'isf5', text: 'Tối ưu chuỗi cung ứng, giao hàng đúng hạn' },
    { id: 'isf6', text: 'Công nghệ và đổi mới sáng tạo' },
    { id: 'isf7', text: 'Đội ngũ nhân sự có năng lực, gắn bó' },
    { id: 'isf8', text: 'Trải nghiệm khách hàng tốt, dịch vụ hậu mãi' },
  ],
  tg_tao: ts(),
  tg_cap_nhat: ts(),
});

/** Lấy danh sách các năm đã có bản SWOT (để chọn kỳ) */
export async function getSwotYears(): Promise<number[]> {
  await delay(200);
  const years = Array.from(store.keys()).sort((a, b) => b - a);
  return years;
}

/** Lấy bản SWOT theo năm; null nếu chưa có */
export async function getSwotByYear(nam: number): Promise<SwotAnalysis | null> {
  await delay(250);
  const row = store.get(nam);
  if (!row) return null;
  return {
    ...row,
    industrySuccessFactors: row.industrySuccessFactors ?? [],
  };
}

/** Tạo bản SWOT mới cho năm (nếu năm đó chưa có) */
export async function createSwot(payload: SwotFormValues): Promise<SwotAnalysis> {
  await delay(400);
  if (store.has(payload.nam)) {
    throw new Error('SWOT for this year already exists');
  }
  const now = ts();
  const data: SwotAnalysis = {
    id: genId(),
    nam: payload.nam,
    strengths: toItems(payload.strengths),
    weaknesses: toItems(payload.weaknesses),
    opportunities: toItems(payload.opportunities),
    threats: toItems(payload.threats),
    industrySuccessFactors: toItems(payload.industrySuccessFactors ?? []),
    tg_tao: now,
    tg_cap_nhat: now,
  };
  store.set(payload.nam, data);
  return { ...data };
}

/** Cập nhật bản SWOT (theo id hoặc năm) */
export async function updateSwot(
  idOrNam: string | number,
  payload: Omit<SwotFormValues, 'nam'>
): Promise<SwotAnalysis> {
  await delay(400);
  const nam = typeof idOrNam === 'number' ? idOrNam : undefined;
  const byNam = nam != null ? store.get(nam) : null;
  const byId =
    byNam ?? Array.from(store.values()).find((s) => s.id === idOrNam);
  if (!byId) {
    throw new Error('SWOT not found');
  }
  const updated: SwotAnalysis = {
    ...byId,
    strengths: toItems(payload.strengths),
    weaknesses: toItems(payload.weaknesses),
    opportunities: toItems(payload.opportunities),
    threats: toItems(payload.threats),
    industrySuccessFactors: toItems(payload.industrySuccessFactors ?? []),
    tg_cap_nhat: ts(),
  };
  store.set(byId.nam, updated);
  return { ...updated };
}
