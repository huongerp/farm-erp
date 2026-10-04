/**
 * Đọc số tiền (VND, phần nguyên) thành chữ tiếng Việt cho phiếu in:
 * 1_250_000 → "Một triệu hai trăm năm mươi nghìn đồng".
 */
const CHU_SO = ['không', 'một', 'hai', 'ba', 'bốn', 'năm', 'sáu', 'bảy', 'tám', 'chín'];
const DON_VI = ['', 'nghìn', 'triệu'];
const MOT_TY = 1_000_000_000;

/** Đọc nhóm 3 chữ số. `docDayDu` = có nhóm lớn hơn đứng trước → đọc cả "không trăm", "linh". */
function docBaSo(n: number, docDayDu: boolean): string {
  const tram = Math.floor(n / 100);
  const chuc = Math.floor((n % 100) / 10);
  const dv = n % 10;
  const ra: string[] = [];

  if (tram > 0 || docDayDu) ra.push(CHU_SO[tram], 'trăm');

  if (chuc === 0) {
    if (dv > 0 && (tram > 0 || docDayDu)) ra.push('linh');
  } else if (chuc === 1) {
    ra.push('mười');
  } else {
    ra.push(CHU_SO[chuc], 'mươi');
  }

  if (dv > 0) {
    if (dv === 1 && chuc >= 2) ra.push('mốt');
    else if (dv === 5 && chuc >= 1) ra.push('lăm');
    else if (dv === 4 && chuc >= 2) ra.push('tư');
    else ra.push(CHU_SO[dv]);
  }
  return ra.join(' ');
}

/** Đọc số < 1 tỷ theo nhóm triệu / nghìn / đơn vị. `coPhiaTruoc` = đã có phần "… tỷ" đứng trước. */
function docDuoiMotTy(n: number, coPhiaTruoc: boolean): string[] {
  const nhom = [Math.floor(n / 1_000_000), Math.floor((n % 1_000_000) / 1000), n % 1000];
  const ra: string[] = [];
  nhom.forEach((g, i) => {
    if (g === 0) return;
    ra.push(docBaSo(g, coPhiaTruoc || ra.length > 0));
    const bac = DON_VI[2 - i];
    if (bac) ra.push(bac);
  });
  return ra;
}

/** Đọc số nguyên không âm; phần từ hàng tỷ trở lên đọc đệ quy rồi thêm "tỷ" (1000 tỷ = "một nghìn tỷ"). */
function docSoNguyen(n: number): string {
  if (n === 0) return CHU_SO[0];
  if (n < MOT_TY) return docDuoiMotTy(n, false).join(' ');
  const phanTy = Math.floor(n / MOT_TY);
  const con = n % MOT_TY;
  return [docSoNguyen(phanTy), 'tỷ', ...docDuoiMotTy(con, true)].join(' ');
}

export function soTienBangChu(soTien: number): string {
  if (!Number.isFinite(soTien)) return '';
  const am = soTien < 0;
  const chu = docSoNguyen(Math.round(Math.abs(soTien)));
  const cau = `${am ? 'âm ' : ''}${chu} đồng`;
  return cau.charAt(0).toUpperCase() + cau.slice(1);
}
