/**
 * Âm lịch Việt Nam + số tuần ISO — thuần, không phụ thuộc React.
 *
 * Thuật toán theo Hồ Ngọc Đức ("Âm lịch Việt Nam", thiên văn gần đúng của Meeus),
 * tính theo múi giờ +7 cố định: lịch âm Việt Nam lấy kinh tuyến 105°Đ làm chuẩn nên
 * KHÔNG đổi theo múi giờ người dùng chọn trong Cài đặt — múi giờ đó chỉ quyết định
 * "hôm nay" là ngày dương nào.
 *
 * Mọi ngày dương truyền vào là (ngày, tháng 1–12, năm) theo lịch Gregory.
 */

const MUI_GIO_VN = 7;
const INT = Math.floor;
const PI = Math.PI;

export const THIEN_CAN = ['Giáp', 'Ất', 'Bính', 'Đinh', 'Mậu', 'Kỷ', 'Canh', 'Tân', 'Nhâm', 'Quý'] as const;
export const DIA_CHI = ['Tý', 'Sửu', 'Dần', 'Mão', 'Thìn', 'Tỵ', 'Ngọ', 'Mùi', 'Thân', 'Dậu', 'Tuất', 'Hợi'] as const;

/** 24 tiết khí, phần tử 0 ứng kinh độ mặt trời 0° (Xuân phân), mỗi tiết cách 15°. */
export const TIET_KHI = [
  'Xuân phân', 'Thanh minh', 'Cốc vũ', 'Lập hạ', 'Tiểu mãn', 'Mang chủng',
  'Hạ chí', 'Tiểu thử', 'Đại thử', 'Lập thu', 'Xử thử', 'Bạch lộ',
  'Thu phân', 'Hàn lộ', 'Sương giáng', 'Lập đông', 'Tiểu tuyết', 'Đại tuyết',
  'Đông chí', 'Tiểu hàn', 'Đại hàn', 'Lập xuân', 'Vũ thủy', 'Kinh trập',
] as const;

export interface NgayAm {
  ngay: number;
  thang: number;
  /** Năm âm lịch — có thể lệch năm dương ở khoảng tháng 1–2 dương. */
  nam: number;
  nhuan: boolean;
}

/** Số ngày Julius (tại trưa) của một ngày dương. */
export function jdTuNgay(d: number, m: number, y: number): number {
  const a = INT((14 - m) / 12);
  const yy = y + 4800 - a;
  const mm = m + 12 * a - 3;
  let jd = d + INT((153 * mm + 2) / 5) + 365 * yy + INT(yy / 4) - INT(yy / 100) + INT(yy / 400) - 32045;
  if (jd < 2299161) jd = d + INT((153 * mm + 2) / 5) + 365 * yy + INT(yy / 4) - 32083;
  return jd;
}

/** Ngày Julius của ngày Sóc (trăng mới) thứ k tính từ 1/1/1900. */
function ngaySoc(k: number, tz: number): number {
  const T = k / 1236.85;
  const T2 = T * T;
  const T3 = T2 * T;
  const dr = PI / 180;
  let jd1 = 2415020.75933 + 29.53058868 * k + 0.0001178 * T2 - 0.000000155 * T3;
  jd1 += 0.00033 * Math.sin((166.56 + 132.87 * T - 0.009173 * T2) * dr);
  const M = 359.2242 + 29.10535608 * k - 0.0000333 * T2 - 0.00000347 * T3;
  const Mpr = 306.0253 + 385.81691806 * k + 0.0107306 * T2 + 0.00001236 * T3;
  const F = 21.2964 + 390.67050646 * k - 0.0016528 * T2 - 0.00000239 * T3;
  let C1 = (0.1734 - 0.000393 * T) * Math.sin(M * dr) + 0.0021 * Math.sin(2 * dr * M);
  C1 = C1 - 0.4068 * Math.sin(Mpr * dr) + 0.0161 * Math.sin(dr * 2 * Mpr);
  C1 -= 0.0004 * Math.sin(dr * 3 * Mpr);
  C1 = C1 + 0.0104 * Math.sin(dr * 2 * F) - 0.0051 * Math.sin(dr * (M + Mpr));
  C1 = C1 - 0.0074 * Math.sin(dr * (M - Mpr)) + 0.0004 * Math.sin(dr * (2 * F + M));
  C1 = C1 - 0.0004 * Math.sin(dr * (2 * F - M)) - 0.0006 * Math.sin(dr * (2 * F + Mpr));
  C1 = C1 + 0.001 * Math.sin(dr * (2 * F - Mpr)) + 0.0005 * Math.sin(dr * (2 * Mpr + M));
  const deltat =
    T < -11
      ? 0.001 + 0.000839 * T + 0.0002261 * T2 - 0.00000845 * T3 - 0.000000081 * T * T3
      : -0.000278 + 0.000265 * T + 0.000262 * T2;
  return INT(jd1 + C1 - deltat + 0.5 + tz / 24);
}

/** Kinh độ mặt trời (radian, 0..2π) lúc 0h giờ địa phương của ngày Julius `jdn`. */
function kinhDoMatTroi(jdn: number, tz: number): number {
  const T = (jdn - 2451545.5 - tz / 24) / 36525;
  const T2 = T * T;
  const dr = PI / 180;
  const M = 357.5291 + 35999.0503 * T - 0.0001559 * T2 - 0.00000048 * T * T2;
  const L0 = 280.46645 + 36000.76983 * T + 0.0003032 * T2;
  let DL = (1.9146 - 0.004817 * T - 0.000014 * T2) * Math.sin(dr * M);
  DL += (0.019993 - 0.000101 * T) * Math.sin(dr * 2 * M) + 0.00029 * Math.sin(dr * 3 * M);
  const L = (L0 + DL) * dr;
  return L - PI * 2 * INT(L / (PI * 2));
}

/** Cung hoàng đạo 30° (0..11) — dùng để dò tháng không có Trung khí (tháng nhuận). */
const cungMatTroi = (jdn: number, tz: number) => INT((kinhDoMatTroi(jdn, tz) / PI) * 6);

/** Ngày bắt đầu tháng 11 âm lịch chứa Đông chí của năm dương `y`. */
function thang11(y: number, tz: number): number {
  const off = jdTuNgay(31, 12, y) - 2415021;
  const k = INT(off / 29.530588853);
  const nm = ngaySoc(k, tz);
  return cungMatTroi(nm, tz) >= 9 ? ngaySoc(k - 1, tz) : nm;
}

/** Vị trí tháng nhuận (tính từ tháng 11 âm) trong năm có 13 tháng. */
function viTriThangNhuan(a11: number, tz: number): number {
  const k = INT((a11 - 2415021.076998695) / 29.530588853 + 0.5);
  let i = 1;
  let cung = cungMatTroi(ngaySoc(k + i, tz), tz);
  let truoc: number;
  do {
    truoc = cung;
    i++;
    cung = cungMatTroi(ngaySoc(k + i, tz), tz);
  } while (cung !== truoc && i < 14);
  return i - 1;
}

export function duongSangAm(d: number, m: number, y: number, tz = MUI_GIO_VN): NgayAm {
  const jd = jdTuNgay(d, m, y);
  const k = INT((jd - 2415021.076998695) / 29.530588853);
  let dauThang = ngaySoc(k + 1, tz);
  if (dauThang > jd) dauThang = ngaySoc(k, tz);

  let a11 = thang11(y, tz);
  let b11 = a11;
  let nam: number;
  if (a11 >= dauThang) {
    nam = y;
    a11 = thang11(y - 1, tz);
  } else {
    nam = y + 1;
    b11 = thang11(y + 1, tz);
  }

  const ngay = jd - dauThang + 1;
  const diff = INT((dauThang - a11) / 29);
  let nhuan = false;
  let thang = diff + 11;
  if (b11 - a11 > 365) {
    const viTri = viTriThangNhuan(a11, tz);
    if (diff >= viTri) {
      thang = diff + 10;
      if (diff === viTri) nhuan = true;
    }
  }
  if (thang > 12) thang -= 12;
  if (thang >= 11 && diff < 4) nam -= 1;
  return { ngay, thang, nam, nhuan };
}

export const canChiNam = (namAm: number) => `${THIEN_CAN[(namAm + 6) % 10]} ${DIA_CHI[(namAm + 8) % 12]}`;

/** Tháng nhuận dùng chung Can Chi với tháng thường cùng số. */
export const canChiThang = (thangAm: number, namAm: number) =>
  `${THIEN_CAN[(namAm * 12 + thangAm + 3) % 10]} ${DIA_CHI[(thangAm + 1) % 12]}`;

export const canChiNgay = (jd: number) => `${THIEN_CAN[(jd + 9) % 10]} ${DIA_CHI[(jd + 1) % 12]}`;

/** Tiết khí đang hiệu lực, lấy theo kinh độ mặt trời lúc cuối ngày (giờ VN). */
export const tietKhi = (jd: number) => TIET_KHI[INT((kinhDoMatTroi(jd + 1, MUI_GIO_VN) / PI) * 12)];

/** Mặt nạ 12 giờ theo chi của ngày: Tý/Ngọ, Sửu/Mùi, Dần/Thân, Mão/Dậu, Thìn/Tuất, Tỵ/Hợi. */
const MAT_NA_GIO_HOANG_DAO = ['110100101100', '001101001011', '110011010010', '101100110100', '001011001101', '010010110011'];

export interface GioHoangDao {
  chi: (typeof DIA_CHI)[number];
  /** Giờ bắt đầu / kết thúc (0–23), giờ Tý = 23 → 1. */
  tu: number;
  den: number;
}

export function gioHoangDao(jd: number): GioHoangDao[] {
  const matNa = MAT_NA_GIO_HOANG_DAO[((jd + 1) % 12) % 6];
  const ketQua: GioHoangDao[] = [];
  for (let i = 0; i < 12; i++) {
    if (matNa[i] === '1') ketQua.push({ chi: DIA_CHI[i], tu: (i * 2 + 23) % 24, den: (i * 2 + 1) % 24 });
  }
  return ketQua;
}

/** Tuần ISO 8601: tuần bắt đầu Thứ 2, tuần 1 là tuần chứa Thứ 5 đầu tiên của năm. */
export function soTuanIso(y: number, m: number, d: number): { tuan: number; nam: number } {
  const MOT_NGAY = 86_400_000;
  const ngay = Date.UTC(y, m - 1, d);
  const thuTrongTuan = (new Date(ngay).getUTCDay() + 6) % 7; // 0 = Thứ 2
  const thu5 = ngay + (3 - thuTrongTuan) * MOT_NGAY;
  const nam = new Date(thu5).getUTCFullYear();
  const tuan = 1 + INT((thu5 - Date.UTC(nam, 0, 1)) / MOT_NGAY / 7);
  return { tuan, nam };
}
