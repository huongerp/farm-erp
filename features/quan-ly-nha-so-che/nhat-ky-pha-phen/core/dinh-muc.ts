/**
 * Định mức phèn: tỷ lệ pha g/lít (= kg/m³). Đầu ca (lần 1) = (V xắn + V tỉa) × tỷ lệ × tỷ lệ đầu ca;
 * «bổ sung» nhập tay của từng hồ chia đều cho các lần pha sau.
 */

export type HoPhenDinhMuc = {
  the_tich_xan_m3: number | null;
  the_tich_tia_m3: number | null;
  bo_sung_xan_kg: number | null;
  bo_sung_tia_kg: number | null;
  ty_le_g_lit: number | null;
  ty_le_dau_ca: number | null;
  dang_dung: boolean;
};

export const TY_LE_G_LIT_MAC_DINH = 0.5;
export const TY_LE_DAU_CA_MAC_DINH = 0.8;
/** Số lần pha sau lần đầu ca (9h, 11h, 15h, 17h). */
export const SO_LAN_PHA_SAU = 4;

const lam3 = (n: number) => {
  const r = Math.round(n * 1000) / 1000;
  return r === 0 ? 0 : r; // tránh -0
};
const so = (n: number | null | undefined, macDinh = 0) => (n == null || Number.isNaN(n) ? macDinh : n);

export type DinhMucPhen = { lan1: number; moiLanSau: number; tongNgay: number };

export function tinhDinhMucPhen(hoList: HoPhenDinhMuc[], soLanSau: number = SO_LAN_PHA_SAU): DinhMucPhen {
  let lan1 = 0;
  let boSung = 0;
  for (const h of hoList) {
    if (!h.dang_dung) continue;
    const theTich = so(h.the_tich_xan_m3) + so(h.the_tich_tia_m3);
    lan1 += theTich * so(h.ty_le_g_lit, TY_LE_G_LIT_MAC_DINH) * so(h.ty_le_dau_ca, TY_LE_DAU_CA_MAC_DINH);
    boSung += so(h.bo_sung_xan_kg) + so(h.bo_sung_tia_kg);
  }
  const moiLanSau = soLanSau > 0 ? boSung / soLanSau : 0;
  return { lan1: lam3(lan1), moiLanSau: lam3(moiLanSau), tongNgay: lam3(lan1 + boSung) };
}

/** Chênh lệch = thực tế − định mức (dương = pha vượt định mức). */
export function tinhChenhLech(thucTe: number, dinhMuc: number): number {
  return lam3(thucTe - dinhMuc);
}

/** Định mức của từng lần pha (lần 1 = đầu ca, các lần sau chia đều). */
export function dinhMucTheoLan(dm: DinhMucPhen, soLan = 5): number[] {
  return Array.from({ length: soLan }, (_, i) => (i === 0 ? dm.lan1 : dm.moiLanSau));
}

/** Tổng hợp các dòng lần: tổng thực tế, tổng định mức, chênh lệch. */
export function tongHopLan(lan: { so_kg: number | null; dinh_muc_kg: number | null }[]): {
  tongThucTe: number;
  tongDinhMuc: number;
  chenhLech: number;
} {
  const tongThucTe = lam3(lan.reduce((s, l) => s + so(l.so_kg), 0));
  const tongDinhMuc = lam3(lan.reduce((s, l) => s + so(l.dinh_muc_kg), 0));
  return { tongThucTe, tongDinhMuc, chenhLech: tinhChenhLech(tongThucTe, tongDinhMuc) };
}
