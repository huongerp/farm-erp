/**
 * Dựng mảng 2 chiều (AOA) + vùng gộp ô cho file Excel Bảng đánh giá — thuần, nhận mô hình lưới
 * đã dựng sẵn (`dungLuoiKhoangNgay`), không tự cộng lại số. Mỗi ngày × chi nhánh một khối xếp dọc:
 * tiêu đề · dòng KSC/Tổng thu/Tuần/Ngày · 3 dòng tiêu đề cột · tổ trưởng → lô → dòng · tổng cộng.
 */
import type { DgdvKhoiNgay, DgdvLuoiNgay } from '../core/bang-tinh';
import type { TuanFarm } from '../core/types';

export interface DgdvNhanXuat {
  tieuDe: (tenChiNhanh: string) => string;
  dongThongTin: (luoi: DgdvLuoiNgay) => string;
  lo: string;
  slBuong: string;
  ghiChu: string;
  soLuong: string;
  danhGia: string;
  slLoi: string;
  lyDoLoi: string;
  tuan: (t: TuanFarm) => string;
  chuaCoTuan: string;
  tongCong: string;
  chuaCoToTruong: string;
  dutDay: (n: number) => string;
}

export interface VungGop {
  s: { r: number; c: number };
  e: { r: number; c: number };
}

export interface DgdvAoa {
  aoa: (string | number)[][];
  merges: VungGop[];
  soCot: number;
}

/** Số cột của một khối: Lô + SL buồng + 4 × số dây + Ghi chú. */
export const soCotKhoi = (luoi: Pick<DgdvLuoiNgay, 'cot'>) => 3 + luoi.cot.length * 4;

const soHoacRong = (n: number) => (n === 0 ? '' : n);

function dungKhoi(luoi: DgdvLuoiNgay, nhan: DgdvNhanXuat, r0: number, out: DgdvAoa): void {
  const n = soCotKhoi(luoi);
  const cuoi = n - 1;
  const gop = (r1: number, c1: number, r2: number, c2: number) => {
    if (r1 !== r2 || c1 !== c2) out.merges.push({ s: { r: r1, c: c1 }, e: { r: r2, c: c2 } });
  };
  const dong = (cells: (string | number)[]) => {
    const row = Array.from({ length: n }, (_, i) => cells[i] ?? '');
    out.aoa.push(row);
  };

  dong([nhan.tieuDe(luoi.ten_chi_nhanh ?? '')]);
  gop(r0, 0, r0, cuoi);
  dong([nhan.dongThongTin(luoi)]);
  gop(r0 + 1, 0, r0 + 1, cuoi);

  // 3 dòng tiêu đề
  const h = r0 + 2;
  const h1: (string | number)[] = [nhan.lo, nhan.slBuong];
  const h2: (string | number)[] = ['', ''];
  const h3: (string | number)[] = ['', ''];
  let c = 2;
  for (const g of luoi.nhomCot) {
    h1.push(g.tuanThuHoach ? nhan.tuan(g.tuanThuHoach) : nhan.chuaCoTuan, ...Array(g.cot.length * 4 - 1).fill(''));
    gop(h, c, h, c + g.cot.length * 4 - 1);
    for (const cot of g.cot) {
      h2.push(cot.nhan, '', '', '');
      gop(h + 1, c, h + 1, c + 3);
      h3.push(nhan.soLuong, nhan.danhGia, nhan.slLoi, nhan.lyDoLoi);
      c += 4;
    }
  }
  h1.push(nhan.ghiChu);
  dong(h1);
  dong(h2);
  dong(h3);
  gop(h, 0, h + 2, 0);
  gop(h, 1, h + 2, 1);
  gop(h, cuoi, h + 2, cuoi);

  for (const g of luoi.nhomToTruong) {
    dong([
      g.ten_to_truong ?? nhan.chuaCoToTruong,
      g.slBuong,
      ...luoi.cot.flatMap((cot) => [soHoacRong(g.tongTheoCot[cot.id] ?? 0), '', '', '']),
      '',
    ]);
    for (const lo of g.lo) {
      const rDau = out.aoa.length;
      const nhanLo = lo.dutDay > 0 ? `${lo.ten_lo ?? ''} (${nhan.dutDay(lo.dutDay)})` : (lo.ten_lo ?? '');
      lo.dong.forEach((d, i) => {
        dong([
          i === 0 ? nhanLo : '',
          i === 0 ? lo.slBuong : '',
          ...luoi.cot.flatMap((cot) => {
            const o = d.o[cot.id];
            return o
              ? [soHoacRong(o.so_luong), o.danh_gia ?? '', soHoacRong(o.so_luong_loi), o.ly_do_loi ?? '']
              : ['', '', '', ''];
          }),
          i === 0 ? (lo.ghi_chu ?? '') : '',
        ]);
      });
      const rCuoi = out.aoa.length - 1;
      gop(rDau, 0, rCuoi, 0);
      gop(rDau, 1, rCuoi, 1);
      gop(rDau, cuoi, rCuoi, cuoi);
    }
  }

  dong([nhan.tongCong, luoi.tongThu, ...luoi.cot.flatMap((cot) => [luoi.tongTheoCot[cot.id] ?? 0, '', '', '']), '']);
}

/** Toàn bộ khoảng ngày → một sheet; ngày chưa có phiếu bị bỏ qua. Giữa hai khối cách một dòng trống. */
export function taoAoaLuoi(dsKhoi: DgdvKhoiNgay[], nhan: DgdvNhanXuat): DgdvAoa {
  const out: DgdvAoa = { aoa: [], merges: [], soCot: 1 };
  for (const khoi of dsKhoi) {
    for (const luoi of khoi.luoi) {
      if (out.aoa.length > 0) out.aoa.push([]);
      dungKhoi(luoi, nhan, out.aoa.length, out);
      out.soCot = Math.max(out.soCot, soCotKhoi(luoi));
    }
  }
  return out;
}
