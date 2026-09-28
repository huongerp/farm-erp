/** Một dòng từ RPC `rpc_sinh_nhat_nhan_vien` — chỉ có ngày/tháng, không có năm sinh. */
export interface SinhNhatNhanVien {
  id: string;
  ho_ten: string;
  anh_dai_dien: string | null;
  ngay: number;
  thang: number;
}

export interface SinhNhatTrongNgay extends SinhNhatNhanVien {
  /** Ngày dương rơi vào sinh nhật trong khoảng đang xét, dạng YYYY-MM-DD. */
  ngayDuong: string;
}

const pad = (n: number) => String(n).padStart(2, '0');
const laNamNhuan = (y: number) => (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0;

/**
 * Sinh nhật rơi vào [tu, den] (YYYY-MM-DD, tính cả hai đầu), sắp theo ngày rồi tên.
 * Khoảng được phép vắt năm (28/12 → 03/01). Người sinh 29/02 ở năm không nhuận
 * được tính vào 28/02.
 */
export function sinhNhatTrongKhoang(ds: SinhNhatNhanVien[], tu: string, den: string): SinhNhatTrongNgay[] {
  const theoNgayThang = new Map<string, SinhNhatNhanVien[]>();
  for (const nv of ds) {
    const khoa = `${nv.thang}-${nv.ngay}`;
    const nhom = theoNgayThang.get(khoa);
    if (nhom) nhom.push(nv);
    else theoNgayThang.set(khoa, [nv]);
  }

  const ketQua: SinhNhatTrongNgay[] = [];
  const [y1, m1, d1] = tu.split('-').map(Number);
  const [y2, m2, d2] = den.split('-').map(Number);
  const cuoi = Date.UTC(y2, m2 - 1, d2);
  for (let t = Date.UTC(y1, m1 - 1, d1); t <= cuoi; t += 86_400_000) {
    const ngay = new Date(t);
    const y = ngay.getUTCFullYear();
    const m = ngay.getUTCMonth() + 1;
    const d = ngay.getUTCDate();
    const khop = [...(theoNgayThang.get(`${m}-${d}`) ?? [])];
    if (m === 2 && d === 28 && !laNamNhuan(y)) khop.push(...(theoNgayThang.get('2-29') ?? []));
    khop.sort((a, b) => a.ho_ten.localeCompare(b.ho_ten, 'vi'));
    const ngayDuong = `${y}-${pad(m)}-${pad(d)}`;
    for (const nv of khop) ketQua.push({ ...nv, ngayDuong });
  }
  return ketQua;
}
