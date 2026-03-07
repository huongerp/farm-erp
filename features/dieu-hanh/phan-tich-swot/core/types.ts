/** Một ý trong ô SWOT (điểm mạnh/yếu/cơ hội/nguy cơ) */
export interface SwotItem {
  id: string;
  text: string;
}

/** Bản phân tích SWOT theo năm */
export interface SwotAnalysis {
  id: string;
  /** Năm (kỳ) */
  nam: number;
  strengths: SwotItem[];
  weaknesses: SwotItem[];
  opportunities: SwotItem[];
  threats: SwotItem[];
  /** Yếu tố thành công ngành (cột 3) */
  industrySuccessFactors: SwotItem[];
  tg_tao: string;
  tg_cap_nhat: string;
}
