/**
 * Sinh dữ liệu mock Đề xuất chi phí theo thời gian hiện tại.
 * Tháng hiện tại luôn có đủ bản ghi để lọc "Tháng này" có dữ liệu.
 */
import type { DeXuatChiPhi, DeXuatChiPhiChiTiet } from '../features/tai-chinh/de-xuat-chi-phi/core/types';

const pad = (n: number) => String(n).padStart(2, '0');
const toDateStr = (y: number, m: number, d: number) => `${y}-${pad(m)}-${pad(d)}`;

function lastDayOfMonth(y: number, m: number): number {
  return new Date(y, m, 0).getDate();
}

const PEOPLE = [
  { id: 'emp-010', name: 'Trịnh Thị Ngọc' },
  { id: 'emp-011', name: 'Lý Văn Phú' },
  { id: 'emp-012', name: 'Đinh Công Vinh' },
  { id: 'emp-015', name: 'Cao Văn Long' },
  { id: 'emp-001', name: 'Nguyễn Văn A' },
] as const;

const ACCOUNTS = [
  { id: 'tk-1', name: 'Quỹ tiền mặt' },
  { id: 'tk-2', name: 'Vietcombank - Công ty' },
  { id: 'tk-3', name: 'Techcombank - Công ty' },
] as const;

const CHI_TIET_THU = [
  { id_danh_muc: 'dm-thu-1a', ten_danh_muc: 'Doanh thu bán lẻ', so_tien: 85000000 },
  { id_danh_muc: 'dm-thu-1b', ten_danh_muc: 'Doanh thu bán buôn', so_tien: 120000000 },
  { id_danh_muc: 'dm-thu-2', ten_danh_muc: 'Doanh thu dịch vụ', so_tien: 32000000 },
  { id_danh_muc: 'dm-thu-3', ten_danh_muc: 'Thu nhập khác', so_tien: 12000000 },
  { id_danh_muc: 'dm-thu-4', ten_danh_muc: 'Thu nợ khách hàng', so_tien: 95000000 },
] as const;

const CHI_TIET_CHI = [
  { id_danh_muc: 'dm-chi-1a', ten_danh_muc: 'Chi mua nguyên vật liệu', so_tien: 45000000 },
  { id_danh_muc: 'dm-chi-1', ten_danh_muc: 'Chi mua hàng', so_tien: 45000000 },
  { id_danh_muc: 'dm-chi-2', ten_danh_muc: 'Chi lương nhân viên', so_tien: 118000000 },
  { id_danh_muc: 'dm-chi-3', ten_danh_muc: 'Chi phí văn phòng', so_tien: 12000000 },
  { id_danh_muc: 'dm-chi-4', ten_danh_muc: 'Chi tiền thuê mặt bằng', so_tien: 35000000 },
  { id_danh_muc: 'dm-chi-5', ten_danh_muc: 'Chi phí Marketing', so_tien: 28000000 },
  { id_danh_muc: 'dm-chi-6', ten_danh_muc: 'Chi phí vận chuyển', so_tien: 15000000 },
  { id_danh_muc: 'dm-chi-8', ten_danh_muc: 'Chi phí khác', so_tien: 8500000 },
  { id_danh_muc: 'dm-chi-9', ten_danh_muc: 'Trả nợ nhà cung cấp', so_tien: 75000000 },
] as const;

export function generateMockDeXuatChiPhi(): DeXuatChiPhi[] {
  const now = new Date();
  const y = now.getFullYear();
  const m = now.getMonth() + 1;
  const dayToday = now.getDate();
  const lastYear = y - 1;
  const list: DeXuatChiPhi[] = [];
  let globalId = 1;

  const seqByYear: Record<number, number> = {};
  const nextSeq = (year: number) => {
    seqByYear[year] = (seqByYear[year] ?? 0) + 1;
    return seqByYear[year];
  };

  function add(
    ngay: string,
    loai: 'thu' | 'chi',
    year: number,
    month: number,
    day: number,
    trangThai: 0 | 1 | 2,
    twoLines = false
  ): void {
    const soPhieu = `DXCP-${year}-${String(nextSeq(year)).padStart(3, '0')}`;
    const id = `dxcp-${globalId}`;
    const person = PEOPLE[globalId % PEOPLE.length];
    const acc = ACCOUNTS[globalId % ACCOUNTS.length];
    const ctList = loai === 'thu' ? CHI_TIET_THU : CHI_TIET_CHI;
    const ct = ctList[globalId % ctList.length];
    const chiTiet: DeXuatChiPhiChiTiet[] = [
      {
        id: `${id}-1`,
        id_de_xuat_chi_phi: id,
        id_danh_muc: ct.id_danh_muc,
        ten_danh_muc: ct.ten_danh_muc,
        so_tien: ct.so_tien,
        noi_dung: loai === 'thu' ? 'Thu dự kiến' : 'Chi đề xuất',
      },
    ];
    if (twoLines && loai === 'chi') {
      const ct2 = CHI_TIET_CHI[(globalId + 1) % CHI_TIET_CHI.length];
      chiTiet.push({
        id: `${id}-2`,
        id_de_xuat_chi_phi: id,
        id_danh_muc: ct2.id_danh_muc,
        ten_danh_muc: ct2.ten_danh_muc,
        so_tien: Math.floor(ct2.so_tien * 0.3),
        noi_dung: 'Dòng 2',
      });
    }
    const ngayDuyet =
      trangThai !== 0
        ? `${toDateStr(year, month, Math.min(day + 1, lastDayOfMonth(year, month)))}T10:00:00.000Z`
        : undefined;
    const nguoiDuyet = trangThai !== 0 ? PEOPLE[0] : undefined;
    list.push({
      id,
      so_phieu: soPhieu,
      ngay,
      loai,
      id_tai_khoan: acc.id,
      ten_tai_khoan: acc.name,
      id_nguoi_de_xuat: person.id,
      ten_nguoi_de_xuat: person.name,
      trang_thai: trangThai,
      id_nguoi_duyet: nguoiDuyet?.id ?? null,
      ten_nguoi_duyet: nguoiDuyet?.name ?? null,
      ngay_duyet: ngayDuyet ?? null,
      ghi_chu_duyet: trangThai === 1 ? 'Đã duyệt' : null,
      ly_do_tu_choi: trangThai === 2 ? 'Không đủ hạn mức' : null,
      ghi_chu: null,
      tg_tao: `${ngay}T08:00:00.000Z`,
      tg_cap_nhat: ngayDuyet ?? `${ngay}T08:00:00.000Z`,
      chi_tiet: chiTiet,
    });
    globalId++;
  }

  // --- Năm ngoái: rải vài tháng ---
  for (const month of [1, 2, 6, 9]) {
    for (let d = 1; d <= 3; d++) {
      const day = 5 + d * 5;
      if (day > lastDayOfMonth(lastYear, month)) continue;
      const ngay = toDateStr(lastYear, month, day);
      add(ngay, d % 2 === 0 ? 'thu' : 'chi', lastYear, month, day, d === 2 ? 0 : 1, false);
    }
  }

  // --- Năm nay, các tháng trước tháng hiện tại ---
  for (let month = 1; month < m; month++) {
    const days = [2, 8, 15, 22].filter((d) => d <= lastDayOfMonth(y, month));
    days.forEach((day, i) => {
      const ngay = toDateStr(y, month, day);
      const trangThai: 0 | 1 | 2 = i === 1 ? 0 : i === 2 ? 2 : 1;
      add(ngay, (month + day) % 2 === 0 ? 'thu' : 'chi', y, month, day, trangThai, day === 15);
    });
  }

  // --- Tháng hiện tại: luôn có đủ bản ghi (từ ngày 1 đến hôm nay hoặc cuối tháng) ---
  const maxDay = Math.min(dayToday, lastDayOfMonth(y, m));
  const soBanGhiThangHienTai = Math.max(10, Math.min(maxDay + 2, 20));
  const step = maxDay <= soBanGhiThangHienTai ? 1 : Math.floor(maxDay / soBanGhiThangHienTai);
  for (let i = 0; i < soBanGhiThangHienTai; i++) {
    const day = Math.min(1 + i * (step || 1), maxDay);
    if (day < 1) continue;
    const ngay = toDateStr(y, m, day);
    const trangThai: 0 | 1 | 2 = i % 4 === 1 ? 0 : i % 4 === 2 ? 2 : 1;
    add(ngay, (m + day + i) % 2 === 0 ? 'thu' : 'chi', y, m, day, trangThai, i % 3 === 0);
  }

  return list;
}
