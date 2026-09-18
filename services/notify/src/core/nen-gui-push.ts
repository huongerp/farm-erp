/**
 * Quyết định một thông báo có vào chuông và có rung điện thoại hay không.
 *
 * Mặc định của hệ thống là BẬT HẾT: bảng fp_var_thong_bao_cai_dat chỉ lưu ngoại
 * lệ, nên không có dòng nghĩa là bật. Nhờ vậy nhân viên mới vào là có thông báo
 * ngay, không cần seed dữ liệu.
 */

import type { MucThongBao } from './types.ts';

/** Một dòng ngoại lệ trong fp_var_thong_bao_cai_dat. */
export interface CaiDatNgoaiLe {
  moduleId: string;
  /** '*' = áp cho cả module. */
  loaiSuKien: string;
  trongApp: boolean;
  push: boolean;
}

/** Một dòng fp_var_thong_bao_tuy_chon. Không có dòng thì dùng MAC_DINH_TUY_CHON. */
export interface TuyChonChung {
  pushBat: boolean;
  gioYenLangBat: boolean;
  gioYenLangTu: number;
  gioYenLangDen: number;
}

export const MAC_DINH_TUY_CHON: TuyChonChung = {
  pushBat: true,
  gioYenLangBat: true,
  gioYenLangTu: 21,
  gioYenLangDen: 6,
};

export interface KetQuaCaiDat {
  trongApp: boolean;
  push: boolean;
}

const BAT_CA_HAI: KetQuaCaiDat = { trongApp: true, push: true };

/**
 * Tìm cài đặt áp dụng. Dòng theo đúng loại sự kiện thắng dòng '*' của cả module;
 * không có dòng nào thì bật cả hai.
 */
export function timCaiDat(
  ngoaiLe: readonly CaiDatNgoaiLe[],
  moduleId: string,
  loaiSuKien: string
): KetQuaCaiDat {
  let theoModule: CaiDatNgoaiLe | null = null;

  for (const d of ngoaiLe) {
    if (d.moduleId !== moduleId) continue;
    if (d.loaiSuKien === loaiSuKien) return { trongApp: d.trongApp, push: d.push };
    if (d.loaiSuKien === '*') theoModule = d;
  }

  return theoModule ? { trongApp: theoModule.trongApp, push: theoModule.push } : BAT_CA_HAI;
}

/**
 * Giờ hiện tại có nằm trong khoảng yên lặng không.
 * Khoảng vắt qua nửa đêm (21h–6h) là trường hợp mặc định nên phải xử lý đúng.
 * Hai mốc bằng nhau = khoảng rỗng, không yên lặng giờ nào.
 */
export function trongGioYenLang(gio: number, tu: number, den: number): boolean {
  if (tu === den) return false;
  return tu < den ? gio >= tu && gio < den : gio >= tu || gio < den;
}

export interface NguCanhQuyetDinh {
  muc: MucThongBao;
  /** Người nhận là cấp bậc 1 lọt vào qua nhóm duyệt — vào chuông nhưng không rung. */
  imLang: boolean;
  caiDat: KetQuaCaiDat;
  tuyChon: TuyChonChung;
  /** Giờ trong ngày theo múi giờ công ty, 0–23. */
  gioHienTai: number;
}

export function nenVaoChuong(nc: NguCanhQuyetDinh): boolean {
  return nc.caiDat.trongApp;
}

/**
 * Có đẩy ra màn hình khoá không.
 *
 * Giờ yên lặng chặn CẢ mức cao: người dùng bật nó là cố ý, và nếu mức cao vẫn
 * lọt qua thì tính năng gần như vô nghĩa vì phần lớn sự kiện đáng chú ý đều là
 * mức cao. Thông báo vẫn nằm sẵn trong chuông khi họ mở app.
 */
export function nenGuiPush(nc: NguCanhQuyetDinh): boolean {
  if (!nc.caiDat.trongApp) return false;
  if (!nc.caiDat.push) return false;
  if (!nc.tuyChon.pushBat) return false;
  if (nc.imLang) return false;
  if (nc.tuyChon.gioYenLangBat
      && trongGioYenLang(nc.gioHienTai, nc.tuyChon.gioYenLangTu, nc.tuyChon.gioYenLangDen)) {
    return false;
  }
  return true;
}
