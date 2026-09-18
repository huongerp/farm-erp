/** Một dòng fp_var_thong_bao sau khi chuẩn hoá cho giao diện. */
export interface ThongBao {
  id: string;
  moduleId: string;
  loaiSuKien: string;
  muc: 'cao' | 'thuong';
  tieuDe: string;
  noiDung: string | null;
  link: string | null;
  daDoc: boolean;
  soLan: number;
  tgTao: string;
}

/** Số chưa đọc theo từng module, để hiện trên chip lọc. */
export type DemTheoModule = Record<string, number>;

export interface TrangThongBao {
  items: ThongBao[];
  /** Tổng số dòng khớp bộ lọc — biết còn trang sau hay không. */
  tong: number;
}

/** Thiết bị đã đăng ký nhận push, hiện trong trang cài đặt. */
export interface ThietBiPush {
  id: string;
  endpoint: string;
  tenThietBi: string | null;
  tgTao: string;
  tgDungCuoi: string | null;
}

export interface TuyChonThongBao {
  pushBat: boolean;
  gioYenLangBat: boolean;
  gioYenLangTu: number;
  gioYenLangDen: number;
}

export const TUY_CHON_MAC_DINH: TuyChonThongBao = {
  pushBat: true,
  gioYenLangBat: true,
  gioYenLangTu: 21,
  gioYenLangDen: 6,
};

/** Một dòng ngoại lệ bật/tắt. Không có dòng = bật cả hai. */
export interface CaiDatThongBao {
  moduleId: string;
  loaiSuKien: string;
  trongApp: boolean;
  push: boolean;
}
